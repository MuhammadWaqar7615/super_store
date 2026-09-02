import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const MyOrders = () => {
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(location.state?.justPaid || false);

  useEffect(() => {
    fetchOrders();

    if (processingPayment) {
      const timer = setTimeout(() => {
        setProcessingPayment(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    // Poll every 3 seconds if any order is pending
    const hasPending = orders.some(order => order.status === 'pending');
    if (!hasPending) return;

    const interval = setInterval(() => {
      fetchOrders();
    }, 3000);

    return () => clearInterval(interval);
  }, [orders]);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API_URL}/sales/me`);
      setOrders(res.data.sales);
    } catch (error) {
      console.error('Failed to fetch orders', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || processingPayment) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2D6A4F] mb-6"></div>
        <h2 className="text-xl font-semibold text-gray-800">Finalizing your order...</h2>
        <p className="text-gray-500 mt-2">Waiting for payment confirmation</p>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">


        {orders.length === 0 ? (
          <div className="bg-white rounded-xl p-16 text-center shadow-sm border border-gray-100 flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto text-sm">You haven't placed any orders yet. Discover our premium collection and start shopping today.</p>
            <Link to="/" className="inline-flex items-center justify-center px-6 py-2 bg-[#2D6A4F] text-white font-medium rounded-md hover:bg-[#1B4332] transition-colors">
              Start Shopping Now
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link key={order._id} to={`/orders/${order._id}`} className="block">
                <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row justify-between items-center group border border-gray-100 hover:border-[#2D6A4F]">
                  <div className="mb-4 sm:mb-0">
                    <p className="text-sm text-gray-500 mb-1">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                    <p className="font-semibold text-gray-900">{order.invoiceNumber}</p>
                    <div className="mt-2 flex space-x-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${order.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 mb-1">Total</p>
                    <p className="text-xl font-bold text-gray-900">Rs. {order.total}</p>
                    <p className="text-[#2D6A4F] text-sm mt-2 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end">
                      View Receipt <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default MyOrders;
