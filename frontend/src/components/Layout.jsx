import { LayoutDashboard, Database, Bus, Map } from "lucide-react";
import { useState } from "react";

export default function Layout({ children, onNavigate, currentPage }) {
    const navItems = [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "explorer", label: "Data Explorer", icon: Database },
        // { id: "lines", label: "Lines", icon: Bus },
        // { id: "map", label: "Map", icon: Map },
    ];

    return (
        <div className="flex h-screen bg-slate-900 text-slate-100 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
                <div className="p-6 border-b border-slate-700">
                    <h1 className="text-xl font-bold bg-gradient-to-br from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                        VDV Schedule
                    </h1>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentPage === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => onNavigate(item.id)}
                                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                        ? "bg-blue-600 text-white"
                                        : "text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                                    }`}
                            >
                                <Icon size={20} />
                                <span className="font-medium">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-700 text-xs text-slate-500 text-center">
                    VDV 452 Explorer v0.2
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-slate-900">
                <div className="p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
