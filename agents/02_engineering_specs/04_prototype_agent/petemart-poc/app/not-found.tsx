import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-32 text-center">
      <div className="text-8xl mb-4 opacity-20">🔍</div>
      <h1 className="text-3xl font-bold text-pm-text mb-2">Page Not Found</h1>
      <p className="text-pm-text-secondary mb-6 max-w-md mx-auto">
        The page you&apos;re looking for doesn&apos;t exist on PeteMart. It might have been moved or removed.
      </p>
      <div className="flex gap-3 justify-center">
        <Link href="/" className="px-6 py-3 bg-pm-primary text-white rounded-lg hover:opacity-90">
          Back to Home
        </Link>
        <Link href="/admin" className="px-6 py-3 border border-pm-border text-pm-text rounded-lg hover:bg-pm-background">
          Admin Console
        </Link>
      </div>
    </div>
  );
}
