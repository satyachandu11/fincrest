import { getAccountWithTransactions } from '@/actions/accounts'
import { notFound } from 'next/navigation';
import React, { Suspense } from 'react'
import TransactionTableClient from '../_components/TransactionTableClient'
import LoadingFallback from '@/components/LoadingFallback';
import AccountChart from '../_components/AccountChart';

const page = async ({ params }: { params: {id: string} }) => {
  const { id } = await params;
  const accountData = await getAccountWithTransactions(id);
  console.log('Account Data: ', accountData);

  if(!accountData){
    notFound();
  }

  const { transactions, ...account } = accountData;
  return (
    <div className='space-y-8 px-5'>
      <div className='flex gap-4 items-end justify-between'>
        <div>
          <h1 className='text-5xl sm:text-6xl font-bold capitalize bg-gradient-to-br from-orange-400 to-orange-600 tracking-tighter pr-2 text-transparent bg-clip-text'>{account.name}</h1>
          <p className='text-muted-foreground'>{account.type.charAt(0) + account.type.slice(1).toLowerCase()} Account</p>
        </div>

        <div className='text-right pb-2'>
          <div className='text-xl sm:text-2xl font-bold'>
            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(account.balance)}
          </div>
          <p className='text-sm text-muted-foreground'>{account._count.transactions} Transactions</p>
        </div>
      </div>

      {/* Chart Section */}
      <Suspense fallback={<LoadingFallback />}>
        <AccountChart transactions={transactions} />
      </Suspense>

      {/* Transaction Table */}
      <Suspense fallback={<LoadingFallback />}>
        <TransactionTableClient accountId={id} />
      </Suspense>
    </div>
  )
}

export default page