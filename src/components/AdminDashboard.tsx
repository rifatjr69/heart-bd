import React, { useEffect, useId, useState } from 'react';
import {
  X,
  Package,
  ShoppingBag,
  Sliders,
  Database,
  Edit2,
  Trash2,
  Plus,
  Save,
  Copy,
  FolderPlus,
  Tag,
  Check,
  ArrowLeft,
  LogOut,
  Phone,
  MessageCircle,
  Search,
  Printer,
  Upload,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { OrderStatus, Product, Order } from '../types';
import { isSupabaseConfigured, uploadImageToSupabase } from '../lib/supabase';
import { BannerManager } from './BannerManager';

// স্ক্রলবার লুকানোর ক্লাস (Tailwind v4 এ no-scrollbar বিল্ট-ইন নেই)
const hideScrollbar = '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

const MAX_IMAGE_MB = 5;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const DEFAULT_PRODUCT_IMAGE = '/src/assets/images/gift_box_pink_teddy_1792050433788.jpg';
const DEFAULT_CATEGORY_IMAGE = '/assets/images/gift_box_pink_teddy_1792050433788.jpg';

const PRESET_IMAGES: { value: string; label: string }[] = [
  { value: '/src/assets/images/gift_box_pink_teddy_1792050433788.jpg', label: 'Pink Teddy Gift Box' },
  { value: '/src/assets/images/gift_box_mint_bear_1792050466062.jpg', label: 'Mint Bear Gift Box' },
  { value: '/src/assets/images/gift_box_yellow_sunshine_1792050506416.jpg', label: 'Sunshine Yellow Gift Box' },
  { value: '/src/assets/images/rescue_toy_truck_set_1792050432743.jpg', label: 'Rescue Toy Truck Set' },
  { value: '/src/assets/images/luggage_unicorn_kids_1792050431878.jpg', label: 'Unicorn Travel Luggage' },
  { value: '/src/assets/images/luggage_astronaut_kids_1792050465126.jpg', label: 'Astronaut Travel Luggage' },
  { value: '/src/assets/images/luggage_bunny_pink_1792050506373.jpg', label: 'Bunny Pink Luggage' },
  { value: '/src/assets/images/luggage_dinosaur_kids_1792050467536.jpg', label: 'Dinosaur Green Luggage' },
];

/**
 * ছবি যাচাই করে Supabase এ আপলোড করে। সমস্যা হলে আসল error message ছুঁড়ে দেয়,
 * যাতে toast এ দেখে বোঝা যায় ঠিক কী সমস্যা (bucket, policy, সাইজ ইত্যাদি)।
 */
const uploadImage = async (file: File): Promise<string> => {
  const okType = ALLOWED_IMAGE_TYPES.includes(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name);
  if (!okType) {
    throw new Error('শুধু JPG, PNG বা WEBP ছবি আপলোড করা যাবে');
  }
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
    throw new Error(`ছবির সাইজ ${MAX_IMAGE_MB}MB এর বেশি হতে পারবে না`);
  }
  const url = await uploadImageToSupabase(file);
  if (!url) {
    throw new Error('আপলোডের পর ছবির লিঙ্ক পাওয়া যায়নি (Supabase bucket/policy চেক করুন)');
  }
  return url;
};

const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'object' && err && 'message' in err) return String((err as { message: unknown }).message);
  return 'অজানা সমস্যা';
};

/* ---------- পুনর্ব্যবহারযোগ্য ছবি আপলোড ফিল্ড ---------- */
interface ImageUploadFieldProps {
  label: string;
  imageUrl?: string | null;
  uploading: boolean;
  onSelect: (file: File) => void;
  onClear?: () => void;
  hint?: string;
}

