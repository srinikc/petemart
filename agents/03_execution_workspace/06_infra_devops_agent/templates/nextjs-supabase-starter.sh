#!/usr/bin/env bash
# =============================================================================
# PeteMart — Project Generator Script
# =============================================================================
# This script generates the initial Next.js + Supabase project structure
# with pre-configured auth, database, and CI/CD scaffolding.
#
# Usage:
#   bash templates/nextjs-supabase-starter.sh <project-name>
#
# Example:
#   bash templates/nextjs-supabase-starter.sh petemart
# =============================================================================

set -euo pipefail

PROJECT_NAME="${1:-petemart}"
echo "🚀 Creating PeteMart project: $PROJECT_NAME"

# ── 1. Create Next.js app with TypeScript ─────────────────────────────
npx create-next-app@latest "$PROJECT_NAME" \
    --typescript \
    --tailwind \
    --eslint \
    --app \
    --src-dir \
    --import-alias "@/*"

cd "$PROJECT_NAME"

# ── 2. Install dependencies ───────────────────────────────────────────
npm install @supabase/supabase-js @supabase/ssr
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install @radix-ui/react-toast @radix-ui/react-tabs
npm install lucide-react class-variance-authority clsx tailwind-merge
npm install zustand react-hook-form zod @hookform/resolvers
npm install next-themes

# Dev dependencies
npm install -D @types/node @types/react @types/react-dom
npm install -D supabase prettier eslint-config-prettier
npm install -D @testing-library/react @testing-library/jest-dom vitest

# ── 3. Initialize Supabase ────────────────────────────────────────────
npx supabase init
npx supabase start

# ── 4. Create directory structure ─────────────────────────────────────
mkdir -p src/lib
mkdir -p src/components/ui
mkdir -p src/components/layout
mkdir -p src/components/merchant
mkdir -p src/components/product
mkdir -p src/components/cart
mkdir -p src/components/order
mkdir -p src/app/auth
mkdir -p src/app/dashboard
mkdir -p src/app/products
mkdir -p src/app/cart
mkdir -p src/app/orders
mkdir -p src/hooks
mkdir -p src/types
mkdir -p supabase/migrations
mkdir -p public/images

# ── 5. Create environment file ────────────────────────────────────────
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
EOF

# ── 6. Create Supabase client ─────────────────────────────────────────
cat > src/lib/supabase.ts << 'SUPABASE_EOF'
import { createBrowserClient } from '@supabase/ssr'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export function createServerSideClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
SUPABASE_EOF

# ── 7. Create middleware for auth protection ──────────────────────────
cat > src/middleware.ts << 'MIDDLEWARE_EOF'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protected routes
  const protectedPaths = ['/dashboard', '/cart', '/orders', '/profile']
  const isProtected = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('redirected_from', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
MIDDLEWARE_EOF

# ── 8. Create health API endpoint ─────────────────────────────────────
mkdir -p src/app/api/health
cat > src/app/api/health/route.ts << 'HEALTH_EOF'
import { NextResponse } from 'next/server'
import { createServerSideClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createServerSideClient()
  try {
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true })
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: error ? 'error' : 'connected',
      uptime: process.uptime(),
    })
  } catch (e) {
    return NextResponse.json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      uptime: process.uptime(),
    }, { status: 503 })
  }
}
HEALTH_EOF

echo ""
echo "============================================"
echo "  ✅ PeteMart project created: $PROJECT_NAME"
echo "============================================"
echo ""
echo "Next steps:"
echo "  cd $PROJECT_NAME"
echo "  npx supabase start        # Start local Supabase"
echo "  npm run dev               # Start Next.js dev server"
echo "  open http://localhost:3000"
echo ""
