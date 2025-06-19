import { useState, useEffect } from 'react';

export function Toast({ message, type = 'info', duration = 5000, onClose }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose && onClose(), 300); // Animation süresi
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getToastClasses = () => {
    const baseClasses = "fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 max-w-sm";
    
    if (!isVisible) {
      return `${baseClasses} opacity-0 translate-x-full`;
    }

    switch (type) {
      case 'success':
        return `${baseClasses} bg-green-50 border border-green-200 text-green-800`;
      case 'error':
        return `${baseClasses} bg-red-50 border border-red-200 text-red-800`;
      case 'warning':
        return `${baseClasses} bg-yellow-50 border border-yellow-200 text-yellow-800`;
      default:
        return `${baseClasses} bg-blue-50 border border-blue-200 text-blue-800`;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'bi-check-circle-fill';
      case 'error':
        return 'bi-exclamation-triangle-fill';
      case 'warning':
        return 'bi-exclamation-circle-fill';
      default:
        return 'bi-info-circle-fill';
    }
  };

  return (
    <div className={getToastClasses()}>
      <div className="flex items-start">
        <i className={`bi ${getIcon()} text-lg mr-3 mt-0.5`}></i>
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onClose && onClose(), 300);
          }}
          className="ml-3 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <i className="bi bi-x text-lg"></i>
        </button>
      </div>
    </div>
  );
}

export function ToastContainer({ toasts, removeToast }) {
  return (
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  );
} 