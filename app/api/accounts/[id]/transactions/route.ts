import { getAccountWithTransactions } from '@/actions/accounts'
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest, { params }: any) {
  const { id } = params;
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get('page') || 1);
  const pageSize = Number(searchParams.get('pageSize') || 10);

  const data = await getAccountWithTransactions(id, page, pageSize);
  return Response.json({
    transactions: data.transactions,
    totalTransactions: data.totalTransactions,
  });
}