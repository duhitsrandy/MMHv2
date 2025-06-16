"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { debounce } from 'lodash'
import { Location, OriginInput, GeocodedOrigin } from "@/types"
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
import { Loader2, MapPin, Bookmark, Check, PlusCircle, XCircle } from "lucide-react"
import { toast } from "sonner"
import { geocodeLocationAction } from "@/actions/geocoding-test"
import { createSearchAction } from "@/actions/db/searches-actions"
import { createLocationAction } from "@/actions/db/locations-actions"
import { usePlan } from "@/hooks/usePlan"
import { useAnalytics } from "@/hooks/useAnalytics"
import { ANALYTICS_EVENTS } from "@/lib/analytics-events"

interface MeetMeHalfwayFormProps {
  initialLocations: Location[]
  onFindMidpoint: (data: { origins: GeocodedOrigin[] }) => void
  onOpenUpgradeModal: () => void
}

export default function MeetMeHalfwayForm({
  initialLocations,
  onFindMidpoint,
  onOpenUpgradeModal
}: MeetMeHalfwayFormProps) {
  const { user, isSignedIn } = useUser()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { tier: plan, isLoading: isPlanLoading, error: planError } = usePlan();
  const { trackLocationChange, trackSearch, track } = useAnalytics();

  const [origins, setOrigins] = useState<OriginInput[]>([
    { id: `origin-${Date.now()}-0`, address: '', selectedLocationId: 'custom', isSaving: false },
    { id: `origin-${Date.now()}-1`, address: '', selectedLocationId: 'custom', isSaving: false },
  ]);

  const [isLoading, setIsLoading] = useState(false)
  const [locations, setLocations] = useState<Location[]>(initialLocations)

  const getMaxLocations = (tier: string | null | undefined): number => {
    switch (tier) {
      case 'starter': return 2;
      case 'plus': return 3;
      case 'pro': return 5;
      case 'business': return 10;
      default: return 2; // Default to starter limits
    }
  };

  const maxLocations = getMaxLocations(plan);
  const canAddLocation = origins.length < maxLocations;

  const handleOriginAddressChange = (index: number, value: string) => {
    setOrigins(currentOrigins =>
      currentOrigins.map((origin, i) =>
        i === index
          ? { ...origin, address: value, selectedLocationId: 'custom' }
          : origin
      )
    );
  };

  const handleOriginLocationSelect = (index: number, locationId: string) => {
     setOrigins(currentOrigins =>
       currentOrigins.map((origin, i) => {
         if (i === index) {
           if (locationId === "custom") {
             return { ...origin, selectedLocationId: 'custom', address: "" };
           } else {
             const location = locations.find(loc => loc.id === locationId);
             return {
               ...origin,
               selectedLocationId: locationId,
               address: location ? location.address : origin.address
             };
           }
         }
         return origin;
       })
     );
  };

  const handleSaveOriginLocation = async (index: number) => {
     console.log(`[Save Location] Triggered for index: ${index}`);
     if (!isSignedIn || !user?.id) {
       toast.error("Please sign in to save locations.");
       return;
     }

     const originToSave = origins[index];
     if (!originToSave || !originToSave.address) {
       toast.error("Please enter an address to save.");
       return;
     }

     setOrigins(currentOrigins =>
        currentOrigins.map((o, i) => i === index ? { ...o, isSaving: true } : o)
     );

     try {
        console.log(`[Save Location] Geocoding: ${originToSave.address}`);
        const geocodeResult = await geocodeLocationAction(originToSave.address);
        console.log(`[Save Location] Geocode result:`, geocodeResult);
        if (!geocodeResult.isSuccess || !geocodeResult.data) {
            toast.error(`Could not find coordinates for: ${originToSave.address}`);
            setIsLoading(false);
            return;
        }

        const locationName = prompt(
          `Enter a name for this location (e.g., Home, Work):\n${originToSave.address}`
        );
        if (!locationName) {
          console.log("[Save Location] User cancelled prompt.");
          setOrigins(currentOrigins =>
             currentOrigins.map((o, i) => i === index ? { ...o, isSaving: false } : o)
           );
          return;
        }

         const newLocationData: Omit<Location, "id" | "createdAt" | "updatedAt"> = {
            userId: user.id,
            name: locationName,
            address: geocodeResult.data.display_name || originToSave.address,
            latitude: geocodeResult.data.lat,
            longitude: geocodeResult.data.lon
        };

        console.log("[Save Location] Calling createLocationAction with:", newLocationData);
        const saveResult = await createLocationAction(newLocationData);
        console.log("[Save Location] createLocationAction result:", saveResult);

        if (saveResult.isSuccess && saveResult.data) {
            toast.success(`Location \"${locationName}\" saved!`);
            const savedLoc = saveResult.data;
            setLocations(prevLocations => [...prevLocations, savedLoc]);
            setOrigins(currentOrigins =>
                currentOrigins.map((o, i) =>
                    i === index
                        ? { ...o, selectedLocationId: savedLoc.id, address: savedLoc.address, isSaving: false }
                        : o
                )
            );
        } else {
          toast.error( `Failed to save location: ${saveResult.message || "Unknown error"}`);
          setOrigins(currentOrigins =>
             currentOrigins.map((o, i) => i === index ? { ...o, isSaving: false } : o)
           );
        }

     } catch (error) {
       console.error(`[Save Location] CATCH Error saving origin ${index} location:`, error);
       toast.error("An unexpected error occurred while saving the location.");
        setOrigins(currentOrigins =>
             currentOrigins.map((o, i) => i === index ? { ...o, isSaving: false } : o)
           );
     }
  };

  const addOrigin = () => {
     console.log('[Add Origin Clicked]', {
        canAddLocation,
        plan,
        isLoading,
        isPlanLoading,
        originsLength: origins.length,
        maxLocations,
     });
     if (!canAddLocation) {
          if ((plan === 'starter' || plan === null) && !isPlanLoading) {
            onOpenUpgradeModal?.();
          } else {
            toast.info(`Maximum of ${maxLocations} locations reached for ${plan} tier.`);
          }
          return;
      }
      setOrigins(currentOrigins => {
        const newOrigins = [
          ...currentOrigins,
          { id: `origin-${Date.now()}-${currentOrigins.length}`, address: '', selectedLocationId: 'custom', isSaving: false }
        ];
        
        // Track location addition
        trackLocationChange('added', newOrigins.length);
        
        return newOrigins;
      });
  };

  const removeOrigin = (indexToRemove: number) => {
      if (origins.length <= 2) {
          toast.error("Minimum of two locations required.");
          return;
      }
      setOrigins(currentOrigins => {
        const newOrigins = currentOrigins.filter((_, index) => index !== indexToRemove);
        
        // Track location removal
        trackLocationChange('removed', newOrigins.length);
        
        return newOrigins;
      });
  };

  useEffect(() => {
    const startQuery = searchParams.get('start');
    const endQuery = searchParams.get('end');

    setOrigins(currentOrigins => {
        let updated = false;
        const newOrigins = [...currentOrigins];
        if (startQuery && newOrigins[0] && !newOrigins[0].address) {
            console.log('[Form Init] Populating origin 0 from query param:', startQuery);
            newOrigins[0] = { ...newOrigins[0], address: startQuery, selectedLocationId: 'custom' };
            updated = true;
        }
         if (endQuery && newOrigins[1] && !newOrigins[1].address) {
            console.log('[Form Init] Populating origin 1 from query param:', endQuery);
            newOrigins[1] = { ...newOrigins[1], address: endQuery, selectedLocationId: 'custom' };
            updated = true;
        }
        return updated ? newOrigins : currentOrigins;
    });

  }, [searchParams, router, pathname]);

  useEffect(() => {
    setLocations(initialLocations)
  }, [initialLocations])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (origins.length < 2) {
      toast.error("Please provide at least two locations.")
      return
    }
    const emptyOrigin = origins.find(o => !o.address.trim())
    if (emptyOrigin) {
       toast.error("Please ensure all location fields are filled.")
       return
    }
    if (origins.length > maxLocations) {
        const tierName = plan === 'plus' ? 'Plus' : plan === 'pro' ? 'Pro' : plan === 'business' ? 'Business' : 'Pro';
        toast.error(`This search requires ${origins.length} locations. Please upgrade to ${tierName} or higher.`);
        return;
    }

    setIsLoading(true)

    // Track search start
    const searchStartTime = Date.now();
    trackSearch(origins.length);

    try {
       const geocodedOrigins = await Promise.all(
         origins.map(async (origin) => {
           const selectedLocation = locations.find(loc => loc.id === origin.selectedLocationId);

           if (selectedLocation && selectedLocation.address === origin.address) {
             console.log(`Using saved data for origin: ${origin.address}`);
             return {
               lat: selectedLocation.latitude,
               lng: selectedLocation.longitude,
               display_name: selectedLocation.address
             };
           } else {
             console.log(`Geocoding origin: ${origin.address}`);
             const result = await geocodeLocationAction(origin.address);
             if (!result.isSuccess || !result.data) {
               throw new Error(`Failed to geocode: ${origin.address} (${result.message})`);
             }
             return {
               lat: result.data.lat,
               lng: result.data.lon,
               display_name: result.data.display_name || origin.address
             };
           }
         })
       );

       console.log("Geocoded Origins:", geocodedOrigins);

       console.log("Ready to call onFindMidpoint with:", geocodedOrigins);

       onFindMidpoint({
         origins: geocodedOrigins.map(origin => ({
           lat: origin.lat,
           lng: origin.lng,
           display_name: origin.display_name
         }))
       });

       router.replace(pathname, { scroll: false });

       // Track successful search completion
       track(ANALYTICS_EVENTS.SEARCH_COMPLETED, {
         location_count: origins.length,
         search_duration_ms: Date.now() - searchStartTime,
         has_saved_locations: origins.some(o => o.selectedLocationId && o.selectedLocationId !== 'custom'),
       });

    } catch (error: any) {
      console.error("Error during geocoding/submission:", error)
      toast.error(error.message || "An error occurred during submission.")
      
             // Track search failure
       track(ANALYTICS_EVENTS.SEARCH_FAILED, {
        location_count: origins.length,
        search_duration_ms: Date.now() - searchStartTime,
        error_message: error.message,
        error_type: 'geocoding_submission',
      });
    } finally {
      setIsLoading(false)
    }
  }

  if (isPlanLoading) {
    return (
         <Card>
             <CardHeader><CardTitle>Find Your Midpoint</CardTitle></CardHeader>
             <CardContent><div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /> Loading user plan...</div></CardContent>
         </Card>
    );
  }
   if (planError) {
     return (
         <Card>
             <CardHeader><CardTitle>Find Your Midpoint</CardTitle></CardHeader>
             <CardContent><div className="text-destructive p-4">Error loading user plan: {planError.message}</div></CardContent>
         </Card>
     );
   }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Find Your Midpoint</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">

          {origins.map((origin, index) => (
            <div key={origin.id} className="space-y-2 border-b pb-4 last:border-b-0 last:pb-0">
               <div className="flex justify-between items-center">
                 <Label htmlFor={`origin-input-${index}`}>
                    Location {index + 1} {index === 0 ? '(Start)' : ''}
                 </Label>
                 {origins.length > 2 && index >= 0 && (
                     <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOrigin(index)}
                        disabled={isLoading}
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        aria-label={`Remove location ${index + 1}`}
                     >
                        <XCircle className="h-4 w-4" />
                     </Button>
                 )}
               </div>

              {locations.length > 0 && (
                <Select
                  value={origin.selectedLocationId}
                  onValueChange={(value) => handleOriginLocationSelect(index, value)}
                  disabled={isLoading || origin.isSaving}
                >
                  <SelectTrigger id={`origin-select-${index}`}>
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
                  id={`origin-input-${index}`}
                  placeholder={`Enter address for location ${index + 1}`}
                  value={origin.address}
                  onChange={(e) => handleOriginAddressChange(index, e.target.value)}
                  disabled={isLoading || origin.isSaving}
                  className="flex-grow"
                  required
                />
                {isSignedIn && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleSaveOriginLocation(index)}
                    disabled={!origin.address || isLoading || origin.isSaving}
                    aria-label={`Save location ${index + 1}`}
                  >
                    {origin.isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Bookmark className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}

           <div className="pt-2">
                <Button
                     type="button"
                     variant="outline"
                     className="w-full"
                     onClick={addOrigin}
                     disabled={!canAddLocation || isLoading || isPlanLoading}
                     aria-label="Add another location"
                 >
                    <PlusCircle className="mr-2 h-4 w-4" />
                     Add Location
                     {!canAddLocation && (plan === 'starter' || plan === null) && !isPlanLoading && ' (Upgrade for more)'}
                     {!canAddLocation && plan && plan !== 'starter' && ` (Max ${maxLocations} reached)`}
                 </Button>
           </div>

          <Button
             type="submit"
             disabled={isLoading || isPlanLoading || origins.some(o => o.isSaving)}
             className="w-full"
          >
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
