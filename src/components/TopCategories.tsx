import React from 'react';
import { Heart } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const TopCategories: React.FC = () => {
  const { categories, selectedCategory, setSelectedCategory, closeProductDetail } = useStore();

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
      {/* Title & View All */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl sm:text-2xl font-black text-[#1F1F24] tracking-tight">
          Top Categories
        </h2>
        <button
          onClick={() => {
            setSelectedCategory(null);
            closeProductDetail();
          }}
          className="text-xs sm:text-sm font-bold text-[#F8628D] hover:text-[#E74B78] flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>View All</span>
          <span>→</span>
        </button>
      </div>

      {/* Circular Categories Row */}
      <div className="flex items-center justify-start sm:justify-between gap-4 sm:gap-6 overflow-x-auto pb-3 pt-1 no-scrollbar">
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
                const target = document.getElementById('products-section');
                if (target) target.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex flex-col items-center group cursor-pointer shrink-0 focus:outline-hidden"
            >
              {/* Circular Avatar Container with Heart Badge */}
              <div className="relative mb-2">
                <div
                  className={`w-18 h-18 sm:w-22 sm:h-22 rounded-full p-1 transition-all duration-200 ${
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
                      src={cat.image_url}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>

                {/* Small Heart Badge on Bottom Right */}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full shadow-xs flex items-center justify-center border border-pink-100">
                  <Heart className="w-3 h-3 text-[#F8628D] fill-[#F8628D]" />
                </div>
              </div>

              {/* Category Name & Subtitle */}
              <div className="text-center">
                <span
                  className={`block text-xs sm:text-sm font-black whitespace-nowrap transition-colors ${
                    isSelected ? 'text-[#F8628D]' : 'text-gray-800 group-hover:text-[#F8628D]'
                  }`}
                >
                  {cat.name}
                </span>
                <span className="block text-[11px] font-medium text-gray-400 font-sans">
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
