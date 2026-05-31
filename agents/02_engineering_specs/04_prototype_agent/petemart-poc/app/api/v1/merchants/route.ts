import { NextResponse } from 'next/server';
import { getAllMerchants, getMerchantBySlug } from '@/lib/data/merchants';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  const market = searchParams.get('market');

  let merchants = getAllMerchants();

  if (slug) {
    const merchant = getMerchantBySlug(slug);
    return NextResponse.json(merchant || { error: 'Merchant not found' }, { status: merchant ? 200 : 404 });
  }

  if (market) {
    merchants = merchants.filter(m => m.market.toLowerCase() === market.toLowerCase());
  }

  return NextResponse.json({
    success: true,
    count: merchants.length,
    merchants,
  });
}
