import React from 'react';
import { useLocation } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import Navbar from '../Navbar';
import { NotificationsProvider } from '../../context/NotificationsContext';

const Layout: React.FC = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <NotificationsProvider>
      <div className={`min-h-screen ${isLoginPage ? 'bg-gradient-to-br from-mts-primary to-mts-secondary' : 'bg-gray-900 from-mts-primary-dark to-mts-bg-dark text-gray-100'}`}>
        {!isLoginPage && <Navbar />}
        <main className={`container mx-auto ${!isLoginPage ? 'px-4 py-6' : ''}`}>
          <Outlet />
        </main>
      </div>
    </NotificationsProvider>
  );
};

export default Layout;