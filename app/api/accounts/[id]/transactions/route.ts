import { getAccountWithTransactions } from '@/actions/accounts'

export async function GET(req: Request, context: { params: { id: string } }) {
  const { id } = await context.params;
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get('page') || 1);
  const pageSize = Number(searchParams.get('pageSize') || 10);

  const data = await getAccountWithTransactions(id, page, pageSize);
  return Response.json({
    transactions: data.transactions,
    totalTransactions: data.totalTransactions,
  });
}