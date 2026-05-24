export type StructuredPoiAddress = {
  street?: string;
  city?: string;
};

export type NavigationPoiInput = {
  name?: string;
  lat: number | string;
  lon?: number | string;
  lng?: number | string;
  address?: StructuredPoiAddress | string;
};

export type NavigationPlatform = "web" | "native-ios";

export type PoiNavigationLinks = {
  google: string;
  apple: string;
  waze: string;
};

function getLongitude(input: NavigationPoiInput): number | string {
  if (input.lng !== undefined && input.lng !== null && input.lng !== "") {
    return input.lng;
  }
  if (input.lon !== undefined && input.lon !== null && input.lon !== "") {
    return input.lon;
  }
  return 0;
}

function getPoiName(input: NavigationPoiInput): string {
  return input.name?.trim() || "Location";
}

function getStructuredAddress(input: NavigationPoiInput): {
  hasAddress: boolean;
  addressLine: string;
  searchQuery: string;
} {
  const poiName = getPoiName(input);

  if (typeof input.address === "string" && input.address.trim()) {
    const addressLine = input.address.trim();
    return {
      hasAddress: true,
      addressLine,
      searchQuery: `${poiName}, ${addressLine}`,
    };
  }

  if (
    input.address &&
    typeof input.address === "object" &&
    input.address.street &&
    input.address.city
  ) {
    const addressLine = `${input.address.street}, ${input.address.city}`;
    return {
      hasAddress: true,
      addressLine,
      searchQuery: `${poiName}, ${addressLine}`,
    };
  }

  return {
    hasAddress: false,
    addressLine: "",
    searchQuery: poiName,
  };
}

export function buildPoiNavigationLinks(
  input: NavigationPoiInput,
  options: { platform?: NavigationPlatform } = {}
): PoiNavigationLinks {
  const platform = options.platform ?? "web";
  const lat = input.lat;
  const lon = getLongitude(input);
  const poiName = getPoiName(input);
  const { hasAddress, addressLine, searchQuery } = getStructuredAddress(input);

  const google = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;

  let apple: string;
  if (platform === "native-ios") {
    if (hasAddress) {
      apple = `maps://?q=${encodeURIComponent(poiName)}&address=${encodeURIComponent(addressLine)}`;
    } else {
      apple = `maps://?q=${encodeURIComponent(poiName)}&ll=${lat},${lon}`;
    }
  } else if (hasAddress) {
    apple = `http://maps.apple.com/?q=${encodeURIComponent(poiName)}&address=${encodeURIComponent(addressLine)}`;
  } else {
    apple = `http://maps.apple.com/?q=${encodeURIComponent(poiName)}&sll=${lat},${lon}&z=15`;
  }

  const waze = `https://www.waze.com/ul?q=${encodeURIComponent(searchQuery)}&ll=${lat},${lon}&navigate=yes`;

  return { google, apple, waze };
}

export function getPoiCardId(poiKey: string): string {
  return `poi-card-${encodeURIComponent(poiKey)}`;
}
