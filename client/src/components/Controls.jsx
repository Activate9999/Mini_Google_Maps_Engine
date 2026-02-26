import React from 'react';

function Controls({
  locations,
  onRemoveLocation,
  onClear,
  onFindPath,
  graphType,
  onGraphTypeChange,
  kValue,
  onKValueChange,
  startIndex,
  endIndex,
  onStartChange,
  onEndChange,
  roadMode,
  onRoadModeChange,
  detailMode,
  onDetailModeChange,
  waypointSpacingKm,
  onWaypointSpacingChange,
  options,
  canCompute,
  loading
}) {
  return (
    <div className="controls">
      <div className="controls__section">
        <p className="label">Selected locations</p>
        {locations.length === 0 ? (
          <p className="empty">No locations yet.</p>
        ) : (
          <ul className="list">
            {locations.map((location, index) => (
              <li key={`${location.name}-${index}`}>
                <span>{location.name}</span>
                <button type="button" onClick={() => onRemoveLocation(index)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="controls__section">
        <p className="label">Path configuration</p>
        <div className="field">
          <label htmlFor="start">Start</label>
          <select
            id="start"
            value={startIndex}
            onChange={(event) => onStartChange(Number(event.target.value))}
            disabled={locations.length === 0}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="end">End</label>
          <select
            id="end"
            value={endIndex}
            onChange={(event) => onEndChange(Number(event.target.value))}
            disabled={locations.length === 0}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="graph">Graph type</label>
          <select
            id="graph"
            value={graphType}
            onChange={(event) => onGraphTypeChange(event.target.value)}
          >
            <option value="full">Fully connected</option>
            <option value="knn">K-nearest neighbors</option>
          </select>
        </div>
        {graphType === "knn" && (
          <div className="field">
            <label htmlFor="k">Neighbors (k)</label>
            <input
              id="k"
              type="number"
              min="1"
              max="10"
              value={kValue}
              onChange={(event) => onKValueChange(Number(event.target.value))}
            />
          </div>
        )}
        <div className="field field--inline">
          <label htmlFor="roadMode">Use road routing</label>
          <input
            id="roadMode"
            type="checkbox"
            checked={roadMode}
            onChange={(event) => onRoadModeChange(event.target.checked)}
          />
        </div>
        {roadMode && (
          <>
            <div className="field field--inline">
              <label htmlFor="detailMode">High detail routing</label>
              <input
                id="detailMode"
                type="checkbox"
                checked={detailMode === "segment"}
                onChange={(event) =>
                  onDetailModeChange(event.target.checked ? "segment" : "route")
                }
              />
            </div>
            {detailMode === "segment" && (
              <div className="field">
                <label htmlFor="spacing">Waypoint spacing (km)</label>
                <input
                  id="spacing"
                  type="number"
                  min="1"
                  max="10"
                  step="1"
                  value={waypointSpacingKm}
                  onChange={(event) =>
                    onWaypointSpacingChange(Number(event.target.value))
                  }
                />
              </div>
            )}
          </>
        )}
      </div>

      <div className="controls__section controls__actions">
        <button type="button" onClick={onFindPath} disabled={!canCompute}>
          {loading ? "Computing..." : "Find Shortest Path"}
        </button>
        <button type="button" className="ghost" onClick={onClear}>
          Clear map
        </button>
      </div>
    </div>
  );
}

export default Controls;
