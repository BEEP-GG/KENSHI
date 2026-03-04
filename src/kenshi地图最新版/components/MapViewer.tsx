import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, ImageOverlay, Polygon, Marker, Popup, useMap, Tooltip, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { continents, cities, outposts, ruins, villages, MAP_SIZE, Continent, City, MapFeature } from '../data/mapData';
import { X, Map as MapIcon, Info, ZoomIn, ZoomOut, Crosshair, CircleDot, Triangle, X as XIcon, MapPin, Layers, Eye, EyeOff, Tent, ArrowLeft } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import { motion, AnimatePresence } from 'motion/react';

// Fix for default marker icon in React Leaflet
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom hook to set map bounds and CRS
function MapController({ onMapClick, selectedRegion }: { onMapClick: (latlng: L.LatLng) => void, selectedRegion: Continent | null }) {
  const map = useMap();

  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });

  useEffect(() => {
    if (selectedRegion) {
      // Fly to selected region bounds
      // Calculate bounds from polygon coordinates
      let coords: [number, number][] = [];
      
      // Handle both single polygon and multi-polygon
      if (selectedRegion.coordinates.length > 0) {
        if (Array.isArray(selectedRegion.coordinates[0][0])) {
           // Multi-polygon: flatten all points
           (selectedRegion.coordinates as [number, number][][]).forEach(poly => {
             poly.forEach(pt => coords.push([MAP_SIZE[0] - pt[0], pt[1]]));
           });
        } else {
           // Single polygon
           (selectedRegion.coordinates as [number, number][]).forEach(pt => {
             coords.push([MAP_SIZE[0] - pt[0], pt[1]]);
           });
        }
      }

      if (coords.length > 0) {
        const bounds = L.latLngBounds(coords);
        map.flyToBounds(bounds, { padding: [50, 50], duration: 1.5 });
      }
    } else {
      // Reset to world view
      const bounds: L.LatLngBoundsExpression = [[0, 0], [MAP_SIZE[0], MAP_SIZE[1]]];
      map.flyToBounds(bounds, { duration: 1.5 });
    }
  }, [selectedRegion, map]);

  useEffect(() => {
    // Initial setup
    const bounds: L.LatLngBoundsExpression = [[0, 0], [MAP_SIZE[0], MAP_SIZE[1]]];
    const expandedBounds: L.LatLngBoundsExpression = [
      [-MAP_SIZE[0] * 0.5, -MAP_SIZE[1] * 0.5], 
      [MAP_SIZE[0] * 1.5, MAP_SIZE[1] * 1.5]
    ];
    
    map.setMaxBounds(expandedBounds);
    map.setMinZoom(-5); 
    map.setMaxZoom(5);
    
    if (map.getZoom() === -1 && !selectedRegion) {
      map.fitBounds(bounds);
    }
  }, [map]);

  return null;
}

function ZoomControls() {
  const map = useMap();
  return (
    <div className="absolute bottom-8 right-8 z-[1000] flex flex-col gap-2 bg-slate-900/80 backdrop-blur-sm p-2 rounded-lg border border-slate-700/50 shadow-xl">
      <button 
        onClick={() => map.zoomIn()}
        className="p-2 hover:bg-slate-700 rounded-md text-slate-200 transition-colors"
        title="放大"
      >
        <ZoomIn size={20} />
      </button>
      <button 
        onClick={() => map.zoomOut()}
        className="p-2 hover:bg-slate-700 rounded-md text-slate-200 transition-colors"
        title="缩小"
      >
        <ZoomOut size={20} />
      </button>
    </div>
  );
}

