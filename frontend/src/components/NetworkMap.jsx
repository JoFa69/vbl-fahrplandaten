import React, { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Tooltip, useMap, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons if needed, though we use DivIcons mostly
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// A hash-based color generator for lines
const getColorForLine = (lineNo) => {
    const predefined = {
        "1": "#ef4444", "2": "#22c55e", "4": "#3b82f6", "5": "#eab308",
        "6": "#f97316", "7": "#06b6d4", "8": "#8b5cf6", "9": "#ec4899",
        "10": "#14b8a6", "11": "#f43f5e", "12": "#84cc16", "14": "#6366f1",
        "19": "#a855f7", "20": "#d946ef", "21": "#0ea5e9"
    };
    if (predefined[lineNo]) return predefined[lineNo];

    let hash = 0;
    for (let i = 0; i < lineNo.length; i++) {
        hash = lineNo.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return "#" + "00000".substring(0, 6 - c.length) + c;
};

function BoundsUpdater({ nodes }) {
    const map = useMap();
    useEffect(() => {
        if (nodes && nodes.length > 0) {
            const bounds = L.latLngBounds(nodes.map(n => [n.lat, n.lon]));
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [map, nodes]);
    return null;
}

export default function NetworkMap({ data }) {

    const { elements, bounds } = useMemo(() => {
        if (!data || !data.nodes || !data.edges) return { elements: null, bounds: null };

        // Process Edges
        // Create a lookup for nodes
        const nodeMap = {};
        let minLat = 90, maxLat = -90, minLon = 180, maxLon = -180;

        data.nodes.forEach(n => {
            nodeMap[n.id] = n;
            if (n.lat < minLat) minLat = n.lat;
            if (n.lat > maxLat) maxLat = n.lat;
            if (n.lon < minLon) minLon = n.lon;
            if (n.lon > maxLon) maxLon = n.lon;
        });

        const mapBounds = data.nodes.length > 0
            ? [[minLat, minLon], [maxLat, maxLon]]
            : [[47.050, 8.300], [47.060, 8.310]]; // Default Luzern fallback

        // Group edges by from-to to draw parallel lines with offset if there are multiple lines
        const edgeGroups = {};
        data.edges.forEach(edge => {
            const n1 = nodeMap[edge.from];
            const n2 = nodeMap[edge.to];
            if (!n1 || !n2) return;

            // Normalize pair id so A->B is same as B->A for parallel drawing logic
            const pairId = [edge.from, edge.to].sort().join('-');
            if (!edgeGroups[pairId]) edgeGroups[pairId] = [];
            edgeGroups[pairId].push({ ...edge, n1, n2 });
        });

        const edgeComponents = [];
        let edgeKeyIdx = 0;

        Object.values(edgeGroups).forEach(group => {
            // For overlapping lines, we should offset them slightly in a real D3 map, 
            // but in Leaflet drawing parallel polylines is tricky. 
            // We'll draw them on top of each other, slightly varying widths, or rely on Tooltips.
            // As a quick topological hack: we can just draw them.

            // Sort by trip volume so thickest is in back
            group.sort((a, b) => b.trip_volume - a.trip_volume);

            group.forEach((edge, i) => {
                // Convert lat/lng to projected coordinates for SVG drawing
                // For a proper SVG curve we need the pixel coordinates, but since we are rendering in React-Leaflet
                // A better approach for curved lines in Leaflet without custom SVG canvas is using a plugin like Leaflet.curve
                // Or simply drawing multiple polylines with computed offsets.

                // Since calculating pixel offsets dynamically in a responsive map is complex without a plugin,
                // let's at least add some transparency and sorting so we can see all lines, and use
                // an offset based on lat/lon mathematically.
                // An offset of 0.0003 degrees is roughly 30 meters.

                // Calculate bearing/perpendicular vector for offset
                const dx = edge.n2.lon - edge.n1.lon;
                const dy = edge.n2.lat - edge.n1.lat;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Perpendicular unit vector
                const ux = -dy / dist;
                const uy = dx / dist;

                // i = 0 -> 0, i = 1 -> +1, i = 2 -> -1, i = 3 -> +2, etc.
                const offsetMultiplier = i === 0 ? 0 : (i % 2 === 0 ? -1 : 1) * Math.ceil(i / 2);

                // Reduce the base offset a bit, 0.0001 is subtle but visible
                const offsetScale = 0.00015;

                const offsetX = ux * offsetScale * offsetMultiplier;
                const offsetY = uy * offsetScale * offsetMultiplier;

                const positions = [
                    [edge.n1.lat + offsetY, edge.n1.lon + offsetX],
                    [edge.n2.lat + offsetY, edge.n2.lon + offsetX]
                ];

                // Weight based on trip volume, max 8px, min 2px
                const weight = Math.min(8, Math.max(2, Math.sqrt(edge.trip_volume) / 2));

                edgeComponents.push(
                    <Polyline
                        key={`edge-${edgeKeyIdx++}`}
                        positions={positions}
                        pathOptions={{
                            color: getColorForLine(edge.line_no),
                            weight: weight,
                            opacity: 0.9
                        }}
                    >
                        <Tooltip sticky>
                            <span className="font-bold">Linie {edge.line_no}</span>
                            <br />Fahrten: {edge.trip_volume}
                            {edge.duration > 0 && <><br />Fahrzeit: ~{edge.duration} Min.</>}
                        </Tooltip>
                    </Polyline>
                );
            });
        });

        // Process Nodes (Custom Markers)
        const nodeComponents = data.nodes.map(node => {
            const timetables = data.timetables ? data.timetables[node.id] : [];

            // Build timetable HTML string for the marker
            let tHtml = '';
            if (timetables && timetables.length > 0) {
                // To keep it compact, maybe group by line
                const lineGroups = {};
                timetables.forEach(t => {
                    if (!lineGroups[t.line_no]) lineGroups[t.line_no] = [];
                    lineGroups[t.line_no].push(t);
                });

                // Construct the inner HTML. 
                // We show Abfahrtsminuten am Rand (outside the node core).
                let rows = '';
                Object.keys(lineGroups).slice(0, 5).forEach(lineNo => {
                    const color = getColorForLine(lineNo);
                    const ts = lineGroups[lineNo];
                    // Pick the first direction's minutes for compactness
                    const minutes = ts[0].minutes;
                    const takt = ts[0].takt;
                    rows += `<div style="font-size: 13px; line-height: 1.2; display: flex; gap: 4px; align-items: baseline; white-space: nowrap;">
                        <span style="font-weight: bold; color: ${color}; min-width: 16px; text-align: right;">${lineNo}</span> 
                        <span style="color: #334155;">${minutes} <span style="color: #ea580c; font-size: 12px; font-weight: bold;">(${takt}')</span></span>
                    </div>`;
                });
                if (Object.keys(lineGroups).length > 5) {
                    rows += `<div style="font-size: 12px; color: #94a3b8; font-style: italic;">+ weitere Linien</div>`;
                }

                tHtml = `<div style="position: absolute; left: 16px; top: -16px; background: rgba(255,255,255,0.9); padding: 3px 6px; border-radius: 4px; border: 1px solid rgba(203,213,225,0.9); box-shadow: 0 1px 3px rgba(0,0,0,0.1); backdrop-filter: blur(2px); pointer-events: none; z-index: 5;">
                    <div style="font-size: 13px; font-weight: bold; margin-bottom: 2px; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px;">${node.name}</div>
                    ${rows}
                </div>`;
            } else {
                tHtml = `<div style="position: absolute; left: 16px; top: -8px; background: rgba(255,255,255,0.9); padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(203,213,225,0.9); box-shadow: 0 1px 3px rgba(0,0,0,0.1); pointer-events: none; font-size: 13px; font-weight: bold; white-space: nowrap; color: #0f172a; z-index: 5;">
                    ${node.name}
                </div>`;
            }

            // Determine if Hub or Terminal for visual size
            const isHub = node.categories.includes('hub');
            const boxClass = isHub
                ? "width: 16px; height: 16px; border-radius: 8px; border: 3px solid #1e293b; background: white;"
                : "width: 12px; height: 12px; border-radius: 6px; border: 2px solid #64748b; background: white;";

            const iconHtml = `<div style="position: relative; display: flex; align-items: center; justify-content: center;">
                <div style="${boxClass} z-index: 10; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>
                ${tHtml}
            </div>`;

            const icon = L.divIcon({
                html: iconHtml,
                className: 'network-node-icon',
                iconSize: [0, 0], // The offset is managed by the html position:absolute relative to center
                iconAnchor: [0, 0]
            });

            return (
                <Marker
                    key={`node-${node.id}`}
                    position={[node.lat, node.lon]}
                    icon={icon}
                />
            );
        });

        return { elements: [...edgeComponents, ...nodeComponents], bounds: mapBounds };
    }, [data]);

    if (!data) return null;

    return (
        <MapContainer
            bounds={bounds}
            zoom={13}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%', background: '#f8fafc' }}
            zoomControl={false}
        >
            <TileLayer
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                opacity={0.5}
            />
            {elements}
            <BoundsUpdater nodes={data?.nodes} />
        </MapContainer>
    );
}
