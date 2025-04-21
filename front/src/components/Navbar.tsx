import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Bell, User, BarChart2 } from 'lucide-react';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <nav className="bg-gray-800 border-b border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <BarChart2 className="h-8 w-8 text-blue-400" />
              <span className="ml-2 text-xl font-bold">R&D Platform</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/" className={`px-3 py-2 rounded-md ${isActive('/') ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>
              Главная
            </Link>
            <Link to="/comparison" className={`px-3 py-2 rounded-md ${isActive('/comparison') ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>
              Сравнение
            </Link>
            
            {/* Notification icon */}
            <button className="p-2 rounded-full text-gray-300 hover:bg-gray-700 hover:text-white relative">
              <Bell className="h-6 w-6" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
            </button>
            
            {/* User profile */}
            <button className="p-2 rounded-full text-gray-300 hover:bg-gray-700 hover:text-white">
              <User className="h-6 w-6" />
            </button>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-gray-800 pb-3 px-2">
          <div className="space-y-1 px-2 pt-2 pb-3">
            <Link 
              to="/" 
              className={`block px-3 py-2 rounded-md ${isActive('/') ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Главная
            </Link>
            <Link 
              to="/comparison" 
              className={`block px-3 py-2 rounded-md ${isActive('/comparison') ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Сравнение
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;