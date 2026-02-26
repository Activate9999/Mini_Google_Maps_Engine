import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "../utils/googleMapsLoader.js";

function MapView({ locations, path, alternativePaths, apiKey }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);
  const alternativePolylinesRef = useRef([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!apiKey || !mapRef.current) return;

    loadGoogleMaps(apiKey)
      .then((maps) => {
        if (mapInstanceRef.current) return;
        mapInstanceRef.current = new maps.Map(mapRef.current, {
          center: { lat: 28.6139, lng: 77.209 },
          zoom: 12,
          mapId: "mini-maps"
        });
      })
      .catch(() => setLoadError("Unable to load map"));
  }, [apiKey]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.google) return;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();

    locations.forEach((location, index) => {
      const marker = new window.google.maps.Marker({
        map,
        position: location,
        label: `${index + 1}`
      });
      markersRef.current.push(marker);
      bounds.extend(location);
    });

    if (locations.length > 0) {
      map.fitBounds(bounds);
    }
  }, [locations]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.google) return;

    // Clear existing polylines
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    alternativePolylinesRef.current.forEach((poly) => poly.setMap(null));
    alternativePolylinesRef.current = [];

    // Draw alternative paths (red) first so optimal appears on top
    if (alternativePaths && alternativePaths.length > 0) {
      alternativePaths.forEach((alt) => {
        if (alt.path && alt.path.length >= 2) {
          const altPolyline = new window.google.maps.Polyline({
            path: alt.path,
            geodesic: true,
            strokeColor: "#ff4757",
            strokeOpacity: 0.6,
            strokeWeight: 3
          });
          altPolyline.setMap(map);
          alternativePolylinesRef.current.push(altPolyline);
        }
      });
    }

    // Draw optimal path (blue) on top
    if (path && path.length >= 2) {
      polylineRef.current = new window.google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: "#47f3ff",
        strokeOpacity: 0.95,
        strokeWeight: 5
      });
      polylineRef.current.setMap(map);
    }
  }, [path, alternativePaths]);

  return (
    <div className="map__wrapper">
      {loadError && <p className="error">{loadError}</p>}
      {!apiKey && (
        <p className="error">Add VITE_GOOGLE_MAPS_API_KEY to see the map.</p>
      )}
      <div className="map__canvas" ref={mapRef} />
    </div>
  );
}

export default MapView;
