import React from 'react';
import { Heart, Star } from 'lucide-react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { openCheckout, openProductDetail, toggleWishlist, isInWishlist } = useStore();

  const isFavorite = isInWishlist(product.id);

  const handleCardClick = (e: React.MouseEvent) => {
    // If not clicking button or heart, open details
    openProductDetail(product);
  };

  const handleOrderClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openCheckout(product, 1);
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-[22px] border border-pink-100 p-2.5 sm:p-3 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group cursor-pointer hover:-translate-y-1"
    >
      {/* Top Image Section */}
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-pink-50 mb-3">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          referrerPolicy="no-referrer"
        />

        {/* Top Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {product.secondary_badge && (
            <span className="px-2 py-0.5 bg-white/95 text-gray-800 text-[10px] font-black rounded-md shadow-xs uppercase tracking-wider">
              {product.secondary_badge}
            </span>
          )}
        </div>

        {/* 50% ছাড় Badge (Top Right) */}
        {product.badge && (
          <div className="absolute top-2 right-2 bg-[#F8628D] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
            {product.badge}
          </div>
        )}

        {/* Wishlist Heart Button (Bottom Right of Image) */}
        <button
          onClick={handleWishlistClick}
          className={`absolute bottom-2 right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-xs cursor-pointer ${
            isFavorite ? 'bg-pink-50 text-[#F8628D]' : 'bg-white/90 text-gray-400 hover:text-[#F8628D]'
          }`}
          aria-label="Wishlist"
        >
          <Heart
            className={`w-4 h-4 ${isFavorite ? 'fill-[#F8628D] text-[#F8628D]' : 'text-gray-400'}`}
          />
        </button>
      </div>

      {/* Product Information */}
      <div className="flex-1 flex flex-col justify-between space-y-2">
        <div>
          {/* Title */}
          <h3 className="text-xs sm:text-sm font-bold text-[#1F1F24] line-clamp-2 group-hover:text-[#F8628D] transition-colors leading-snug">
            {product.name}
          </h3>

          {/* Bengali Subtitle */}
          <p className="text-[11px] sm:text-xs text-gray-400 font-sans mt-0.5 truncate">
            {product.name_bn}
          </p>
        </div>

        {/* Sold & Rating Pills */}
        <div className="flex items-center gap-2 pt-0.5">
          <span className="text-[10px] font-bold text-[#F8628D] bg-pink-50 px-2 py-0.5 rounded-md">
            Sold {product.sold_count}
          </span>
          <div className="flex items-center gap-1 text-[10px] font-bold text-gray-600 bg-amber-50 px-2 py-0.5 rounded-md">
            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
            <span>{product.rating.toFixed(1)}</span>
          </div>
        </div>

        {/* Pricing */}
        <div className="flex items-baseline gap-2 pt-1">
          <span className="text-base sm:text-lg font-black text-[#F8628D]">
            ৳{product.price.toLocaleString('en-US')}
          </span>
          {product.old_price && (
            <span className="text-xs sm:text-xs text-gray-400 line-through">
              ৳{product.old_price.toLocaleString('en-US')}
            </span>
          )}
        </div>

        {/* Black CTA Button (অর্ডার করুন) */}
        <button
          onClick={handleOrderClick}
          className="w-full mt-2 py-2.5 px-4 bg-[#1F1F24] hover:bg-black active:scale-[0.98] text-white text-xs sm:text-sm font-bold rounded-full sm:rounded-xl shadow-xs transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
        >
          <span>অর্ডার করুন</span>
        </button>
      </div>
    </div>
  );
};
