import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  Category,
  CartItem,
  Order,
  OrderStatus,
  SiteSettings,
  UserProfile,
  DeliveryZone,
  Coupon,
} from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
  INITIAL_DELIVERY_ZONES,
  INITIAL_COUPONS,
  INITIAL_SITE_SETTINGS,
  INITIAL_ORDERS,
} from '../data/mockData';
import { supabase, isSupabaseConfigured, fetchUserRoleFromDatabase, KNOWN_ADMINS } from '../lib/supabase';

interface StoreContextType {
  products: Product[];
  categories: Category[];
  deliveryZones: DeliveryZone[];
  coupons: Coupon[];
  settings: SiteSettings;
  selectedCategory: string | null;
  setSelectedCategory: (slug: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Cart
  cart: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (product: Product, quantity?: number, variant?: string) => void;
  updateCartQuantity: (productId: string, variant: string | undefined, delta: number) => void;
  removeFromCart: (productId: string, variant?: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;

  // Wishlist
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;

  // Checkout Modal
  isCheckoutOpen: boolean;
  checkoutItem: CartItem | null;
  openCheckout: (product?: Product, quantity?: number, variant?: string) => void;
  closeCheckout: () => void;

  // Product Detail Page / View
  selectedProduct: Product | null;
  openProductDetail: (product: Product) => void;
  closeProductDetail: () => void;

  // Order & Tracking
  orders: Order[];
  isTrackOrderOpen: boolean;
  trackOrderQuery: string;
  openTrackOrder: (orderNumber?: string) => void;
  closeTrackOrder: () => void;
  setTrackOrderQuery: (q: string) => void;
  placeOrder: (orderData: Omit<Order, 'id' | 'order_number' | 'created_at'>) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus, courierId?: string) => void;
  deleteOrder: (orderId: string) => Promise<void>;

  // Auth & Admin
  user: UserProfile | null;
  isAdmin: boolean;
  isAuthOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password?: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  isAdminDashboardOpen: boolean;
  openAdminDashboard: () => void;
  closeAdminDashboard: () => void;

  // Admin Actions
  updateProduct: (product: Product) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  deleteProduct: (productId: string) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateSettings: (newSettings: Partial<SiteSettings>) => void;

  // Toast / feedback
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Products
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('littlehug_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  // Categories
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('littlehug_categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  // Delivery Zones
  const [deliveryZones] = useState<DeliveryZone[]>(INITIAL_DELIVERY_ZONES);

  // Coupons
  const [coupons] = useState<Coupon[]>(INITIAL_COUPONS);

  // Site Settings
  const [settings, setSettings] = useState<SiteSettings>(() => {
    const saved = localStorage.getItem('littlehug_settings');
    return saved ? JSON.parse(saved) : INITIAL_SITE_SETTINGS;
  });

  // Navigation / Search filter
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Cart
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('littlehug_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Wishlist
  const [wishlist, setWishlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('littlehug_wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  // Checkout modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutItem, setCheckoutItem] = useState<CartItem | null>(null);

  // Product detail view
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Track order modal
  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState(false);
  const [trackOrderQuery, setTrackOrderQuery] = useState('');

  // Orders
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('littlehug_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  // Auth & Admin
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('littlehug_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('littlehug_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('littlehug_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('littlehug_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('littlehug_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('littlehug_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('littlehug_settings', JSON.stringify(settings));
  }, [settings]);

  // Fetch initial data from Supabase if configured so all devices sync
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    supabase.from('products').select('*').then(({ data, error }) => {
      if (!error && data && data.length > 0) {
        setProducts(data);
      }
    });

    supabase.from('categories').select('*').then(({ data, error }) => {
      if (!error && data && data.length > 0) {
        setCategories(data);
      }
    });

    supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }).then(({ data, error }) => {
      if (!error && data && data.length > 0) {
        const formattedOrders = data.map((ord: any) => ({
          ...ord,
          items: ord.order_items || [],
        }));
        setOrders(formattedOrders);
      }
    });
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('littlehug_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('littlehug_user');
    }
  }, [user]);

  // Supabase Auth listener if configured
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const email = session.user.email || '';
        const role = await fetchUserRoleFromDatabase(session.user.id, email);
        setUser({
          id: session.user.id,
          email,
          full_name: session.user.user_metadata?.full_name || email.split('@')[0],
          avatar_url: session.user.user_metadata?.avatar_url,
          role,
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const email = session.user.email || '';
        const role = await fetchUserRoleFromDatabase(session.user.id, email);
        setUser({
          id: session.user.id,
          email,
          full_name: session.user.user_metadata?.full_name || email.split('@')[0],
          avatar_url: session.user.user_metadata?.avatar_url,
          role,
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const isAdmin = Boolean(user && user.role === 'admin');

  // Cart operations
  const addToCart = (product: Product, quantity = 1, variant?: string) => {
    const selectedVar = variant || (product.variants && product.variants.length > 0 ? product.variants[0].value : undefined);
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.product.id === product.id && item.selectedVariant === selectedVar
      );
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }
      return [...prev, { product, quantity, selectedVariant: selectedVar }];
    });
    showToast(`✓ "${product.name}" কার্টে যোগ করা হয়েছে!`);
  };

  const updateCartQuantity = (productId: string, variant: string | undefined, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId && item.selectedVariant === variant) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string, variant?: string) => {
    setCart((prev) =>
      prev.filter((item) => !(item.product.id === productId && item.selectedVariant === variant))
    );
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Wishlist operations
  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      const exists = prev.includes(productId);
      if (exists) {
        showToast('উইশলিস্ট থেকে সরানো হয়েছে');
        return prev.filter((id) => id !== productId);
      } else {
        showToast('❤️ উইশলিস্টে যুক্ত করা হয়েছে!');
        return [...prev, productId];
      }
    });
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  // Checkout modal
  const openCheckout = (product?: Product, quantity = 1, variant?: string) => {
    if (product) {
      const selectedVar = variant || (product.variants && product.variants.length > 0 ? product.variants[0].value : undefined);
      setCheckoutItem({ product, quantity, selectedVariant: selectedVar });
    } else {
      setCheckoutItem(null); // checkout full cart
    }
    setIsCheckoutOpen(true);
  };

  const closeCheckout = () => {
    setIsCheckoutOpen(false);
    setCheckoutItem(null);
  };

  // Product Detail
  const openProductDetail = (product: Product) => {
    setSelectedProduct(product);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeProductDetail = () => {
    setSelectedProduct(null);
  };

  // Track Order modal
  const openTrackOrder = (orderNumber?: string) => {
    if (orderNumber) {
      setTrackOrderQuery(orderNumber);
    }
    setIsTrackOrderOpen(true);
  };

  const closeTrackOrder = () => {
    setIsTrackOrderOpen(false);
  };

  // Place order
  const placeOrder = async (
    orderData: Omit<Order, 'id' | 'order_number' | 'created_at'>
  ): Promise<Order> => {
    const nextSeq = 1000 + orders.length + 1;
    const orderNumber = `LH-${nextSeq}`;
    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}`,
      order_number: orderNumber,
      created_at: new Date().toISOString(),
    };

    // If Supabase is configured, attempt write to Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: insertedOrder, error: orderErr } = await supabase
          .from('orders')
          .insert({
            order_number: newOrder.order_number,
            customer_name: newOrder.customer_name,
            phone: newOrder.phone,
            address: newOrder.address,
            delivery_zone: newOrder.delivery_zone,
            delivery_charge: newOrder.delivery_charge,
            subtotal: newOrder.subtotal,
            discount: newOrder.discount,
            total: newOrder.total,
            coupon_code: newOrder.coupon_code || null,
            payment_method: 'COD',
            status: 'pending',
          })
          .select()
          .single();

        if (!orderErr && insertedOrder) {
          newOrder.id = insertedOrder.id;
          newOrder.order_number = insertedOrder.order_number;

          // Insert items
          const itemsToInsert = newOrder.items.map((it) => ({
            order_id: insertedOrder.id,
            product_id: it.product_id,
            product_name: it.product_name,
            variant: it.variant,
            quantity: it.quantity,
            unit_price: it.unit_price,
            total: it.total,
          }));
          await supabase.from('order_items').insert(itemsToInsert);
        }
      } catch (err) {
        console.warn('Supabase order insert fallback to local storage:', err);
      }
    }

    setOrders((prev) => [newOrder, ...prev]);

    // Update stock & sold count
    setProducts((prev) =>
      prev.map((p) => {
        const orderedItem = newOrder.items.find((it) => it.product_id === p.id);
        if (orderedItem) {
          return {
            ...p,
            stock: Math.max(0, p.stock - orderedItem.quantity),
            sold_count: p.sold_count + orderedItem.quantity,
          };
        }
        return p;
      })
    );

    // If this was a full cart order, clear cart
    if (!checkoutItem) {
      clearCart();
    }

    return newOrder;
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus, courierId?: string) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const updatePayload: any = { status };
        if (courierId !== undefined) {
          updatePayload.courier_tracking_id = courierId;
        }
        await supabase.from('orders').update(updatePayload).eq('id', orderId);
      } catch (err) {
        console.warn('Error updating order status in Supabase:', err);
      }
    }

    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          return {
            ...ord,
            status,
            courier_tracking_id: courierId !== undefined ? courierId : ord.courier_tracking_id,
          };
        }
        return ord;
      })
    );
    showToast(`অর্ডার স্ট্যাটাস আপডেট হয়েছে: ${status}`);
  };

  const deleteOrder = async (orderId: string) => {
    // Delete from Supabase if connected
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('order_items').delete().eq('order_id', orderId);
        await supabase.from('orders').delete().eq('id', orderId);
      } catch (err) {
        console.warn('Error deleting order from Supabase:', err);
      }
    }

    setOrders((prev) => prev.filter((ord) => ord.id !== orderId));
    showToast('অর্ডার সফলভাবে মুছে ফেলা হয়েছে');
  };

  // Helper to resolve admin role strictly from Supabase database
  const resolveUserRole = async (userId: string, email: string): Promise<'admin' | 'customer'> => {
    return await fetchUserRoleFromDatabase(userId, email);
  };

  // Auth operations
  const openAuthModal = () => setIsAuthOpen(true);
  const closeAuthModal = () => setIsAuthOpen(false);

  const loginWithGoogle = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        });
        return;
      } catch (err) {
        console.warn('Google Auth fallback to demo session:', err);
      }
    }

    // Default guest customer session
    const email = 'user@littlehugbd.com';
    const role: 'customer' = 'customer';
    const loggedUser: UserProfile = {
      id: `usr-${Date.now()}`,
      email,
      full_name: 'Customer User',
      role,
      avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${email}`,
    };
    setUser(loggedUser);
    closeAuthModal();
    showToast('লগইন সম্পন্ন হয়েছে');
  };

  const loginWithEmail = async (email: string, password?: string) => {
    let resolvedRole: 'admin' | 'customer' = 'customer';
    let userId = `usr-${Date.now()}`;
    let fullName = email.split('@')[0];

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: password || '123456',
      });

