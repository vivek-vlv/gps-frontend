// components/MapView.jsx
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons broken by Vite bundling
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export default function MapView({ lat, lng, onLocationChange }) {
  const mapRef    = useRef(null);
  const markerRef = useRef(null);
  const leafletRef = useRef(null);

  // Initialise map (always) – use fallback coordinates if none supplied
  useEffect(() => {
    const hasValidCoords = typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng);
    const defaultPos = [21.367733, 74.248365]; // Nandurbar fallback
    const initialPos = hasValidCoords ? [lat, lng] : defaultPos;

    // If map already exists, just update view (and marker if present)
    if (leafletRef.current) {
      leafletRef.current.setView(initialPos, 15);
      if (markerRef.current && hasValidCoords) {
        markerRef.current.setLatLng([lat, lng]);
      }
      requestAnimationFrame(() => leafletRef.current.invalidateSize());
      setTimeout(() => leafletRef.current.invalidateSize(), 200);
      return;
    }

    // First initialisation
    const map = L.map(mapRef.current, { zoomControl: true, preferCanvas: true }).setView(initialPos, 15);

    L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      attribution: '&copy; Google Maps',
      minZoom: 5,
      maxZoom: 20,
    }).addTo(map);

    // Create marker only if we have valid coordinates initially
    const marker = hasValidCoords ? L.marker([lat, lng], { draggable: true }).addTo(map) : null;
    if (marker) {
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onLocationChange(pos.lat, pos.lng, 'adjusted');
      });
    }

    // Click anywhere to set/replace marker
    map.on('click', (e) => {
      if (marker) {
        marker.setLatLng(e.latlng);
      } else {
        const newMarker = L.marker(e.latlng, { draggable: true }).addTo(map);
        markerRef.current = newMarker;
        newMarker.on('dragend', () => {
          const pos = newMarker.getLatLng();
          onLocationChange(pos.lat, pos.lng, 'adjusted');
        });
      }
      onLocationChange(e.latlng.lat, e.latlng.lng, 'adjusted');
    });

    leafletRef.current = map;
    markerRef.current = marker;

    // Ensure the map container renders correctly
    requestAnimationFrame(() => map.invalidateSize());
    setTimeout(() => map.invalidateSize(), 200);
    setTimeout(() => map.invalidateSize(), 600);
  }, [lat, lng]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (leafletRef.current) {
        leafletRef.current.remove();
        leafletRef.current = null;
        markerRef.current  = null;
      }
    };
  }, []);

  return <div id="map" ref={mapRef} style={{ height: '400px', width: '100%' }} />;
}
