import React from 'react';

export const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', type = 'warning' }) => {
  if (!isOpen) return null;

  const getTypeColors = () => {
    switch (type) {
      case 'danger': return 'bg-red-600 hover:bg-red-700';
      case 'success': return 'bg-emerald-600 hover:bg-emerald-700';
      case 'warning': return 'bg-amber-600 hover:bg-amber-700';
      default: return 'bg-indigo-600 hover:bg-indigo-700';
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 md:p-8 animate-in zoom-in duration-300">
        <h3 className="text-xl md:text-2xl font-black text-slate-800 mb-3">{title}</h3>
        <p className="text-sm md:text-base text-slate-600 mb-6 md:mb-8">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition active:scale-95"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 px-4 text-white font-bold rounded-xl transition active:scale-95 ${getTypeColors()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
