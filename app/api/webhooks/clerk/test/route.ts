export async function GET() {
  return new Response('Webhook endpoint is accessible', { status: 200 });
}

export async function POST(req: Request) {
  const body = await req.json();
  console.log('Test webhook received:', body);
  return new Response('Test webhook processed', { status: 200 });
} 