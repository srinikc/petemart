import { NextResponse } from 'next/server';
import { getAllProducts } from '@/lib/data/products';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const merchant = searchParams.get('merchant');
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const featured = searchParams.get('featured');

  let products = getAllProducts();

  if (id) {
    const product = products.find(p => p.id === id);
    return NextResponse.json(product || { error: 'Product not found' }, { status: product ? 200 : 404 });
  }

  if (merchant) {
    products = products.filter(p => p.merchant_slug === merchant);
  }

  if (category) {
    products = products.filter(p => p.category.toLowerCase().includes(category.toLowerCase()));
  }

  if (search) {
    const q = search.toLowerCase();
    products = products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  }

  if (featured === 'true') {
    products = products.filter(p => p.is_featured);
  }

  // Pagination
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const start = (page - 1) * limit;
  const paginatedProducts = products.slice(start, start + limit);

  return NextResponse.json({
    success: true,
    count: products.length,
    page,
    limit,
    products: paginatedProducts,
  });
}
