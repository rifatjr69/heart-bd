import React, { useState } from 'react';
import { X, Check, Tag, ShieldCheck, Minus, Plus, CheckCircle, Package, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useStore } from '../context/StoreContext';
import { CartItem, Order } from '../types';

const inputBase =
  'w-full px-3.5 py-3 bg-white border border-gray-300 rounded-xl text-base sm:text-sm text-gray-800 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-[#F8628D] focus:border-transparent transition-all';

const SummaryRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-start justify-between gap-3 text-gray-600">
    <span className="shrink-0">{label}</span>
    <span className="min-w-0 text-right font-bold text-gray-900 break-words">{children}</span>
  </div>
);

export const CheckoutModal: React.FC = () => {
  const {
    isCheckoutOpen,
    closeCheckout,
    checkoutItem,
    cart,
    deliveryZones,
    coupons,
    settings,
    placeOrder,
    openTrackOrder,
    user,
    showToast,
  } = useStore();

  const [singleItem, setSingleItem] = useState<CartItem | null>(checkoutItem);

  React.useEffect(() => {
    setSingleItem(checkoutItem);
  }, [checkoutItem]);

  // Form fields
  const [customerName, setCustomerName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState(deliveryZones[0]?.id || 'zone-1');

  // Coupon
  const [isCouponOpen, setIsCouponOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  // Lock background scroll + close on Escape while open
  React.useEffect(() => {
    if (!isCheckoutOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCheckout();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [isCheckoutOpen, closeCheckout]);

  if (!isCheckoutOpen) return null;

  const items: CartItem[] = singleItem ? [singleItem] : cart;
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const selectedZone = deliveryZones.find((z) => z.id === selectedZoneId) || deliveryZones[0];
  const deliveryCharge = selectedZone?.charge ?? 0;

  let extraDiscount = 0;
  if (subtotal >= settings.extra_discount_threshold) {
    extraDiscount = Math.round((subtotal * settings.extra_discount_percent) / 100);
  }

  const couponDiscount = appliedCoupon ? appliedCoupon.discount : 0;
  const totalDiscount = extraDiscount + couponDiscount;
  const grandTotal = Math.max(0, subtotal + deliveryCharge - totalDiscount);

  // Validations
  const isNameValid = customerName.trim().length >= 2;
  const cleanPhone = phone.replace(/\D/g, '');
  const isPhoneValid = cleanPhone.length === 11 && cleanPhone.startsWith('01');
  const isAddressValid = address.trim().length >= 6;
  const isFormValid = isNameValid && isPhoneValid && isAddressValid && items.length > 0 && !!selectedZone;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    const code = couponCode.trim().toUpperCase();
    const found = coupons.find((c) => c.code.toUpperCase() === code && c.is_active);

    if (!found) {
      setCouponError('অবৈধ কুপন কোড (Invalid coupon)');
      return;
    }
    if (subtotal < found.min_order) {
      setCouponError(`এই কুপন ব্যবহারের জন্য ন্যূনতম ৳${found.min_order} এর অর্ডার প্রয়োজন`);
      return;
    }

    const discountAmount =
      found.type === 'percent' ? Math.round((subtotal * found.value) / 100) : found.value;

    setAppliedCoupon({ code: found.code, discount: discountAmount });
    showToast(`✓ কুপন "${found.code}" প্রয়োগ করা হয়েছে!`);
  };

  const handleConfirmOrder = async () => {
    if (!isFormValid || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const orderPayload = {
        user_id: user?.id || null,
        customer_name: customerName.trim(),
        phone: cleanPhone,
        address: address.trim(),
        delivery_zone: selectedZone.name_bn,
        delivery_charge: deliveryCharge,
        subtotal,
        discount: totalDiscount,
        total: grandTotal,
        coupon_code: appliedCoupon?.code,
        payment_method: 'COD' as const,
        status: 'pending' as const,
        items: items.map((it) => ({
          product_id: it.product.id,
          product_name: it.product.name,
          variant: it.selectedVariant,
          quantity: it.quantity,
          unit_price: it.product.price,
          total: it.product.price * it.quantity,
          image_url: it.product.image_url,
        })),
      };

      const result = await placeOrder(orderPayload);
      setConfirmedOrder(result);

      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch {
        // ignore
      }
    } catch (err) {
      console.error(err);
      showToast('অর্ডার সম্পন্ন করতে সমস্যা হয়েছে, আবার চেষ্টা করুন');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateQty = (delta: number) => {
    if (!singleItem) return;
    setSingleItem({ ...singleItem, quantity: Math.max(1, singleItem.quantity + delta) });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeCheckout();
      }}
    >
      {/* Panel: bottom sheet on mobile, centered card on larger screens */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex flex-col w-full sm:max-w-lg max-h-[94dvh] sm:max-h-[90dvh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-pink-100 overflow-hidden"
      >
        {confirmedOrder ? (
          <>
            {/* ===== SUCCESS: scrollable body ===== */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pt-6 pb-4 sm:px-8 sm:pt-8 text-center space-y-4 sm:space-y-5">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl sm:text-3xl">
                ✓
              </div>

              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-pink-50 text-[#F8628D] text-xs font-black mb-2">
                  অর্ডার সফল হয়েছে!
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 break-words">
                  ধন্যবাদ, {confirmedOrder.customer_name}!
                </h2>
              </div>

              {/* Advance delivery charge alert */}
              <div
                role="alert"
                className="relative text-left rounded-2xl border border-amber-300 bg-linear-to-br from-amber-50 to-orange-50 p-3.5 sm:p-4 overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-400" />
                <div className="flex items-start gap-3 pl-2">
                  <div className="shrink-0 w-9 h-9 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <h4 className="text-[13px] sm:text-sm font-black text-amber-900 leading-snug">
                      📦 ডেলিভারি চার্জ ও অগ্রিম পেমেন্ট সংক্রান্ত তথ্য
                    </h4>
                    <p className="text-xs leading-relaxed text-amber-900/90 font-medium">
                      অর্ডার নিশ্চিত করতে প্রযোজ্য ডেলিভারি চার্জ অগ্রিম পরিশোধ করতে হবে। বাকি পণ্যের
                      মূল্য ক্যাশ অন ডেলিভারি (COD)-এর মাধ্যমে পরিশোধ করতে পারবেন।
                    </p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-1.5 rounded-xl bg-white border border-amber-200 text-xs font-bold text-gray-800 w-fit max-w-full">
                      <span>অগ্রিম ডেলিভারি চার্জ:</span>
                      <span className="font-mono font-black text-[#F8628D] text-sm">
                        ৳{confirmedOrder.delivery_charge}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order summary */}
              <div className="bg-[#FFF5F8] rounded-2xl p-3.5 sm:p-4 text-left border border-pink-200 space-y-2 text-xs">
                <div className="flex items-center justify-between gap-3 pb-2 border-b border-pink-100 font-bold">
                  <span className="text-gray-500">অর্ডার নম্বর:</span>
                  <span className="font-mono text-sm text-[#F8628D] font-black">
                    {confirmedOrder.order_number}
                  </span>
                </div>
                <SummaryRow label="মোবাইল:">
                  <span className="font-mono">+88 {confirmedOrder.phone}</span>
                </SummaryRow>
                <SummaryRow label="ঠিকানা:">{confirmedOrder.address}</SummaryRow>
                <SummaryRow label="ডেলিভারি এলাকা:">{confirmedOrder.delivery_zone}</SummaryRow>
                <div className="flex items-baseline justify-between gap-3 pt-2 border-t border-pink-100 font-black text-gray-900">
                  <span className="text-[13px] sm:text-sm">সর্বমোট প্রদেয় (COD):</span>
                  <span className="text-[#F8628D] font-mono text-base sm:text-lg shrink-0">
                    ৳{confirmedOrder.total.toLocaleString('en-US')}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-800 text-xs font-medium flex items-start gap-2 text-left">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>আমাদের প্রতিনিধি শীঘ্রই আপনাকে কল করে ডেলিভারি নিশ্চিত করবেন।</span>
              </div>
            </div>

            {/* Sticky action buttons */}
            <div className="shrink-0 border-t border-pink-100 bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-8 sm:pb-5 flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3">
              <button
                onClick={closeCheckout}
                className="sm:flex-none py-3 px-5 bg-white border border-pink-200 text-gray-700 hover:bg-pink-50 text-sm font-bold rounded-xl transition-all cursor-pointer"
              >
                আরো শপিং করুন
              </button>
              <button
                onClick={() => {
                  closeCheckout();
                  openTrackOrder(confirmedOrder.order_number);
                }}
                className="flex-1 py-3 px-4 bg-[#1F1F24] hover:bg-black text-white text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Package className="w-4 h-4" />
                <span>অর্ডার ট্র্যাক করুন</span>
              </button>
            </div>
          </>
        ) : (
          <>
            {/* ===== FORM: fixed header ===== */}
            <div className="shrink-0 flex items-start justify-between gap-3 px-4 py-3.5 sm:px-6 sm:py-4 border-b border-pink-100 bg-[#FFF5F8]">
              <div className="min-w-0">
                <h3 className="text-lg sm:text-xl font-black text-gray-900">অর্ডার করুন</h3>
                <p className="text-xs text-emerald-700 font-bold flex items-start gap-1 mt-0.5">
                  <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>ক্যাশ অন ডেলিভারি — পণ্য হাতে পেয়ে টাকা দিন</span>
                </p>
              </div>
              <button
                onClick={closeCheckout}
                className="shrink-0 p-2 -mr-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-white transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 space-y-4">
              {/* Items */}
              {items.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-xs">কোনো পণ্য সিলেক্ট করা হয়নি</div>
              ) : (
                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-2.5 sm:p-3 bg-pink-50/40 rounded-2xl border border-pink-100"
                    >
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-14 h-14 shrink-0 object-cover rounded-xl border border-pink-100 bg-white"
                        referrerPolicy="no-referrer"
                      />

                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs sm:text-[13px] font-bold text-gray-900 line-clamp-2 leading-snug">
                          {item.product.name}
                        </h4>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          <div className="flex items-center border border-pink-200 bg-white rounded-lg text-xs">
                            <button
                              type="button"
                              aria-label="Decrease quantity"
                              onClick={() => updateQty(-1)}
                              className="text-gray-500 hover:text-[#F8628D] px-2 py-1.5 cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="min-w-6 text-center font-bold text-gray-800">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              aria-label="Increase quantity"
                              onClick={() => updateQty(1)}
                              className="text-gray-500 hover:text-[#F8628D] px-2 py-1.5 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {item.selectedVariant && (
                            <span className="text-[11px] text-gray-500 bg-white px-2 py-0.5 rounded-md border border-pink-100">
                              {item.selectedVariant}
                            </span>
                          )}
                        </div>
                      </div>

                      <span className="shrink-0 text-sm font-black text-gray-900 font-mono">
                        ৳{(item.product.price * item.quantity).toLocaleString('en-US')}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Delivery info */}
              <div className="p-2.5 rounded-xl border border-dashed border-[#F8628D]/50 bg-pink-50/50 flex items-start gap-2 text-xs font-bold text-gray-800">
                <ShieldCheck className="w-4 h-4 text-[#F8628D] shrink-0 mt-0.5" />
                <span>সারা বাংলাদেশে ক্যাশ অন ডেলিভারি (পাঠাও কুরিয়ার)</span>
              </div>

              {/* Inputs */}
              <div className="space-y-3.5">
                <div>
                  <label htmlFor="co-name" className="block text-xs font-bold text-gray-700 mb-1.5">
                    আপনার নাম <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="co-name"
                      type="text"
                      autoComplete="name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Rifat Khan"
                      className={`${inputBase} pr-10`}
                    />
                    {isNameValid && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">
                        ✓
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="co-phone" className="block text-xs font-bold text-gray-700 mb-1.5">
                    মোবাইল নাম্বার <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500 select-none">
                      +88
                    </span>
                    <input
                      id="co-phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      maxLength={11}
                      className={`${inputBase} pl-14 pr-10 font-mono`}
                    />
                    {isPhoneValid && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">
                        ✓
                      </div>
                    )}
                  </div>
                  {phone.length > 0 && !isPhoneValid && (
                    <p className="text-[11px] text-amber-600 mt-1">
                      সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="co-address" className="block text-xs font-bold text-gray-700 mb-1.5">
                    সম্পূর্ণ ঠিকানা <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <textarea
                      id="co-address"
                      rows={2}
                      autoComplete="street-address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="বাড়ি নং, রোড, থানা, জেলা"
                      className={`${inputBase} pr-10 resize-none leading-snug`}
                    />
                    {isAddressValid && (
                      <div className="absolute right-3 top-3 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">
                        ✓
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Delivery zones */}
              <div className="space-y-2">
                <span className="block text-xs font-bold text-gray-700">
                  ডেলিভারি এলাকা <span className="text-red-500">*</span>
                </span>
                <div className="space-y-2">
                  {deliveryZones.map((zone) => {
                    const isSelected = selectedZoneId === zone.id;
                    return (
                      <label
                        key={zone.id}
                        className={`flex items-center justify-between gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-500'
                            : 'border-gray-200 bg-white hover:border-pink-200'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="radio"
                            name="delivery_zone"
                            checked={isSelected}
                            onChange={() => setSelectedZoneId(zone.id)}
                            className="w-4 h-4 shrink-0 accent-emerald-600 cursor-pointer"
                          />
                          <div className="min-w-0">
                            <span className="block text-xs sm:text-[13px] font-bold text-gray-900">
                              {zone.name_bn}
                            </span>
                            <span className="block text-[11px] text-gray-500">{zone.estimated_days}</span>
                          </div>
                        </div>
                        <span className="shrink-0 text-xs font-black text-gray-900 font-mono">
                          ৳{zone.charge}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Coupon */}
              <div>
                <button
                  type="button"
                  onClick={() => setIsCouponOpen(!isCouponOpen)}
                  className="flex items-center gap-1.5 py-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>ডিসকাউন্ট কোড আছে?</span>
                </button>

                {isCouponOpen && (
                  <form onSubmit={handleApplyCoupon} className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="LITTLEHUG or WELCOME50"
                      className="flex-1 min-w-0 px-3 py-2.5 bg-pink-50/50 border border-pink-200 rounded-xl text-base sm:text-xs font-mono uppercase focus:outline-hidden focus:ring-2 focus:ring-[#F8628D]"
                    />
                    <button
                      type="submit"
                      className="shrink-0 px-4 py-2.5 bg-[#1F1F24] hover:bg-black text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Apply
                    </button>
                  </form>
                )}

                {couponError && <p className="text-[11px] text-red-500 mt-1">{couponError}</p>}

                {appliedCoupon && (
                  <div className="flex items-center justify-between gap-2 text-xs text-emerald-700 bg-emerald-50 p-2 rounded-xl mt-1.5">
                    <span className="min-w-0 break-words">
                      কুপন কোড &quot;{appliedCoupon.code}&quot; প্রযোজ্য হয়েছে
                    </span>
                    <span className="shrink-0 font-mono font-bold">-৳{appliedCoupon.discount}</span>
                  </div>
                )}
              </div>

              {/* Bill summary */}
              <div className="space-y-1.5 pt-3 border-t border-gray-200 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>পণ্যের দাম</span>
                  <span className="font-mono font-bold text-gray-800">
                    ৳{subtotal.toLocaleString('en-US')}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>ডেলিভারি চার্জ</span>
                  <span className="font-mono font-bold text-gray-800">৳{deliveryCharge}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>ডিসকাউন্ট</span>
                    <span className="font-mono">-৳{totalDiscount}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-2 border-t border-gray-200 text-sm font-black text-gray-900">
                  <span>সর্বমোট</span>
                  <span className="font-mono text-lg text-[#F8628D]">
                    ৳{grandTotal.toLocaleString('en-US')}
                  </span>
                </div>
              </div>
            </div>

            {/* Sticky footer: confirm button always visible */}
            <div className="shrink-0 border-t border-gray-200 bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-4 space-y-2">
              <button
                type="button"
                onClick={handleConfirmOrder}
                disabled={!isFormValid || isSubmitting}
                className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-md transition-all ${
                  isFormValid && !isSubmitting
                    ? 'bg-[#1F1F24] hover:bg-black text-white cursor-pointer active:scale-[0.99]'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>অর্ডার প্রসেস হচ্ছে...</span>
                  </>
                ) : (
                  <span>✓ অর্ডার কনফার্ম করুন — ৳{grandTotal.toLocaleString('en-US')}</span>
                )}
              </button>

              <p className="text-center text-[11px] text-gray-500 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
                <span>কোনো অগ্রিম পেমেন্ট লাগবে না</span>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};