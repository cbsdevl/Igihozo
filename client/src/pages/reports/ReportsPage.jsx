import { useState } from 'react';
import DailyReport from './DailyReport';
import WeeklyReport from './WeeklyReport';
import MonthlyReport from './MonthlyReport';
import ExpiredReport from './ExpiredReport';
import LowStockReport from './LowStockReport';
import ProfitReport from './ProfitReport';
import InventoryReport from './InventoryReport';

const TABS = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'expired', label: 'Expired' },
  { id: 'lowstock', label: 'Low Stock' },
  { id: 'profit', label: 'Profit' },
  { id: 'inventory', label: 'Inventory' },
];

export default function ReportsPage() {
  const [tab, setTab] = useState('daily');

  const renderTab = () => {
    switch (tab) {
      case 'daily': return <DailyReport />;
      case 'weekly': return <WeeklyReport />;
      case 'monthly': return <MonthlyReport />;
      case 'expired': return <ExpiredReport />;
      case 'lowstock': return <LowStockReport />;
      case 'profit': return <ProfitReport />;
      case 'inventory': return <InventoryReport />;
      default: return null;
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="page-title">Reports</h1>
        <p className="page-subtitle">Generate and view pharmacy reports</p>
      </div>

      <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-700/50 p-1 rounded-xl">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-white dark:bg-slate-600 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {renderTab()}
    </div>
  );
}

