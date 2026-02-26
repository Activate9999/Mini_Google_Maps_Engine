# Mini Google Maps Engine - Shortest Path Finder

A full-stack web app that searches real-world places via Google Places Autocomplete, constructs a weighted graph, runs Dijkstra on the backend, and draws the shortest path manually on Google Maps.

## Features

- Google Places Autocomplete search
- Dynamic weighted graph (fully connected or k-nearest neighbors)
- Dijkstra with Min Heap priority queue
- Road-aware routing via Google Directions + Distance Matrix APIs
- Manual polyline rendering on Google Maps
- Serverless-ready backend for Vercel
- React (Vite) frontend with responsive UI

## Project Structure

```
client/
server/
```

## Backend Setup (Node.js + Express)

1. Install dependencies:

```bash
cd server
npm install
```

2. Run locally:

```bash
npm run dev
```

The API will be available at `http://localhost:3000/api/shortest-path`.

3. Add your Google API key for road routing by creating `server/.env`:

```
GOOGLE_MAPS_API_KEY=your_google_maps_key
```

## Frontend Setup (React + Vite)

1. Install dependencies:

```bash
cd client
npm install
```

2. Create a `.env` file in `client/` based on `.env.example`:

```
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
VITE_BACKEND_URL=http://localhost:3000
```

3. Run locally:

```bash
npm run dev
```

## API Usage

**POST** `/api/shortest-path`

```json
{
  "locations": [
    { "name": "Place A", "lat": 28.61, "lng": 77.2 },
    { "name": "Place B", "lat": 28.62, "lng": 77.21 },
    { "name": "Place C", "lat": 28.63, "lng": 77.22 }
  ],
  "startIndex": 0,
  "endIndex": 2,
  "graphType": "full",
  "k": 3,
  "roadMode": true,
  "detailMode": "segment",
  "waypointSpacingKm": 3
}
```

Response:

```json
{
  "distance": 4.812,
  "path": [
    { "lat": 28.61, "lng": 77.2 },
    { "lat": 28.63, "lng": 77.22 }
  ]
}
```

## Deployment

### Backend (Vercel)

1. Deploy the `server/` folder as a separate Vercel project.
2. Ensure the build uses the Node.js runtime.
3. The `vercel.json` in `server/` configures the serverless function route.
4. Add `GOOGLE_MAPS_API_KEY` to the backend project environment variables.

### Frontend (Vercel)

1. Deploy the `client/` folder as another Vercel project.
2. Add environment variables in Vercel:
   - `VITE_GOOGLE_MAPS_API_KEY`
   - `VITE_BACKEND_URL` (set to the backend deployment URL)

## Notes

- Enable Google APIs: Maps JavaScript, Places, Directions, and Distance Matrix.
- The backend is optimized for up to 50 locations.
- For the k-nearest neighbor graph, use a smaller `k` for faster performance.
- Set `detailMode` to `segment` with a smaller `waypointSpacingKm` for better local-road detail (higher API usage).
