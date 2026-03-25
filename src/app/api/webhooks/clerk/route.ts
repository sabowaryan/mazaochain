import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { prisma } from '@/lib/db';

type ClerkUserEvent = {
  type: 'user.created' | 'user.updated' | 'user.deleted';
  data: {
    id: string;
    email_addresses: { email_address: string; id: string }[];
    primary_email_address_id: string;
    public_metadata?: { role?: string };
    deleted?: boolean;
  };
};

export async function POST(request: NextRequest) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    console.error('CLERK_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const svixId = request.headers.get('svix-id');
  const svixTimestamp = request.headers.get('svix-timestamp');
  const svixSignature = request.headers.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
  }

  const body = await request.text();

  let event: ClerkUserEvent;
  try {
    const wh = new Webhook(secret);
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkUserEvent;
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const { type, data } = event;

  try {
    if (type === 'user.created') {
      const primaryEmail = data.email_addresses.find(
        (e) => e.id === data.primary_email_address_id
      )?.email_address;

      const role = (data.public_metadata?.role as string) || 'agriculteur';

      await prisma.profile.upsert({
        where: { id: data.id },
        update: {},
        create: {
          id: data.id,
          role: role as any,
          wallet_address: null,
          is_validated: false,
        },
      });

      console.log(`[Webhook] Profile created for user ${data.id} (${primaryEmail}) with role ${role}`);
    }

    if (type === 'user.deleted' && data.id) {
      await prisma.profile.deleteMany({ where: { id: data.id } });
      console.log(`[Webhook] Profile deleted for user ${data.id}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Webhook] Database error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
