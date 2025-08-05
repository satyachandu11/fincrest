'use client'
import { useState, useEffect, useCallback } from 'react'
import TransactionTable from './TransactionTable'
import LoadingFallback from '@/components/LoadingFallback'

const PAGE_SIZE = 10

export default function TransactionTableClient({ accountId }: { accountId: string }) {
  const [page, setPage] = useState(1)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/accounts/${accountId}/transactions?page=${page}&pageSize=${PAGE_SIZE}`)
      const data = await res.json()
      setData(data)
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    } finally {
      setLoading(false)
    }
  }, [accountId, page])

  useEffect(() => {
    fetchData()
  }, [fetchData, refreshKey])

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1)
  }, [])

  if (loading || !data) return <LoadingFallback />

  return (
    <TransactionTable
      transactions={data.transactions}
      totalTransactions={data.totalTransactions}
      page={page}
      pageSize={PAGE_SIZE}
      onPageChange={setPage}
      onRefresh={handleRefresh}
    />
  )
}