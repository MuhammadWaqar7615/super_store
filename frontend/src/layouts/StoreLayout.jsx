import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header';

const StoreLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Header />
      <Outlet />
    </div>
  );
};

export default StoreLayout;
