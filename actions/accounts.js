"use server"

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { use } from "react";


const serializeTransaction = (obj) => {
    const serialized = { ...obj };

    if (obj.balance) {
        serialized.balance = obj.balance.toNumber();
    }

    if (obj.amount) {
        serialized.amount = obj.amount.toNumber();
    }

    return serialized;
}

export async function updateDefaultAccount(accountId) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const user = await db.user.findUnique({
            where: { clerkUserId: userId }
        })

        if (!user) {
            throw new Error('User not found');
        }

        // Unset other default accounts
        await db.account.updateMany({
            where: { userId: user.id, isDefault: true },
            data: { isDefault: false }
        })

        // Set the selected account as default
        const account = await db.account.update({
            where: { id: accountId, userId: user.id },
            data: { isDefault: true }
        });

        const serializedAccount = serializeTransaction(account);
        revalidatePath('/dashboard');

        return { success: true, data: serializedAccount };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function getAccountWithTransactions(accountId, page = 1, pageSize = 10) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
        where: { clerkUserId: userId }
    })

    if (!user) {
        throw new Error('User not found');
    }

    const skip = (page - 1) * pageSize;

    const [account, total] = await Promise.all([
        db.account.findUnique({
            where: {id: accountId, userId: user.id},
            include: {
                transactions: {
                    orderBy: { date: 'desc' },
                    skip,
                    take: pageSize,
                },
                _count: {
                    select: {
                        transactions: true
                    }
                }
            }
        }),
        db.transaction.count({
            where: { accountId, userId: user.id }
        })
    ]);

    if(!account) return null;

    return {
        ...serializeTransaction(account),
        transactions: account.transactions.map(serializeTransaction),
        totalTransactions: total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
    }
}

export async function bulkDeleteTransactions(transactionIds) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const user = await db.user.findUnique({
            where: { clerkUserId: userId }
        })

        if (!user) {
            throw new Error('User not found');
        }

        const transactions = await db.transaction.findMany({
            where: {
                id: { in: transactionIds },
                userId: user.id
            }
        });

        const accountBalanceChanges = transactions.reduce((acc, transaction) => {
            const change = transaction.type === 'EXPENSE' ? transaction.amount : -transaction.amount;

            acc[transaction.accountId] = (acc[transaction.accountId] || 0) + change;
            return acc;
        }, {});

        // Delete transactions and update account balances in a transaction
        await db.$transaction(async (prisma) => {
            await prisma.transaction.deleteMany({
                where: {
                    id: { in: transactionIds },
                    userId: user.id
                }
            });

            for (const [accountId, change] of Object.entries(accountBalanceChanges)) {
                await prisma.account.update({
                    where: { id: accountId, userId: user.id },
                    data: {
                        balance: {
                            increment: change
                        }
                    }
                });
            }
        });

        revalidatePath('/dashboard');
        revalidatePath('/dashboard/[id]');

        return { success: true, data: transactions.map(serializeTransaction) };
    } catch (error) {
        return { success: false, error: error.message };
    }
}