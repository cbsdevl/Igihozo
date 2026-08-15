import Modal from './Modal';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
}) {
  const btnClass = variant === 'danger' ? 'btn-danger' : 'btn-primary';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-slate-600 dark:text-slate-300 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="btn-secondary" disabled={loading}>
          {cancelText}
        </button>
        <button onClick={onConfirm} className={btnClass} disabled={loading}>
          {loading ? 'Processing...' : confirmText}
        </button>
      </div>
    </Modal>
  );
}

