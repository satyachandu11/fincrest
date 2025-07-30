import React, { Suspense } from 'react'
import DashboardPage from './page'
import LoadingFallback from '@/components/LoadingFallback'
import { checkUser } from '@/lib/checkUser'
import { getUserName } from '@/actions/dashboard'

const DashboardLayout = async () => {
  await checkUser();
  const userName = await getUserName();
  const firstName = userName?.split(' ')[0] || '';
  console.log('User Name: ', userName);
  return (
    <div className='px-5'>
      <div>
        <h1 
          className='text-5xl font-bold pb-2 bg-gradient-to-br from-orange-400 to-orange-600 tracking-tighter pr-2 text-transparent bg-clip-text mb-4'
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          Hi, <span>{firstName} !</span>
        </h1>
        <p
          className="text-base text-muted-foreground mb-6"
          style={{ fontFamily: 'Montserrat, sans-serif', marginTop: '-1rem' }}
        >
          Here's what happening with your money, Lets Manage your expense
        </p>
      </div>

        {/* Dashboard Page */}
        <Suspense fallback={<LoadingFallback />}>
            <DashboardPage />
        </Suspense>
    </div>
  )
}

export default DashboardLayout