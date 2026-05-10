'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix default marker icons (Leaflet + webpack issue)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface SafePlace {
  id: string;
  name: string;
  type: 'police' | 'hospital' | 'crowded' | 'fire' | 'pharmacy';
  lat: number;
  lng: number;
  distance: string;
  isOpen?: boolean;
}

interface Props {
  center: { lat: number; lng: number };
  places: SafePlace[];
  onSelectPlace: (place: SafePlace) => void;
}

// Custom SVG markers
function makeSvgIcon(emoji: string, bg: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="42" viewBox="0 0 36 42">
      <ellipse cx="18" cy="38" rx="8" ry="3" fill="rgba(0,0,0,0.3)"/>
      <circle cx="18" cy="18" r="16" fill="${bg}" stroke="white" stroke-width="2"/>
      <text x="18" y="24" font-size="16" text-anchor="middle">${emoji}</text>
    </svg>`;
  return L.divIcon({
    html: svg,
    iconSize: [36, 42],
    iconAnchor: [18, 42],
    popupAnchor: [0, -42],
    className: '',
  });
}

function makeSelfIcon() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="46" viewBox="0 0 40 46">
      <ellipse cx="20" cy="42" rx="10" ry="3.5" fill="rgba(0,0,0,0.35)"/>
      <circle cx="20" cy="20" r="18" fill="#e94560" stroke="white" stroke-width="3"/>
      <text x="20" y="26" font-size="18" text-anchor="middle">📍</text>
    </svg>`;
  return L.divIcon({ html: svg, iconSize: [40, 46], iconAnchor: [20, 46], popupAnchor: [0, -46], className: '' });
}

const placeIconMap: Record<SafePlace['type'], { emoji: string; bg: string; color: string }> = {
  police:   { emoji: '🚔', bg: '#3b82f6', color: '#93c5fd' },
  hospital: { emoji: '🏥', bg: '#ef4444', color: '#fca5a5' },
  crowded:  { emoji: '🏬', bg: '#22c55e', color: '#86efac' },
  fire:     { emoji: '🚒', bg: '#f97316', color: '#fdba74' },
  pharmacy: { emoji: '💊', bg: '#a855f7', color: '#d8b4fe' },
};

// Re-center map when location changes
function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 15);
  }, [lat, lng]);
  return null;
}

export default function SafetyMapLeaflet({ center, places, onSelectPlace }: Props) {
  return (
    <div className="rounded-xl overflow-hidden border border-white/10" style={{ height: 400 }}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={15}
        style={{ height: '100%', width: '100%', background: '#1a1a2e' }}
        zoomControl={true}
      >
        {/* Dark OpenStreetMap tiles */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
          maxZoom={19}
        />

        <Recenter lat={center.lat} lng={center.lng} />

        {/* Safety radius circle */}
        <Circle
          center={[center.lat, center.lng]}
          radius={300}
          pathOptions={{ color: '#e94560', fillColor: '#e94560', fillOpacity: 0.08, weight: 1 }}
        />

        {/* Self marker */}
        <Marker position={[center.lat, center.lng]} icon={makeSelfIcon()}>
          <Popup>
            <div style={{ color: '#111', fontFamily: 'sans-serif' }}>
              <strong>📍 You are here</strong>
              <br />
              <small>{center.lat.toFixed(5)}, {center.lng.toFixed(5)}</small>
            </div>
          </Popup>
        </Marker>

        {/* Safe places markers */}
        {places.map((place) => {
          const meta = placeIconMap[place.type];
          return (
            <Marker
              key={place.id}
              position={[place.lat, place.lng]}
              icon={makeSvgIcon(meta.emoji, meta.bg)}
              eventHandlers={{ click: () => onSelectPlace(place) }}
            >
              <Popup>
                <div style={{ color: '#111', fontFamily: 'sans-serif', minWidth: 140 }}>
                  <strong>{meta.emoji} {place.name}</strong><br />
                  <small style={{ color: '#555' }}>{place.distance} · {place.isOpen ? '✅ Open' : '❌ Closed'}</small>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
