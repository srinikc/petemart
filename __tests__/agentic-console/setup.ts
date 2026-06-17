import '@testing-library/jest-dom';
import { vi } from 'vitest';

// ── Next.js Navigation ──────────────────────────────────────────────────
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/',
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => {
    const React = require('react');
    return React.createElement('a', { href, ...props }, children);
  },
}));

// ── next/server Mocks ───────────────────────────────────────────────────
vi.mock('next/server', () => {
  const original = vi.importActual('next/server') as any;
  return {
    ...original,
    NextRequest: class MockNextRequest extends Request {
      public nextUrl: URL;
      public cookies: any;
      public geo: any;
      public ip: string;
      constructor(input: RequestInfo | URL, init?: RequestInit) {
        super(input, init);
        this.nextUrl = new URL(input.toString());
        this.cookies = { get: vi.fn(), set: vi.fn(), delete: vi.fn(), getAll: vi.fn(() => []) };
        this.geo = { city: 'Bengaluru', country: 'IN', region: 'KA' };
        this.ip = '127.0.0.1';
      }
      json() { return super.json(); }
    },
    NextResponse: class MockNextResponse extends Response {
      static json(body: any, init?: ResponseInit) { return new Response(JSON.stringify(body), init); }
      static redirect(url: string | URL, status?: number) { return Response.redirect(url.toString(), status ?? 307); }
      static next(init?: ResponseInit) { return new Response(null, init); }
    },
  };
});

// ── Storage Mocks ───────────────────────────────────────────────────────
const localStorageMock = { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn(), length: 0, key: vi.fn() };
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const sessionStorageMock = { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn(), length: 0, key: vi.fn() };
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

// ── Observer Mocks ──────────────────────────────────────────────────────
class MockIntersectionObserver { observe = vi.fn(); unobserve = vi.fn(); disconnect = vi.fn(); }
Object.defineProperty(window, 'IntersectionObserver', { writable: true, configurable: true, value: MockIntersectionObserver });

class MockResizeObserver { observe = vi.fn(); unobserve = vi.fn(); disconnect = vi.fn(); }
Object.defineProperty(window, 'ResizeObserver', { writable: true, configurable: true, value: MockResizeObserver });

// ── SSE ReadableStream Polyfill ─────────────────────────────────────────
if (typeof ReadableStream === 'undefined') {
  (globalThis as any).ReadableStream = class MockReadableStream {
    locked = false;
    getReader() { return { read: vi.fn(), cancel: vi.fn(), releaseLock: vi.fn() }; }
    cancel() { return Promise.resolve(); }
    pipeThrough() { return this; }
    pipeTo() { return Promise.resolve(); }
    tee() { return [this, this]; }
  };
}

// ── fs Module Mock (for in-process route tests) ─────────────────────────
vi.mock('node:fs', () => {
  const _files = new Map<string, string>();
  const mockFs = {
    existsSync: vi.fn((p: string) => _files.has(p)),
    readFileSync: vi.fn((p: string, enc?: any) => {
      if (!_files.has(p)) throw new Error(`ENOENT: ${p}`);
      return _files.get(p)!;
    }),
    writeFileSync: vi.fn((p: string, data: any) => { _files.set(p, String(data)); }),
    appendFileSync: vi.fn((p: string, data: any) => {
      _files.set(p, (_files.get(p) || '') + String(data));
    }),
    mkdirSync: vi.fn(() => undefined),
    readdirSync: vi.fn(() => []),
    unlinkSync: vi.fn((p: string) => _files.delete(p)),
    renameSync: vi.fn(() => {}),
    statSync: vi.fn((p: string) => ({ isFile: () => true, isDirectory: () => false, size: 0, mtime: new Date() })),
    _files,
  };
  return { ...mockFs, default: mockFs };
});

// ── Helper: Create a NextRequest from a URL string ─────────────────────
export function mockNextRequest(
  url: string,
  init?: { method?: string; body?: any; headers?: Record<string, string>; params?: Record<string, string> }
): Request {
  const req = new Request(url, {
    method: init?.method ?? 'GET',
    body: init?.body ? JSON.stringify(init.body) : undefined,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  (req as any).nextUrl = new URL(url);
  (req as any).params = init?.params ?? {};
  return req;
}