const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  imageUrl,
  uploading,
  onSelect,
  onClear,
  hint,
}) => {
  const inputId = useId();
  return (
    <div className="space-y-1.5">
      <span className="font-bold text-gray-700 block">{label}</span>
      <div className="flex items-center gap-3 p-2.5 rounded-2xl border border-pink-200 bg-pink-50/30">
        <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl border border-pink-200 bg-white overflow-hidden flex items-center justify-center">
          {uploading ? (
            <Loader2 className="w-6 h-6 text-[#F8628D] animate-spin" />
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt="preview"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <ImageIcon className="w-6 h-6 text-pink-300" />
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <label
              htmlFor={inputId}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                uploading
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-[#F8628D] hover:bg-[#E74B78] text-white cursor-pointer'
              }`}
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              <span>{uploading ? 'আপলোড হচ্ছে...' : imageUrl ? 'ছবি পরিবর্তন' : 'কম্পিউটার থেকে ছবি বাছুন'}</span>
            </label>
            {imageUrl && onClear && !uploading && (
              <button
                type="button"
                onClick={onClear}
                className="px-2.5 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 cursor-pointer"
              >
                সরান
              </button>
            )}
          </div>
          <input
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={uploading}
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = ''; // একই ফাইল আবার বাছাই করা যাবে
              if (file) onSelect(file);
            }}
          />
          <p className="text-[10px] text-gray-400 leading-snug">
            {hint || `JPG / PNG / WEBP, সর্বোচ্চ ${MAX_IMAGE_MB}MB`}
          </p>
        </div>
      </div>
    </div>
  );
};

export const AdminDashboard: React.FC = () => {
  const {
    isAdminDashboardOpen,
    closeAdminDashboard,
    orders,
    updateOrderStatus,
    deleteOrder,
    products,
    updateProduct,
    addProduct,
    deleteProduct,
    categories,
    addCategory,
    deleteCategory,
    settings,
    updateSettings,
    user,
    logout,
    showToast,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'banners' | 'settings' | 'sql'>('orders');

  // Orders filter & search
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [viewInvoiceOrder, setViewInvoiceOrder] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  // Products Tab: Category filter & Search
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');
  const [productSearchQuery, setProductSearchQuery] = useState('');

  // Product / category modal state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<(typeof categories)[number] | null>(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);

  // Upload states
  const [isUploadingProductImage, setIsUploadingProductImage] = useState(false);
  const [isUploadingCategoryImage, setIsUploadingCategoryImage] = useState(false);

  // New Category Form State
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryNameBn, setNewCategoryNameBn] = useState('');
  const [newCategorySubLabel, setNewCategorySubLabel] = useState('');
  const [newCategoryImageUrl, setNewCategoryImageUrl] = useState('');

  // New Product Form State
  const [newProductForm, setNewProductForm] = useState<Partial<Product>>({
    name: '',
    name_bn: '',
    category_id: categories[0]?.id || 'cat-1',
    category_slug: categories[0]?.slug || 'baby-gift-box',
    price: 1800,
    old_price: 3600,
    discount_percent: 50,
    badge: '50% ছাড়',
    secondary_badge: 'NEW',
    sold_count: 0,
    rating: 5.0,
    stock: 25,
    is_featured: true,
    is_flash_sale: false,
    is_hot_deal: true,
    is_active: true,
    image_url: DEFAULT_PRODUCT_IMAGE,
    images: [DEFAULT_PRODUCT_IMAGE],
    description: 'প্রিমিয়াম কোয়ালিটির বেবি গিফট বক্স',
  });

  // Settings form state
  const [settingsForm, setSettingsForm] = useState(settings);

  // সেটিংস পরে লোড হলে ফর্মও আপডেট হবে
  useEffect(() => {
    setSettingsForm(settings);
  }, [settings]);

  if (!isAdminDashboardOpen) return null;

  // Filter orders by status and search query (name, phone, order number)
  const filteredOrders = orders.filter((o) => {
    const matchStatus = orderStatusFilter === 'all' ? true : o.status === orderStatusFilter;
    const matchSearch = orderSearchQuery.trim()
      ? o.order_number.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
        o.customer_name.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
        o.phone.includes(orderSearchQuery)
      : true;
    return matchStatus && matchSearch;
  });

  const totalRevenue = orders.reduce((sum, o) => (o.status !== 'cancelled' ? sum + o.total : sum), 0);
  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const deliveredCount = orders.filter((o) => o.status === 'delivered').length;

  // Filter products by category and search
  const filteredProducts = products.filter((p) => {
    const matchCategory =
      productCategoryFilter === 'all'
        ? true
        : p.category_slug === productCategoryFilter || p.category_id === productCategoryFilter;
    const matchSearch = productSearchQuery.trim()
      ? p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
        p.name_bn.includes(productSearchQuery)
      : true;
    return matchCategory && matchSearch;
  });

  /* ---------- Product image upload ---------- */
  const handleProductImageSelect = async (file: File, isEdit: boolean) => {
    try {
      setIsUploadingProductImage(true);
      showToast('ছবি আপলোড হচ্ছে...');
      const url = await uploadImage(file);

      if (isEdit) {
        setEditingProduct((prev) =>
          prev ? { ...prev, image_url: url, images: [url, ...(prev.images || []).filter((i) => i !== url)] } : prev
        );
      } else {
        setNewProductForm((prev) => ({
          ...prev,
          image_url: url,
          images: [url, ...(prev.images || []).filter((i) => i !== url)],
        }));
      }
      showToast('✓ ছবি সফলভাবে আপলোড হয়েছে!');
    } catch (err) {
      console.error('Image upload failed:', err);
      showToast(`ছবি আপলোড ব্যর্থ: ${getErrorMessage(err)}`);
    } finally {
      setIsUploadingProductImage(false);
    }
  };

  /* ---------- Category image upload ---------- */
  const handleCategoryImageSelect = async (file: File) => {
    try {
      setIsUploadingCategoryImage(true);
      showToast('ক্যাটাগরির ছবি আপলোড হচ্ছে...');
      const url = await uploadImage(file);
      setNewCategoryImageUrl(url);
      showToast('✓ ক্যাটাগরির ছবি আপলোড হয়েছে!');
    } catch (err) {
      console.error('Category image upload failed:', err);
      showToast(`ছবি আপলোড ব্যর্থ: ${getErrorMessage(err)}`);
    } finally {
      setIsUploadingCategoryImage(false);
    }
  };

  const handleSettingsSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(settingsForm);
  };

  const handleOpenAddProduct = () => {
    // অ্যাডমিন যদি কোনো ক্যাটাগরি ফিল্টার করে রাখে, সেটাই আগে থেকে সিলেক্ট হবে
    const activeCat =
      productCategoryFilter !== 'all'
        ? categories.find((c) => c.slug === productCategoryFilter || c.id === productCategoryFilter)
        : categories[0];

    const img = activeCat?.image_url || DEFAULT_PRODUCT_IMAGE;

    setNewProductForm({
      name: '',
      name_bn: '',
      category_id: activeCat?.id || categories[0]?.id,
      category_slug: activeCat?.slug || categories[0]?.slug,
      price: 1800,
      old_price: 3600,
      discount_percent: 50,
      badge: '50% ছাড়',
      secondary_badge: 'NEW',
      sold_count: 0,
      rating: 5.0,
      stock: 25,
      is_featured: true,
      is_flash_sale: false,
      is_hot_deal: true,
      is_active: true,
      image_url: img,
      images: [img],
      description: 'প্রিমিয়াম কোয়ালিটির বেবি গিফট বক্স',
    });
    setIsNewProductModalOpen(true);
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductForm.name) return;
    if (isUploadingProductImage) {
      showToast('ছবি আপলোড শেষ হওয়া পর্যন্ত অপেক্ষা করুন');
      return;
    }

    const matchedCat = categories.find(
      (c) => c.id === newProductForm.category_id || c.slug === newProductForm.category_slug
    );

    addProduct({
      name: newProductForm.name,
      name_bn: newProductForm.name_bn || newProductForm.name,
      slug: (newProductForm.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category_id: matchedCat?.id || categories[0]?.id || null,
      category_slug: matchedCat?.slug || categories[0]?.slug || null,
      price: Number(newProductForm.price) || 0,
      old_price: Number(newProductForm.old_price) || 0,
      discount_percent: Number(newProductForm.discount_percent) || 0,
      badge: newProductForm.badge || '50% ছাড়',
      secondary_badge: newProductForm.secondary_badge || 'NEW',
      sold_count: 0,
      rating: 5.0,
      review_count: 0,
      stock: Number(newProductForm.stock) || 10,
      is_featured: Boolean(newProductForm.is_featured),
      is_flash_sale: Boolean(newProductForm.is_flash_sale),
      is_hot_deal: Boolean(newProductForm.is_hot_deal),
      is_active: true,
      image_url: newProductForm.image_url || DEFAULT_PRODUCT_IMAGE,
      images: [newProductForm.image_url || DEFAULT_PRODUCT_IMAGE],
      description: newProductForm.description || '',
    });
    setIsNewProductModalOpen(false);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    if (typeof deleteCategory !== 'function') {
      showToast('deleteCategory ফাংশনটি StoreContext এ পাওয়া যায়নি');
      setCategoryToDelete(null);
      return;
    }
    const target = categoryToDelete;
    try {
      setIsDeletingCategory(true);
      await deleteCategory(target.id);
      if (productCategoryFilter === target.slug) setProductCategoryFilter('all');
      showToast(`✓ ক্যাটাগরি "${target.name}" মুছে ফেলা হয়েছে`);
    } catch (err) {
      console.error('Category delete failed:', err);
      showToast(`ক্যাটাগরি মুছতে ব্যর্থ: ${getErrorMessage(err)}`);
    } finally {
      setIsDeletingCategory(false);
      setCategoryToDelete(null);
    }
  };

  const resetCategoryForm = () => {
    setNewCategoryName('');
    setNewCategoryNameBn('');
    setNewCategorySubLabel('');
    setNewCategoryImageUrl('');
  };

  const closeCategoryModal = () => {
    if (isUploadingCategoryImage) return;
    resetCategoryForm();
    setIsNewCategoryModalOpen(false);
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    if (isUploadingCategoryImage) {
      showToast('ছবি আপলোড শেষ হওয়া পর্যন্ত অপেক্ষা করুন');
      return;
    }

    const slug = newCategoryName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
    addCategory({
      name: newCategoryName.trim(),
      name_bn: newCategoryNameBn.trim() || newCategoryName.trim(),
      slug,
      image_url: newCategoryImageUrl.trim() || DEFAULT_CATEGORY_IMAGE,
      sub_label: newCategorySubLabel.trim() || 'New Collection',
      sort_order: categories.length + 1,
      is_active: true,
    });

    resetCategoryForm();
    setIsNewCategoryModalOpen(false);
  };

  // Reusable class strings
  const modalOverlay =
    'fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center sm:p-4';
  const modalPanel =
    'bg-white rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 w-full space-y-4 max-h-[92vh] sm:max-h-[88vh] overflow-y-auto';
  const modalFooter =
    'sticky bottom-0 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 px-4 sm:px-6 py-3 bg-white border-t border-gray-100 flex gap-2';

  const tabBtn = (tab: typeof activeTab) =>
    `shrink-0 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
      activeTab === tab
        ? 'bg-[#1F1F24] text-white shadow-sm'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans overflow-x-hidden">
      {/* ইনভয়েস প্রিন্টের সময় শুধু মেমো ছাপা হবে */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #invoice-print, #invoice-print * { visibility: visible !important; }
          #invoice-print { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#1F1F24] text-white border-b border-gray-800 shadow-md px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-[#F8628D] to-[#FF86A8] flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-xs shrink-0">
            🧸
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <h1 className="text-sm sm:text-lg font-black tracking-tight text-white truncate">
                <span className="sm:hidden">LittleHug Admin</span>
                <span className="hidden sm:inline">LittleHug BD Admin Portal</span>
              </h1>
              <span className="hidden md:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                Database Verified
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-gray-400 font-mono truncate">
              <span className="hidden sm:inline">Logged in as: </span>
              <span className="text-gray-200 font-bold">{user?.email || 'Admin'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <button
            onClick={closeAdminDashboard}
            className="flex items-center gap-1.5 p-2.5 sm:px-3.5 sm:py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            title="Return to customer store view"
            aria-label="স্টোরে ফিরে যান"
          >
            <ArrowLeft className="w-4 h-4 text-[#F8628D]" />
            <span className="hidden lg:inline">স্টোরে ফিরে যান (View Store)</span>
            <span className="hidden sm:inline lg:hidden">Store</span>
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 p-2.5 sm:px-3 sm:py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
            title="Logout"
            aria-label="লগআউট"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">লগআউট</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 flex flex-col gap-4 sm:gap-6 min-w-0">
        {/* Navigation Tabs */}
        <div className={`bg-white p-1.5 sm:p-2 rounded-2xl border border-gray-200/80 shadow-xs overflow-x-auto ${hideScrollbar}`}>
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-max">
            <button onClick={() => setActiveTab('orders')} className={tabBtn('orders')}>
              <ShoppingBag className="w-4 h-4 text-[#F8628D]" />
              <span className="sm:hidden">Orders</span>
              <span className="hidden sm:inline">Orders (অর্ডার সমূহ)</span>
              {pendingCount > 0 && (
                <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] bg-[#F8628D] text-white font-mono font-bold">
                  {pendingCount}
                </span>
              )}
            </button>

            <button onClick={() => setActiveTab('products')} className={tabBtn('products')}>
              <Package className="w-4 h-4 text-[#F8628D]" />
              <span className="sm:hidden">Products ({products.length})</span>
              <span className="hidden sm:inline">Products & Inventory ({products.length})</span>
            </button>

            <button onClick={() => setActiveTab('banners')} className={tabBtn('banners')}>
              <ImageIcon className="w-4 h-4 text-[#F8628D]" />
              <span className="sm:hidden">Banners</span>
              <span className="hidden sm:inline">Banners (হোমপেজ ব্যানার)</span>
            </button>

            <button onClick={() => setActiveTab('settings')} className={tabBtn('settings')}>
              <Sliders className="w-4 h-4 text-[#F8628D]" />
              <span className="sm:hidden">Settings</span>
              <span className="hidden sm:inline">Store Settings & Delivery</span>
            </button>

            <button onClick={() => setActiveTab('sql')} className={tabBtn('sql')}>
              <Database className="w-4 h-4 text-[#F8628D]" />
              <span className="sm:hidden">Supabase</span>
              <span className="hidden sm:inline">Supabase Status</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200/80 p-3 sm:p-5 lg:p-7 shadow-xs min-w-0">
          {/* TAB: PRODUCTS & CATEGORIES */}
          {activeTab === 'products' && (
            <div className="space-y-4 sm:space-y-5">
              {/* Top Controls */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-pink-100">
                <div className="flex items-center gap-2 flex-1 lg:max-w-sm">
                  <input
                    type="text"
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    placeholder="পণ্য খুঁজুন (Search by name)..."
                    className="w-full px-3.5 py-2.5 sm:py-2 bg-gray-50 border border-gray-200 rounded-xl text-base sm:text-xs text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-[#F8628D]"
                  />
                  {productSearchQuery && (
                    <button
                      onClick={() => setProductSearchQuery('')}
                      className="text-gray-400 hover:text-gray-600 text-xs font-bold px-2 py-1 shrink-0"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
                  <button
                    onClick={() => setIsNewCategoryModalOpen(true)}
                    className="px-3 sm:px-3.5 py-2.5 sm:py-2 bg-white border border-pink-200 hover:bg-pink-50 text-[#F8628D] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                  >
                    <FolderPlus className="w-4 h-4 shrink-0" />
                    <span className="sm:hidden">নতুন ক্যাটাগরি</span>
                    <span className="hidden sm:inline">নতুন ক্যাটাগরি তৈরি করুন</span>
                  </button>

                  <button
                    onClick={handleOpenAddProduct}
                    className="px-3 sm:px-4 py-2.5 sm:py-2 bg-[#F8628D] hover:bg-[#E74B78] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all"
                  >
                    <Plus className="w-4 h-4 shrink-0" />
                    <span className="sm:hidden">নতুন পণ্য</span>
                    <span className="hidden sm:inline">নতুন পণ্য যোগ করুন</span>
                  </button>
                </div>
              </div>

              {/* Category Filter Bar */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-1 text-xs text-gray-500 font-bold">
                  <span>ক্যাটাগরি অনুযায়ী ফিল্টার করুন:</span>
                  <span className="text-[11px] text-[#F8628D]">
                    {filteredProducts.length} টি পণ্য প্রদর্শিত হচ্ছে
                  </span>
                </div>
                <div className={`flex items-center gap-2 overflow-x-auto pb-2 ${hideScrollbar}`}>
                  <button
                    onClick={() => setProductCategoryFilter('all')}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      productCategoryFilter === 'all'
                        ? 'bg-[#1F1F24] text-white shadow-xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    সবগুলো ({products.length})
                  </button>
                  {categories.map((c) => {
                    const count = products.filter(
                      (p) => p.category_slug === c.slug || p.category_id === c.id
                    ).length;
                    const isSelected = productCategoryFilter === c.slug;
                    return (
                      <div
                        key={c.id}
                        className={`shrink-0 flex items-center rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                          isSelected
                            ? 'bg-[#F8628D] text-white shadow-xs'
                            : 'bg-pink-50 text-gray-700 hover:bg-pink-100 border border-pink-200'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setProductCategoryFilter(c.slug)}
                          className="pl-3 pr-1.5 py-1.5 flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>{c.name}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-white text-gray-600'
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                        {/* ডিলিট বাটন — ক্লিক করলে কনফার্মেশন পপআপ খুলবে */}
                        <button
                          type="button"
                          onClick={() => setCategoryToDelete(c)}
                          title={`ক্যাটাগরি "${c.name}" মুছুন`}
                          aria-label={`ক্যাটাগরি ${c.name} মুছুন`}
                          className={`mr-1 p-1.5 rounded-full cursor-pointer transition-colors ${
                            isSelected
                              ? 'text-white hover:bg-white/25'
                              : 'text-gray-400 hover:text-red-600 hover:bg-red-100'
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Product list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredProducts.length === 0 ? (
                  <div className="col-span-full py-10 sm:py-12 text-center text-gray-400 space-y-2">
                    <span className="text-3xl block">📦</span>
                    <p className="text-xs font-bold text-gray-600">এই ক্যাটাগরিতে কোনো পণ্য নেই</p>
                    <button
                      onClick={handleOpenAddProduct}
                      className="px-4 py-2 bg-[#F8628D] text-white text-xs font-bold rounded-xl"
                    >
                      এই ক্যাটাগরিতে নতুন পণ্য যুক্ত করুন
                    </button>
                  </div>
                ) : (
                  filteredProducts.map((p) => {
                    const productCategory = categories.find(
                      (c) => c.slug === p.category_slug || c.id === p.category_id
                    );
                    return (
                      <div
                        key={p.id}
                        className="p-3 rounded-2xl border border-pink-100 bg-white flex gap-3 shadow-2xs hover:border-pink-300 transition-colors min-w-0"
                      >
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="w-16 h-16 object-cover rounded-xl border border-pink-50 bg-pink-50/20 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div className="min-w-0">
                            <span className="inline-block text-[10px] font-bold text-[#F8628D] bg-pink-50 px-2 py-0.5 rounded-md mb-1 max-w-full truncate">
                              📁 {productCategory?.name || 'Category'}
                            </span>
                            <h4 className="text-xs font-bold text-gray-900 truncate">{p.name}</h4>
                            <span className="text-[11px] text-gray-400 block font-sans truncate">
                              {p.name_bn}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="font-mono font-bold text-xs text-[#F8628D]">৳{p.price}</span>
                              <span className="text-[10px] text-gray-400">Stock: {p.stock}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-1">
                            <button
                              onClick={() => setEditingProduct(p)}
                              className="text-[11px] font-bold text-gray-700 hover:text-[#F8628D] flex items-center gap-1 cursor-pointer py-1"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>এডিট করুন</span>
                            </button>
                            <button
                              onClick={() => deleteProduct(p.id)}
                              className="text-gray-400 hover:text-red-500 p-1.5 cursor-pointer"
                              title="Delete Product"
                              aria-label="পণ্য মুছুন"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB: ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Stats overview */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                <div className="p-3 sm:p-4 rounded-2xl bg-pink-50/50 border border-pink-100 min-w-0">
                  <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase block">
                    Total Orders
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-gray-900 font-mono">{orders.length}</span>
                </div>
                <div className="p-3 sm:p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 min-w-0">
                  <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 uppercase block">
                    Total Revenue
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-emerald-800 font-mono break-all">
                    ৳{totalRevenue.toLocaleString()}
                  </span>
                </div>
                <div className="p-3 sm:p-4 rounded-2xl bg-amber-50/50 border border-amber-100 min-w-0">
                  <span className="text-[10px] sm:text-[11px] font-bold text-amber-600 uppercase block">
                    Pending Delivery
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-amber-800 font-mono">{pendingCount}</span>
                </div>
                <div className="p-3 sm:p-4 rounded-2xl bg-sky-50/50 border border-sky-100 min-w-0">
                  <span className="text-[10px] sm:text-[11px] font-bold text-sky-600 uppercase block">
                    Delivered Orders
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-sky-800 font-mono">{deliveredCount}</span>
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-pink-50/40 p-3 sm:p-3.5 rounded-2xl border border-pink-100">
                <div className="relative flex-1 lg:max-w-md">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    placeholder="অর্ডার খুঁজুন (নাম, মোবাইল বা LH-1001)..."
                    className="w-full pl-9 pr-8 py-2.5 sm:py-2 bg-white border border-pink-200 rounded-xl text-base sm:text-xs text-gray-800 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-[#F8628D]"
                  />
                  {orderSearchQuery && (
                    <button
                      onClick={() => setOrderSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                      aria-label="সার্চ মুছুন"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className={`flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 ${hideScrollbar}`}>
                  {['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setOrderStatusFilter(st)}
                      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap uppercase ${
                        orderStatusFilter === st
                          ? 'bg-[#1F1F24] text-white shadow-xs'
                          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Orders list */}
              <div className="space-y-3 sm:space-y-3.5">
                {filteredOrders.length === 0 ? (
                  <div className="py-14 sm:py-16 text-center text-gray-400 text-xs bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 px-3">
                    <ShoppingBag className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="font-bold text-gray-600 text-sm">কোনো অর্ডার পাওয়া যায়নি</p>
                    <p className="text-gray-400 mt-0.5">নতুন কোনো অর্ডার আসলে এখানে স্বয়ংক্রিয়ভাবে প্রদর্শিত হবে</p>
                  </div>
                ) : (
                  filteredOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-3 sm:p-5 rounded-2xl border border-pink-100 bg-white shadow-xs space-y-3 sm:space-y-3.5 hover:border-pink-300 transition-colors min-w-0"
                    >
                      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-2 min-w-0">
                          <span className="font-mono font-black text-sm text-[#F8628D] bg-pink-50 px-2.5 py-1 rounded-lg">
                            {ord.order_number}
                          </span>
                          <span className="text-xs font-bold text-gray-900 truncate max-w-[180px] sm:max-w-none">
                            {ord.customer_name}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`tel:${ord.phone}`}
                              className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg hover:bg-emerald-100 flex items-center gap-1"
                              title="Call customer"
                            >
                              <Phone className="w-3 h-3 text-emerald-600" />
                              <span>+88 {ord.phone}</span>
                            </a>
                            <a
                              href={`https://wa.me/88${ord.phone.replace(/^0+/, '')}?text=${encodeURIComponent(
                                `আসসালামু আলাইকুম ${ord.customer_name}, LittleHug BD থেকে আপনার অর্ডার (${ord.order_number}) এর বিষয়ে যোগাযোগ করা হয়েছে।`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2 py-1.5 rounded-lg flex items-center gap-1"
                              title="Chat on WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="hidden sm:inline">WhatsApp</span>
                            </a>
                          </div>
                        </div>

                        {/* Status selector & Actions */}
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => setViewInvoiceOrder(ord)}
                            className="px-2.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            title="View / Print Invoice Slip"
                          >
                            <Printer className="w-3.5 h-3.5 text-gray-500" />
                            <span className="hidden sm:inline">চালান / ইনভয়েস</span>
                          </button>

                          <button
                            onClick={() => setOrderToDelete(ord)}
                            className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold flex items-center justify-center cursor-pointer transition-colors"
                            title="Delete Order"
                            aria-label="অর্ডার মুছুন"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          <div className="flex items-center gap-1.5 flex-1 sm:flex-none min-w-[170px]">
                            <span className="hidden sm:inline text-[10px] text-gray-400 font-bold uppercase">
                              Status:
                            </span>
                            <select
                              value={ord.status}
                              onChange={(e) => updateOrderStatus(ord.id, e.target.value as OrderStatus)}
                              className="w-full text-xs font-bold bg-pink-50 border border-pink-200 rounded-xl px-2.5 py-2 text-gray-900 focus:outline-hidden cursor-pointer"
                            >
                              <option value="pending">Pending (অপেক্ষমান)</option>
                              <option value="confirmed">Confirmed (নিশ্চিত)</option>
                              <option value="processing">Processing (প্যাকেজিং)</option>
                              <option value="shipped">Shipped (কুরিয়ারে প্রেরিত)</option>
                              <option value="delivered">Delivered (ডেলিভার্ড)</option>
                              <option value="cancelled">Cancelled (বাতিল)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Details row */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 text-xs text-gray-600">
                        {/* Address */}
                        <div className="space-y-1 bg-gray-50/50 p-2.5 rounded-xl border border-gray-100 min-w-0">
                          <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">
                            ডেলিভারি ঠিকানা:
                          </span>
                          <p className="font-semibold text-gray-800 leading-snug break-words">{ord.address}</p>
                          <span className="inline-block text-[#F8628D] text-[11px] font-bold bg-pink-50 px-2 py-0.5 rounded-md mt-1">
                            📍 {ord.delivery_zone} (ডেলিভারি ফি: ৳{ord.delivery_charge})
                          </span>
                        </div>

                        {/* Items */}
                        <div className="space-y-1 bg-gray-50/50 p-2.5 rounded-xl border border-gray-100 min-w-0">
                          <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">
                            অর্ডারকৃত আইটেম:
                          </span>
                          <div className="space-y-1 max-h-28 overflow-y-auto">
                            {ord.items.map((it, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between items-start gap-2 text-[11px] font-medium py-0.5 border-b border-gray-100 last:border-none"
                              >
                                <span className="min-w-0 break-words">
                                  • {it.product_name} {it.variant ? `(${it.variant})` : ''}
                                </span>
                                <span className="font-mono font-bold text-gray-700 whitespace-nowrap">
                                  ×{it.quantity} = ৳{(it.unit_price * it.quantity).toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Courier & Total */}
                        <div className="space-y-2 bg-gray-50/50 p-2.5 rounded-xl border border-gray-100 flex flex-col justify-between min-w-0">
                          <div>
                            <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">
                              কুরিয়ার ট্র্যাকিং কোড (Pathao/Steadfast):
                            </span>
                            <div className="flex items-center gap-1.5 mt-1">
                              <input
                                type="text"
                                defaultValue={ord.courier_tracking_id || ''}
                                placeholder="e.g. PTH-98214"
                                onBlur={(e) => {
                                  if (e.target.value !== (ord.courier_tracking_id || '')) {
                                    updateOrderStatus(ord.id, ord.status, e.target.value);
                                    showToast('ট্র্যাকিং কোড আপডেট হয়েছে');
                                  }
                                }}
                                className="px-2.5 py-2 sm:py-1 bg-white border border-gray-300 rounded-lg text-base sm:text-xs font-mono w-full focus:outline-hidden focus:ring-1 focus:ring-[#F8628D]"
                              />
                            </div>
                          </div>

                          <div className="pt-2 border-t border-gray-200 flex items-center justify-between gap-2">
                            <div className="text-[10px] text-gray-500">
                              <span>পেমেন্ট: </span>
                              <span className="font-bold text-gray-800">ক্যাশ অন ডেলিভারি (COD)</span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[10px] text-gray-400 block">সর্বমোট</span>
                              <span className="font-mono font-black text-sm sm:text-base text-[#1F1F24]">
                                ৳{ord.total.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB: BANNERS */}
          {activeTab === 'banners' && <BannerManager />}

          {/* TAB: SETTINGS */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSettingsSave} className="space-y-4 sm:space-y-6 max-w-2xl">
              <div className="bg-[#FFF5F8] p-4 sm:p-5 rounded-2xl border border-pink-200 space-y-4">
                <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#F8628D]" />
                  <span>হটলাইন এবং ডেলিভারি কনফিগারেশন</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      WhatsApp নম্বর (Customer Chat)
                    </label>
                    <input
                      type="text"
                      value={settingsForm.whatsapp_number}
                      onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp_number: e.target.value })}
                      className="w-full px-3 py-2.5 sm:py-2 bg-white border border-pink-200 rounded-xl text-base sm:text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">হটলাইন কল নম্বর</label>
                    <input
                      type="text"
                      value={settingsForm.call_number}
                      onChange={(e) => setSettingsForm({ ...settingsForm, call_number: e.target.value })}
                      className="w-full px-3 py-2.5 sm:py-2 bg-white border border-pink-200 rounded-xl text-base sm:text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      ফ্রি ডেলিভারি থ্রেশহোল্ড (৳)
                    </label>
                    <input
                      type="number"
                      value={settingsForm.free_delivery_threshold}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, free_delivery_threshold: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2.5 sm:py-2 bg-white border border-pink-200 rounded-xl text-base sm:text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      এক্সট্রা ৫% ডিসকাউন্ট থ্রেশহোল্ড (৳)
                    </label>
                    <input
                      type="number"
                      value={settingsForm.extra_discount_threshold}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, extra_discount_threshold: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2.5 sm:py-2 bg-white border border-pink-200 rounded-xl text-base sm:text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Flash Sale End Time */}
              <div className="bg-pink-50/50 p-4 sm:p-5 rounded-2xl border border-pink-200 space-y-3">
                <h3 className="text-sm font-black text-gray-900">ফ্ল্যাশ সেলস কাউন্টডাউন শেষ হওয়ার সময়</h3>
                <input
                  type="text"
                  value={settingsForm.flash_sale_end_time}
                  onChange={(e) => setSettingsForm({ ...settingsForm, flash_sale_end_time: e.target.value })}
                  className="w-full px-3 py-2.5 sm:py-2 bg-white border border-pink-200 rounded-xl text-base sm:text-xs font-mono"
                />
                <p className="text-[11px] text-gray-500">
                  ISO Format: যেমন &quot;2026-12-31T23:59:59Z&quot;
                </p>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto py-3 px-6 bg-[#1F1F24] hover:bg-black text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Save className="w-4 h-4" />
                <span>সেটিংস সেভ করুন</span>
              </button>
            </form>
          )}

          {/* TAB: SUPABASE */}
          {activeTab === 'sql' && (
            <div className="space-y-4 sm:space-y-5">
              <div className="p-3 sm:p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-gray-800">Supabase Connection State:</h4>
                  <div className="flex items-start gap-2 mt-1">
                    <span
                      className={`w-2.5 h-2.5 mt-1 rounded-full shrink-0 ${
                        isSupabaseConfigured ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                    <span className="text-xs font-mono font-bold text-gray-700 break-words">
                      {isSupabaseConfigured
                        ? 'Connected to Supabase'
                        : 'Local In-Memory / LocalStorage Mode (Keys not set yet)'}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-gray-500 min-w-0">
                  Admin Email Whitelisted:{' '}
                  <span className="font-mono font-bold text-gray-800 break-all">rifatkhan4054ff@gmail.com</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-bold text-gray-800 break-words">
                    supabase_schema.sql (Copy into Supabase SQL Editor):
                  </span>
                  <button
                    onClick={() => {
                      fetch('/supabase_schema.sql')
                        .then((res) => res.text())
                        .then((sql) => {
                          navigator.clipboard.writeText(sql);
                          showToast('SQL স্কিমা ক্লিপবোর্ডে কপি করা হয়েছে!');
                        })
                        .catch(() => showToast('SQL ফাইল লোড করা যায়নি'));
                    }}
                    className="px-3 py-2 sm:py-1 bg-[#F8628D] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer hover:bg-[#E74B78] shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy SQL Schema</span>
                  </button>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  The file <code className="bg-gray-100 px-1 py-0.5 rounded">/supabase_schema.sql</code> includes
                  profiles, admins, categories, products, product_images, product_variants, banners, orders,
                  order_items, coupons, delivery_zones, site_settings, and full Row Level Security (RLS) policies.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* MODAL 1: Edit Product */}
        {editingProduct && (
          <div className={`${modalOverlay} z-[60]`}>
            <div className={`${modalPanel} sm:max-w-lg`}>
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <div>
                  <h4 className="text-sm font-black text-gray-900">পণ্য সম্পাদনা (Edit Product)</h4>
                  <p className="text-[11px] text-gray-400">পণ্যের বিবরণ ও ক্যাটাগরি আপডেট করুন</p>
                </div>
                <button
                  onClick={() => setEditingProduct(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-700"
                  aria-label="বন্ধ করুন"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="bg-pink-50/60 p-3 rounded-2xl border border-pink-200 space-y-1.5">
                  <label className="font-black text-gray-900 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#F8628D]" />
                    <span>ক্যাটাগরি নির্বাচন করুন (Select Category) *</span>
                  </label>
                  <select
                    value={editingProduct.category_slug || ''}
                    onChange={(e) => {
                      const matched = categories.find((c) => c.slug === e.target.value);
                      setEditingProduct({
                        ...editingProduct,
                        category_slug: e.target.value,
                        category_id: matched?.id || editingProduct.category_id,
                      });
                    }}
                    className="w-full px-3 py-2.5 border border-pink-200 rounded-xl bg-white font-bold text-gray-800 text-base sm:text-xs focus:ring-2 focus:ring-[#F8628D]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.slug}>
                        📁 {c.name} ({c.name_bn}) — [{c.sub_label}]
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">পণ্যের নাম (English) *</label>
                  <input
                    type="text"
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full px-3 py-2.5 border rounded-xl text-base sm:text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">পণ্যের নাম (Bangla)</label>
                  <input
                    type="text"
                    value={editingProduct.name_bn}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name_bn: e.target.value })}
                    className="w-full px-3 py-2.5 border rounded-xl text-base sm:text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">বিক্রয় মূল্য (৳)</label>
                    <input
                      type="number"
                      value={editingProduct.price}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 border rounded-xl font-mono text-base sm:text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">আগের মূল্য (৳)</label>
                    <input
                      type="number"
                      value={editingProduct.old_price}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, old_price: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2.5 border rounded-xl font-mono text-base sm:text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">স্টক (Stock)</label>
                    <input
                      type="number"
                      value={editingProduct.stock}
                      onChange={(e) => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 border rounded-xl font-mono text-base sm:text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">ব্যাজ (Badge)</label>
                    <input
                      type="text"
                      value={editingProduct.badge || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, badge: e.target.value })}
                      className="w-full px-3 py-2.5 border rounded-xl text-base sm:text-xs"
                    />
                  </div>
                </div>

                <ImageUploadField
                  label="পণ্যের ছবি (Upload Image File)"
                  imageUrl={editingProduct.image_url}
                  uploading={isUploadingProductImage}
                  onSelect={(file) => handleProductImageSelect(file, true)}
                />

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700">
                    <input
                      type="checkbox"
                      checked={Boolean(editingProduct.is_flash_sale)}
                      onChange={(e) => setEditingProduct({ ...editingProduct, is_flash_sale: e.target.checked })}
                      className="w-4 h-4 accent-[#F8628D]"
                    />
                    <span>Flash Sale</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700">
                    <input
                      type="checkbox"
                      checked={Boolean(editingProduct.is_hot_deal)}
                      onChange={(e) => setEditingProduct({ ...editingProduct, is_hot_deal: e.target.checked })}
                      className="w-4 h-4 accent-[#F8628D]"
                    />
                    <span>Hot Deal</span>
                  </label>
                </div>
              </div>

              <div className={modalFooter}>
                <button
                  disabled={isUploadingProductImage}
                  onClick={() => {
                    updateProduct(editingProduct);
                    setEditingProduct(null);
                  }}
                  className="flex-1 py-2.5 bg-[#1F1F24] hover:bg-black disabled:opacity-60 text-white font-bold rounded-xl text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>সেভ করুন</span>
                </button>
                <button
                  onClick={() => setEditingProduct(null)}
                  className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  বাতিল
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: Add Product */}
        {isNewProductModalOpen && (
          <div className={`${modalOverlay} z-[60]`}>
            <form onSubmit={handleCreateProduct} className={`${modalPanel} sm:max-w-lg`}>
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <div>
                  <h4 className="text-sm font-black text-gray-900">নতুন পণ্য যুক্ত করুন</h4>
                  <p className="text-[11px] text-gray-400">ক্যাটাগরি নির্ধারণ করে পণ্য ইনভেন্টরিতে যোগ করুন</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNewProductModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-700"
                  aria-label="বন্ধ করুন"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="bg-pink-50/60 p-3 rounded-2xl border border-pink-200 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <label className="font-black text-gray-900 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-[#F8628D]" />
                      <span>ক্যাটাগরি নির্বাচন করুন *</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsNewCategoryModalOpen(true)}
                      className="text-[11px] font-bold text-[#F8628D] hover:underline cursor-pointer"
                    >
                      + নতুন ক্যাটাগরি তৈরি
                    </button>
                  </div>

                  <select
                    value={newProductForm.category_slug || ''}
                    onChange={(e) => {
                      const c = categories.find((cat) => cat.slug === e.target.value);
                      setNewProductForm({
                        ...newProductForm,
                        category_slug: e.target.value,
                        category_id: c?.id,
                      });
                    }}
                    className="w-full px-3 py-2.5 border border-pink-200 rounded-xl bg-white font-bold text-gray-800 text-base sm:text-xs focus:ring-2 focus:ring-[#F8628D]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.slug}>
                        📁 {c.name} ({c.name_bn}) — [{c.sub_label}]
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">পণ্যের নাম (English) *</label>
                  <input
                    type="text"
                    required
                    value={newProductForm.name}
                    onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                    placeholder="e.g. Unicorn Travel Luggage 18 Inch"
                    className="w-full px-3 py-2.5 border rounded-xl text-base sm:text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">পণ্যের নাম (Bangla)</label>
                  <input
                    type="text"
                    value={newProductForm.name_bn}
                    onChange={(e) => setNewProductForm({ ...newProductForm, name_bn: e.target.value })}
                    placeholder="e.g. ইউনিকর্ন ট্রাভেল লাগেজ"
                    className="w-full px-3 py-2.5 border rounded-xl text-base sm:text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">বিক্রয় মূল্য (৳) *</label>
                    <input
                      type="number"
                      required
                      value={newProductForm.price}
                      onChange={(e) => setNewProductForm({ ...newProductForm, price: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 border rounded-xl font-mono text-base sm:text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">আগের মূল্য (৳)</label>
                    <input
                      type="number"
                      value={newProductForm.old_price}
                      onChange={(e) =>
                        setNewProductForm({ ...newProductForm, old_price: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2.5 border rounded-xl font-mono text-base sm:text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">স্টক (Stock) *</label>
                    <input
                      type="number"
                      value={newProductForm.stock}
                      onChange={(e) => setNewProductForm({ ...newProductForm, stock: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 border rounded-xl font-mono text-base sm:text-xs"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">ব্যাজ (Badge)</label>
                    <input
                      type="text"
                      value={newProductForm.badge || ''}
                      onChange={(e) => setNewProductForm({ ...newProductForm, badge: e.target.value })}
                      placeholder="e.g. 50% ছাড়"
                      className="w-full px-3 py-2.5 border rounded-xl text-base sm:text-xs"
                    />
                  </div>
                </div>

                <ImageUploadField
                  label="পণ্যের ছবি (Upload Image File)"
                  imageUrl={newProductForm.image_url}
                  uploading={isUploadingProductImage}
                  onSelect={(file) => handleProductImageSelect(file, false)}
                />

                <div>
                  <label className="font-bold text-gray-700 block mb-1">অথবা তৈরি ছবি বেছে নিন</label>
                  <select
                    value={newProductForm.image_url || ''}
                    onChange={(e) =>
                      setNewProductForm({
                        ...newProductForm,
                        image_url: e.target.value,
                        images: [e.target.value],
                      })
                    }
                    className="w-full px-3 py-2.5 border rounded-xl bg-white text-base sm:text-xs"
                  >
                    {newProductForm.image_url &&
                      !PRESET_IMAGES.some((i) => i.value === newProductForm.image_url) && (
                        <option value={newProductForm.image_url}>আপলোড করা / ক্যাটাগরির ছবি</option>
                      )}
                    {PRESET_IMAGES.map((img) => (
                      <option key={img.value} value={img.value}>
                        {img.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700">
                    <input
                      type="checkbox"
                      checked={Boolean(newProductForm.is_flash_sale)}
                      onChange={(e) => setNewProductForm({ ...newProductForm, is_flash_sale: e.target.checked })}
                      className="w-4 h-4 accent-[#F8628D]"
                    />
                    <span>Flash Sale</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700">
                    <input
                      type="checkbox"
                      checked={Boolean(newProductForm.is_hot_deal)}
                      onChange={(e) => setNewProductForm({ ...newProductForm, is_hot_deal: e.target.checked })}
                      className="w-4 h-4 accent-[#F8628D]"
                    />
                    <span>Hot Deal</span>
                  </label>
                </div>
              </div>

              <div className={modalFooter}>
                <button
                  type="submit"
                  disabled={isUploadingProductImage}
                  className="flex-1 py-2.5 bg-[#F8628D] hover:bg-[#E74B78] disabled:opacity-60 text-white font-bold rounded-xl text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>যুক্ত করুন (Add Product)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewProductModalOpen(false)}
                  className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  বাতিল
                </button>
              </div>
            </form>
          </div>
        )}

        {/* MODAL 3: Create New Category (ছবি আপলোডসহ) */}
        {isNewCategoryModalOpen && (
          <div className={`${modalOverlay} z-[70]`}>
            <form
              onSubmit={handleCreateCategory}
              className={`${modalPanel} sm:max-w-md shadow-2xl border border-pink-100`}
            >
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <FolderPlus className="w-5 h-5 text-[#F8628D]" />
                  <h4 className="text-sm font-black text-gray-900">নতুন ক্যাটাগরি তৈরি করুন</h4>
                </div>
                <button
                  type="button"
                  onClick={closeCategoryModal}
                  className="p-1.5 text-gray-400 hover:text-gray-700"
                  aria-label="বন্ধ করুন"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">ক্যাটাগরির নাম (English) *</label>
                  <input
                    type="text"
                    required
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g. Wooden Toys or Summer Special"
                    className="w-full px-3 py-2.5 border rounded-xl text-base sm:text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">ক্যাটাগরির নাম (Bangla)</label>
                  <input
                    type="text"
                    value={newCategoryNameBn}
                    onChange={(e) => setNewCategoryNameBn(e.target.value)}
                    placeholder="e.g. কাঠের খেলনা"
                    className="w-full px-3 py-2.5 border rounded-xl text-base sm:text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">সাব-লেবেল (Sub Label)</label>
                  <input
                    type="text"
                    value={newCategorySubLabel}
                    onChange={(e) => setNewCategorySubLabel(e.target.value)}
                    placeholder="e.g. Kids, Newborn, Special"
                    className="w-full px-3 py-2.5 border rounded-xl text-base sm:text-xs"
                  />
                </div>

                <ImageUploadField
                  label="ক্যাটাগরির ছবি (কম্পিউটার থেকে আপলোড)"
                  imageUrl={newCategoryImageUrl}
                  uploading={isUploadingCategoryImage}
                  onSelect={handleCategoryImageSelect}
                  onClear={() => setNewCategoryImageUrl('')}
                />

                <div>
                  <label className="font-bold text-gray-700 block mb-1">অথবা ছবির লিঙ্ক (ঐচ্ছিক)</label>
                  <input
                    type="text"
                    value={newCategoryImageUrl}
                    onChange={(e) => setNewCategoryImageUrl(e.target.value)}
                    placeholder="https://... বা /assets/images/..."
                    className="w-full px-3 py-2.5 border rounded-xl text-base sm:text-xs"
                  />
                </div>
              </div>

              <div className={modalFooter}>
                <button
                  type="submit"
                  disabled={isUploadingCategoryImage}
                  className="flex-1 py-2.5 bg-[#F8628D] hover:bg-[#E74B78] disabled:opacity-60 text-white font-bold rounded-xl text-xs cursor-pointer"
                >
                  {isUploadingCategoryImage ? 'ছবি আপলোড হচ্ছে...' : 'ক্যাটাগরি সেভ করুন'}
                </button>
                <button
                  type="button"
                  onClick={closeCategoryModal}
                  className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  বাতিল
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Printable Invoice / Memo Modal */}
      {viewInvoiceOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4">
          <div
            id="invoice-print"
            className="bg-white rounded-t-3xl sm:rounded-3xl p-4 sm:p-8 max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-gray-100 space-y-4 sm:space-y-5 text-gray-800"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🧸</span>
                <div>
                  <h3 className="font-black text-lg text-gray-900 leading-tight">LittleHug BD</h3>
                  <p className="text-[10px] text-gray-500">ছোট্ট আদর, বড় হাসি · Cash on Delivery Memo</p>
                </div>
              </div>
              <button
                onClick={() => setViewInvoiceOrder(null)}
                className="no-print p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
                aria-label="বন্ধ করুন"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Memo Body */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold block">অর্ডার নং:</span>
                  <span className="font-mono font-bold text-[#F8628D] text-sm">{viewInvoiceOrder.order_number}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 font-bold block">তারিখ:</span>
                  <span className="font-mono text-gray-700">
                    {new Date(viewInvoiceOrder.created_at).toLocaleDateString('bn-BD')}
                  </span>
                </div>
              </div>

              {/* Customer */}
              <div className="p-3 bg-pink-50/50 rounded-xl border border-pink-100 space-y-1 break-words">
                <p>
                  <strong className="text-gray-700">গ্রাহকের নাম:</strong> {viewInvoiceOrder.customer_name}
                </p>
                <p>
                  <strong className="text-gray-700">মোবাইল নম্বর:</strong> +88 {viewInvoiceOrder.phone}
                </p>
                <p>
                  <strong className="text-gray-700">ডেলিভারি ঠিকানা:</strong> {viewInvoiceOrder.address} (
                  {viewInvoiceOrder.delivery_zone})
                </p>
              </div>

              {/* Items Table */}
              <div className="border border-gray-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100 text-gray-700 font-bold">
                    <tr>
                      <th className="p-2.5">আইটেম</th>
                      <th className="p-2.5 text-center">পরিমাণ</th>
                      <th className="p-2.5 text-right">মূল্য</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {viewInvoiceOrder.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-medium">
                          {it.product_name} {it.variant ? `(${it.variant})` : ''}
                        </td>
                        <td className="p-2.5 text-center font-mono">{it.quantity}</td>
                        <td className="p-2.5 text-right font-mono font-bold whitespace-nowrap">
                          ৳{(it.unit_price * it.quantity).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financials */}
              <div className="space-y-1 text-right pt-2 border-t border-gray-200">
                <div className="flex justify-between text-gray-600">
                  <span>পণ্যের দাম (Subtotal):</span>
                  <span className="font-mono">৳{viewInvoiceOrder.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>ডেলিভারি চার্জ:</span>
                  <span className="font-mono">৳{viewInvoiceOrder.delivery_charge}</span>
                </div>
                {viewInvoiceOrder.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>ডিসকাউন্ট:</span>
                    <span className="font-mono">-৳{viewInvoiceOrder.discount}</span>
                  </div>
                )}
                <div className="flex justify-between gap-2 text-sm font-black text-gray-900 pt-2 border-t border-gray-200">
                  <span className="text-left">ক্যাশ অন ডেলিভারি (মোট প্রদেয়):</span>
                  <span className="font-mono text-[#F8628D] whitespace-nowrap">
                    ৳{viewInvoiceOrder.total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="no-print flex items-center gap-3 pt-3 border-t border-gray-100">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-[#1F1F24] hover:bg-black text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>প্রিন্ট মেমো / চালান</span>
              </button>
              <button
                onClick={() => setViewInvoiceOrder(null)}
                className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Delete Confirmation Popup */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-red-100 text-center space-y-4">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600 mb-2">
              <Trash2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-gray-900">ক্যাটাগরি মুছে ফেলতে চান?</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              ক্যাটাগরি{' '}
              <span className="font-bold text-[#F8628D]">&quot;{categoryToDelete.name}&quot;</span> স্থায়ীভাবে মুছে
              ফেলা হবে। এই কাজটি আর ফিরিয়ে আনা যাবে না।
            </p>
            {(() => {
              const inCat = products.filter(
                (p) =>
                  p.category_slug === categoryToDelete.slug || p.category_id === categoryToDelete.id
              ).length;
              return inCat > 0 ? (
                <p className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  ⚠️ এই ক্যাটাগরিতে {inCat} টি পণ্য আছে। মোছার আগে পণ্যগুলো অন্য ক্যাটাগরিতে সরিয়ে নিন।
                </p>
              ) : null;
            })()}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isDeletingCategory}
                onClick={() => setCategoryToDelete(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-60 text-gray-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                বাতিল (Cancel)
              </button>
              <button
                type="button"
                disabled={isDeletingCategory}
                onClick={confirmDeleteCategory}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-md flex items-center justify-center gap-1.5"
              >
                {isDeletingCategory ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>মুছছে...</span>
                  </>
                ) : (
                  <span>হ্যাঁ, মুছে ফেলুন</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-red-100 text-center space-y-4">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600 mb-2">
              <Trash2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-gray-900">অর্ডার মুছে ফেলতে চান?</h3>
            <p className="text-xs text-gray-600">
              অর্ডার নম্বর{' '}
              <span className="font-mono font-bold text-[#F8628D]">{orderToDelete.order_number}</span> (
              {orderToDelete.customer_name}) স্থায়ীভাবে মুছে ফেলা হবে। এই কাজটি আর ফিরিয়ে আনা যাবে না।
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                বাতিল (Cancel)
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteOrder(orderToDelete.id);
                  setOrderToDelete(null);
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-md"
              >
                হ্যাঁ, মুছে ফেলুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};