import { useState, useCallback, useRef } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "400px",
  borderRadius: "16px"
};

const defaultCenter = {
  lat: 18.5204, 
  lng: 73.8567
};

export function LocationPicker({ onLocationSelect, initialLocation }) {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_MAPS_API_KEY,
    libraries: ["places"]
  });

  const [position, setPosition] = useState(initialLocation?.lat ? { lat: Number(initialLocation.lat), lng: Number(initialLocation.lng) } : defaultCenter);
  const mapRef = useRef(null);

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const getAddress = useCallback((lat, lng) => {
    if (!window.google) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results[0]) {
        onLocationSelect({
          lat,
          lng,
          address: results[0].formatted_address
        });
      }
    });
  }, [onLocationSelect]);

  const onMarkerDragEnd = useCallback((e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setPosition({ lat, lng });
    getAddress(lat, lng);
  }, [getAddress]);

  const onMapClick = useCallback((e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setPosition({ lat, lng });
    getAddress(lat, lng);
  }, [getAddress]);

  if (!isLoaded) return <div className="text-sm text-slate-400 p-4 glass rounded-xl">Loading Map...</div>;

  return (
    <div className="space-y-4">
      <div className="text-xs text-slate-400 mb-2">Drag the marker or click on the map to select the exact location.</div>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={position}
        zoom={15}
        onLoad={onMapLoad}
        onClick={onMapClick}
        options={{
          disableDefaultUI: false,
          clickableIcons: false
        }}
      >
        <Marker
          position={position}
          draggable={true}
          onDragEnd={onMarkerDragEnd}
        />
      </GoogleMap>
    </div>
  );
}
