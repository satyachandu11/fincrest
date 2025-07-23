'use client'

import { updateDefaultAccount } from '@/actions/accounts';
import { Account } from '@/app/_interfaces/account'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import useFetch from '@/hooks/useFetch';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

    const router = useRouter();
    // Local state to manage spinner visibility
    const [showSpinner, setShowSpinner] = useState(updateDefaultLoading);
    const [navigating, setNavigating] = useState(false);

    // Listen for route change to hide loader
    useEffect(() => {
        if (!navigating) return;
        const handleRouteChange = () => setNavigating(false);
        window.addEventListener('popstate', handleRouteChange);
        return () => window.removeEventListener('popstate', handleRouteChange);
    }, [navigating]);

    const handleDefaultChange = async (event: any) => {
        event.preventDefault();

        if (isDefault) {
            toast.warning('You need atleast one default account');
            return; // Dont allow to uncheck default account
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

    return (
        <div className="relative">
            {navigating && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-70">
                    <ClipLoader size={48} />
                </div>
            )}
            <Card className='hover:shadow-md transition-shadow cursor-pointer group relative'>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle>{name}</CardTitle>
                    {showSpinner
                        ? <ClipLoader size={18} />
                        : <Switch
                            checked={isDefault}
                            onClick={e => { e.stopPropagation(); handleDefaultChange(e); }}
                            disabled={updateDefaultLoading}
                        />}
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
            </Card>
        </div>
    )
}

export default AccountCard