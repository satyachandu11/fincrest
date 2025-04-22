'use client'

import { updateDefaultAccount } from '@/actions/accounts';
import { Account } from '@/app/_interfaces/account'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import useFetch from '@/hooks/useFetch';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react'
import { ClipLoader } from 'react-spinners';
import { toast } from 'sonner';

const AccountCard = ({ account }: { account: Account }) => {

    const { id, name, type, balance, isDefault } = account;
    

    const {
        data: updateAccount,
        error,
        fn: updateAccountFn,
        loading: updateDefaultLoading
    } = useFetch(updateDefaultAccount);

    // Local state to manage spinner visibility
    const [showSpinner, setShowSpinner] = useState(updateDefaultLoading);

    const handleDefaultChange = async (event: any) => {
        event.preventDefault();

        if (isDefault) {
            toast.warning('You need atleast one default account');
            return; // Dont allow to uncheck default account
        }

        await updateAccountFn(id)
    }

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

    return (
        <Card className='hover:shadow-md transition-shadow cursor-pointer group relative'>
            <Link href={`/account/${id}`}>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle>{name}</CardTitle>
                    {showSpinner
                        ? <ClipLoader size={18} />
                        : <Switch
                            checked={isDefault}
                            onClick={handleDefaultChange}
                            disabled={updateDefaultLoading}
                            // onChange={}
                        />}

                </CardHeader>
                <CardContent className='mb-4'>
                    <div className='text-2xl font-bold capitalize'>
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(balance)}
                    </div>
                    <p className='text-xs text-muted-foreground'>
                        {type.charAt(0) + type.slice(1).toLowerCase()} Account
                    </p>
                </CardContent>
                <CardFooter className='flex justify-between text-sm text-muted-foreground'>
                    <div className='flex items-center'>
                        <ArrowUpRight className='mr-1 h-4 w-4 text-green-500' />
                        Income
                    </div>
                    <div className='flex items-center'>
                        <ArrowDownRight className='mr-1 h-4 w-4 text-red-500' />
                        Expense
                    </div>
                </CardFooter>
            </Link>
        </Card>

    )
}

export default AccountCard