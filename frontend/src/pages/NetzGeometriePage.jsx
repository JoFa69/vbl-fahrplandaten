import React, { useState, useEffect, useCallback } from 'react';
import { fetchGeometryMetrics, fetchRouteGeometry, fetchPrimaryRoutes, fetchLineVariants } from '../api';
import { useResizable } from '../hooks/useResizable';
import NetworkLeftPanel from '../components/netz-geometrie/NetworkLeftPanel';
import NetworkRightPanel from '../components/netz-geometrie/NetworkRightPanel';

export default function NetzGeometriePage() {
    // Data state
    const [lines, setLines] = useState([]);
    const [variants, setVariants] = useState([]);
    const [primaryRoutes, setPrimaryRoutes] = useState([]);
    const [routeData, setRouteData] = useState(null);
    const [matrixData, setMatrixData] = useState(null);
    const [matrixLoading, setMatrixLoading] = useState(false);
    const [matrixDirection, setMatrixDirection] = useState(1);

    // Selection state
    const [selectedLine, setSelectedLine] = useState(null);
    const [selectedVariant, setSelectedVariant] = useState(null);

    // UI state
    const [loading, setLoading] = useState(true);
    const [variantsLoading, setVariantsLoading] = useState(false);
    const [mapLoading, setMapLoading] = useState(false);
    const [selectedFahrtart, setSelectedFahrtart] = useState(null);
    const [level, setLevel] = useState('lines');

    // ─── Resizable layout ──────────────────────────────────────────────────
    const { sidebarWidth, mapHeight, containerRef, isDraggingH, isDraggingV } = useResizable();

    // ─── Data Fetching ──────────────────────────────────────────────────
    const loadMainData = useCallback(async () => {
        setLoading(true);
        try {
            const [linesData, routesData] = await Promise.all([
                fetchGeometryMetrics('lines', null, null, null, selectedFahrtart),
                fetchPrimaryRoutes(selectedFahrtart),
            ]);
            setLines(linesData || []);
            setPrimaryRoutes(routesData || []);
        } catch (e) {
            console.error('Failed to load geometry data', e);
        } finally {
            setLoading(false);
        }
    }, [selectedFahrtart]);

    useEffect(() => {
        loadMainData();
    }, [loadMainData]);

    // Refetch variants if filter changes while in variants view
    useEffect(() => {
        if (level === 'variants' && selectedLine) {
            const refetchVariants = async () => {
                setVariantsLoading(true);
                try {
                    const variantsData = await fetchGeometryMetrics('variants', null, null, selectedLine.line_no, selectedFahrtart);
                    setVariants(variantsData || []);
                } catch (e) {
                    console.error('Failed to reload variants', e);
                } finally {
                    setVariantsLoading(false);
                }
            };
            refetchVariants();
        }
    }, [selectedFahrtart, level, selectedLine]);

    // Reload matrix when direction changes
    useEffect(() => {
        if (selectedLine) {
            const loadMatrix = async () => {
                setMatrixLoading(true);
                try {
                    const matrixRes = await fetchLineVariants(selectedLine.line_no, matrixDirection);
                    setMatrixData(matrixRes);
                } catch (e) {
                    console.error('Failed to load matrix data', e);
                } finally {
                    setMatrixLoading(false);
                }
            };
            loadMatrix();
        }
    }, [matrixDirection]);

    // ─── Event Handlers ─────────────────────────────────────────────────
    const handleLineClick = useCallback(async (line) => {
        setSelectedLine(line);
        setSelectedVariant(null);
        setLevel('variants');
        setVariantsLoading(true);

        try {
            const variantsData = await fetchGeometryMetrics('variants', null, null, line.line_no, selectedFahrtart);
            setVariants(variantsData || []);
        } catch (e) {
            console.error('Failed to load variants', e);
        } finally {
            setVariantsLoading(false);
        }

        setMapLoading(true);
        try {
            const data = await fetchRouteGeometry(line.line_no);
            setRouteData(data);
        } catch (e) {
            console.error('Failed to load route geometry', e);
        } finally {
            setMapLoading(false);
        }

        setMatrixLoading(true);
        try {
            const matrixRes = await fetchLineVariants(line.line_no, matrixDirection);
            setMatrixData(matrixRes);
        } catch (e) {
            console.error('Failed to load matrix data', e);
        } finally {
            setMatrixLoading(false);
        }
    }, [selectedFahrtart, matrixDirection]);

    const handleVariantClick = useCallback(async (variant) => {
        if (selectedVariant?.id === variant.id) {
            setSelectedVariant(null);
            if (selectedLine) {
                setMapLoading(true);
                try {
                    const data = await fetchRouteGeometry(selectedLine.line_no);
                    setRouteData(data);
                } catch (e) {
                    console.error(e);
                } finally {
                    setMapLoading(false);
                }
            }
            return;
        }
        setSelectedVariant(variant);
        setMapLoading(true);
        try {
            const data = await fetchRouteGeometry(selectedLine.line_no, variant.id);
            setRouteData(data);
        } catch (e) {
            console.error('Failed to load variant geometry', e);
        } finally {
            setMapLoading(false);
        }
    }, [selectedLine, selectedVariant]);

    const handleBackToLines = () => {
        setLevel('lines');
        setSelectedLine(null);
        setSelectedVariant(null);
        setVariants([]);
        setRouteData(null);
        setMatrixData(null);
    };

    const handleMapLineSelect = useCallback((lineStub) => {
        const fullLine = lines.find(l => l.line_no === String(lineStub.label));
        if (fullLine) handleLineClick(fullLine);
    }, [lines, handleLineClick]);

    // ─── Render ─────────────────────────────────────────────────────────
    return (
        <div ref={containerRef} className="h-full w-full flex min-h-0 min-w-0 relative" style={{ overflow: 'hidden' }}>
            {/* Left Panel */}
            <div
                className="h-full flex flex-col border-r border-border-dark bg-surface-dark bg-slate-900 shrink-0"
                style={{ width: `${sidebarWidth}%`, minWidth: 250 }}
            >
                <NetworkLeftPanel
                    level={level}
                    selectedLine={selectedLine}
                    selectedVariant={selectedVariant}
                    selectedFahrtart={selectedFahrtart}
                    setSelectedFahrtart={setSelectedFahrtart}
                    loading={loading}
                    variantsLoading={variantsLoading}
                    lines={lines}
                    variants={variants}
                    handleLineClick={handleLineClick}
                    handleVariantClick={handleVariantClick}
                    handleBackToLines={handleBackToLines}
                />
            </div>

            {/* Horizontal Resize Handle */}
            <div
                className="h-full w-[6px] bg-slate-800 hover:bg-primary/50 active:bg-primary transition-colors cursor-col-resize flex flex-col items-center justify-center shrink-0 z-50"
                onMouseDown={(e) => {
                    e.preventDefault();
                    isDraggingH.current = true;
                    document.body.style.cursor = 'col-resize';
                    document.body.style.userSelect = 'none';
                }}
            >
                <div className="h-10 w-1 bg-slate-500 rounded-full" />
            </div>

            {/* Right Panel */}
            <NetworkRightPanel
                selectedLine={selectedLine}
                selectedVariant={selectedVariant}
                routeData={routeData}
                primaryRoutes={primaryRoutes}
                matrixData={matrixData}
                matrixLoading={matrixLoading}
                matrixDirection={matrixDirection}
                setMatrixDirection={setMatrixDirection}
                mapLoading={mapLoading}
                mapHeight={mapHeight}
                isDraggingV={isDraggingV}
                handleVariantClick={handleVariantClick}
                onMapLineSelect={handleMapLineSelect}
            />
        </div>
    );
}
