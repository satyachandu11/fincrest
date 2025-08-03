import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { db } from '@/lib/prisma';

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occurred -- no svix headers', {
      status: 400
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occurred', {
      status: 400
    });
  }

  // Handle the webhook
  const eventType = evt.type;
  console.log(`Received webhook event: ${eventType}`);
  console.log('Webhook payload:', JSON.stringify(evt.data, null, 2));

  if (eventType === 'user.deleted') {
    const { id: clerkUserId } = evt.data;
    console.log(`Processing user deletion for clerkUserId: ${clerkUserId}`);
    
    try {
      // Find the user in our database
      const user = await db.user.findUnique({
        where: { clerkUserId }
      });

      if (user) {
        // Delete the user and all related data (cascade will handle related records)
        await db.user.delete({
          where: { id: user.id }
        });

        console.log(`User ${clerkUserId} and all related data deleted successfully`);
      } else {
        console.log(`User ${clerkUserId} not found in database`);
      }
    } catch (error) {
      console.error('Error deleting user data:', error);
      return new Response('Error deleting user data', {
        status: 500
      });
    }
  } else if (eventType === 'user.updated') {
    console.log('User updated event received');
  } else if (eventType === 'user.created') {
    console.log('User created event received');
  } else {
    console.log(`Unhandled webhook event type: ${eventType}`);
  }

  return new Response('Webhook processed successfully', { status: 200 });
} 