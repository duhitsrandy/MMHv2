"use server"

import { Suspense } from "react"
import { auth } from "@clerk/nextjs/server"
import { getSearchesAction } from "@/actions/db/searches-actions"
import SavedSearchesList from "./_components/saved-searches-list"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { SavedSearchesSkeleton } from "./_components/saved-searches-skeleton"

// Separate component for fetching and displaying saved searches
async function SavedSearchesContent() {
  const { userId } = await auth()

  if (!userId) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">
          Please sign in to view your saved searches.
        </p>
      </div>
    )
  }

  const searchesResult = await getSearchesAction(userId)

  if (!searchesResult.isSuccess) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">
          Error loading saved searches: {searchesResult.message}
        </p>
      </div>
    )
  }

  if (searchesResult.data.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">
          You don't have any saved searches yet.
        </p>
        <p className="text-muted-foreground mt-2">
          When you search for meeting points, they will be saved here for future
          reference.
        </p>
      </div>
    )
  }

  return <SavedSearchesList searches={searchesResult.data} />
}

export default async function SavedSearchesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-center text-3xl font-bold">Saved Searches</h1>

      <Card className="mx-auto max-w-4xl">
        <CardHeader>
          <CardTitle>Your Saved Searches</CardTitle>
          <CardDescription>
            View and reuse your previous searches
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<SavedSearchesSkeleton />}>
            {/* @ts-expect-error Async Server Component */}
            <SavedSearchesContent />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
