export default function ShopLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-48 md:h-64 bg-gray-200" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-4 mb-6">
          <div className="h-10 w-24 bg-gray-200 rounded-lg" />
          <div className="h-10 w-32 bg-gray-200 rounded-lg" />
          <div className="h-10 w-28 bg-gray-200 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-pm-border overflow-hidden">
              <div className="aspect-square bg-gray-100" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-5 bg-gray-200 rounded w-1/3" />
                <div className="h-8 bg-gray-200 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
