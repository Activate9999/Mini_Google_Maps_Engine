const express = require("express");
const cors = require("cors");
require("dotenv").config();

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

function haversineKm(a, b) {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * R * Math.asin(Math.sqrt(h));
}

class MinHeap {
  constructor() {
    this.heap = [];
  }

  isEmpty() {
    return this.heap.length === 0;
  }

  push(item) {
    this.heap.push(item);
    this._bubbleUp(this.heap.length - 1);
  }

  pop() {
    if (this.isEmpty()) return null;
    const min = this.heap[0];
    const end = this.heap.pop();
    if (!this.isEmpty()) {
      this.heap[0] = end;
      this._sinkDown(0);
    }
    return min;
  }

  _bubbleUp(index) {
    const heap = this.heap;
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (heap[parentIndex].dist <= heap[index].dist) break;
      [heap[parentIndex], heap[index]] = [heap[index], heap[parentIndex]];
      index = parentIndex;
    }
  }

  _sinkDown(index) {
    const heap = this.heap;
    const length = heap.length;
    while (true) {
      let left = index * 2 + 1;
      let right = index * 2 + 2;
      let smallest = index;

      if (left < length && heap[left].dist < heap[smallest].dist) {
        smallest = left;
      }
      if (right < length && heap[right].dist < heap[smallest].dist) {
        smallest = right;
      }
      if (smallest === index) break;
      [heap[smallest], heap[index]] = [heap[index], heap[smallest]];
      index = smallest;
    }
  }
}

function buildDistanceMatrixHaversine(locations) {
  const n = locations.length;
  const matrix = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      const distance = haversineKm(locations[i], locations[j]);
      matrix[i][j] = distance;
      matrix[j][i] = distance;
    }
  }
  return matrix;
}

function buildAdjacencyListFromMatrix(distanceMatrix, graphType, k) {
  const n = distanceMatrix.length;
  const adjacencyList = Array.from({ length: n }, () => []);

  if (graphType === "knn") {
    const neighbors = Math.max(1, Math.min(k || 3, n - 1));
    for (let i = 0; i < n; i += 1) {
      const distances = [];
      for (let j = 0; j < n; j += 1) {
        if (i !== j) {
          const dist = distanceMatrix[i][j];
          if (Number.isFinite(dist)) {
            distances.push({ node: j, dist });
          }
        }
      }
      distances.sort((a, b) => a.dist - b.dist);
      for (let idx = 0; idx < neighbors; idx += 1) {
        const { node, dist } = distances[idx];
        adjacencyList[i].push({ node, weight: dist });
        adjacencyList[node].push({ node: i, weight: dist });
      }
    }

    return { adjacencyList };
  }

  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      const dist = distanceMatrix[i][j];
      if (Number.isFinite(dist)) {
        adjacencyList[i].push({ node: j, weight: dist });
        adjacencyList[j].push({ node: i, weight: dist });
      }
    }
  }

  return { adjacencyList };
}

