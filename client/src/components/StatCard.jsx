export default function StatCard({ title, value, icon: Icon, color = 'primary', subtitle, loading = false }) {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400',
    success: 'bg-accent-50 text-accent-600 dark:bg-accent-900/20 dark:text-accent-400',
    danger: 'bg-danger-50 text-danger-600 dark:bg-danger-900/20 dark:text-danger-400',
    warning: 'bg-warning-50 text-warning-600 dark:bg-warning-900/20 dark:text-warning-400',
    info: 'bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400',
  };

  return (
    <div className="card-hover flex flex-col gap-2">
      <div className="flex items-start justify-between">
        <span className="stat-label">{title}</span>
        {Icon && (
          <div className={`p-2.5 rounded-xl ${colorClasses[color] || colorClasses.primary}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {loading ? (
        <div className="skeleton h-8 w-24" />
      ) : (
        <div className="stat-value">{value ?? '—'}</div>
      )}
      {subtitle && <span className="text-xs text-slate-400">{subtitle}</span>}
    </div>
  );
}

