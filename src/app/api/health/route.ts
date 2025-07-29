
import dbConnect from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await dbConnect();
    return NextResponse.json({ status: 'ok', message: 'Database connection successful' });
  } catch (error: any) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { status: 'error', message: 'Database connection failed', error: error.message },
      { status: 500 }
    );
  }
}
