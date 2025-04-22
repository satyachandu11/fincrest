"use client"
import Link from 'next/link';
import React, { useEffect, useRef } from 'react'
import { Button } from './ui/button';
import Image from 'next/image';

const HeroSection = () => {

    const imageRef: any = useRef(null);

    useEffect(() => {
        const imageElement: any = imageRef.current;

        const handleScroll = () => {
            const scrollPosition = window.scrollY;
            const scrollThreshold = 100;

            if(scrollPosition > scrollThreshold){
                imageElement.classList.add('scrolled');
            }else {
                imageElement.classList.remove('scrolled');
            }
        }

        window.addEventListener('scroll', handleScroll)

        return ()=> window.removeEventListener('scroll', handleScroll)
    }, [])
  return (
    <div className='pb-20 px-4'>
        <div className='container mx-auto text-center'>
            <h1 className='text-5xl md:text-8xl lg:text-[105px] pb-2 bg-gradient-to-br from-orange-400 to-orange-600 font-extrabold tracking-tighter pr-2 text-transparent bg-clip-text'>
                Peak Your Finances <br /> with FinCrest
            </h1>
            <p className='text-xl text-gray-600 mb-8 max-w-2xl mx-auto'>
                Reach the peak of financial management with smart real-time expense tracking and wealth growth. 
            </p>
            <div className='flex justify-center space-x-4'>
                <Link href={'/dashboard'}>
                    <Button size={'lg'} className='px-8'>Get Started</Button>
                </Link>
                <Link href={'https://www.linkedin.com/in/satyachandu11/'}>
                    <Button size={'lg'} variant={'outline'} className='px-8'>Know About Me</Button>
                </Link>
            </div>
            <div className='hero-image-wrapper'>
                <div ref={imageRef} className='hero-image'>
                    <Image
                        src={'/banner.png'}
                        width={1280}
                        height={720}
                        alt='Dashboard Preview'
                        priority
                        className='rounded-lg shadow-2xl border mx-auto'/>
                </div>
            </div>
        </div>
    </div>
  )
}

export default HeroSection;