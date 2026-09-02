import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const Cart = () => {
  const { customer } = useAuth();
  const navigate = useNavigate();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!customer) {
      navigate('/login');
      return;
    }
    fetchCart();
  }, [customer, navigate]);

  useEffect(() => {
    let interval;
    if (polling) {
      interval = setInterval(async () => {
        try {
          const res = await axios.get(`${API_URL}/cart/status`);
          if (res.data.status === 'finalized' && res.data.clientSecret) {
            clearInterval(interval);
            setPolling(false);
            navigate('/checkout', {
              state: {
                clientSecret: res.data.clientSecret,
                paymentIntentId: res.data.paymentIntentId
              }
            });
          } else if (res.data.status === 'cancelled') {
            clearInterval(interval);
            setPolling(false);
            setError('Cart was rejected by cashier (price changed or out of stock). Please rebuild your cart.');
            fetchCart(); // Fetch new draft cart
          }
        } catch (err) {
          console.error('Polling error', err);
        }
      }, 3000); // poll every 3 seconds
    }
    return () => clearInterval(interval);
  }, [polling, navigate]);

  const fetchCart = async () => {
    try {
      const res = await axios.get(`${API_URL}/cart`);
      setCart(res.data.cart);
      if (res.data.cart?.status === 'submitted') {
        setPolling(true);
      }
    } catch (error) {
      console.error('Failed to fetch cart', error);
      setError('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      const res = await axios.put(`${API_URL}/cart/items/${productId}`, { quantity });
      setCart(res.data.cart);
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error('Failed to update quantity', error);
    }
  };

  const removeItem = async (productId) => {
    try {
      const res = await axios.delete(`${API_URL}/cart/items/${productId}`);
      setCart(res.data.cart);
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error('Failed to remove item', error);
    }
  };

  const handleSubmitCart = async () => {
    try {
      await axios.post(`${API_URL}/cart/submit`);
      setCart({ ...cart, status: 'submitted' });
      setPolling(true);
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error('Failed to submit cart', error);
      setError('Failed to submit cart');
    }
  };

  // Test function to simulate cashier
  const handleSimulateCashier = async () => {
    try {
      await axios.post(`${API_URL}/cart/${cart._id}/finalize-test`);
      // The poller will pick it up on the next tick
    } catch (error) {
      console.error('Failed to simulate cashier', error);
      setError('Simulation failed: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2D6A4F]"></div>
      </div>
    );
  }

  if (polling || cart?.status === 'submitted') {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 px-4">
        <div className="bg-white p-10 rounded-2xl shadow-xl max-w-md w-full text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#2D6A4F] bg-opacity-20">
            <div className="h-full bg-[#2D6A4F] animate-[pulse_2s_ease-in-out_infinite]" style={{ width: '100%' }}></div>
          </div>
          <div className="animate-bounce mb-6 mt-4">
            <svg className="w-16 h-16 text-[#2D6A4F] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Waiting for Cashier</h2>
          <p className="text-gray-500 mb-8">Please proceed to the counter. The cashier is reviewing your cart.</p>

          <button
            onClick={() => navigate('/')}
            className="w-full flex justify-center py-3 px-8 border border-gray-300 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-all shadow-sm mb-4"
          >
            &larr; Back to Products
          </button>

          {/* TEST BUTTON - REMOVE IN PROD */}
          <button onClick={handleSimulateCashier} className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 px-3 rounded-full transition-colors">
            [Dev Test] Simulate Cashier Finalize
          </button>
        </div>
      </div>
    );
  }

  const subtotal = cart?.items?.reduce((acc, item) => acc + (item.unitPriceSnapshot * item.quantity), 0) || 0;

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 font-medium shadow-sm border border-red-100">
            {error}
          </div>
        )}

        {!cart || cart.items.length === 0 ? (
          <div className="bg-white rounded-xl p-16 text-center shadow-sm border border-gray-100 flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto text-sm">Looks like you haven't added anything yet. Discover our premium collection and start shopping today.</p>
            <Link to="/" className="inline-flex items-center justify-center px-6 py-2 bg-[#2D6A4F] text-white font-medium rounded-md hover:bg-[#1B4332] transition-colors">
              Start Shopping Now
            </Link>
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-2xl overflow-hidden border border-gray-100">
            <ul className="divide-y divide-gray-100">
              {cart.items.map((item) => (
                <li key={item.productId} className="p-6 flex flex-col sm:flex-row items-center sm:justify-between group hover:bg-gray-50 transition-colors">
                  <div className="flex-1 w-full flex justify-between sm:justify-start items-center sm:space-x-6 mb-4 sm:mb-0">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{item.productName}</h3>
                      <p className="text-[#2D6A4F] font-medium">Rs. {item.unitPriceSnapshot}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full sm:w-auto space-x-6">
                    <div className="flex items-center border border-gray-200 rounded-lg bg-white">
                      <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="px-3 py-2 text-gray-600 hover:text-[#2D6A4F] hover:bg-gray-50 transition-colors rounded-l-lg focus:outline-none">
                        -
                      </button>
                      <span className="px-4 py-2 font-medium text-gray-900 min-w-[3rem] text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="px-3 py-2 text-gray-600 hover:text-[#2D6A4F] hover:bg-gray-50 transition-colors rounded-r-lg focus:outline-none">
                        +
                      </button>
                    </div>
                    <div className="text-right sm:w-24 font-bold text-gray-900">
                      Rs. {item.unitPriceSnapshot * item.quantity}
                    </div>
                    <button onClick={() => removeItem(item.productId)} className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50 focus:outline-none" title="Remove">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="bg-gray-50 p-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center">
              <div className="text-xl font-medium text-gray-900 mb-4 sm:mb-0">
                Subtotal: <span className="font-bold text-2xl text-[#2D6A4F] ml-2">Rs. {subtotal}</span>
              </div>
              <button
                onClick={handleSubmitCart}
                className="w-full sm:w-auto flex justify-center py-3 px-8 border border-transparent text-base font-medium rounded-md text-white bg-[#2D6A4F] hover:bg-[#1B4332] focus:outline-none transition-all shadow hover:shadow-lg"
              >
                Submit Cart
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Cart;
