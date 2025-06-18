'use client'

import { bulkDeleteTransactions } from '@/actions/accounts'
import LoadingFallback from '@/components/LoadingFallback'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { categoryColors } from '@/data/categories'
import useFetch from '@/hooks/useFetch'
import { format } from 'date-fns'
import { Clock, Edit, MoreHorizontal, RefreshCw, Search, Trash, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

const RECURRING_INTERVALS: any = {
    DAILY: 'Daily',
    WEEKLY: 'Weekly',
    MONTHLY: 'Monthly',
    YEARLY: 'Yearly',
}

const TransactionTable = ({ transactions }: { transactions: { id: string; date: string; description: string; category: any; amount: number; isRecurring: boolean; type: string }[] }) => {

    const router = useRouter();

    const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
    const [sortConfig, setSortConfig] = React.useState<{ field: string; direction: string }>({
        field: 'date',
        direction: 'desc',
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [recurringFilter, setRecurringFilter] = useState('');

    const {
        loading: bulkDeleteLoading,
        fn: bulkDeleteFn,
        data: deleted
    } = useFetch(bulkDeleteTransactions);

    const handleBulkDelete = async () => {
        if(!window.confirm(`Are you sure you want to delete ${selectedIds.length} transactions?`)) return;

        bulkDeleteFn(selectedIds);
        // setSelectedIds([]);
    }

    useEffect(() => {
        if (deleted && !bulkDeleteLoading) {
            toast.error('Transactions Deleted Successfully');
        }
    }, [deleted, bulkDeleteLoading]);

    const filteredandSortedTransactions = useMemo(() => {
        let result = [...transactions];
        // console.log('Transactions: ', transactions);
        // console.log('Filtered Transactions: ', result);

        // Apply Search Filter
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            result = result.filter((transaction) =>
                transaction.description?.toLowerCase().includes(searchLower)
            );
        }

        // Apply Recurring Filter
        if (recurringFilter) {
            result = result.filter((transaction) => {
                if (recurringFilter === 'recurring') return transaction.isRecurring
                return !transaction.isRecurring;
            })
        }

        // Apply Type Filter
        if(typeFilter) {
            result = result.filter((transaction) => transaction.type === typeFilter);
        }

        // Apply Sorting
        result.sort((a,b) => {
            let comparision = 0;

            switch (sortConfig.field) {
                case 'date':
                    comparision = new Date(a.date).getTime() - new Date(b.date).getTime();
                    break;
                case 'amount':
                    comparision = a.amount - b.amount;
                    break;
                case 'category':
                    comparision = (a.category || '').localeCompare(b.category || '');
                    break;

                default:
                    comparision = 0;
            }

            return sortConfig.direction === 'asc' ? comparision : -comparision;
        })

        return result;
    }, [
        transactions,
        searchTerm,
        typeFilter,
        recurringFilter,
        sortConfig,
    ]);

    const handleSort = (field: string) => {
        setSortConfig((current) => ({
            field,
            direction: current.field === field && current.direction === 'asc' ? 'desc' : 'asc',
        }))
    }

    const handleSelect = useCallback((id: string) => {
        setSelectedIds((current) => {
            if (current.includes(id)) {
                return current.filter((item) => item !== id);
            } else {
                return [...current, id];
            }
        });
    }, []);
    const handleSelectAll = () => {
        setSelectedIds((current) =>
            current.length === transactions.length ? [] : transactions.map((transaction) => transaction.id)
        );
    }
    // console.log('Transactions: ', transactions);

    const handleClearFilters = () => {
        setSearchTerm('');
        setTypeFilter('');
        setRecurringFilter('');
    }

    const findRecurringTransaction = transactions.find((transaction) => transaction.isRecurring === true);
    // console.log('Recurring Transaction: ', findRecurringTransaction);

    return (
        <div className='space-y-4'>

            {bulkDeleteLoading && <LoadingFallback />}

            {/* Filters */}
            <div className='flex flex-col sm:flex-row gap-4'>
                <div className='relative flex-1'>
                    <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
                    <Input
                        className='pl-8'
                        placeholder='Search transactions...'
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className='flex gap-2'>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="INCOME">Income</SelectItem>
                            <SelectItem value="EXPENSE">Expense</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={recurringFilter} onValueChange={(value) => setRecurringFilter(value)}>
                        <SelectTrigger className='w-[130px]'>
                            <SelectValue placeholder="All Transactions" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="recurring">Recurring Only</SelectItem>
                            <SelectItem value="non-recurring">Non-Recurring Only</SelectItem>
                        </SelectContent>
                    </Select>

                    {selectedIds.length > 0 && (
                        <div className='flex items-center gap-2'>
                            <Button
                                variant='destructive'
                                size={'sm'}
                                onClick={handleBulkDelete}
                            >
                                <Trash className='h-4 w-4 mr-2' />
                                Delete Selected ({selectedIds.length})
                            </Button>
                        </div>
                    )}

                    {(searchTerm || typeFilter || recurringFilter) && (
                        <Button variant={'outline'} size={'icon'} onClick={handleClearFilters} title='Clear Filters'>
                            <X className='h-4 w-5' />
                        </Button>
                    )}
                </div>

            </div>

            {/* Transactions */}
            <div className='rounded-md border bg-card shadow-sm'>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    onCheckedChange={handleSelectAll}
                                    checked={selectedIds.length === filteredandSortedTransactions.length && filteredandSortedTransactions.length > 0}
                                />
                            </TableHead>
                            <TableHead
                                className="cursor-pointer"
                                onClick={() => handleSort('date')}
                            >
                                <div className='flex items-center'>
                                    Date {sortConfig.field === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </div>
                            </TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead
                                className="cursor-pointer"
                                onClick={() => handleSort('category')}
                            >
                                <div className='flex items-center'>
                                    Category {sortConfig.field === 'category' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </div>
                            </TableHead>
                            <TableHead
                                className="cursor-pointer"
                                onClick={() => handleSort('amount')}
                            >
                                <div className='flex items-center justify-end'>
                                    Amount {sortConfig.field === 'amount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </div>
                            </TableHead>
                            <TableHead>Recurring</TableHead>
                            <TableHead className='w-[50px]' />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredandSortedTransactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className='text-center py-4 text-muted-foreground'>
                                    No Transactions Found
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredandSortedTransactions.map((transaction: any) => (
                                <TableRow key={transaction.id}>
                                    <TableCell className="w-[50px]">
                                        <Checkbox
                                            onCheckedChange={() => handleSelect(transaction.id)}
                                            checked={selectedIds.includes(transaction.id)}
                                        />
                                    </TableCell>
                                    <TableCell>{format(new Date(transaction.date), 'PP')}</TableCell>
                                    <TableCell>{transaction.description}</TableCell>
                                    <TableCell className='capitalize'>
                                        <span
                                            style={{
                                                backgroundColor: categoryColors[transaction.category as keyof typeof categoryColors] || '#f0f0f0',
                                            }}
                                            className='px-2 py-1 rounded text-white text-sm'
                                        >
                                            {transaction.category}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right font-medium" style={{ color: transaction.type === 'EXPENSE' ? 'red' : 'green' }}>
                                        {transaction.type === 'EXPENSE' ? '-' : '+'}
                                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(transaction.amount)}</TableCell>
                                    <TableCell>{transaction.isRecurring ?
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <Badge variant='outline' className='gap-1 bg-purple-100 text-purple-700 hover:bg-purple-200'>
                                                        <RefreshCw className='h-3 w-3' />
                                                        {RECURRING_INTERVALS[transaction.recurringInterval]}
                                                    </Badge>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <div className='text-sm'>
                                                        <div className='font-medium'>Next Date: </div>
                                                        <div>
                                                            {format(new Date(transaction.nextRecurringDate), 'PP')}
                                                        </div>
                                                    </div>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                        : (
                                            <Badge variant='outline' className='gap-1'>
                                                <Clock className='h-3 w-3' />
                                                One-time
                                            </Badge>
                                        )}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant={'ghost'} className='h-8 w-8 p-0'>
                                                    <MoreHorizontal className='h-4 w-4' />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem
                                                    className='cursor-pointer'
                                                    onClick={() =>
                                                        router.push(`/transactions/create?edit=${transaction.id}`)
                                                    }>
                                                    <Edit className='h-4 w-2' />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className='text-destructive cursor-pointer'
                                                    onClick={() => bulkDeleteFn([transaction.id])}
                                                >
                                                    <Trash className='h-4 w-2' />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>

                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

        </div>
    )
}

export default TransactionTable