import { getUserAccounts } from '@/actions/dashboard';
import { defaultCategories } from '@/data/categories';
import LoadingFallback from '@/components/LoadingFallback';
import React, { Suspense } from 'react'
import AddTransactionForm from './_components/AddTransactionForm';
import { getTransaction } from '@/actions/transaction';

const AddTransactionPage = async ({searchParams}: any) => {
  const accounts = await getUserAccounts();

  const editId = await searchParams?.edit;

  let initialData = null;
  if(editId) {
    const transaction = await getTransaction(editId);
    initialData = transaction;
  }

  return (
    <div className='max-w-3xl mx-auto px-5'>
      <h1 className='text-5xl font-bold pb-2 bg-gradient-to-br from-orange-400 to-orange-600 tracking-tighter pr-2 text-transparent bg-clip-text mb-8'>{editId ? "Edit Transaction" : "Add Transaction"}</h1>
      
      <Suspense fallback={<LoadingFallback />}>
        <AddTransactionForm
          accounts={accounts}
          categories={defaultCategories}
          editMode={!!editId}
          initialData={initialData}
        />
      </Suspense>
    </div>
  )
}

export default AddTransactionPage