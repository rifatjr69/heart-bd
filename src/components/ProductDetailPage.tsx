import React, { useState } from 'react';
import {
  ArrowLeft,
  ShoppingBag,
  Phone,
  MessageCircle,
  Truck,
  ShieldCheck,
  Minus,
  Plus,
  Star,
  Check,
  Gift,
  Heart,
  Share2,
} from 'lucide-react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { ProductCard } from './ProductCard';

interface ProductDetailPageProps {
  product: Product;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ product }) => {
  const {
    closeProductDetail,
    addToCart,
    openCheckout,
    settings,
    toggleWishlist,
    isInWishlist,
    products,
    showToast,
  } = useStore();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(
    product.variants && product.variants.length > 0 ? product.variants[0].value : undefined
  );
  const [activeTab, setActiveTab] = useState<'description' | 'features' | 'reviews'>('description');

  const isFavorite = isInWishlist(product.id);
  const images = product.images && product.images.length > 0 ? product.images : [product.image_url];
  const activeImage = images[activeImageIndex] || product.image_url;

  // Selected variant price calculation
  const currentVariantObj = product.variants?.find((v) => v.value === selectedVariant);
  const unitPrice = currentVariantObj?.price_override || product.price;
  const totalPrice = unitPrice * quantity;

  // Free delivery calculation
  const freeThreshold = settings.free_delivery_threshold;
  const extraDiscountThreshold = settings.extra_discount_threshold;
  const diffToFree = Math.max(0, freeThreshold - totalPrice);
  const progressPercent = Math.min(100, (totalPrice / extraDiscountThreshold) * 100);

  // WhatsApp Order message
  const waMessage = encodeURIComponent(
    `Hello LittleHug BD! I want to order "${product.name}" (Variant: ${
      selectedVariant || 'Standard'
    }, Qty: ${quantity}, Total: ৳${totalPrice}). Please confirm my order.`
  );
  const waUrl = `https://wa.me/88${settings.whatsapp_number}?text=${waMessage}`;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Check out ${product.name} on LittleHug BD!`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('লিংক কপি করা হয়েছে!');
    }
  };

  // Related products
  const relatedProducts = products
    .filter((p) => p.id !== product.id && p.category_id === product.category_id)
    .slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Breadcrumb / Back button */}
      <div className="flex items-center justify-between pb-5 border-b border-pink-100 mb-6">
        <button
          onClick={closeProductDetail}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-700 hover:text-[#F8628D] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ব্যাক টু হোমপেজ (Back to Shop)</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="p-2 rounded-full bg-white hover:bg-pink-50 border border-pink-100 text-gray-600 hover:text-[#F8628D] transition-colors cursor-pointer"
            title="Share Product"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => toggleWishlist(product.id)}
            className={`p-2 rounded-full bg-white hover:bg-pink-50 border border-pink-100 transition-colors cursor-pointer ${
              isFavorite ? 'text-[#F8628D]' : 'text-gray-400'
            }`}
            title="Save to Wishlist"
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-[#F8628D]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main 2-Column Product Grid (Layout of Screenshot 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-6 space-y-4">
          {/* Large Main Image Frame */}
          <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-white border border-pink-100 shadow-xs flex items-center justify-center p-4">
            <img
              src={activeImage}
              alt={product.name}
              className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
              referrerPolicy="no-referrer"
            />

            {/* Discount Badge */}
            {product.discount_percent > 0 && (
              <div className="absolute top-4 right-4 bg-[#F8628D] text-white text-xs font-bold px-3 py-1 rounded-full shadow-xs">
                {product.badge || `${product.discount_percent}% OFF`}
              </div>
            )}
          </div>

          {/* Thumbnail Strip (Click to switch) */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImageIndex(idx)}
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 transition-all p-1 bg-white cursor-pointer shrink-0 ${
                  activeImageIndex === idx
                    ? 'border-[#F8628D] ring-2 ring-pink-200 scale-105'
                    : 'border-pink-100 hover:border-pink-300 opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={img}
                  alt={`${product.name} thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover rounded-xl"
                  referrerPolicy="no-referrer"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Contiguous Purchase Module (Layout of Screenshot 3) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Title and Bangla Subtitle */}
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-pink-50 text-[#F8628D] text-[11px] font-bold uppercase mb-2">
              <span>{product.secondary_badge || 'LittleHug Premium'}</span>
              <span>·</span>
              <span>In Stock ({product.stock} available)</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#1F1F24] leading-tight">
              {product.name}
            </h1>
            <p className="text-base sm:text-lg text-gray-500 font-sans mt-1">
              {product.name_bn}
            </p>

            {/* Rating Stars */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-xs font-bold text-gray-700">5.0</span>
              <span className="text-xs text-gray-400">({product.review_count} reviews)</span>
              <span className="text-gray-300">·</span>
              <span className="text-xs text-[#F8628D] font-bold">Sold {product.sold_count}</span>
            </div>
          </div>

          {/* Pricing */}
          <div className="flex items-baseline gap-3 pb-3 border-b border-pink-100">
            <span className="text-3xl sm:text-4xl font-black text-[#F8628D]">
              ৳{unitPrice.toLocaleString('en-US')}
            </span>
            {product.old_price && (
              <span className="text-lg text-gray-400 line-through">
                ৳{product.old_price.toLocaleString('en-US')}
              </span>
            )}
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
              সেভ ৳{((product.old_price || unitPrice) - unitPrice).toLocaleString('en-US')}
            </span>
          </div>

          {/* Variant Selector (if available) */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Select {product.variants[0].name}:
              </label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => {
                  const isSelected = selectedVariant === v.value;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v.value)}
                      className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#F8628D] bg-[#F8628D] text-white shadow-xs'
                          : 'border-pink-200 bg-white text-gray-700 hover:border-[#F8628D] hover:bg-pink-50'
                      }`}
                    >
                      {v.value}
                      {v.price_override && (
                        <span className="ml-1 opacity-80">(৳{v.price_override})</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stepper + Add to Cart Row */}
          <div className="flex items-center gap-3 pt-1">
            {/* Quantity Stepper */}
            <div className="flex items-center border border-pink-200 rounded-xl bg-white px-2 py-1 shadow-2xs">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:bg-pink-50 hover:text-[#F8628D] transition-colors cursor-pointer"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-10 text-center font-bold text-sm text-gray-900">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:bg-pink-50 hover:text-[#F8628D] transition-colors cursor-pointer"
                aria-label="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Outlined Add to Cart Button */}
            <button
              onClick={() => addToCart(product, quantity, selectedVariant)}
              className="flex-1 py-3 px-5 border-2 border-[#1F1F24] hover:bg-gray-50 text-[#1F1F24] text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Add to cart</span>
            </button>
          </div>

          {/* Big Black Order Now Button (Layout of Screenshot 3) */}
          <button
            onClick={() => openCheckout(product, quantity, selectedVariant)}
            className="w-full py-3.5 px-6 bg-[#1F1F24] hover:bg-black active:scale-[0.99] text-white rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="block text-sm sm:text-base font-black tracking-wide">
                  Order Now
                </span>
                <span className="block text-[11px] text-gray-300 font-sans">
                  Cash on Delivery · Pay when you receive
                </span>
              </div>
            </div>

            <div className="bg-white/15 px-3 py-1.5 rounded-xl font-mono font-black text-xs sm:text-sm text-white flex items-center gap-1 group-hover:bg-[#F8628D] transition-colors">
              <span>৳{totalPrice.toLocaleString('en-US')}</span>
              <span>→</span>
            </div>
          </button>

          {/* Two Side-by-Side Action Buttons: WhatsApp & Call */}
          <div className="grid grid-cols-2 gap-3">
            {/* WhatsApp Order (Green) */}
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl transition-all flex items-center gap-2 text-left group"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div className="leading-tight overflow-hidden">
                <span className="block text-xs font-bold truncate group-hover:text-emerald-900">
                  WhatsApp Order
                </span>
                <span className="block text-[10px] text-emerald-600 truncate">
                  Usually replies fast
                </span>
              </div>
            </a>

            {/* Call to Order (Blue) */}
            <a
              href={`tel:${settings.call_number}`}
              className="py-2.5 px-3 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 rounded-xl transition-all flex items-center gap-2 text-left group"
            >
              <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Phone className="w-4 h-4" />
              </div>
              <div className="leading-tight overflow-hidden">
                <span className="block text-xs font-bold truncate group-hover:text-sky-900">
                  Call to Order
                </span>
                <span className="block text-[10px] text-sky-600 truncate font-mono">
                  {settings.call_number}
                </span>
              </div>
            </a>
          </div>

          {/* Trust Line */}
          <div className="flex items-center justify-center gap-6 text-xs text-gray-500 font-semibold py-1">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>No advance payment</span>
            </div>
            <span>·</span>
            <div className="flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-[#F8628D]" />
              <span>Delivery by Pathao</span>
            </div>
          </div>

          {/* Free Delivery Milestone Progress Bar (Screenshot 3 layout) */}
          <div className="bg-[#FFF5F8] border border-pink-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-gray-700">
              <span>
                {diffToFree > 0
                  ? `Add ৳${diffToFree.toLocaleString('en-US')} more for FREE delivery 🚚`
                  : '🎉 Congratulations! You have unlocked FREE Delivery!'}
              </span>
            </div>

            {/* Visual Bar */}
            <div className="w-full h-2.5 bg-pink-100 rounded-full overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-[#F8628D] to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Milestones markers */}
            <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 pt-1">
              <div className="flex items-center gap-1">
                <span>🚚 Free delivery</span>
                <span className="font-mono text-gray-700">৳{freeThreshold}</span>
              </div>
              <div className="flex items-center gap-1">
                <Gift className="w-3.5 h-3.5 text-[#F8628D]" />
                <span>5% extra off</span>
                <span className="font-mono text-gray-700">৳{extraDiscountThreshold}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description Section */}
      {product.description && (
        <div className="mt-12 bg-white rounded-3xl border border-pink-100 p-6 sm:p-8 shadow-xs">
          <h4 className="font-black text-gray-900 border-b pb-4 mb-4">বিবরণ (Description)</h4>
          <div className="text-sm text-gray-700 leading-relaxed font-sans whitespace-pre-line">
            {product.description}
          </div>
        </div>
      )}

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-12">
          <h3 className="text-xl font-black text-[#1F1F24] mb-4">
            Related Products (সম্পর্কিত পণ্য)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