function chunkArray(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function fetchDistanceMatrix(locations, mode) {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error("GOOGLE_MAPS_API_KEY is required for road routing");
  }

  const n = locations.length;
  const matrix = Array.from({ length: n }, () => Array(n).fill(0));
  const maxChunk = 25;
  const originChunks = chunkArray(
    locations.map((location, index) => ({ location, index })),
    maxChunk
  );
  const destinationChunks = chunkArray(
    locations.map((location, index) => ({ location, index })),
    maxChunk
  );

  for (const origins of originChunks) {
    for (const destinations of destinationChunks) {
      const originsParam = origins
        .map((item) => `${item.location.lat},${item.location.lng}`)
        .join("|");
      const destinationsParam = destinations
        .map((item) => `${item.location.lat},${item.location.lng}`)
        .join("|");

      const params = new URLSearchParams({
        origins: originsParam,
        destinations: destinationsParam,
        mode: mode || "driving",
        key: GOOGLE_MAPS_API_KEY
      });

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/distancematrix/json?${params}`
      );
      const data = await response.json();

      if (data.status !== "OK") {
        throw new Error(data.error_message || "Distance Matrix request failed");
      }

      data.rows.forEach((row, rowIndex) => {
        row.elements.forEach((element, colIndex) => {
          if (element.status !== "OK") {
            matrix[origins[rowIndex].index][destinations[colIndex].index] =
              Infinity;
            return;
          }
          matrix[origins[rowIndex].index][destinations[colIndex].index] =
            element.distance.value / 1000;
        });
      });
    }
  }

  return matrix;
}

function decodePolyline(encoded) {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates = [];

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte;

    do {
      byte = encoded.charCodeAt(index) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
      index += 1;
    } while (byte >= 0x20);

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
      index += 1;
    } while (byte >= 0x20);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    coordinates.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return coordinates;
}

async function fetchDirectionsPolyline(pathCoords, mode) {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error("GOOGLE_MAPS_API_KEY is required for road routing");
  }

  if (pathCoords.length < 2) {
    return pathCoords;
  }

  const origin = `${pathCoords[0].lat},${pathCoords[0].lng}`;
  const destination = `${
    pathCoords[pathCoords.length - 1].lat
  },${pathCoords[pathCoords.length - 1].lng}`;

  const waypoints = pathCoords
    .slice(1, -1)
    .map((point) => `via:${point.lat},${point.lng}`)
    .join("|");

  const params = new URLSearchParams({
    origin,
    destination,
    mode: mode || "driving",
    overview: "full",
    key: GOOGLE_MAPS_API_KEY
  });

  if (waypoints) {
    params.set("waypoints", waypoints);
  }

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/directions/json?${params}`
  );
  const data = await response.json();

  if (data.status !== "OK" || !data.routes?.length) {
    throw new Error(data.error_message || "Directions request failed");
  }

  const route = data.routes[0];
  const detailed = [];

  if (route.legs?.length) {
    for (const leg of route.legs) {
      for (const step of leg.steps || []) {
        if (step.polyline?.points) {
          detailed.push(...decodePolyline(step.polyline.points));
        }
      }
    }
  }

  if (detailed.length) {
    return detailed;
  }

  const encoded = route.overview_polyline?.points;
  return encoded ? decodePolyline(encoded) : pathCoords;
}

async function fetchDirectionsWithAlternatives(pathCoords, mode, maxAlternatives = 3) {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error("GOOGLE_MAPS_API_KEY is required for road routing");
  }

  if (pathCoords.length < 2) {
    return { optimal: pathCoords, alternatives: [] };
  }

  const origin = `${pathCoords[0].lat},${pathCoords[0].lng}`;
  const destination = `${
    pathCoords[pathCoords.length - 1].lat
  },${pathCoords[pathCoords.length - 1].lng}`;

  const waypoints = pathCoords
    .slice(1, -1)
    .map((point) => `via:${point.lat},${point.lng}`)
    .join("|");

  // Fetch main routes with alternatives
  const params = new URLSearchParams({
    origin,
    destination,
    mode: mode || "driving",
    alternatives: "true",
    key: GOOGLE_MAPS_API_KEY
  });

  if (waypoints) {
    params.set("waypoints", waypoints);
  }

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/directions/json?${params}`
  );
  const data = await response.json();

  if (data.status !== "OK" || !data.routes?.length) {
    throw new Error(data.error_message || "Directions request failed");
  }

  const processRoute = (route) => {
    const detailed = [];
    
    if (route.legs?.length) {
      for (const leg of route.legs) {
        for (const step of leg.steps || []) {
          if (step.polyline?.points) {
            detailed.push(...decodePolyline(step.polyline.points));
          }
        }
      }
    }

    if (detailed.length) {
      return detailed;
    }

    const encoded = route.overview_polyline?.points;
    return encoded ? decodePolyline(encoded) : pathCoords;
  };

  const getRouteDistance = (route) => {
    let distance = 0;
    if (route.legs?.length) {
      for (const leg of route.legs) {
        distance += (leg.distance?.value || 0) / 1000; // convert meters to km
      }
    }
    return distance;
  };

  const getRouteDuration = (route) => {
    let duration = 0;
    if (route.legs?.length) {
      for (const leg of route.legs) {
        duration += (leg.duration?.value || 0); // in seconds
      }
    }
    return duration;
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Process all routes from main request
  const allRoutes = data.routes.map((route, idx) => ({
    path: processRoute(route),
    distance: Number(getRouteDistance(route).toFixed(3)),
    duration: getRouteDuration(route),
    durationText: formatDuration(getRouteDuration(route)),
    summary: route.summary || `Route ${idx + 1}`,
    warnings: route.warnings || []
  }));

  // Try to get more alternatives with avoid parameters if we have less than 3
  if (allRoutes.length < 3 && pathCoords.length === 2) {
    const avoidOptions = ['tolls', 'highways', 'ferries'];
    
    for (const avoid of avoidOptions) {
      if (allRoutes.length >= maxAlternatives) break;
      
      const avoidParams = new URLSearchParams({
        origin,
        destination,
        mode: mode || "driving",
        avoid,
        key: GOOGLE_MAPS_API_KEY
      });

      try {
        const avoidResponse = await fetch(
          `https://maps.googleapis.com/maps/api/directions/json?${avoidParams}`
        );
        const avoidData = await avoidResponse.json();

        if (avoidData.status === "OK" && avoidData.routes?.length) {
          const avoidRoute = avoidData.routes[0];
          const newRoute = {
            path: processRoute(avoidRoute),
            distance: Number(getRouteDistance(avoidRoute).toFixed(3)),
            duration: getRouteDuration(avoidRoute),
            durationText: formatDuration(getRouteDuration(avoidRoute)),
            summary: `${avoidRoute.summary || 'Alternative'} (avoiding ${avoid})`,
            warnings: avoidRoute.warnings || []
          };

          // Only add if it's different from existing routes
          const isDuplicate = allRoutes.some(
            r => Math.abs(r.distance - newRoute.distance) < 1
          );

          if (!isDuplicate) {
            allRoutes.push(newRoute);
          }
        }
      } catch (err) {
        // Silently skip if route with avoid parameter fails
      }
    }
  }

  // Sort by distance, shortest first
  allRoutes.sort((a, b) => a.distance - b.distance);

  // First one is optimal, rest are alternatives
  const optimal = allRoutes[0];
  const alternatives = allRoutes.slice(1, maxAlternatives + 1);

  return { optimal, alternatives };
}

