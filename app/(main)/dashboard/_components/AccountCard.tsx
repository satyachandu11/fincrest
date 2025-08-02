'use client'

import { updateDefaultAccount, editAccountDetails, deleteAccount } from '@/actions/accounts';
import { Account } from '@/app/_interfaces/account'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { accountSchema } from '@/app/lib/schema';
import useFetch from '@/hooks/useFetch';
import { ArrowDownRight, ArrowUpRight, MoreVertical, Edit } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import { ClipLoader } from 'react-spinners';
import { toast } from 'sonner';

interface AccountCardProps {
    account: Account;
    onAccountUpdate?: (updatedAccount: Account) => void;
    onAccountDelete?: (accountId: string) => void;
    onDefaultChange?: (accountId: string, isDefault: boolean) => void;
}

const AccountCard = ({ account, onAccountUpdate, onAccountDelete, onDefaultChange }: AccountCardProps) => {

    const { id, name, type, balance, isDefault } = account;
    

    const {
        data: updateAccount,
        error,
        fn: updateAccountFn,
        loading: updateDefaultLoading
    } = useFetch(updateDefaultAccount);

    const router = useRouter();
    // Local state to manage spinner visibility
    const [showSpinner, setShowSpinner] = useState(updateDefaultLoading);
    const [navigating, setNavigating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isDirty, isValid },
        setValue,
        watch,
        reset
    } = useForm({
        resolver: zodResolver(accountSchema),
        defaultValues: {
            name: account.name,
            type: account.type as 'CURRENT' | 'SAVINGS',
            balance: account.balance.toString(),
            isDefault: account.isDefault,
        },
    });


    // Listen for route change to hide loader
    useEffect(() => {
        if (!navigating) return;
        const handleRouteChange = () => setNavigating(false);
        window.addEventListener('popstate', handleRouteChange);
        return () => window.removeEventListener('popstate', handleRouteChange);
    }, [navigating]);

    const handleDefaultChange = async (event: React.MouseEvent) => {
        event.preventDefault();

        if (isDefault) {
            toast.warning('You need atleast one default account');
            return; // Dont allow to uncheck default account
        }

        // Optimistic update - update UI immediately
        if (onDefaultChange) {
            onDefaultChange(id, true);
        }

        await updateAccountFn(id)
    }

    const handleCardClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setNavigating(true);
        router.push(`/account/${id}`);
    };

    // Synchronize spinner visibility with `updateDefaultLoading`
    useEffect(() => {
        if (updateDefaultLoading) {
            setShowSpinner(true); // Show spinner when loading starts
        } else {
            // Add a 1-second delay before hiding the spinner
            const timeout = setTimeout(() => setShowSpinner(false), 1000);
            return () => clearTimeout(timeout); // Cleanup timeout on unmount or re-render
        }
    }, [updateDefaultLoading]);

    // For Success Handling
    useEffect(() => {
        if (updateAccount?.success && !updateDefaultLoading) {
            toast.success('Default account updated successfully');
        }
    }, [updateAccount, updateDefaultLoading]);

    // For Error Handling
    useEffect(() => {
        if (error) {
            toast.error(error.message || 'Failed to update Default account');
        }
    }, [error]);

    // Reset form when editing starts
    useEffect(() => {
        if (isEditing) {
            reset({
                name: account.name,
                type: account.type as 'CURRENT' | 'SAVINGS',
                balance: account.balance.toString(),
                isDefault: account.isDefault,
            });
        }
    }, [isEditing, account, reset]);



    return (
        <div className="relative">
            {navigating && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-70">
                    <ClipLoader size={48} />
                </div>
            )}
            <Card className='hover:shadow-md transition-shadow cursor-pointer group relative'>
                {isEditing ? (
                    <form onSubmit={handleSubmit(async (data) => {
                        setSaving(true);
                        try {
                            const result = await editAccountDetails(id, data);
                            if (result.success) {
                                setIsEditing(false);
                                toast.success('Account updated successfully');
                                // Optimistic update - update UI immediately
                                if (onAccountUpdate) {
                                    onAccountUpdate({
                                        ...account,
                                        name: data.name,
                                        type: data.type,
                                        balance: parseFloat(data.balance)
                                    });
                                }
                            } else {
                                toast.error(result.error || 'Failed to update account');
                            }
                        } catch (error) {
                            toast.error('Failed to update account');
                        } finally {
                            setSaving(false);
                        }
                    })} className="p-4">
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Account Name</label>
                                <Input
                                    {...register('name')}
                                    className={`mt-1 ${errors.name ? 'border-red-500' : ''}`}
                                />
                                {errors.name && (
                                    <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
                                )}
                            </div>
                            <div>
                                <label className="text-sm font-medium">Account Type</label>
                                <Select 
                                    value={watch('type')} 
                                    onValueChange={(value) => setValue('type', value as 'CURRENT' | 'SAVINGS')}
                                >
                                    <SelectTrigger className={`mt-1 ${errors.type ? 'border-red-500' : ''}`}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SAVINGS">Savings</SelectItem>
                                        <SelectItem value="CURRENT">Current</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.type && (
                                    <p className="text-red-500 text-xs mt-1">{errors.type.message}</p>
                                )}
                            </div>
                            <div>
                                <label className="text-sm font-medium">Balance</label>
                                <Input
                                    {...register('balance')}
                                    className={`mt-1 ${errors.balance ? 'border-red-500' : ''}`}
                                    type="number"
                                    step={0.01}
                                />
                                {errors.balance && (
                                    <p className="text-red-500 text-xs mt-1">{errors.balance.message}</p>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button 
                                    type="button"
                                    onClick={() => {
                                        setIsEditing(false);
                                        reset();
                                    }}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    type="submit"
                                    disabled={saving || !isDirty || !isValid}
                                    className="flex-1"
                                >
                                    {saving ? (
                                        <>
                                            <ClipLoader size={16} className="mr-2" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </form>
                ) : (
                    <>
                        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                            <CardTitle>{name}</CardTitle>
                            <div className="flex items-center gap-2">
                                {showSpinner
                                    ? <ClipLoader size={18} />
                                    : <Switch
                                        checked={isDefault}
                                        onClick={e => { e.stopPropagation(); handleDefaultChange(e); }}
                                        disabled={updateDefaultLoading}
                                    />}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                        <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                                            <MoreVertical className="h-4 w-4 text-gray-500" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={(e) => {
                                            e.stopPropagation();
                                            setIsEditing(true);
                                        }}>
                                            Edit
                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    setShowDeleteConfirm(true);
                                }} className="text-red-600">
                                    Delete
                                </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardHeader>
                        <CardContent onClick={handleCardClick} className="select-none">
                            <div className='text-2xl font-bold capitalize mt-2'>
                                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(balance)}
                            </div>
                            <p className='text-xs text-muted-foreground mt-1'>
                                {type.charAt(0) + type.slice(1).toLowerCase()} Account
                            </p>
                        </CardContent>
                        <CardFooter onClick={handleCardClick} className='flex justify-between text-sm text-muted-foreground mt-2 select-none'>
                            <div className='flex items-center'>
                                <ArrowUpRight className='mr-1 h-4 w-4 text-green-500' />
                                Income
                            </div>
                            <div className='flex items-center'>
                                <ArrowDownRight className='mr-1 h-4 w-4 text-red-500' />
                                Expense
                            </div>
                        </CardFooter>
                    </>
                )}
            </Card>

            {/* Delete Confirmation Popup */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/20">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
                        <h3 className="text-lg font-semibold mb-4">Delete Account</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete "{name}"? This will also delete all associated transactions.
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
                                onClick={async () => {
                                    setDeleting(true);
                                    try {
                                        const result = await deleteAccount(id);
                                        if (result.success) {
                                            toast.success(result.message);
                                            setShowDeleteConfirm(false);
                                            // Optimistic update - remove from UI immediately
                                            if (onAccountDelete) {
                                                onAccountDelete(id);
                                            }
                                        } else {
                                            toast.error(result.error);
                                            setShowDeleteConfirm(false);
                                        }
                                    } catch (error) {
                                        toast.error('Failed to delete account');
                                        setShowDeleteConfirm(false);
                                    } finally {
                                        setDeleting(false);
                                    }
                                }}
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

export default AccountCard