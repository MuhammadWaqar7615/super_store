import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CustomerAuth from '../pages/CustomerAuth';
import BrowseProducts from '../pages/BrowseProducts';
import Cart from '../pages/Cart';
import Checkout from '../pages/Checkout';
import MyOrders from '../pages/MyOrders';
import OrderDetails from '../pages/OrderDetails';
import { useAuth } from '../context/AuthContext';
import StoreLayout from '../layouts/StoreLayout';

const ProtectedRoute = ({ children }) => {
  const { customer, loading } = useAuth();
  if (loading) {
    return <div className="min-h-screen flex justify-center items-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }
  return customer ? children : <Navigate to="/login" replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/register" element={<CustomerAuth />} />
      <Route path="/login" element={<CustomerAuth />} />
      <Route path="/checkout" element={
        <ProtectedRoute>
          <Checkout />
        </ProtectedRoute>
      } />
      
      {/* Store Routes with Header */}
      <Route element={<StoreLayout />}>
        <Route path="/" element={<BrowseProducts />} />
        <Route path="/cart" element={
          <ProtectedRoute>
            <Cart />
          </ProtectedRoute>
        } />
        <Route path="/orders" element={
          <ProtectedRoute>
            <MyOrders />
          </ProtectedRoute>
        } />
        <Route path="/orders/:id" element={
          <ProtectedRoute>
            <OrderDetails />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
