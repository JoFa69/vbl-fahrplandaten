import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useParams } from "react-router-dom";
import { fetchTables, fetchTableData, fetchStats } from "./api";
import AskAI from "./components/AskAI";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import Dashboard from "./pages/Dashboard";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="app-container">
        <header className="app-header">
          <h1>VBL Fahrplan Explorer</h1>
        </header>
        <nav className="navbar">
          <ul className="nav-links">
            <li><Link to="/">Übersicht</Link></li>
            <li><Link to="/ai">KI-Abfrage</Link></li>
            <li><Link to="/analytics">Analysen</Link></li>
          </ul>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/ai" element={<AskAI />} />
            <Route path="/analytics" element={<AnalyticsDashboard />} />
            <Route path="/table/:tableName" element={<TableView />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function TableView() {
  const { tableName } = useParams();
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchTableData(tableName).then(res => {
      // API returns { columns: [...], data: [...], total_rows: ... }
      setData(res.data);
      setColumns(res.columns);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [tableName]);

  if (loading) return <div>Lade {tableName}...</div>;

  return (
    <div className="table-view">
      <h2>{tableName}</h2>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              {columns.length > 0
                ? columns.map(k => <th key={k}>{k}</th>)
                : (data.length > 0 && Object.keys(data[0]).map(k => <th key={k}>{k}</th>))
              }
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                {columns.length > 0
                  ? columns.map(col => <td key={col}>{row[col]}</td>)
                  : Object.values(row).map((val, j) => <td key={j}>{val}</td>)
                }
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
