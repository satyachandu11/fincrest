import { sendEmail } from "@/actions/send-email";
import { db } from "../prisma";
import { inngest } from "./client";
import EmailTemplate from "@/emails/template";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const checkBudgetAlert = inngest.createFunction(
  { 
    id: "check-budget-alerts",
    name: "Check Budget Alerts",
  },
  {
    cron: "0 */6 * * *", // Every 6 hours
    tz: "Asia/Kolkata",   // Timezone set to IST
  },
  async ({ step }: { step: any }) => {
    const budgets = await step.run("Fetch Budget", async () => {
      return await db.budget.findMany({
        include: {
          user: {
            include: {
              accounts: {
                where: {
                  isDefault: true, // Only check default accounts
                }
              }
            }
          }
        }
      });
    });
    
    for (const budget of budgets) {
        const defaultAccount = budget.user.accounts[0];
        if (!defaultAccount) continue; // Skip if no default account

        await step.run(`check-budget-${budget.id}`, async () => {
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
                    userId: budget.userId,
                    accountId: defaultAccount.id,
                    type: "EXPENSE",
                    date: {
                        gte: startOfMonth,
                        lte: endOfMonth,
                    }
                },
                _sum: {
                    amount: true,
                }
            });

            const totalExpenses = expenses._sum.amount?.toNumber() || 0;
            const budgetAmount = budget.amount;
            const percentageUsed = (totalExpenses / budgetAmount) * 100;

            if (percentageUsed >= 80 && (!budget.lastAlertSent || isNewMonth(new Date(budget.lastAlertSent), new Date()))) {
                console.log("percentageUsed: ", percentageUsed, " for budget: ", budget.id, " with amount: ", budgetAmount);

                // Send Email Alert
                await sendEmail({
                    to: budget.user.email,
                    subject: "Budget Alert: You're Almost There",
                    react: EmailTemplate({
                        userName: budget.user.name || "User",
                        type: "budget-alert",
                        data: {
                            percentageUsed,
                            budgetAmount: Number(budgetAmount.toFixed(1)),
                            totalExpenses: Number(totalExpenses.toFixed(1)),
                            accountName: defaultAccount.name,
                        }
                    })
                });
                console.log(`Budget alert email sent to ${budget.user.email} for budget ID ${budget.id}`);

                // Update lastAlertSent date
                await db.budget.update({
                    where: { id: budget.id },
                    data: {
                        lastAlertSent: new Date(),
                    }
                });
            }
        })
    }
  }
);

function isNewMonth(lastAlertDate: Date, currentDate: Date): boolean {
    return lastAlertDate.getMonth() !== currentDate.getMonth() || lastAlertDate.getFullYear() !== currentDate.getFullYear();
}

export const triggerRecurringTransactions = inngest.createFunction({
  id: "trigger-recurring-transactions",
  name: "Trigger Recurring Transactions",
}, {
  cron: "0 0 * * *",
  tz: "Asia/Kolkata", // Timezone set to IST
}, async ({ step }) => {
  // 1. Fetch all due recurring transactions
  const recurringTransactions = await step.run("Fetch Recurring Transactions", async () => {
    return await db.transaction.findMany({
      where: {
        isRecurring: true,
        status: "COMPLETED",
        OR: [
          { lastProcessed: null }, // Never Processed
          { nextRecurringDate: { lte: new Date() } }, // Due for processing
        ],
      },
    });
  });

  // 2. Create events for each recurring transaction
  if(recurringTransactions.length > 0) {
    const events = recurringTransactions.map((transaction: any) => ({
      name: "transaction.recurring.process",
      data: {
        transactionId: transaction.id,
        userId: transaction.userId,
      }
    }));

    // 3. Send events to be processed
    await inngest.send(events);

    return { triggered: recurringTransactions.length };
  }
})

