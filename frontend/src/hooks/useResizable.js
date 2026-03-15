import { useState, useRef, useEffect } from 'react';

/**
 * Manages horizontal (sidebar width) and vertical (map height) drag-to-resize.
 * The vertical resize reads the element with id="netz-right-panel".
 */
export function useResizable({ initialSidebarWidth = 25, initialMapHeight = 60 } = {}) {
    const [sidebarWidth, setSidebarWidth] = useState(initialSidebarWidth);
    const [mapHeight, setMapHeight] = useState(initialMapHeight);
    const containerRef = useRef(null);
    const isDraggingH = useRef(false);
    const isDraggingV = useRef(false);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isDraggingH.current && containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const pct = ((e.clientX - rect.left) / rect.width) * 100;
                setSidebarWidth(Math.min(50, Math.max(15, pct)));
            }
            if (isDraggingV.current) {
                const rightPanel = document.getElementById('netz-right-panel');
                if (rightPanel) {
                    const rect = rightPanel.getBoundingClientRect();
                    const pct = ((e.clientY - rect.top) / rect.height) * 100;
                    setMapHeight(Math.min(85, Math.max(15, pct)));
                }
            }
        };
        const handleMouseUp = () => {
            isDraggingH.current = false;
            isDraggingV.current = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    return { sidebarWidth, mapHeight, containerRef, isDraggingH, isDraggingV };
}
