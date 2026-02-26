import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "../utils/googleMapsLoader.js";

function LocationSearch({ apiKey, onAddLocation, disabled }) {
  const inputRef = useRef(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!apiKey || !inputRef.current) return;

    let autocomplete;

    loadGoogleMaps(apiKey)
      .then((maps) => {
        autocomplete = new maps.places.Autocomplete(inputRef.current, {
          fields: ["name", "geometry"]
        });

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (!place.geometry) {
            setError("No geometry data available for that place");
            setSelectedPlace(null);
            return;
          }

          setError("");
          setSelectedPlace({
            name: place.name,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          });
        });
      })
      .catch(() => setError("Unable to load Google Maps"));

    return () => {
      if (autocomplete) {
        window.google.maps.event.clearInstanceListeners(autocomplete);
      }
    };
  }, [apiKey]);

  const handleAdd = () => {
    if (!selectedPlace) {
      setError("Select a place from the suggestions");
      return;
    }
    onAddLocation(selectedPlace);
    setSelectedPlace(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="search">
      <label htmlFor="place" className="label">
        Search locations
      </label>
      <div className="search__row">
        <input
          id="place"
          ref={inputRef}
          type="text"
          placeholder="Type a city, landmark, or address"
          disabled={disabled}
        />
        <button type="button" onClick={handleAdd} disabled={disabled}>
          Add
        </button>
      </div>
      {error && <p className="hint">{error}</p>}
    </div>
  );
}

export default LocationSearch;
