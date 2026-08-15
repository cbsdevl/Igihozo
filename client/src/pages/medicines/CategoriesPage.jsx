import { useState, useEffect } from 'react';
import { medicineService } from '../../services';
import { Link } from 'react-router-dom';
import { HiArrowLeft } from 'react-icons/hi2';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    medicineService.getCategories()
      .then((res) => setCategories(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link to="/medicines" className="btn-icon">
          <HiArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="page-subtitle">Medicine categories overview</p>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner className="py-12" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.length === 0 ? (
            <p className="text-slate-400 col-span-full text-center py-12">No categories found</p>
          ) : (
            categories.map((cat) => (
              <div key={cat.id} className="card-hover">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{cat.name}</h3>
                {cat.description && <p className="text-sm text-slate-400 mt-1">{cat.description}</p>}
                <div className="mt-3 flex items-center gap-2">
                  <span className="badge-info">{cat.medicine_count || 0} medicines</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

