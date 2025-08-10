"use client"

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import React, { useState } from 'react'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer } from 'recharts';

const COLORS = [
    '#8884d8',
    '#82ca9d',
    '#ffc658',
    '#ff8042',
    '#00C49F',
    '#FFBB28',
    '#FF8042',
]

const DashboardOverview = ({ accounts, transactions }: any) => {

    const [selectedAccountId, setSelectedAccountId] = useState(
        accounts.find((a: any) => a.isDefault)?.id || accounts[0]?.id
    )

    // Filter Transactions for selected account
    const accountTransactions = transactions.filter(
        (transaction: any) => transaction.accountId === selectedAccountId
    );

    const recentTransactions = accountTransactions.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

    // Calculate expense breakdown for current month
    const currentDate = new Date();
    const currentMonthExpenses = accountTransactions.filter((transaction: any) => {
        const transactionDate =new Date(transaction.date);
        return(
            transaction.type === 'EXPENSE' &&
            transactionDate.getMonth() === currentDate.getMonth() &&
            transactionDate.getFullYear() === currentDate.getFullYear()
        )
    });

    // Group expenses by category
    const expenseByCategory = currentMonthExpenses.reduce((acc: any, transaction: any) => {
        const category = transaction.category || 'Uncategorized';
        if (!acc[category]) {
            acc[category] = 0;
        }
        acc[category] += transaction.amount;
        return acc;
    }, {});

    // Format data for pie chart
    const pieChartData = Object.entries(expenseByCategory).map(
        ([category, amount]) => ({
            name: category,
            value: amount,
        })
    )

    console.log('pieChartData: ', pieChartData);

    return (
        <div className='grid gap-4 md:grid-cols-2'>
            <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
                    <CardTitle className='text-base font-normal'>Recent Transactions (Latest 5)</CardTitle>
                    <Select
                        value={selectedAccountId}
                        onValueChange={setSelectedAccountId}
                    >
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Select Account" />
                        </SelectTrigger>
                        <SelectContent>
                            {accounts.map((account: any) => (
                                <SelectItem
                                    key={account.id}
                                    value={account.id}
                                >
                                    {account.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardHeader>
                <CardContent>
                    <div className='space-y-4'>
                        {recentTransactions.length === 0 ? (
                            <p className='text-center text-muted-foreground py-4'>
                                No Recent Transaction
                            </p>) : (
                                recentTransactions.map((transaction: any) => (
                                    <div
                                        key={transaction.id}
                                        className='flex items-center justify-between'
                                    >
                                        <div className='space-y-1'>
                                            <p className='text-sm font-medium leading-none'>
                                                {transaction.description || "Untitled Transaction"}
                                            </p>
                                            <p className='text-sm text-muted-foreground'>
                                                {format(new Date(transaction.date), "PP")}
                                            </p>
                                        </div>
                                        <div className='flex items-center gap-2'>
                                            <div className={cn("flex items-center", transaction.type === "EXPENSE"
                                                ? "text-red-500"
                                                : "text-green-500")}>
                                                {transaction.type === "EXPENSE" ? (<ArrowDownRight className='mr-1 h-4 w-4'/>) : (<ArrowUpRight className='mr-1 h-4 w-4'/>)}
                                                ₹{transaction.amount.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )
                        }
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className='text-base font-normal'>
                        Monthly Expense Breakdown
                    </CardTitle>
                </CardHeader>
                <CardContent className='p-0 pb-5 py-4'>
                    {pieChartData.length === 0 ? (
                        <p className='text-center text-muted-foreground py-4'>
                            No Expenses for this month
                        </p>
                    ) : (
                        <div className='text-center text-sm text-muted-foreground py-2 h-[300px]'>
                                <ResponsiveContainer width='100%' height='100%'>
                                    <PieChart>
                                        <Pie
                                            data={pieChartData}
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            dataKey={"value"}
                                            fill='#8884d8'
                                            label={({ name, value }) => `${name}: ₹${value.toFixed(2)}`}>
                                            {
                                                pieChartData.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={COLORS[index % COLORS.length]} />
                                                ))
                                            }
                                        </Pie>
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                        </div>
                    )}
                    
                </CardContent>
            </Card>
        </div>
    )
}

export default DashboardOverview;