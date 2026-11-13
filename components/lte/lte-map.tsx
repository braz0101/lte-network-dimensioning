'use client';

import { useEffect, useRef, useState } from 'react';
import { useLTEStore } from '@/lib/lte-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Target, Layers, Eye, EyeOff, MapPin, Trash2, Flame } from 'lucide-react';

// Dynamic import for Leaflet to avoid SSR issues
let L: typeof import('leaflet') | null = null;

// Tile layer options
const TILE_LAYERS = {
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    name: 'OpenStreetMap',
  },
  osmFr: {
    url: 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> France',
    name: 'OSM France',
  },
  esriSatellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    name: 'Satellite',
  },
  cartoLight: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    name: 'Carto Light',
  },
};

export function LTEMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const coverageLayersRef = useRef<Map<string, L.Circle>>(new Map());
  const heatLayerRef = useRef<L.Layer | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  
  const [isMapReady, setIsMapReady] = useState(false);
  const [showLayers, setShowLayers] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [currentTileLayer, setCurrentTileLayer] = useState<keyof typeof TILE_LAYERS>('osm');
  
  const {
    placedSites,
    addSite,
    removeSite,
    updateSite,
    mapCenter,
    showCoverage,
    setShowCoverage,
    results,
    params,
  } = useLTEStore();

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const initMap = async () => {
      // Dynamic import of Leaflet
      const leaflet = await import('leaflet');
      L = leaflet.default;
      
      // Import CSS
      await import('leaflet/dist/leaflet.css');

      // Create map instance
      const map = L.map(mapRef.current!, {
        center: mapCenter,
        zoom: 12,
        zoomControl: false,
      });

      // Add tile layer - OpenStreetMap color
      const tileLayer = L.tileLayer(TILE_LAYERS.osm.url, {
        attribution: TILE_LAYERS.osm.attribution,
        maxZoom: 19,
      }).addTo(map);
      
      tileLayerRef.current = tileLayer;

      // Custom marker icon
      const siteIcon = L.divIcon({
        className: 'custom-site-marker',
        html: `<div class="w-6 h-6 bg-primary rounded-full border-2 border-white shadow-lg flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/></svg>
        </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      // Click handler to add sites
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        addSite({
          lat,
          lng,
          name: `Site ${placedSites.length + 1}`,
          enabled: true,
          config: {
            frequency: params.radio.frequencyBand,
            power: params.radio.txPower,
            height: params.enodeb.antennaHeight,
            sectors: params.enodeb.sectors,
            azimuth: 0,
          },
        });
      });

      mapInstanceRef.current = map;
      setIsMapReady(true);
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Generate heatmap data from placed sites
  const generateHeatmapLayer = (map: L.Map, sites: typeof placedSites, radius: number) => {
    if (!L || sites.length === 0) return null;

    // Create canvas overlay for heatmap
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Custom heatmap implementation using canvas overlay
    const HeatmapOverlay = L.Layer.extend({
      onAdd: function(map: L.Map) {
        this._map = map;
        this._canvas = document.createElement('canvas');
        this._canvas.style.position = 'absolute';
        this._canvas.style.pointerEvents = 'none';
        
        const pane = map.getPane('overlayPane');
        if (pane) {
          pane.appendChild(this._canvas);
        }
        
        map.on('moveend', this._reset, this);
        map.on('zoomend', this._reset, this);
        this._reset();
      },
      
      onRemove: function(map: L.Map) {
        const pane = map.getPane('overlayPane');
        if (pane && this._canvas) {
          pane.removeChild(this._canvas);
        }
        map.off('moveend', this._reset, this);
        map.off('zoomend', this._reset, this);
      },
      
      _reset: function() {
        const map = this._map;
        const canvas = this._canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx || !map) return;
        
        const size = map.getSize();
        const bounds = map.getBounds();
        const topLeft = map.latLngToLayerPoint(bounds.getNorthWest());
        
        canvas.width = size.x;
        canvas.height = size.y;
        canvas.style.left = `${topLeft.x}px`;
        canvas.style.top = `${topLeft.y}px`;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw heatmap for each site
        this._sites.forEach((site: { lat: number; lng: number; enabled: boolean }) => {
          if (!site.enabled) return;
          
          const point = map.latLngToLayerPoint([site.lat, site.lng]);
          const adjustedPoint = {
            x: point.x - topLeft.x,
            y: point.y - topLeft.y
          };
          
          // Calculate pixel radius based on zoom and cell radius
          const zoom = map.getZoom();
          const metersPerPixel = 40075016.686 * Math.cos(site.lat * Math.PI / 180) / Math.pow(2, zoom + 8);
          const pixelRadius = (this._radius * 1000) / metersPerPixel;
          
          // Create gradient
          const gradient = ctx.createRadialGradient(
            adjustedPoint.x, adjustedPoint.y, 0,
            adjustedPoint.x, adjustedPoint.y, pixelRadius
          );
          
          // Signal strength gradient: strong (center) to weak (edge)
          gradient.addColorStop(0, 'rgba(0, 200, 83, 0.7)');     // Strong signal - green
          gradient.addColorStop(0.3, 'rgba(76, 175, 80, 0.5)');  // Good signal - light green
          gradient.addColorStop(0.5, 'rgba(255, 193, 7, 0.4)');  // Medium signal - yellow
          gradient.addColorStop(0.7, 'rgba(255, 152, 0, 0.3)');  // Weak signal - orange
          gradient.addColorStop(0.9, 'rgba(244, 67, 54, 0.2)');  // Edge - red
          gradient.addColorStop(1, 'rgba(244, 67, 54, 0)');      // Fade out
          
          ctx.beginPath();
          ctx.arc(adjustedPoint.x, adjustedPoint.y, pixelRadius, 0, 2 * Math.PI);
          ctx.fillStyle = gradient;
          ctx.fill();
        });
      },
      
      updateData: function(sites: typeof placedSites, radius: number) {
        this._sites = sites;
        this._radius = radius;
        this._reset();
      }
    });

    const heatLayer = new HeatmapOverlay();
    heatLayer._sites = sites;
    heatLayer._radius = radius;
    heatLayer.addTo(map);
    
    return heatLayer;
  };

  // Update markers when sites change
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || !L) return;

    const map = mapInstanceRef.current;
    const existingIds = new Set(placedSites.map(s => s.id));

    // Remove markers for deleted sites
    markersRef.current.forEach((marker, id) => {
      if (!existingIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Remove coverage for deleted sites
    coverageLayersRef.current.forEach((circle, id) => {
      if (!existingIds.has(id)) {
        circle.remove();
        coverageLayersRef.current.delete(id);
      }
    });

    // Add or update markers and coverage
    placedSites.forEach((site) => {
      if (!markersRef.current.has(site.id)) {
        // Create new marker
        const siteIcon = L!.divIcon({
          className: 'custom-site-marker',
          html: `<div class="w-6 h-6 ${site.enabled ? 'bg-primary' : 'bg-muted-foreground'} rounded-full border-2 border-white shadow-lg flex items-center justify-center cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/></svg>
          </div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L!.marker([site.lat, site.lng], {
          icon: siteIcon,
          draggable: true,
        }).addTo(map);

        // Popup content
        marker.bindPopup(`
          <div class="p-2 min-w-[180px]">
            <h3 class="font-semibold text-sm mb-2">${site.name}</h3>
            <div class="space-y-1 text-xs">
              <div class="flex justify-between"><span class="text-muted-foreground">Frequence:</span><span>${site.config.frequency} MHz</span></div>
              <div class="flex justify-between"><span class="text-muted-foreground">Puissance:</span><span>${site.config.power} dBm</span></div>
              <div class="flex justify-between"><span class="text-muted-foreground">Hauteur:</span><span>${site.config.height} m</span></div>
              <div class="flex justify-between"><span class="text-muted-foreground">Secteurs:</span><span>${site.config.sectors}</span></div>
            </div>
          </div>
        `);

        // Drag end handler
        marker.on('dragend', (e) => {
          const { lat, lng } = e.target.getLatLng();
          updateSite(site.id, { lat, lng });
        });

        markersRef.current.set(site.id, marker);
      }

      // Add or update coverage circle
      if (showCoverage && site.enabled && results) {
        const radiusMeters = results.propagation.cellRadius * 1000;
        
        if (!coverageLayersRef.current.has(site.id)) {
          const circle = L!.circle([site.lat, site.lng], {
            radius: radiusMeters,
            color: 'hsl(var(--primary))',
            fillColor: 'hsl(var(--primary))',
            fillOpacity: 0.15,
            weight: 1,
          }).addTo(map);
          
          coverageLayersRef.current.set(site.id, circle);
        } else {
          const circle = coverageLayersRef.current.get(site.id)!;
          circle.setLatLng([site.lat, site.lng]);
          circle.setRadius(radiusMeters);
        }
      } else {
        // Remove coverage if not showing
        const circle = coverageLayersRef.current.get(site.id);
        if (circle) {
          circle.remove();
          coverageLayersRef.current.delete(site.id);
        }
      }
    });
  }, [placedSites, showCoverage, results, isMapReady]);

  // Update heatmap layer
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || !L) return;
    
    const map = mapInstanceRef.current;
    const radius = results?.propagation.cellRadius || 1;
    
    // Remove existing heatmap
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }
    
    // Add new heatmap if enabled and sites exist
    if (showHeatmap && placedSites.length > 0) {
      const heatLayer = generateHeatmapLayer(map, placedSites, radius);
      if (heatLayer) {
        heatLayerRef.current = heatLayer;
      }
    }
  }, [placedSites, showHeatmap, results, isMapReady]);

  // Handle tile layer change
  const handleTileLayerChange = (layerKey: keyof typeof TILE_LAYERS) => {
    if (!mapInstanceRef.current || !L) return;
    
    const map = mapInstanceRef.current;
    const layer = TILE_LAYERS[layerKey];
    
    // Remove current tile layer
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    
    // Add new tile layer
    const newTileLayer = L.tileLayer(layer.url, {
      attribution: layer.attribution,
      maxZoom: 19,
    }).addTo(map);
    
    tileLayerRef.current = newTileLayer;
    setCurrentTileLayer(layerKey);
  };

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleCenterMap = () => {
    mapInstanceRef.current?.setView(mapCenter, 12);
  };

  const handleRemoveAllSites = () => {
    placedSites.forEach(site => removeSite(site.id));
  };

  return (
    <div className="relative h-full w-full">
      {/* Map Container */}
      <div ref={mapRef} className="absolute inset-0 z-0" />

      {/* Zoom Controls */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-1">
        <Button size="icon" variant="secondary" className="h-8 w-8 bg-card shadow-md" onClick={handleZoomIn}>
          <Plus className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="secondary" className="h-8 w-8 bg-card shadow-md" onClick={handleZoomOut}>
          <Minus className="h-4 w-4" />
        </Button>
      </div>

      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-1">
        <Button 
          size="icon" 
          variant="secondary" 
          className="h-8 w-8 bg-card shadow-md" 
          onClick={handleCenterMap}
          title="Centrer la carte"
        >
          <Target className="h-4 w-4" />
        </Button>
        <Button 
          size="icon" 
          variant="secondary" 
          className={`h-8 w-8 bg-card shadow-md ${showCoverage ? 'text-primary' : ''}`}
          onClick={() => setShowCoverage(!showCoverage)}
          title={showCoverage ? 'Masquer couverture' : 'Afficher couverture'}
        >
          {showCoverage ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </Button>
        <Button 
          size="icon" 
          variant="secondary" 
          className={`h-8 w-8 bg-card shadow-md ${showHeatmap ? 'text-orange-500' : ''}`}
          onClick={() => setShowHeatmap(!showHeatmap)}
          title={showHeatmap ? 'Masquer heatmap' : 'Afficher heatmap'}
        >
          <Flame className="h-4 w-4" />
        </Button>
        <Button 
          size="icon" 
          variant="secondary" 
          className="h-8 w-8 bg-card shadow-md"
          onClick={() => setShowLayers(!showLayers)}
          title="Couches"
        >
          <Layers className="h-4 w-4" />
        </Button>
        <Button 
          size="icon" 
          variant="secondary" 
          className="h-8 w-8 bg-card shadow-md"
          onClick={handleCenterMap}
          title="Localisation"
        >
          <MapPin className="h-4 w-4" />
        </Button>
      </div>

      {/* Layers Panel */}
      {showLayers && (
        <Card className="absolute top-4 right-14 z-[1000] w-56 shadow-lg">
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-xs font-medium">Couches & Fond de carte</CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-3 space-y-3">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Affichage</p>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={showCoverage} 
                  onChange={(e) => setShowCoverage(e.target.checked)}
                  className="rounded"
                />
                Zones de couverture
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={showHeatmap} 
                  onChange={(e) => setShowHeatmap(e.target.checked)}
                  className="rounded"
                />
                Heatmap signal
              </label>
            </div>
            <div className="border-t pt-2 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Fond de carte</p>
              {Object.entries(TILE_LAYERS).map(([key, layer]) => (
                <label key={key} className="flex items-center gap-2 text-xs cursor-pointer">
                  <input 
                    type="radio" 
                    name="tileLayer"
                    checked={currentTileLayer === key} 
                    onChange={() => handleTileLayerChange(key as keyof typeof TILE_LAYERS)}
                    className="rounded-full"
                  />
                  {layer.name}
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sites Counter */}
      <Card className="absolute bottom-4 left-4 z-[1000] shadow-lg">
        <CardContent className="py-3 px-4">
          <div className="flex items-center gap-3">
            <div>
              <div className="text-xs text-muted-foreground">Sites places</div>
              <div className="text-2xl font-bold text-foreground">
                {placedSites.length}
                <span className="text-sm text-muted-foreground font-normal ml-1">
                  / {results?.finalSites || 0} requis
                </span>
              </div>
            </div>
            {placedSites.length > 0 && (
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8 bg-transparent"
                onClick={handleRemoveAllSites}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Effacer
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Attribution */}
      <div className="absolute bottom-4 right-4 z-[1000] text-xs text-muted-foreground bg-card/80 px-2 py-1 rounded">
        <a href="https://leafletjs.com" target="_blank" rel="noopener noreferrer" className="hover:underline">
          Leaflet
        </a>
        {' | '}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="hover:underline">
          OpenStreetMap
        </a>
      </div>

      {/* Click instruction */}
      {placedSites.length === 0 && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1000] pointer-events-none">
          <Badge variant="secondary" className="bg-card/90 text-foreground shadow-lg px-4 py-2">
            <MapPin className="h-4 w-4 mr-2 inline" />
            Cliquez sur la carte pour placer un site eNodeB
          </Badge>
        </div>
      )}

      {/* Custom CSS for markers */}
      <style jsx global>{`
        .custom-site-marker {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
        .leaflet-popup-content {
          margin: 0;
        }
      `}</style>
    </div>
  );
}
