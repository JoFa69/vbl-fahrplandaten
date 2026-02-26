import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';

export default function TreeMapComponent({ data = [] }) {
    const svgRef = useRef(null);
    const containerRef = useRef(null);
    const tooltipRef = useRef(null);
    const [dims, setDims] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const ro = new ResizeObserver((entries) => {
            const { width, height } = entries[0].contentRect;
            setDims({ width, height });
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const draw = useCallback(() => {
        if (!data.length || !dims.width || !dims.height) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const w = dims.width;
        const h = dims.height;
        svg.attr('width', w).attr('height', h);

        const maxLines = d3.max(data, d => d.lines) || 1;

        const colorScale = d3.scaleSequential()
            .domain([0, maxLines])
            .interpolator(d3.interpolateRgbBasis(['#1e293b', '#1e3a5f', '#2563eb', '#60a5fa', '#93c5fd']));

        // Build hierarchy
        const root = d3.hierarchy({ children: data.map(d => ({ ...d })) })
            .sum(d => Math.max(d.frequency || 0, 1))
            .sort((a, b) => b.value - a.value);

        d3.treemap()
            .size([w, h])
            .padding(2)
            .round(true)(root);

        const tooltip = d3.select(tooltipRef.current);

        // Cells
        const cell = svg.selectAll('g')
            .data(root.leaves())
            .join('g')
            .attr('transform', d => `translate(${d.x0},${d.y0})`);

        // Rects
        cell.append('rect')
            .attr('width', d => Math.max(0, d.x1 - d.x0))
            .attr('height', d => Math.max(0, d.y1 - d.y0))
            .attr('rx', 3)
            .attr('fill', d => colorScale(d.data.lines || 0))
            .attr('stroke', '#101622')
            .attr('stroke-width', 1.5)
            .attr('opacity', 0)
            .on('mouseenter', function (event, d) {
                d3.select(this)
                    .transition().duration(150)
                    .attr('stroke', '#60a5fa').attr('stroke-width', 2.5);

                tooltip
                    .style('opacity', 1)
                    .style('left', `${event.offsetX + 12}px`)
                    .style('top', `${event.offsetY - 10}px`)
                    .html(`
                        <div style="font-weight:700;margin-bottom:4px">${d.data.stop_name}</div>
                        <div>Frequenz: <span style="color:#60a5fa;font-weight:600">${(d.data.frequency || 0).toLocaleString()}</span></div>
                        <div>Linien: <span style="color:#60a5fa;font-weight:600">${d.data.lines || 0}</span></div>
                    `);
            })
            .on('mousemove', function (event) {
                tooltip
                    .style('left', `${event.offsetX + 12}px`)
                    .style('top', `${event.offsetY - 10}px`);
            })
            .on('mouseleave', function () {
                d3.select(this)
                    .transition().duration(150)
                    .attr('stroke', '#101622').attr('stroke-width', 1.5);
                tooltip.style('opacity', 0);
            })
            .transition().duration(500).delay((_, i) => i * 5)
            .attr('opacity', 1);

        // Labels — only on tiles wide & tall enough
        cell.each(function (d) {
            const tw = d.x1 - d.x0;
            const th = d.y1 - d.y0;
            const g = d3.select(this);

            if (tw > 50 && th > 28) {
                const name = d.data.stop_name || '';
                const maxChars = Math.floor(tw / 6.5);
                const displayName = name.length > maxChars ? name.substring(0, maxChars - 1) + '…' : name;
                const fontSize = tw > 100 && th > 45 ? '12px' : '10px';

                g.append('text')
                    .attr('x', 6).attr('y', 16)
                    .attr('fill', '#e2e8f0')
                    .attr('font-size', fontSize)
                    .attr('font-weight', 600)
                    .style('pointer-events', 'none')
                    .text(displayName);

                if (th > 38) {
                    g.append('text')
                        .attr('x', 6).attr('y', 30)
                        .attr('fill', '#94a3b8')
                        .attr('font-size', '10px')
                        .style('pointer-events', 'none')
                        .text(`${(d.data.frequency || 0).toLocaleString()} F.`);
                }
            }
        });

    }, [data, dims]);

    useEffect(() => { draw(); }, [draw]);

    return (
        <div ref={containerRef} className="relative w-full h-full">
            <svg ref={svgRef} className="w-full h-full" />
            <div
                ref={tooltipRef}
                style={{
                    position: 'absolute',
                    opacity: 0,
                    pointerEvents: 'none',
                    background: '#1c2433',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#e2e8f0',
                    fontSize: '12px',
                    lineHeight: 1.5,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                    zIndex: 50,
                    transition: 'opacity 0.15s ease',
                }}
            />
        </div>
    );
}
