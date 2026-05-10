'use client';

import { useEffect, useRef, useState } from 'react';
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api';
import { MapPin, Navigation } from 'lucide-react';
import { locationAPI } from '@/lib/api';
import { SafeSpot } from '@/types';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '1rem'
};

const defaultCenter = { lat: 28.6139, lng: 77.2090 }; // New Delhi

export default function LiveMap() {
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [safeSpots, setSafeSpots] = useState<SafeSpot[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<SafeSpot | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = ['places'];

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: googleMapsApiKey || '',
    libraries,
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCurrentLocation(loc);
          loadSafeSpots(loc.lat, loc.lng);
        },
        () => setCurrentLocation(defaultCenter)
      );
    }
  }, []);

  const loadSafeSpots = async (lat: number, lng: number) => {
    try {
      const res = await locationAPI.getSafeSpots({ latitude: lat, longitude: lng });
      setSafeSpots(res.data.safeSpots);
    } catch (e) {
      console.error(e);
    }
  };

  const getMarkerIcon = (type: string) => {
    const colors: Record<string, string> = {
      police: '#3b82f6',
      hospital: '#ef4444',
      fire_station: '#f97316',
      crowded_area: '#22c55e',
    };
    return { url: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='${colors[type] || '#94a3b8'}'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3C/svg%3E`, scaledSize: { width: 20, height: 20 } as any };
  };

  if (!googleMapsApiKey) {
    return (
      <div className="glass rounded-2xl p-6 h-[400px] flex flex-col items-center justify-center border border-white/5">
        <MapPin className="w-12 h-12 text-safeher-muted mb-4" />
        <p className="text-safeher-muted text-center">Google Maps API key not configured.<br/>Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment.</p>
        {currentLocation && (
          <div className="mt-4 text-sm text-safeher-muted">
            Current: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
          </div>
        )}
      </div>
    );
  }

  if (loadError) return <div className="glass rounded-2xl p-6 h-[400px] flex items-center justify-center">Error loading maps</div>;
  if (!isLoaded) return <div className="glass rounded-2xl p-6 h-[400px] flex items-center justify-center">Loading maps...</div>;

  return (
    <div className="glass rounded-2xl p-6 border border-white/5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-safeher-primary/20">
            <Navigation className="w-5 h-5 text-safeher-primary" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Live Location</h3>
            <p className="text-xs text-safeher-muted">Real-time tracking & safe spots</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-safeher-success animate-pulse" />
          <span className="text-xs text-safeher-muted">Live</span>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden h-[350px] bg-black/30">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={currentLocation || defaultCenter}
          zoom={15}
          onLoad={() => setMapLoaded(true)}
          options={{
            mapTypeId: 'roadmap',
            disableDefaultUI: true,
            zoomControl: true,
            styles: [
              { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
              { elementType: 'labels.text.fill', stylers: [{ color: '#a0a0b0' }] },
              { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0a1a' }] },
              { featureType: 'road', stylers: [{ color: '#2a2a4a' }] },
            ]
          }}
        >
          {currentLocation && (
            <Marker
              position={currentLocation}
              icon={{ url: 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\' viewBox=\'0 0 32 32\'%3E%3Ccircle cx=\'16\' cy=\'16\' r=\'12\' fill=\'%23e94560\' stroke=\'%23fff\' stroke-width=\'2\'/%3E%3C/svg%3E', scaledSize: { width: 32, height: 32 } as any }}
            />
          )}
          {safeSpots.map((spot, i) => (
            <Marker
              key={i}
              position={{ lat: spot.latitude, lng: spot.longitude }}
              icon={getMarkerIcon(spot.type)}
              onClick={() => setSelectedSpot(spot)}
            />
          ))}
          {selectedSpot && (
            <InfoWindow
              position={{ lat: selectedSpot.latitude, lng: selectedSpot.longitude }}
              onCloseClick={() => setSelectedSpot(null)}
            >
              <div className="text-black p-1">
                <p className="font-semibold text-sm">{selectedSpot.name}</p>
                <p className="text-xs capitalize">{selectedSpot.type.replace('_', ' ')}</p>
                <p className="text-xs">{selectedSpot.distance}m away</p>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {safeSpots.slice(0, 4).map((spot, i) => (
          <button
            key={i}
            onClick={() => setSelectedSpot(spot)}
            className="text-xs px-3 py-1.5 rounded-full bg-white/5 text-safeher-muted border border-white/5 hover:bg-white/10 transition-colors"
          >
            {spot.name} ({spot.distance}m)
          </button>
        ))}
      </div>
    </div>
  );
}
