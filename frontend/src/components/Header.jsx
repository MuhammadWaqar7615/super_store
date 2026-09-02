import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Header = () => {
  const { customer, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (customer) {
      axios.get(`${API_URL}/cart`).then(res => {
        setCartCount(res.data.cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0);
      }).catch(err => console.error(err));
    }
  }, [customer]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0 flex items-center">
            <Link to="/">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Super<span className="text-[#2D6A4F]">Store</span></h1>
            </Link>
          </div>
          <div className="flex items-center space-x-6">
            <Link to="/cart" className={`relative font-medium transition-colors flex items-center ${location.pathname === '/cart' ? 'text-[#2D6A4F] underline decoration-2 decoration-[#2D6A4F] underline-offset-4' : 'text-slate-600 hover:text-[#2D6A4F]'}`}>
              <span className="hidden sm:inline">Cart</span>
              <svg className="w-6 h-6 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-4 bg-[#2D6A4F] text-white text-xs font-bold rounded-md h-5 w-5 flex items-center justify-center shadow-sm">
                  {cartCount}
                </span>
              )}
            </Link>
            {customer ? (
              <div className="flex items-center space-x-4">
                <Link to="/orders" className={`font-medium transition-colors flex items-center ${location.pathname.startsWith('/orders') ? 'text-[#2D6A4F] underline decoration-2 decoration-[#2D6A4F] underline-offset-4' : 'text-slate-600 hover:text-[#2D6A4F]'}`}>
                  <span className="hidden sm:inline">My Orders</span>
                  <svg className="w-6 h-6 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                </Link>

                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="text-white font-medium px-3 sm:px-4 py-2 bg-[#2D6A4F] border border-transparent hover:bg-[#1B4332] transition-colors rounded-md text-sm flex items-center justify-center shadow-sm"
                  >
                    <span className="hidden sm:inline">Hi, {customer.name}</span>
                    <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    <svg className="w-4 h-4 ml-1 sm:ml-2 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </button>
                  
                  {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-100 rounded-md shadow-lg z-50">
                      <div className="py-2">
                        <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm font-medium text-slate-600 hover:text-red-500 hover:bg-slate-50 transition-colors flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Link to="/login" className="bg-[#2D6A4F] text-white px-5 py-2.5 rounded-md font-medium hover:bg-[#1B4332] transition-colors shadow-sm hover:shadow-md text-sm">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
