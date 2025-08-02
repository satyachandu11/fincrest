'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import CreateAccountDrawer from '@/components/CreateAccountDrawer';
import AccountCard from './AccountCard';
import { getUserAccounts } from '@/actions/dashboard';

interface AccountsGridProps {
  accounts: any[];
}

const AccountsGrid = ({ accounts: initialAccounts }: AccountsGridProps) => {
  const [accounts, setAccounts] = useState(initialAccounts);

  const handleAccountUpdate = (updatedAccount: any) => {
    setAccounts(prev => 
      prev.map(account => 
        account.id === updatedAccount.id ? updatedAccount : account
      )
    );
  };

  const handleAccountDelete = (accountId: string) => {
    setAccounts(prev => prev.filter(account => account.id !== accountId));
  };

  const handleDefaultChange = (accountId: string, isDefault: boolean) => {
    setAccounts(prev => 
      prev.map(account => ({
        ...account,
        isDefault: account.id === accountId ? isDefault : false
      }))
    );
  };

  const handleAccountCreated = async () => {
    // Fetch fresh accounts data and update state
    const freshAccounts = await getUserAccounts();
    setAccounts(freshAccounts);
  };

  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
      <CreateAccountDrawer onAccountCreated={handleAccountCreated}>
        <Card className='hover:shadow-md transition-shadow cursor-pointer border-dashed'>
          <CardContent className='flex flex-col items-center justify-center text-muted-foreground h-full pt-5'>
            <Plus className='h-10 w-10 mb-2' />
            <p className='text-sm font-medium'>Add New Account</p>
          </CardContent>
        </Card>
      </CreateAccountDrawer>

      {accounts.length > 0 && accounts?.map((account: any) => {
        return (
          <AccountCard 
            key={account.id} 
            account={account} 
            onAccountUpdate={handleAccountUpdate}
            onAccountDelete={handleAccountDelete}
            onDefaultChange={handleDefaultChange}
          />
        );
      })}
    </div>
  );
};

export default AccountsGrid; 