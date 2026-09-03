import React, { useState, useEffect, useRef, useMemo } from 'react';
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

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('default');
  const [priceRange, setPriceRange] = useState([0, 0]);
  const [maxPrice, setMaxPrice] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);

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

  // Set price range max from products
  useEffect(() => {
    if (products.length > 0) {
      const max = Math.max(...products.map(p => p.sellingPrice));
      setMaxPrice(max);
      setPriceRange([0, max]);
    }
  }, [products]);

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

  // Extract unique categories from products
  const categories = useMemo(() => {
    const catMap = new Map();
    products.forEach(p => {
      const name = p.category?.name || 'Uncategorized';
      const id = p.category?._id || 'uncategorized';
      if (!catMap.has(name)) {
        catMap.set(name, { id, name, count: 1 });
      } else {
        catMap.get(name).count += 1;
      }
    });
    return Array.from(catMap.values());
  }, [products]);

  // Filter & sort products
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(p =>
        (p.category?.name || 'Uncategorized') === selectedCategory
      );
    }

    // Price range filter
    filtered = filtered.filter(p =>
      p.sellingPrice >= priceRange[0] && p.sellingPrice <= priceRange[1]
    );

    // Sort
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.sellingPrice - b.sellingPrice);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.sellingPrice - a.sellingPrice);
        break;
      case 'name-az':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-za':
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      default:
        break;
    }

    return filtered;
  }, [products, searchQuery, selectedCategory, sortBy, priceRange]);

  const activeFilterCount = [
    searchQuery.trim() ? 1 : 0,
    selectedCategory !== 'All' ? 1 : 0,
    (priceRange[0] > 0 || priceRange[1] < maxPrice) ? 1 : 0,
    sortBy !== 'default' ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSortBy('default');
    setPriceRange([0, maxPrice]);
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
          {/* Hero Section */}
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
            {/* Filter Bar */}
            {!loading && products.length > 0 && (
              <div className="mb-8 space-y-4">
                {/* Top filter row: Search + Sort + Toggle */}
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  {/* Search */}
                  <div className="relative flex-1 max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:border-[#2D6A4F] transition-all shadow-sm"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Sort Dropdown */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:border-[#2D6A4F] transition-all shadow-sm cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_12px_center] pr-8"
                  >
                    <option value="default">Sort by: Default</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="name-az">Name: A → Z</option>
                    <option value="name-za">Name: Z → A</option>
                    <option value="newest">Newest First</option>
                  </select>

                  {/* Filter Toggle Button (mobile-friendly) */}
                  <button
                    onClick={() => setFiltersOpen(!filtersOpen)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm border ${
                      filtersOpen || activeFilterCount > 0
                        ? 'bg-[#2D6A4F] text-white border-[#2D6A4F] hover:bg-[#1B4332]'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filters
                    {activeFilterCount > 0 && (
                      <span className={`inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full ${
                        filtersOpen ? 'bg-white text-[#2D6A4F]' : 'bg-[#2D6A4F] text-white'
                      }`}>
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                </div>

                {/* Expandable Filter Panel */}
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    filtersOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-5">
                    {/* Categories */}
                    <div>
                      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Category</h3>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setSelectedCategory('All')}
                          className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                            selectedCategory === 'All'
                              ? 'bg-[#2D6A4F] text-white shadow-sm'
                              : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          All
                          <span className={`ml-1.5 text-xs ${selectedCategory === 'All' ? 'text-white/70' : 'text-slate-400'}`}>
                            ({products.length})
                          </span>
                        </button>
                        {categories.map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.name)}
                            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                              selectedCategory === cat.name
                                ? 'bg-[#2D6A4F] text-white shadow-sm'
                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                            }`}
                          >
                            {cat.name}
                            <span className={`ml-1.5 text-xs ${selectedCategory === cat.name ? 'text-white/70' : 'text-slate-400'}`}>
                              ({cat.count})
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Price Range */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Price Range</h3>
                        <span className="text-sm font-semibold text-[#2D6A4F]">
                          Rs. {priceRange[0].toLocaleString()} — Rs. {priceRange[1].toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 relative">
                          <label className="text-xs text-slate-400 mb-1 block">Min</label>
                          <input
                            type="range"
                            min={0}
                            max={maxPrice}
                            step={Math.max(1, Math.floor(maxPrice / 100))}
                            value={priceRange[0]}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              if (val <= priceRange[1]) setPriceRange([val, priceRange[1]]);
                            }}
                            className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-[#2D6A4F]"
                          />
                        </div>
                        <div className="flex-1 relative">
                          <label className="text-xs text-slate-400 mb-1 block">Max</label>
                          <input
                            type="range"
                            min={0}
                            max={maxPrice}
                            step={Math.max(1, Math.floor(maxPrice / 100))}
                            value={priceRange[1]}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              if (val >= priceRange[0]) setPriceRange([priceRange[0], val]);
                            }}
                            className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-[#2D6A4F]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Clear All */}
                    {activeFilterCount > 0 && (
                      <div className="flex justify-end pt-2 border-t border-slate-100">
                        <button
                          onClick={clearAllFilters}
                          className="text-sm text-red-500 hover:text-red-600 font-medium transition-colors flex items-center gap-1.5"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Clear all filters
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Results count + Active filter tags */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-slate-500">
                    Showing <span className="font-semibold text-slate-700">{filteredProducts.length}</span> of{' '}
                    <span className="font-semibold text-slate-700">{products.length}</span> products
                  </span>
                  {selectedCategory !== 'All' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#2D6A4F]/10 text-[#2D6A4F] text-xs font-medium rounded-full">
                      {selectedCategory}
                      <button onClick={() => setSelectedCategory('All')} className="hover:text-[#1B4332]">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  )}
                  {searchQuery.trim() && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#2D6A4F]/10 text-[#2D6A4F] text-xs font-medium rounded-full">
                      "{searchQuery}"
                      <button onClick={() => setSearchQuery('')} className="hover:text-[#1B4332]">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Section Title */}
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
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔍</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">No products match your filters</h3>
                <p className="text-slate-500 mb-4">Try adjusting your search or filter criteria</p>
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-[#2D6A4F] hover:text-[#1B4332] font-semibold underline underline-offset-2 transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                {filteredProducts.map((product) => (
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
