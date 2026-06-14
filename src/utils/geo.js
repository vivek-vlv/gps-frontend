// utils/geo.js – Browser Geolocation helper

/** Ask the browser for the user's current position.
 *  Returns { lat, lng } on success, or null on failure/unavailable. */
export function getLiveLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        console.warn('Geolocation error:', err.message);
        resolve(null);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  });
}
