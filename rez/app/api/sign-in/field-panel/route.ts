import { NextResponse } from 'next/server';
import { getCachedSignInFieldPanelData } from '@/services/fetchSignInFieldPanelData';

export const maxDuration = 30;

export async function GET() {
  try {
    const data = await getCachedSignInFieldPanelData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching sign-in field panel data:', error);
    return NextResponse.json({ error: 'Failed to fetch field panel data' }, { status: 500 });
  }
}
