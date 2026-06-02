import '@testing-library/jest-dom';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/',
  useParams: () => ({}),
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => {
    const React = require('react');
    return React.createElement('a', { href, ...props }, children);
  },
}));

const localStorageMock = { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn(), length: 0, key: vi.fn() };
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const sessionStorageMock = { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn(), length: 0, key: vi.fn() };
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

class MockIntersectionObserver { observe = vi.fn(); unobserve = vi.fn(); disconnect = vi.fn(); }
Object.defineProperty(window, 'IntersectionObserver', { writable: true, configurable: true, value: MockIntersectionObserver });

class MockResizeObserver { observe = vi.fn(); unobserve = vi.fn(); disconnect = vi.fn(); }
Object.defineProperty(window, 'ResizeObserver', { writable: true, configurable: true, value: MockResizeObserver });
