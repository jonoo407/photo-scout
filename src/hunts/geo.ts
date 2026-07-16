/* One-shot device location for the hunt geo rule (handoff 2d: the shot must
   be taken within 150 m of the stop — the server re-checks the distance). */
export function getPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Location is not available on this device.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(new Error(
        err.code === err.PERMISSION_DENIED
          ? 'Location permission is needed to verify you are at the stop.'
          : 'Could not get your location — try again outside.',
      )),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    )
  })
}
