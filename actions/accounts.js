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

export async function editAccountDetails(accountId, data) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const user = await db.user.findUnique({
            where: { clerkUserId: userId }
        })

        if (!user) {
            throw new Error('User not found');
        }

        // Validate the account exists and belongs to the user
        const existingAccount = await db.account.findUnique({
            where: { 
                id: accountId, 
                userId: user.id 
            }
        });

        if (!existingAccount) {
            throw new Error('Account not found');
        }

        // Validate balance if provided
        let balanceFloat = existingAccount.balance;
        if (data.balance !== undefined) {
            balanceFloat = parseFloat(data.balance);
            if (isNaN(balanceFloat)) {
                throw new Error('Invalid balance amount');
            }
        }

        // Update the account
        const updatedAccount = await db.account.update({
            where: { 
                id: accountId, 
                userId: user.id 
            },
            data: {
                name: data.name || existingAccount.name,
                type: data.type || existingAccount.type,
                balance: balanceFloat,
            }
        });

        const serializedAccount = serializeTransaction(updatedAccount);
        revalidatePath('/dashboard');
        revalidatePath('/dashboard/[id]');

        return { success: true, data: serializedAccount };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function deleteAccount(accountId) {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const user = await db.user.findUnique({
            where: { clerkUserId: userId }
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Check if account exists and belongs to the user
        const existingAccount = await db.account.findUnique({
            where: { 
                id: accountId, 
                userId: user.id 
            }
        });

        if (!existingAccount) {
            throw new Error('Account not found');
        }

        // Check if this is the default account
        if (existingAccount.isDefault) {
            throw new Error('Cannot delete default account. Please set another account as default first.');
        }

        // Check if account has transactions
        const transactionCount = await db.transaction.count({
            where: { 
                accountId: accountId, 
                userId: user.id 
            }
        });

        // Delete account and all its transactions in a transaction
        await db.$transaction(async (prisma) => {
            // Delete all transactions for this account
            if (transactionCount > 0) {
                await prisma.transaction.deleteMany({
                    where: { 
                        accountId: accountId, 
                        userId: user.id 
                    }
                });
            }

            // Delete the account
            await prisma.account.delete({
                where: { 
                    id: accountId, 
                    userId: user.id 
                }
            });
        });

        revalidatePath('/dashboard');
        revalidatePath('/dashboard/[id]');

        const message = transactionCount > 0 
            ? `Account and ${transactionCount} transaction(s) deleted successfully`
            : 'Account deleted successfully';

        return { success: true, message };
    } catch (error) {
        return { success: false, error: error.message };
    }
}