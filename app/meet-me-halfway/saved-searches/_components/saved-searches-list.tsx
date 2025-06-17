"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { SelectSearch } from "@/db/schema"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Clock, ArrowRight, Trash2, Users } from "lucide-react"
import { deleteSearchAction } from "@/actions/db/searches-actions"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

interface SavedSearchesListProps {
  searches: Array<SelectSearch & { 
    origins?: Array<{ 
      address: string; 
      latitude: string; 
      longitude: string; 
      displayName?: string | null; 
      orderIndex: number 
    }> 
  }>
}

export default function SavedSearchesList({
  searches
}: SavedSearchesListProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [searchIdToDelete, setSearchIdToDelete] = useState<string | null>(null)

  const formatDate = (dateString: Date) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const handleRunSearchAgain = (search: SelectSearch & { origins?: Array<any> }) => {
    if (search.origins && search.origins.length > 0) {
      // For multi-origin searches, use the new URL format
      const params = new URLSearchParams()
      search.origins.forEach((origin, index) => {
        params.append(`location${index}`, origin.displayName || origin.address)
      })
      params.set("rerun", "true")
      router.push(`/meet-me-halfway?${params.toString()}`)
    } else if (search.startLocationAddress && search.endLocationAddress) {
      // Fallback to legacy format for 2-location searches
      const params = new URLSearchParams({
        start: search.startLocationAddress,
        end: search.endLocationAddress,
        rerun: "true"
      })
      router.push(`/meet-me-halfway?${params.toString()}`)
    }
  }

  const handleDeleteSearch = async (id: string) => {
    setIsDeleting(true)

    try {
      const result = await deleteSearchAction(id)

      if (result.isSuccess) {
        toast.success("Search deleted successfully")
      } else {
        toast.error(`Error deleting search: ${result.message}`)
      }
    } catch (error) {
      toast.error("An error occurred while deleting the search")
      console.error("Error deleting search:", error)
    } finally {
      setIsDeleting(false)
      setSearchIdToDelete(null)
    }
  }

  const getLocationCount = (search: SelectSearch & { origins?: Array<any> }) => {
    if (search.origins) {
      return search.origins.length
    } else if (search.startLocationAddress && search.endLocationAddress) {
      return 2
    }
    return 0
  }

  const getDisplayOrigins = (search: SelectSearch & { origins?: Array<any> }) => {
    if (search.origins && search.origins.length > 0) {
      return search.origins.map(origin => ({
        address: origin.displayName || origin.address,
        order: origin.orderIndex || 0
      })).sort((a, b) => a.order - b.order)
    } else if (search.startLocationAddress && search.endLocationAddress) {
      return [
        { address: search.startLocationAddress, order: 0 },
        { address: search.endLocationAddress, order: 1 }
      ]
    }
    return []
  }

  return (
    <div className="space-y-4">
      {searches.filter(s => s.id !== searchIdToDelete).map(search => {
        const locationCount = getLocationCount(search)
        const displayOrigins = getDisplayOrigins(search)
        
        return (
          <Card key={search.id} className="transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex flex-col space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-2">
                    <Clock className="text-muted-foreground mt-1 size-4" />
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-sm">
                        {formatDate(search.createdAt)}
                      </span>
                      {locationCount > 2 && (
                        <div className="flex items-center space-x-1 mt-1">
                          <Users className="text-muted-foreground size-3" />
                          <span className="text-muted-foreground text-xs">
                            {locationCount} locations
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSearchIdToDelete(search.id)}
                        disabled={isDeleting && searchIdToDelete === search.id}
                      >
                        <Trash2 className="text-muted-foreground size-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this saved search.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setSearchIdToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => searchIdToDelete && handleDeleteSearch(searchIdToDelete)}
                          disabled={isDeleting}
                        >
                          {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <div className="space-y-2">
                  {displayOrigins.map((origin, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <MapPin className={`mt-1 size-4 ${
                        index === 0 ? 'text-green-500' : 
                        index === displayOrigins.length - 1 ? 'text-red-500' : 
                        'text-blue-500'
                      }`} />
                      <div>
                        <p className="text-sm font-medium">
                          {index === 0 ? 'Start' : 
                           index === displayOrigins.length - 1 ? 'End' : 
                           `Location ${index + 1}`}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {origin.address}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-2 flex justify-end">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex items-center space-x-1"
                    onClick={() => handleRunSearchAgain(search)}
                  >
                    <span>Run Search Again</span>
                    <ArrowRight className="ml-1 size-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
