'use client';

import { useEffect, useState, useCallback } from 'react';
import { GoogleMap, DirectionsRenderer, Marker, useJsApiLoader } from '@react-google-maps/api';

const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = ['places'];

import { Navigation, Shield, AlertTriangle, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '1rem',
};

const darkMapStyles = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#a0a0b0' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0a1a' }] },
  { featureType: 'road', stylers: [{ color: '#2a2a4a' }] },
  { featureType: 'road.highway', stylers: [{ color: '#3a3a5a' }] },
  { featureType: 'water', stylers: [{ color: '#0f3460' }] },
  { featureType: 'poi.park', stylers: [{ color: '#1a3a2a' }] },
];

interface SafeSpot {
  name: string;
  type: string;
  distance: number;
  lat: number;
  lng: number;
}

export default function SafeRoute() {
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [destination, setDestination] = useState('');
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [safeSpots, setSafeSpots] = useState<SafeSpot[]>([]);
  const [loading, setLoading] = useState(false);
  const [safetyScore, setSafetyScore] = useState(85);
  const [eta, setEta] = useState('');
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: googleMapsApiKey || '',
    libraries,
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setCurrentLocation({ lat: 28.6139, lng: 77.2090 })
      );
    }
  }, []);

  const searchSafeRoute = useCallback(() => {
    if (!currentLocation || !destination || !window.google) return;
    setLoading(true);

    const directionsService = new window.google.maps.DirectionsService();
    const placesService = new window.google.maps.places.PlacesService(
      document.createElement('div')
    );

    directionsService.route(
      {
        origin: currentLocation,
        destination,
        travelMode: google.maps.TravelMode.WALKING,
        provideRouteAlternatives: true,
      },
      (result, status) => {
        setLoading(false);
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
          const route = result.routes[0];
          if (route.legs[0]) {
            setEta(route.legs[0].duration?.text || '');
          }

          // Simulate safety score based on route length
          const score = Math.max(50, 95 - (route.legs[0]?.distance?.value || 0) / 200);
          setSafetyScore(Math.round(score));
        } else {
          console.error('Directions request failed:', status);
        }
      }
    );

    // Search for nearby safe spots
    const types = ['police', 'hospital', 'shopping_mall'];
    const foundSpots: SafeSpot[] = [];

    types.forEach((type) => {
      placesService.nearbySearch(
        {
          location: currentLocation,
          radius: 2000,
          type: type as any,
        },
        (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            results.slice(0, 3).forEach((place) => {
              if (place.geometry?.location) {
                foundSpots.push({
                  name: place.name || 'Unknown',
                  type: type === 'police' ? 'police' : type === 'hospital' ? 'hospital' : 'crowded_area',
                  distance: 0,
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng(),
                });
              }
            });
            setSafeSpots([...foundSpots]);
          }
        }
      );
    });
  }, [currentLocation, destination, isLoaded]);

  if (!googleMapsApiKey) {
    return (
      <div className="glass rounded-2xl p-6 h-[300px] flex flex-col items-center justify-center border border-white/5">
        <MapPin className="w-10 h-10 text-safeher-muted mb-3" />
        <p className="text-safeher-muted text-center text-sm">
          Google Maps API key not configured.<br />
          Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to use Safe Route.
        </p>
      </div>
    );
  }

  if (loadError) return <div className="glass rounded-2xl p-6 h-[300px] flex items-center justify-center text-safeher-muted">Error loading maps</div>;
  if (!isLoaded) return <div className="glass rounded-2xl p-6 h-[300px] flex items-center justify-center text-safeher-muted">Loading maps...</div>;

  return (
    <div className="glass rounded-2xl p-6 border border-white/5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-safeher-primary/20">
            <Navigation className="w-5 h-5 text-safeher-primary" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Safe Route AI</h3>
            <p className="text-xs text-safeher-muted">Navigate through safer paths</p>
          </div>
        </div>
        {directions && (
          <div className="flex items-center space-x-2">
            <Shield className={`w-4 h-4 ${safetyScore >= 80 ? 'text-safeher-success' : safetyScore >= 60 ? 'text-safeher-warning' : 'text-safeher-danger'}`} />
            <span className={`text-xs font-medium ${safetyScore >= 80 ? 'text-safeher-success' : safetyScore >= 60 ? 'text-safeher-warning' : 'text-safeher-danger'}`}>
              Safety {safetyScore}%
            </span>
          </div>
        )}
      </div>

      <div className="flex space-x-2">
        <input
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Enter destination..."
          className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-safeher-muted focus:outline-none focus:border-safeher-primary text-sm"
        />
        <button
          onClick={searchSafeRoute}
          disabled={!destination || loading}
          className="px-4 py-2 bg-safeher-primary text-white rounded-lg text-sm font-medium hover:bg-safeher-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? '...' : 'Route'}
        </button>
      </div>

      {eta && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-4 text-xs text-safeher-muted"
        >
          <span>ETA: <span className="text-white">{eta}</span></span>
          {safetyScore < 70 && (
            <span className="flex items-center space-x-1 text-safeher-warning">
              <AlertTriangle className="w-3 h-3" />
              <span>Use caution on this route</span>
            </span>
          )}
        </motion.div>
      )}

      <div className="rounded-xl overflow-hidden h-[300px] bg-black/30">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={currentLocation || { lat: 28.6139, lng: 77.209 }}
          zoom={15}
          options={{
            mapTypeId: 'roadmap',
            disableDefaultUI: true,
            zoomControl: true,
            styles: darkMapStyles,
          }}
        >
          {currentLocation && (
            <Marker
              position={currentLocation}
              icon={{ url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"%3E%3Ccircle cx="16" cy="16" r="12" fill="%23e94560" stroke="%23fff" stroke-width="2"/%3E%3C/svg%3E', scaledSize: { width: 32, height: 32 } as any }}
            />
          )}
          {directions && <DirectionsRenderer directions={directions} options={{ suppressMarkers: false }} />}
          {safeSpots.map((spot, i) => (
            <Marker
              key={i}
              position={{ lat: spot.lat, lng: spot.lng }}
              title={spot.name}
              icon={{
                url: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Ccircle cx='10' cy='10' r='8' fill='${spot.type === 'police' ? '%233b82f6' : spot.type === 'hospital' ? '%23ef4444' : '%2322c55e'}'/%3E%3C/svg%3E`,
                scaledSize: { width: 20, height: 20 } as any,
              }}
            />
          ))}
        </GoogleMap>
      </div>

      {safeSpots.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {safeSpots.slice(0, 5).map((spot, i) => (
            <span
              key={i}
              className="text-xs px-2 py-1 rounded-full bg-white/5 text-safeher-muted border border-white/5"
            >
              {spot.type === 'police' && <Shield className="w-3 h-3 inline mr-1 text-blue-400" />}
              {spot.type === 'hospital' && <AlertTriangle className="w-3 h-3 inline mr-1 text-red-400" />}
              {spot.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
