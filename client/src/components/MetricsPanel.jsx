export default function MetricsPanel({ metrics }) {
  if (!metrics) return null;

  const comparison = metrics.algorithmComparison;
  const dijkstraData = comparison?.primary || comparison?.dijkstra;
  const secondaryData = comparison?.secondary || comparison?.bellmanFord;
  const winnerName = comparison?.weightedWinner || comparison?.fasterAlgorithm;
  const dijkstraWinner = winnerName === "Dijkstra";
  const secondaryWinner =
    secondaryData?.name && winnerName === secondaryData.name;
  const speedupLabel = comparison?.speedup
    ? `${comparison.speedup}x faster`
    : "N/A";

  const formatCount = (value) =>
    Number.isFinite(value) ? value.toLocaleString() : "N/A";

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

      {comparison && dijkstraData && secondaryData && (
        <div className="algo-compare">
          <h3 className="algo-compare__title">Algorithm Comparison</h3>
          <div className="algo-compare__grid">
            <div className={`algo-compare__card ${dijkstraWinner ? 'algo-compare__card--winner' : ''}`}>
              <div className="algo-compare__label">Dijkstra</div>
              <div className="algo-compare__time">{dijkstraData.executionTime?.toFixed(2) || '0'} ms</div>
              <div className="algo-compare__meta">Distance: {dijkstraData.distance?.toFixed(3) || '0'} km</div>
              <div className="algo-compare__meta">Complexity: {dijkstraData.timeComplexity}</div>
              <div className="algo-compare__meta">Nodes explored: {formatCount(dijkstraData.nodesExplored)}</div>
              <div className="algo-compare__meta">Edges checked: {formatCount(dijkstraData.edgesConsidered)}</div>
              <div className="algo-compare__meta">Heap operations: {formatCount(dijkstraData.heapOperations)}</div>
              <div className="algo-compare__meta">Weighted score: {dijkstraData.weightedScore ?? 'N/A'}</div>
            </div>

            <div className={`algo-compare__card ${secondaryWinner ? 'algo-compare__card--winner' : ''}`}>
              <div className="algo-compare__label">{secondaryData.name}</div>
              <div className="algo-compare__time">{secondaryData.executionTime?.toFixed(2) || '0'} ms</div>
              <div className="algo-compare__meta">Distance: {secondaryData.distance?.toFixed(3) || 'N/A'} km</div>
              <div className="algo-compare__meta">Complexity: {secondaryData.timeComplexity}</div>
              <div className="algo-compare__meta">Nodes explored: {formatCount(secondaryData.nodesExplored)}</div>
              <div className="algo-compare__meta">Edges checked: {formatCount(secondaryData.edgesConsidered)}</div>
              <div className="algo-compare__meta">Relaxations: {formatCount(secondaryData.relaxations)}</div>
              <div className="algo-compare__meta">Heuristic calls: {formatCount(secondaryData.heuristicCalls)}</div>
              <div className="algo-compare__meta">Weighted score: {secondaryData.weightedScore ?? 'N/A'}</div>
            </div>
          </div>

          <div className="algo-compare__evidence-grid">
            <div className="algo-compare__evidence-card">
              <span className="algo-compare__evidence-label">Winner (Weighted Score)</span>
              <strong>{winnerName || 'N/A'}</strong>
            </div>
            <div className="algo-compare__evidence-card">
              <span className="algo-compare__evidence-label">Runtime Speedup</span>
              <strong>{speedupLabel}</strong>
            </div>
            <div className="algo-compare__evidence-card">
              <span className="algo-compare__evidence-label">Node Reduction vs Dijkstra</span>
              <strong>
                {comparison.nodeReductionPercent !== null && comparison.nodeReductionPercent !== undefined
                  ? `${comparison.nodeReductionPercent}%`
                  : 'N/A'}
              </strong>
            </div>
            <div className="algo-compare__evidence-card">
              <span className="algo-compare__evidence-label">Edge Check Reduction vs Dijkstra</span>
              <strong>
                {comparison.edgeReductionPercent !== null && comparison.edgeReductionPercent !== undefined
                  ? `${comparison.edgeReductionPercent}%`
                  : 'N/A'}
              </strong>
            </div>
          </div>

          <div className="algo-compare__summary">
            <strong>Scoring:</strong> {comparison?.scoringModel?.formula || 'normalized weighted score'} (lower is better). 
            <strong> Runtime winner:</strong> {comparison.runtimeWinner || 'N/A'}. 
            <strong> Optimality check:</strong> {comparison.optimalityEvidence ||
              (comparison.sameDistance
                ? 'Same shortest distance found.'
                : 'Different path distance observed.')}
          </div>
        </div>
      )}

      {!comparison && (
        <div className="algo-compare algo-compare--unavailable">
          <h3 className="algo-compare__title">Algorithm Comparison</h3>
          <div className="algo-compare__summary">
            Comparison data not available from backend. Restart backend with latest code and compute again.
          </div>
        </div>
      )}
    </section>
  );
}
