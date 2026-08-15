import { useState, useRef, useEffect } from 'react';
import { saleService, medicineService, customerService } from '../../services';
import { useAuth } from '../../hooks/useAuth';
import { useDebounce } from '../../hooks/useDebounce';
import { toast } from 'react-toastify';
import { HiMagnifyingGlass, HiPlus, HiMinus, HiTrash, HiShoppingCart } from 'react-icons/hi2';

export default function NewSalePage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [cart, setCart] = useState([]);
  const [customerQuery, setCustomerQuery] = useState('');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const searchRef = useRef();

  // Search medicines
  useEffect(() => {
    if (!debouncedSearch) { setSearchResults([]); return; }
    setSearching(true);
    medicineService.search(debouncedSearch, 15)
      .then((res) => setSearchResults(res.data.data || []))
      .catch(() => {})
      .finally(() => setSearching(false));
  }, [debouncedSearch]);

  // Search customers
  useEffect(() => {
    if (customerQuery.length < 1) return;
    customerService.getAll({ search: customerQuery, limit: 5 })
      .then((res) => setCustomers(res.data.data || []))
      .catch(() => {});
  }, [customerQuery]);

  const addToCart = (med) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.medicine_id === med.id);
      if (existing) {
        return prev.map((c) =>
          c.medicine_id === med.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, {
        medicine_id: med.id,
        medicine_name: med.name,
        quantity: 1,
        unit_price: med.selling_price,
        purchase_price: med.purchase_price,
        discount: 0,
        max_qty: med.quantity,
      }];
    });
    setSearchTerm('');
    searchRef.current?.focus();
  };

  const updateCartItem = (id, field, value) => {
    setCart((prev) => prev.map((c) => c.medicine_id === id ? { ...c, [field]: value } : c));
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((c) => c.medicine_id !== id));
  };

  const subtotal = cart.reduce((sum, c) => sum + (c.unit_price * c.quantity - c.discount), 0);
  const total = subtotal - discount + tax;
  const change = parseFloat(amountPaid) - total;

  const handleCheckout = async () => {
    if (cart.length === 0) { toast.error('Add items to cart'); return; }
    if (!amountPaid || parseFloat(amountPaid) < total) { toast.error('Amount paid must cover total'); return; }

    setSaving(true);
    try {
      const res = await saleService.create({
        items: cart.map((c) => ({
          medicine_id: c.medicine_id,
          quantity: c.quantity,
          unit_price: c.unit_price,
          discount: c.discount,
        })),
        customer_id: selectedCustomer?.id,
        customer_name: selectedCustomer?.name || customerQuery,
        discount,
        tax,
        amount_paid: parseFloat(amountPaid),
        payment_method: paymentMethod,
        notes,
      });
      toast.success(`Sale completed! Invoice: ${res.data.data.invoice_number}`);
      // Reset
      setCart([]);
      setAmountPaid('');
      setDiscount(0);
      setTax(0);
      setNotes('');
      setSelectedCustomer(null);
      setCustomerQuery('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Sale failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="page-title">New Sale</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Search & Products */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search */}
          <div className="card relative">
            <div className="relative">
              <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                ref={searchRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 py-3 text-base"
                placeholder="Search medicines by name, barcode, or brand..."
                autoFocus
              />
            </div>

            {searchTerm && (
              <div className="absolute left-4 right-4 top-full mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 max-h-64 overflow-y-auto z-10">
                {searching ? (
                  <p className="p-3 text-sm text-slate-400">Searching...</p>
                ) : searchResults.length === 0 ? (
                  <p className="p-3 text-sm text-slate-400">No medicines found</p>
                ) : (
                  searchResults.map((med) => (
                    <button
                      key={med.id}
                      onClick={() => addToCart(med)}
                      className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-slate-50 dark:border-slate-700/50 last:border-0"
                    >
                      <div className="text-left min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{med.name}</p>
                        <p className="text-xs text-slate-400">{med.brand || med.generic_name || ''} · Stock: {med.quantity}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-primary-600">{med.selling_price?.toLocaleString()} RWF</p>
                        <button className="text-xs text-primary-500 hover:underline">Add</button>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Cart Items */}
          <div className="card">
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
              <HiShoppingCart className="w-5 h-5" /> Cart ({cart.length} items)
            </h3>
            {cart.length === 0 ? (
              <p className="text-slate-400 text-sm py-8 text-center">Search and add medicines to start a sale</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Medicine</th>
                      <th className="text-center">Qty</th>
                      <th className="text-right">Price</th>
                      <th className="text-right">Discount</th>
                      <th className="text-right">Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((c) => (
                      <tr key={c.medicine_id}>
                        <td className="font-medium">{c.medicine_name}</td>
                        <td className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => updateCartItem(c.medicine_id, 'quantity', Math.max(1, c.quantity - 1))}
                              className="btn-icon text-xs"
                            ><HiMinus className="w-3 h-3" /></button>
                            <span className="w-8 text-center font-medium">{c.quantity}</span>
                            <button
                              onClick={() => updateCartItem(c.medicine_id, 'quantity', Math.min(c.max_qty, c.quantity + 1))}
                              className="btn-icon text-xs"
                            ><HiPlus className="w-3 h-3" /></button>
                          </div>
                        </td>
                        <td className="text-right">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={c.unit_price}
                            onChange={(e) => updateCartItem(c.medicine_id, 'unit_price', parseFloat(e.target.value) || 0)}
                            className="input w-24 text-right text-sm"
                          />
                        </td>
                        <td className="text-right">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={c.discount}
                            onChange={(e) => updateCartItem(c.medicine_id, 'discount', parseFloat(e.target.value) || 0)}
                            className="input w-20 text-right text-sm"
                          />
                        </td>
                        <td className="text-right font-medium">
                          {(c.unit_price * c.quantity - c.discount).toLocaleString()}
                        </td>
                        <td>
                          <button onClick={() => removeFromCart(c.medicine_id)} className="btn-icon text-danger-500">
                            <HiTrash className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right - Checkout */}
        <div className="space-y-4">
          {/* Customer */}
          <div className="card">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">Customer</h3>
            <input
              type="text"
              value={customerQuery}
              onChange={(e) => {
                setCustomerQuery(e.target.value);
                setSelectedCustomer(null);
              }}
              className="input"
              placeholder="Search or type customer name..."
            />
            {customers.length > 0 && !selectedCustomer && (
              <div className="mt-1 bg-white dark:bg-slate-700 rounded-xl border border-slate-100 dark:border-slate-600 max-h-32 overflow-y-auto">
                {customers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => { setSelectedCustomer(c); setCustomerQuery(c.name); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-600 border-b last:border-0"
                  >
                    {c.name} {c.phone && <span className="text-slate-400">· {c.phone}</span>}
                  </button>
                ))}
              </div>
            )}
            {selectedCustomer && (
              <p className="text-xs text-accent-600 mt-1">Selected: {selectedCustomer.name}</p>
            )}
          </div>

          {/* Summary */}
          <div className="card space-y-3">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Summary</h3>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-medium">{subtotal.toLocaleString()} RWF</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Discount</span>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="input w-28 text-right text-sm"
              />
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Tax</span>
              <input
                type="number"
                min="0"
                value={tax}
                onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                className="input w-28 text-right text-sm"
              />
            </div>
            <div className="divider" />
            <div className="flex justify-between">
              <span className="font-semibold">Total</span>
              <span className="text-xl font-bold text-primary-600">{total.toLocaleString()} RWF</span>
            </div>
          </div>

          {/* Payment */}
          <div className="card space-y-3">
            <div className="form-group">
              <label className="label">Payment Method</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="input">
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="mobile_money">Mobile Money</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">Amount Paid</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                className="input text-lg font-bold"
                placeholder="0"
              />
            </div>
            {amountPaid && (
              <div className={`flex justify-between text-sm ${change >= 0 ? 'text-accent-600' : 'text-danger-600'}`}>
                <span>Change</span>
                <span className="font-bold">{change.toLocaleString()} RWF</span>
              </div>
            )}
            <div className="form-group">
              <label className="label">Notes (optional)</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input" rows={2} />
            </div>
            <button
              onClick={handleCheckout}
              className="btn-primary w-full justify-center py-3 text-base"
              disabled={saving || cart.length === 0}
            >
              {saving ? 'Processing...' : `Complete Sale (${total.toLocaleString()} RWF)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

