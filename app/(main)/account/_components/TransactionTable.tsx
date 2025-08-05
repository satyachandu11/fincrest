'use client'

import { bulkDeleteTransactions } from '@/actions/accounts'
import LoadingFallback from '@/components/LoadingFallback'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
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
import { ClipLoader } from 'react-spinners'

const RECURRING_INTERVALS: any = {
    DAILY: 'Daily',
    WEEKLY: 'Weekly',
    MONTHLY: 'Monthly',
    YEARLY: 'Yearly',
}

const TransactionTable = ({
    transactions,
    totalTransactions,
    page,
    pageSize,
    onPageChange,
    onRefresh
}: {
    transactions: any[],
    totalTransactions: number,
    page: number,
    pageSize: number,
    onPageChange: (page: number) => void,
    onRefresh?: () => void
}) => {

    const router = useRouter();

    const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
    const [sortConfig, setSortConfig] = React.useState<{ field: string; direction: string }>({
        field: 'date',
        direction: 'desc',
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [recurringFilter, setRecurringFilter] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

    const handleBulkDelete = async () => {
        setShowDeleteConfirm(true);
    }

    const confirmBulkDelete = async () => {
        setDeleting(true);
        setBulkDeleteLoading(true);
        try {
            const result: any = await bulkDeleteTransactions(selectedIds);
            console.log('Delete result:', result); // Debug log
            
            if (result && result.success) {
                toast.success(`Successfully deleted ${selectedIds.length} transaction${selectedIds.length === 1 ? '' : 's'}`);
                setSelectedIds([]); // Clear selected IDs after successful deletion
                setShowDeleteConfirm(false);
                // Trigger refresh to update the data
                if (onRefresh) {
                    onRefresh();
                }
            } else {
                toast.error(result?.error || 'Failed to delete transactions');
                setShowDeleteConfirm(false); // Close popup on error
            }
        } catch (error) {
            console.error('Delete transactions error:', error);
            toast.error('Failed to delete transactions');
            setShowDeleteConfirm(false); // Close popup on error
        } finally {
            setDeleting(false);
            setBulkDeleteLoading(false);
        }
    }



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

    // Pagination controls
    const totalPages = Math.ceil(totalTransactions / pageSize);

    return (
        <div className='space-y-4'>

            {bulkDeleteLoading && <LoadingFallback />}

            {/* Filters */}
            <div className='space-y-3'>
                {/* Search Bar */}
                <div className='relative'>
                    <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
                    <Input
                        className='pl-8'
                        placeholder='Search transactions...'
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Filters and Actions Row */}
                <div className='flex flex-col sm:flex-row gap-2'>
                    {/* Filter Dropdowns */}
                    <div className='flex flex-col sm:flex-row gap-2 flex-1'>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className='w-full sm:w-auto'>
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="INCOME">Income</SelectItem>
                                <SelectItem value="EXPENSE">Expense</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={recurringFilter} onValueChange={(value) => setRecurringFilter(value)}>
                            <SelectTrigger className='w-full sm:w-[130px]'>
                                <SelectValue placeholder="All Transactions" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="recurring">Recurring Only</SelectItem>
                                <SelectItem value="non-recurring">Non-Recurring Only</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Action Buttons */}
                    <div className='flex gap-2'>
                        {selectedIds.length > 0 && (
                            <Button
                                variant='destructive'
                                size={'sm'}
                                onClick={handleBulkDelete}
                                className='flex-1 sm:flex-none'
                            >
                                <Trash className='h-4 w-4 mr-2' />
                                <span className='hidden sm:inline'>Delete Selected ({selectedIds.length})</span>
                                <span className='sm:hidden'>Delete ({selectedIds.length})</span>
                            </Button>
                        )}

                        {(searchTerm || typeFilter || recurringFilter) && (
                            <Button variant={'outline'} size={'icon'} onClick={handleClearFilters} title='Clear Filters'>
                                <X className='h-4 w-5' />
                            </Button>
                        )}
                    </div>
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
                                                        router.push(`/transaction/create?edit=${transaction.id}`)
                                                    }>
                                                    <Edit className='h-4 w-2' />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className='text-destructive cursor-pointer'
                                                    onClick={async () => {
                                                        try {
                                                            const result = await bulkDeleteTransactions([transaction.id]);
                                                            if (result && result.success) {
                                                                toast.success('Transaction deleted successfully');
                                                                if (onRefresh) {
                                                                    onRefresh();
                                                                }
                                                            } else {
                                                                toast.error(result?.error || 'Failed to delete transaction');
                                                            }
                                                        } catch (error) {
                                                            console.error('Delete transaction error:', error);
                                                            toast.error('Failed to delete transaction');
                                                        }
                                                    }}
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

            {/* Pagination Controls */}
            { totalPages > 1 && (
                <div>
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    href="#"
                                    onClick={e => {
                                        e.preventDefault();
                                        if (page > 1) onPageChange(page - 1);
                                    }}
                                    aria-disabled={page === 1}
                                />
                            </PaginationItem>
                            {Array.from({ length: totalPages }, (_, i) => (
                                <PaginationItem key={i + 1}>
                                    <PaginationLink
                                        href="#"
                                        isActive={page === i + 1}
                                        onClick={e => {
                                            e.preventDefault();
                                            if (page !== i + 1) onPageChange(i + 1);
                                        }}
                                >
                                    {i + 1}
                                </PaginationLink>
                            </PaginationItem>
                            ))}
                            <PaginationItem>
                                <PaginationNext
                                    href="#"
                                    onClick={e => {
                                        e.preventDefault();
                                        if (page < totalPages) onPageChange(page + 1);
                                    }}
                                    aria-disabled={page === totalPages}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}

            {/* Delete Confirmation Popup */}
            {showDeleteConfirm && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/20"
                    onClick={() => setShowDeleteConfirm(false)}
                >
                    <div 
                        className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-semibold mb-4">
                            {selectedIds.length === 1 ? 'Delete Transaction' : 'Delete Transactions'}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete {selectedIds.length} selected transaction{selectedIds.length === 1 ? '' : 's'}? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <Button
                                onClick={() => setShowDeleteConfirm(false)}
                                variant="outline"
                                className="flex-1"
                                disabled={deleting}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={confirmBulkDelete}
                                variant="destructive"
                                className="flex-1"
                                disabled={deleting}
                            >
                                {deleting ? (
                                    <>
                                        <ClipLoader size={16} className="mr-2" />
                                        Deleting...
                                    </>
                                ) : (
                                    'Delete'
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}

export default TransactionTable