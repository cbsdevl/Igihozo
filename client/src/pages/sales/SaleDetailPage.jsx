import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { saleService } from '../../services';
import { useAuth } from '../../hooks/useAuth';
import ConfirmDialog from '../../components/ConfirmDialog';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { HiArrowLeft, HiPrinter } from 'react-icons/hi2';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

export default function SaleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    saleService.getOne(id)
      .then((res) => setSale(res.data.data))
      .catch(() => { toast.error('Sale not found'); navigate('/sales'); })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await saleService.cancel(id);
      toast.success('Sale cancelled');
      setCancelOpen(false);
      saleService.getOne(id).then((res) => setSale(res.data.data));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    } finally {
      setCancelling(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <LoadingSpinner size="lg" className="min-h-[60vh]" />;
  if (!sale) return null;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/sales')} className="btn-icon">
            <HiArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="page-title">Sale {sale.invoice_number}</h1>
            <p className="page-subtitle">{format(new Date(sale.created_at), 'MMMM d, yyyy HH:mm')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 no-print">
          <button onClick={handlePrint} className="btn-secondary">
            <HiPrinter className="w-4 h-4" /> Print
          </button>
          {isAdmin && sale.status === 'completed' && (
            <button onClick={() => setCancelOpen(true)} className="btn-danger">
              Cancel Sale
            </button>
          )}
        </div>
      </div>

      {/* Receipt */}
      <div className="card max-w-2xl mx-auto" id="receipt">
        <div className="text-center border-b border-slate-100 dark:border-slate-700 pb-4 mb-4">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{sale.pharmacy?.pharmacy_name || 'Gihozo Pharmacy'}</h2>
          <p className="text-xs text-slate-400">{sale.pharmacy?.pharmacy_address}</p>
          <p className="text-xs text-slate-400">Tel: {sale.pharmacy?.pharmacy_phone}</p>
          <p className="text-xs text-slate-400 mt-1">Invoice: {sale.invoice_number}</p>
          <p className="text-xs text-slate-400">Date: {format(new Date(sale.created_at), 'MMM d, yyyy HH:mm')}</p>
          <p className="text-xs text-slate-400">Cashier: {sale.worker_name}</p>
        </div>

        <table className="table mb-4">
          <thead>
            <tr>
              <th>Item</th>
              <th className="text-center">Qty</th>
              <th className="text-right">Price</th>
              <th className="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {sale.items?.map((item) => (
              <tr key={item.id}>
                <td>{item.medicine_name}</td>
                <td className="text-center">{item.quantity}</td>
                <td className="text-right">{item.unit_price?.toLocaleString()}</td>
                <td className="text-right font-medium">{item.total?.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t border-slate-100 dark:border-slate-700 pt-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Subtotal</span>
            <span>{sale.subtotal?.toLocaleString()} RWF</span>
          </div>
          {sale.discount > 0 && (
            <div className="flex justify-between">
              <span className="text-slate-500">Discount</span>
              <span className="text-danger-500">-{sale.discount?.toLocaleString()} RWF</span>
            </div>
          )}
          {sale.tax > 0 && (
            <div className="flex justify-between">
              <span className="text-slate-500">Tax</span>
              <span>{sale.tax?.toLocaleString()} RWF</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-100 dark:border-slate-700">
            <span>Total</span>
            <span>{sale.total?.toLocaleString()} RWF</span>
          </div>
          <div className="flex justify-between text-accent-600 font-medium">
            <span>Paid ({sale.payment_method?.replace('_', ' ')})</span>
            <span>{sale.amount_paid?.toLocaleString()} RWF</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Change</span>
            <span>{(sale.balance || 0).toLocaleString()} RWF</span>
          </div>
        </div>

        {sale.customer_name && (
          <p className="text-xs text-slate-400 mt-3">Customer: {sale.customer_name}</p>
        )}
        {sale.notes && <p className="text-xs text-slate-400 mt-1">Notes: {sale.notes}</p>}

        <div className="text-center text-xs text-slate-400 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
          {sale.pharmacy?.receipt_footer || 'Thank you for your purchase!'}
        </div>

        {sale.status === 'cancelled' && (
          <div className="mt-4 p-3 bg-danger-50 dark:bg-danger-900/20 text-danger-600 text-center rounded-xl font-medium">
            THIS SALE HAS BEEN CANCELLED
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleCancel}
        title="Cancel Sale"
        message={`Are you sure you want to cancel sale ${sale.invoice_number}? Inventory will be restored.`}
        loading={cancelling}
      />
    </div>
  );
}

