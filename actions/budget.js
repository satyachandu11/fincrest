"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from "next/cache";
import { type } from "os";
import { getDashboardData, getUserAccounts } from "./dashboard";

const genAi = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


export async function getCurrentBudget(accountId) {

    try {
        const { userId } = await auth();
        if (!userId) {
            throw new Error("User not authenticated");
        }

        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
        })

        if( !user) {
            throw new Error("User not found");
        }

        const budget = await db.budget.findFirst({
            where: {
                userId: user.id,
            }
        });

        const currentDate = new Date();
        const startOfMonth = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            1
        );

        const endOfMonth = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() + 1,
            0
        );

        const expenses = await db.transaction.aggregate({
            where: {
                userId: user.id,
                type: "EXPENSE",
                date: {
                    gte: startOfMonth,
                    lte: endOfMonth,
                },
                accountId,
            },
            _sum: {
                amount: true,
            },
        });

        return {
            budget: budget ? { ...budget, amount: budget.amount } : null,
            currentExpenses: expenses._sum.amount ? expenses._sum.amount.toNumber() : 0,
        }
    } catch (error) {
        console.error("Error fetching budget:", error);
        throw new Error("Failed to fetch current budget");
    }
}

export async function updateBudget(amount) {
    try {
        const { userId } = await auth();
        if (!userId) {
            throw new Error("User not authenticated");
        }

        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
        })

        if( !user) {
            throw new Error("User not found");
        }

        const existingBudget = await db.budget.findFirst({
            where: { userId: user.id }
        });

        let budget;
        if (existingBudget) {
          budget = await db.budget.update({
            where: { id: existingBudget.id },
            data: { amount },
          });
        } else {
          budget = await db.budget.create({
            data: { userId: user.id, amount },
          });
        }

        revalidatePath("/dashboard");
        return {
            success: true,
            data: {
                ...budget,
                amount: budget.amount.toNumber(),
            },
        };
    } catch (error) {
        console.error("Error updating budget:", error);
        return {
            success: false,
            error: error.message || "Failed to update budget",
        }
        
    }
}

export async function generateBudgetSummary(accountId) {
    try {
        const { userId } = await auth();
        if (!userId) {
            throw new Error("User not authenticated");
        }

        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
        });

        if (!user) {
            throw new Error("User not found");
        }

        // Check if we already have a summary for today
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today

        const existingSummary = await db.budgetSummary.findFirst({
            where: {
                userId: user.id,
                createdAt: {
                    gte: today
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // If we have a summary from today, return it
        if (existingSummary) {
            return {
                success: true,
                summary: existingSummary.summary,
            };
        }

        const budget = await getCurrentBudget(accountId);

        const userAccounts = await getUserAccounts();

        const totalTransactions = await getDashboardData();
        

        if (!budget) {
            throw new Error("No budget found for this account");
        }

        const model = genAi.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Calculate key financial metrics
        const totalBudget = budget.budget ? budget.budget.amount : 0;
        const totalExpenses = budget.currentExpenses;
        const remainingBalance = totalBudget - totalExpenses;
        const spendingPercentage = totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0;
        
        // Get account summary
        const totalAccounts = userAccounts.length;
        const totalAccountBalance = userAccounts.reduce((sum, account) => sum + account.balance, 0);
        const totalTransactionCount = totalTransactions.length;
        
        // Get recent transaction insights (last 5 transactions)
        const recentTransactions = totalTransactions.slice(0, 5);
        const recentExpenses = recentTransactions
            .filter(t => t.type === 'EXPENSE')
            .reduce((sum, t) => sum + t.amount, 0);
        const recentIncome = recentTransactions
            .filter(t => t.type === 'INCOME')
            .reduce((sum, t) => sum + t.amount, 0);

        const summaryPrompt = `
            Create a concise, single-paragraph financial summary (60-80 words) based on this data:

            BUDGET: ₹${totalBudget} budget, ₹${totalExpenses} spent, ₹${remainingBalance} remaining (${spendingPercentage.toFixed(1)}% used)
            ACCOUNTS: ${totalAccounts} accounts, ₹${totalAccountBalance} total balance, ${totalTransactionCount} transactions
            RECENT: ₹${recentIncome} income, ₹${recentExpenses} expenses (last 5 transactions)

            Write a brief, encouraging summary in one paragraph that mentions key metrics and gives 1-2 quick actionable tips. Keep it simple and positive.
        `;

        const result = await model.generateContent(summaryPrompt);

        const response = await result.response;
        const text = response.text();
        const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

        // Save the generated summary to database
        await db.budgetSummary.create({
            data: {
                userId: user.id,
                summary: cleanedText,
            }
        });

        return {
            success: true,
            summary: cleanedText,
        };
    } catch (error) {
        console.error("Error generating budget summary:", error);
        return {
            success: false,
            error: error.message || "Failed to generate budget summary",
        };
    }
}