export const processRecurringTransaction = inngest.createFunction({
  id: "process-recurring-transaction",
  name: "Process Recurring Transaction",
  throttle: {
    limit: 10, // Limit to 10 concurrent executions
    period: "1m", // Per minute
    key: "event.data.userId", // Throttle by user ID
  }
},
{ event: "transaction.recurring.process" },
async ({ event, step }) => {
  if(!event?.data?.transactionId || !event.data?.userId) {
    console.error("Invalid event data", event);
    return { error: "Missing required event data" };
  }

  await step.run("Process Recurring Transaction", async () => {
    const transaction = await db.transaction.findUnique({
      where: {
        id: event.data.transactionId,
        userId: event.data.userId,
      },
      include: {
        account: true,
      }
    })

    if(!transaction || !isTransactionDue(transaction)) return;

    await db.$transaction(async (tx: any) => {
      // Create new transaction
      await tx.transaction.create({
        data: {
          type: transaction.type,
          amount: transaction.amount,
          description: `${transaction.description} (Recurring)`,
          date: new Date(),
          category: transaction.category,
          userId: transaction.userId,
          accountId: transaction.accountId,
          isRecurring: false,
        }
      });

      // Update account balance
      const balanceChange = 
        transaction.type === "EXPENSE"
          ? -transaction.amount.toNumber()
          : transaction.amount.toNumber();

      await tx.account.update({
        where: { id: transaction.accountId },
        data: { balance: { increment: balanceChange } }
      });

      // Update last processed date and next recurring date
      await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          lastProcessed: new Date(),
          nextRecurringDate: calculateNextRecurringDate(
            new Date,
            transaction.recurringInterval
          )
        }
      })
    })
  })
}
);

function isTransactionDue(transaction: any) {
  // If no lastProcessed date, it's due
  if(!transaction.lastProcessed) return true;

  const today = new Date();
  const nextDue = new Date(transaction.nextRecurringDate);

  // Compare with mextDue date
  return nextDue <= today;
}

// Helper function to calculate next recurring date
function calculateNextRecurringDate(startDate :any, interval :any ) {
    const date = new Date(startDate);
    switch (interval) {
        case 'DAILY':
            date.setDate(date.getDate() + 1);
            break;
        case 'WEEKLY':
            date.setDate(date.getDate() + 7);
            break;
        case 'MONTHLY':
            date.setMonth(date.getMonth() + 1);
            break;
        case 'YEARLY':
            date.setFullYear(date.getFullYear() + 1);
            break;
        default:
            throw new Error('Invalid recurring interval');
    }
    return date;
}

export const generateMonthlyReports = inngest.createFunction({
  id: "generate-monthly-reports",
  name: "Generate Monthly Reports",
},
{ cron: "0 0 1 * *" }, async ({ step }) => {
  const users = await step.run("fetch-users", async () => {
    return await db.user.findMany({
      include: { accounts: true },
    })
  })

  for(const user of users){
    await step.run(`generate-report-${user.id}`, async () => {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      const stats = await getMonthlyStats(user.id, lastMonth);
      const monthName = lastMonth.toLocaleString("default", {
        month: "long",
      });

      const insights = await generateFinancialInsights(stats, monthName);

      // Send Email Alert
      await sendEmail({
        to: user.email,
        subject: `Your Monthly Financial Report - ${monthName}`,
        react: EmailTemplate({
          userName: user.name || "User",
          type: "monthly-report",
          data: {
            stats,
            month: monthName,
            insights,
          }
        })
      });
    });
  }

  return { processed: users.length };
}
);

async function generateFinancialInsights(stats: any, month: any) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey){
    const genAi = new GoogleGenerativeAI(apiKey);
    const model = genAi.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `
      Analyze this financial data and provide 3 concise, actionable insights.
      Focus on spending patterns and practical advice.
      Keep it friendly and conversational.
  
      Financial Data for ${month}:
      - Total Income: ₹${stats.totalIncome}
      - Total Expenses: ₹${stats.totalExpenses}
      - Net Income: ₹${stats.totalIncome - stats.totalExpenses}
      - Expense Categories: ${Object.entries(stats.byCategory)
        .map(([category, amount]) => `${category}: ₹${amount}`)
        .join(", ")}
  
      Format the response as a JSON array of strings, like this:
      ["insight 1", "insight 2", "insight 3"]
    `;
  
    try {
      const result = await model.generateContent(prompt);
  
      const response = await result.response;
      const text = response.text();
      const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();
  
      return JSON.parse(cleanedText);
    } catch (error) {
      console.error("Error generating insights: ", error);
      return [
        "Your highest expense category this month might need attention.",
        "Consider setting up a budget for better financial management.",
        "Track your recurring expenses to identify potential savings.",
      ]
    }
  }

}


const getMonthlyStats = async (userId: any, month: any) => {
  const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
  const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  const transactions = await db.transaction.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  return transactions.reduce(
    (stats: any, t:any) => {
      const amount = t.amount.toNumber();
      if (t.type == "EXPENSE") {
        stats.totalExpenses += amount;
        stats.byCategory[t.category] = (stats.byCategory[t.category] || 0) + amount;
      } else {
        stats.totalIncome += amount;
      }
      return stats;
    },
    {
      totalExpenses: 0,
      totalIncome: 0,
      byCategory: {},
      transactionCount: transactions.length,
    }
  )
};