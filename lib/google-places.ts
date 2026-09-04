import { DepartmentInfo } from "@/types/brief";
export async function getPlaceDetails(placeId: string): Promise<DepartmentInfo> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error("Google Places is not configured.");
  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "name,formatted_address,formatted_phone_number,website,geometry");
  url.searchParams.set("key", apiKey);
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error("Google Places could not be reached.");
  const data = await response.json();
  if (data.status !== "OK")
    throw new Error(
      data.status === "INVALID_REQUEST" || data.status === "NOT_FOUND"
        ? "That Google Place ID could not be found."
        : `Google Places returned ${data.status}.`,
    );
  const result = data.result;
  return {
    name: result.name || "Unknown department",
    address: result.formatted_address || "Address unavailable",
    phone: result.formatted_phone_number || null,
    website: result.website || null,
    coordinates: {
      lat: result.geometry?.location?.lat ?? 0,
      lng: result.geometry?.location?.lng ?? 0,
    },
    source: {
      label: "Google Maps",
      url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(result.name || "Fire department")}&query_place_id=${encodeURIComponent(placeId)}`,
    },
  };
}
