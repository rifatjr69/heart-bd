import React from 'react';
import { Truck, MessageCircle, Gift, Sparkles } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from './ProductCard';

export const HotDeals: React.FC = () => {
  const { products, selectedCategory, searchQuery } = useStore();

  // Filter products for Hot Deals or category / search
  let displayProducts = products;

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    displayProducts = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.name_bn.includes(q) ||
        (p.short_description && p.short_description.toLowerCase().includes(q))
    );
  } else if (selectedCategory) {
    displayProducts = products.filter(
      (p) => p.category_slug === selectedCategory || p.category_id === selectedCategory
    );
  } else {
    // Default show hot deals and luggage / toy collection
    displayProducts = products.filter((p) => p.is_hot_deal);
  }

  return (
    <section id="products-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Container matching Screenshot 1 */}
      <div className="bg-white rounded-3xl border border-pink-100 p-4 sm:p-6 shadow-sm">
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-pink-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-xl shrink-0">
              🧳
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-[#1F1F24] tracking-tight">
                  {searchQuery
                    ? `Search Results for "${searchQuery}"`
                    : selectedCategory
                    ? `Category: ${selectedCategory.replace(/-/g, ' ').toUpperCase()}`
                    : 'Hot Deal – Travel & Toys'}
                </h2>
              </div>
              <p className="text-xs text-gray-500 font-medium">
                Best selling luggage & rescue toys – limited stock
              </p>
            </div>
          </div>

          {/* Free Delivery Pill Badge */}
          <div className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-50 border border-pink-200 text-[#F8628D] text-xs font-bold">
            <span>Free Delivery</span>
            <span>🚚</span>
          </div>
        </div>

        {/* 6-per-row responsive grid matching Screenshot 1 */}
        {displayProducts.length === 0 ? (
          <div className="py-16 text-center">
            <span className="text-4xl block mb-2">🔍</span>
            <h3 className="text-base font-bold text-gray-800">কোনো পণ্য পাওয়া যায়নি</h3>
            <p className="text-xs text-gray-500 mt-1">অন্য কোনো কি-ওয়ার্ড দিয়ে সার্চ করুন</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 pt-5">
            {displayProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      {/* Bottom Feature Strip (3 Cards Matching Screenshot 1) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {/* Card 1: সারা বাংলাদেশে হোম ডেলিভারি */}
        <div className="bg-white rounded-2xl border border-pink-100 p-4 sm:p-5 flex items-center gap-4 shadow-2xs hover:shadow-sm transition-shadow">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 text-2xl">
            🚚
          </div>
          <div>
            <h4 className="text-sm font-black text-gray-900">
              সারা বাংলাদেশে হোম ডেলিভারি
            </h4>
            <p className="text-xs text-gray-500 font-sans mt-0.5">
              ক্যাশ অন ডেলিভারি — হাতে পেয়ে মূল্য পরিশোধ করুন
            </p>
          </div>
        </div>

        {/* Card 2: Inbox / WhatsApp Order */}
        <a
          href="https://wa.me/8801717823525?text=Hello%20LittleHug%20BD%2C%20I%20want%20to%20order"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white rounded-2xl border border-pink-100 p-4 sm:p-5 flex items-center gap-4 shadow-2xs hover:shadow-sm hover:border-pink-300 transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center shrink-0 text-2xl group-hover:scale-105 transition-transform">
            💬
          </div>
          <div>
            <h4 className="text-sm font-black text-gray-900 group-hover:text-green-600 transition-colors">
              Inbox / WhatsApp Order
            </h4>
            <p className="text-xs text-gray-500 font-sans mt-0.5">
              যেকোনো প্রয়োজনে দ্রুত অর্ডার করতে হোয়াটসঅ্যাপ করুন
            </p>
          </div>
        </a>

        {/* Card 3: Premium Gift Wrapping */}
        <div className="bg-white rounded-2xl border border-pink-100 p-4 sm:p-5 flex items-center gap-4 shadow-2xs hover:shadow-sm transition-shadow">
          <div className="w-12 h-12 rounded-2xl bg-pink-50 text-[#F8628D] flex items-center justify-center shrink-0 text-2xl">
            🎁
          </div>
          <div>
            <h4 className="text-sm font-black text-gray-900">
              Premium Gift Wrapping
            </h4>
            <p className="text-xs text-gray-500 font-sans mt-0.5">
              প্রতিটি বক্সে প্রিমিয়াম সাটিন রিবন ও গ্রিটিংস কার্ড ফ্রি
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
