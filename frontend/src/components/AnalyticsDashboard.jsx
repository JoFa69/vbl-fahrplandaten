import React, { useState } from 'react';
import './AnalyticsDashboard.css';
import VolumeMetrics from './VolumeMetrics';
import TimeMetrics from './TimeMetrics';
import InfrastructureMetrics from './InfrastructureMetrics';
import GeometryMetrics from './GeometryMetrics';

function AnalyticsDashboard() {
    const [activeTab, setActiveTab] = useState("volume");

    return (
        <div className="dashboard-container">
            <h1>VDV Analyse-Dashboard</h1>

            <div className="tabs">
                <button
                    className={`tab-btn ${activeTab === 'volume' ? 'active' : ''}`}
                    onClick={() => setActiveTab('volume')}
                >
                    Fahrten-Volumen
                </button>
                <button
                    className={`tab-btn ${activeTab === 'time' ? 'active' : ''}`}
                    onClick={() => setActiveTab('time')}
                >
                    Zeit-Analyse
                </button>
                <button
                    className={`tab-btn ${activeTab === 'infra' ? 'active' : ''}`}
                    onClick={() => setActiveTab('infra')}
                >
                    Infrastruktur
                </button>
                <button
                    className={`tab-btn ${activeTab === 'geo' ? 'active' : ''}`}
                    onClick={() => setActiveTab('geo')}
                >
                    Netz-Geometrie
                </button>
            </div>

            <div className="tab-content">
                {activeTab === 'volume' && <VolumeMetrics />}
                {activeTab === 'time' && <TimeMetrics />}
                {activeTab === 'infra' && <InfrastructureMetrics />}
                {activeTab === 'geo' && <GeometryMetrics />}
            </div>
        </div>
    );
}

export default AnalyticsDashboard;
