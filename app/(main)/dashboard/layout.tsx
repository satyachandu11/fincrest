import React, { Suspense } from 'react'
import DashboardPage from './page'
import LoadingFallback from '@/components/LoadingFallback'
import { checkUser } from '@/lib/checkUser'

const DashboardLayout = async () => {
  await checkUser();
  return (
    <div className='px-5'>
        <h1 className='text-6xl font-bold pb-2 bg-gradient-to-br from-orange-400 to-orange-600 tracking-tighter pr-2 text-transparent bg-clip-text mb-4'>Dashboard</h1>

        {/* Dashboard Page */}
        <Suspense fallback={<LoadingFallback />}>
            <DashboardPage />
        </Suspense>
    </div>
  )
}

export default DashboardLayout