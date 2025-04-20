import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import { NotificationsProvider } from '../context/NotificationsContext';

const Layout: React.FC = () => {
  return (
    <NotificationsProvider>
      <div className="min-h-screen bg-gray-900 text-gray-100">
        <Navbar />
        <main className="container mx-auto px-4 py-6">
          <Outlet />
        </main>
      </div>
    </NotificationsProvider>
  );
};

export default Layout;