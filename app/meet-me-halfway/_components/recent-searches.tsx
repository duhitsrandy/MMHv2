"use client"

import { useState, useEffect } from "react"
import { SelectSearch } from "@/db/schema"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, ArrowRight } from "lucide-react"
import { deleteSearchAction, getSearchesWithOriginsAction } from "@/actions/db/searches-actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"

interface RecentSearchesProps {
  searches: SelectSearch[]
}

export default function RecentSearches({ searches }: RecentSearchesProps) {
  const [localSearches, setLocalSearches] = useState<SelectSearch[]>(searches)
  const router = useRouter()
  const { user } = useUser()

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

  const handleRunSearchAgain = async (search: SelectSearch) => {
    if (!user?.id) {
      toast.error("User not authenticated")
      return
    }

    // For multi-origin searches, we need to get the full search data with origins
    if (search.originCount && search.originCount > 2) {
      try {
        const result = await getSearchesWithOriginsAction(user.id)
        if (result.isSuccess && result.data) {
          const fullSearch = result.data.find(s => s.id === search.id)
          if (fullSearch && fullSearch.origins) {
            const params = new URLSearchParams()
            fullSearch.origins.forEach((origin, index) => {
              params.append(`location${index}`, origin.displayName || origin.address)
            })
            params.set("rerun", "true")
            router.push(`/meet-me-halfway?${params.toString()}`)
            return
          }
        }
        toast.error("Could not load search details")
      } catch (error) {
        toast.error("Error loading search details")
        console.error("Error loading search details:", error)
      }
      return
    }
    
    // For legacy 2-location searches, use the old format
    if (search.startLocationAddress && search.endLocationAddress) {
      const params = new URLSearchParams({
        start: search.startLocationAddress,
        end: search.endLocationAddress,
        rerun: "true"
      })
      router.push(`/meet-me-halfway?${params.toString()}`)
    }
  }

  const displayedSearches = localSearches.slice(0, 5);

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
                      disabled={!search.startLocationAddress && !search.originCount}
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
                    {search.startLocationAddress || 'Multi-origin search'}
                  </p>
                  <ArrowRight className="mx-1 size-3 shrink-0" />
                  <p className="max-w-[120px] truncate">
                    {search.endLocationAddress || `${search.originCount || 0} locations`}
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
