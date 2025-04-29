"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { debounce } from 'lodash'
import { Location, GeocodedLocation } from "@/types"
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
import { Loader2, MapPin, Bookmark, Check, Plus, X } from "lucide-react"
import { toast } from "sonner"
import { geocodeLocationAction } from "@/actions/locationiq-actions"
import { createSearchAction } from "@/actions/db/searches-actions"
import { createLocationAction } from "@/actions/db/locations-actions"
import { v4 as uuidv4 } from 'uuid'

// Define the structure for a single location input
interface LocationInputState {
  id: string; // Unique ID for React key prop
  address: string;
  locationId: string; // ID of saved location or 'custom'
  isSaving: boolean;
}

// Update prop interface for onFindMidpoint
interface MeetMeHalfwayFormProps {
  initialLocations: Location[]
  onFindMidpoint: (data: { locations: GeocodedLocation[] }) => void
}

export default function MeetMeHalfwayForm({
  initialLocations,
  onFindMidpoint
}: MeetMeHalfwayFormProps) {
  const { user, isSignedIn } = useUser()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // --- State Refactoring ---
  // Use an array to hold location inputs, start with 2
  const [locationInputs, setLocationInputs] = useState<LocationInputState[]>([
    { id: uuidv4(), address: "", locationId: "custom", isSaving: false },
    { id: uuidv4(), address: "", locationId: "custom", isSaving: false }
  ])
  const [isLoading, setIsLoading] = useState(false)
  // Saved locations remain the same
  const [locations, setLocations] = useState<Location[]>(initialLocations)
  // Removed isSavingStart/End, handled within locationInputs

  // --- Debounce Logic ---
  // Use a map to store debounced functions per input index
  const debouncedSideEffects = useRef<Map<number, (value: string) => void>>(new Map())

  const getDebouncedSideEffect = useCallback((index: number) => {
    if (!debouncedSideEffects.current.has(index)) {
      debouncedSideEffects.current.set(index, debounce((value: string) => {
        console.log(`[Debounce] Address ${index + 1} settled:`, value)
        // Future: Trigger autocomplete API call here if needed
      }, 300))
    }
    return debouncedSideEffects.current.get(index)!
  }, [])

  // --- Generic Handlers ---
  const handleAddressChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setLocationInputs(currentInputs =>
      currentInputs.map((input, i) =>
        i === index ? { ...input, address: value, locationId: "custom" } : input
      )
    )
    getDebouncedSideEffect(index)(value) // Trigger debounced effect
  }

  const handleLocationSelect = (index: number, locationId: string) => {
    setLocationInputs(currentInputs =>
      currentInputs.map((input, i) => {
        if (i === index) {
          if (locationId === "custom") {
            return { ...input, address: "", locationId: "custom" }
          } else {
            const location = locations.find(loc => loc.id === locationId)
            return {
              ...input,
              address: location ? location.address : "",
              locationId: locationId
            }
          }
        }
        return input
      })
    )
  }

  const handleAddLocation = () => {
    // TODO: Later, check user plan before adding beyond the free limit
    setLocationInputs(currentInputs => [
      ...currentInputs,
      { id: uuidv4(), address: "", locationId: "custom", isSaving: false }
    ])
  }

  const handleRemoveLocation = (index: number) => {
    setLocationInputs(currentInputs => currentInputs.filter((_, i) => i !== index))
    // Clean up debouncer if it exists for the removed index
    debouncedSideEffects.current.delete(index)
  }

  // Effect to read query parameters on mount (Simplified: only reads first two for now)
  useEffect(() => {
    const startQuery = searchParams.get('start')
    const endQuery = searchParams.get('end')

    // Only populate if the query param exists and the corresponding input is empty
    setLocationInputs(currentInputs => {
      let updated = false
      const newInputs = [...currentInputs]
      if (startQuery && newInputs[0] && !newInputs[0].address) {
        console.log('[Form Init] Populating location 1 from query param:', startQuery)
        newInputs[0] = { ...newInputs[0], address: startQuery, locationId: 'custom' }
        updated = true
      }
      if (endQuery && newInputs[1] && !newInputs[1].address) {
        console.log('[Form Init] Populating location 2 from query param:', endQuery)
        newInputs[1] = { ...newInputs[1], address: endQuery, locationId: 'custom' }
        updated = true
      }
      // Future: Could extend to handle more query params like location_2, location_3 etc.
      return updated ? newInputs : currentInputs
    })

  }, [searchParams]) // Only depends on searchParams

  // Effect to set initial saved locations
  useEffect(() => {
    setLocations(initialLocations)
  }, [initialLocations])

  const handleSaveLocation = async (index: number) => {
    console.log(`[Save Location] Triggered for index: ${index}`)
    if (!isSignedIn || !user?.id) {
      toast.error("Please sign in to save locations.")
      console.log("[Save Location] User not signed in.")
      return
    }

    const inputToSave = locationInputs[index]
    if (!inputToSave || !inputToSave.address) {
      toast.error("Please enter an address to save.")
      console.log("[Save Location] No address to save.")
      return
    }

    // Set saving state for the specific input
    setLocationInputs(currentInputs =>
      currentInputs.map((input, i) =>
        i === index ? { ...input, isSaving: true } : input
      )
    )
    console.log(`[Save Location] Attempting to save: ${inputToSave.address}`)

    try {
      console.log(`[Save Location] Geocoding: ${inputToSave.address}`)
      const geocodeResult = await geocodeLocationAction(inputToSave.address)
      console.log(`[Save Location] Geocode result:`, geocodeResult)
      if (!geocodeResult.isSuccess || !geocodeResult.data) {
        toast.error(`Could not find coordinates for: ${inputToSave.address}`)
        console.error(`[Save Location] Geocoding failed for ${inputToSave.address}`)
        setLocationInputs(currentInputs =>
          currentInputs.map((input, i) =>
            i === index ? { ...input, isSaving: false } : input
          )
        )
        return
      }

      const locationName = prompt(
        `Enter a name for this location (e.g., Home, Work):\n${inputToSave.address}`
      )
      if (!locationName) {
        console.log("[Save Location] User cancelled prompt.")
        setLocationInputs(currentInputs =>
          currentInputs.map((input, i) =>
            i === index ? { ...input, isSaving: false } : input
          )
        )
        return // User cancelled prompt
      }

      const newLocationData: Omit<Location, "id" | "createdAt" | "updatedAt"> =
      {
        userId: user.id,
        name: locationName,
        address: geocodeResult.data.display_name || inputToSave.address,
        latitude: geocodeResult.data.lat,
        longitude: geocodeResult.data.lon
      }

      console.log("[Save Location] Calling createLocationAction with:", newLocationData)
      const saveResult = await createLocationAction(newLocationData)
      console.log("[Save Location] createLocationAction result:", saveResult)

      if (saveResult.isSuccess && saveResult.data) {
        toast.success(`Location "${locationName}" saved!`)
        console.log(`[Save Location] Success: "${locationName}" saved.`)
        const savedLocation = saveResult.data!
        // Add the new location to the global saved locations list
        setLocations(prevLocations => [...prevLocations, savedLocation])
        // Update the specific input to use the newly saved location
        setLocationInputs(currentInputs =>
          currentInputs.map((input, i) =>
            i === index ? { ...input, address: savedLocation.address, locationId: savedLocation.id, isSaving: false } : input
          )
        )
      } else {
        toast.error(
          `Failed to save location: ${saveResult.message || "Unknown error"}`
        )
        console.error(`[Save Location] Failed: ${saveResult.message || "Unknown error"}`)
        setLocationInputs(currentInputs =>
          currentInputs.map((input, i) =>
            i === index ? { ...input, isSaving: false } : input
          )
        )
      }
    } catch (error) {
      console.error(`[Save Location] CATCH Error saving location at index ${index}:`, error)
      toast.error("An unexpected error occurred while saving the location.")
      setLocationInputs(currentInputs =>
        currentInputs.map((input, i) =>
          i === index ? { ...input, isSaving: false } : input
        )
      )
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check if all addresses are filled
    const emptyAddressIndex = locationInputs.findIndex(input => !input.address.trim())
    if (emptyAddressIndex !== -1) {
      toast.error(`Please enter an address for Location ${emptyAddressIndex + 1}.`)
      return
    }

    // Check minimum locations
    if (locationInputs.length < 2) {
       toast.error("Please enter at least two locations.")
       return
    }

    setIsLoading(true)

    const geocodedLocations: GeocodedLocation[] = [] // Use GeocodedLocation type

    try {
      for (let i = 0; i < locationInputs.length; i++) {
        const input = locationInputs[i]
        let locationData: { lat: string; lon: string; display_name?: string; address: string } // Store original address too

        // Check if a saved location matching the current address is selected
        const selectedLocation = locations.find(loc => loc.id === input.locationId)

        if (selectedLocation && selectedLocation.address === input.address) {
          console.log(`[Submit] Using saved coordinates for Location ${i + 1}`)
          locationData = {
            lat: selectedLocation.latitude,
            lon: selectedLocation.longitude,
            display_name: selectedLocation.address,
            address: selectedLocation.address // Keep original address
          }
        } else {
          console.log(`[Submit] Geocoding address for Location ${i + 1}: ${input.address}`)
          const result = await geocodeLocationAction(input.address)
          if (!result.isSuccess || !result.data) {
            toast.error(`Location ${i + 1}: ${result.message || 'Geocoding failed'}`)
            setIsLoading(false)
            return
          }
          locationData = {
            ...result.data,
            address: input.address // Keep original address input by user
          }
        }

        geocodedLocations.push({
          id: input.id, // Pass the input id
          latitude: parseFloat(locationData.lat),
          longitude: parseFloat(locationData.lon),
          address: locationData.display_name || locationData.address, // Prefer display_name but fallback
          originalAddress: locationData.address // Store the original address
        })
      }

      console.log("[Submit] All locations geocoded:", geocodedLocations)
      onFindMidpoint({ locations: geocodedLocations }) // Pass array

      // Clear searchParams related to rerun after successful submission (optional)
      // router.replace(pathname, { scroll: false })

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
          {/* --- Dynamic Location Inputs --- */}
          {locationInputs.map((input, index) => (
            <div key={input.id} className="space-y-2 border-b pb-4 last:border-b-0 last:pb-0">
              <div className="flex justify-between items-center">
                 <Label htmlFor={`location-input-${index}`}>Location {index + 1}</Label>
                 {locationInputs.length > 2 && ( // Only show remove button if more than 2 locations
                   <Button
                     type="button"
                     variant="ghost"
                     size="icon"
                     onClick={() => handleRemoveLocation(index)}
                     disabled={isLoading}
                     aria-label={`Remove Location ${index + 1}`}
                     className="h-7 w-7 text-muted-foreground hover:text-destructive"
                   >
                     <X className="h-4 w-4" />
                   </Button>
                 )}
              </div>

              {/* Saved Locations Dropdown */}
              {locations.length > 0 && (
                <Select
                  value={input.locationId}
                  onValueChange={(value) => handleLocationSelect(index, value)}
                  disabled={isLoading || input.isSaving}
                >
                  <SelectTrigger id={`location-select-${index}`}>
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

              {/* Address Input and Save Button */}
              <div className="flex space-x-2 items-center pt-2">
                <Input
                  id={`location-input-${index}`}
                  placeholder={`Enter address for Location ${index + 1} or select saved`}
                  value={input.address}
                  onChange={(e) => handleAddressChange(index, e)}
                  disabled={isLoading || input.isSaving}
                  className="flex-grow"
                  required
                />
                {isSignedIn && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleSaveLocation(index)}
                    disabled={!input.address || isLoading || input.isSaving}
                    aria-label={`Save Location ${index + 1}`}
                  >
                    {input.isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Bookmark className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}

          {/* Add Location Button */}
          {/* TODO: Later, disable based on user plan */}
          <Button
            type="button"
            variant="outline"
            onClick={handleAddLocation}
            disabled={isLoading}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Another Location
          </Button>

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
  )
}
