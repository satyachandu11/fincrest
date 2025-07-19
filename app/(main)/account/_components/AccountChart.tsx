"use client"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { endOfDay, format, startOfDay, subDays } from 'date-fns';
import React, { use, useMemo, useState } from 'react'
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    Rectangle
} from 'recharts';


type DateRangeKey = '7D' | '1M' | '3M' | '6M' | 'ALL';

const DATE_RANGES: Record<DateRangeKey, { label: string; days: number | null }> = {
    '7D': { label: 'Last 7 Days', days: 7 },
    '1M': { label: 'Last 1 Month', days: 30 },
    '3M': { label: 'Last 3 Months', days: 90 },
    '6M': { label: 'Last 6 Months', days: 180 },
    ALL: { label: 'All Time', days: null }
};


const AccountChart = ({ transactions }: any) => {
    const [dateRange, setDateRange] = useState<DateRangeKey>('6M');

    const filteredData = useMemo(() => {
        const range = DATE_RANGES[dateRange];
        const now = new Date();
        const startDate = range.days
            ? startOfDay(subDays(now, range.days))
            : startOfDay(new Date());

        // Filter transactions within date range
        const filtered = transactions.filter(
            (t: any) => new Date(t.date) >= startDate && new Date(t.date) <= endOfDay(now)
        )

        const grouped = filtered.reduce((acc: any, transaction: any) => {
            const date = format(new Date(transaction.date), 'MMM dd');

            if (!acc[date]) {
                acc[date] = { date, income: 0, expense: 0 };
            }

            if (transaction.type === 'INCOME') {
                acc[date].income += transaction.amount;
            } else if (transaction.type === 'EXPENSE') {
                acc[date].expense += transaction.amount;
            }

            return acc;
        }, {});

        // Convert to array and sort by date
        return Object.values(grouped).sort(
            (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()
        )
    }, [transactions, dateRange]);

    console.log('Filtered Data: ', filteredData);

    type Totals = { income: number; expense: number };
    const totals = useMemo<Totals>(() => {
        return filteredData.reduce<Totals>((acc, day: any) => ({
            income: acc.income + day.income,
            expense: acc.expense + day.expense,
        }), { income: 0, expense: 0 });
    }, [filteredData]);

    return (
        <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-7'>
                <CardTitle className='text-base font-normal'>Transactions Overview</CardTitle>
                <Select
                    defaultValue={dateRange}
                    onValueChange={(value) => setDateRange(value as DateRangeKey)}
                >
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Select Range" />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.entries(DATE_RANGES).map(([key, { label }]) => (
                            <SelectItem key={key} value={key}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent>
                <div className='flex justify-around mb-6 text-sm'>
                    <div className='text-center'>
                        <p className='text-muted-foreground'>Total Income</p>
                        <p className='text-lg font-bold text-green-500'>₹{totals.income.toFixed(2)}</p>
                    </div>

                    <div className='text-center'>
                        <p className='text-muted-foreground'>Total Expense</p>
                        <p className='text-lg font-bold text-red-500'>₹{totals.expense.toFixed(2)}</p>
                    </div>

                    <div className='text-center'>
                        <p className='text-muted-foreground'>Net</p>
                        <p className={`text-lg font-bold ${totals.income - totals.expense >= 0
                            ? 'text-green-500'
                            : 'text-red-500'
                            }`}>₹{(totals.income - totals.expense).toFixed(2)}</p>
                    </div>
                </div>

                <div className='h-[300px]'>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={filteredData}
                            margin={{
                                top: 10,
                                right: 10,
                                left: 10,
                                bottom: 0,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" />
                            <YAxis 
                                fontSize={12}
                                tickLine={false}
                                axisLine
                                tickFormatter={(value) => `₹${value}`}
                            />
                            <Tooltip formatter={(value) => [`₹${value}`, undefined]} />
                            <Legend />
                            <Bar dataKey="income" name={'Income'} fill="#22c55e" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="expense" name={'Expense'} fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

            </CardContent>
        </Card>
    )
}

export default AccountChart