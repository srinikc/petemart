import { NextResponse } from 'next/server';

// In-memory order store for POC (replaces localStorage on client)
let orders: any[] = [];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
    // For server-side, we fallback to client localStorage
    return NextResponse.json({ error: 'Use client-side order tracking via localStorage in POC' }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    count: orders.length,
    orders,
    note: 'POC mode: orders are stored client-side in localStorage',
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const order = {
      id: `PM${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
      ...body,
      status: 'confirmed',
      created_at: new Date().toISOString(),
    };
    orders.unshift(order);
    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid order data' }, { status: 400 });
  }
}
