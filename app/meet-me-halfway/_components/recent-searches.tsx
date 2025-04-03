"use client"

import { useState, useEffect } from "react"
import { Search } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, ArrowRight } from "lucide-react"
import { deleteSearchAction } from "@/actions/db/searches-actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface RecentSearchesProps {
  searches: Search[]
}

export default function RecentSearches({ searches }: RecentSearchesProps) {
  const [localSearches, setLocalSearches] = useState<Search[]>(searches)
  const router = useRouter()

  useEffect(() => {
    setLocalSearches(searches);
  }, [searches]);

  const handleDelete = async (id: string) => {
    const result = await deleteSearchAction(id)

    if (result.isSuccess) {
      setLocalSearches(prevSearches => prevSearches.filter(search => search.id !== id))
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }
  }

  const handleRunSearchAgain = (search: Search) => {
    const params = new URLSearchParams({
      start: search.startLocationAddress,
      end: search.endLocationAddress
    })
    router.push(`/meet-me-halfway?${params.toString()}`)
  }

  const displayedSearches = localSearches.slice(-5).reverse();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Searches</CardTitle>
      </CardHeader>
      <CardContent>
        {displayedSearches.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No recent searches yet.
          </p>
        ) : (
          <div className="space-y-2">
            {displayedSearches.map(search => (
              <div key={search.id} className="hover:bg-accent rounded-md p-2">
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {new Date(search.createdAt).toLocaleDateString()}
                  </p>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRunSearchAgain(search)}
                      title="Run this search again"
                    >
                      <ArrowRight className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(search.id)}
                      title="Delete this search"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center text-sm">
                  <p className="max-w-[120px] truncate">
                    {search.startLocationAddress}
                  </p>
                  <ArrowRight className="mx-1 size-3 shrink-0" />
                  <p className="max-w-[120px] truncate">
                    {search.endLocationAddress}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
