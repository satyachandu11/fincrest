export async function POST(req: Request) {
  try {
    const body = await req.json();
    const headers = await req.headers;
    
    console.log('=== DEBUG WEBHOOK RECEIVED ===');
    console.log('Headers:', Object.fromEntries(headers.entries()));
    console.log('Body:', JSON.stringify(body, null, 2));
    console.log('=== END DEBUG WEBHOOK ===');
    
    return new Response('Debug webhook received', { status: 200 });
  } catch (error) {
    console.error('Error in debug webhook:', error);
    return new Response('Error processing debug webhook', { status: 500 });
  }
}

export async function GET() {
  return new Response('Debug webhook endpoint is accessible', { status: 200 });
} 