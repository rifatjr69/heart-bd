import React from 'react';
import { ArrowRight, Sparkles, Gift, Truck, ShieldCheck } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const HeroBanner: React.FC = () => {
  const { setSelectedCategory } = useStore();

  const scrollToDeals = () => {
    const el = document.getElementById('flash-sales-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
      <div className="relative rounded-3xl overflow-hidden shadow-lg border border-pink-100 bg-gradient-to-r from-[#FFF0F4] via-white to-[#FFF5F8]">
        {/* Banner Grid / Hero Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center min-h-[340px] sm:min-h-[400px]">
          {/* Left Text Callout */}
          <div className="lg:col-span-6 p-6 sm:p-10 z-10 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F8628D]/10 text-[#F8628D] rounded-full text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>লিমিটেড টাইম ৫০% ছাড় — ধামাকা অফার!</span>
            </div>

            <div className="space-y-1">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1F1F24] tracking-tight leading-tight">
                LITTLE THINGS, <br />
                <span className="text-[#F8628D]">BIG HAPPINESS</span>
              </h1>
              <p className="text-lg sm:text-xl font-bold text-gray-700 font-sans">
                ছোট্ট আদর, বড় হাসি ❤️
              </p>
            </div>

            <p className="text-xs sm:text-sm text-gray-600 max-w-lg leading-relaxed">
              নবজাতক শিশুর রাজকীয় উপহার বক্স, বাচ্চাদের ট্রেন্ডি ট্রাভেল লাগেজ এবং ক্রিয়েটিভ খেলনার সেরা কালেকশন। কোনো অগ্রিম পেমেন্ট ছাড়াই ক্যাশ অন ডেলিভারি নিন।
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={scrollToDeals}
                className="px-6 py-3 bg-[#1F1F24] hover:bg-black text-white text-xs sm:text-sm font-bold rounded-full shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer group"
              >
                <span>অর্ডার করুন</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => setSelectedCategory('travel-luggage')}
                className="px-5 py-3 bg-white hover:bg-pink-50 border border-pink-200 text-[#F8628D] text-xs sm:text-sm font-bold rounded-full transition-all cursor-pointer"
              >
                কিডস লাগেজ দেখুন
              </button>
            </div>

            {/* Quick Micro-Trust Badges */}
            <div className="pt-4 flex flex-wrap items-center gap-4 text-[11px] font-semibold text-gray-600 border-t border-pink-100">
              <div className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-[#F8628D]" />
                <span>সারা দেশে হোম ডেলিভারি</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5 text-[#F8628D]" />
                <span>ফ্রি প্রিমিয়াম গিফট র্যাপিং</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#F8628D]" />
                <span>১০০% প্রিমিয়াম কোয়ালিটি</span>
              </div>
            </div>
          </div>

          {/* Right Visual Image */}
          <div className="lg:col-span-6 relative h-64 sm:h-80 lg:h-full min-h-[300px] flex items-center justify-center p-4">
            <img
              src="/src/assets/images/hero_banner_littlehug_1792050430352.jpg"
              alt="LittleHug BD Baby & Kids Collection"
              className="w-full h-full object-cover rounded-2xl shadow-sm"
              loading="eager"
            />
            {/* Float Floating Price Chip */}
            <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-xs py-2 px-3.5 rounded-2xl shadow-lg border border-pink-100 text-center animate-bounce">
              <span className="text-[10px] font-bold text-gray-500 uppercase block">Starting from</span>
              <span className="text-base sm:text-lg font-black text-[#F8628D]">৳১,৬৫0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
