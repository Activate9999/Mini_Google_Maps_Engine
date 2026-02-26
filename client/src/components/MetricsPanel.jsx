export default function MetricsPanel({ metrics }) {
  if (!metrics) return null;

  return (
    <section className="metrics-panel panel">
      <h2 className="metrics-panel__title">Performance Metrics</h2>
      
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-card__label">Execution Time</div>
          <div className="metric-card__value">{metrics.executionTime?.toFixed(2) || '0'} ms</div>
          <div className="metric-card__desc">Algorithm runtime (microsecond precision)</div>
        </div>

        <div className="metric-card metric-card--highlight">
          <div className="metric-card__label">Path Length</div>
          <div className="metric-card__value">{metrics.pathLength || 0} hops</div>
          <div className="metric-card__desc">Number of waypoints in path</div>
        </div>

        <div className="metric-card">
          <div className="metric-card__label">Detour Factor</div>
          <div className="metric-card__value">{metrics.detourFactor || '0'}x</div>
          <div className="metric-card__desc">Actual vs straight-line distance</div>
        </div>

        <div className="metric-card metric-card--complexity">
          <div className="metric-card__label">Time Complexity</div>
          <div className="metric-card__value complexity-formula">
            {metrics.timeComplexity}
          </div>
          <div className="metric-card__desc">Guaranteed optimal path</div>
        </div>

        <div className="metric-card">
          <div className="metric-card__label">Routing Mode</div>
          <div className="metric-card__value">{metrics.routingMode || 'N/A'}</div>
          <div className="metric-card__desc">Distance calculation method</div>
        </div>

        <div className="metric-card metric-card--complexity">
          <div className="metric-card__label">Space Complexity</div>
          <div className="metric-card__value">{metrics.spaceComplexity}</div>
          <div className="metric-card__desc">MinHeap + Distance array</div>
        </div>

        <div className="metric-card metric-card--highlight">
          <div className="metric-card__label">Graph Type</div>
          <div className="metric-card__value">{metrics.graphType || 'N/A'}</div>
          <div className="metric-card__desc">Graph construction method</div>
        </div>

        <div className="metric-card metric-card--highlight">
          <div className="metric-card__label">Algorithm</div>
          <div className="metric-card__value">Dijkstra</div>
          <div className="metric-card__desc">MinHeap Priority Queue</div>
        </div>

        <div className="metric-card">
          <div className="metric-card__label">Total Distance</div>
          <div className="metric-card__value">{metrics.totalDistance?.toFixed(1) || '0'} km</div>
          <div className="metric-card__desc">Final path distance (actual route)</div>
        </div>

        <div className="metric-card">
          <div className="metric-card__label">Straight-line Distance</div>
          <div className="metric-card__value">{metrics.straightLineDistance?.toFixed(1) || '0'} km</div>
          <div className="metric-card__desc">Great-circle distance (direct)</div>
        </div>
      </div>
    </section>
  );
}
