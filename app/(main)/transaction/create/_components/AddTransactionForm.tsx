"use client"

import { createTransaction, updateTransaction } from '@/actions/transaction'
import { transactionSchema } from '@/app/lib/schema'
import CreateAccountDrawer from '@/components/CreateAccountDrawer'
import LoadingFallback from '@/components/LoadingFallback'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import useFetch from '@/hooks/useFetch'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import ReceiptScanner from './ReceiptScanner'

const AddTransactionForm = ({ accounts, categories, editMode = false, initialData = null } : any) => {
    console.log('Categories:', categories);

    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get("edit");
    const [isNavigating, setIsNavigating] = useState(false);

    const {
        register,
        setValue,
        handleSubmit,
        formState: { errors },
        watch,
        getValues,
        reset,
    } = useForm({
        resolver: zodResolver(transactionSchema),
        defaultValues:
            editMode && initialData
            ? {
                type: initialData.type,
                amount: initialData.amount.toString(),
                description: initialData.description,
                accountId: initialData.accountId,
                category: initialData.category,
                date: new Date(initialData.date),
                isRecurring: initialData.isRecurring,
                ...(initialData.recurringInterval && {
                    recurringInterval: initialData.recurringInterval,
                }),
            }
        :{
            type: 'EXPENSE',
            amount: "",
            description: "",
            accountId: accounts.find((ac : any) => ac.isDefault)?.id,
            date: new Date(),
            isRecurring: false,
        },
    })

    const {
        loading: transactionLoading,
        fn: transactionFn,
        data: transactionResult,
    } = useFetch(editMode ? updateTransaction : createTransaction)

    const type = watch('type');
    const isRecurring = watch('isRecurring');
    const date = watch('date');

    const onSubmit = async (data: any) => {
        const formData = {
            ...data,
            amount: parseFloat(data.amount),
        }

        if(editMode) {
            await transactionFn(editId, formData)
        } else {
            await transactionFn({ data: formData });
        }
    }

    useEffect(() => {
        if (transactionResult && !transactionLoading) {
            if (transactionResult.success) {
                toast.success(
                    editMode ? 'Transaction updated successfully' :
                    'Transaction created successfully');
                reset();
                
                // Show full-page loading state before navigation
                setIsNavigating(true);
                
                router.push(`/account/${transactionResult.data.accountId}`);
            } else if (
                transactionResult.error &&
                transactionResult.error.toLowerCase().includes('rate limit')
            ) {
                toast.error('Too many requests. Please try again later.');
            } else if (transactionResult.error) {
                toast.error(transactionResult.error);
            }
        }
    }, [transactionResult, transactionLoading, editMode]);

    // Show full-page loading if navigating after successful creation/update
    if (isNavigating) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    <p className="text-lg font-medium">Redirecting to account...</p>
                    <p className="text-sm text-muted-foreground">Please wait while we navigate to your account page.</p>
                </div>
            </div>
        );
    }

    const filteredCategories = categories.filter((category: any) => category.type === type);

    const handleScanComplete = (scannedData: any) => {
        console.log('Scanned Data:', scannedData);
        if (scannedData) {
            if (scannedData.merchantName && scannedData.description) {
                const description = scannedData.merchantName + " - " + scannedData.description
                setValue('description',  description);
            } else if (scannedData.description && !scannedData.merchantName) {
                setValue('description', scannedData.description);
            }
            setValue('amount', scannedData.amount.toString());
            setValue('date', new Date(scannedData.date));
            if (scannedData.category) {
                setValue('category', scannedData.category);
            }
            // setValue('merchantName', scannedData.merchantName);
        } else {
            toast.error("Failed to scan receipt. Please try again.");
        }
    }

    return (
        <form className='space-y-2' onSubmit={handleSubmit(onSubmit)}>
            {/* AI Reciept Scanner */}
            {!editMode && <ReceiptScanner onScanComplete={handleScanComplete} />}

            <div className='space-y-2'>
                <label className='text-sm font-medium'>Type</label>
                <Select
                    onValueChange={(value) => setValue('type', value as "EXPENSE" | "INCOME")}
                    defaultValue={type}
                >
                    <SelectTrigger className='w-full'>
                        <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="EXPENSE">Expense</SelectItem>
                        <SelectItem value="INCOME">Income</SelectItem>
                    </SelectContent>
                </Select>

                {
                    errors.type && (
                        <p className='text-red-500 text-sm'>{String(errors.type.message)}</p>
                    )
                }
            </div>

            <div className='grid gap-6 md:grid-cols-2'>
                <div className='space-y-2'>
                    <label className='text-sm font-medium'>Amount</label>
                    <Input
                        type='number'
                        step={0.01}
                        placeholder='0.00'
                        {...register('amount')}
                    />

                    {
                        errors.amount && (
                            <p className='text-red-500 text-sm'>{String(errors.amount.message)}</p>
                        )
                    }
                </div>

                <div className='space-y-2'>
                    <label className='text-sm font-medium'>Account</label>
                    <Select
                        onValueChange={(value) => setValue('accountId', value)}
                        defaultValue={getValues('accountId')}
                    >
                        <SelectTrigger className='w-full'>
                            <SelectValue placeholder="Select Account" />
                        </SelectTrigger>
                        <SelectContent>
                            {accounts.map((account: any) => {
                                return (
                                    <SelectItem key={account.id} value={account.id}>
                                        {account.name} ({new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(account.balance)})
                                    </SelectItem>
                                )
                            })}
                            <CreateAccountDrawer>
                                <Button
                                    variant={'ghost'}
                                    className='w-full select-none items-center text-sm outline-none'
                                >
                                    Create Account
                                </Button>
                            </CreateAccountDrawer>
                        </SelectContent>
                    </Select>

                    {
                        errors.accountId && (
                            <p className='text-red-500 text-sm'>{String(errors.accountId.message)}</p>
                        )
                    }
                </div>
            </div>

            <div className='space-y-2'>
                <label className='text-sm font-medium'>Category</label>
                <Select
                    onValueChange={(value) => setValue('category', value, { shouldValidate: true })}
                    value={watch('category') || ""}
                >
                    <SelectTrigger className='w-full'>
                        <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                        {filteredCategories.map((category: any) => {
                            return (
                                <SelectItem key={category.id} value={category.id}>
                                    {category.name}
                                </SelectItem>
                            )
                        })}
                    </SelectContent>
                </Select>
                {
                    errors.category && (
                        <p className='text-red-500 text-sm'>
                            {String(errors.category.message) === 'Required' ? 'Category is required' : String(errors.category.message)}
                        </p>
                    )
                }
            </div>

            <div className='space-y-2'>
                <label className='text-sm font-medium'>Date</label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant={'outline'} className='w-full pl-3 text-left font-normal'>
                            {date ? format(date, "PPP") : <span>Pick a Date</span>}
                            <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0' align='start'>
                        <Calendar
                            mode='single'
                            selected={date}
                            onSelect={(date) => { if (date) setValue('date', date) }}
                            disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>

                {
                    errors.date && (
                        <p className='text-red-500 text-sm'>{String(errors.date.message)}</p>
                    )
                }
            </div>

            <div className='space-y-2'>
                <label className='text-sm font-medium'>Description</label>
                <Input placeholder='Enter Description' {...register("description")} />

                {
                    errors.description && (
                        <p className='text-red-500 text-sm'>{String(errors.description.message)}</p>
                    )
                }
            </div>

            <div className='flex items-center justify-between rounded-lg border p-3'>
                <div className='space-y-0.5'>
                    <label className='text-sm font-medium cursor-pointer'>Recurring Transaction</label>
                    <p className='text-sm text-muted-foreground'>Set up a recurring schedule for this transaction</p>
                </div>
                <Switch
                    onCheckedChange={(value) => setValue('isRecurring', value)}
                    checked={isRecurring}
                />
            </div>

            {isRecurring && (
                <div className='space-y-2'>
                    <label className='text-sm font-medium'>Recurring Interval</label>
                    <Select
                        onValueChange={(value) => setValue('recurringInterval', value as "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY")}
                        defaultValue={getValues('recurringInterval')}
                    >
                        <SelectTrigger className='w-full'>
                            <SelectValue placeholder="Select Interval" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="DAILY">Daily</SelectItem>
                            <SelectItem value="WEEKLY">Weekly</SelectItem>
                            <SelectItem value="MONTHLY">Monthly</SelectItem>
                            <SelectItem value="YEARLY">Yearly</SelectItem>
                        </SelectContent>
                    </Select>

                    {
                        errors.recurringInterval && (
                            <p className='text-red-500 text-sm'>{String(errors.recurringInterval.message)}</p>
                        )
                    }
                </div>
            )}

            <div className='flex gap-4 mt-6'>
                <Button
                    type='button'
                    variant={'outline'}
                    className='flex-1'
                    onClick={() => router.back()}
                >
                    Cancel
                </Button>
                <Button
                    type='submit'
                    className='flex-1'
                    disabled={transactionLoading}
                >
                    { transactionLoading ? (
                        <>
                            <Loader2 className='mr-2 animate-spin' />
                            <span>{editMode ? "Updating Transaction..." : "Creating Transaction..."}</span>
                        </>
                    ): (
                        <>
                            <span>{editMode ? "Update Transaction" : "Create Transaction"}</span>
                        </>
                    )}
                </Button>
            </div>
        </form>
    )
}

export default AddTransactionForm