import { buildPoiNavigationLinks } from "@shared/poi-navigation-links";
import { EnrichedPoi } from "@/types/poi-types";
import { GeocodedOrigin, UserPlan } from "@/types";

export function createPopupContent(
  poi: EnrichedPoi,
  originLocations: GeocodedOrigin[],
  plan: UserPlan | null
): string {
  const links = buildPoiNavigationLinks(
    {
      name: poi.name,
      lat: poi.lat,
      lon: poi.lon,
      address: poi.address,
    },
    { platform: "web" }
  );

  let content = `<div style="min-width: 220px; max-width: 280px;">`;
  content += `<div class="font-bold text-base mb-1">${poi.name}</div>`;
  content += `<div class="text-sm text-gray-600 mb-2">${poi.type}</div>`;

  if (poi.address) {
    const street = poi.address.street || "";
    const city = poi.address.city || "";
    const shortAddress = street ? `${street}, ${city}` : city;
    if (shortAddress) {
      content += `<div class="text-xs text-gray-500 mb-2 truncate" title="${street && city ? street + ", " + city : street || city}">${shortAddress}</div>`;
    }
  }

  if (poi.travelInfo && poi.travelInfo.length > 0) {
    content += '<div class="mt-1 text-xs">';
    content += '<table class="w-full text-left">';
    content += '<thead><tr>';
    content += '<th class="pb-0.5 font-medium text-gray-500">Origin</th>';
    content += '<th class="pb-0.5 font-medium text-gray-500 text-right">Time</th>';
    content += '<th class="pb-0.5 font-medium text-gray-500 text-right">Distance</th>';
    content += '</tr></thead><tbody>';

    poi.travelInfo.forEach((info) => {
      const originName = originLocations[info.sourceIndex]?.display_name;
      const originLabel = originName
        ? originName.length > 18
          ? originName.substring(0, 18) + "..."
          : originName
        : `Loc ${info.sourceIndex + 1}`;
      const durationText =
        info.duration != null ? `${Math.round(info.duration / 60)} min` : "N/A";
      const distanceText =
        info.distance != null
          ? `${Math.round((info.distance / 1000) * 0.621371)} mi`
          : "N/A";

      content += "<tr>";
      content += `<td class="py-0.5 truncate" title="${originName || `Location ${info.sourceIndex + 1}`}">${originLabel}</td>`;
      content += '<td class="py-0.5 text-right whitespace-nowrap">';
      if (plan && plan === "pro" && info.duration !== null) {
        content +=
          '<span class="text-green-500 text-xs font-semibold mr-1" title="Includes real-time traffic">(Live)</span>';
      }
      content += durationText;
      content += "</td>";
      content += `<td class="py-0.5 text-right whitespace-nowrap">${distanceText}</td>`;
      content += "</tr>";
    });
    content += "</tbody></table></div>";
  }

  content += '<div class="mt-3 flex flex-wrap gap-1.5">';
  content += `<a href="${links.google}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100">Google</a>`;
  content += `<a href="${links.apple}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100">Apple</a>`;
  content += `<a href="${links.waze}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100">Waze</a>`;
  content += "</div>";

  content += "</div>";
  return content;
}
