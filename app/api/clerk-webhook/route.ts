import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import prismadb from '@/lib/prismadb';

// Add this to prevent caching
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);
  
  let evt: WebhookEvent;
  
  // Parse the body directly without verification
  evt = JSON.parse(body) as WebhookEvent;

  // Get the ID and type
  const { id } = evt.data;
  const eventType = evt.type;

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { email_addresses, first_name, last_name, image_url } = evt.data;
    const email = email_addresses[0]?.email_address; // Assuming the first email is the primary one
    
    if (!email) {
      console.error('No email address found for user:', id);
      return new NextResponse('No email address found', { status: 400 });
    }
    
    const name = `${first_name || ''} ${last_name || ''}`.trim();

    try {
      await prismadb.user.upsert({
        where: { id: id as string },
        update: {
          email,
          name,
        },
        create: {
          id: id as string,
          email,
          name,
        },
      });
      console.log(`User ${id} successfully ${eventType === 'user.created' ? 'created' : 'updated'}`);
    } catch (error) {
      console.error(`Error ${eventType === 'user.created' ? 'creating' : 'updating'} user:`, error);
      return new NextResponse(`Error ${eventType === 'user.created' ? 'creating' : 'updating'} user`, { status: 500 });
    }
  }

    if (eventType === 'user.deleted') {
        try {
            // Check if user exists before trying to delete
            const existingUser = await prismadb.user.findUnique({
                where: { id: id as string }
            });
            
            if (existingUser) {
                await prismadb.user.delete({
                    where: { id: id as string }
                });
                console.log(`User ${id} successfully deleted`);
            } else {
                console.log(`User ${id} not found in database, skipping delete`);
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            // Don't return an error response, just log it
        }
    }

  return new NextResponse('Webhook handled', { status: 200 });
}
