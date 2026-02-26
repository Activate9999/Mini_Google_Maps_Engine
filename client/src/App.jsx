import { useMemo, useState } from "react";
import axios from "axios";
import Controls from "./components/Controls.jsx";
import LocationSearch from "./components/LocationSearch.jsx";
import MapView from "./components/MapView.jsx";
import MetricsPanel from "./components/MetricsPanel.jsx";

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function App() {
  const [locations, setLocations] = useState([]);
  const [path, setPath] = useState([]);
  const [distance, setDistance] = useState(null);
  const [routeSummary, setRouteSummary] = useState("");
  const [routeDuration, setRouteDuration] = useState("");
  const [alternativePaths, setAlternativePaths] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [graphType, setGraphType] = useState("full");
  const [kValue, setKValue] = useState(3);
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(0);
  const [roadMode, setRoadMode] = useState(true);
  const [detailMode, setDetailMode] = useState("segment");
  const [waypointSpacingKm, setWaypointSpacingKm] = useState(3);

  const canCompute = locations.length >= 2 && !loading;

  const startOptions = useMemo(
    () =>
      locations.map((location, index) => ({
        value: index,
        label: `${index + 1}. ${location.name}`
      })),
    [locations]
  );

  const handleAddLocation = (place) => {
    if (!place) return;
    setLocations((prev) => {
      const next = [...prev, place];
      setEndIndex(Math.max(0, next.length - 1));
      return next;
    });
    setPath([]);
    setAlternativePaths([]);
    setDistance(null);
    setRouteSummary("");
    setRouteDuration("");
    setMetrics(null);
    setSteps([]);
    setError("");
  };

  const handleRemoveLocation = (index) => {
    setLocations((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      setStartIndex(0);
      setEndIndex(Math.max(0, next.length - 1));
      return next;
    });
    setPath([]);
    setAlternativePaths([]);
    setDistance(null);
    setRouteSummary("");
    setRouteDuration("");
    setMetrics(null);
    setSteps([]);
    setError("");
  };

  const handleClear = () => {
    setLocations([]);
    setPath([]);
    setAlternativePaths([]);
    setDistance(null);
    setRouteSummary("");
    setRouteDuration("");
    setMetrics(null);
    setSteps([]);
    setError("");
    setStartIndex(0);
    setEndIndex(0);
  };

  const handleFindPath = async () => {
    if (!canCompute) return;
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(`${BACKEND_URL}/api/shortest-path`, {
        locations,
        startIndex,
        endIndex,
        graphType,
        k: graphType === "knn" ? kValue : undefined,
        roadMode,
        detailMode: roadMode ? detailMode : "route",
        waypointSpacingKm: roadMode ? waypointSpacingKm : 0
      });

      setPath(response.data.path || []);
      setDistance(response.data.distance ?? null);
      setRouteSummary(response.data.summary || "");
      setRouteDuration(response.data.duration || "");
      setAlternativePaths(response.data.alternatives || []);
      setMetrics(response.data.metrics || null);
      setSteps(response.data.steps || []);
    } catch (err) {
      const message = err?.response?.data?.error || "Unable to compute path";
      setError(message);
      setPath([]);
      setDistance(null);
      setRouteSummary("");
      setRouteDuration("");
      setAlternativePaths([]);
      setMetrics(null);
      setSteps([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="app__header">
        <div className="hero">
          <p className="eyebrow">Mini Google Maps Engine</p>
          <h1>Shortest Path Finder</h1>
          <p className="subtitle">
            Build weighted graphs from real places and render road-aware paths.
          </p>
        </div>
        <div className="status">
          <div className="stat">
            <span className="stat__label">Locations</span>
            <span className="stat__value">{locations.length}</span>
          </div>
          {distance !== null && !loading && (
            <div className="pill">{distance} km</div>
          )}
          {loading && <span className="spinner" />}
        </div>
      </header>

      <div className="app__content">
        <section className="panel">
          <LocationSearch
            apiKey={GOOGLE_MAPS_KEY}
            onAddLocation={handleAddLocation}
            disabled={!GOOGLE_MAPS_KEY}
          />

          <Controls
            locations={locations}
            onRemoveLocation={handleRemoveLocation}
            onClear={handleClear}
            onFindPath={handleFindPath}
            graphType={graphType}
            onGraphTypeChange={setGraphType}
            kValue={kValue}
            onKValueChange={setKValue}
            startIndex={startIndex}
            endIndex={endIndex}
            onStartChange={setStartIndex}
            onEndChange={setEndIndex}
            roadMode={roadMode}
            onRoadModeChange={setRoadMode}
            detailMode={detailMode}
            onDetailModeChange={setDetailMode}
            waypointSpacingKm={waypointSpacingKm}
            onWaypointSpacingChange={setWaypointSpacingKm}
            options={startOptions}
            canCompute={canCompute}
            loading={loading}
          />

          {error && <p className="error">{error}</p>}
        </section>

        <section className="map">
          <MapView
            locations={locations}
            path={path}
            alternativePaths={alternativePaths}
            apiKey={GOOGLE_MAPS_KEY}
          />
        </section>
      </div>

      {(path.length > 0 || alternativePaths.length > 0) && (
        <section className="path-summary">
          <h2 className="path-summary__title">Path Analysis</h2>
          <div className="path-list">
            {path.length > 0 && (
              <div className="path-item path-item--optimal">
                <div className="path-item__header">
                  <span className="path-item__badge">Optimal</span>
                  <span className="path-item__distance">{distance} km</span>
                </div>
                <p className="path-item__route">
                  {routeSummary || "Shortest path via Dijkstra algorithm"}
                </p>
                {routeDuration && (
                  <p className="path-item__duration">
                    <span className="duration-icon">⏱️</span> Estimated: {routeDuration}
                  </p>
                )}
              </div>
            )}
            {alternativePaths.length > 0 ? (
              alternativePaths.map((alt, idx) => (
                <div key={idx} className="path-item path-item--alternative">
                  <div className="path-item__header">
                    <span className="path-item__badge">Alternative {idx + 1}</span>
                    <span className="path-item__distance">
                      {alt.distance} km
                      {alt.percentLonger > 0 && (
                        <span className="percent-diff"> (+{alt.percentLonger}%)</span>
                      )}
                    </span>
                  </div>
                  <p className="path-item__route">
                    {alt.summary || `Via: ${alt.waypoints.join(" → ")}`}
                  </p>
                  {alt.duration && (
                    <p className="path-item__duration">
                      <span className="duration-icon">⏱️</span> Estimated: {alt.duration}
                    </p>
                  )}
                </div>
              ))
            ) : (
              path.length > 0 && locations.length === 2 && (
                <div className="path-item path-item--info">
                  <p className="path-item__route">
                    Only one direct route available for this path
                  </p>
                </div>
              )
            )}
          </div>
        </section>
      )}

      {metrics && <MetricsPanel metrics={metrics} />}
    </div>
  );
}

export default App;
