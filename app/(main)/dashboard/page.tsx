import { getDashboardData, getUserAccounts } from '@/actions/dashboard';
import CreateAccountDrawer from '@/components/CreateAccountDrawer';
import { Card, CardContent } from '@/components/ui/card';
import { ChartPieIcon, Plus, Sparkles, Wand } from 'lucide-react';
import React, { Suspense } from 'react'
import AccountCard from './_components/AccountCard';
import { generateBudgetSummary, getCurrentBudget } from '@/actions/budget';
import BudgetProgress from './_components/BudgetProgress';
import DashboardOverview from './_components/DashboardOverview';

const DashboardPage = async () => {
  const accounts = await getUserAccounts();
  console.log('Accounts: ', accounts);

  const defaultAccount = accounts?.find((account: any) => account.isDefault);
  console.log('Default Account: ', defaultAccount);
  let budgetData = null;
  if(defaultAccount){
    budgetData = await getCurrentBudget(defaultAccount.id);
    console.log('Budget Data: ', budgetData);
  }

  const transactions = await getDashboardData();

  const getAISummary = await generateBudgetSummary(defaultAccount.id);
  console.log('AI Summary: ', getAISummary);

  return (
    <div className='space-y-8'>

        {/* AI Summary */}
        <Card className="p-6 flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-base" style={{ fontFamily: 'Montserrat, sans-serif' }}>FinCrest Smart AI</span>
            <span className="bg-orange-500 text-white rounded-full p-2 flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </span>
          </div>
          <CardContent className="p-0">
            <p className="text-sm text-muted-foreground" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              {getAISummary?.summary || "No summary available"}
            </p>
          </CardContent>
        </Card>

        {/* Budget Progress */}
        {defaultAccount && <BudgetProgress
          initialBudget={budgetData?.budget}
          currentExpenses={budgetData?.currentExpenses || 0}
        />}

        {/* Overview */}
        <Suspense fallback={<div className='text-muted-foreground'>Loading overview...</div>}>
          <DashboardOverview
            accounts={accounts}
            transactions={transactions || []}
          />
        </Suspense>

        {/* Accounts Grid */}
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          <CreateAccountDrawer>
            <Card className='hover:shadow-md transition-shadow cursor-pointer border-dashed'>
              <CardContent className='flex flex-col items-center justify-center text-muted-foreground h-full pt-5'>
                <Plus className='h-10 w-10 mb-2' />
                <p className='text-sm font-medium'>Add New Account</p>
              </CardContent>
            </Card>
          </CreateAccountDrawer>

          {accounts.length > 0 && accounts?.map((account: any) => {
            return <AccountCard key={account.id} account={account} />
          })}
        </div>
    </div>
  )
}

export default DashboardPage;