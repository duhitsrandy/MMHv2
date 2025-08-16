import React, { createContext, useContext, useState } from 'react';

type TravelInfo = {
  duration: number | null; // seconds
  distance: number | null; // meters
  sourceIndex: number;
};

type Poi = {
  lat: number;
  lng: number;
  name?: string;
  address?: string;
  type?: string;
  travelInfo?: TravelInfo[];
};

type PoiContextType = {
  pois: Poi[];
  setPois: (pois: Poi[]) => void;
  midpoint: { lat: number; lng: number } | null;
  setMidpoint: (midpoint: { lat: number; lng: number } | null) => void;
  alternateMidpoint: { lat: number; lng: number } | null;
  setAlternateMidpoint: (midpoint: { lat: number; lng: number } | null) => void;
  selectedPoi: Poi | null;
  setSelectedPoi: (poi: Poi | null) => void;
};

const PoiContext = createContext<PoiContextType | undefined>(undefined);

export function PoiProvider({ children }: { children: React.ReactNode }) {
  const [pois, setPois] = useState<Poi[]>([]);
  const [midpoint, setMidpoint] = useState<{ lat: number; lng: number } | null>(null);
  const [alternateMidpoint, setAlternateMidpoint] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedPoi, setSelectedPoi] = useState<Poi | null>(null);

  return (
    <PoiContext.Provider value={{
      pois,
      setPois,
      midpoint,
      setMidpoint,
      alternateMidpoint,
      setAlternateMidpoint,
      selectedPoi,
      setSelectedPoi,
    }}>
      {children}
    </PoiContext.Provider>
  );
}

export function usePoi() {
  const context = useContext(PoiContext);
  if (context === undefined) {
    throw new Error('usePoi must be used within a PoiProvider');
  }
  return context;
}
