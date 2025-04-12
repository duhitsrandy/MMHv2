"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { debounce } from 'lodash'
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

  // --- Debounce Logic (Revised) ---
  // Debounce only the potential side-effect trigger, not the primary state update
  const debouncedStartAddressSideEffect = useCallback(
    debounce((value: string) => {
      console.log('[Debounce] Start Address settled:', value);
      // Future: Trigger autocomplete API call here if needed
    }, 300),
    [] // No dependencies needed if only logging or calling external functions
  );

  const debouncedEndAddressSideEffect = useCallback(
    debounce((value: string) => {
      console.log('[Debounce] End Address settled:', value);
      // Future: Trigger autocomplete API call here if needed
    }, 300),
    [] // No dependencies needed
  );

  // Handlers now update state immediately for responsiveness
  // and call the debounced function for potential side effects.
  const handleStartAddressChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setStartAddress(value); // Update state immediately
    setStartLocationId("custom"); // Assume custom input if typing
    debouncedStartAddressSideEffect(value); // Trigger debounced effect
  };

  const handleEndAddressChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setEndAddress(value); // Update state immediately
    setEndLocationId("custom"); // Assume custom input if typing
    debouncedEndAddressSideEffect(value); // Trigger debounced effect
  };
  // --- Debounce Logic End ---

  // Effect to read query parameters on mount
  useEffect(() => {
    // Removed the check for `rerun=true` to allow repopulation from URL directly
    // const shouldRerun = searchParams.get('rerun') === 'true';
    const startQuery = searchParams.get('start');
    const endQuery = searchParams.get('end');

    let updated = false;
    // Only populate if the query param exists and the current state is empty
    // to avoid overwriting user input or selected saved locations unnecessarily.
    if (startQuery && !startAddress) {
      console.log('[Form Init] Populating start address from query param:', startQuery);
      setStartAddress(startQuery);
      setStartLocationId('custom'); // Assume it's a custom address if from query param
      updated = true;
    }
    if (endQuery && !endAddress) {
      console.log('[Form Init] Populating end address from query param:', endQuery);
      setEndAddress(endQuery);
      setEndLocationId('custom'); // Assume it's a custom address if from query param
      updated = true;
    }

    // We might not need to clear the params here anymore, as they represent the current state.
    // Leaving the clear logic commented out for now, might remove later if confirms unnecessary.
    // if (updated) {
    //   router.replace(pathname, { scroll: false }); 
    // }

  // Dependency array: Rerun if searchParams identity changes OR if address state becomes empty later
  }, [searchParams, router, pathname, startAddress, endAddress]);

  // Effect to set initial locations (remains the same)
  useEffect(() => {
    setLocations(initialLocations)
  }, [initialLocations])

  const handleStartLocationSelect = (locationId: string) => {
    setStartLocationId(locationId)

    if (locationId === "custom") {
      setStartAddress("")
    } else {
      const location = locations.find(loc => loc.id === locationId)
      if (location) {
        setStartAddress(location.address)
      }
    }
  }

  const handleEndLocationSelect = (locationId: string) => {
    setEndLocationId(locationId)

    if (locationId === "custom") {
      setEndAddress("")
    } else {
      const location = locations.find(loc => loc.id === locationId)
      if (location) {
        setEndAddress(location.address)
      }
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
          setStartAddress(saveResult.data!.address) // Update input field as well
        } else {
          setEndLocationId(saveResult.data!.id)
          setEndAddress(saveResult.data!.address) // Update input field as well
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
      // Use existing location data if selected (re-geocode if custom was typed)
      const selectedStart = locations.find(loc => loc.id === startLocationId)
      const selectedEnd = locations.find(loc => loc.id === endLocationId)

      if (selectedStart && selectedStart.address === startAddress) {
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

      if (selectedEnd && selectedEnd.address === endAddress) {
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
      });

      // Clear searchParams related to rerun after successful submission
      router.replace(pathname, { scroll: false });

    } catch (error) {
      console.error("Error during midpoint calculation:", error)
      toast.error("An error occurred while finding the midpoint.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Find Your Midpoint</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Start Location Section - Reverted Structure */}
          <div className="space-y-2">
            <Label htmlFor="start-location-input">Start Location</Label>
            {locations.length > 0 && (
              <Select
                value={startLocationId}
                onValueChange={handleStartLocationSelect}
                >
                <SelectTrigger id="start-location-select">
                  <SelectValue placeholder="Select saved or enter address below" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Use address below</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name} ({loc.address.substring(0, 30)}...)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
             )}
            <div className="flex space-x-2 items-center pt-2">
              <Input
                id="start-location-input"
                placeholder="Enter start address or select saved"
                value={startAddress}
                onChange={handleStartAddressChange}
                disabled={isLoading || isSavingStart}
                className="flex-grow"
                required
              />
              {isSignedIn && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleSaveLocation("start")}
                  disabled={!startAddress || isLoading || isSavingStart}
                  aria-label="Save start location"
                >
                  {isSavingStart ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* End Location Section - Reverted Structure */}
          <div className="space-y-2">
            <Label htmlFor="end-location-input">End Location</Label>
             {locations.length > 0 && (
               <Select
                 value={endLocationId}
                 onValueChange={handleEndLocationSelect}
               >
                 <SelectTrigger id="end-location-select">
                   <SelectValue placeholder="Select saved or enter address below" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="custom">Use address below</SelectItem>
                   {locations.map((loc) => (
                     <SelectItem key={loc.id} value={loc.id}>
                       {loc.name} ({loc.address.substring(0, 30)}...)
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             )}
            <div className="flex space-x-2 items-center pt-2">
              <Input
                id="end-location-input"
                placeholder="Enter end address or select saved"
                value={endAddress}
                onChange={handleEndAddressChange}
                disabled={isLoading || isSavingEnd}
                className="flex-grow"
                required
              />
              {isSignedIn && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleSaveLocation("end")}
                  disabled={!endAddress || isLoading || isSavingEnd}
                  aria-label="Save end location"
                >
                  {isSavingEnd ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <MapPin className="mr-2 h-4 w-4" />
            )}
            Find Midpoint
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
