import { ORDER_STATUSES } from './constants';
import { Check } from 'lucide-react';

export const formatCurrency = (val) => {
  const num = Number(val || 0);
  return `${num < 0 ? '-' : ''}Rs. ${Math.abs(num).toLocaleString()}`;
};

export const getStatusColor = (status) => {
  switch (status) {
    case 'Booked': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'Cutting': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'Stitching': return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'Ready': return 'bg-green-100 text-green-700 border-green-200';
    case 'Delivered': return 'bg-gray-100 text-gray-700 border-gray-200';
    default: return 'bg-gray-100 text-gray-700';
  }
};

export const getStepColor = (status, isActive) => {
  if (!isActive) return 'border-slate-200 bg-white text-slate-300';
  switch (status) {
    case 'Booked': return 'border-blue-500 bg-blue-500 text-white shadow-blue-200';
    case 'Cutting': return 'border-amber-500 bg-amber-500 text-white shadow-amber-200';
    case 'Stitching': return 'border-purple-500 bg-purple-500 text-white shadow-purple-200';
    case 'Ready': return 'border-emerald-500 bg-emerald-500 text-white shadow-emerald-200';
    case 'Delivered': return 'border-slate-600 bg-slate-600 text-white shadow-slate-200';
    default: return 'border-indigo-600 bg-indigo-600 text-white';
  }
};

export const getBarColor = (status) => {
  switch (status) {
    case 'Booked': return 'bg-blue-500';
    case 'Cutting': return 'bg-amber-500';
    case 'Stitching': return 'bg-purple-500';
    case 'Ready': return 'bg-emerald-500';
    case 'Delivered': return 'bg-slate-600';
    default: return 'bg-indigo-600';
  }
};

export const getPaginatedData = (data, pageIndex) => {
  const ITEMS_PER_PAGE = 10;
  return data.slice(0, (pageIndex + 1) * ITEMS_PER_PAGE);
};

export const getTotalPages = (totalItems) => {
  const ITEMS_PER_PAGE = 10;
  return Math.ceil(totalItems / ITEMS_PER_PAGE);
};

export const exportToCSV = (data, columns, filename) => {
  const headers = columns.map(c => c.label).join(',');
  const rows = data.map(item =>
    columns.map(c => {
      const value = c.key.split('.').reduce((obj, key) => obj?.[key], item);
      const escaped = String(value || '').replace(/"/g, '""');
      return `"${escaped}"`;
    }).join(',')
  );
  
  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
};

export const isOrderOverdue = (order) => {
  if (!order.deliveryDate) return false;
  const daysOverdue = Math.floor((new Date() - new Date(order.deliveryDate)) / (1000 * 60 * 60 * 24));
  return daysOverdue > 0 ? daysOverdue : 0;
};