function buildSegmentCoords(from, to, spacingKm, maxPoints) {
  if (!spacingKm || spacingKm <= 0) {
    return [from, to];
  }

  const distance = haversineKm(from, to);
  const rawCount = Math.floor(distance / spacingKm) - 1;
  const count = Math.max(0, Math.min(maxPoints, rawCount));

  if (count === 0) {
    return [from, to];
  }

  const points = [from];
  for (let i = 1; i <= count; i += 1) {
    const t = i / (count + 1);
    points.push({
      lat: from.lat + (to.lat - from.lat) * t,
      lng: from.lng + (to.lng - from.lng) * t
    });
  }
  points.push(to);

  return points;
}

async function fetchDetailedPolyline(
  pathCoords,
  mode,
  detailMode,
  waypointSpacingKm
) {
  if (detailMode !== "segment") {
    return fetchDirectionsPolyline(pathCoords, mode);
  }

  const combined = [];
  const maxWaypoints = 3;

  for (let i = 0; i < pathCoords.length - 1; i += 1) {
    const from = pathCoords[i];
    const to = pathCoords[i + 1];
    const segmentCoords = buildSegmentCoords(
      from,
      to,
      waypointSpacingKm,
      maxWaypoints
    );

    // Use per-segment routing to better match local roads.
    const segmentPolyline = await fetchDirectionsPolyline(segmentCoords, mode);
    if (segmentPolyline.length === 0) continue;

    if (combined.length > 0) {
      segmentPolyline.shift();
    }
    combined.push(...segmentPolyline);
  }

  return combined.length ? combined : pathCoords;
}

