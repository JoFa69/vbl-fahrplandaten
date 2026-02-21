import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import HeaderBar from './HeaderBar';

export default function AppShell() {
    return (
        <div className="flex h-screen w-full overflow-hidden bg-bg-dark">
            <Sidebar />
            <main className="flex-1 flex flex-col min-w-0 bg-bg-dark">
                <HeaderBar />
                <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
