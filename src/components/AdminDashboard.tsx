import React, { useState } from 'react';
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
  Calendar,
  Truck,
  UserCheck,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { OrderStatus, Product, Order } from '../types';
import { isSupabaseConfigured, uploadImageToSupabase } from '../lib/supabase';

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
    settings,
    updateSettings,
    user,
    logout,
    showToast,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'settings' | 'sql'>('orders');

  // Orders filter & search
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [viewInvoiceOrder, setViewInvoiceOrder] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  // Products Tab: Category filter & Search
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');
  const [productSearchQuery, setProductSearchQuery] = useState('');

  // Product editing modal state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);

  // New Category Form State
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryNameBn, setNewCategoryNameBn] = useState('');
  const [newCategorySubLabel, setNewCategorySubLabel] = useState('');

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
    image_url: '/src/assets/images/gift_box_pink_teddy_1792050433788.jpg',
    images: ['/src/assets/images/gift_box_pink_teddy_1792050433788.jpg'],
    description: 'প্রিমিয়াম কোয়ালিটির বেবি গিফট বক্স',
  });

  // Settings form state
  const [settingsForm, setSettingsForm] = useState(settings);

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

  const totalRevenue = orders.reduce(
    (sum, o) => (o.status !== 'cancelled' ? sum + o.total : sum),
    0
  );
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      showToast('ছবি আপলোড হচ্ছে...');
      const url = await uploadImageToSupabase(file);
      if (isEdit && editingProduct) {
        setEditingProduct({
          ...editingProduct,
          image_url: url,
          images: [url, ...(editingProduct.images || [])],
        });
      } else {
        setNewProductForm({
          ...newProductForm,
          image_url: url,
          images: [url, ...(newProductForm.images || [])],
        });
      }
      showToast('✓ ছবি সফলভাবে আপলোড হয়েছে!');
    } catch (err) {
      console.error('Image upload failed:', err);
      showToast('ছবি আপলোড ব্যর্থ হয়েছে');
    }
  };

  const handleSettingsSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(settingsForm);
  };

  const handleOpenAddProduct = () => {
    // If admin is currently filtering by a specific category, pre-select it
    const activeCat =
      productCategoryFilter !== 'all'
        ? categories.find((c) => c.slug === productCategoryFilter || c.id === productCategoryFilter)
        : categories[0];

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
      image_url: activeCat?.image_url || '/src/assets/images/gift_box_pink_teddy_1792050433788.jpg',
      images: [activeCat?.image_url || '/src/assets/images/gift_box_pink_teddy_1792050433788.jpg'],
      description: 'প্রিমিয়াম কোয়ালিটির বেবি গিফট বক্স',
    });
    setIsNewProductModalOpen(true);
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductForm.name) return;

    const matchedCat = categories.find(
      (c) => c.id === newProductForm.category_id || c.slug === newProductForm.category_slug
    );

    addProduct({
      name: newProductForm.name,
      name_bn: newProductForm.name_bn || newProductForm.name,
      slug: (newProductForm.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category_id: matchedCat?.id || categories[0]?.id || 'cat-1',
      category_slug: matchedCat?.slug || categories[0]?.slug || 'baby-gift-box',
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
      image_url:
        newProductForm.image_url || '/src/assets/images/gift_box_pink_teddy_1792050433788.jpg',
      images: [
        newProductForm.image_url || '/src/assets/images/gift_box_pink_teddy_1792050433788.jpg',
      ],
      description: newProductForm.description || '',
    });
    setIsNewProductModalOpen(false);
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    const slug = newCategoryName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
    addCategory({
      name: newCategoryName.trim(),
      name_bn: newCategoryNameBn.trim() || newCategoryName.trim(),
      slug,
      image_url: '/src/assets/images/gift_box_pink_teddy_1792050433788.jpg',
      sub_label: newCategorySubLabel.trim() || 'New Collection',
      sort_order: categories.length + 1,
      is_active: true,
    });

    setNewCategoryName('');
    setNewCategoryNameBn('');
    setNewCategorySubLabel('');
    setIsNewCategoryModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#1F1F24] text-white border-b border-gray-800 shadow-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#F8628D] to-[#FF86A8] flex items-center justify-center text-white font-bold text-xl shadow-xs">
            🧸
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
                LittleHug BD Admin Portal
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Database Verified
              </span>
            </div>
            <p className="text-[11px] text-gray-400 font-mono">
              Logged in as: <span className="text-gray-200 font-bold">{user?.email || 'Admin'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={closeAdminDashboard}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            title="Return to customer store view"
          >
            <ArrowLeft className="w-4 h-4 text-[#F8628D]" />
            <span className="hidden sm:inline">স্টোরে ফিরে যান (View Store)</span>
            <span className="sm:hidden">Store</span>
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">লগআউট</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between bg-white p-2 rounded-2xl border border-gray-200/80 shadow-xs overflow-x-auto no-scrollbar gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'orders'
                  ? 'bg-[#1F1F24] text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-[#F8628D]" />
              <span>Orders (অর্ডার সমূহ)</span>
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#F8628D] text-white font-mono font-bold">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'products'
                  ? 'bg-[#1F1F24] text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Package className="w-4 h-4 text-[#F8628D]" />
              <span>Products & Inventory ({products.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'bg-[#1F1F24] text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Sliders className="w-4 h-4 text-[#F8628D]" />
              <span>Store Settings & Delivery</span>
            </button>

            <button
              onClick={() => setActiveTab('sql')}
              className={`px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'sql'
                  ? 'bg-[#1F1F24] text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Database className="w-4 h-4 text-[#F8628D]" />
              <span>Supabase Status</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-7 shadow-xs">
          {/* TAB 1: PRODUCTS & CATEGORIES */}
          {activeTab === 'products' && (
            <div className="space-y-5">
              {/* Top Controls: Search, New Category, Add Product */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-pink-100">
                <div className="flex items-center gap-2 flex-1 max-w-sm">
                  <input
                    type="text"
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    placeholder="পণ্য খুঁজুন (Search by name)..."
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-[#F8628D]"
                  />
                  {productSearchQuery && (
                    <button
                      onClick={() => setProductSearchQuery('')}
                      className="text-gray-400 hover:text-gray-600 text-xs font-bold px-2 py-1"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {/* Create New Category Button */}
                  <button
                    onClick={() => setIsNewCategoryModalOpen(true)}
                    className="px-3.5 py-2 bg-white border border-pink-200 hover:bg-pink-50 text-[#F8628D] text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                  >
                    <FolderPlus className="w-4 h-4" />
                    <span>নতুন ক্যাটাগরি তৈরি করুন</span>
                  </button>

                  {/* Add Product Button */}
                  <button
                    onClick={handleOpenAddProduct}
                    className="px-4 py-2 bg-[#F8628D] hover:bg-[#E74B78] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>নতুন পণ্য যোগ করুন</span>
                  </button>
                </div>
              </div>

              {/* Category Filter Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-gray-500 font-bold">
                  <span>ক্যাটাগরি অনুযায়ী ফিল্টার করুন:</span>
                  <span className="text-[11px] text-[#F8628D]">
                    {filteredProducts.length} টি পণ্য প্রদর্শিত হচ্ছে
                  </span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                  <button
                    onClick={() => setProductCategoryFilter('all')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
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
                      <button
                        key={c.id}
                        onClick={() => setProductCategoryFilter(c.slug)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-[#F8628D] text-white shadow-xs'
                            : 'bg-pink-50 text-gray-700 hover:bg-pink-100 border border-pink-200'
                        }`}
                      >
                        <span>{c.name}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-white text-gray-600'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Product list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredProducts.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-gray-400 space-y-2">
                    <span className="text-3xl block">📦</span>
                    <p className="text-xs font-bold text-gray-600">
                      এই ক্যাটাগরিতে কোনো পণ্য নেই
                    </p>
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
                        className="p-3 rounded-2xl border border-pink-100 bg-white flex gap-3 shadow-2xs hover:border-pink-300 transition-colors"
                      >
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="w-16 h-16 object-cover rounded-xl border border-pink-50 bg-pink-50/20 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            {/* Category Tag */}
                            <span className="inline-block text-[10px] font-bold text-[#F8628D] bg-pink-50 px-2 py-0.5 rounded-md mb-1 max-w-full truncate">
                              📁 {productCategory?.name || 'Category'}
                            </span>
                            <h4 className="text-xs font-bold text-gray-900 truncate">
                              {p.name}
                            </h4>
                            <span className="text-[11px] text-gray-400 block font-sans truncate">
                              {p.name_bn}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="font-mono font-bold text-xs text-[#F8628D]">
                                ৳{p.price}
                              </span>
                              <span className="text-[10px] text-gray-400">Stock: {p.stock}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-1">
                            <button
                              onClick={() => setEditingProduct(p)}
                              className="text-[11px] font-bold text-gray-700 hover:text-[#F8628D] flex items-center gap-1 cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>এডিট করুন</span>
                            </button>
                            <button
                              onClick={() => deleteProduct(p.id)}
                              className="text-gray-400 hover:text-red-500 p-1 cursor-pointer"
                              title="Delete Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

          {/* TAB 2: ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              {/* Stats overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-pink-50/50 border border-pink-100">
                  <span className="text-[11px] font-bold text-gray-500 uppercase block">
                    Total Orders
                  </span>
                  <span className="text-2xl font-black text-gray-900 font-mono">
                    {orders.length}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                  <span className="text-[11px] font-bold text-emerald-600 uppercase block">
                    Total Revenue
                  </span>
                  <span className="text-2xl font-black text-emerald-800 font-mono">
                    ৳{totalRevenue.toLocaleString()}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100">
                  <span className="text-[11px] font-bold text-amber-600 uppercase block">
                    Pending Delivery
                  </span>
                  <span className="text-2xl font-black text-amber-800 font-mono">
                    {pendingCount}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-sky-50/50 border border-sky-100">
                  <span className="text-[11px] font-bold text-sky-600 uppercase block">
                    Delivered Orders
                  </span>
                  <span className="text-2xl font-black text-sky-800 font-mono">
                    {deliveredCount}
                  </span>
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-pink-50/40 p-3.5 rounded-2xl border border-pink-100">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    placeholder="অর্ডার খুঁজুন (নাম, মোবাইল নম্বর বা LH-1001)..."
                    className="w-full pl-9 pr-8 py-2 bg-white border border-pink-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-[#F8628D]"
                  />
                  {orderSearchQuery && (
                    <button
                      onClick={() => setOrderSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                  {['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(
                    (st) => (
                      <button
                        key={st}
                        onClick={() => setOrderStatusFilter(st)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap uppercase ${
                          orderStatusFilter === st
                            ? 'bg-[#1F1F24] text-white shadow-xs'
                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        {st}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Orders Table */}
              <div className="space-y-3.5">
                {filteredOrders.length === 0 ? (
                  <div className="py-16 text-center text-gray-400 text-xs bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                    <ShoppingBag className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="font-bold text-gray-600 text-sm">কোনো অর্ডার পাওয়া যায়নি</p>
                    <p className="text-gray-400 mt-0.5">নতুন কোনো অর্ডার আসলে এখানে স্বয়ংক্রিয়ভাবে প্রদর্শিত হবে</p>
                  </div>
                ) : (
                  filteredOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-4 sm:p-5 rounded-2xl border border-pink-100 bg-white shadow-xs space-y-3.5 hover:border-pink-300 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-gray-100">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-black text-sm text-[#F8628D] bg-pink-50 px-2.5 py-1 rounded-lg">
                            {ord.order_number}
                          </span>
                          <span className="text-xs text-gray-300">·</span>
                          <span className="text-xs font-bold text-gray-900">
                            {ord.customer_name}
                          </span>
                          <span className="text-xs text-gray-300">·</span>
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`tel:${ord.phone}`}
                              className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg hover:bg-emerald-100 flex items-center gap-1"
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
                              className="text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg flex items-center gap-1"
                              title="Chat on WhatsApp"
                            >
                              <MessageCircle className="w-3 h-3 text-emerald-600" />
                              <span className="hidden sm:inline">WhatsApp</span>
                            </a>
                          </div>
                        </div>

                        {/* Status selector & Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setViewInvoiceOrder(ord)}
                            className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            title="View / Print Invoice Slip"
                          >
                            <Printer className="w-3.5 h-3.5 text-gray-500" />
                            <span className="hidden sm:inline">চালান / ইনভয়েস</span>
                          </button>

                          <button
                            onClick={() => setOrderToDelete(ord)}
                            className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold flex items-center justify-center cursor-pointer transition-colors"
                            title="Delete Order"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-gray-400 font-bold uppercase">
                              Status:
                            </span>
                            <select
                              value={ord.status}
                              onChange={(e) => updateOrderStatus(ord.id, e.target.value as OrderStatus)}
                              className="text-xs font-bold bg-pink-50 border border-pink-200 rounded-xl px-2.5 py-1.5 text-gray-900 focus:outline-hidden cursor-pointer"
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
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-gray-600">
                        {/* Address */}
                        <div className="space-y-1 bg-gray-50/50 p-2.5 rounded-xl border border-gray-100">
                          <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">ডেলিভারি ঠিকানা:</span>
                          <p className="font-semibold text-gray-800 leading-snug">{ord.address}</p>
                          <span className="inline-block text-[#F8628D] text-[11px] font-bold bg-pink-50 px-2 py-0.5 rounded-md mt-1">
                            📍 {ord.delivery_zone} (ডেলিভারি ফি: ৳{ord.delivery_charge})
                          </span>
                        </div>

                        {/* Items */}
                        <div className="space-y-1 bg-gray-50/50 p-2.5 rounded-xl border border-gray-100">
                          <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">অর্ডারকৃত আইটেম:</span>
                          <div className="space-y-1 max-h-24 overflow-y-auto no-scrollbar">
                            {ord.items.map((it, idx) => (
                              <div key={idx} className="flex justify-between items-center text-[11px] font-medium py-0.5 border-b border-gray-100 last:border-none">
                                <span className="truncate pr-2">
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
                        <div className="space-y-2 bg-gray-50/50 p-2.5 rounded-xl border border-gray-100 flex flex-col justify-between">
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
                                  updateOrderStatus(ord.id, ord.status, e.target.value);
                                  showToast('ট্র্যাকিং কোড আপডেট হয়েছে');
                                }}
                                className="px-2.5 py-1 bg-white border border-gray-300 rounded-lg text-xs font-mono w-full focus:outline-hidden focus:ring-1 focus:ring-[#F8628D]"
                              />
                            </div>
                          </div>

                          <div className="pt-2 border-t border-gray-200 flex items-center justify-between">
                            <div className="text-[10px] text-gray-500">
                              <span>পেমেন্ট: </span>
                              <span className="font-bold text-gray-800">ক্যাশ অন ডেলিভারি (COD)</span>
                            </div>
                            <div className="text-right">
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

          {/* TAB 3: SETTINGS & FLASH SALE */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSettingsSave} className="space-y-6 max-w-2xl">
              <div className="bg-[#FFF5F8] p-5 rounded-2xl border border-pink-200 space-y-4">
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
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, whatsapp_number: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-white border border-pink-200 rounded-xl text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      হটলাইন কল নম্বর
                    </label>
                    <input
                      type="text"
                      value={settingsForm.call_number}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, call_number: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-white border border-pink-200 rounded-xl text-xs font-mono"
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
                        setSettingsForm({
                          ...settingsForm,
                          free_delivery_threshold: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-pink-200 rounded-xl text-xs font-mono"
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
                        setSettingsForm({
                          ...settingsForm,
                          extra_discount_threshold: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-pink-200 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Flash Sale End Time */}
              <div className="bg-pink-50/50 p-5 rounded-2xl border border-pink-200 space-y-3">
                <h3 className="text-sm font-black text-gray-900">
                  ফ্ল্যাশ সেলস কাউন্টডাউন শেষ হওয়ার সময়
                </h3>
                <input
                  type="text"
                  value={settingsForm.flash_sale_end_time}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, flash_sale_end_time: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white border border-pink-200 rounded-xl text-xs font-mono"
                />
                <p className="text-[11px] text-gray-500">
                  ISO Format: যেমন &quot;2026-12-31T23:59:59Z&quot;
                </p>
              </div>

              <button
                type="submit"
                className="py-3 px-6 bg-[#1F1F24] hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Save className="w-4 h-4" />
                <span>সেটিংস সেভ করুন</span>
              </button>
            </form>
          )}

          {/* TAB 4: SUPABASE SQL & STATUS */}
          {activeTab === 'sql' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-gray-800">Supabase Connection State:</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isSupabaseConfigured ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                    <span className="text-xs font-mono font-bold text-gray-700">
                      {isSupabaseConfigured
                        ? 'Connected to Supabase'
                        : 'Local In-Memory / LocalStorage Mode (Keys not set yet)'}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-gray-500">
                  Admin Email Whitelisted:{' '}
                  <span className="font-mono font-bold text-gray-800">
                    rifatkhan4054ff@gmail.com
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800">
                    supabase_schema.sql (Copy into Supabase SQL Editor):
                  </span>
                  <button
                    onClick={() => {
                      fetch('/supabase_schema.sql')
                        .then((res) => res.text())
                        .then((sql) => {
                          navigator.clipboard.writeText(sql);
                          showToast('SQL স্কিমা ক্লিপবোর্ডে কপি করা হয়েছে!');
                        });
                    }}
                    className="px-3 py-1 bg-[#F8628D] text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer hover:bg-[#E74B78]"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy SQL Schema</span>
                  </button>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  The file <code className="bg-gray-100 px-1 py-0.5 rounded">/supabase_schema.sql</code> includes profiles, admins, categories, products, product_images, product_variants, banners, orders, order_items, coupons, delivery_zones, site_settings, and full Row Level Security (RLS) policies.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* MODAL 1: Edit Product Modal (With Category Selector!) */}
        {editingProduct && (
          <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <div>
                  <h4 className="text-sm font-black text-gray-900">
                    পণ্য সম্পাদনা (Edit Product)
                  </h4>
                  <p className="text-[11px] text-gray-400">
                    পণ্যের বিবরণ ও ক্যাটাগরি আপডেট করুন
                  </p>
                </div>
                <button
                  onClick={() => setEditingProduct(null)}
                  className="text-gray-400 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                {/* Category Selection in Edit Mode */}
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
                    className="w-full px-3 py-2 border border-pink-200 rounded-xl bg-white font-bold text-gray-800 text-xs focus:ring-2 focus:ring-[#F8628D]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.slug}>
                        📁 {c.name} ({c.name_bn}) — [{c.sub_label}]
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    পণ্যের নাম (English) *
                  </label>
                  <input
                    type="text"
                    value={editingProduct.name}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    পণ্যের নাম (Bangla)
                  </label>
                  <input
                    type="text"
                    value={editingProduct.name_bn}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, name_bn: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">বিক্রয় মূল্য (৳)</label>
                    <input
                      type="number"
                      value={editingProduct.price}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, price: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 border rounded-xl font-mono"
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
                      className="w-full px-3 py-2 border rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">স্টক (Stock)</label>
                    <input
                      type="number"
                      value={editingProduct.stock}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 border rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">ব্যাজ (Badge)</label>
                    <input
                      type="text"
                      value={editingProduct.badge || ''}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, badge: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    ছবি আপলোড করুন (Upload Image File)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, true)}
                    className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-pink-50 file:text-[#F8628D] hover:file:bg-pink-100 cursor-pointer border border-pink-200 rounded-xl p-1 bg-pink-50/30"
                  />
                  {editingProduct.image_url && (
                    <p className="text-[10px] text-gray-400 mt-1 truncate">Current: {editingProduct.image_url}</p>
                  )}
                </div>

                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700">
                    <input
                      type="checkbox"
                      checked={editingProduct.is_flash_sale}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, is_flash_sale: e.target.checked })
                      }
                      className="w-4 h-4 accent-[#F8628D]"
                    />
                    <span>Flash Sale</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700">
                    <input
                      type="checkbox"
                      checked={editingProduct.is_hot_deal}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, is_hot_deal: e.target.checked })
                      }
                      className="w-4 h-4 accent-[#F8628D]"
                    />
                    <span>Hot Deal</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => {
                    updateProduct(editingProduct);
                    setEditingProduct(null);
                  }}
                  className="flex-1 py-2.5 bg-[#1F1F24] hover:bg-black text-white font-bold rounded-xl text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
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

        {/* MODAL 2: Add Product Modal (With Category Selector!) */}
        {isNewProductModalOpen && (
          <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4">
            <form
              onSubmit={handleCreateProduct}
              className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <div>
                  <h4 className="text-sm font-black text-gray-900">নতুন পণ্য যুক্ত করুন</h4>
                  <p className="text-[11px] text-gray-400">
                    ক্যাটাগরি নির্ধারণ করে পণ্য ইনভেন্টরিতে যোগ করুন
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNewProductModalOpen(false)}
                  className="text-gray-400 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                {/* Category Selection Area */}
                <div className="bg-pink-50/60 p-3 rounded-2xl border border-pink-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-black text-gray-900 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-[#F8628D]" />
                      <span>ক্যাটাগরি নির্বাচন করুন (Select Category) *</span>
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
                    value={newProductForm.category_slug}
                    onChange={(e) => {
                      const c = categories.find((cat) => cat.slug === e.target.value);
                      setNewProductForm({
                        ...newProductForm,
                        category_slug: e.target.value,
                        category_id: c?.id,
                      });
                    }}
                    className="w-full px-3 py-2.5 border border-pink-200 rounded-xl bg-white font-bold text-gray-800 text-xs focus:ring-2 focus:ring-[#F8628D]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.slug}>
                        📁 {c.name} ({c.name_bn}) — [{c.sub_label}]
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    পণ্যের নাম (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newProductForm.name}
                    onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                    placeholder="e.g. Unicorn Travel Luggage 18 Inch"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">পণ্যের নাম (Bangla)</label>
                  <input
                    type="text"
                    value={newProductForm.name_bn}
                    onChange={(e) =>
                      setNewProductForm({ ...newProductForm, name_bn: e.target.value })
                    }
                    placeholder="e.g. ইউনিকর্ন ট্রাভেল লাগেজ"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">বিক্রয় মূল্য (৳) *</label>
                    <input
                      type="number"
                      required
                      value={newProductForm.price}
                      onChange={(e) =>
                        setNewProductForm({ ...newProductForm, price: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 border rounded-xl font-mono"
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
                      className="w-full px-3 py-2 border rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">স্টক (Stock) *</label>
                    <input
                      type="number"
                      value={newProductForm.stock}
                      onChange={(e) =>
                        setNewProductForm({ ...newProductForm, stock: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 border rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">ব্যাজ (Badge)</label>
                    <input
                      type="text"
                      value={newProductForm.badge || ''}
                      onChange={(e) =>
                        setNewProductForm({ ...newProductForm, badge: e.target.value })
                      }
                      placeholder="e.g. 50% ছাড়"
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    ছবি আপলোড করুন (Upload Image File)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, false)}
                    className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-pink-50 file:text-[#F8628D] hover:file:bg-pink-100 cursor-pointer border border-pink-200 rounded-xl p-1 bg-pink-50/30 mb-2"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">ছবির লিঙ্ক (Image)</label>
                  <select
                    value={newProductForm.image_url}
                    onChange={(e) =>
                      setNewProductForm({ ...newProductForm, image_url: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-xl bg-white"
                  >
                    <option value="/src/assets/images/gift_box_pink_teddy_1792050433788.jpg">
                      Pink Teddy Gift Box
                    </option>
                    <option value="/src/assets/images/gift_box_mint_bear_1792050466062.jpg">
                      Mint Bear Gift Box
                    </option>
                    <option value="/src/assets/images/gift_box_yellow_sunshine_1792050506416.jpg">
                      Sunshine Yellow Gift Box
                    </option>
                    <option value="/src/assets/images/rescue_toy_truck_set_1792050432743.jpg">
                      Rescue Toy Truck Set
                    </option>
                    <option value="/src/assets/images/luggage_unicorn_kids_1792050431878.jpg">
                      Unicorn Travel Luggage
                    </option>
                    <option value="/src/assets/images/luggage_astronaut_kids_1792050465126.jpg">
                      Astronaut Travel Luggage
                    </option>
                    <option value="/src/assets/images/luggage_bunny_pink_1792050506373.jpg">
                      Bunny Pink Luggage
                    </option>
                    <option value="/src/assets/images/luggage_dinosaur_kids_1792050467536.jpg">
                      Dinosaur Green Luggage
                    </option>
                  </select>
                </div>

                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700">
                    <input
                      type="checkbox"
                      checked={newProductForm.is_flash_sale}
                      onChange={(e) =>
                        setNewProductForm({ ...newProductForm, is_flash_sale: e.target.checked })
                      }
                      className="w-4 h-4 accent-[#F8628D]"
                    />
                    <span>Flash Sale</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700">
                    <input
                      type="checkbox"
                      checked={newProductForm.is_hot_deal}
                      onChange={(e) =>
                        setNewProductForm({ ...newProductForm, is_hot_deal: e.target.checked })
                      }
                      className="w-4 h-4 accent-[#F8628D]"
                    />
                    <span>Hot Deal</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#F8628D] hover:bg-[#E74B78] text-white font-bold rounded-xl text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
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

        {/* MODAL 3: Create New Category Modal */}
        {isNewCategoryModalOpen && (
          <div className="fixed inset-0 z-70 bg-black/50 flex items-center justify-center p-4">
            <form
              onSubmit={handleCreateCategory}
              className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-pink-100"
            >
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <FolderPlus className="w-5 h-5 text-[#F8628D]" />
                  <h4 className="text-sm font-black text-gray-900">
                    নতুন ক্যাটাগরি তৈরি করুন
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNewCategoryModalOpen(false)}
                  className="text-gray-400 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    ক্যাটাগরির নাম (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g. Wooden Toys or Summer Special"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    ক্যাটাগরির নাম (Bangla)
                  </label>
                  <input
                    type="text"
                    value={newCategoryNameBn}
                    onChange={(e) => setNewCategoryNameBn(e.target.value)}
                    placeholder="e.g. কাঠের খেলনা"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    সাব-লেবেল (Sub Label)
                  </label>
                  <input
                    type="text"
                    value={newCategorySubLabel}
                    onChange={(e) => setNewCategorySubLabel(e.target.value)}
                    placeholder="e.g. Kids, Newborn, Special"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#F8628D] hover:bg-[#E74B78] text-white font-bold rounded-xl text-xs cursor-pointer"
                >
                  ক্যাটাগরি সেভ করুন
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewCategoryModalOpen(false)}
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-gray-100 space-y-5 text-gray-800">
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
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Memo Body */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold block">অর্ডার নং:</span>
                  <span className="font-mono font-bold text-[#F8628D] text-sm">{viewInvoiceOrder.order_number}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 font-bold block">তারিখ:</span>
                  <span className="font-mono text-gray-700">{new Date(viewInvoiceOrder.created_at).toLocaleDateString('bn-BD')}</span>
                </div>
              </div>

              {/* Customer */}
              <div className="p-3 bg-pink-50/50 rounded-xl border border-pink-100 space-y-1">
                <p><strong className="text-gray-700">গ্রাহকের নাম:</strong> {viewInvoiceOrder.customer_name}</p>
                <p><strong className="text-gray-700">মোবাইল নম্বর:</strong> +88 {viewInvoiceOrder.phone}</p>
                <p><strong className="text-gray-700">ডেলিভারি ঠিকানা:</strong> {viewInvoiceOrder.address} ({viewInvoiceOrder.delivery_zone})</p>
              </div>

              {/* Items Table */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
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
                        <td className="p-2.5 font-medium">{it.product_name} {it.variant ? `(${it.variant})` : ''}</td>
                        <td className="p-2.5 text-center font-mono">{it.quantity}</td>
                        <td className="p-2.5 text-right font-mono font-bold">৳{(it.unit_price * it.quantity).toLocaleString()}</td>
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
                <div className="flex justify-between text-sm font-black text-gray-900 pt-2 border-t border-gray-200">
                  <span>ক্যাশ অন ডেলিভারি (মোট প্রদেয়):</span>
                  <span className="font-mono text-[#F8628D]">৳{viewInvoiceOrder.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
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

      {/* Delete Confirmation Modal Popup */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-red-100 text-center space-y-4">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600 mb-2">
              <Trash2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-gray-900">অর্ডার মুছে ফেলতে চান?</h3>
            <p className="text-xs text-gray-600">
              অর্ডার নম্বর <span className="font-mono font-bold text-[#F8628D]">{orderToDelete.order_number}</span> ({orderToDelete.customer_name}) স্থায়ীভাবে মুছে ফেলা হবে। এই কাজটি আর ফিরিয়ে আনা যাবে না।
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