function dijkstra(adjacencyList, startIndex, endIndex) {
  const n = adjacencyList.length;
  const distances = Array(n).fill(Infinity);
  const previous = Array(n).fill(null);
  const heap = new MinHeap();
  const visited = new Set();
  const steps = [];
  const startTime = performance.now();
  
  let heapOperations = 0;
  let nodesExplored = 0;
  let edgesConsidered = 0;

  distances[startIndex] = 0;
  heap.push({ node: startIndex, dist: 0 });
  heapOperations++;

  while (!heap.isEmpty()) {
    const current = heap.pop();
    heapOperations++;
    if (!current) break;
    const { node, dist } = current;

    if (dist > distances[node]) continue;
    if (visited.has(node)) continue;
    
    visited.add(node);
    nodesExplored++;

    const relaxations = [];

    for (const neighbor of adjacencyList[node]) {
      edgesConsidered++;
      const alt = dist + neighbor.weight;
      const oldDistance = distances[neighbor.node];
      
      if (alt < distances[neighbor.node]) {
        distances[neighbor.node] = alt;
        previous[neighbor.node] = node;
        heap.push({ node: neighbor.node, dist: alt });
        heapOperations++;
        
        const improvement = oldDistance === Infinity 
          ? 'New' 
          : (oldDistance - alt).toFixed(2);
        
        relaxations.push({
          neighbor: neighbor.node,
          oldDistance: oldDistance === Infinity ? 'Infinity' : oldDistance,
          newDistance: alt,
          improvement
        });
      }
    }

    steps.push({
      action: `Exploring node ${node}`,
      currentNode: node,
      currentDistance: dist,
      visited: Array.from(visited),
      heapSize: heap.heap.length,
      relaxations
    });

    if (node === endIndex) break;
  }

  const executionTime = Number((performance.now() - startTime).toFixed(2));

  const path = [];
  let current = endIndex;
  while (current !== null) {
    path.unshift(current);
    current = previous[current];
  }

  if (path[0] !== startIndex) {
    return { 
      distance: Infinity, 
      path: [],
      steps: [],
      metrics: null
    };
  }

  // Calculate total edges in graph
  let totalEdges = 0;
  for (const neighbors of adjacencyList) {
    totalEdges += neighbors.length;
  }
  totalEdges = totalEdges / 2; // Undirected graph

  // Calculate additional metrics
  const pathLength = path.length;
  const avgEdgesPerNode = (totalEdges / n).toFixed(2);
  const edgesInPath = Math.max(0, pathLength - 1); // Number of edges in final path
  
  // Calculate path efficiency metrics
  const startLoc = { lat: 0, lng: 0 }; // Placeholder - will be enhanced
  const endLoc = { lat: 0, lng: 0 };  // Placeholder - will be enhanced
  const pruningRate = (((n - nodesExplored) / n) * 100).toFixed(1);
  const heapEfficiency = (nodesExplored / (heapOperations || 1)).toFixed(2);
  const edgeUtilization = edgesInPath > 0 ? (edgesInPath / edgesConsidered * 100).toFixed(1) : '0';

  const metrics = {
    executionTime,
    nodesExplored,
    totalNodes: n,
    edgesConsidered,
    totalEdges,
    heapOperations,
    pathLength,
    edgesInPath,
    avgEdgesPerNode: parseFloat(avgEdgesPerNode),
    edgeUtilization: `${edgeUtilization}%`,
    pruningRate: `${pruningRate}%`,
    heapEfficiency: parseFloat(heapEfficiency),
    timeComplexity: `O((V + E) log V)`,
    spaceComplexity: `O(V)`,
    graphDensity: `${((totalEdges / ((n * (n - 1)) / 2)) * 100).toFixed(1)}%`
  };

  return { 
    distance: distances[endIndex], 
    path,
    steps,
    metrics
  };
}

