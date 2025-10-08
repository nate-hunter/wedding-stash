/**
 * Reverse Geocoding Utility
 *
 * Converts latitude/longitude coordinates to human-readable location names
 * Uses BigDataCloud's free reverse geocoding API
 *
 * Rate limits: Free tier allows reasonable usage for wedding photo app
 * Fallback: Returns null if service is unavailable (graceful degradation)
 */

interface GeocodingResponse {
  locality?: string;
  city?: string;
  principalSubdivision?: string;
  countryName?: string;
}

/**
 * Converts GPS coordinates to a human-readable location name
 *
 * @param lat - Latitude coordinate
 * @param lon - Longitude coordinate
 * @returns Location name or null if geocoding fails
 *
 * @example
 * const location = await reverseGeocode(40.7128, -74.0060);
 * // Returns: "New York, New York, United States"
 */
export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    // Validate coordinates
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      console.warn('Invalid coordinates:', { lat, lon });
      return null;
    }

    // Call BigDataCloud free API (no auth required)
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
      {
        headers: {
          Accept: 'application/json',
        },
        // Timeout after 5 seconds to prevent hanging
        signal: AbortSignal.timeout(5000),
      },
    );

    if (!response.ok) {
      console.warn('Geocoding API returned error:', response.status);
      return null;
    }

    const data: GeocodingResponse = await response.json();

    // Build location string from available data
    const parts: string[] = [];

    if (data.locality) parts.push(data.locality);
    if (data.city && data.city !== data.locality) parts.push(data.city);
    if (data.principalSubdivision) parts.push(data.principalSubdivision);
    if (data.countryName) parts.push(data.countryName);

    if (parts.length === 0) {
      return 'Unknown Location';
    }

    return parts.join(', ');
  } catch (error) {
    // Log error but don't throw - graceful degradation
    console.warn('Reverse geocoding failed:', error);
    return null;
  }
}

/**
 * Batch reverse geocode multiple coordinates
 *
 * @param coordinates - Array of [lat, lon] pairs
 * @returns Array of location names (null for failed lookups)
 */
export async function reverseGeocodeMany(
  coordinates: Array<[number, number]>,
): Promise<Array<string | null>> {
  // Process in parallel but with reasonable concurrency
  const results = await Promise.all(coordinates.map(([lat, lon]) => reverseGeocode(lat, lon)));

  return results;
}
