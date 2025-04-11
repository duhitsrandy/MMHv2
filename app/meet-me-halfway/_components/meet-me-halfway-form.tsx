"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Location } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Loader2, MapPin, Bookmark, Check } from "lucide-react"
import { toast } from "sonner"
import { geocodeLocationAction } from "@/actions/locationiq-actions"
import { createSearchAction } from "@/actions/db/searches-actions"
import { createLocationAction } from "@/actions/db/locations-actions"

interface MeetMeHalfwayFormProps {
  initialLocations: Location[]
  onFindMidpoint: (data: {
    startLat: string
    startLng: string
    startAddress: { lat: number; lng: number; display_name?: string }
    endLat: string
    endLng: string
    endAddress: { lat: number; lng: number; display_name?: string }
  }) => void
}

export default function MeetMeHalfwayForm({
  initialLocations,
  onFindMidpoint
}: MeetMeHalfwayFormProps) {
  const { user, isSignedIn } = useUser()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [startAddress, setStartAddress] = useState("")
  const [endAddress, setEndAddress] = useState("")
  const [startLocationId, setStartLocationId] = useState("")
  const [endLocationId, setEndLocationId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [locations, setLocations] = useState<Location[]>(initialLocations)
  const [isSavingStart, setIsSavingStart] = useState(false)
  const [isSavingEnd, setIsSavingEnd] = useState(false)

  // Effect to read query parameters on mount *only if rerunning*
  useEffect(() => {
    const shouldRerun = searchParams.get('rerun') === 'true';
    const startQuery = searchParams.get('start');
    const endQuery = searchParams.get('end');

    let populated = false;
    if (shouldRerun && startQuery) {
      setStartAddress(startQuery);
      setStartLocationId('custom');
      populated = true;
    }
    if (shouldRerun && endQuery) {
      setEndAddress(endQuery);
      setEndLocationId('custom');
      populated = true;
    }

    // Clean up the URL parameters after reading them 
    // if we actually populated the fields from them.
    if (populated) {
      // Use router.replace to update URL without adding to history
      router.replace(pathname, { scroll: false }); 
    }
  // IMPORTANT: Run only when searchParams *object identity* changes,
  // which happens on navigation, not on every render.
  }, [searchParams, router, pathname]);

  // Effect to set initial locations (remains the same)
  useEffect(() => {
    setLocations(initialLocations)
  }, [initialLocations])

  const handleStartLocationSelect = (locationId: string) => {
    setStartLocationId(locationId)

    if (locationId === "custom") {
      setStartAddress("")
      return
    }

    const location = locations.find(loc => loc.id === locationId)
    if (location) {
      setStartAddress(location.address)
    }
  }

  const handleEndLocationSelect = (locationId: string) => {
    setEndLocationId(locationId)

    if (locationId === "custom") {
      setEndAddress("")
      return
    }

    const location = locations.find(loc => loc.id === locationId)
    if (location) {
      setEndAddress(location.address)
    }
  }

  const handleSaveLocation = async (type: "start" | "end") => {
    console.log(`[Save Location] Triggered for: ${type}`);
    if (!isSignedIn || !user?.id) {
      toast.error("Please sign in to save locations.")
      console.log("[Save Location] User not signed in.");
      return
    }

    const addressToSave = type === "start" ? startAddress : endAddress
    const setIsSaving = type === "start" ? setIsSavingStart : setIsSavingEnd

    if (!addressToSave) {
      toast.error("Please enter an address to save.")
      console.log("[Save Location] No address to save.");
      return
    }

    setIsSaving(true)
    console.log(`[Save Location] Attempting to save: ${addressToSave}`);

    try {
      console.log(`[Save Location] Geocoding: ${addressToSave}`);
      const geocodeResult = await geocodeLocationAction(addressToSave)
      console.log(`[Save Location] Geocode result:`, geocodeResult);
      if (!geocodeResult.isSuccess || !geocodeResult.data) {
        toast.error(`Could not find coordinates for: ${addressToSave}`)
        console.error(`[Save Location] Geocoding failed for ${addressToSave}`);
        setIsSaving(false)
        return
      }

      const locationName = prompt(
        `Enter a name for this location (e.g., Home, Work):\n${addressToSave}`
      )
      if (!locationName) {
        console.log("[Save Location] User cancelled prompt.");
        setIsSaving(false)
        return // User cancelled prompt
      }

      const newLocationData: Omit<Location, "id" | "createdAt" | "updatedAt"> =
        {
          userId: user.id,
          name: locationName,
          address: geocodeResult.data.display_name || addressToSave,
          latitude: geocodeResult.data.lat,
          longitude: geocodeResult.data.lon
        }

      console.log("[Save Location] Calling createLocationAction with:", newLocationData);
      const saveResult = await createLocationAction(newLocationData)
      console.log("[Save Location] createLocationAction result:", saveResult);

      if (saveResult.isSuccess && saveResult.data) {
        toast.success(`Location "${locationName}" saved!`)
        console.log(`[Save Location] Success: "${locationName}" saved.`);
        // Add the new location to the local state to update the dropdown
        setLocations(prevLocations => [...prevLocations, saveResult.data!])
        // Optionally, select the newly saved location
        if (type === "start") {
          setStartLocationId(saveResult.data!.id)
        } else {
          setEndLocationId(saveResult.data!.id)
        }
      } else {
        toast.error(
          `Failed to save location: ${saveResult.message || "Unknown error"}`
        )
        console.error(`[Save Location] Failed: ${saveResult.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error(`[Save Location] CATCH Error saving ${type} location:`, error)
      toast.error("An unexpected error occurred while saving the location.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!startAddress || !endAddress) {
      toast.error("Please enter both start and end addresses")
      return
    }

    setIsLoading(true)

    let startData, endData

    try {
      // Use existing location data if selected
      const selectedStart = locations.find(loc => loc.id === startLocationId)
      const selectedEnd = locations.find(loc => loc.id === endLocationId)

      if (selectedStart) {
        startData = {
          lat: selectedStart.latitude,
          lon: selectedStart.longitude,
          display_name: selectedStart.address
        }
      } else {
        const startResult = await geocodeLocationAction(startAddress)
        if (!startResult.isSuccess || !startResult.data) {
          toast.error(`Start address: ${startResult.message}`)
          setIsLoading(false)
          return
        }
        startData = startResult.data
      }

      if (selectedEnd) {
        endData = {
          lat: selectedEnd.latitude,
          lon: selectedEnd.longitude,
          display_name: selectedEnd.address
        }
      } else {
        const endResult = await geocodeLocationAction(endAddress)
        if (!endResult.isSuccess || !endResult.data) {
          toast.error(`End address: ${endResult.message}`)
          setIsLoading(false)
          return
        }
        endData = endResult.data
      }

      // *** Recent Search saving is moved to meet-me-halfway-app.tsx ***

      onFindMidpoint({
        startLat: startData.lat,
        startLng: startData.lon,
        startAddress: {
          lat: parseFloat(startData.lat),
          lng: parseFloat(startData.lon),
          display_name: startData.display_name || startAddress
        },
        endLat: endData.lat,
        endLng: endData.lon,
        endAddress: {
          lat: parseFloat(endData.lat),
          lng: parseFloat(endData.lon),
          display_name: endData.display_name || endAddress
        }
      })
    } catch (error) {
      console.error("Error processing form:", error)
      if (error instanceof Error) {
        toast.error(`Error: ${error.message}`)
      } else {
        toast.error(
          "An unexpected error occurred while processing your request"
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Find a Midpoint</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="startLocation">Location 1</Label>
              {locations.length > 0 && (
                <Select
                  value={startLocationId}
                  onValueChange={handleStartLocationSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select saved or enter custom" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Enter custom location</SelectItem>
                    {locations.map(location => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name} ({location.address.substring(0, 30)}...)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <div className="flex items-center gap-2">
                <Input
                  id="startLocation"
                  placeholder="Enter location 1 address"
                  value={startAddress}
                  onChange={e => setStartAddress(e.target.value)}
                  required
                  disabled={startLocationId !== "custom" && !!startLocationId}
                />
                {isSignedIn && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleSaveLocation("start")}
                    disabled={isSavingStart || !startAddress}
                    title="Save this location"
                  >
                    {isSavingStart ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Bookmark className="size-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endLocation">Location 2</Label>
              {locations.length > 0 && (
                <Select
                  value={endLocationId}
                  onValueChange={handleEndLocationSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select saved or enter custom" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Enter custom location</SelectItem>
                    {locations.map(location => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name} ({location.address.substring(0, 30)}...)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <div className="flex items-center gap-2">
                <Input
                  id="endLocation"
                  placeholder="Enter location 2 address"
                  value={endAddress}
                  onChange={e => setEndAddress(e.target.value)}
                  required
                  disabled={endLocationId !== "custom" && !!endLocationId}
                />
                {isSignedIn && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleSaveLocation("end")}
                    disabled={isSavingEnd || !endAddress}
                    title="Save this location"
                  >
                    {isSavingEnd ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Bookmark className="size-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Finding Midpoint...
              </>
            ) : (
              "Find Midpoint"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
