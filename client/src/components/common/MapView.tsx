import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { Shield, Building2, AlertTriangle, Layers, Navigation } from 'lucide-react';
import { Jurisdiction, Facility } from '../../types';

interface MapViewProps {
  jurisdictions?: Jurisdiction[];
  facilities?: Facility[];
  onSelectJurisdiction?: (jurisdiction: Jurisdiction) => void;
  onSelectFacility?: (facility: Facility) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  jurisdictions = [],
  facilities = [],
  onSelectJurisdiction,
  onSelectFacility,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const [selectedItem, setSelectedItem] = useState<{ type: 'jurisdiction' | 'facility'; data: any } | null>(null);

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    // Dark styled vector / raster tile style
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: [
              'https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
              'https://cartodb-basemaps-b.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors, © CartoDB',
          },
        },
        layers: [
          {
            id: 'osm-layer',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: [15, 30],
      zoom: 1.8,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    map.on('load', () => {
      // Add Jurisdiction Markers
      jurisdictions.forEach(j => {
        const el = document.createElement('div');
        el.className = 'cursor-pointer group flex items-center justify-center';
        el.innerHTML = `
          <div class="relative flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-transform group-hover:scale-125">
            <span class="text-[10px] font-bold font-mono">${j.code}</span>
          </div>
        `;

        el.addEventListener('click', () => {
          setSelectedItem({ type: 'jurisdiction', data: j });
          if (onSelectJurisdiction) onSelectJurisdiction(j);
        });

        new maplibregl.Marker({ element: el })
          .setLngLat([j.longitude, j.latitude])
          .addTo(map);
      });

      // Add Facility Markers
      facilities.forEach(f => {
        const el = document.createElement('div');
        el.className = 'cursor-pointer group flex items-center justify-center';
        el.innerHTML = `
          <div class="relative flex items-center justify-center w-8 h-8 rounded-full bg-cyan-500/20 border-2 border-cyan-400 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.6)] transition-transform group-hover:scale-125">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
          </div>
        `;

        el.addEventListener('click', () => {
          setSelectedItem({ type: 'facility', data: f });
          if (onSelectFacility) onSelectFacility(f);
        });

        new maplibregl.Marker({ element: el })
          .setLngLat([f.longitude, f.latitude])
          .addTo(map);
      });
    });

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [jurisdictions, facilities]);

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
      <div ref={mapContainer} className="w-full h-full min-h-[500px]" />

      {/* Map Legend Floating Panel */}
      <div className="absolute top-4 left-4 z-10 glass-panel rounded-xl p-3 text-xs text-slate-300 space-y-2 border border-slate-700/60 shadow-xl max-w-xs">
        <div className="font-semibold text-white flex items-center gap-1.5 text-sm">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>Global Compliance Telemetry</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full border-2 border-emerald-400 bg-emerald-500/30 shrink-0" />
          <span>Active Jurisdictions ({jurisdictions.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full border-2 border-cyan-400 bg-cyan-500/30 shrink-0" />
          <span>Operating Facilities ({facilities.length})</span>
        </div>
      </div>

      {/* Details Drawer Popup */}
      {selectedItem && (
        <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-96 z-10 glass-panel rounded-2xl p-4 border border-emerald-500/30 shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-emerald-400">
              {selectedItem.type === 'jurisdiction' ? (
                <>
                  <Shield className="w-4 h-4" />
                  <span>Jurisdiction Target</span>
                </>
              ) : (
                <>
                  <Building2 className="w-4 h-4 text-cyan-400" />
                  <span className="text-cyan-400">Industrial Facility</span>
                </>
              )}
            </div>
            <button
              onClick={() => setSelectedItem(null)}
              className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded bg-slate-800"
            >
              ✕
            </button>
          </div>

          <h4 className="mt-1 text-base font-bold text-white">{selectedItem.data.name}</h4>
          <p className="text-xs text-slate-400 mt-0.5">
            {selectedItem.type === 'jurisdiction'
              ? `${selectedItem.data.region} • ${selectedItem.data.country}`
              : `${selectedItem.data.facilityType} • ${selectedItem.data.location}`}
          </p>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">GPS Coordinates:</span>
            <span className="font-mono text-emerald-300">
              {selectedItem.data.latitude.toFixed(4)}, {selectedItem.data.longitude.toFixed(4)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
