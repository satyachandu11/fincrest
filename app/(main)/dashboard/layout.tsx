import React, { Suspense } from 'react'
import DashboardPage from './page'
import { BarLoader } from 'react-spinners';

const DashboardLayout = () => {
  return (
    <div className='px-5'>
        <h1 className='text-6xl font-bold pb-2 bg-gradient-to-br from-orange-400 to-orange-600 tracking-tighter pr-2 text-transparent bg-clip-text mb-4'>Dashboard</h1>

        {/* Dashboard Page */}
        <Suspense fallback={<BarLoader className='mt-4' width={"100%"} color='#9333ea' />}>
            <DashboardPage />
        </Suspense>
    </div>
  )
}

export default DashboardLayout