"use client"

export function SavedSearchesSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="rounded-md border p-4">
          <div className="mb-2 h-5 w-40 animate-pulse rounded bg-gray-200"></div>
          <div className="mb-2 h-4 w-full animate-pulse rounded bg-gray-200"></div>
          <div className="flex justify-between">
            <div className="h-4 w-20 animate-pulse rounded bg-gray-200"></div>
            <div className="h-8 w-24 animate-pulse rounded bg-gray-200"></div>
          </div>
        </div>
      ))}
    </div>
  )
} 