import { getDashboardData, getUserAccounts } from '@/actions/dashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import React, { Suspense } from 'react'
import { generateBudgetSummary, getCurrentBudget } from '@/actions/budget';
import BudgetProgress from './_components/BudgetProgress';
import DashboardOverview from './_components/DashboardOverview';
import AccountsGrid from './_components/AccountsGrid';

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
        <AccountsGrid accounts={accounts} />
    </div>
  )
}

export default DashboardPage;