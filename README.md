# 🗺️ Mini Google Maps Engine - Shortest Path Finder

> A full-stack web application implementing Dijkstra's shortest path algorithm with real-world routing data from Google Maps APIs. Features interactive visualization, performance metrics, and serverless deployment.

[![Live Demo](https://img.shields.io/badge/demo-live-success?style=flat-square)](https://mini-google-maps-engine-5wgo.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

## 🎯 Overview

This project demonstrates advanced data structures and algorithms in a practical application. It constructs weighted graphs from real-world location data, implements Dijkstra's algorithm with a custom MinHeap priority queue, and visualizes the optimal path with comprehensive performance metrics.

**Live Demo:** [https://mini-google-maps-engine-5wgo.vercel.app/](https://mini-google-maps-engine-5wgo.vercel.app/)

## ✨ Key Features

### 🧠 Advanced Data Structures & Algorithms
- **Dijkstra's Algorithm** with custom **MinHeap Priority Queue** (O((V + E) log V))
- **Dynamic Graph Construction**: Fully connected or K-Nearest Neighbors (KNN)
- **Real-time Performance Metrics**: Execution time (microsecond precision), space complexity analysis
- **Detour Factor Analysis**: Compares actual routing distance vs. straight-line (great-circle) distance

### 🗺️ Real-World Routing
- **Google Places Autocomplete** for location search
- **Two Distance Calculation Methods**:
  - **Road Routing**: Google Directions API + Distance Matrix API (considers actual roads)
  - **Haversine Formula**: Great-circle distance calculation
- **Manual Polyline Rendering** on Google Maps with customizable detail level
- **Alternative Route Suggestions** (top 3 shortest routes)

### 📊 Comprehensive Performance Dashboard
Real-time metrics displayed for every route computation:
- Execution Time (microsecond precision)
- Path Length (number of waypoints)
- Time & Space Complexity
- Total Distance vs. Straight-line Distance
- Detour Factor (routing efficiency)
- Graph Type & Routing Mode
- Algorithm comparison (Dijkstra vs A* or Bellman-Ford)
- Weighted winner scoring using time + nodes explored + edges checked

### 🧭 Journey Modes
- **Checkpoint Journey Mode**: Continuous ordered route (1 -> 2 -> 3 -> ...)
- **Start-End + Alternatives Mode**: Optimized Start -> End path with top 3 alternatives
- For 3+ locations, alternatives are available in both modes

### 🚀 Modern Tech Stack
- **Frontend**: React 18 + Vite (lightning-fast HMR)
- **Backend**: Node.js + Express (serverless on Vercel)
- **APIs**: Google Maps JavaScript, Places, Directions, Distance Matrix
- **Deployment**: Vercel (CI/CD with auto-deployment)

## 🛠️ Tech Stack

**Frontend:**
- React 18.2 with modern JSX transform
- Vite 5.0 (build tool)
- Axios for API communication
- Google Maps JavaScript API

**Backend:**
- Node.js + Express
- Custom MinHeap Priority Queue implementation
- Google Maps Distance Matrix & Directions APIs
- Serverless architecture (Vercel Functions)

**DevOps:**
- Git version control
- Vercel for CI/CD deployment
- Environment variable management

## 🎓 Technical Highlights

### Algorithm Implementation
```javascript
// Dijkstra with MinHeap - O((V + E) log V)
- MinHeap operations: O(log V) per insertion/extraction
- Tracks: nodes explored, edges considered, heap operations
- Pruning rate & heap efficiency metrics
```

### Graph Construction Strategies
1. **Fully Connected Graph**: O(V²) edges - guarantees finding optimal path
2. **K-Nearest Neighbors**: O(V·k) edges - optimizes for performance with large datasets

### Distance Calculation Methods
- **Haversine Formula**: Fast great-circle distance (±0.5% accuracy)
- **Google Distance Matrix**: Real road network distances with traffic awareness

## 📋 Project Structure

```
Mini_Google_Maps_Engine/
├── client/                  # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── MapView.jsx         # Google Maps integration
│   │   │   ├── LocationSearch.jsx  # Autocomplete search
│   │   │   ├── Controls.jsx        # Algorithm configuration
│   │   │   └── MetricsPanel.jsx    # Performance dashboard
│   │   ├── utils/
│   │   │   └── googleMapsLoader.js # Maps API loader
│   │   ├── App.jsx         # Main application
│   │   └── styles.css      # Global styles
│   ├── public/
│   │   └── favicon.svg
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── vercel.json         # Frontend deployment config
│
├── server/                  # Backend (Express + Serverless)
│   ├── api/
│   │   └── shortest-path.js # Vercel serverless handler
│   ├── index.js            # Main Express app + Dijkstra implementation
│   ├── package.json
│   └── vercel.json         # Backend deployment config
│
├── .gitignore
├── LICENSE
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- Google Maps API Key with enabled APIs:
  - Maps JavaScript API
  - Places API
  - Directions API
  - Distance Matrix API

### Local Development

**1. Clone the repository**
```bash
git clone https://github.com/Activate9999/Mini_Google_Maps_Engine.git
cd Mini_Google_Maps_Engine
```

**2. Backend Setup**
```bash
cd server
npm install

# Create .env file
cp .env.example .env
# Add your Google Maps API key to .env

npm start  # Server runs on http://localhost:3000
```

**3. Frontend Setup** (in a new terminal)
```bash
cd client
npm install

# Create .env file
cp .env.example .env
# Add your Google Maps API key and backend URL to .env

npm run dev  # App runs on http://localhost:5173
```

**4. Open your browser**
Navigate to `http://localhost:5173` and start finding shortest paths!

## 🌐 Deployment

### Deploy to Vercel (Recommended)

**Backend Deployment:**
1. Create new Vercel project from your GitHub repo
2. Set **Root Directory** to `server`
3. Add environment variable: `GOOGLE_MAPS_API_KEY`
4. Deploy

**Frontend Deployment:**
1. Create another Vercel project from the same repo
2. Set **Root Directory** to `client`
3. Add environment variables:
   - `VITE_GOOGLE_MAPS_API_KEY`
   - `VITE_BACKEND_URL` (your backend deployment URL)
4. Deploy

Both deployments will auto-update on every `git push` to main branch.

## 📖 API Documentation

### POST `/api/shortest-path`

**Request Body:**
```json
{
  "locations": [
    { "name": "Mumbai, India", "lat": 19.0760, "lng": 72.8777 },
    { "name": "Nagpur, India", "lat": 21.1458, "lng": 79.0882 }
  ],
  "startIndex": 0,
  "endIndex": 1,
  "graphType": "full",        // "full" or "knn"
  "k": 3,                     // For KNN graph
  "comparisonAlgorithm": "astar", // "astar" or "bellman-ford"
  "checkpointsMode": false,   // true = enforce ordered checkpoints for 3+ points
  "roadMode": true,           // true = Google routing, false = Haversine
  "detailMode": "segment",    // "segment" or "overview"
  "waypointSpacingKm": 3      // Detail level for polyline
}
```

**Response:**
```json
{
  "distance": 821.5,
  "path": [...],              // Array of lat/lng coordinates
  "waypoints": [...],         // Location names in path
  "metrics": {
    "executionTime": 0.08,    // ms
    "pathLength": 2,
    "timeComplexity": "O((V+E) log V)",
    "spaceComplexity": "O(V)",
    "routingMode": "Road Routing (Google Maps)",
    "graphType": "Fully Connected Graph",
    "detourFactor": "1.18",
    "totalDistance": 821.5,   // km
    "straightLineDistance": 696.2, // km
    "algorithmComparison": {
      "weightedWinner": "A*",
      "runtimeWinner": "A*",
      "speedup": 2.0,
      "sameDistance": true,
      "primary": {
        "name": "Dijkstra",
        "executionTime": 0.08,
        "nodesExplored": 120,
        "edgesConsidered": 480,
        "weightedScore": 1.0
      },
      "secondary": {
        "name": "A*",
        "executionTime": 0.04,
        "nodesExplored": 60,
        "edgesConsidered": 210,
        "weightedScore": 0.46
      },
      "scoringModel": {
        "formula": "normalizedScore = (time + nodes + edges) / 3",
        "lowerIsBetter": true
      }
    }
  },
  "alternatives": [...]       // Top 3 shortest alternatives (when available)
}
```

## 🎯 Use Cases

- **Algorithm Visualization**: Educational tool for understanding Dijkstra's algorithm
- **Route Planning**: Continuous checkpoint journeys or start-end optimization with alternatives
- **Performance Analysis**: Benchmark graph algorithms with real-world data
- **Research**: Compare Dijkstra against A*/Bellman-Ford with weighted scoring metrics

## 📚 What I Learned

- Implementing Dijkstra's algorithm from scratch with custom data structures
- Integrating multiple Google Maps APIs (Places, Directions, Distance Matrix)
- Serverless architecture and deployment strategies
- Managing complex state in React applications
- Performance optimization for graph algorithms
- RESTful API design and error handling

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Your Name**
- GitHub: [@Activate9999](https://github.com/Activate9999)
- Project Link: [https://github.com/Activate9999/Mini_Google_Maps_Engine](https://github.com/Activate9999/Mini_Google_Maps_Engine)

## 🙏 Acknowledgments

- Google Maps Platform for comprehensive APIs
- Vercel for seamless deployment
- React and Vite communities for excellent documentation

---

⭐ **Star this repo if you found it helpful!**
