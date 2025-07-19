'use client'
import { useState, useEffect } from 'react'
import TransactionTable from './TransactionTable'
import LoadingFallback from '@/components/LoadingFallback'

const PAGE_SIZE = 10

export default function TransactionTableClient({ accountId }: { accountId: string }) {
  const [page, setPage] = useState(1)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/accounts/${accountId}/transactions?page=${page}&pageSize=${PAGE_SIZE}`)
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [accountId, page])

  if (loading || !data) return <LoadingFallback />

  return (
    <TransactionTable
      transactions={data.transactions}
      totalTransactions={data.totalTransactions}
      page={page}
      pageSize={PAGE_SIZE}
      onPageChange={setPage}
    />
  )
}