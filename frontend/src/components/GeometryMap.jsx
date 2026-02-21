import React, { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchRouteGeometry, fetchAllStops, fetchPrimaryRoutes } from '../api';
import { AlertCircle, CheckCircle } from 'lucide-react';

// Component to handle auto-zooming
const MapUpdater = ({ bounds }) => {
    const map = useMap();
    useEffect(() => {
        if (bounds && bounds.length > 0) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [bounds, map]);
    return null;
};

// Component to handle container resize → invalidateSize
const ResizeHandler = () => {
    const map = useMap();
    useEffect(() => {
        const observer = new ResizeObserver(() => {
            map.invalidateSize();
        });
        observer.observe(map.getContainer());
        return () => observer.disconnect();
    }, [map]);
    return null;
};

// Fit-to-bounds button component
const FitBoundsButton = ({ bounds }) => {
    const map = useMap();
    const handleClick = useCallback(() => {
        if (bounds && bounds.length > 0) {
            map.fitBounds(bounds, { padding: [50, 50], animate: true });
        }
    }, [map, bounds]);

    return (
        <div className="absolute top-[90px] right-4 z-[400] flex flex-col gap-2">
            <button
                onClick={handleClick}
                className="bg-slate-800 border cursor-pointer border-slate-600 rounded-lg shadow-lg p-2 hover:bg-slate-700 hover:border-slate-500 transition-colors flex items-center justify-center text-slate-300 hover:text-white"
                title="Karte zentrieren"
            >
                <span className="material-symbols-outlined text-xl">my_location</span>
            </button>
        </div>
    );
};

const GeometryMap = ({ selectedLine, selectedVariant, showAllStops = false, onLineSelect, routeData: propRouteData }) => {
    const [routeData, setRouteData] = useState(propRouteData);
    const [primaryRoutes, setPrimaryRoutes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Sync propRouteData to state if provided
    useEffect(() => {
        if (propRouteData) {
            setRouteData(propRouteData);
            setPrimaryRoutes([]); // Clear overview
        }
    }, [propRouteData]);

    useEffect(() => {
        // If external data is provided, don't fetch internally
        if (propRouteData) return;

        // Priority: 1. Selected Line & Variant, 2. Selected Variant (with line_id), 3. Selected Line (default variant)
        // Handle selectedLine being either an object (from internal selection) or string (from parent)
        const lineId = typeof selectedLine === 'object' ? selectedLine?.id : selectedLine;
        const variantId = selectedVariant?.id;

        if (lineId) {
            loadRoute(lineId, variantId);
            setPrimaryRoutes([]); // Clear overview when drilling down
        } else if (showAllStops) {
            loadAllStops();
            setPrimaryRoutes([]);
        } else {
            // Overview Mode: Load all primary routes
            loadPrimaryRoutes();
            setRouteData(null);
        }
    }, [selectedLine, selectedVariant, showAllStops, propRouteData]);

    const loadRoute = async (lineId, routeId) => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchRouteGeometry(lineId, routeId);
            setRouteData(data);
        } catch (err) {
            console.error(err);
            setError("Fehler beim Laden der Route.");
        } finally {
            setLoading(false);
        }
    };

    const loadAllStops = async () => {
        setLoading(true);
        setError(null);
        try {
            const stops = await fetchAllStops();
            // Transform to match routeData structure
            setRouteData({
                stops: stops.map(s => ({
                    id: s.stop_id,
                    name: s.stop_name || s.stop_text,
                    lat: s.lat,
                    lon: s.lon,
                    seq: s.stop_id,
                    stop_point_no: s.stop_point_no,
                    stop_point_text: s.stop_point_text
                })),
                geometry: null
            });
        } catch (err) {
            console.error(err);
            setError("Fehler beim Laden aller Haltestellen.");
        } finally {
            setLoading(false);
        }
    };

    const loadPrimaryRoutes = async () => {
        setLoading(true);
        setError(null);
        try {
            const routes = await fetchPrimaryRoutes();
            setPrimaryRoutes(routes);
        } catch (err) {
            console.error(err);
            setError("Fehler beim Laden der Netzübersicht.");
        } finally {
            setLoading(false);
        }
    };

    // Calculate bounds & geometry variables
    let positions = [];
    let maxVolume = 1;

    if (routeData) {
        if (Array.isArray(routeData)) {
            // New format: Array of variants
            routeData.forEach(r => {
                if (r.stops) {
                    r.stops.filter(s => s.lat !== 0).forEach(s => positions.push([s.lat, s.lon]));
                }
            });
            maxVolume = Math.max(...routeData.map(r => r.volume || 1));
        } else if (routeData.stops) {
            // Fallback for loadAllStops single object
            positions = routeData.stops.map(s => [s.lat, s.lon]).filter(p => p[0] !== 0);
        }
    } else if (primaryRoutes.length > 0) {
        primaryRoutes.forEach(r => {
            r.stops.forEach(s => positions.push(s));
        });
    }

    const bounds = positions.length > 0 ? positions : null;

    const VARIANT_COLORS = [
        '#3b82f6', // blue-500
        '#ec4899', // pink-500
        '#10b981', // emerald-500
        '#f59e0b', // amber-500
        '#8b5cf6', // violet-500
        '#06b6d4', // cyan-500
        '#f43f5e', // rose-500
        '#84cc16', // lime-500
    ];

    return (
        <div className="bg-slate-800 rounded-xl border border-slate-700 flex-1 flex flex-col overflow-hidden relative">
            {/* Header / Toolbar */}
            <div className="px-5 py-3 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
                <h3 className="text-base font-semibold text-white">
                    {selectedLine
                        ? `Linie ${typeof selectedLine === 'object' ? selectedLine.label : selectedLine} ${selectedVariant ? `(Variante ${selectedVariant.variant_no || selectedVariant.id})` : "Route"}`
                        : (showAllStops ? "Alle Haltestellen" : "Netz-Übersicht")}
                </h3>
            </div>

            {/* Map Content */}
            <div className="flex-1 relative">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 bg-slate-900/20 z-[400]">
                        Wird geladen...
                    </div>
                ) : (
                    <MapContainer
                        center={[47.0502, 8.3093]} // Luzern default
                        zoom={12}
                        style={{ height: "100%", width: "100%" }}
                        className="z-0"
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                        />

                        {/* Selected Line Variants (Drilldown) */}
                        {!showAllStops && Array.isArray(routeData) && routeData.map((route, idx) => {
                            const routePositions = route.stops.filter(s => s.lat !== 0).map(s => [s.lat, s.lon]);
                            if (routePositions.length === 0) return null;
                            const isSelected = selectedVariant && selectedVariant.id === route.route_id;

                            // If a specific variant is selected, fade out others
                            const opacity = (selectedVariant && !isSelected) ? 0.2 : 0.8;
                            // Determine weight based on frequency
                            const weight = (!selectedVariant || isSelected) ? Math.max(3, (route.volume / maxVolume) * 12) : 2;
                            const color = VARIANT_COLORS[idx % VARIANT_COLORS.length];

                            return (
                                <Polyline
                                    key={`route-${route.route_id}`}
                                    positions={routePositions}
                                    color={color}
                                    weight={weight}
                                    opacity={opacity}
                                >
                                    <Tooltip sticky>
                                        <div className="text-xs">
                                            <strong>Variante {route.route_id}</strong><br />
                                            {route.volume} Fahrten
                                        </div>
                                    </Tooltip>
                                </Polyline>
                            );
                        })}

                        {/* Old single-route fallback for all stops view */}
                        {!showAllStops && !Array.isArray(routeData) && routeData?.stops && positions.length > 0 && (
                            <Polyline
                                positions={positions}
                                color="#3b82f6"
                                weight={4}
                                opacity={0.8}
                            />
                        )}

                        {/* Primary Routes (Overview) */}
                        {!selectedLine && !selectedVariant && !showAllStops && primaryRoutes.map(line => (
                            <Polyline
                                key={line.line_id}
                                positions={line.stops}
                                color="#64748b" // slate-500
                                weight={3}
                                opacity={0.6}
                                eventHandlers={{
                                    click: () => {
                                        if (onLineSelect) {
                                            // onLineSelect needs an object with { id: line_id, label: line_no }
                                            onLineSelect({ id: line.line_id, label: line.line_no });
                                        }
                                    },
                                    mouseover: (e) => {
                                        e.target.setStyle({ color: '#3b82f6', weight: 5, opacity: 1 });
                                        e.target.bringToFront();
                                    },
                                    mouseout: (e) => {
                                        e.target.setStyle({ color: '#64748b', weight: 3, opacity: 0.6 });
                                    }
                                }}
                            >
                                <Tooltip sticky>Linie {line.line_no}: {line.name}</Tooltip>
                            </Polyline>
                        ))}

                        {/* Stops (Drilldown) */}
                        {Array.isArray(routeData) ? (
                            // Render uniquely positioned stops from all variants to avoid stacking
                            Array.from(new Map(
                                routeData.flatMap(r => r.stops || [])
                                    .filter(s => s.lat !== 0)
                                    .map(s => [`${s.lat},${s.lon}`, s])
                            ).values())
                                .map((stop, i) => (
                                    <CircleMarker
                                        key={`allstop-${i}`}
                                        center={[stop.lat, stop.lon]}
                                        radius={4}
                                        fillColor="#10b981"
                                        color="#fff"
                                        weight={1}
                                        fillOpacity={0.8}
                                    >
                                        <Popup>
                                            <div className="text-slate-800">
                                                <strong>{stop.stop_point_text || stop.name}</strong><br />
                                                Lat: {stop.lat.toFixed(6)}<br />
                                                Lon: {stop.lon.toFixed(6)}
                                            </div>
                                        </Popup>
                                    </CircleMarker>
                                ))
                        ) : (
                            routeData?.stops?.map((stop, i) => (
                                stop.lat && stop.lon && (
                                    <CircleMarker
                                        key={`st-${stop.id}-${i}`}
                                        center={[stop.lat, stop.lon]}
                                        radius={4}
                                        fillColor="#10b981"
                                        color="#fff"
                                        weight={1}
                                        fillOpacity={0.8}
                                    >
                                        <Popup>
                                            <div className="text-slate-800">
                                                <strong>{stop.stop_point_text || stop.name}</strong><br />
                                                ID: {stop.id}<br />
                                                Punkt-Nr: {stop.stop_point_no}<br />
                                                Lat: {stop.lat.toFixed(6)}<br />
                                                Lon: {stop.lon.toFixed(6)}
                                            </div>
                                        </Popup>
                                    </CircleMarker>
                                )
                            ))
                        )}

                        <MapUpdater bounds={bounds} />
                        <ResizeHandler />
                        <FitBoundsButton bounds={bounds} />
                    </MapContainer>
                )}
            </div>

            {/* Legend / Info */}
            <div className="px-4 py-2 bg-slate-900 text-sm text-slate-500 flex justify-between border-t border-slate-700">
                <div className="flex gap-4">
                    {!selectedLine && !showAllStops && <span className="flex items-center gap-1"><span className="w-4 h-1 bg-slate-500 rounded"></span> Liniennetz</span>}
                    {selectedLine && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Haltestelle</span>}
                </div>
            </div>
        </div>
    );
};

export default GeometryMap;