function validateRequest(body) {
  if (!body || !Array.isArray(body.locations)) {
    return "locations must be an array";
  }

  if (body.locations.length < 2) {
    return "at least two locations are required";
  }

  if (body.locations.length > 50) {
    return "maximum of 50 locations allowed";
  }

  const isValidIndex = (value) => Number.isInteger(value);
  if (!isValidIndex(body.startIndex) || !isValidIndex(body.endIndex)) {
    return "startIndex and endIndex must be integers";
  }

  if (
    body.startIndex < 0 ||
    body.startIndex >= body.locations.length ||
    body.endIndex < 0 ||
    body.endIndex >= body.locations.length
  ) {
    return "startIndex and endIndex must be within locations range";
  }

  for (const location of body.locations) {
    if (
      !location ||
      typeof location.lat !== "number" ||
      typeof location.lng !== "number" ||
      !Number.isFinite(location.lat) ||
      !Number.isFinite(location.lng)
    ) {
      return "each location must have valid lat and lng numbers";
    }
  }

  return null;
}

app.post("/api/shortest-path", async (req, res) => {
  try {
    const error = validateRequest(req.body);
    if (error) {
      return res.status(400).json({ error });
    }

    const { locations, startIndex, endIndex } = req.body;
    const graphType = req.body.graphType === "knn" ? "knn" : "full";
    const k = Number.isInteger(req.body.k) ? req.body.k : 3;
    const roadMode = req.body.roadMode === true;
    const travelMode =
      typeof req.body.travelMode === "string" ? req.body.travelMode : "driving";
    const detailMode = req.body.detailMode === "segment" ? "segment" : "route";
    const waypointSpacingKm =
      typeof req.body.waypointSpacingKm === "number"
        ? Math.max(0, Math.min(req.body.waypointSpacingKm, 10))
        : 0;

    const distanceMatrix = roadMode
      ? await fetchDistanceMatrix(locations, travelMode)
      : buildDistanceMatrixHaversine(locations);

    const { adjacencyList } = buildAdjacencyListFromMatrix(
      distanceMatrix,
      graphType,
      k
    );

    // Main optimal path
    const result = dijkstra(adjacencyList, startIndex, endIndex);

    if (!result.path.length || result.distance === Infinity) {
      return res.status(404).json({ error: "no path found" });
    }

    const pathCoords = result.path.map((idx) => ({
      lat: locations[idx].lat,
      lng: locations[idx].lng
    }));

    let totalDistance = 0;
    for (let i = 0; i < result.path.length - 1; i += 1) {
      const from = result.path[i];
      const to = result.path[i + 1];
      totalDistance += distanceMatrix[from][to];
    }

    // Calculate detour factor and enhance metrics with configuration info
    const straightLineDistance = haversineKm(locations[startIndex], locations[endIndex]);
    const detourFactor = (totalDistance / straightLineDistance).toFixed(2);
    const enhancedMetrics = {
      ...result.metrics,
      routingMode: roadMode ? "Road Routing (Google Maps)" : "Haversine (Great Circle)",
      graphType: graphType === "knn" ? `K-Nearest Neighbors (k=${k})` : "Fully Connected Graph",
      detourFactor,
      totalDistance: Number(totalDistance.toFixed(3)),
      straightLineDistance: Number(straightLineDistance.toFixed(3))
    };

    // Generate alternative paths
    let alternativePaths = [];
    let polylinePath;

    // Check if this is a direct path (no intermediate waypoints)
    const isDirectPath = result.path.length === 2;

    if (roadMode && isDirectPath) {
      // For direct paths, use Google's route alternatives
      const routesData = await fetchDirectionsWithAlternatives(
        pathCoords,
        travelMode,
        10 // Request more alternatives
      );

      polylinePath = routesData.optimal.path;
      totalDistance = routesData.optimal.distance;
      const optimalSummary = routesData.optimal.summary;
      const optimalDuration = routesData.optimal.durationText;
      const optimalWarnings = routesData.optimal.warnings;

      // Filter alternatives to show only those within 15% of optimal
      const maxAcceptableDistance = totalDistance * 1.15;
      const filteredAlternatives = routesData.alternatives.filter(
        alt => alt.distance <= maxAcceptableDistance
      );

      // Add Google's alternative routes
      alternativePaths = filteredAlternatives.map((alt) => ({
        distance: alt.distance,
        path: alt.path,
        waypoints: [locations[startIndex].name, locations[endIndex].name],
        summary: alt.summary,
        duration: alt.durationText,
        percentLonger: Math.round(((alt.distance - totalDistance) / totalDistance) * 100)
      }));

      return res.json({
        distance: Number(totalDistance.toFixed(3)),
        path: polylinePath,
        waypoints: result.path.map((idx) => locations[idx].name),
        summary: optimalSummary,
        duration: optimalDuration,
        warnings: optimalWarnings,
        alternatives: alternativePaths,
        metrics: enhancedMetrics,
        steps: result.steps
      });
    } else {
      // For paths with waypoints or non-road mode, use the original detailed polyline
      polylinePath = roadMode
        ? await fetchDetailedPolyline(
            pathCoords,
            travelMode,
            detailMode,
            waypointSpacingKm
          )
        : pathCoords;

      // Generate alternative paths (through different waypoints)
      const candidateWaypoints = locations
        .map((_, idx) => idx)
        .filter((idx) => idx !== startIndex && idx !== endIndex);

      // Limit to top 3 alternative paths to avoid excessive API calls
      const maxAlternatives = Math.min(3, candidateWaypoints.length);

      for (let i = 0; i < maxAlternatives; i++) {
        const waypointIdx = candidateWaypoints[i];
        
        // Path: start -> waypoint -> end
        const toWaypoint = dijkstra(adjacencyList, startIndex, waypointIdx);
        const fromWaypoint = dijkstra(adjacencyList, waypointIdx, endIndex);

        if (
          toWaypoint.path.length &&
          fromWaypoint.path.length &&
          toWaypoint.distance !== Infinity &&
          fromWaypoint.distance !== Infinity
        ) {
          const altPathIndices = [
            ...toWaypoint.path,
            ...fromWaypoint.path.slice(1)
          ];
          const altDistance = toWaypoint.distance + fromWaypoint.distance;

          // Skip if it's the same as optimal path
          if (
            JSON.stringify(altPathIndices) !== JSON.stringify(result.path) &&
            altDistance < Infinity
          ) {
            const altCoords = altPathIndices.map((idx) => ({
              lat: locations[idx].lat,
              lng: locations[idx].lng
            }));

            const altPolyline = roadMode
              ? await fetchDetailedPolyline(
                  altCoords,
                  travelMode,
                  detailMode,
                  waypointSpacingKm
                )
              : altCoords;

            alternativePaths.push({
              distance: Number(altDistance.toFixed(3)),
              path: altPolyline,
              waypoints: altPathIndices.map((idx) => locations[idx].name)
            });
          }
        }
      }

      // Sort alternatives by distance
      alternativePaths.sort((a, b) => a.distance - b.distance);

      return res.json({
        distance: Number(totalDistance.toFixed(3)),
        path: polylinePath,
        waypoints: result.path.map((idx) => locations[idx].name),
        summary: `Via ${result.path.map((idx) => locations[idx].name).join(" → ")}`,
        alternatives: alternativePaths,
        metrics: enhancedMetrics,
        steps: result.steps
      });
    }

    // This shouldn't be reached if the if-else handles both cases
    return res.json({
      distance: Number(totalDistance.toFixed(3)),
      path: polylinePath,
      waypoints: result.path.map((idx) => locations[idx].name),
      alternatives: alternativePaths,
      metrics: enhancedMetrics,
      steps: result.steps
    });
  } catch (err) {
    const message = err && err.message ? err.message : "server error";
    return res.status(500).json({ error: message });
  }
});

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

module.exports = app;