// Custom Icons for different feature types - more geometric and professional
const createCustomIcon = (IconComponent: any, color: string) => {
  const iconHtml = renderToStaticMarkup(
    <div style={{ 
      color, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      position: 'relative',
      width: '24px',
      height: '24px'
    }}>
      {/* Subtle glow effect */}
      <div style={{ 
        position: 'absolute', 
        width: '100%', 
        height: '100%', 
        backgroundColor: color, 
        opacity: 0.15, 
        borderRadius: '50%', 
        filter: 'blur(4px)' 
      }} />
      <IconComponent size={16} strokeWidth={1.5} />
    </div>
  );
  return L.divIcon({
    html: iconHtml,
    className: 'custom-map-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const cityIcon = createCustomIcon(CircleDot, '#38bdf8'); // sky-400
const outpostIcon = createCustomIcon(Triangle, '#4ade80'); // green-400
const villageIcon = createCustomIcon(Tent, '#fbbf24'); // amber-400
const ruinIcon = createCustomIcon(XIcon, '#f87171'); // red-400

export default function MapViewer() {
  const [selectedFeature, setSelectedFeature] = useState<MapFeature | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<Continent | null>(null);
  const [hoveredFeatureId, setHoveredFeatureId] = useState<string | null>(null);
  const [clickedCoords, setClickedCoords] = useState<L.LatLng | null>(null);

  // Layer visibility controls
  // Default: Regions ON, others OFF (unless a region is selected)
  const [showRegions, setShowRegions] = useState(true);
  const [showTowns, setShowTowns] = useState(false);
  const [showOutposts, setShowOutposts] = useState(false);
  const [showVillages, setShowVillages] = useState(false);
  const [showRuins, setShowRuins] = useState(false);

  const handleFeatureClick = (feature: MapFeature) => {
    // If clicking a continent
    if (feature.type === 'continent') {
      // If we are already viewing this region, do nothing (or maybe zoom in?)
      if (selectedRegion?.id === feature.id) {
        return;
      }
      setSelectedRegion(feature as Continent);
      setSelectedFeature(feature);
    } else {
      // If clicking a location (city, outpost, etc.)
      setSelectedFeature(feature);
    }
  };

  const handleMapClick = (latlng: L.LatLng) => {
    // Flip back for display (only vertical flip remains)
    const originalCoords = L.latLng(MAP_SIZE[0] - latlng.lat, latlng.lng);
    setClickedCoords(originalCoords);
    
    // If we have a selected feature that is NOT a continent (i.e., a location detail view),
    // clicking the map should go back to the region view if a region is selected.
    if (selectedFeature && selectedFeature.type !== 'continent' && selectedRegion) {
      setSelectedFeature(selectedRegion);
    } else {
      // Otherwise, close sidebar
      setSelectedFeature(null);
    }
  };

  const handleBackToWorld = () => {
    setSelectedRegion(null);
    setSelectedFeature(null);
  };

  const handleBackToRegion = () => {
    if (selectedRegion) {
      setSelectedFeature(selectedRegion);
    }
  };

  const closeSidebar = () => {
    // If showing a location detail, go back to region
    if (selectedFeature && selectedFeature.type !== 'continent' && selectedRegion) {
      setSelectedFeature(selectedRegion);
    } else {
      setSelectedFeature(null);
    }
  };

  const getPolygonPositions = (coords: [number, number][] | [number, number][][]): any => {
    if (coords.length === 0) return [];
    // Check if it's a multi-polygon (array of arrays of points)
    if (Array.isArray(coords[0][0])) {
      return (coords as [number, number][][]).map(poly => 
        poly.map(([y, x]) => [MAP_SIZE[0] - y, x])
      );
    }
    // Single polygon
    return (coords as [number, number][]).map(([y, x]) => [MAP_SIZE[0] - y, x]);
  };

  // Filter locations based on selected region OR global toggle
  const shouldShowLocation = (location: City) => {
    // If global toggle is ON, show it
    // If a region is selected AND the location belongs to that region, show it
    
    // Determine the type-specific toggle state
    let isTypeEnabled = false;
    if (location.type === 'city') isTypeEnabled = showTowns;
    else if (location.type === 'outpost') isTypeEnabled = showOutposts;
    else if (location.type === 'village') isTypeEnabled = showVillages;
    else if (location.type === 'ruin') isTypeEnabled = showRuins;

    // Logic:
    // 1. If global toggle for this type is ON, show it (regardless of region selection)
    // 2. If a region is selected AND location is in that region, show it (auto-enable for that region)
    
    if (isTypeEnabled) return true;
    
    if (selectedRegion && location.regionId === selectedRegion.id) {
      return true;
    }
    
    return false;
  };

  // Memoize processed continents for performance
  const processedContinents = useMemo(() => {
    return continents.map(continent => ({
      ...continent,
      positions: getPolygonPositions(continent.coordinates)
    }));
  }, []);

  // Get contents of the selected region
  const regionContents = useMemo(() => {
    if (selectedFeature?.type === 'continent') {
      const regionId = selectedFeature.id;
      return {
        cities: cities.filter(l => l.regionId === regionId),
        outposts: outposts.filter(l => l.regionId === regionId),
        villages: villages.filter(l => l.regionId === regionId),
        ruins: ruins.filter(l => l.regionId === regionId),
      };
    }
    return null;
  }, [selectedFeature]);

  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden font-sans text-slate-100">
      
      {/* Map Container */}
      <MapContainer
        preferCanvas={true} // Performance optimization
        center={[MAP_SIZE[0] / 2, MAP_SIZE[1] / 2]}
        zoom={-1}
        scrollWheelZoom={true}
        crs={L.CRS.Simple}
        style={{ height: '100%', width: '100%', background: '#020617' }} // slate-950
        zoomControl={false} // We'll add custom controls
        attributionControl={false}
      >
        <MapController onMapClick={handleMapClick} selectedRegion={selectedRegion} />
        <ZoomControls />

        {/* Continents */}
        {showRegions && processedContinents.map((continent) => {
          // If a region is selected, dim others
          const isSelected = selectedRegion?.id === continent.id;
          const isDimmed = selectedRegion && !isSelected;
          
          return (
            <Polygon
              key={continent.id}
              positions={continent.positions}
              pathOptions={{
                color: hoveredFeatureId === continent.id || isSelected ? '#38bdf8' : '#94a3b8',
                fillColor: continent.color,
                fillOpacity: isSelected ? 0.2 : (isDimmed ? 0.1 : (hoveredFeatureId === continent.id ? 0.6 : 0.4)),
                weight: hoveredFeatureId === continent.id || isSelected ? 2 : 1,
                opacity: isDimmed ? 0.3 : 1
              }}
              eventHandlers={{
                click: (e) => {
                  L.DomEvent.stopPropagation(e);
                  handleFeatureClick(continent);
                },
                mouseover: () => setHoveredFeatureId(continent.id),
                mouseout: () => setHoveredFeatureId(null),
              }}
            >
               {/* Only show tooltip if not dimmed */}
               {!isDimmed && (
                 <Tooltip 
                    permanent 
                    direction="center" 
                    opacity={0.8} 
                    className="region-label-tooltip"
                 >
                    <span className="font-bold text-xs text-white drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)] pointer-events-none">
                      {continent.name}
                    </span>
                 </Tooltip>
               )}
            </Polygon>
          );
        })}

        {/* Cities */}
        {cities.filter(shouldShowLocation).map((city) => (
          <Marker
            key={city.id}
            position={[MAP_SIZE[0] - city.coordinates[0], city.coordinates[1]]}
            icon={cityIcon}
            eventHandlers={{
              click: (e) => {
                L.DomEvent.stopPropagation(e);
                handleFeatureClick(city);
              },
              mouseover: () => setHoveredFeatureId(city.id),
              mouseout: () => setHoveredFeatureId(null),
            }}
          >
             <Tooltip direction="top" offset={[0, -15]} opacity={1} permanent={false}>
                <span className="font-bold text-sky-300">{city.name}</span>
             </Tooltip>
          </Marker>
        ))}

        {/* Outposts */}
        {outposts.filter(shouldShowLocation).map((outpost) => (
          <Marker
            key={outpost.id}
            position={[MAP_SIZE[0] - outpost.coordinates[0], outpost.coordinates[1]]}
            icon={outpostIcon}
            eventHandlers={{
              click: (e) => {
                L.DomEvent.stopPropagation(e);
                handleFeatureClick(outpost);
              },
              mouseover: () => setHoveredFeatureId(outpost.id),
              mouseout: () => setHoveredFeatureId(null),
            }}
          >
             <Tooltip direction="top" offset={[0, -15]} opacity={1} permanent={false}>
                <span className="font-bold text-green-400">{outpost.name}</span>
             </Tooltip>
          </Marker>
        ))}

        {/* Villages */}
        {villages.filter(shouldShowLocation).map((village) => (
          <Marker
            key={village.id}
            position={[MAP_SIZE[0] - village.coordinates[0], village.coordinates[1]]}
            icon={villageIcon}
            eventHandlers={{
              click: (e) => {
                L.DomEvent.stopPropagation(e);
                handleFeatureClick(village);
              },
              mouseover: () => setHoveredFeatureId(village.id),
              mouseout: () => setHoveredFeatureId(null),
            }}
          >
             <Tooltip direction="top" offset={[0, -15]} opacity={1} permanent={false}>
                <span className="font-bold text-amber-400">{village.name}</span>
             </Tooltip>
          </Marker>
        ))}

        {/* Ruins */}
        {ruins.filter(shouldShowLocation).map((ruin) => (
          <Marker
            key={ruin.id}
            position={[MAP_SIZE[0] - ruin.coordinates[0], ruin.coordinates[1]]}
            icon={ruinIcon}
            eventHandlers={{
              click: (e) => {
                L.DomEvent.stopPropagation(e);
                handleFeatureClick(ruin);
              },
              mouseover: () => setHoveredFeatureId(ruin.id),
              mouseout: () => setHoveredFeatureId(null),
            }}
          >
             <Tooltip direction="top" offset={[0, -15]} opacity={1} permanent={false}>
                <span className="font-bold text-red-400">{ruin.name}</span>
             </Tooltip>
          </Marker>
        ))}

      </MapContainer>

      {/* UI Overlay: Title - REMOVED per user request */}

      {/* Back to World Button (Only when region selected) */}
      <AnimatePresence>
        {selectedRegion && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-6 left-6 z-[1000]"
          >
            <button
              onClick={handleBackToWorld}
              className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg shadow-lg transition-colors font-medium"
            >
              <ArrowLeft size={16} />
              返回全图
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* UI Overlay: Legend */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/80 backdrop-blur-md border border-slate-700/50 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-8">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-slate-400 opacity-60 border border-white/20"></div>
          <span className="text-xs font-medium text-slate-300">区域</span>
        </div>
        <div className="flex items-center gap-2">
          <CircleDot size={16} className="text-sky-400" />
          <span className="text-xs font-medium text-slate-300">城镇</span>
        </div>
        <div className="flex items-center gap-2">
          <Triangle size={16} className="text-green-400" />
          <span className="text-xs font-medium text-slate-300">哨站</span>
        </div>
        <div className="flex items-center gap-2">
          <Tent size={16} className="text-amber-400" />
          <span className="text-xs font-medium text-slate-300">村庄</span>
        </div>
        <div className="flex items-center gap-2">
          <XIcon size={16} className="text-red-400" />
          <span className="text-xs font-medium text-slate-300">废墟</span>
        </div>
      </div>

      {/* UI Overlay: Layer Controls */}
      <div className="absolute top-6 right-6 z-[1000] bg-slate-900/80 backdrop-blur-md border border-slate-700/50 p-4 rounded-2xl shadow-2xl flex flex-col gap-3 min-w-[180px]">
        <div className="flex items-center gap-2 mb-1 border-b border-slate-700/50 pb-2">
          <Layers size={16} className="text-slate-400" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">图层控制</span>
        </div>
        
        <button 
          onClick={() => setShowRegions(!showRegions)}
          className="flex items-center justify-between group w-full"
        >
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full border ${showRegions ? 'bg-slate-400 border-white/20' : 'bg-transparent border-slate-600'}`}></div>
            <span className={`text-xs font-medium transition-colors ${showRegions ? 'text-slate-200' : 'text-slate-500'}`}>区域显示</span>
          </div>
          {showRegions ? <Eye size={14} className="text-sky-400" /> : <EyeOff size={14} className="text-slate-600" />}
        </button>

        <button 
          onClick={() => setShowTowns(!showTowns)}
          className="flex items-center justify-between group w-full"
        >
          <div className="flex items-center gap-2">
            <CircleDot size={14} className={showTowns ? 'text-sky-400' : 'text-slate-600'} />
            <span className={`text-xs font-medium transition-colors ${showTowns ? 'text-slate-200' : 'text-slate-500'}`}>城镇显示</span>
          </div>
          {showTowns ? <Eye size={14} className="text-sky-400" /> : <EyeOff size={14} className="text-slate-600" />}
        </button>

        <button 
          onClick={() => setShowOutposts(!showOutposts)}
          className="flex items-center justify-between group w-full"
        >
          <div className="flex items-center gap-2">
            <Triangle size={14} className={showOutposts ? 'text-green-400' : 'text-slate-600'} />
            <span className={`text-xs font-medium transition-colors ${showOutposts ? 'text-slate-200' : 'text-slate-500'}`}>哨站显示</span>
          </div>
          {showOutposts ? <Eye size={14} className="text-sky-400" /> : <EyeOff size={14} className="text-slate-600" />}
        </button>

        <button 
          onClick={() => setShowVillages(!showVillages)}
          className="flex items-center justify-between group w-full"
        >
          <div className="flex items-center gap-2">
            <Tent size={14} className={showVillages ? 'text-amber-400' : 'text-slate-600'} />
            <span className={`text-xs font-medium transition-colors ${showVillages ? 'text-slate-200' : 'text-slate-500'}`}>村庄显示</span>
          </div>
          {showVillages ? <Eye size={14} className="text-sky-400" /> : <EyeOff size={14} className="text-slate-600" />}
        </button>

        <button 
          onClick={() => setShowRuins(!showRuins)}
          className="flex items-center justify-between group w-full"
        >
          <div className="flex items-center gap-2">
            <XIcon size={14} className={showRuins ? 'text-red-400' : 'text-slate-600'} />
            <span className={`text-xs font-medium transition-colors ${showRuins ? 'text-slate-200' : 'text-slate-500'}`}>废墟显示</span>
          </div>
          {showRuins ? <Eye size={14} className="text-sky-400" /> : <EyeOff size={14} className="text-slate-600" />}
        </button>
      </div>

      {/* UI Overlay: Coordinates Display */}
      <AnimatePresence>
        {clickedCoords && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/90 backdrop-blur-md border border-slate-700/50 px-4 py-2 rounded-full shadow-2xl flex items-center gap-3"
          >
            <Crosshair className="w-4 h-4 text-sky-400" />
            <div className="flex gap-4 text-xs font-mono">
              <div className="flex gap-1">
                <span className="text-slate-500">Y:</span>
                <span className="text-sky-300">{Math.round(clickedCoords.lat)}</span>
              </div>
              <div className="flex gap-1">
                <span className="text-slate-500">X:</span>
                <span className="text-sky-300">{Math.round(clickedCoords.lng)}</span>
              </div>
            </div>
            <button 
              onClick={() => setClickedCoords(null)}
              className="ml-2 text-slate-500 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* UI Overlay: Sidebar / Info Panel */}
      <AnimatePresence>
        {selectedFeature && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute top-6 right-6 bottom-6 w-96 z-[1000] bg-slate-900/90 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-700/50 flex justify-between items-start">
              <div>
                {selectedFeature.type !== 'continent' && selectedRegion && (
                  <button 
                    onClick={handleBackToRegion}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-sky-400 transition-colors mb-2 group"
                  >
                    <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" />
                    返回 {selectedRegion.name}
                  </button>
                )}
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-2 border ${
                  selectedFeature.type === 'continent' ? 'bg-slate-500/20 text-slate-300 border-slate-500/30' :
                  selectedFeature.type === 'city' ? 'bg-sky-500/20 text-sky-300 border-sky-500/30' :
                  selectedFeature.type === 'outpost' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                  selectedFeature.type === 'village' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                  'bg-red-500/20 text-red-300 border-red-500/30'
                }`}>
                  {selectedFeature.type === 'continent' ? '区域' : 
                   selectedFeature.type === 'city' ? '城镇' : 
                   selectedFeature.type === 'outpost' ? '哨站' : 
                   selectedFeature.type === 'village' ? '村庄' : '废墟'}
                </span>
                <h2 className="text-2xl font-bold text-white leading-tight">{selectedFeature.name}</h2>
              </div>
              <button 
                onClick={closeSidebar}
                className="p-2 rounded-full hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
              <p className="text-slate-300 leading-relaxed text-sm mb-6">
                {selectedFeature.description}
              </p>

              {/* Region Contents List */}
              {regionContents && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Cities */}
                  {regionContents.cities.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <CircleDot size={14} />
                        城镇 ({regionContents.cities.length})
                      </h3>
                      <div className="grid grid-cols-1 gap-2">
                        {regionContents.cities.map(city => (
                          <button
                            key={city.id}
                            onClick={() => handleFeatureClick(city)}
                            className="text-left px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/30 hover:border-sky-500/30 transition-all group w-full flex items-center justify-between"
                          >
                            <span className="text-slate-300 text-sm group-hover:text-sky-300 transition-colors">{city.name}</span>
                            <ArrowLeft size={12} className="opacity-0 group-hover:opacity-100 text-sky-400 rotate-180 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Outposts */}
                  {regionContents.outposts.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-green-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Triangle size={14} />
                        哨站 ({regionContents.outposts.length})
                      </h3>
                      <div className="grid grid-cols-1 gap-2">
                        {regionContents.outposts.map(outpost => (
                          <button
                            key={outpost.id}
                            onClick={() => handleFeatureClick(outpost)}
                            className="text-left px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/30 hover:border-green-500/30 transition-all group w-full flex items-center justify-between"
                          >
                            <span className="text-slate-300 text-sm group-hover:text-green-300 transition-colors">{outpost.name}</span>
                            <ArrowLeft size={12} className="opacity-0 group-hover:opacity-100 text-green-400 rotate-180 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Villages */}
                  {regionContents.villages.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Tent size={14} />
                        村庄 ({regionContents.villages.length})
                      </h3>
                      <div className="grid grid-cols-1 gap-2">
                        {regionContents.villages.map(village => (
                          <button
                            key={village.id}
                            onClick={() => handleFeatureClick(village)}
                            className="text-left px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/30 hover:border-amber-500/30 transition-all group w-full flex items-center justify-between"
                          >
                            <span className="text-slate-300 text-sm group-hover:text-amber-300 transition-colors">{village.name}</span>
                            <ArrowLeft size={12} className="opacity-0 group-hover:opacity-100 text-amber-400 rotate-180 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ruins */}
                  {regionContents.ruins.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <XIcon size={14} />
                        废墟 ({regionContents.ruins.length})
                      </h3>
                      <div className="grid grid-cols-1 gap-2">
                        {regionContents.ruins.map(ruin => (
                          <button
                            key={ruin.id}
                            onClick={() => handleFeatureClick(ruin)}
                            className="text-left px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/30 hover:border-red-500/30 transition-all group w-full flex items-center justify-between"
                          >
                            <span className="text-slate-300 text-sm group-hover:text-red-300 transition-colors">{ruin.name}</span>
                            <ArrowLeft size={12} className="opacity-0 group-hover:opacity-100 text-red-400 rotate-180 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zoom Controls (Custom) - Handled inside MapContainer now */}
    </div>
  );
}
