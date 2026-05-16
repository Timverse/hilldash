"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix Leaflet default icon path issues in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom HTML DivIcons for gorgeous styling
const createTruckIcon = () => L.divIcon({
  html: `<div class="w-10 h-10 bg-emerald-500 text-slate-950 rounded-full flex items-center justify-center shadow-xl border-2 border-white animate-bounce">
           <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 14h.01M12 14h.01M16 14h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
           </svg>
         </div>`,
  className: "",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
})

const createDestinationIcon = () => L.divIcon({
  html: `<div class="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-xl border-2 border-white animate-pulse">
           <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
           </svg>
         </div>`,
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
})

// Auto-fit bounds component
function MapBounds({ riderPos, deliveryPos }: { riderPos: [number, number]; deliveryPos: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLngBounds([riderPos, deliveryPos]);
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 17 });
  }, [map, riderPos, deliveryPos]);
  return null;
}

interface RiderMapProps {
  riderLat: number;
  riderLng: number;
  deliveryLat: number;
  deliveryLng: number;
  riderName?: string | null;
  riderPhone?: string | null;
}

export function RiderMap({ riderLat, riderLng, deliveryLat, deliveryLng, riderName, riderPhone }: RiderMapProps) {
  const riderPos: [number, number] = [riderLat, riderLng];
  const deliveryPos: [number, number] = [deliveryLat, deliveryLng];

  return (
    <div className="h-[320px] w-full rounded-[1.5rem] overflow-hidden border border-slate-800 shadow-inner relative z-10 font-sans antialiased">
      <MapContainer
        center={riderPos}
        zoom={16}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapBounds riderPos={riderPos} deliveryPos={deliveryPos} />

        {/* Rider Marker */}
        <Marker position={riderPos} icon={createTruckIcon()}>
          <Popup className="rounded-xl overflow-hidden shadow-lg font-sans">
            <div className="p-1 text-slate-900">
              <p className="font-black text-sm mb-0.5">🛵 {riderName || "Sawaïom Rider"}</p>
              <p className="text-xs text-slate-500 font-medium">{riderPhone ? `Ph: ${riderPhone}` : "On the way to deliver your order!"}</p>
              <p className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded px-2 py-0.5 mt-2 font-mono font-bold inline-block">
                GPS: {riderLat.toFixed(4)}, {riderLng.toFixed(4)}
              </p>
            </div>
          </Popup>
        </Marker>

        {/* Destination Marker */}
        <Marker position={deliveryPos} icon={createDestinationIcon()}>
          <Popup className="rounded-xl overflow-hidden shadow-lg font-sans">
            <div className="p-1 text-slate-900">
              <p className="font-black text-sm mb-0.5">📍 Delivery Destination</p>
              <p className="text-xs text-slate-500 font-medium">Your registered shipping address</p>
            </div>
          </Popup>
        </Marker>

        {/* Polyline Route */}
        <Polyline
          positions={[riderPos, deliveryPos]}
          pathOptions={{ color: "#10b981", weight: 4, dashArray: "10, 10" }}
        />
      </MapContainer>
    </div>
  );
}
