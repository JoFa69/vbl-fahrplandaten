import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';

const MARGIN = { top: 20, right: 30, bottom: 50, left: 65 };

export default function UmlaufScatterPlot({ data = [] }) {
    // data: [{ umlauf_id, dauer_stunden, distanz_km, anzahl_fahrten }]
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

        const w = dims.width - MARGIN.left - MARGIN.right;
        const h = dims.height - MARGIN.top - MARGIN.bottom;

        const g = svg
            .attr('width', dims.width)
            .attr('height', dims.height)
            .append('g')
            .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

        const maxTrips = d3.max(data, d => d.anzahl_fahrten) || 1;
        const maxDist = d3.max(data, d => d.distanz_km) || 1;

        const x = d3.scaleLinear().domain([0, maxTrips * 1.1]).range([0, w]).nice();
        const y = d3.scaleLinear().domain([0, maxDist * 1.1]).range([h, 0]).nice();

        // Grid lines
        g.append('g')
            .attr('class', 'grid-y')
            .selectAll('line')
            .data(y.ticks(6))
            .join('line')
            .attr('x1', 0).attr('x2', w)
            .attr('y1', d => y(d)).attr('y2', d => y(d))
            .attr('stroke', '#334155').attr('stroke-dasharray', '3,3').attr('opacity', 0.5);

        g.append('g')
            .attr('class', 'grid-x')
            .selectAll('line')
            .data(x.ticks(6))
            .join('line')
            .attr('x1', d => x(d)).attr('x2', d => x(d))
            .attr('y1', 0).attr('y2', h)
            .attr('stroke', '#334155').attr('stroke-dasharray', '3,3').attr('opacity', 0.5);

        // X Axis
        const xAxis = g.append('g').attr('transform', `translate(0,${h})`).call(d3.axisBottom(x).ticks(6));
        xAxis.selectAll('text').attr('fill', '#94a3b8').attr('font-size', '11px');
        xAxis.selectAll('line, path').attr('stroke', '#475569');

        // Y Axis
        const yAxis = g.append('g').call(d3.axisLeft(y).ticks(6));
        yAxis.selectAll('text').attr('fill', '#94a3b8').attr('font-size', '11px');
        yAxis.selectAll('line, path').attr('stroke', '#475569');

        // Axis labels
        g.append('text')
            .attr('x', w / 2).attr('y', h + 40)
            .attr('text-anchor', 'middle')
            .attr('fill', '#94a3b8').attr('font-size', '12px')
            .text('Anzahl Fahrten pro Umlauf');

        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -h / 2).attr('y', -50)
            .attr('text-anchor', 'middle')
            .attr('fill', '#94a3b8').attr('font-size', '12px')
            .text('Tagesdistanz (km)');

        const tooltip = d3.select(tooltipRef.current);

        g.selectAll('circle')
            .data(data)
            .join('circle')
            .attr('cx', d => x(d.anzahl_fahrten))
            .attr('cy', d => y(d.distanz_km))
            .attr('r', 0)
            .attr('fill', '#a855f7') // purple-500
            .attr('fill-opacity', 0.65)
            .attr('stroke', '#d8b4fe')
            .attr('stroke-width', 1)
            .on('mouseenter', function (event, d) {
                d3.select(this)
                    .transition().duration(150)
                    .attr('r', 8).attr('fill-opacity', 1).attr('stroke-width', 2);

                tooltip
                    .style('opacity', 1)
                    .style('left', `${event.offsetX + 12}px`)
                    .style('top', `${event.offsetY - 10}px`)
                    .html(`
                        <div style="font-weight:700;margin-bottom:4px">Umlauf #${d.umlauf_id}</div>
                        <div>Fahrten: <span style="color:#d8b4fe;font-weight:600">${d.anzahl_fahrten}</span></div>
                        <div>Distanz: <span style="color:#d8b4fe;font-weight:600">${d.distanz_km.toFixed(1)} km</span></div>
                        <div>Dauer: <span style="color:#d8b4fe;font-weight:600">${d.dauer_stunden.toFixed(1)} h</span></div>
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
                    .attr('r', 5).attr('fill-opacity', 0.65).attr('stroke-width', 1);
                tooltip.style('opacity', 0);
            })
            .transition().duration(600).delay((_, i) => i * 3)
            .attr('r', 5);

    }, [data, dims]);

    useEffect(() => { draw(); }, [draw]);

    return (
        <div ref={containerRef} className="relative w-full h-[300px]">
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
