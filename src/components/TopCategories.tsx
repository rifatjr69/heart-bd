import React from 'react';
import { Heart } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { scrollToProducts } from '../lib/scroll';

// স্ক্রলবার লুকানোর ক্লাস (Tailwind v4 এ no-scrollbar বিল্ট-ইন নেই)
const hideScrollbar = '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

// ছবি লোড না হলে (ভাঙা লিঙ্ক বা ফাইল না পেলে) এই প্লেসহোল্ডার দেখাবে
const FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#FFE4EC"/><text x="50" y="62" font-size="42" text-anchor="middle">🧸</text></svg>`
  );

export const TopCategories: React.FC = () => {
  const { categories, selectedCategory, setSelectedCategory, closeProductDetail } = useStore();

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-6 pb-2">
      {/* Title & View All */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
        <h2 className="text-lg sm:text-2xl font-black text-[#1F1F24] tracking-tight">Top Categories</h2>
        <button
          onClick={() => {
            setSelectedCategory(null);
            closeProductDetail();
            scrollToProducts();
          }}
          className="text-xs sm:text-sm font-bold text-[#F8628D] hover:text-[#E74B78] flex items-center gap-1 cursor-pointer transition-colors shrink-0"
        >
          <span>View All</span>
          <span>→</span>
        </button>
      </div>

      {/* Circular Categories Row */}
      <div
        className={`-mx-4 px-4 sm:mx-0 sm:px-0 flex items-start justify-start gap-4 sm:gap-6 lg:gap-8 overflow-x-auto snap-x pb-3 pt-1 ${hideScrollbar}`}
      >
        {/* All Products Card */}
        <button
          onClick={() => {
            setSelectedCategory(null);
            closeProductDetail();
            scrollToProducts();
          }}
          className="flex flex-col items-center group cursor-pointer shrink-0 snap-start focus:outline-hidden w-[76px] sm:w-24 lg:w-28"
        >
          <div className="relative mb-2">
            <div
              className={`w-[68px] h-[68px] sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full p-1 transition-all duration-200 ${
                selectedCategory === null
                  ? 'ring-3 ring-[#F8628D] scale-105 shadow-md shadow-pink-200'
                  : 'group-hover:scale-105 group-hover:ring-2 group-hover:ring-pink-300'
              }`}
              style={{
                background: 'radial-gradient(circle, #FFE4EC 0%, #FFF5F8 100%)',
              }}
            >
              <div className="w-full h-full rounded-full overflow-hidden bg-white border border-pink-100 flex items-center justify-center text-2xl sm:text-3xl">
                🛍️
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full shadow-xs flex items-center justify-center border border-pink-100">
              <Heart className="w-3 h-3 text-[#F8628D] fill-[#F8628D]" />
            </div>
          </div>
          <div className="text-center w-full">
            <span
              className={`block text-xs sm:text-sm font-black truncate transition-colors ${
                selectedCategory === null ? 'text-[#F8628D]' : 'text-gray-800 group-hover:text-[#F8628D]'
              }`}
            >
              সকল পণ্য
            </span>
            <span className="block text-[10px] sm:text-[11px] font-medium text-gray-400 font-sans truncate">
              All Products
            </span>
          </div>
        </button>

        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.slug;
          return (
            <button
              key={cat.id}
              onClick={() => {
                if (isSelected) {
                  setSelectedCategory(null);
                } else {
                  setSelectedCategory(cat.slug);
                }
                closeProductDetail();
                scrollToProducts();
              }}
              className="flex flex-col items-center group cursor-pointer shrink-0 snap-start focus:outline-hidden w-[76px] sm:w-24 lg:w-28"
            >
              {/* Circular Avatar with Heart Badge */}
              <div className="relative mb-2">
                <div
                  className={`w-[68px] h-[68px] sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full p-1 transition-all duration-200 ${
                    isSelected
                      ? 'ring-3 ring-[#F8628D] scale-105 shadow-md shadow-pink-200'
                      : 'group-hover:scale-105 group-hover:ring-2 group-hover:ring-pink-300'
                  }`}
                  style={{
                    background: 'radial-gradient(circle, #FFE4EC 0%, #FFF5F8 100%)',
                  }}
                >
                  <div className="w-full h-full rounded-full overflow-hidden bg-white border border-pink-100 flex items-center justify-center">
                    <img
                      src={cat.image_url || FALLBACK_IMAGE}
                      alt={cat.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const img = e.currentTarget;
                        img.onerror = null; // লুপ এড়াতে
                        img.src = FALLBACK_IMAGE;
                      }}
                    />
                  </div>
                </div>

                {/* Small Heart Badge */}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full shadow-xs flex items-center justify-center border border-pink-100">
                  <Heart className="w-3 h-3 text-[#F8628D] fill-[#F8628D]" />
                </div>
              </div>

              {/* Category Name & Subtitle */}
              <div className="text-center w-full">
                <span
                  className={`block text-xs sm:text-sm font-black truncate transition-colors ${
                    isSelected ? 'text-[#F8628D]' : 'text-gray-800 group-hover:text-[#F8628D]'
                  }`}
                >
                  {cat.name}
                </span>
                <span className="block text-[10px] sm:text-[11px] font-medium text-gray-400 font-sans truncate">
                  {cat.sub_label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};