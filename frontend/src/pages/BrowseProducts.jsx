import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const BrowseProducts = () => {
  const { customer, logout } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingToCart, setAddingToCart] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchProducts();
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
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const addToCart = async (productId) => {
    if (!customer) {
      navigate('/login');
      return;
    }

    setAddingToCart(productId);
    try {
      await axios.post(`${API_URL}/cart/items`, { productId, quantity: 1 });
      setCartCount(prev => prev + 1);
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {
      console.error('Failed to add to cart', err);
    } finally {
      setAddingToCart(null);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_URL}/products?isActive=true`);
      setProducts(res.data.products || res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch products', err);
      setError('Error connecting to the server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {error ? (
        <div className="flex h-[70vh] items-center justify-center">
          <div className="bg-red-50 border border-red-200 text-red-600 p-6 rounded-2xl shadow-sm">
            <p className="font-semibold text-lg">{error}</p>
          </div>
        </div>
      ) : (
        <main className="w-full pb-20">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-12 relative mx-4 sm:mx-6 lg:mx-8 mt-6">
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-[#2D6A4F] rounded-full blur-3xl opacity-10"></div>
            <div className="relative pt-16 pb-20 px-6 sm:px-12 lg:px-20 text-center max-w-4xl mx-auto z-10">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight">
                Curated essentials for your <span className="text-[#2D6A4F]">lifestyle.</span>
              </h1>
              <p className="text-slate-500 text-lg md:text-xl mb-10 leading-relaxed font-normal max-w-2xl mx-auto">
                Discover a handpicked selection of premium products designed to elevate your everyday experience.
                Quality, functionality, and unmatched style.
              </p>
              <button
                onClick={() => document.getElementById('products-section').scrollIntoView({ behavior: 'smooth' })}
                className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-medium py-3 px-8 rounded-md transition-colors shadow-md hover:shadow-lg"
              >
                Shop the Collection
              </button>
            </div>
          </div>

          <div id="products-section" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Trending Now</h2>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <div key={n} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 animate-pulse">
                    <div className="w-full h-56 bg-slate-100 rounded-xl mb-4"></div>
                    <div className="h-5 bg-slate-100 rounded-md w-3/4 mb-3"></div>
                    <div className="h-4 bg-slate-100 rounded-md w-1/3 mb-4"></div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🛍️</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">No products found</h3>
                <p className="text-slate-500">We're updating our inventory. Check back soon!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                {products.map((product) => (
                  <div
                    key={product._id}
                    className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 hover:border-slate-200 transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className="relative p-3 pb-0">
                      <div className="w-full h-64 rounded-xl overflow-hidden bg-slate-50 relative group-hover:bg-slate-100 transition-colors">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 ease-out"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                            <span className="text-sm font-medium">No Image</span>
                          </div>
                        )}

                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md shadow-sm border border-slate-100">
                          <span className="text-[10px] font-bold text-[#2D6A4F] tracking-wider uppercase">
                            {product.category?.name || 'Uncategorized'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 flex flex-col flex-grow">
                      <h2 className="text-lg font-bold text-slate-900 mb-1.5 truncate group-hover:text-[#2D6A4F] transition-colors">
                        {product.name}
                      </h2>
                      <p className="text-sm text-slate-500 line-clamp-2 mb-6 font-normal leading-relaxed flex-grow">
                        {product.description || 'Premium quality essential product.'}
                      </p>

                      <div className="flex justify-between items-center mt-auto pt-4 border-t border-slate-100">
                        <div className="flex flex-col">
                          <span className="text-xs text-slate-400 font-medium mb-0.5">Price</span>
                          <span className="text-xl font-black text-slate-900">
                            Rs. {product.sellingPrice}
                          </span>
                        </div>
                        {product.stockQuantity > 0 ? (
                          <button
                            onClick={(e) => { e.preventDefault(); addToCart(product._id); }}
                            disabled={addingToCart === product._id}
                            className="flex items-center justify-center cursor-pointer bg-[#2D6A4F] text-gray-300 bg-opacity-10 hover:bg-[#2D6A4F] text-[#2D6A4F] hover:text-white px-4 py-2 rounded-md text-sm font-semibold transition-all duration-300 disabled:opacity-50"
                          >
                            {addingToCart === product._id ? 'Adding...' : 'Add to Cart'}
                          </button>
                        ) : (
                          <button disabled className="flex items-center justify-center bg-slate-100 text-slate-400 px-4 py-2 rounded-md text-sm font-semibold cursor-not-allowed">
                            Out of Stock
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      )}
    </>
  );
};

export default BrowseProducts;
