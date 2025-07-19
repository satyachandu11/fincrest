"use client";

import { scanReceipt } from '@/actions/transaction';
import { Button } from '@/components/ui/button';
import useFetch from '@/hooks/useFetch';
import { Camera, Loader2 } from 'lucide-react';
import React, { useEffect, useRef } from 'react'
import { toast } from 'sonner';

const ReceiptScanner = ({ onScanComplete }: any) => {
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const {
        loading: scanReceiptLoading,
        fn: scanReceiptFn,
        data: scannedData,
    } = useFetch(scanReceipt);

    const handleReceiptScan = async (file: File) => {
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size exceeds 5MB limit. Please upload a smaller file.");
            return;
        }

        const base64 = await convertFileToBase64(file);

        await scanReceiptFn({ base64, type: file.type });

        // await scanReceiptFn({data: file})
    };

    function convertFileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64 = (reader.result as string).split(',')[1]; // remove prefix like "data:image/png;base64,"
                resolve(base64);
            };
            reader.onerror = (error) => reject(error);
        });
    }

    useEffect(() => {
        if (scannedData && !scanReceiptLoading) {
            onScanComplete(scannedData);
            toast.success("Receipt scanned successfully!");
        }
    }, [scanReceiptLoading, scannedData]);
    return (
        <div>
            <input
                type="file"
                ref={fileInputRef}
                className='hidden'
                accept='image/*'
                capture='environment'
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                        handleReceiptScan(file);
                    }
                }}
            />
            <Button
                className='w-full h-10 bg-gradient-to-br from-orange-500 via-pink-500 to-purple-500 animate-gradient hover:opacity-90 transition-opacity text-white hover:text-white'
                type='button'
                onClick={() => fileInputRef.current?.click()}
                disabled={scanReceiptLoading}
            >{scanReceiptLoading ? (
                <>
                    <Loader2 className='mr-2 animate-spin' />
                    <span>Scanning Receipt...</span>
                </>
            ) : (
                <>
                    <Camera className='mr-2' />
                    <span>Scan Receipt with AI</span>
                </>
            )}</Button>
        </div>
    )
}

export default ReceiptScanner