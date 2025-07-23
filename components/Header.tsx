'use client'
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { Button } from './ui/button'
import { LayoutDashboard, PenBox } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'

const Header = () => {
    const router = useRouter();
    const pathname = usePathname();
    const [loadingDashboard, setLoadingDashboard] = React.useState(false);
    const [loadingTransaction, setLoadingTransaction] = React.useState(false);
    const [loadingLogin, setLoadingLogin] = React.useState(false);

    React.useEffect(() => {
        setLoadingDashboard(false);
        setLoadingTransaction(false);
        setLoadingLogin(false);
    }, [pathname]);

    const handleDashboard = () => {
        setLoadingDashboard(true);
        router.push('/dashboard');
    };
    const handleAddTransaction = () => {
        setLoadingTransaction(true);
        router.push('/transaction/create');
    };
    const handleLogin = () => {
        setLoadingLogin(true);
    };

    return (
        <div className='fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b'>
            <nav className='container mx-auto px-4 py-4 flex items-center justify-between'>
                <Link href="/">
                    <Image
                        src={"/logo.png"}
                        alt='FinCrest'
                        height={60}
                        width={200}
                        className='h-13 w-auto object-contain'
                    />
                </Link>

                <div className='flex items-center space-x-4'>

                    <SignedIn>
                        <Link href={'/dashboard'} className='text-gray-600 hover:to-blue-600 flex items-center gap-2'>
                            <Button variant={'outline'} onClick={handleDashboard} disabled={loadingDashboard || pathname === '/dashboard'}>
                                {loadingDashboard ? <Loader2 className='animate-spin' size={18}/> : <LayoutDashboard size={18}/>} 
                                <span className='hidden md:inline'>Dashboard</span>
                            </Button>
                        </Link>

                        <Button className='flex items-center gap-2' onClick={handleAddTransaction} disabled={loadingTransaction || pathname === '/transaction/create'}>
                            {loadingTransaction ? <Loader2 className='animate-spin' size={18}/> : <PenBox size={18}/>} 
                            <span className='hidden md:inline'>Add Transaction</span>
                        </Button>
                    </SignedIn>

                    <SignedOut>
                        <SignInButton forceRedirectUrl={'/dashboard'}>
                            <Button variant={'outline'} onClick={handleLogin} disabled={loadingLogin}>
                                {loadingLogin ? <Loader2 className='animate-spin' size={18}/> : null}
                                Login
                            </Button>
                        </SignInButton>
                        {/* <SignUpButton /> */}
                    </SignedOut>
                    <SignedIn>
                        <UserButton appearance={{
                            elements: {
                                avatarBox: 'w-10 h-10',
                            }
                        }} />
                    </SignedIn>
                </div>

            </nav>

        </div>
    )
}

export default Header