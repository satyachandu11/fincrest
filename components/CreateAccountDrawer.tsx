"use client";

import React, { useEffect, useState } from 'react'
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from './ui/drawer';
import { Button } from './ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { accountSchema } from '@/app/lib/schema';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { createAccount, getUserAccounts } from '@/actions/dashboard';
import { Loader2 } from 'lucide-react';
import useFetch from '@/hooks/useFetch';
import { toast } from 'sonner';

const CreateAccountDrawer = ({ children, onAccountCreated }: any) => {
    const [open, setOpen] = useState<any>(false);
    const [hasCreated, setHasCreated] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting, isDirty, isValid, isSubmitSuccessful },
        setValue,
        watch,
        reset
    } = useForm({
        resolver: zodResolver(accountSchema),
        defaultValues: {
            name: '',
            type: 'CURRENT' as 'CURRENT' | 'SAVINGS',
            balance: '',
            isDefault: false,
        },
    })

    const {
        data: newAccount,
        error,
        fn: createAccountFn,
        loading: createAccountLoading
    } = useFetch(createAccount)

    useEffect(() => {
        if(newAccount && !createAccountLoading && !hasCreated) {
            toast.success('Account created successfully');
            setOpen(false);
            reset();
            setHasCreated(true);
            // Call the callback to refresh accounts
            onAccountCreated?.();
        }
    }, [createAccountLoading, newAccount, hasCreated, onAccountCreated])

    useEffect(() => {
        if (error) {
            toast.error(error.message || 'Failed to create account. Please try again after sometime');
        }
    }, [error])

    const onSubmit = async (data: any) => {
        console.log(data);
        setHasCreated(false);
        await createAccountFn(data);
    }

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>{children}</DrawerTrigger>
            <DrawerContent>
                <DrawerHeader>
                    <DrawerTitle>Create New Account</DrawerTitle>
                </DrawerHeader>

                <div className='px-4 pb-50'>
                    <form className='space-y-4' onSubmit={handleSubmit(onSubmit)}>
                        <div className='space-y-2'>
                            <label htmlFor="name" className='text-sm font-medium'>Account Name</label>
                            <Input
                                id='name'
                                placeholder='e.g., Main Checking'
                                {...register('name')}
                            />
                            {errors.name && <p className='text-sm text-red-500'>{errors.name.message}</p>}
                        </div>

                        <div className='space-y-2'>
                            <label htmlFor="type" className='text-sm font-medium'>Account Type</label>
                            <div className="w-full">
                                <Select 
                                    onValueChange={(value) => setValue('type', value as 'CURRENT' | 'SAVINGS')} 
                                    defaultValue={watch('type')}
                                    {...register('type')}
                                >
                                <SelectTrigger id='type'>
                                    <SelectValue placeholder="Select Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CURRENT">Current</SelectItem>
                                    <SelectItem value="SAVINGS">Savings</SelectItem>
                                </SelectContent>
                                </Select>
                            </div>

                            {errors.type && <p className='text-sm text-red-500'>{errors.type.message}</p>}
                        </div>

                        <div className='space-y-2'>
                            <label htmlFor="balance" className='text-sm font-medium'>Initial Balance</label>
                            <Input
                                id='balance'
                                type='number'
                                step={0.01}
                                placeholder='0.00'
                                {...register('balance')}
                            />
                            {errors.balance && <p className='text-sm text-red-500'>{errors.balance.message}</p>}
                        </div>

                        <div className='flex items-center justify-between rounded-lg border p-3'>
                            <div className='space-y-0.5'>
                                <label htmlFor="isDefault" className='text-sm font-medium cursor-pointer'>Set as Default</label>
                                <p className='text-sm text-muted-foreground'>This account will be selected by default for transactions</p>
                            </div>
                            <Switch
                                id='isDefault'
                                onCheckedChange={(value) => setValue('isDefault', value)}
                                checked={watch('isDefault')}
                            />
                        </div>

                        <div className='flex gap-4 pt-4'>
                            <DrawerClose asChild>
                                <Button type='button' variant={'outline'} className='flex-1'>Cancel</Button>
                            </DrawerClose>

                            <Button
                                type='submit'
                                variant={'default'}
                                className='flex-1'
                                disabled={!isDirty || !isValid || createAccountLoading}    
                            >
                                {createAccountLoading ? <><Loader2 className='mr-2 h-4 w-4 animate-spin'/>Creating...</> : 'Create Account'}
                            </Button>
                        </div>
                    </form>
                </div>
            </DrawerContent>
        </Drawer>

    )
}

export default CreateAccountDrawer