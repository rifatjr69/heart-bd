import React, { useState } from 'react';
import { Search, ShoppingBag, User, PackageCheck, Menu, X, ShieldAlert, LogOut, ChevronDown, LayoutDashboard } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const Header: React.FC = () => {
  const {
    cartCount,
    setIsCartOpen,
    openTrackOrder,
    openAuthModal,
    user,
    isAdmin,
    openAdminDashboard,
    logout,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    categories,
    closeProductDetail,
  } = useStore();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    closeProductDetail();
    // Scrolls to product section if on home
    const target = document.getElementById('products-section');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navCategories = [
    { label: 'Newborn', slug: 'baby-gift-box' },
    { label: 'Birthday Gift', slug: 'yellow-box' },
    { label: 'Kids Gift', slug: 'blue-box' },
    { label: 'Baby & Kids Gift Box', slug: 'baby-gift-box' },
    { label: 'Toy Collection', slug: 'rescue-toy' },
    { label: 'Travel Luggage', slug: 'travel-luggage' },
    { label: 'Premium Quality', slug: 'purple-box' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white shadow-xs">
      {/* Top Banner strip (Subtle Trust Bar) */}
      <div className="bg-[#1F1F24] text-white text-[11px] sm:text-xs py-1.5 px-4 text-center font-medium tracking-wide flex items-center justify-center gap-2">
        <span>🎉 ক্যাশ অন ডেলিভারি সারা বাংলাদেশে</span>
        <span>·</span>
        <span>৳৯৯৯+ অর্ডারে সম্পূর্ণ ফ্রি ডেলিভারি!</span>
        <span>·</span>
        <span className="text-[#FF86A8]">হটলাইন: 01717823525</span>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-3 sm:gap-6">
        {/* Brand Logo Lockup */}
        <button
          onClick={() => {
            setSelectedCategory(null);
            setSearchQuery('');
            closeProductDetail();
          }}
          className="flex items-center gap-2.5 text-left focus:outline-hidden group cursor-pointer shrink-0"
        >
          {/* Cute Teddy Bear with Heart Icon */}
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-[#F8628D] to-[#FF86A8] flex items-center justify-center shadow-md shadow-pink-200 group-hover:scale-105 transition-transform">
            <span className="text-2xl select-none" role="img" aria-label="LittleHug Bear">🧸</span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-[#1F1F24]">
                LittleHug
              </span>
              <span className="text-xl sm:text-2xl font-black text-[#F8628D]">
                BD
              </span>
              <span className="text-xs text-[#F8628D] animate-pulse">❤️</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-gray-400 font-semibold uppercase tracking-wider">
              <span>LITTLE THINGS, BIG HAPPINESS</span>
              <span>·</span>
              <span className="text-[#F8628D] font-normal font-sans">ছোট্ট আদর, বড় হাসি</span>
            </div>
          </div>
        </button>

        {/* Live Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden md:flex flex-1 max-w-xl items-center relative"
        >
          <div className="w-full relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search gift box, toy, luggage..."
              className="w-full pl-5 pr-28 py-2.5 bg-[#FFF5F8] border border-pink-200 rounded-full text-sm text-gray-800 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-[#F8628D] focus:border-transparent transition-all"
            />
            <button
              type="submit"
              className="absolute right-1.5 px-6 py-1.5 bg-[#F8628D] hover:bg-[#E74B78] text-white text-xs font-bold rounded-full shadow-sm hover:shadow transition-all flex items-center gap-1 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
            </button>
          </div>
        </form>

        {/* Action Zone: Track Order, Login/Admin, Cart */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Track Order */}
          <button
            onClick={() => openTrackOrder()}
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-[#F8628D] py-1.5 px-2.5 rounded-lg hover:bg-pink-50 transition-colors cursor-pointer"
          >
            <PackageCheck className="w-4 h-4 text-[#F8628D]" />
            <div className="text-left leading-tight">
              <span className="block text-[10px] text-gray-400">Track</span>
              <span className="font-bold">Order</span>
            </div>
          </button>

          {/* Admin Direct Button (Only visible if role is strictly admin) */}
          {isAdmin && (
            <button
              onClick={openAdminDashboard}
              className="flex items-center gap-1.5 bg-[#1F1F24] hover:bg-black text-white text-xs font-bold py-1.5 px-3 rounded-full shadow-xs transition-all cursor-pointer border border-gray-700"
              title="Open Admin Dashboard"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-[#F8628D]" />
              <span className="hidden sm:inline">Admin Dashboard</span>
              <span className="sm:hidden">Admin</span>
            </button>
          )}

          {/* User / Login */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-1.5 bg-pink-50 hover:bg-pink-100 py-1.5 px-3 rounded-full border border-pink-200 transition-colors cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-[#F8628D] text-white flex items-center justify-center text-[10px] font-bold">
                  {user.full_name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-bold text-gray-800 max-w-[85px] sm:max-w-[120px] truncate">
                  {user.full_name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              {/* User Dropdown */}
              {isUserMenuOpen && (
                <div
                  onMouseLeave={() => setIsUserMenuOpen(false)}
                  className="absolute right-0 mt-1.5 w-52 bg-white rounded-2xl shadow-xl border border-pink-100 py-2 z-50 text-xs font-medium space-y-1"
                >
                  <div className="px-3.5 py-2 border-b border-gray-100">
                    <p className="font-bold text-gray-900 truncate">{user.full_name}</p>
                    <p className="text-[11px] text-gray-500 truncate font-sans">{user.email}</p>
                  </div>

                  {/* Only show Admin Portal option if database role is strictly admin */}
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        openAdminDashboard();
                      }}
                      className="w-full text-left px-3.5 py-2 text-gray-800 hover:bg-pink-50 hover:text-[#F8628D] flex items-center gap-2 transition-colors cursor-pointer font-bold"
                    >
                      <LayoutDashboard className="w-4 h-4 text-[#F8628D]" />
                      <span>Admin Dashboard (ড্যাশবোর্ড)</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      openTrackOrder();
                    }}
                    className="w-full text-left px-3.5 py-2 text-gray-700 hover:bg-pink-50 hover:text-[#F8628D] flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <PackageCheck className="w-4 h-4 text-gray-400" />
                    <span>My Orders / ট্র্যাক করুন</span>
                  </button>

                  <div className="border-t border-gray-100 pt-1">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-3.5 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer font-semibold"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>লগআউট (Logout)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={openAuthModal}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-[#F8628D] py-1.5 px-2.5 rounded-lg hover:bg-pink-50 transition-colors cursor-pointer"
            >
              <User className="w-4 h-4 text-[#F8628D]" />
              <div className="text-left leading-tight hidden sm:block">
                <span className="block text-[10px] text-gray-400">Login /</span>
                <span className="font-bold">Sign Up</span>
              </div>
            </button>
          )}

          {/* Cart Icon with Counter Badge */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2.5 rounded-full bg-pink-50 hover:bg-pink-100 text-[#1F1F24] transition-colors cursor-pointer group"
            aria-label="View Shopping Cart"
          >
            <ShoppingBag className="w-5 h-5 text-gray-800 group-hover:text-[#F8628D] transition-colors" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#F8628D] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-sm animate-pulse-subtle">
                {cartCount}
              </span>
            )}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-pink-50"
            aria-label="Toggle navigation"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Live Search Bar */}
      <div className="md:hidden px-4 pb-2.5">
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search gift box, toy, luggage..."
            className="w-full pl-4 pr-24 py-2 bg-[#FFF5F8] border border-pink-200 rounded-full text-xs text-gray-800 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-[#F8628D]"
          />
          <button
            type="submit"
            className="absolute right-1 px-4 py-1.5 bg-[#F8628D] text-white text-xs font-bold rounded-full cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      {/* Pink Navigation Bar (Matching Screenshots 1 & 2) */}
      <div className="bg-[#F8628D] text-white shadow-inner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs sm:text-sm font-semibold overflow-x-auto no-scrollbar py-1">
          <div className="flex items-center gap-1 sm:gap-2">
            {/* All Categories Pill Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-bold transition-all text-xs cursor-pointer shadow-xs whitespace-nowrap ${
                  isCategoryDropdownOpen
                    ? 'bg-white text-[#F8628D]'
                    : 'bg-white/90 hover:bg-white text-[#F8628D]'
                }`}
              >
                <Menu className="w-3.5 h-3.5" />
                <span>All Categories</span>
              </button>

              {/* Dropdown Menu */}
              {isCategoryDropdownOpen && (
                <div className="absolute left-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-pink-100 py-2 z-50 text-gray-800">
                  <button
                    onClick={() => {
                      setSelectedCategory(null);
                      setIsCategoryDropdownOpen(false);
                      closeProductDetail();
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-bold hover:bg-pink-50 hover:text-[#F8628D] transition-colors flex items-center justify-between"
                  >
                    <span>All Products</span>
                    <span className="text-[10px] text-gray-400">সবগুলো</span>
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.slug);
                        setIsCategoryDropdownOpen(false);
                        closeProductDetail();
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-medium hover:bg-pink-50 hover:text-[#F8628D] transition-colors flex items-center justify-between"
                    >
                      <span>{cat.name}</span>
                      <span className="text-[10px] text-gray-400 font-sans">{cat.name_bn}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Nav Category Pills */}
            {navCategories.map((item, idx) => {
              const isActive = selectedCategory === item.slug;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedCategory(item.slug);
                    closeProductDetail();
                  }}
                  className={`px-3 py-1.5 rounded-full transition-colors whitespace-nowrap cursor-pointer text-xs sm:text-xs font-semibold ${
                    isActive
                      ? 'bg-white text-[#F8628D] font-bold shadow-xs'
                      : 'hover:bg-white/20 text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Right Highlight: Free Gift Wrapping */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-white/15 hover:bg-white/25 rounded-full text-white text-xs font-bold whitespace-nowrap transition-colors">
            <span>🎁</span>
            <span>Free Gift Wrapping</span>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-pink-100 px-4 py-3 space-y-2 text-sm">
          <button
            onClick={() => {
              openTrackOrder();
              setIsMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-2 py-2 px-3 text-gray-700 hover:bg-pink-50 rounded-lg text-left font-medium"
          >
            <PackageCheck className="w-4 h-4 text-[#F8628D]" />
            <span>Track Order (অর্ডার ট্র্যাক করুন)</span>
          </button>
          {isAdmin && (
            <button
              onClick={() => {
                openAdminDashboard();
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 py-2 px-3 text-gray-700 hover:bg-pink-50 rounded-lg text-left text-xs font-semibold"
            >
              <LayoutDashboard className="w-4 h-4 text-[#F8628D]" />
              <span>Admin Portal (ড্যাশবোর্ড)</span>
            </button>
          )}
          <div className="pt-2 border-t border-pink-100">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block px-3 mb-1">
              Categories
            </span>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.slug);
                  setIsMobileMenuOpen(false);
                  closeProductDetail();
                }}
                className="w-full text-left py-1.5 px-3 text-xs text-gray-700 hover:text-[#F8628D] hover:bg-pink-50 rounded-md flex justify-between"
              >
                <span>{cat.name}</span>
                <span className="text-gray-400 font-sans">{cat.name_bn}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