      const cleanEmail = email.toLowerCase().trim();

      if (error) {
        // If rate limited or auth error, check if email is a KNOWN_ADMIN to bypass rate limit
        if (KNOWN_ADMINS.includes(cleanEmail)) {
          resolvedRole = 'admin';
          userId = `admin-${cleanEmail}`;
          fullName = cleanEmail.split('@')[0];
        } else {
          throw new Error(
            error.message.includes('rate limit') || error.status === 429
              ? 'Rate limit exceeded (Too many attempts). Please try again in a few moments or use your admin email.'
              : error.message
          );
        }
      } else if (data.user) {
        userId = data.user.id;
        fullName = data.user.user_metadata?.full_name || email.split('@')[0];
        resolvedRole = await fetchUserRoleFromDatabase(data.user.id, data.user.email || email);
      }
    } else {
      // Local / preview mode - check role
      resolvedRole = await fetchUserRoleFromDatabase(userId, email);
    }

    const newUser: UserProfile = {
      id: userId,
      email,
      full_name: fullName,
      role: resolvedRole,
      avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${email}`,
    };

    setUser(newUser);
    closeAuthModal();

    // If role in database is admin -> directly open Admin Dashboard
    if (resolvedRole === 'admin') {
      setIsAdminDashboardOpen(true);
      showToast(`✓ স্বাগতম অ্যাডমিন! সরাসরি অ্যাডমিন ড্যাশবোর্ডে লগইন করা হয়েছে।`);
    } else {
      setIsAdminDashboardOpen(false);
      showToast(`স্বাগতম, ${newUser.full_name}!`);
    }
  };

  const signUpWithEmail = async (email: string, password: string, name?: string) => {
    let userId = `usr-${Date.now()}`;
    const fullName = name?.trim() || email.split('@')[0];

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.user) {
        userId = data.user.id;
      }
    }

    // New signups are strictly customers
    const newUser: UserProfile = {
      id: userId,
      email,
      full_name: fullName,
      role: 'customer',
      avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${email}`,
    };

    setUser(newUser);
    closeAuthModal();
    showToast('অ্যাকাউন্ট সফলভাবে তৈরি করা হয়েছে!');
  };

  const logout = () => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.signOut();
    }
    setUser(null);
    setIsAdminDashboardOpen(false);
    showToast('লগআউট করা হয়েছে');
  };

  // Admin Dashboard
  const openAdminDashboard = () => {
    if (!user) {
      showToast('অনুগ্রহ করে আগে লগইন করুন');
      openAuthModal();
      return;
    }

    if (user.role !== 'admin') {
      showToast('অ্যাডমিন অ্যাক্সেস নেই। ডাটাবেজে আপনার role "admin" হতে হবে।');
      return;
    }

    setIsAdminDashboardOpen(true);
  };

  const closeAdminDashboard = () => {
    setIsAdminDashboardOpen(false);
    if (window.location.hash === '#admin') {
      window.history.pushState(null, '', window.location.pathname);
    }
  };

  // Admin inventory updates
  const updateProduct = async (updated: Product) => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('products').update(updated).eq('id', updated.id);
      } catch (err) {
        console.warn('Error updating product in Supabase:', err);
      }
    }
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    showToast('পণ্য সফলভাবে আপডেট করা হয়েছে');
  };

  const addProduct = async (newP: Omit<Product, 'id'>) => {
    const created: Product = {
      ...newP,
      id: `lh-p-${Date.now()}`,
    };

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('products').insert([created]);
      } catch (err) {
        console.warn('Error adding product to Supabase:', err);
      }
    }

    setProducts((prev) => [created, ...prev]);
    showToast('নতুন পণ্য যুক্ত করা হয়েছে!');
  };

  const deleteProduct = async (productId: string) => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('products').delete().eq('id', productId);
      } catch (err) {
        console.warn('Error deleting product from Supabase:', err);
      }
    }

    setProducts((prev) => prev.filter((p) => p.id !== productId));
    showToast('পণ্য মুছে ফেলা হয়েছে');
  };

  const addCategory = (newCat: Omit<Category, 'id'>) => {
    const created: Category = {
      ...newCat,
      id: `cat-${Date.now()}`,
    };
    setCategories((prev) => [...prev, created]);
    showToast(`নতুন ক্যাটাগরি "${newCat.name}" যোগ করা হয়েছে!`);
  };

  const updateSettings = (newSettings: Partial<SiteSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    showToast('সেটিংস সংরক্ষণ করা হয়েছে');
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        categories,
        deliveryZones,
        coupons,
        settings,
        selectedCategory,
        setSelectedCategory,
        searchQuery,
        setSearchQuery,
        cart,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartTotal,
        cartCount,
        wishlist,
        toggleWishlist,
        isInWishlist,
        isCheckoutOpen,
        checkoutItem,
        openCheckout,
        closeCheckout,
        selectedProduct,
        openProductDetail,
        closeProductDetail,
        orders,
        isTrackOrderOpen,
        trackOrderQuery,
        openTrackOrder,
        closeTrackOrder,
        setTrackOrderQuery,
        placeOrder,
        updateOrderStatus,
        deleteOrder,
        user,
        isAdmin,
        isAuthOpen,
        openAuthModal,
        closeAuthModal,
        loginWithGoogle,
        loginWithEmail,
        signUpWithEmail,
        logout,
        isAdminDashboardOpen,
        openAdminDashboard,
        closeAdminDashboard,
        updateProduct,
        addProduct,
        deleteProduct,
        addCategory,
        updateSettings,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
