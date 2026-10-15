import React, { useEffect } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { TopCategories } from './components/TopCategories';
import { FlashSales } from './components/FlashSales';
import { HotDeals } from './components/HotDeals';
import { ProductDetailPage } from './components/ProductDetailPage';
import { CheckoutModal } from './components/CheckoutModal';
import { CartDrawer } from './components/CartDrawer';
import { TrackOrderModal } from './components/TrackOrderModal';
import { AuthModal } from './components/AuthModal';
import { AdminDashboard } from './components/AdminDashboard';
import { Footer } from './components/Footer';

const MainLayout: React.FC = () => {
  const {
    selectedProduct,
    toastMessage,
    openAdminDashboard,
    isAdminDashboardOpen,
    isAdmin,
  } = useStore();

  // Listen to hash e.g. #admin
  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#admin') {
        openAdminDashboard();
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [openAdminDashboard]);

  // If Admin Dashboard is active and authorized, render as a full standalone page!
  if (isAdminDashboardOpen && isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 text-[#1F1F24]">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-60 bg-[#1F1F24] text-white px-5 py-2.5 rounded-full shadow-2xl text-xs sm:text-sm font-bold flex items-center gap-2 animate-bounce">
            <span>{toastMessage}</span>
          </div>
        )}
        <AdminDashboard />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF5F8] text-[#1F1F24]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-60 bg-[#1F1F24] text-white px-5 py-2.5 rounded-full shadow-2xl text-xs sm:text-sm font-bold flex items-center gap-2 animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* LittleHug BD Header */}
      <Header />

      {/* Main View Router */}
      <main className="flex-1">
        {selectedProduct ? (
          /* Product Details Page (Screenshot 3 layout) */
          <ProductDetailPage product={selectedProduct} />
        ) : (
          /* Homepage (Screenshots 1 & 2 layout) */
          <>
            <HeroBanner />
            <TopCategories />
            <FlashSales />
            <HotDeals />
          </>
        )}
      </main>

      {/* Footer & Floating WhatsApp */}
      <Footer />

      {/* Overlays / Modals */}
      <CheckoutModal />
      <CartDrawer />
      <TrackOrderModal />
      <AuthModal />
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <MainLayout />
    </StoreProvider>
  );
}
