export default function Loading() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-3xl animate-pulse">
        <div className="flex flex-col sm:flex-row gap-6 bg-white rounded-xl p-6 shadow-sm">
          <div className="w-full sm:w-40 h-40 rounded-lg bg-gray-200 mx-auto sm:mx-0" />
          <div className="flex-1 space-y-3">
            <div className="h-5 bg-gray-200 rounded w-3/4 mx-auto sm:mx-0" />
            <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto sm:mx-0" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-10 bg-gray-200 rounded w-28 mx-auto sm:mx-0" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <div className="h-32 bg-white rounded-xl shadow-sm" />
          <div className="h-32 bg-white rounded-xl shadow-sm" />
        </div>
      </div>
    </main>
  );
}
