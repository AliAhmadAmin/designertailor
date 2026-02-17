import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { 
  Users, Scissors, Ruler, CreditCard, PieChart, ShoppingBag, 
  Plus, Search, CheckCircle, Clock, Send, Trash2, Edit3, 
  Menu, X, DollarSign, Package, UserCircle, Briefcase,
  Smartphone, Wallet, Calendar, ArrowUpRight, ArrowDownRight,
  History, PlusCircle, Save, ChevronRight, FileText, ArrowLeftRight,
  PlusSquare, Printer, Info, Check, Layers, TrendingUp, BarChart3,
  Filter, AlertCircle, Key, Settings, Activity, Cog
} from 'lucide-react';

// --- CONSTANTS ---
const ORDER_STATUSES = ['Booked', 'Cutting', 'Stitching', 'Ready', 'Delivered'];
const ITEM_TYPES = ['Shalwar Kameez', '3-Piece Suit', 'Waistcoat', 'Sherwani', 'Shirt/Pant'];
const EXPENSE_CATEGORIES = ['Rent', 'Electricity', 'Staff Refreshment', 'Materials', 'Marketing', 'Others'];
const PAYMENT_MODES = ['Cash', 'Online Transfer', 'Card', 'Cheque'];
const API_BASE = 'api';

// User Management Constants
// Roles are now custom free-form text - users can define any role name
const PERMISSIONS = {
  // Dashboard
  VIEW_DASHBOARD: 'view_dashboard',
  
  // Orders - Own vs All
  VIEW_OWN_ORDERS: 'view_own_orders',
  VIEW_ALL_ORDERS: 'view_all_orders',
  CREATE_ORDERS: 'create_orders',
  EDIT_ORDERS: 'edit_orders',
  DELETE_ORDERS: 'delete_orders',
  EDIT_ORDER_MEASUREMENTS: 'edit_order_measurements',
  
  // Customers - Own vs All
  VIEW_OWN_CUSTOMERS: 'view_own_customers',
  VIEW_ALL_CUSTOMERS: 'view_all_customers',
  CREATE_CUSTOMERS: 'create_customers',
  EDIT_CUSTOMERS: 'edit_customers',
  DELETE_CUSTOMERS: 'delete_customers',
  EDIT_CUSTOMER_MEASUREMENTS: 'edit_customer_measurements',
  
  // Workers
  VIEW_WORKERS: 'view_workers',
  CREATE_WORKERS: 'create_workers',
  EDIT_WORKERS: 'edit_workers',
  DELETE_WORKERS: 'delete_workers',
  PAY_WORKERS: 'pay_workers',
  
  // Accounts
  VIEW_ACCOUNTS: 'view_accounts',
  
  // Expenses - Own vs All
  VIEW_OWN_EXPENSES: 'view_own_expenses',
  VIEW_ALL_EXPENSES: 'view_all_expenses',
  CREATE_EXPENSES: 'create_expenses',
  EDIT_EXPENSES: 'edit_expenses',
  DELETE_EXPENSES: 'delete_expenses',
  
  // Reports - Own vs All
  VIEW_OWN_REPORTS: 'view_own_reports',
  VIEW_ALL_REPORTS: 'view_all_reports',
  
  // User Management
  MANAGE_USERS: 'manage_users'
};

// Role Permissions Mapping (for backward compatibility with existing users)
const ROLE_PERMISSIONS = {
  Admin: Object.values(PERMISSIONS),
  Manager: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_ALL_ORDERS, PERMISSIONS.CREATE_ORDERS, PERMISSIONS.EDIT_ORDERS, PERMISSIONS.EDIT_ORDER_MEASUREMENTS,
    PERMISSIONS.VIEW_ALL_CUSTOMERS, PERMISSIONS.CREATE_CUSTOMERS, PERMISSIONS.EDIT_CUSTOMERS, PERMISSIONS.EDIT_CUSTOMER_MEASUREMENTS,
    PERMISSIONS.VIEW_WORKERS, PERMISSIONS.CREATE_WORKERS, PERMISSIONS.EDIT_WORKERS, PERMISSIONS.PAY_WORKERS,
    PERMISSIONS.VIEW_ACCOUNTS,
    PERMISSIONS.VIEW_ALL_EXPENSES, PERMISSIONS.CREATE_EXPENSES,
    PERMISSIONS.VIEW_ALL_REPORTS
  ],
  Staff: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_OWN_ORDERS, PERMISSIONS.CREATE_ORDERS,
    PERMISSIONS.VIEW_OWN_CUSTOMERS, PERMISSIONS.CREATE_CUSTOMERS,
    PERMISSIONS.VIEW_WORKERS,
    PERMISSIONS.VIEW_OWN_EXPENSES, PERMISSIONS.CREATE_EXPENSES,
    PERMISSIONS.VIEW_OWN_REPORTS
  ]
};

const formatCurrency = (val) => {
  const num = Number(val || 0);
  return `${num < 0 ? '-' : ''}Rs. ${Math.abs(num).toLocaleString()}`;
};

// Professional Confirmation Modal Component
const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', type = 'warning' }) => {
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

const getStatusColor = (status) => {
  switch (status) {
    case 'Booked': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'Cutting': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'Stitching': return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'Ready': return 'bg-green-100 text-green-700 border-green-200';
    case 'Delivered': return 'bg-gray-100 text-gray-700 border-gray-200';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const StatusProgressBar = ({ currentStatus, onStatusChange, showConfirm }) => {
  const currentIndex = ORDER_STATUSES.indexOf(currentStatus);

  const handleStatusClick = (status) => {
    if (status === currentStatus) return;
    showConfirm(
      'Change Order Status',
      `Are you sure you want to change the order status to "${status}"?`,
      () => onStatusChange(status),
      'warning'
    );
  };

  const getStepColor = (status, isActive) => {
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

  const getBarColor = () => {
    switch (currentStatus) {
      case 'Booked': return 'bg-blue-500';
      case 'Cutting': return 'bg-amber-500';
      case 'Stitching': return 'bg-purple-500';
      case 'Ready': return 'bg-emerald-500';
      case 'Delivered': return 'bg-slate-600';
      default: return 'bg-indigo-600';
    }
  };

  return (
    <div className="w-full min-w-[280px] my-4 px-2">
      <div className="relative">
        <div className="absolute top-1/2 left-0 w-full h-1.5 bg-slate-100 -translate-y-1/2 rounded-full z-0"></div>
        <div className={`absolute top-1/2 left-0 h-1.5 -translate-y-1/2 rounded-full z-0 transition-all duration-500 ease-out ${getBarColor()}`} style={{ width: `${(currentIndex / (ORDER_STATUSES.length - 1)) * 100}%` }}></div>
        <div className="relative z-10 flex justify-between w-full">
          {ORDER_STATUSES.map((status, index) => {
            const isActive = index <= currentIndex;
            const isCurrent = index === currentIndex;
            const colorClass = getStepColor(status, isActive);
            return (
              <div key={status} className="flex flex-col items-center cursor-pointer group" onClick={(e) => { e.stopPropagation(); handleStatusClick(status); }}>
                <div className={`w-8 h-8 rounded-full border-4 flex items-center justify-center transition-all duration-300 shadow-lg ${colorClass} ${isCurrent ? 'scale-125 ring-4 ring-white' : 'scale-100'}`}>
                  {isActive && <Check size={14} strokeWidth={4} />}
                </div>
                <span className={`text-[9px] font-black uppercase mt-3 tracking-widest transition-colors duration-300 ${isActive ? 'text-slate-800' : 'text-slate-300'}`}>{status}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const CredentialsModal = ({ username, password, onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[999] flex items-center justify-center p-4">
      <div className="bg-white pt-5 px-6 pb-6 sm:pt-6 sm:px-8 sm:pb-8 rounded-[2rem] shadow-2xl w-full max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto no-scrollbar animate-in zoom-in-95 border-2 border-emerald-100">
        <div className="flex justify-center mb-4 sm:mb-5">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle size={24} className="sm:w-7 sm:h-7 text-emerald-600"/>
          </div>
        </div>
        <h3 className="text-lg sm:text-xl font-black text-center mb-1.5 sm:mb-2 text-slate-800">Staff Added Successfully!</h3>
        <p className="text-center text-xs sm:text-sm text-slate-500 font-medium mb-4 sm:mb-5">Login credentials have been created</p>
        
        <div className="space-y-3 sm:space-y-3.5 mb-4 sm:mb-5">
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-3 sm:p-4 rounded-xl border border-indigo-100">
            <label className="text-[9px] sm:text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5 sm:mb-2 block">Username</label>
            <div className="flex items-center justify-between gap-2 sm:gap-3 bg-white px-3 py-2 sm:py-2.5 rounded-lg border border-indigo-100">
              <span className="font-black text-sm sm:text-base text-slate-800 break-all">{username}</span>
              <button onClick={() => navigator.clipboard.writeText(username)} className="text-indigo-600 hover:text-indigo-700 p-1.5 bg-indigo-50 rounded-lg transition flex-shrink-0">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-3 sm:p-4 rounded-xl border border-purple-100">
            <label className="text-[9px] sm:text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1.5 sm:mb-2 block">Password</label>
            <div className="flex items-center justify-between gap-2 sm:gap-3 bg-white px-3 py-2 sm:py-2.5 rounded-lg border border-purple-100">
              <span className="font-black text-sm sm:text-base text-slate-800 tracking-wider break-all">{password}</span>
              <button onClick={() => navigator.clipboard.writeText(password)} className="text-purple-600 hover:text-purple-700 p-1.5 bg-purple-50 rounded-lg transition flex-shrink-0">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-3.5 mb-4 sm:mb-5 flex gap-2">
          <AlertCircle size={16} className="sm:w-[18px] sm:h-[18px] text-amber-600 flex-shrink-0 mt-0.5"/>
          <p className="text-[11px] sm:text-xs font-bold text-amber-800 leading-relaxed">
            Please note these credentials and share them with the staff member. They should change the password after first login.
          </p>
        </div>
        
        <button onClick={onClose} className="w-full py-3 sm:py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black rounded-xl uppercase text-xs sm:text-sm tracking-wider hover:from-indigo-700 hover:to-purple-700 transition shadow-lg">
          Got It!
        </button>
      </div>
    </div>
  );
};

const EditOrderModal = ({ order, onClose, onSave }) => {
    const [items, setItems] = useState(order.itemsList || []);
    const [deliveryDate, setDeliveryDate] = useState(order.deliveryDate);
    const [customerName, setCustomerName] = useState(order.customerName);
    const [customerPhone, setCustomerPhone] = useState(order.customerPhone);
    const [openEditItemDropdown, setOpenEditItemDropdown] = useState(null);

    const totalPrice = items.reduce((acc, i) => acc + (Number(i.price || 0) * Number(i.qty || 1)), 0);

    const handleSave = () => {
        onSave(order.id, {
            itemsList: items,
            deliveryDate,
            customerName,
            customerPhone,
            totalPrice
        });
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
            <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black uppercase tracking-tight">Edit Order #{order.id}</h3>
                    <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition"><X size={20}/></button>
                </div>
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Customer Name</label><input value={customerName} onChange={e=>setCustomerName(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl border-none font-bold text-sm" /></div>
                        <div><label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Phone</label><input type="tel" value={customerPhone} onChange={e=>setCustomerPhone(e.target.value.replace(/[^0-9]/g, ''))} className="w-full p-3 bg-slate-50 rounded-xl border-none font-bold text-sm" /></div>
                    </div>
                    <div><label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Delivery Date</label><input type="date" value={deliveryDate} onChange={e=>setDeliveryDate(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl border-none font-bold text-sm" /></div>
                    <div>
                        <div className="flex justify-between items-center mb-2"><label className="text-xs font-bold text-slate-400 uppercase">Items</label><button onClick={() => setItems([...items, { id: Date.now(), type: 'Shalwar Kameez', price: 1500, qty: 1, note: '' }])} className="text-[10px] font-black text-indigo-600 uppercase hover:underline">+ Add Item</button></div>
                        <div className="space-y-3">
                            {items.map((item, idx) => (
                                <div key={item.id || idx} className="p-4 bg-slate-50 rounded-xl border border-slate-100 relative">
                                    <button onClick={() => setItems(items.filter((_, i) => i !== idx))} className="absolute top-2 right-2 text-red-300 hover:text-red-600"><Trash2 size={14}/></button>
                                    <div className="grid grid-cols-3 gap-3 mb-2">
                                        <div className="col-span-2 relative" data-dropdown-container>
                                            <label className="text-[8px] font-bold text-slate-400 uppercase">Type</label>
                                            <input 
                                              value={item.type} 
                                              onChange={e => { const n = [...items]; n[idx].type = e.target.value; setItems(n); }} 
                                              onFocus={() => setOpenEditItemDropdown(`${item.id || idx}`)}
                                              onBlur={() => setTimeout(() => setOpenEditItemDropdown(null), 200)}
                                              className="w-full bg-white p-1.5 rounded-lg border-none font-bold text-xs" 
                                              placeholder="Select or type..." 
                                            />
                                            {openEditItemDropdown === `${item.id || idx}` && (
                                              <div className="absolute z-50 w-full mt-1 bg-white border-2 border-indigo-300 rounded-lg shadow-xl max-h-40 overflow-y-auto">
                                                {ITEM_TYPES.filter(t => t.toLowerCase().includes(item.type.toLowerCase())).map(t => (
                                                  <button
                                                    key={t}
                                                    type="button"
                                                    onClick={() => { const n = [...items]; n[idx].type = t; setItems(n); setOpenEditItemDropdown(null); }}
                                                    className="w-full text-left px-2 py-1.5 hover:bg-indigo-50 font-bold text-xs text-slate-800 border-b border-slate-100 last:border-b-0"
                                                  >
                                                    {t}
                                                  </button>
                                                ))}
                                                {ITEM_TYPES.filter(t => t.toLowerCase().includes(item.type.toLowerCase())).length === 0 && (
                                                  <div className="px-2 py-1.5 text-xs text-slate-400 italic">Type custom name...</div>
                                                )}
                                              </div>
                                            )}
                                        </div>
                                        <div><label className="text-[8px] font-bold text-slate-400 uppercase">Qty</label><input type="number" min="1" value={item.qty} onChange={e => { const n = [...items]; n[idx].qty = Number(e.target.value); setItems(n); }} className="w-full bg-white p-1.5 rounded-lg border-none font-bold text-xs text-center" /></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div><label className="text-[8px] font-bold text-slate-400 uppercase">Rate</label><input type="number" value={item.price} onChange={e => { const n = [...items]; n[idx].price = Number(e.target.value); setItems(n); }} className="w-full bg-white p-1.5 rounded-lg border-none font-bold text-xs" /></div>
                                        <div><label className="text-[8px] font-bold text-slate-400 uppercase">Total</label><p className="p-1.5 font-black text-indigo-700 text-xs">{formatCurrency(item.price * item.qty)}</p></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t"><span className="font-black text-lg">Total: {formatCurrency(totalPrice)}</span></div>
                </div>
                <div className="flex gap-3 mt-8">
                    <button onClick={onClose} className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold rounded-xl uppercase text-xs">Cancel</button>
                    <button onClick={handleSave} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl uppercase text-xs">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showLogin, setShowLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isHydrating, setIsHydrating] = useState(true);

  const mainContentRef = useRef(null);
  const navRef = useRef(null);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [workerPayments, setWorkerPayments] = useState([]);
  const [accounts, setAccounts] = useState([]);
  
  // Business Settings
  const [businessSettings, setBusinessSettings] = useState({
    businessName: 'Designer Tailors',
    businessPhone: '',
    businessWhatsApp: '',
    businessAddress: '',
    businessLogo: null
  });
  const [settingsModal, setSettingsModal] = useState(false);
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isSidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [credentialsModal, setCredentialsModal] = useState(null);
  const [workerRoleSelection, setWorkerRoleSelection] = useState({});
  const [workerCustomRole, setWorkerCustomRole] = useState('');
  
  // Predefined roles
  const PREDEFINED_ROLES = ['Cutter', 'Stitcher', 'Designer'];

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadState = async () => {
    try {
      setIsHydrating(true);
      setLoadError(null);
      const res = await fetch(`${API_BASE}/state.php`, { credentials: 'include' });
      if (res.status === 401) {
        setShowLogin(true);
        setIsLoading(false);
        return false;
      }
      if (!res.ok) {
        throw new Error(`Failed to load data (${res.status})`);
      }
      const data = await res.json();
      setUsers(data.users || []);
      
      // Auto-populate permissions for existing users who don't have them
      const updatedUsers = (data.users || []).map(user => {
        if (!user.permissions || user.permissions.length === 0) {
          // Assign permissions based on their role
          const rolePerms = ROLE_PERMISSIONS[user.role] || [];
          return { ...user, permissions: rolePerms };
        }
        return user;
      });
      if (JSON.stringify(updatedUsers) !== JSON.stringify(data.users || [])) {
        setUsers(updatedUsers);
      }
      
      // Auto-populate dateAdded for existing customers that don't have it
      const updatedCustomers = (data.customers || []).map(c => ({
        ...c,
        dateAdded: c.dateAdded || '2025-01-01' // Default to start of year for existing customers
      }));
      setCustomers(updatedCustomers);
      setOrders(data.orders || []);
      setExpenses(data.expenses || []);
      setWorkers(data.workers || []);
      setWorkerPayments(data.workerPayments || []);
      setAccounts(data.accounts || []);
      setIsHydrating(false);
      setIsLoading(false);
      return true;
    } catch (err) {
      setLoadError(err.message || 'Failed to load data');
      setIsLoading(false);
      setIsHydrating(false);
      return false;
    }
  };

  const loadBusinessSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/business-settings.php`);
      if (res.ok) {
        const settings = await res.json();
        setBusinessSettings({
          businessName: settings.businessName || 'Designer Tailors',
          businessPhone: settings.businessPhone || '',
          businessWhatsApp: settings.businessWhatsApp || '',
          businessAddress: settings.businessAddress || '',
          businessLogo: settings.businessLogo || null
        });
      }
    } catch (error) {
      console.log('Could not load business settings');
    }
  };

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const settingsRes = await fetch(`${API_BASE}/business-settings.php`);
        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          if (!cancelled) {
            setBusinessSettings({
              businessName: settings.businessName || 'Designer Tailors',
              businessPhone: settings.businessPhone || '',
              businessWhatsApp: settings.businessWhatsApp || '',
              businessAddress: settings.businessAddress || '',
              businessLogo: settings.businessLogo || null
            });
          }
        }

        const res = await fetch(`${API_BASE}/session.php`, { credentials: 'include' });
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setCurrentUser(data.user);
            setShowLogin(false);
            await loadState();
            return;
          }
        }
        setShowLogin(true);
        setIsLoading(false);
      } catch (err) {
        if (cancelled) return;
        setLoadError(err.message || 'Failed to load session');
        setIsLoading(false);
      }
    };

    init();
    return () => { cancelled = true; };
  }, []);

  const [viewingOrder, setViewingOrder] = useState(null);
  const [viewingCustomerId, setViewingCustomerId] = useState(null);
  const [viewingWorkerLedger, setViewingWorkerLedger] = useState(null);
  const [paymentModal, setPaymentModal] = useState(null);
  const [addWorkerModal, setAddWorkerModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editingMeasurements, setEditingMeasurements] = useState(null);
  const [openEditItemDropdown, setOpenEditItemDropdown] = useState(null);
  const [addUserModal, setAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [passwordModal, setPasswordModal] = useState(null);
  const [settingsTab, setSettingsTab] = useState('profile'); // 'profile' or 'business'
  const [profileName, setProfileName] = useState('');
  const [profileUsername] = useState('');

  // Confirmation Modal State
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'warning' });

  // Toast Notification System
  const [toasts, setToasts] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Professional Confirmation Dialog
  const showConfirm = (title, message, onConfirm, type = 'warning') => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null });
      },
      type
    });
  };

  // Filtering States
  const [dashFilter, setDashFilter] = useState('7d'); 
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Pagination States
  const [customerPageIndex, setCustomerPageIndex] = useState(0);
  const [orderPageIndex, setOrderPageIndex] = useState(0);
  const [expensePageIndex, setExpensePageIndex] = useState(0);
  const ITEMS_PER_PAGE = 50;

  // Track previous state for smart auto-save
  const prevStateRef = useRef({ users: [], customers: [], orders: [], expenses: [], workers: [], workerPayments: [], accounts: [] });
  const saveTimeoutRef = useRef(null);

  // Helper to deep compare arrays efficiently
  const hasCollectionChanged = (newData, oldData) => {
    if (newData.length !== oldData.length) return true;
    return JSON.stringify(newData) !== JSON.stringify(oldData);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      const dropdownContainer = e.target.closest('[data-dropdown-container]');
      if (!dropdownContainer) {
        setOpenEditItemDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Smart Auto-Save: Only send changed collections, increased debounce to 2.5s
  useEffect(() => {
    if (isHydrating || !currentUser) return;

    // Only check which collections have actually changed
    const changedCollections = {};
    if (hasCollectionChanged(users, prevStateRef.current.users)) changedCollections.users = users;
    if (hasCollectionChanged(customers, prevStateRef.current.customers)) changedCollections.customers = customers;
    if (hasCollectionChanged(orders, prevStateRef.current.orders)) changedCollections.orders = orders;
    if (hasCollectionChanged(expenses, prevStateRef.current.expenses)) changedCollections.expenses = expenses;
    if (hasCollectionChanged(workers, prevStateRef.current.workers)) changedCollections.workers = workers;
    if (hasCollectionChanged(workerPayments, prevStateRef.current.workerPayments)) changedCollections.workerPayments = workerPayments;
    if (hasCollectionChanged(accounts, prevStateRef.current.accounts)) changedCollections.accounts = accounts;

    // If nothing changed, skip save
    if (Object.keys(changedCollections).length === 0) return;

    // Clear previous timeout
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    // Set new timeout with increased debounce (2.5 seconds) for better batching
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSaving(true);
        // Build payload with all collections for consistency
        const payload = {
          users,
          customers,
          orders,
          expenses,
          workers,
          workerPayments,
          accounts
        };
        
        const startTime = performance.now();
        await fetch(`${API_BASE}/state.php`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const endTime = performance.now();
        console.log(`[Auto-Save] Saved ${Object.keys(changedCollections).length} collections in ${(endTime - startTime).toFixed(2)}ms`);

        // Update reference state
        prevStateRef.current = { users, customers, orders, expenses, workers, workerPayments, accounts };
        setLastSaved(new Date());
        setIsSaving(false);
      } catch (err) {
        console.error('[Auto-Save] Failed to save data:', err);
        setIsSaving(false);
        showToast('Failed to save changes', 'error');
      }
    }, 2500);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [users, customers, orders, expenses, workers, workerPayments, accounts, isHydrating, currentUser]);

  // Smart scroll to top when route changes - only if user has scrolled down significantly
  useEffect(() => {
    if (mainContentRef.current) {
      // Only scroll if user has scrolled down more than 300px (they're viewing lower content)
      const currentScroll = mainContentRef.current.scrollTop;
      if (currentScroll > 300) {
        // Scroll back to top smoothly only if user is deep in the content
        mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // If already near top, just set to absolute top without animation
        mainContentRef.current.scrollTop = 0;
      }
    }
  }, [location.pathname]);

  const hasPermission = (permission) => {
    if (!currentUser) return false;
    
    // If user has custom permissions set, use those
    if (currentUser.permissions && currentUser.permissions.length > 0) {
      return currentUser.permissions.includes(permission);
    }
    
    // Fallback to role-based permissions for existing users without custom permissions
    const rolePermissions = ROLE_PERMISSIONS[currentUser.role] || [];
    return rolePermissions.includes(permission);
  };

  // Helper to check if user can view a category (either own or all)
  const canView = (category) => {
    return hasPermission(PERMISSIONS[`VIEW_OWN_${category}`]) || hasPermission(PERMISSIONS[`VIEW_ALL_${category}`]);
  };

  // Helper function to get current user's worker name (if they are a worker)
  const getCurrentUserWorkerName = () => {
    if (!currentUser) return null;
    // Find a worker with matching name to current user
    const worker = workers.find(w => w.name.toLowerCase() === currentUser.name.toLowerCase());
    return worker ? worker.name : null;
  };

  // Filter orders based on user permissions and assignments
  const getVisibleOrders = (ordersList) => {
    if (!currentUser) return [];
    
    // Check if user has permission to view ALL orders
    if (hasPermission(PERMISSIONS.VIEW_ALL_ORDERS)) {
      return ordersList;
    }
    
    // Check if user has permission to view OWN orders only
    if (hasPermission(PERMISSIONS.VIEW_OWN_ORDERS)) {
      const workerName = getCurrentUserWorkerName();
      if (workerName) {
        // Show only orders assigned to this worker
        return ordersList.filter(o => 
          o.assignments?.cutter === workerName || 
          o.assignments?.stitcher === workerName
        );
      }
    }
    
    // No view permission at all
    return [];
  };

  // Filter customers based on user permissions
  const getVisibleCustomers = (customersList) => {
    if (!currentUser) return [];
    
    // Check if user has permission to view ALL customers
    if (hasPermission(PERMISSIONS.VIEW_ALL_CUSTOMERS)) {
      return customersList;
    }
    
    // Check if user has permission to view OWN customers only
    if (hasPermission(PERMISSIONS.VIEW_OWN_CUSTOMERS)) {
      const workerName = getCurrentUserWorkerName();
      if (workerName) {
        // Show only customers who have orders assigned to this worker
        const visibleOrders = getVisibleOrders(orders);
        const customerIds = new Set(visibleOrders.map(o => o.customerId));
        return customersList.filter(c => customerIds.has(c.id));
      }
    }
    
    // No view permission at all
    return [];
  };

  // Pagination helpers
  const getPaginatedData = (data, pageIndex) => {
    const start = pageIndex * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return data.slice(start, end);
  };

  const getTotalPages = (dataLength) => {
    return Math.ceil(dataLength / ITEMS_PER_PAGE);
  };

  // Memoize paginated data to avoid recalculation
  const paginatedCustomers = useMemo(() => {
    const visible = getVisibleCustomers(customers);
    return getPaginatedData(visible, customerPageIndex);
  }, [customers, currentUser, customerPageIndex]);

  const totalCustomerPages = useMemo(() => {
    return getTotalPages(getVisibleCustomers(customers).length);
  }, [customers, currentUser]);

  const paginatedOrders = useMemo(() => {
    const visible = getVisibleOrders(orders);
    return getPaginatedData(visible, orderPageIndex);
  }, [orders, currentUser, orderPageIndex]);

  const totalOrderPages = useMemo(() => {
    return getTotalPages(getVisibleOrders(orders).length);
  }, [orders, currentUser]);

  const paginatedExpenses = useMemo(() => {
    return getPaginatedData(expenses, expensePageIndex);
  }, [expenses, expensePageIndex]);

  const totalExpensePages = useMemo(() => {
    return getTotalPages(expenses.length);
  }, [expenses]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-bold">
        Loading data...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-red-600 font-bold">
        {loadError}
      </div>
    );
  }

  const handleLogin = async (username, password) => {
    try {
      setIsLoading(true);
      setIsHydrating(true);
      setLoadError(null);
      const res = await fetch(`${API_BASE}/login.php`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || 'Invalid credentials', 'error');
        setIsLoading(false);
        return;
      }
      if (!data.user) {
        showToast('Invalid credentials', 'error');
        setIsLoading(false);
        return;
      }
      setCurrentUser(data.user);
      setShowLogin(false);
      await loadState();
    } catch (err) {
      showToast('Login failed. Please try again.', 'error');
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/logout.php`, { method: 'POST', credentials: 'include' });
    } catch (err) {
      console.error('Logout failed', err);
    }
    setCurrentUser(null);
    setShowLogin(true);
    setIsHydrating(true);
    setUsers([]);
    setCustomers([]);
    setOrders([]);
    setExpenses([]);
    setWorkers([]);
    setWorkerPayments([]);
    setAccounts([]);
  };

  const handlePasswordChange = async (options = {}) => {
    const currentPassword = document.getElementById('currentPassword')?.value || '';
    const newPassword = document.getElementById('newPassword')?.value || '';
    const confirmPassword = document.getElementById('confirmPassword')?.value || '';

    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters long.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }
    if (options.requireCurrent && !currentPassword) {
      showToast('Please enter your current password.', 'error');
      return;
    }

    const payload = {
      newPassword
    };
    if (options.userId) {
      payload.userId = options.userId;
    }
    if (options.requireCurrent) {
      payload.currentPassword = currentPassword;
    }

    try {
      const res = await fetch(`${API_BASE}/password.php`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || 'Unable to update password', 'error');
        return;
      }
      showToast('Password updated successfully!', 'success');
      setPasswordModal(null);
    } catch (err) {
      showToast('Unable to update password.', 'error');
    }
  };

  const handleProfileSave = () => {
    const name = profileName.trim();
    const username = profileUsername.trim();
    if (!name || !username) {
      showToast('Name and username are required.', 'error');
      return;
    }

    const exists = users.find(u => u.username === username && u.id !== currentUser?.id);
    if (exists) {
      showToast('Username is already in use.', 'error');
      return;
    }

    setUsers(prev => prev.map(u => u.id === currentUser?.id ? { ...u, name, username } : u));
    setCurrentUser(prev => prev ? { ...prev, name, username } : prev);
    setSettingsModal(false);
  };

  const handleSaveBusinessSettings = async () => {
    try {
      const formData = new FormData();
      formData.append('businessName', businessSettings.businessName);
      formData.append('businessPhone', businessSettings.businessPhone);
      formData.append('businessWhatsApp', businessSettings.businessWhatsApp);
      formData.append('businessAddress', businessSettings.businessAddress);
      
      if (businessSettings.businessLogo instanceof File) {
        formData.append('logo', businessSettings.businessLogo);
      }

      const response = await fetch(`${API_BASE}/business-settings.php`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        showToast('Business settings saved successfully!', 'success');
        setSettingsModal(false);
      } else {
        const error = await response.json();
        showToast('Failed to save settings: ' + (error.error || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast('Error saving settings: ' + error.message, 'error');
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setBusinessSettings({
        ...businessSettings,
        businessLogo: file
      });
    }
  };

  // Generate Order ID with format: #ORD-Feb-26-0001
  const generateOrderId = () => {
    const now = new Date();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[now.getMonth()];
    const year = String(now.getFullYear()).slice(-2);
    
    // Count orders from current month/year
    const currentMonthOrders = orders.filter(o => {
      const oDate = new Date(o.date);
      const oMonth = monthNames[oDate.getMonth()];
      const oYear = String(oDate.getFullYear()).slice(-2);
      return oMonth === month && oYear === year;
    }).length;
    
    const sequenceNum = String(currentMonthOrders + 1).padStart(4, '0');
    return `ORD-${month}-${year}-${sequenceNum}`;
  };

  const sendWhatsApp = (phone, message) => {
    // Normalize phone number - replace leading 0 with 92 (Pakistan country code)
    let normalizedPhone = phone.replace(/[^0-9]/g, ''); // Remove all non-digits
    if (normalizedPhone.startsWith('0')) {
      normalizedPhone = '92' + normalizedPhone.slice(1); // Replace leading 0 with 92
    } else if (!normalizedPhone.startsWith('92')) {
      normalizedPhone = '92' + normalizedPhone; // Add 92 if not present
    }
    window.open(`https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const addWorker = (workerData) => {
    const newWorker = { id: `W-${Date.now()}`, ...workerData };
    setWorkers([...workers, newWorker]);
    
    // Auto-create user account for this worker
    const username = workerData.name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
    const defaultPassword = 'staff123'; // Default password for all new staff
    
    // Check if username already exists
    const usernameExists = users.some(u => u.username === username);
    if (!usernameExists) {
      const primaryRole = Array.isArray(workerData.roles) && workerData.roles.length > 0 ? workerData.roles[0] : 'Staff';
      const newUser = {
        id: `U-${Date.now()}`,
        name: workerData.name,
        username: username,
        password: defaultPassword,
        role: primaryRole,
        permissions: [
          PERMISSIONS.VIEW_DASHBOARD,
          PERMISSIONS.VIEW_OWN_ORDERS,
          PERMISSIONS.VIEW_WORKERS
        ],
        active: true,
        lastLogin: null,
        createdAt: new Date().toISOString()
      };
      setUsers([...users, newUser]);
      
      // Show professional credentials modal
      setCredentialsModal({ username, password: defaultPassword });
    }
  };

  const updateWorker = (workerId, workerData) => {
    setWorkers(prev => prev.map(w => w.id === workerId ? { ...w, ...workerData } : w));
    setEditingWorker(null);
    setWorkerRoleSelection({});
    setWorkerCustomRole('');
  };

  const deleteWorker = (id) => {
    const worker = workers.find(w => w.id === id);
    if (worker) {
      // Remove assignments from orders
      setOrders(prev => prev.map(o => ({
        ...o,
        assignments: {
          ...o.assignments,
          cutter: o.assignments.cutter === worker.name ? null : o.assignments.cutter,
          stitcher: o.assignments.stitcher === worker.name ? null : o.assignments.stitcher,
          cutterRate: o.assignments.cutter === worker.name ? 0 : o.assignments.cutterRate,
          stitcherRate: o.assignments.stitcher === worker.name ? 0 : o.assignments.stitcherRate
        }
      })));
    }
    setWorkers(workers.filter(w => w.id !== id));
  };

  const getAccountBalance = (accId) => {
    const account = accounts.find(a => a.id === accId);
    if (!account) return 0;
    
    const orderIn = orders.reduce((sum, o) => {
        return sum + o.payments.reduce((pSum, p) => {
            if (p.accountId === accId) return pSum + p.amount;
            if (!p.accountId && p.mode === account.name) return pSum + p.amount; // Legacy support
            return pSum;
        }, 0);
    }, 0);

    const expenseOut = expenses.reduce((sum, e) => {
        if (e.accountId === accId) return sum + e.amount;
        if (!e.accountId && e.mode === account.name) return sum + e.amount;
        return sum;
    }, 0);

    const workerOut = workerPayments.filter(p => p.accountId === accId).reduce((sum, p) => sum + p.amount, 0);

    return orderIn - expenseOut - workerOut;
  };

  // --- BUSINESS LOGIC ---
  const handleAddOrder = (orderData) => {
    const orderId = generateOrderId();
    const orderDateISO = new Date(orderData.orderDate).toISOString();
    const newOrder = {
      ...orderData,
      id: orderId,
      date: orderDateISO,
      status: 'Booked',
      payments: [{ date: orderDateISO, amount: Number(orderData.advance), source: 'Advance', accountId: orderData.advanceAccountId }],
      assignments: { cutter: null, stitcher: null, cutterRate: 0, stitcherRate: 0 }
    };
    setOrders([newOrder, ...orders]);
    navigate('/orders');
    
    // Enhanced WhatsApp message with emojis and formatting
    const message = `✨ *Designer Tailors - Order Confirmed* ✨

📋 *Order ID:* #${orderId}
👤 *Customer:* ${orderData.customerName}

📦 *Order Details:*
${orderData.items.map(item => `  • ${item.name} (Qty: ${item.qty})`).join('\n')}

💰 *Amount Summary:*
  Subtotal: ${formatCurrency(orderData.subtotal)}
  Discount: ${formatCurrency(orderData.discount || 0)}
  *Total: ${formatCurrency(orderData.totalPrice)}*
  ✅ Advance Received: ${formatCurrency(orderData.advance)}

📅 *Due Date:* ${new Date(orderData.dueDate).toLocaleDateString()}

Thank you for your order! 🙏`;
    
    sendWhatsApp(orderData.customerPhone, message);
  };

  const handleUpdateOrder = (orderId, orderData) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...orderData } : o));
    setEditingOrder(null);
  };

  const handleDeleteOrder = (orderId) => {
    showConfirm(
      'Delete Order',
      'Are you sure you want to delete this order? This action cannot be undone.',
      () => {
        setOrders(prev => prev.filter(o => o.id !== orderId));
        showToast('Order deleted successfully', 'success');
      },
      'danger'
    );
  };

  const addPartialPayment = (orderId, amount, accountId) => {
    setOrders(prev => prev.map(o => o.id === orderId ? {
      ...o, payments: [...o.payments, { date: new Date().toISOString(), amount: Number(amount), source: 'Partial', accountId }]
    } : o));
  };

  const updateOrderAssignment = (orderId, role, workerName, customRate) => {
    setOrders(prev => prev.map(o => o.id === orderId ? {
      ...o, assignments: { ...o.assignments, [role]: workerName, [`${role}Rate`]: Number(customRate) }
    } : o));
  };

  const updateOrderStatus = (orderId, newStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
  };

  const handleDeleteExpense = (expenseId) => {
    showConfirm(
      'Delete Expense',
      'Are you sure you want to delete this expense? This action cannot be undone.',
      () => {
        setExpenses(prev => prev.filter(e => e.id !== expenseId));
        showToast('Expense deleted successfully', 'success');
      },
      'danger'
    );
  };
  
  const handleUpdateExpense = (expenseId, expenseData) => {
    setExpenses(prev => prev.map(e => e.id === expenseId ? { ...e, ...expenseData } : e));
    setEditingExpense(null);
  };

  const handleDeleteCustomer = (customerId) => {
    showConfirm(
      'Delete Customer',
      'Are you sure you want to delete this customer? This will also delete all their orders. This action cannot be undone.',
      () => {
        setOrders(orders.filter(o => o.customerId !== customerId));
        setCustomers(prev => prev.filter(c => c.id !== customerId));
        showToast('Customer and related orders deleted successfully', 'success');
      },
      'danger'
    );
  };

  // --- EXPORT FUNCTIONS ---
  
  const exportToCSV = (data, filename) => {
    if (data.length === 0) {
      showToast('No data to export', 'warning');
      return;
    }
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape quotes and wrap in quotes if contains comma or newline
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showToast('Exported successfully!', 'success');
  };

  const exportOrders = () => {
    const exportData = orders.map(o => ({
      'Order ID': o.id,
      'Customer Name': o.customerName,
      'Phone': o.customerPhone,
      'Status': o.status,
      'Total Price': o.totalPrice,
      'Advance': o.advance || 0,
      'Balance': (o.totalPrice || 0) - (o.advance || 0),
      'Order Date': o.orderDate,
      'Delivery Date': o.deliveryDate,
      'Items': o.items?.map(i => `${i.qty}x ${i.type} @${i.price}`).join('; ') || '',
      'Cutter': o.assignments?.cutter || '',
      'Stitcher': o.assignments?.stitcher || '',
      'Created By': o.createdBy || currentUser?.username || ''
    }));
    exportToCSV(exportData, 'orders');
  };

  const exportCustomers = () => {
    const exportData = customers.map(c => {
      const customerOrders = orders.filter(o => o.customerId === c.id);
      const totalSpent = customerOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
      const totalPaid = customerOrders.reduce((sum, o) => sum + (o.advance || 0), 0);
      
      return {
        'Customer ID': c.id,
        'Name': c.name,
        'Phone': c.phone,
        'Date Added': c.dateAdded,
        'Total Orders': customerOrders.length,
        'Total Spent': totalSpent,
        'Total Paid': totalPaid,
        'Balance': totalSpent - totalPaid,
        'Profiles': c.profiles?.map(p => p.name).join('; ') || ''
      };
    });
    exportToCSV(exportData, 'customers');
  };

  const exportExpenses = () => {
    const exportData = expenses.map(e => {
      const account = accounts.find(a => a.id === e.accountId);
      return {
        'Date': e.date,
        'Category': e.category,
        'Amount': e.amount,
        'Account': account?.name || '',
        'Description': e.description || '',
        'Created By': e.createdBy || ''
      };
    });
    exportToCSV(exportData, 'expenses');
  };

  const exportReport = (startDate, endDate) => {
    const filteredOrders = orders.filter(o => {
      const orderDate = new Date(o.orderDate);
      return orderDate >= new Date(startDate) && orderDate <= new Date(endDate);
    });
    
    const filteredExpenses = expenses.filter(e => {
      const expDate = new Date(e.date);
      return expDate >= new Date(startDate) && expDate <= new Date(endDate);
    });
    
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    const totalAdvance = filteredOrders.reduce((sum, o) => sum + (o.advance || 0), 0);
    const totalExpense = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const profit = totalAdvance - totalExpense;
    
    const reportData = [{
      'Report Period': `${startDate} to ${endDate}`,
      'Total Orders': filteredOrders.length,
      'Total Revenue': totalRevenue,
      'Advance Collected': totalAdvance,
      'Total Expenses': totalExpense,
      'Net Profit': profit,
      'Completed Orders': filteredOrders.filter(o => o.status === 'Delivered').length,
      'Pending Orders': filteredOrders.filter(o => o.status !== 'Delivered').length
    }];
    
    exportToCSV(reportData, `report_${startDate}_to_${endDate}`);
  };
  
  const handleUpdateCustomer = (customerId, customerData) => {
    setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, ...customerData } : c));
    setEditingCustomer(null);
  };

  const recordWorkerPayment = (workerId, amount, accountId) => {
    const numAmt = Number(amount);
    if (!numAmt || numAmt <= 0) return;
    const newPayment = { id: Date.now(), workerId, amount: numAmt, date: new Date().toISOString(), accountId };
    setWorkerPayments([newPayment, ...workerPayments]);
  };

  const updateCustomerProfiles = (custId, newProfiles) => {
    setCustomers(prev => prev.map(c => c.id === custId ? { ...c, profiles: newProfiles } : c));
  };

  // --- FILTERED DATA CALCULATOR ---
  const getFilteredData = (range, start = '', end = '') => {
    const now = new Date();
    let filterStart = new Date();
    let filterEnd = new Date();
    filterEnd.setHours(23, 59, 59, 999);

    if (range === 'custom' && start && end) {
        filterStart = new Date(start);
        filterEnd = new Date(end);
        filterEnd.setHours(23, 59, 59, 999);
    } else {
        if (range === 'today') {
            filterStart.setHours(0,0,0,0);
        }
        else if (range === 'yesterday') {
            filterStart.setDate(now.getDate() - 1);
            filterStart.setHours(0,0,0,0);
            filterEnd.setDate(now.getDate() - 1);
            filterEnd.setHours(23,59,59,999);
        }
        else if (range === '7d') {
            filterStart.setDate(now.getDate() - 7);
            filterStart.setHours(0,0,0,0);
        }
        else if (range === 'month') {
            filterStart.setMonth(now.getMonth() - 1);
            filterStart.setHours(0,0,0,0);
        }
    }

    // First filter by user visibility (assigned orders for workers)
    const visibleOrders = getVisibleOrders(orders);
    
    // Then filter by date range
    const fOrders = visibleOrders.filter(o => {
        const d = new Date(o.date);
        return d >= filterStart && d <= filterEnd;
    });
    const fExpenses = expenses.filter(e => {
        const d = new Date(e.date);
        return d >= filterStart && d <= filterEnd;
    });
    
    const totalSales = fOrders.reduce((acc, o) => acc + o.totalPrice, 0);
    const totalCollections = fOrders.reduce((acc, o) => acc + o.payments.reduce((pa, p) => pa + p.amount, 0), 0);
    const totalExp = fExpenses.reduce((acc, e) => acc + e.amount, 0);
    
    return { fOrders, fExpenses, totalSales, totalCollections, totalExp };
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }


  // --- USER MANAGEMENT FUNCTIONS ---
  const addUser = (userData) => {
    const newUser = {
      id: `U-${Date.now()}`,
      ...userData,
      active: true,
      lastLogin: null,
      createdAt: new Date().toISOString()
    };
    setUsers([...users, newUser]);
  };

  const editUser = (userId) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setEditingUser(user);
      setSelectedPermissions(user.permissions || []);
      setAddUserModal(true);
    }
  };

  const updateUser = (userId, userData) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...userData } : u));
    setEditingUser(null);
  };

  const deleteUser = (userId) => {
    showConfirm(
      'Delete User',
      'Are you sure you want to delete this user? This action cannot be undone.',
      () => {
        setUsers(prev => prev.filter(u => u.id !== userId));
        // If deleting current user, logout
        if (currentUser?.id === userId) {
          handleLogout();
        }
        showToast('User deleted successfully', 'success');
      },
      'danger'
    );
  };

  const toggleUserStatus = (userId) => {
    setUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, active: !u.active } : u
    ));
  };

  // Handle navigation click for mobile bottom bar and sidebar
  const handleNavClick = (id) => {
    navigate('/' + (id === 'dashboard' ? '' : id.replace('user-management', 'users')));
    setViewingCustomerId(null);
    setViewingOrder(null);
    setViewingWorkerLedger(null);
  };

  // --- VIEWS ---

  const SidebarItem = ({ icon, label, id, permission }) => {
    if (permission && !hasPermission(permission)) return null;

    // Determine if this nav item is active based on current route
    const isActive = () => {
      if (id === 'dashboard') return location.pathname === '/' || location.pathname === '';
      if (id === 'user-management') return location.pathname === '/users';
      return location.pathname === `/${id}`;
    };

    const handleNavClick = () => {
      // Use the navigation function to update URL
      navigate('/' + (id === 'dashboard' ? '' : id.replace('user-management', 'users')));
      setViewingCustomerId(null);
      setViewingOrder(null);
      setViewingWorkerLedger(null);
      if (isMobile) setSidebarOpen(false);
    };

    return (
      <button
        onClick={handleNavClick}
        className={`w-full flex items-center ${isSidebarOpen ? 'justify-start gap-3 md:gap-4 px-4 md:px-6' : 'justify-center px-2'} py-3 md:py-4 transition-all duration-200 group relative ${isActive() ? `bg-indigo-600 text-white shadow-lg shadow-indigo-900/50 ${isMobile ? '' : ''}` : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
      >
        <div className="relative z-10">{icon}</div>
        {isSidebarOpen && <span className="text-xs md:text-sm font-bold tracking-wide">{label}</span>}
        {!isSidebarOpen && (
           <div className="absolute left-full ml-4 px-3 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[400] shadow-xl transition-opacity">
             {label}
           </div>
        )}
      </button>
    );
  };

  const Dashboard = () => {
    const [selectedStatus, setSelectedStatus] = useState(null);
    const { fOrders, totalSales, totalCollections, totalExp } = getFilteredData(dashFilter, customStartDate, customEndDate);
    const netFlow = totalCollections - totalExp;
    
    console.log('Dashboard rendered, fOrders:', fOrders.length);
    const getStatusIcon = (status) => {
      switch (status) {
        case 'Booked': return <Clock size={24} />;
        case 'Cutting': return <Scissors size={24} />;
        case 'Stitching': return <Activity size={24} />;
        case 'Ready': return <Package size={24} />;
        case 'Delivered': return <CheckCircle size={24} />;
        default: return <Clock size={24} />;
      }
    };
    
    const getStatusBgColor = (status) => {
      switch (status) {
        case 'Booked': return 'bg-blue-50 hover:bg-blue-100';
        case 'Cutting': return 'bg-yellow-50 hover:bg-yellow-100';
        case 'Stitching': return 'bg-orange-50 hover:bg-orange-100';
        case 'Ready': return 'bg-green-50 hover:bg-green-100';
        case 'Delivered': return 'bg-gray-50 hover:bg-gray-100';
        default: return 'bg-slate-50 hover:bg-slate-100';
      }
    };
    
    const getStatusIconColor = (status) => {
      switch (status) {
        case 'Booked': return 'text-blue-600';
        case 'Cutting': return 'text-yellow-600';
        case 'Stitching': return 'text-orange-600';
        case 'Ready': return 'text-green-600';
        case 'Delivered': return 'text-gray-600';
        default: return 'text-slate-600';
      }
    };
    
    const getStatusCardClasses = (status, isSelected) => {
      const baseClass = 'p-4 md:p-6 rounded-2xl border-2 transition-all transform hover:scale-105';
      if (isSelected) {
        switch (status) {
          case 'Booked': return `${baseClass} bg-blue-100 border-blue-600 shadow-lg`;
          case 'Cutting': return `${baseClass} bg-yellow-100 border-yellow-600 shadow-lg`;
          case 'Stitching': return `${baseClass} bg-orange-100 border-orange-600 shadow-lg`;
          case 'Ready': return `${baseClass} bg-green-100 border-green-600 shadow-lg`;
          case 'Delivered': return `${baseClass} bg-gray-100 border-gray-600 shadow-lg`;
          default: return `${baseClass} bg-slate-100 border-slate-600 shadow-lg`;
        }
      }
      switch (status) {
        case 'Booked': return `${baseClass} bg-blue-50 border-slate-200 hover:border-blue-200`;
        case 'Cutting': return `${baseClass} bg-yellow-50 border-slate-200 hover:border-yellow-200`;
        case 'Stitching': return `${baseClass} bg-orange-50 border-slate-200 hover:border-orange-200`;
        case 'Ready': return `${baseClass} bg-green-50 border-slate-200 hover:border-green-200`;
        case 'Delivered': return `${baseClass} bg-gray-50 border-slate-200 hover:border-gray-200`;
        default: return `${baseClass} bg-slate-50 border-slate-200 hover:border-slate-200`;
      }
    };
    
    const filteredFOrders = selectedStatus === 'overdue' ? fOrders.filter(o => o.totalPrice - o.payments.reduce((a,b)=>a+b.amount,0) > 0) : selectedStatus ? fOrders.filter(o => o.status === selectedStatus) : fOrders;

    return (
      <div className="space-y-4 md:space-y-6 lg:space-y-8 animate-in fade-in duration-500">
        <header className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 md:gap-6">
          <div className="w-full">
            <div className="flex flex-wrap gap-2">
              {['today', 'yesterday', '7d', 'month', 'custom'].map(r => (
                <button 
                  key={r} 
                  onClick={() => setDashFilter(r)}
                  className={`px-3 md:px-4 py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border transition-all ${dashFilter === r ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'}`}
                >
                  {r}
                </button>
              ))}
              {dashFilter === 'custom' && (
                <div className="flex items-center gap-2 animate-in slide-in-from-left-2">
                    <input type="date" value={customStartDate} onChange={e=>setCustomStartDate(e.target.value)} className="text-[10px] border rounded-lg p-1 outline-none focus:ring-1 ring-indigo-500"/>
                    <span className="text-[10px] font-bold">TO</span>
                    <input type="date" value={customEndDate} onChange={e=>setCustomEndDate(e.target.value)} className="text-[10px] border rounded-lg p-1 outline-none focus:ring-1 ring-indigo-500"/>
                </div>
              )}
            </div>
          </div>
          {hasPermission(PERMISSIONS.CREATE_ORDERS) && <button onClick={() => navigate('/booking')} className="bg-indigo-600 text-white px-4 md:px-8 py-2.5 md:py-4 rounded-xl md:rounded-3xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition hover:scale-[1.02] inline-flex items-center gap-2 w-full md:w-auto justify-center text-xs md:text-base whitespace-nowrap"><PlusCircle size={18} className="md:w-6 md:h-6"/> New Booking</button>}
        </header>

        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-lg">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-black text-sm md:text-base uppercase tracking-widest text-slate-700">Order Status Overview</h3>
              {selectedStatus && <button onClick={() => setSelectedStatus(null)} className="text-xs md:text-sm font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest px-3 py-1 bg-indigo-50 rounded-lg">Clear Filter</button>}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                <button onClick={() => setSelectedStatus(null)} className={`group p-5 md:p-7 rounded-3xl border-2 transition-all transform hover:scale-105 duration-200 flex flex-col items-center ${!selectedStatus ? 'bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-500 shadow-xl' : 'bg-white border-slate-200 hover:border-indigo-300'}`}>
                  <p className={`text-2xl md:text-3xl font-black ${!selectedStatus ? 'text-indigo-700' : 'text-slate-700 group-hover:text-indigo-600'}`}>{fOrders.length}</p>
                  <p className={`text-[10px] md:text-xs font-bold uppercase tracking-widest mt-3 ${!selectedStatus ? 'text-indigo-600' : 'text-slate-500 group-hover:text-indigo-600'}`}>All Orders</p>
                </button>
                {ORDER_STATUSES.map(s => {
                    const count = fOrders.filter(o => o.status === s).length;
                    const isSelected = selectedStatus === s;
                    const getGradient = () => {
                      switch(s) {
                        case 'Booked': return isSelected ? 'from-blue-50 to-blue-100' : 'hover:from-blue-50 hover:to-blue-50';
                        case 'Cutting': return isSelected ? 'from-yellow-50 to-yellow-100' : 'hover:from-yellow-50 hover:to-yellow-50';
                        case 'Stitching': return isSelected ? 'from-orange-50 to-orange-100' : 'hover:from-orange-50 hover:to-orange-50';
                        case 'Ready': return isSelected ? 'from-green-50 to-green-100' : 'hover:from-green-50 hover:to-green-50';
                        case 'Delivered': return isSelected ? 'from-gray-50 to-gray-100' : 'hover:from-gray-50 hover:to-gray-50';
                        default: return '';
                      }
                    };
                    return (
                        <button 
                          key={s} 
                          onClick={() => setSelectedStatus(s)}
                          className={`group p-5 md:p-7 rounded-3xl border-2 transition-all transform hover:scale-105 duration-200 flex flex-col items-center bg-gradient-to-br ${getGradient()} ${isSelected ? `border-${s === 'Booked' ? 'blue' : s === 'Cutting' ? 'yellow' : s === 'Stitching' ? 'orange' : s === 'Ready' ? 'green' : 'gray'}-500 shadow-xl` : `border-slate-200 hover:border-${s === 'Booked' ? 'blue' : s === 'Cutting' ? 'yellow' : s === 'Stitching' ? 'orange' : s === 'Ready' ? 'green' : 'gray'}-300`}`}
                        >
                            <div className={`${getStatusIconColor(s)} ${isSelected ? 'scale-125' : ''} transition-transform duration-200 mb-2`}>{getStatusIcon(s)}</div>
                            <p className={`text-2xl md:text-3xl font-black ${getStatusIconColor(s)}`}>{count}</p>
                            <p className={`text-[10px] md:text-xs font-bold uppercase tracking-widest mt-3 ${isSelected ? 'text-slate-700' : 'text-slate-600 group-hover:text-slate-700'}`}>{s}</p>
                        </button>
                    )
                })}
                <button onClick={() => setSelectedStatus('overdue')} className={`group p-5 md:p-7 rounded-3xl border-2 transition-all transform hover:scale-105 duration-200 flex flex-col items-center bg-gradient-to-br ${selectedStatus === 'overdue' ? 'from-red-50 to-red-100' : 'hover:from-red-50 hover:to-red-50'} ${selectedStatus === 'overdue' ? 'border-red-500 shadow-xl' : 'border-slate-200 hover:border-red-300'}`}>
                    <div className={`text-red-600 ${selectedStatus === 'overdue' ? 'scale-125' : ''} transition-transform duration-200 mb-2`}><AlertCircle size={24} /></div>
                    <p className="text-2xl md:text-3xl font-black text-red-600">
                        {fOrders.filter(o => o.totalPrice - o.payments.reduce((a,b)=>a+b.amount,0) > 0).length}
                    </p>
                    <p className={`text-[10px] md:text-xs font-bold uppercase tracking-widest mt-3 ${selectedStatus === 'overdue' ? 'text-red-700' : 'text-slate-600 group-hover:text-red-700'}`}>Overdue</p>
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
          <section className="lg:col-span-2 bg-white p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-[3rem] border border-slate-100 shadow-sm">
             <div className="flex items-center justify-between mb-4 md:mb-6">
               <h2 className="text-lg md:text-xl font-black uppercase tracking-tighter flex items-center gap-2"><Clock size={18} className="md:w-5 md:h-5 text-indigo-600"/> {selectedStatus ? (selectedStatus === 'overdue' ? 'Overdue Payments' : selectedStatus) : 'Activity Feed'}</h2>
               {selectedStatus && <span className={`text-[9px] font-black px-3 py-1 rounded-full ${selectedStatus === 'overdue' ? 'bg-red-100 text-red-600' : getStatusColor(selectedStatus)}`}>{filteredFOrders.length}</span>}
             </div>
             <div className="divide-y max-h-[300px] md:max-h-[400px] overflow-y-auto no-scrollbar pr-2">
                {filteredFOrders.map(o => (
                  <div key={o.id} className="py-3 md:py-4 flex justify-between items-center group cursor-pointer hover:bg-slate-50 -mx-2 md:-mx-4 px-2 md:px-4 rounded-lg transition-colors" onClick={() => setViewingOrder(o)}>
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-slate-400 shadow-inner group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all text-sm md:text-base">{o.customerName[0]}</div>
                      <div><p className="font-black text-sm">{o.customerName}</p><p className="text-[9px] md:text-[10px] text-slate-400 uppercase font-black tracking-widest">#{o.id} • {new Date(o.date).toLocaleDateString()}</p></div>
                    </div>
                    <div className="text-right">
                       <p className="font-black text-indigo-600 text-sm">{formatCurrency(o.totalPrice)}</p>
                       <span className={`text-[7px] md:text-[8px] font-black px-2 md:px-3 py-1 rounded-full border uppercase tracking-widest ${getStatusColor(o.status)}`}>{o.status}</span>
                    </div>
                  </div>
                ))}
                {filteredFOrders.length === 0 && <p className="py-20 text-center text-slate-300 font-bold uppercase text-xs tracking-widest">No orders found</p>}
             </div>
          </section>
          
          <section className="bg-indigo-900 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col justify-between h-48">
             <div className="relative z-10">
                <h3 className="text-indigo-300 font-black uppercase text-xs tracking-[0.3em] mb-4">Cash Flow</h3>
                <p className="text-2xl font-black leading-tight tracking-tight">
                  {netFlow >= 0 ? 'Period Net Profit:' : 'Period Net Loss:'}<br/>
                  <span className={netFlow >= 0 ? "text-emerald-400" : "text-red-400"}>{formatCurrency(netFlow)}</span>
                </p>
             </div>
             <Layers size={180} className="absolute -bottom-10 -right-10 text-white/5 rotate-12" />
          </section>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          <StatCard title="Orders Found" value={fOrders.length} color="bg-blue-50 text-blue-600" />
          <StatCard title="Booking Value" value={formatCurrency(totalSales)} color="bg-emerald-50 text-emerald-600" />
          <StatCard title="Collections" value={formatCurrency(totalCollections)} color="bg-orange-50 text-orange-600" />
          <StatCard title="Expenses" value={formatCurrency(totalExp)} color="bg-red-50 text-red-600" />
        </div>
      </div>
    );
  };

  const OrderForm = () => {
    const [bookingType, setBookingType] = useState(null);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [items, setItems] = useState([{ id: Date.now(), type: 'Shalwar Kameez', price: 1500, qty: 1, note: '' }]);
    const [orderMeasures, setOrderMeasures] = useState([{ id: Date.now(), profileName: '', measurements: {} }]);
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [advance, setAdvance] = useState('');
    const [advanceAccountId, setAdvanceAccountId] = useState(accounts[0]?.id || '');
    const [openItemDropdown, setOpenItemDropdown] = useState(null);
    const [orderDate, setOrderDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [deliveryDate, setDeliveryDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        return d.toISOString().split('T')[0];
    });

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (e) => {
        const dropdownContainer = e.target.closest('[data-dropdown-container]');
        if (!dropdownContainer) {
          setOpenItemDropdown(null);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery));
    const totalPrice = items.reduce((acc, i) => acc + (Number(i.price || 0) * Number(i.qty || 1)), 0);

    const handleConfirm = () => {
      if (bookingType === 'new' && (!customerName || !customerPhone)) {
        showToast('Please fill in customer name and phone number.', 'warning');
        return;
      }

      let finalCust = selectedCustomer;
      if (bookingType === 'new') {
        const newC = { id: `CUST-${Date.now()}`, name: customerName, phone: customerPhone, dateAdded: new Date().toISOString().split('T')[0], profiles: orderMeasures.map(m => ({ name: m.profileName || customerName, data: m.measurements, styling: m.styling || '' })) };
        setCustomers([...customers, newC]);
        finalCust = newC;
      } else {
        const existingProfiles = [...selectedCustomer.profiles];
        orderMeasures.forEach(om => {
            const idx = existingProfiles.findIndex(p => p.name === om.profileName);
            if (idx > -1) { existingProfiles[idx].data = om.measurements; existingProfiles[idx].styling = om.styling || ''; }
            else existingProfiles.push({ name: om.profileName, data: om.measurements, styling: om.styling || '' });
        });
        setCustomers(customers.map(c => c.id === selectedCustomer.id ? { ...c, profiles: existingProfiles } : c));
        finalCust = { ...selectedCustomer, name: customerName, phone: customerPhone };
      }
      handleAddOrder({ customerId: finalCust.id, customerName: finalCust.name, customerPhone: finalCust.phone, itemsList: items, totalPrice, advance, orderDate, deliveryDate, measurements: orderMeasures, advanceAccountId });
    };

    if (!bookingType) return (
      <div className="max-w-xl mx-auto py-20 text-center animate-in zoom-in-95 duration-300">
        <h2 className="text-3xl font-black text-slate-800 mb-10 tracking-tight">New Order Booking</h2>
        <div className="grid grid-cols-2 gap-6">
          <button onClick={() => setBookingType('new')} className="p-12 border-4 border-slate-100 rounded-[4rem] bg-white transition-all flex flex-col items-center gap-6 group hover:shadow-2xl hover:scale-[1.02] hover:border-indigo-600 shadow-sm">
            <div className="p-8 bg-slate-50 rounded-[2.5rem] text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner"><PlusSquare size={40}/></div>
            <span className="text-xl font-black tracking-tighter text-slate-800 uppercase">New Client</span>
          </button>
          <button onClick={() => setBookingType('existing')} className="p-12 border-4 border-slate-100 rounded-[4rem] bg-white transition-all flex flex-col items-center gap-6 group hover:shadow-2xl hover:scale-[1.02] hover:border-emerald-600 shadow-sm">
            <div className="p-8 bg-slate-50 rounded-[2.5rem] text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-inner"><Users size={40}/></div>
            <span className="text-xl font-black tracking-tighter text-slate-800 uppercase">Existing Client</span>
          </button>
        </div>
      </div>
    );

    return (
      <div className="max-w-6xl mx-auto bg-gradient-to-br from-white to-indigo-50/30 p-4 md:p-6 rounded-[2rem] shadow-2xl border-2 border-indigo-100 space-y-6 animate-in slide-in-from-bottom duration-500">
        <div className="flex justify-between items-center border-b-2 border-indigo-200 pb-3">
          <h2 className="text-2xl md:text-3xl font-black uppercase bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tighter">Booking Portal</h2>
          <button onClick={() => setBookingType(null)} className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition"><X size={20}/></button>
        </div>

        {bookingType === 'existing' && !selectedCustomer && (
          <div className="space-y-4">
            <div className="relative"><Search className="absolute left-4 top-4 text-slate-400"/><input autoFocus placeholder="Search client ledger..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 outline-none font-medium"/></div>
            <div className="max-h-60 overflow-y-auto no-scrollbar space-y-2">
              {filteredCustomers.map(c => <button key={c.id} onClick={()=>{setSelectedCustomer(c); setCustomerName(c.name); setCustomerPhone(c.phone); setOrderMeasures(c.profiles.map((p,i)=>({id:i, profileName: p.name, measurements: p.data, styling: p.styling || ''})));}} className="w-full p-4 bg-slate-50 text-left rounded-2xl hover:bg-indigo-50 transition border border-transparent hover:border-indigo-100 font-bold">{c.name} - {c.phone}</button>)}
            </div>
          </div>
        )}

        {(bookingType === 'new' || selectedCustomer) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-5">
              <section className="space-y-3">
                <h3 className="font-black text-xs uppercase tracking-wide text-indigo-600 flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-lg"><UserCircle size={16}/> Identity</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><label className="text-[10px] font-black text-indigo-600 uppercase">Full Name</label><input disabled={bookingType==='existing'} value={customerName} onChange={e=>setCustomerName(e.target.value)} className="w-full p-2.5 bg-white rounded-xl border-2 border-indigo-200 font-bold text-sm text-slate-800 focus:border-indigo-500 outline-none transition" /></div>
                  <div className="space-y-1"><label className="text-[10px] font-black text-indigo-600 uppercase">Phone</label><input type="tel" disabled={bookingType==='existing'} value={customerPhone} onChange={e=>setCustomerPhone(e.target.value.replace(/[^0-9]/g, ''))} className="w-full p-2.5 bg-white rounded-xl border-2 border-indigo-200 font-bold text-sm text-slate-800 focus:border-indigo-500 outline-none transition" /></div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="font-black text-xs uppercase tracking-wide text-purple-600 flex items-center gap-2 bg-purple-50 px-3 py-1.5 rounded-lg"><Package size={16}/> Order Items</h3>
                <div className="space-y-3">
                   {items.map((item, idx) => (
                     <div key={item.id} className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-200 relative group animate-in zoom-in-95 shadow-sm">
                       <button onClick={() => setItems(items.filter(i => i.id !== item.id))} className="absolute top-2 right-2 p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"><Trash2 size={16}/></button>
                       <div className="grid grid-cols-3 gap-3 mb-2">
                         <div className="col-span-2 relative" data-dropdown-container>
                           <label className="text-[10px] font-black uppercase text-indigo-600 mb-0.5 block">Type</label>
                           <input 
                             value={item.type} 
                             onChange={e => { const n = [...items]; n[idx].type = e.target.value; setItems(n); }} 
                             onFocus={() => setOpenItemDropdown(item.id)}
                             onBlur={() => setTimeout(() => setOpenItemDropdown(null), 200)}
                             className="w-full bg-white p-2 rounded-lg border-2 border-indigo-200 font-bold text-sm text-slate-800 focus:border-indigo-500 outline-none transition" 
                             placeholder="Select or type custom..." 
                           />
                           {openItemDropdown === item.id && (
                             <div className="absolute z-50 w-full mt-1 bg-white border-2 border-indigo-300 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                               {ITEM_TYPES.filter(t => t.toLowerCase().includes(item.type.toLowerCase())).map(t => (
                                 <button
                                   key={t}
                                   type="button"
                                   onClick={() => { const n = [...items]; n[idx].type = t; setItems(n); setOpenItemDropdown(null); }}
                                   className="w-full text-left px-3 py-2 hover:bg-indigo-50 font-bold text-sm text-slate-800 border-b border-indigo-100 last:border-b-0"
                                 >
                                   {t}
                                 </button>
                               ))}
                               {ITEM_TYPES.filter(t => t.toLowerCase().includes(item.type.toLowerCase())).length === 0 && (
                                 <div className="px-3 py-2 text-sm text-slate-400 italic">Type custom name...</div>
                               )}
                             </div>
                           )}
                         </div>
                         <div><label className="text-[10px] font-black uppercase text-indigo-600 mb-0.5 block">Qty</label><input type="number" min="1" value={item.qty} onChange={e => { const n = [...items]; n[idx].qty = Number(e.target.value); setItems(n); }} className="w-full bg-white p-2 rounded-lg border-2 border-indigo-200 font-bold text-sm text-slate-800 text-center focus:border-indigo-500 outline-none transition" /></div>
                       </div>
                       <div className="grid grid-cols-2 gap-3">
                          <div><label className="text-[10px] font-black uppercase text-indigo-600 mb-0.5 block">Rate</label><input type="number" value={item.price} onChange={e => { const n = [...items]; n[idx].price = Number(e.target.value); setItems(n); }} className="w-full bg-white p-2 rounded-lg border-2 border-indigo-200 font-bold text-sm text-slate-800 focus:border-indigo-500 outline-none transition" /></div>
                          <div><label className="text-[10px] font-black uppercase text-indigo-600 mb-0.5 block">Total</label><p className="p-2 font-black text-base text-indigo-700">{formatCurrency(item.price * item.qty)}</p></div>
                       </div>
                     </div>
                   ))}
                   <button onClick={() => setItems([...items, { id: Date.now(), type: 'Shalwar Kameez', price: 1500, qty: 1, note: '' }])} className="w-full py-3 border-2 border-dashed border-indigo-300 rounded-2xl text-indigo-600 font-black text-xs uppercase tracking-widest hover:bg-indigo-100 transition flex items-center justify-center gap-2"><Plus size={18}/> Add Item</button>
                </div>
              </section>

              <section className="pt-4 border-t-2 border-indigo-200 space-y-3">
                 <div className="flex justify-between items-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2.5 rounded-xl shadow-lg"><span className="text-lg font-black uppercase tracking-tighter">Total: {formatCurrency(totalPrice)}</span></div>
                 <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1"><label className="text-[10px] font-black text-emerald-600 uppercase">Advance</label><input type="number" value={advance} onChange={e=>setAdvance(e.target.value)} placeholder="0" className="w-full p-2 bg-emerald-50 rounded-lg border-2 border-emerald-200 font-bold text-sm text-emerald-700 focus:border-emerald-500 outline-none transition" /></div>
                    <div className="space-y-1"><label className="text-[10px] font-black text-blue-600 uppercase">Order Date</label><input type="date" value={orderDate} onChange={e=>setOrderDate(e.target.value)} className="w-full p-2 bg-blue-50 rounded-lg border-2 border-blue-200 font-bold text-sm text-blue-700 outline-none focus:border-blue-500 transition" /></div>
                    <div className="space-y-1"><label className="text-[10px] font-black text-orange-600 uppercase">Delivery</label><input type="date" value={deliveryDate} onChange={e=>setDeliveryDate(e.target.value)} className="w-full p-2 bg-orange-50 rounded-lg border-2 border-orange-200 font-bold text-sm text-orange-700 outline-none focus:border-orange-500 transition" /></div>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-indigo-600 uppercase">Deposit Account</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {accounts.map(a => (
                        <button
                          key={a.id}
                          onClick={() => setAdvanceAccountId(a.id)}
                          className={`p-2.5 rounded-lg border-2 font-bold text-sm transition-all ${
                            advanceAccountId === a.id 
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-300' 
                              : 'bg-white text-slate-800 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50'
                          }`}
                        >
                          {a.name}
                        </button>
                      ))}
                    </div>
                 </div>
                 <button onClick={handleConfirm} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-black text-base shadow-xl hover:shadow-2xl hover:scale-[1.01] transition-all flex items-center justify-center gap-2"><Save size={20}/> Confirm Order</button>
              </section>
            </div>

            <div className="space-y-6 lg:pl-8 lg:border-l-2 border-indigo-200">
               <h3 className="font-black text-sm uppercase tracking-wide text-teal-600 flex items-center gap-2 bg-teal-50 px-4 py-2 rounded-xl"><Ruler size={18}/> Measurement Sets</h3>
               <div className="space-y-8">
                 {orderMeasures.map((om, omIdx) => (
                   <div key={om.id} className="space-y-4 p-4 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl border-2 border-teal-200 relative group shadow-sm">
                     {orderMeasures.length > 1 && <button onClick={() => setOrderMeasures(orderMeasures.filter(m => m.id !== om.id))} className="absolute top-3 right-3 p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"><Trash2 size={16}/></button>}
                     <div className="w-full"><label className="text-sm font-black text-indigo-600 uppercase mb-2 block">Measurements</label><input value={om.profileName || (omIdx === 0 ? customerName : '')} onChange={e => { const n = [...orderMeasures]; n[omIdx].profileName = e.target.value; setOrderMeasures(n); }} className="w-full bg-white p-3 rounded-xl border-2 border-indigo-200 outline-none font-black text-base text-indigo-900 focus:border-indigo-500 transition" placeholder={omIdx === 0 && customerName ? customerName : 'e.g., Self, Son, Daughter'} /></div>
                     <div className="grid grid-cols-3 gap-3">
                       {['Length', 'Shoulder', 'Chest', 'Waist', 'Sleeve', 'Daman', 'Collar', 'Pant Length', 'Ghera'].map(m => (
                         <div key={m}><label className="text-[10px] font-black text-teal-600 uppercase mb-0.5 block">{m}</label><input value={om.measurements[m.toLowerCase()] || ''} onChange={e => { const n = [...orderMeasures]; n[omIdx].measurements[m.toLowerCase()] = e.target.value; setOrderMeasures(n); }} className="w-full bg-white p-2 rounded-lg border-2 border-teal-200 font-bold text-sm text-slate-800 focus:border-teal-500 outline-none transition" placeholder='0"' /></div>
                       ))}
                       <div className="col-span-3"><label className="text-[10px] font-black text-teal-600 uppercase mb-0.5 block">Styling Note</label><textarea value={om.styling || ''} onChange={e => { const n = [...orderMeasures]; n[omIdx].styling = e.target.value; setOrderMeasures(n); }} className="w-full bg-white p-2 rounded-lg border-2 border-teal-200 font-bold text-sm text-slate-800 resize-none focus:border-teal-500 outline-none transition" rows={2} placeholder="Styling details..." /></div>
                     </div>
                   </div>
                 ))}
                 <button onClick={() => setOrderMeasures([...orderMeasures, { id: Date.now(), profileName: orderMeasures.length === 0 ? customerName : `Person ${orderMeasures.length + 1}`, measurements: {} }])} className="w-full py-3 border-2 border-dashed border-teal-300 rounded-xl text-teal-600 font-black text-xs uppercase tracking-widest hover:bg-teal-100 transition flex items-center justify-center gap-2"><Layers size={18}/> Add Set</button>
               </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const OrderList = () => {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [overdueOnly, setOverdueOnly] = useState(false);
    const [assigningWorker, setAssigningWorker] = useState(null);
    const [customRate, setCustomRate] = useState(0);

    // First filter by user visibility (assigned orders for workers)
    const visibleOrders = getVisibleOrders(orders);
    
    // Apply search and status filters, then sort by latest orders first
    const filtered = visibleOrders.filter(o => {
        const matchesSearch = o.customerName.toLowerCase().includes(search.toLowerCase()) || o.customerPhone.includes(search);
        const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
        const matchesOverdue = !overdueOnly || (o.totalPrice - o.payments.reduce((a,b)=>a+b.amount,0) > 0);
        return matchesSearch && matchesStatus && matchesOverdue;
    }).sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by newest first

    // Get paginated results from filtered data
    const displayedOrders = filtered.slice(0, (orderPageIndex + 1) * ITEMS_PER_PAGE);
    const hasMoreOrders = filtered.length > displayedOrders.length;

    return (
      <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500">
        <header className="flex flex-col gap-4 md:gap-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tighter">Orders Management</h2>
              <p className="text-xs md:text-sm text-slate-400 mt-1">{filtered.length} total • {displayedOrders.length} showing</p>
            </div>
            <div className="relative flex-1 md:w-96"><Search className="absolute left-4 top-3 text-slate-400 md:w-5 md:h-5" size={18}/><input placeholder="Find order..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full pl-10 md:pl-12 pr-4 py-2 md:py-3 bg-white border border-slate-100 rounded-xl md:rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm md:text-base"/></div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <Filter size={14} className="md:w-4 md:h-4 text-slate-400 mr-2" />
            {['All', ...ORDER_STATUSES].map(s => (
                <button key={s} onClick={() => { setStatusFilter(s); setOrderPageIndex(0); }} className={`px-3 md:px-4 py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border transition-all ${statusFilter === s ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'}`}>{s}</button>
            ))}
            <div className="h-6 w-px bg-slate-200 mx-2"></div>
            <button onClick={() => { setOverdueOnly(!overdueOnly); setOrderPageIndex(0); }} className={`px-3 md:px-4 py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${overdueOnly ? 'bg-red-600 text-white shadow-lg border-red-600' : 'bg-white text-red-500 border-red-100 hover:bg-red-50'}`}>
                <AlertCircle size={12} className="md:w-3.5 md:h-3.5"/> Overdue Payments
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-2 md:gap-3">
          {displayedOrders.map(o => {
            const isOverdue = new Date(o.deliveryDate) < new Date() && o.status !== 'Delivered';
            const daysOverdue = isOverdue ? Math.floor((new Date() - new Date(o.deliveryDate)) / (1000 * 60 * 60 * 24)) : 0;
            
            return (
            <div key={o.id} onClick={() => setViewingOrder(o)} className={`bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border shadow-sm hover:shadow-xl transition-all group flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 md:gap-3 relative cursor-pointer ${isOverdue ? 'border-red-300 bg-red-50/20' : 'border-slate-100'}`}>
              {isOverdue && (
                <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-0.5 rounded-md text-[8px] font-black uppercase flex items-center gap-1">
                  <AlertCircle size={10} />
                  <span>{daysOverdue}d overdue</span>
                </div>
              )}
              <div className="flex gap-2 md:gap-3 items-center">
                <div className="w-11 h-11 md:w-12 md:h-12 bg-indigo-50 text-indigo-600 rounded-lg md:rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner"><Package size={20} className="md:w-6 md:h-6"/></div>
                <div className="gap-1 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-black text-base md:text-lg text-slate-800">{o.customerName} <span className="text-[8px] md:text-[9px] font-bold text-slate-300 ml-1">#{o.id}</span></h4>
                    <span className={`px-2 py-0.5 rounded-md text-[8px] md:text-[9px] font-black uppercase border ${getStatusColor(o.status)}`}>
                      {o.status}
                    </span>
                  </div>
                  <p className="text-[10px] md:text-[11px] font-medium text-slate-500">{o.itemsList?.reduce((a,c)=>a+c.qty, 0)} items • {o.customerPhone}</p>
                  <div className="flex gap-1 mt-1">
                    <WorkerBadge label="Cutter" name={o.assignments.cutter} onClick={(e) => { e.stopPropagation(); setAssigningWorker({ orderId: o.id, role: 'cutter' }); }} />
                    <WorkerBadge label="Stitcher" name={o.assignments.stitcher} onClick={(e) => { e.stopPropagation(); setAssigningWorker({ orderId: o.id, role: 'stitcher' }); }} />
                  </div>
                </div>
              </div>

              <div className="flex flex-col lg:items-end justify-between gap-2 md:gap-3 w-full lg:w-auto">
                <div className="flex gap-3 md:gap-4 items-center bg-slate-50 p-2 md:p-3 rounded-lg md:rounded-xl border border-slate-100 w-full lg:w-56">
                  <div className="flex-1 text-center border-r"><p className="text-[7px] md:text-[8px] font-bold text-slate-400 uppercase">Bill</p><p className="font-bold text-[11px] md:text-sm">{formatCurrency(o.totalPrice)}</p></div>
                  <div className="flex-1 text-center"><p className="text-[7px] md:text-[8px] font-bold uppercase text-red-400">Due</p><p className="font-bold text-red-600 text-[11px] md:text-sm">{formatCurrency(o.totalPrice - o.payments.reduce((a,b)=>a+b.amount,0))}</p></div>
                </div>
                <div className="flex gap-1.5 w-full">
                   <button onClick={(e) => { e.stopPropagation(); setPaymentModal({ id: o.id, type: 'order' }); }} className="flex-1 py-2 md:py-2.5 bg-emerald-600 text-white text-[8px] md:text-[9px] font-black uppercase tracking-widest rounded-lg md:rounded-lg hover:bg-emerald-700 active:scale-95 transition flex items-center justify-center gap-1 shadow-md"><DollarSign size={12} className="md:w-3 md:h-3"/> Add Payment</button>
                   <button onClick={(e) => { e.stopPropagation(); setViewingOrder(o); }} className="flex-1 py-2 md:py-2.5 bg-slate-900 text-white text-[8px] md:text-[9px] font-black uppercase tracking-widest rounded-lg md:rounded-lg hover:bg-slate-800 active:scale-95 transition shadow-md">View</button>
                </div>
              </div>
            </div>
          );
          })}
          {displayedOrders.length === 0 && <div className="py-20 text-center opacity-10"><Package size={100} className="mx-auto mb-4"/><p className="text-2xl font-black">No active orders</p></div>}
        </div>

        {/* Load More Button for Orders */}
        {hasMoreOrders && (
          <div className="flex justify-center mt-6">
            <button 
              onClick={() => setOrderPageIndex(orderPageIndex + 1)}
              className="px-6 md:px-8 py-3 md:py-4 bg-indigo-600 text-white font-bold rounded-xl md:rounded-2xl hover:bg-indigo-700 transition shadow-lg"
            >
              Load More Orders ({displayedOrders.length} / {filtered.length})
            </button>
          </div>
        )}

        {assigningWorker && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-2xl w-full max-w-sm">
              <h3 className="text-xl font-bold mb-6">Assign {assigningWorker.role}</h3>
              <div className="space-y-4">
                <select className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" id="workerSelect" onChange={e => {
                  const w = workers.find(work => work.name === e.target.value);
                  setCustomRate(w?.ratePerSuit || 0);
                }}>
                  <option value="">Select Staff...</option>
                  {(() => {
                    // First try to filter by role
                    const filteredByRole = workers.filter(w => {
                      const workerRoles = Array.isArray(w.roles) ? w.roles : (w.role ? [w.role] : []);
                      return workerRoles.some(r => r && r.toLowerCase() === assigningWorker.role.toLowerCase());
                    });
                    
                    // If no workers found with this role, show all workers
                    const workersToShow = filteredByRole.length > 0 ? filteredByRole : workers;
                    
                    return workersToShow.map(w => {
                      const rolesText = Array.isArray(w.roles) ? w.roles.join(', ') : (w.role || 'Unassigned');
                      return <option key={w.id} value={w.name}>{w.name} ({rolesText})</option>;
                    });
                  })()}
                </select>
                <div><label className="text-xs font-bold text-slate-400 mb-1 block uppercase">Custom Rate</label><input type="number" value={customRate} onChange={e=>setCustomRate(e.target.value)} className="w-full p-4 bg-indigo-50 text-indigo-700 rounded-2xl font-black text-2xl border-none outline-none" /></div>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => setAssigningWorker(null)} className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold rounded-2xl">Cancel</button>
                  <button onClick={() => {
                    const select = document.getElementById('workerSelect');
                    updateOrderAssignment(assigningWorker.orderId, assigningWorker.role, select.value, customRate);
                    setAssigningWorker(null);
                  }} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-2xl">Confirm</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const CustomerList = () => {
    const [search, setSearch] = useState('');
    
    // Filter customers by visibility (own vs all)
    const visibleCustomers = getVisibleCustomers(customers);
    const filtered = visibleCustomers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search));
    
    // Filter orders by visibility (workers only see their assigned orders)
    const visibleOrders = getVisibleOrders(orders);

    // Get paginated results
    const displayedCustomers = filtered.slice(0, (customerPageIndex + 1) * ITEMS_PER_PAGE);
    const hasMoreCustomers = filtered.length > displayedCustomers.length;

    return (
      <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500">
        <header className="flex flex-col gap-4 md:gap-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tighter">Client Management</h2>
              <p className="text-xs md:text-sm text-slate-400 mt-1">{filtered.length} total • {displayedCustomers.length} showing</p>
            </div>
            <div className="relative flex-1 md:w-96"><Search className="absolute left-4 top-3 text-slate-400 md:w-5 md:h-5" size={18}/><input placeholder="Find client..." value={search} onChange={e=>{setSearch(e.target.value); setCustomerPageIndex(0);}} className="w-full pl-10 md:pl-12 pr-4 py-2 md:py-3 bg-white border border-slate-100 rounded-xl md:rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm md:text-base"/></div>
          </div>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
            {displayedCustomers.map(c => {
                const due = visibleOrders.filter(o => o.customerId === c.id).reduce((acc,o)=>acc+(o.totalPrice-o.payments.reduce((a,b)=>a+b.amount,0)), 0);
                return (<div key={c.id} className="bg-white p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-[3rem] border border-slate-100 shadow-sm hover:border-indigo-200 transition-all flex flex-col justify-between"><div><div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6"><div className="w-12 h-12 md:w-16 md:h-16 bg-indigo-50 text-indigo-600 rounded-xl md:rounded-[1.5rem] flex items-center justify-center font-black text-lg md:text-2xl">{c.name[0]}</div><div><h4 className="font-black text-lg md:text-xl">{c.name}</h4><p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest">{c.phone}</p><p className="text-[8px] md:text-[9px] text-slate-500 font-semibold mt-1">Added: {c.dateAdded ? new Date(c.dateAdded).toLocaleDateString() : 'N/A'}</p></div></div><div className="flex gap-2 flex-wrap mb-4 md:mb-6">{c.profiles.map(p => <span key={p.name} className="px-2 md:px-3 py-1 bg-slate-50 text-[7px] md:text-[8px] font-black uppercase rounded-lg border">{p.name}</span>)}</div></div><div className="space-y-3 md:space-y-4 pt-4 md:pt-6 border-t"><div className="flex justify-between items-center"><span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Balance</span><span className={`font-black text-sm md:text-base ${due > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{formatCurrency(due)}</span></div><button onClick={()=>setViewingCustomerId(c.id)} className="w-full py-3 md:py-4 bg-indigo-50 text-indigo-600 font-black rounded-xl md:rounded-2xl text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition shadow-sm">View Ledger</button></div></div>);
            })}
            {displayedCustomers.length === 0 && <div className="col-span-full py-20 text-center opacity-10"><Users size={100} className="mx-auto mb-4"/><p className="text-2xl font-black">No clients found</p></div>}
        </div>

        {/* Load More Button for Customers */}
        {hasMoreCustomers && (
          <div className="flex justify-center mt-6">
            <button 
              onClick={() => setCustomerPageIndex(customerPageIndex + 1)}
              className="px-6 md:px-8 py-3 md:py-4 bg-indigo-600 text-white font-bold rounded-xl md:rounded-2xl hover:bg-indigo-700 transition shadow-lg"
            >
              Load More Clients ({displayedCustomers.length} / {filtered.length})
            </button>
          </div>
        )}
      </div>
    );
  };

  const ExpensesView = () => {
    const [eData, setEData] = useState({ category: 'Rent', amount: '', note: '', accountId: accounts[0]?.id || '' });
    const handleAddExpense = () => {
      if(!eData.amount) return;
      setExpenses([{ id: Date.now(), ...eData, amount: Number(eData.amount), date: new Date().toISOString(), accountId: eData.accountId }, ...expenses]);
      setEData({ category: 'Rent', amount: '', note: '', accountId: accounts[0]?.id || '' });
    };
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-10 animate-in fade-in duration-500">
        <div className="bg-white p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-[2.5rem] border border-slate-100 shadow-sm h-fit">
          <h2 className="text-lg md:text-xl font-black uppercase text-slate-800 tracking-tighter mb-6 md:mb-8">Shop Expense Ledger</h2>
          <div className="space-y-4 md:space-y-6">
            <div className="space-y-1"><label className="text-xs font-bold text-slate-400 uppercase">Category</label><select value={eData.category} onChange={e=>setEData({...eData, category:e.target.value})} className="w-full p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl border-none font-bold text-sm md:text-base">{EXPENSE_CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></div>
            <div className="space-y-1"><label className="text-xs font-bold text-slate-400 uppercase">Amount (Rs)</label><input type="number" value={eData.amount} onChange={e=>setEData({...eData, amount:e.target.value})} className="w-full p-3 md:p-4 bg-red-50 text-red-700 rounded-xl md:rounded-2xl font-black text-2xl md:text-3xl border-none outline-none" /></div>
            <div className="space-y-1"><label className="text-xs font-bold text-slate-400 uppercase">Paid From</label><select value={eData.accountId} onChange={e=>setEData({...eData, accountId:e.target.value})} className="w-full p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl border-none font-bold text-sm md:text-base">{accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
            <div className="space-y-1"><label className="text-xs font-bold text-slate-400 uppercase">Short Note</label><input value={eData.note} onChange={e=>setEData({...eData, note:e.target.value})} className="w-full p-2 md:p-3 bg-slate-50 rounded-lg md:rounded-xl border-none font-bold text-sm md:text-base" /></div>
            <button onClick={handleAddExpense} className="w-full bg-red-600 text-white py-3 md:py-4 rounded-xl md:rounded-2xl font-black shadow-lg hover:bg-red-700 transition text-sm md:text-base">Log Shop Expense</button>
          </div>
        </div>
        <div className="bg-white p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-[2.5rem] border border-slate-100 shadow-sm">
           <h2 className="text-lg md:text-xl font-black uppercase text-slate-800 tracking-tighter mb-6 md:mb-8">Expense History</h2>
           <div className="divide-y space-y-2 overflow-y-auto no-scrollbar max-h-[50vh] md:max-h-[60vh] pr-2 md:pr-4">
             {expenses.map(e => {
               const accName = accounts.find(a=>a.id===e.accountId)?.name || e.mode || 'Unknown';
               return (
                 <div key={e.id} className="py-3 md:py-4 flex justify-between items-center group">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-red-50 text-red-600 rounded-xl md:rounded-2xl flex items-center justify-center font-bold group-hover:bg-red-600 group-hover:text-white transition-all"><DollarSign size={16} className="md:w-5 md:h-5"/></div>
                    <div><p className="font-bold text-sm">{e.category}</p><p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-tight">{new Date(e.date).toLocaleDateString()} • {e.note || 'General shop cost'} • {accName}</p></div>
                  </div>
                  <div className="flex items-center gap-1 md:gap-2">
                    <p className="font-black text-red-600 text-sm md:text-base">{formatCurrency(e.amount)}</p>
                    {hasPermission(PERMISSIONS.EDIT_EXPENSES) && <button onClick={() => setEditingExpense(e)} className="p-1.5 md:p-2 bg-slate-100 text-slate-500 rounded-lg md:rounded-xl hover:bg-indigo-600 hover:text-white transition"><Edit3 size={14} className="md:w-4 md:h-4"/></button>}
                    {hasPermission(PERMISSIONS.DELETE_EXPENSES) && <button onClick={() => handleDeleteExpense(e.id)} className="p-1.5 md:p-2 bg-slate-100 text-slate-500 rounded-lg md:rounded-xl hover:bg-red-600 hover:text-white transition"><Trash2 size={14} className="md:w-4 md:h-4"/></button>}
                  </div>
                </div>
             )})}
             {expenses.length === 0 && <p className="py-16 md:py-20 text-center text-slate-400 opacity-20"><DollarSign size={48} className="md:w-15 md:h-15 mx-auto mb-4"/> No data recorded.</p>}
           </div>
        </div>
        {editingExpense && <ExpenseEditModal expense={editingExpense} onClose={() => setEditingExpense(null)} onSave={handleUpdateExpense} accounts={accounts} />}
      </div>
    );
  };

  const ReportsView = () => {
    const [repRange, setRepRange] = useState('month');
    const [repS, setRepS] = useState('');
    const [repE, setRepE] = useState('');
    const { totalSales, totalCollections, totalExp } = getFilteredData(repRange, repS, repE);
    
    // Filter orders by visibility for worker liabilities calculation
    const visibleOrders = getVisibleOrders(orders);
    const workerLiabilities = workers.reduce((acc, w) => {
      const earned = visibleOrders.filter(o => o.assignments.cutter === w.name || o.assignments.stitcher === w.name).reduce((sum, o) => sum + (o.assignments.cutter === w.name ? o.assignments.cutterRate : o.assignments.stitcherRate), 0);
      const paid = workerPayments.filter(p => p.workerId === w.id).reduce((sum, p) => sum + p.amount, 0);
      return acc + Math.max(0, earned - paid);
    }, 0);
    const netProfit = totalCollections - totalExp - workerLiabilities;

    return (
      <div className="space-y-6 md:space-y-8 lg:space-y-10 animate-in fade-in duration-500 pb-10 md:pb-20">
        <header className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 md:gap-6">
          <h2 className="text-2xl md:text-3xl font-black tracking-tighter uppercase text-slate-800">Shop Analytics</h2>
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            {['today', '7d', 'month', 'custom'].map(r => (
              <button key={r} onClick={() => setRepRange(r)} className={`px-3 md:px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${repRange === r ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400'}`}>{r}</button>
            ))}
            {repRange === 'custom' && (
                <div className="flex items-center gap-2">
                    <input type="date" value={repS} onChange={e=>setRepS(e.target.value)} className="text-[10px] border rounded-lg p-1 outline-none focus:ring-1 ring-indigo-500"/>
                    <input type="date" value={repE} onChange={e=>setRepE(e.target.value)} className="text-[10px] border rounded-lg p-1 outline-none focus:ring-1 ring-indigo-500"/>
                </div>
            )}
          </div>
        </header>
        
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 lg:gap-8">
           <ReportStat label="Period Revenue" value={formatCurrency(totalSales)} desc="Total Billing" icon={<TrendingUp size={20} className="md:w-6 md:h-6"/>} color="indigo" />
           <ReportStat label="Actual Cash" value={formatCurrency(totalCollections)} desc="Revenue Collected" icon={<CreditCard size={20} className="md:w-6 md:h-6"/>} color="emerald" />
           <ReportStat label="Shop Costs" value={formatCurrency(totalExp)} desc="Total Expenses" icon={<DollarSign size={20} className="md:w-6 md:h-6"/>} color="red" />
           <ReportStat label="Payables" value={formatCurrency(workerLiabilities)} desc="Worker Piece Dues" icon={<Users size={20} className="md:w-6 md:h-6"/>} color="orange" />
        </div>

        <div className="bg-white p-4 md:p-6 lg:p-8 xl:p-10 rounded-2xl md:rounded-[3rem] border border-slate-100 shadow-sm">
           <h3 className="text-lg md:text-xl font-black mb-6 md:mb-8 flex items-center gap-2 md:gap-3"><BarChart3 size={20} className="md:w-6 md:h-6 text-indigo-600" /> Financial Health</h3>
           <div className="space-y-6 md:space-y-8 max-w-2xl">
              <ProgressRow label="Booking Fulfillment" value={totalCollections} total={totalSales} color="bg-indigo-500" />
              <ProgressRow label="Expense Margin" value={totalExp} total={totalCollections} color="bg-red-400" />
           </div>
           <div className="mt-8 md:mt-12 p-6 md:p-8 bg-slate-900 rounded-2xl md:rounded-[2rem] text-white flex flex-col sm:flex-row justify-between items-center gap-4 shadow-2xl">
              <div className="text-center sm:text-left">
                <p className="text-xs font-bold opacity-50 uppercase tracking-widest mb-1">{netProfit >= 0 ? 'Estimated Net Profit' : 'Estimated Net Loss'}</p>
                <h4 className={`text-3xl md:text-4xl font-black tracking-tighter ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(netProfit)}</h4>
              </div>
              <TrendingUp size={48} className="md:w-15 md:h-15 opacity-10" />
           </div>
        </div>
      </div>
    );
  };

  const AccountsView = () => {
    const [newAcc, setNewAcc] = useState({ name: '', type: 'Cash' });
    
    const addAccount = () => {
        if(!newAcc.name) return;
        setAccounts([...accounts, { id: `acc_${Date.now()}`, ...newAcc }]);
        setNewAcc({ name: '', type: 'Cash' });
    };

    return (
        <div className="space-y-4 md:space-y-6 lg:space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl md:text-3xl font-black text-slate-800 uppercase tracking-tighter">Financial Accounts</h2>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
                <div className="bg-white p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-[2.5rem] border border-slate-100 shadow-sm h-fit">
                    <h3 className="font-black text-slate-400 uppercase text-xs mb-4 md:mb-6 tracking-widest">Add New Account</h3>
                    <div className="space-y-3 md:space-y-4">
                        <div><label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Account Name</label><input value={newAcc.name} onChange={e=>setNewAcc({...newAcc, name: e.target.value})} className="w-full p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl border-none font-bold outline-none focus:ring-2 ring-indigo-500 text-sm md:text-base" placeholder="e.g. Meezan Bank" /></div>
                        <div><label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Type</label><select value={newAcc.type} onChange={e=>setNewAcc({...newAcc, type: e.target.value})} className="w-full p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl border-none font-bold outline-none text-sm md:text-base"><option>Cash</option><option>Bank</option><option>Mobile Wallet</option></select></div>
                        <button onClick={addAccount} className="w-full py-3 md:py-4 bg-indigo-600 text-white rounded-xl md:rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition shadow-lg">Create Account</button>
                    </div>
                </div>

                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                    {accounts.map(acc => {
                        const balance = getAccountBalance(acc.id);
                        return (
                            <div key={acc.id} className="bg-white p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-3 md:mb-4">
                                        <div><h4 className="font-black text-lg md:text-xl text-slate-800">{acc.name}</h4><span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">{acc.type}</span></div>
                                        <div className="p-2 md:p-3 bg-indigo-50 text-indigo-600 rounded-xl md:rounded-2xl"><Wallet size={20} className="md:w-6 md:h-6"/></div>
                                    </div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Current Balance</p>
                                    <p className={`text-3xl font-black tracking-tighter ${balance < 0 ? 'text-red-500' : 'text-emerald-600'}`}>{formatCurrency(balance)}</p>
                                </div>
                                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-slate-50 rounded-full group-hover:scale-150 transition-transform duration-500 z-0"></div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
  };

  // --- SUB-VIEWS ---

  const OrderDetailView = ({ order, onClose }) => (
    <div className={`fixed inset-y-0 right-0 ${isMobile ? 'left-0' : (isSidebarOpen ? 'left-64' : 'left-24')} bg-white z-[250] overflow-y-auto no-scrollbar p-4 md:p-10 animate-in slide-in-from-bottom duration-300`}>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-10">
            <h2 className="text-4xl font-black tracking-tighter uppercase">Order Receipt</h2>
            <div className="flex gap-2">
                {hasPermission(PERMISSIONS.EDIT_ORDERS) && <button onClick={() => setEditingOrder(order)} className="p-4 bg-slate-100 rounded-full hover:bg-indigo-50 hover:text-indigo-600 transition"><Edit3 size={24}/></button>}
                {hasPermission(PERMISSIONS.DELETE_ORDERS) && <button onClick={() => { handleDeleteOrder(order.id); onClose(); }} className="p-4 bg-slate-100 rounded-full hover:bg-red-50 hover:text-red-600 transition"><Trash2 size={24}/></button>}
                <button onClick={onClose} className="p-4 bg-slate-100 rounded-full hover:bg-slate-200 transition"><X size={24}/></button>
            </div>
        </div>
        <div className="mb-10"><StatusProgressBar currentStatus={order.status} onStatusChange={(s) => updateOrderStatus(order.id, s)} showConfirm={showConfirm} /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <section className="bg-slate-50 p-6 md:p-8 rounded-[2rem] border border-slate-100">
              <h3 className="font-black text-indigo-900 mb-4 uppercase text-xs tracking-widest">Client</h3>
              <p className="text-2xl font-bold">{order.customerName}</p><p className="text-slate-500">{order.customerPhone}</p>
              <div className="mt-6 pt-6 border-t flex justify-between"><div><p className="text-[9px] font-bold text-slate-400 uppercase">Date</p><p className="font-bold text-xs">{new Date(order.date).toLocaleDateString()}</p></div><div><p className="text-[9px] font-bold uppercase text-red-400">Delivery</p><p className="font-bold text-xs text-red-500">{order.deliveryDate}</p></div></div>
            </section>
            <section className="bg-indigo-900 text-white p-6 md:p-8 rounded-[2rem] shadow-xl">
              <h3 className="font-black mb-6 uppercase text-xs opacity-60">Items</h3>
              <div className="space-y-4">
                {order.itemsList?.map((item, idx) => (<div key={idx} className="flex justify-between border-b border-white/10 pb-4"><div><p className="font-bold">{item.type} x{item.qty}</p><p className="text-[10px] opacity-60 italic">{item.note}</p></div><p className="font-bold">{formatCurrency(item.price * item.qty)}</p></div>))}
                <div className="flex justify-between text-2xl font-black pt-4"><span>Total:</span><span>{formatCurrency(order.totalPrice)}</span></div>
              </div>
            </section>
          </div>
          <div className="space-y-8">
            <section className="bg-indigo-900 text-white p-6 md:p-8 rounded-[2.5rem] shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black uppercase text-xs tracking-widest opacity-60">Measures</h3>
                {hasPermission(PERMISSIONS.EDIT_ORDER_MEASUREMENTS) && (
                  <button onClick={() => setEditingMeasurements(order)} className="text-xs font-black bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg transition">
                    Edit
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {order.measurements?.map((m, idx) => (
                  <div key={idx} className="p-5 bg-white/10 rounded-2xl border border-transparent">
                    <p className="font-black text-white border-b-2 pb-1 mb-3 text-sm">{m.profileName}</p>
                    <div className="grid grid-cols-3 gap-3">
                      {Object.entries(m.measurements).map(([k,v]) => (
                        <div key={k}>
                          <p className="text-[8px] font-bold text-white/60 uppercase">{k}</p>
                          <p className="font-black text-[10px] text-white">{v}"</p>
                        </div>
                      ))}
                    </div>
                    {m.styling && <div className="mt-3 pt-3 border-t border-white/10"><p className="text-[8px] font-bold text-white/60 uppercase">Styling</p><p className="font-medium text-[10px] text-white">{m.styling}</p></div>}
                  </div>
                ))}
              </div>
            </section>
            <section className="p-6 md:p-8 bg-emerald-50 rounded-[2rem] border-2 border-emerald-100">
              <h3 className="font-black uppercase text-xs text-emerald-600 mb-4">Payments</h3>
              <div className="space-y-2">{order.payments.map((p, idx) => {
                  const accName = accounts.find(a=>a.id===p.accountId)?.name || p.mode || 'Unknown';
                  return (<div key={idx} className="flex justify-between text-xs font-bold text-emerald-800"><span>{p.source} via {accName} ({new Date(p.date).toLocaleDateString()})</span><span>{formatCurrency(p.amount)}</span></div>)
              })}</div>
              <div className="mt-4 pt-4 border-t border-emerald-200 flex justify-between font-black text-red-600"><span>Remaining Balance:</span><span>{formatCurrency(order.totalPrice - order.payments.reduce((a,b)=>a+b.amount,0))}</span></div>
            </section>
          </div>
        </div>
        <div className="mt-12 flex gap-4 no-print"><button onClick={() => window.print()} className="flex-1 py-5 bg-slate-900 text-white rounded-3xl font-black text-xl flex items-center justify-center gap-3"><Printer size={24}/> Print</button><button onClick={() => {
          const balanceDue = order.totalPrice - order.payments.reduce((a,b)=>a+b.amount,0);
          const message = `📨 *Designer Tailors - Order Update* 📨

📋 *Order ID:* #${order.id}

✅ *Invoice Details Ready*
Customer: ${order.customerName}

💰 *Bill Summary:*
  Total Amount: *${formatCurrency(order.totalPrice)}*
  Paid: ${formatCurrency(order.payments.reduce((a,b)=>a+b.amount,0))}
  Remaining: *${formatCurrency(balanceDue)}*

📅 *Due Date:* ${new Date(order.dueDate).toLocaleDateString()}

Press the invoice link or visit our store. 🏪`;
          sendWhatsApp(order.customerPhone, message);
        }} className="flex-1 py-5 bg-emerald-600 text-white rounded-3xl font-black text-xl flex items-center justify-center gap-3"><Send size={24}/> WhatsApp</button></div>
      </div>
    </div>
  );

  const CustomerHistoryView = ({ customerId, onClose }) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return null;
    const [editingProfile, setEditingProfile] = useState(null);
    const [tempMeasure, setTempMeasure] = useState({});
    const [tempStyling, setTempStyling] = useState('');
    const [measurementsModal, setMeasurementsModal] = useState(null); // 'add' or 'view'
    const [newProfile, setNewProfile] = useState({ name: '', data: {}, styling: '' });
    
    // Filter orders by visibility (workers only see their assigned orders)
    const visibleOrders = getVisibleOrders(orders);
    const custOrders = visibleOrders.filter(o => o.customerId === customer.id);
    
    const totalSpent = custOrders.reduce((acc, o) => acc + o.totalPrice, 0);
    const totalDue = custOrders.reduce((acc, o) => acc + (o.totalPrice - o.payments.reduce((a,b)=>a+b.amount,0)), 0);

    const handleSaveProfileEdit = () => {
      const updated = [...customer.profiles];
      updated[editingProfile].data = tempMeasure;
      updated[editingProfile].styling = tempStyling;
      updateCustomerProfiles(customer.id, updated);
      setEditingProfile(null);
    };

    return (
      <div className={`fixed inset-y-0 right-0 ${isMobile ? 'left-0' : (isSidebarOpen ? 'left-64' : 'left-24')} bg-[#FDFDFF] z-[200] overflow-y-auto no-scrollbar p-4 md:p-10 animate-in slide-in-from-right duration-400`}>
        <div className="max-w-6xl mx-auto">
          <header className="flex justify-between items-center mb-12">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white text-3xl font-black shadow-xl">{customer.name[0]}</div>
              <div><h2 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">{customer.name}</h2><p className="text-indigo-600 font-black flex items-center gap-2 tracking-widest uppercase text-xs"><Smartphone size={16}/> {customer.phone}</p></div>
            </div>
            <button onClick={onClose} className="p-4 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-50 transition"><X size={24}/></button>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-1 space-y-10">
              <section className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <h3 className="font-black text-slate-400 uppercase text-xs mb-6 tracking-widest">Ledger Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between"><span>Lifetime Value</span><span className="font-black text-emerald-600">{formatCurrency(totalSpent)}</span></div>
                  <div className="pt-4 border-t space-y-4">
                    <div className="flex justify-between items-center"><span className="font-bold">Pending Dues</span><span className="font-black text-red-600 text-xl">{formatCurrency(totalDue)}</span></div>
                    {totalDue > 0 && <button onClick={() => setPaymentModal({ id: customer.id, type: 'customer' })} className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-lg hover:bg-emerald-700 transition">Record Receipt</button>}
                  </div>
                </div>
              </section>

              <section className="bg-indigo-900 text-white p-6 md:p-8 rounded-[2.5rem] shadow-xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black uppercase text-xs tracking-widest opacity-60">Measurements</h3>
                  <div className="flex gap-2">
                    <button onClick={() => setMeasurementsModal('view')} className="text-xs font-black bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg transition">View</button>
                    <button onClick={() => setMeasurementsModal('add')} className="text-xs font-black bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg transition">+ New</button>
                  </div>
                </div>
                <div className="space-y-4">
                  {customer.profiles.map((p, idx) => (
                    <div key={idx} className="p-5 bg-white/10 rounded-2xl group border border-transparent hover:border-white/20 transition relative">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-black text-sm tracking-tight">{p.name}</span>
                        <div className="flex gap-2">
                          {hasPermission(PERMISSIONS.EDIT_CUSTOMER_MEASUREMENTS) && <button onClick={() => { setEditingProfile(idx); setTempMeasure(p.data); setTempStyling(p.styling || ''); }} className="text-white/40 hover:text-white"><Edit3 size={14}/></button>}
                          {hasPermission(PERMISSIONS.EDIT_CUSTOMER_MEASUREMENTS) && <button onClick={() => updateCustomerProfiles(customer.id, customer.profiles.filter((_,i)=>i!==idx))} className="text-red-400/40 hover:text-red-400"><Trash2 size={14}/></button>}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 opacity-60 text-[8px] uppercase font-bold">
                        {Object.entries(p.data).slice(0, 6).map(([k,v]) => <span key={k}>{k}: {v}"</span>)}
                        {Object.keys(p.data).length === 0 && <span className="col-span-3 italic opacity-40">No data saved</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="lg:col-span-2 space-y-10">
              <section className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <h3 className="font-black text-slate-400 uppercase text-xs mb-6 tracking-widest">Transaction Log</h3>
                <div className="space-y-4 max-h-[70vh] overflow-y-auto no-scrollbar pr-2">
                  {custOrders.map(o => (
                    <div key={o.id} className="p-6 bg-slate-50 rounded-3xl flex justify-between items-center border border-transparent hover:border-indigo-100 transition group">
                      <div>
                        <div className="flex items-center gap-3 mb-1"><span className="font-black text-lg">#{o.id}</span><span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-widest ${getStatusColor(o.status)}`}>{o.status}</span></div>
                        <p className="text-xs font-medium text-slate-500">{new Date(o.date).toDateString()} • {o.itemsList?.reduce((a,c)=>a+c.qty, 0)} items</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-indigo-600">{formatCurrency(o.totalPrice)}</p>
                        <button onClick={() => setViewingOrder(o)} className="text-[10px] font-black uppercase text-slate-400 hover:text-indigo-600 flex items-center gap-1 justify-end mt-1">Details <ChevronRight size={14}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-emerald-50 p-6 md:p-8 rounded-[2.5rem] border-2 border-emerald-100">
                <h3 className="font-black uppercase text-xs text-emerald-600 mb-4">Payment History</h3>
                <div className="space-y-2">
                  {custOrders.flatMap(o => o.payments.map(p => ({ ...p, orderId: o.id, orderDate: o.date }))).sort((a,b) => new Date(b.date) - new Date(a.date)).map((p, idx) => (
                    <div key={idx} className="flex justify-between text-xs font-bold text-emerald-800">
                      <span>{p.source} (Order #{p.orderId}) - {new Date(p.date).toLocaleDateString()}</span>
                      <span>{formatCurrency(p.amount)}</span>
                    </div>
                  ))}
                  {custOrders.flatMap(o => o.payments).length === 0 && <p className="text-emerald-600 text-xs">No payments recorded</p>}
                </div>
              </section>
            </div>
          </div>
        </div>

        {editingProfile !== null && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-2xl w-full max-w-lg animate-in zoom-in-95">
              <h3 className="text-xl font-black mb-6 uppercase tracking-tight">Edit: {customer.profiles[editingProfile].name}</h3>
              <div className="grid grid-cols-3 gap-4 mb-8">
                {['Length', 'Shoulder', 'Chest', 'Waist', 'Sleeve', 'Daman', 'Collar', 'Pant Length', 'Ghera'].map(m => (
                  <div key={m}>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">{m}</label>
                    <input value={tempMeasure[m.toLowerCase()] || ''} onChange={e=>setTempMeasure({...tempMeasure, [m.toLowerCase()]: e.target.value})} className="w-full p-2 bg-slate-50 rounded-xl border-none font-bold text-sm outline-none ring-indigo-500 focus:ring-2" />
                  </div>
                ))}
                <div className="col-span-3"><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Styling Note</label><textarea value={tempStyling} onChange={e=>setTempStyling(e.target.value)} className="w-full p-2 bg-slate-50 rounded-xl border-none font-bold text-sm outline-none ring-indigo-500 focus:ring-2 resize-none" rows={2} /></div>
              </div>
              <div className="flex gap-3">
                <button onClick={()=>setEditingProfile(null)} className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold rounded-xl uppercase text-xs">Cancel</button>
                <button onClick={handleSaveProfileEdit} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl uppercase text-xs">Save</button>
              </div>
            </div>
          </div>
        )}

        {measurementsModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-2xl w-full max-w-4xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto no-scrollbar">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black uppercase tracking-tight">{measurementsModal === 'add' ? 'Add New Measurements' : 'View Measurements'}</h3>
                <button onClick={() => { setMeasurementsModal(null); setNewProfile({ name: '', data: {}, styling: '' }); }} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition"><X size={20}/></button>
              </div>
              {measurementsModal === 'add' ? (
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-1 block uppercase">Measurements</label>
                    <input value={newProfile.name} onChange={e => setNewProfile({ ...newProfile, name: e.target.value })} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold outline-none focus:ring-2 ring-indigo-500" placeholder="e.g. Set 1" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-600 mb-4 uppercase text-sm">Measurements</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {['Length', 'Shoulder', 'Chest', 'Waist', 'Sleeve', 'Daman', 'Collar', 'Pant Length', 'Ghera'].map(m => (
                        <div key={m}>
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">{m}</label>
                          <input value={newProfile.data[m.toLowerCase()] || ''} onChange={e => setNewProfile({ ...newProfile, data: { ...newProfile.data, [m.toLowerCase()]: e.target.value } })} className="w-full p-3 bg-slate-50 rounded-xl border-none font-bold text-sm outline-none ring-indigo-500 focus:ring-2" placeholder="0" />
                        </div>
                      ))}
                      <div className="col-span-3"><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Styling Note</label><textarea value={newProfile.styling} onChange={e => setNewProfile({ ...newProfile, styling: e.target.value })} className="w-full p-3 bg-slate-50 rounded-xl border-none font-bold text-sm outline-none ring-indigo-500 focus:ring-2 resize-none" rows={2} placeholder="Enter styling details..." /></div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => { setMeasurementsModal(null); setNewProfile({ name: '', data: {}, styling: '' }); }} className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold rounded-xl uppercase text-xs">Cancel</button>
                    <button onClick={() => {
                      if (newProfile.name.trim()) {
                        const updated = [...customer.profiles, { name: newProfile.name, data: newProfile.data, styling: newProfile.styling }];
                        updateCustomerProfiles(customer.id, updated);
                        setMeasurementsModal(null);
                        setNewProfile({ name: '', data: {}, styling: '' });
                      }
                    }} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl uppercase text-xs">Add Profile</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {customer.profiles.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">No measurement profiles found.</p>
                  ) : (
                    customer.profiles.map((p, idx) => (
                      <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                        <h4 className="font-black text-indigo-600 mb-4 uppercase text-sm border-b pb-2">{p.name}</h4>
                        <div className="grid grid-cols-3 gap-4">
                          {Object.entries(p.data).map(([k, v]) => (
                            <div key={k}>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">{k}</p>
                              <p className="font-black text-sm">{v || 'N/A'}</p>
                            </div>
                          ))}
                        </div>
                        {p.styling && <div className="mt-4 pt-4 border-t border-slate-200"><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Styling Note</p><p className="font-bold text-sm text-slate-700">{p.styling}</p></div>}
                      </div>
                    ))
                  )}
                  <div className="flex justify-end">
                    <button onClick={() => setMeasurementsModal(null)} className="py-3 px-6 bg-indigo-600 text-white font-bold rounded-xl uppercase text-xs">Close</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const WorkerLedgerView = ({ worker, onClose }) => {
    // Filter orders by visibility (in case a worker is viewing their own ledger)
    const visibleOrders = getVisibleOrders(orders);
    
    // Create a list that includes each role assignment separately
    const jobAssignments = [];
    visibleOrders.forEach(o => {
      if (o.assignments.cutter === worker.name) {
        jobAssignments.push({ ...o, assignmentType: 'cutter', rate: o.assignments.cutterRate });
      }
      if (o.assignments.stitcher === worker.name) {
        jobAssignments.push({ ...o, assignmentType: 'stitcher', rate: o.assignments.stitcherRate });
      }
    });
    
    const payments = workerPayments.filter(p => p.workerId === worker.id);
    const earned = jobAssignments.reduce((acc, a) => acc + a.rate, 0);
    const paid = payments.reduce((acc, p) => acc + p.amount, 0);
    const balance = earned - paid;
    const [payAcc, setPayAcc] = useState(accounts[0]?.id || '');

    return (
      <div className={`fixed inset-y-0 right-0 ${isMobile ? 'left-0' : (isSidebarOpen ? 'left-64' : 'left-24')} bg-[#FDFDFF] z-[200] overflow-y-auto no-scrollbar p-4 md:p-10 animate-in slide-in-from-right duration-300`}>
        <div className="max-w-5xl mx-auto">
          <header className="flex justify-between items-center mb-10">
            <button onClick={onClose} className="flex items-center gap-2 text-indigo-600 font-black uppercase text-[10px] tracking-widest"><ArrowLeftRight size={16}/> Back</button>
            <div className="text-right"><h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">{worker.name}</h2><p className="text-indigo-600 font-black text-[10px] uppercase tracking-widest">{worker.role}</p></div>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="space-y-8">
              <StatPanel label="Staff Balance" rows={[{l:'Work Value', v:earned}, {l:'Paid', v:paid, c:'text-red-500'}]} footer={{l: balance >= 0 ? 'Payable' : 'Advance', v:balance, c: balance >= 0 ? 'text-emerald-600' : 'text-red-600'}} />
              <section className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <h3 className="font-black text-[10px] uppercase mb-6 tracking-widest text-indigo-600">Issue Payment</h3>
                <input type="number" id="wIn" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-black text-2xl mb-2 outline-none" placeholder="0"/>
                <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block ml-1">From Account</label>
                <select value={payAcc} onChange={e=>setPayAcc(e.target.value)} className="w-full p-3 bg-slate-50 rounded-2xl border-none font-bold mb-4 text-sm">{accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select>
                <button onClick={() => { 
                    const val = document.getElementById('wIn').value; 
                    recordWorkerPayment(worker.id, val, payAcc); 
                    document.getElementById('wIn').value = ''; 
                }} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg uppercase text-xs tracking-widest">Log Payment</button>
              </section>
            </div>
            <div className="md:col-span-2">
              <section className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <h3 className="font-black text-slate-400 text-[10px] uppercase mb-6 tracking-widest">Transaction Log</h3>
                <div className="divide-y">
                    {(() => {
                      // Create unified log with both assignments and payments
                      const allTransactions = [
                        ...jobAssignments.map(a => ({
                          date: a.date,
                          type: 'assignment',
                          amount: a.rate,
                          data: a,
                          timestamp: new Date(a.date).getTime()
                        })),
                        ...payments.map(p => ({
                          date: p.date,
                          type: 'payment',
                          amount: -p.amount,
                          data: p,
                          timestamp: new Date(p.date).getTime()
                        }))
                      ].sort((a, b) => a.timestamp - b.timestamp);
                      
                      // Calculate running balance
                      let runningBalance = 0;
                      
                      if (allTransactions.length === 0) {
                        return <p className="py-10 text-center text-slate-300 font-bold uppercase text-xs">No transactions</p>;
                      }
                      
                      return allTransactions.map((t, idx) => {
                        runningBalance += t.amount;
                        const accountName = t.type === 'payment' ? accounts.find(a => a.id === t.data.accountId)?.name || 'Unknown' : '';
                        
                        return (
                          <div 
                            key={`${t.type}-${idx}`} 
                            className={`py-4 flex justify-between items-start group ${t.type === 'assignment' ? 'cursor-pointer hover:bg-indigo-50' : ''}`}
                            onClick={() => t.type === 'assignment' && setViewingOrder(t.data)}
                          >
                            <div className="flex-1">
                              {t.type === 'assignment' ? (
                                <>
                                  <p className="font-bold text-sm">Order #{t.data.id} - {t.data.customerName}</p>
                                  <p className="text-[9px] text-slate-400 uppercase font-black">{new Date(t.date).toLocaleDateString()} ({t.data.assignmentType})</p>
                                </>
                              ) : (
                                <>
                                  <p className="font-bold text-sm">Paid from {accountName}</p>
                                  <p className="text-[9px] text-slate-400 uppercase font-black">{new Date(t.date).toLocaleDateString()}</p>
                                </>
                              )}
                            </div>
                            <div className="text-right">
                              <p className={`font-black text-sm ${t.type === 'assignment' ? 'text-emerald-600' : 'text-red-600'}`}>
                                {t.type === 'assignment' ? '+' : '-'}{formatCurrency(Math.abs(t.amount))}
                              </p>
                              <p className={`text-[9px] font-bold uppercase ${runningBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {runningBalance < 0 ? 'Advance' : 'Balance'}: {formatCurrency(Math.abs(runningBalance))}
                              </p>
                            </div>
                          </div>
                        );
                      });
                    })()}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- MAIN LAYOUT RENDER ---

  return (
    <div className="flex h-screen bg-[#FDFDFF] font-sans text-slate-900 overflow-hidden">
      {/* SIDEBAR BACKDROP FOR MOBILE */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed left-60 top-0 right-0 bottom-0 bg-black/50 z-[250] transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR ALWAYS VISIBLE - DESKTOP ONLY */}
      <aside className={`hidden md:flex fixed left-0 top-0 h-full bg-slate-900 border-r border-slate-800 transition-all duration-300 z-[300] ${isSidebarOpen ? 'w-64' : 'w-24'} flex-col shadow-2xl`}>
        <div className={`p-6 md:p-8 flex items-center ${isSidebarOpen ? 'justify-start gap-3 md:gap-4' : 'justify-center'}`}>
          <div className="bg-indigo-600 p-2.5 md:p-3 rounded-2xl text-white shadow-lg shadow-indigo-500/40 shrink-0"><Scissors size={20} className="md:w-6 md:h-6"/></div>
          {isSidebarOpen && <span className="font-black text-lg md:text-xl tracking-tighter text-white uppercase">{businessSettings.businessName?.substring(0, 15) || 'DT-ERP'}</span>}
        </div>
        <nav ref={navRef} className={`flex-1 space-y-1 mt-2 md:mt-4 overflow-y-auto no-scrollbar px-4`}>
          <SidebarItem id="dashboard" label="Dashboard" icon={<PieChart size={24}/>} permission={PERMISSIONS.VIEW_DASHBOARD} />
          <SidebarItem id="booking" label="New Booking" icon={<PlusCircle size={24}/>} permission={PERMISSIONS.CREATE_ORDERS} />
          <SidebarItem id="orders" label="Manage Orders" icon={<History size={24}/>} permission={PERMISSIONS.VIEW_ORDERS} />
          <SidebarItem id="customers" label="Manage Clients" icon={<Users size={24}/>} permission={PERMISSIONS.VIEW_CUSTOMERS} />
          <SidebarItem id="workers" label="Manage Staff" icon={<Briefcase size={24}/>} permission={PERMISSIONS.VIEW_WORKERS} />
          <SidebarItem id="expenses" label="Expenses" icon={<DollarSign size={24}/>} permission={PERMISSIONS.VIEW_EXPENSES} />
          <SidebarItem id="accounts" label="Accounts" icon={<Wallet size={24}/>} permission={PERMISSIONS.VIEW_ACCOUNTS} />
          <SidebarItem id="reports" label="Analytics" icon={<BarChart3 size={24}/>} permission={PERMISSIONS.VIEW_REPORTS} />
          {hasPermission(PERMISSIONS.MANAGE_USERS) && <SidebarItem id="user-management" label="User & Roles" icon={<UserCircle size={24}/>} />}
        </nav>
        <div className="p-4 mt-auto border-t border-slate-800/50 flex flex-col gap-2">
          <button onClick={() => { setProfileName(currentUser?.name || ''); setProfileUsername(currentUser?.username || ''); setSettingsTab('profile'); setSettingsModal(true); }} className={`w-full flex items-center ${isSidebarOpen ? 'justify-start gap-3 md:gap-4 px-4 md:px-6' : 'justify-center px-2'} py-3 md:py-4 rounded-2xl transition-all text-slate-500 hover:bg-indigo-500/10 hover:text-indigo-400 group relative`}>
            <Settings size={22}/>
            {isSidebarOpen && <span className="text-xs md:text-sm font-bold">Settings</span>}
            {!isSidebarOpen && <div className="absolute left-full ml-4 px-3 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[400] shadow-xl">Settings</div>}
          </button>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION - MOBILE ONLY */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-[300] shadow-2xl shadow-black/10">
        <div className="overflow-x-auto no-scrollbar flex gap-0">
          <button 
            onClick={() => handleNavClick('dashboard')} 
            className={`flex-shrink-0 flex flex-col items-center justify-center gap-1 px-5 py-3 min-w-[80px] transition-all ${(location.pathname === '/' || location.pathname === '') ? 'text-indigo-600 bg-indigo-50 border-t-2 border-indigo-600' : 'text-slate-600 hover:text-indigo-600'}`}
          >
            <PieChart size={20}/>
            <span className="text-[9px] font-bold uppercase tracking-tight">Dashboard</span>
          </button>
          {hasPermission(PERMISSIONS.CREATE_ORDERS) && (
            <button 
              onClick={() => handleNavClick('new-order')} 
              className={`flex-shrink-0 flex flex-col items-center justify-center gap-1 px-5 py-3 min-w-[80px] transition-all ${location.pathname === '/booking' ? 'text-indigo-600 bg-indigo-50 border-t-2 border-indigo-600' : 'text-slate-600 hover:text-indigo-600'}`}
            >
              <PlusCircle size={20}/>
              <span className="text-[9px] font-bold uppercase tracking-tight">Booking</span>
            </button>
          )}
          {hasPermission(PERMISSIONS.VIEW_ORDERS) && (
            <button 
              onClick={() => handleNavClick('orders')} 
              className={`flex-shrink-0 flex flex-col items-center justify-center gap-1 px-5 py-3 min-w-[80px] transition-all ${location.pathname === '/orders' ? 'text-indigo-600 bg-indigo-50 border-t-2 border-indigo-600' : 'text-slate-600 hover:text-indigo-600'}`}
            >
              <History size={20}/>
              <span className="text-[9px] font-bold uppercase tracking-tight">Orders</span>
            </button>
          )}
          {hasPermission(PERMISSIONS.VIEW_CUSTOMERS) && (
            <button 
              onClick={() => handleNavClick('customers')} 
              className={`flex-shrink-0 flex flex-col items-center justify-center gap-1 px-5 py-3 min-w-[80px] transition-all ${location.pathname === '/customers' ? 'text-indigo-600 bg-indigo-50 border-t-2 border-indigo-600' : 'text-slate-600 hover:text-indigo-600'}`}
            >
              <Users size={20}/>
              <span className="text-[9px] font-bold uppercase tracking-tight">Clients</span>
            </button>
          )}
          {hasPermission(PERMISSIONS.VIEW_WORKERS) && (
            <button 
              onClick={() => handleNavClick('workers')} 
              className={`flex-shrink-0 flex flex-col items-center justify-center gap-1 px-5 py-3 min-w-[80px] transition-all ${location.pathname === '/workers' ? 'text-indigo-600 bg-indigo-50 border-t-2 border-indigo-600' : 'text-slate-600 hover:text-indigo-600'}`}
            >
              <Briefcase size={20}/>
              <span className="text-[9px] font-bold uppercase tracking-tight">Staff</span>
            </button>
          )}
          {hasPermission(PERMISSIONS.VIEW_EXPENSES) && (
            <button 
              onClick={() => handleNavClick('expenses')} 
              className={`flex-shrink-0 flex flex-col items-center justify-center gap-1 px-5 py-3 min-w-[80px] transition-all ${location.pathname === '/expenses' ? 'text-indigo-600 bg-indigo-50 border-t-2 border-indigo-600' : 'text-slate-600 hover:text-indigo-600'}`}
            >
              <DollarSign size={20}/>
              <span className="text-[9px] font-bold uppercase tracking-tight">Expenses</span>
            </button>
          )}
          {hasPermission(PERMISSIONS.VIEW_ACCOUNTS) && (
            <button 
              onClick={() => handleNavClick('accounts')} 
              className={`flex-shrink-0 flex flex-col items-center justify-center gap-1 px-5 py-3 min-w-[80px] transition-all ${location.pathname === '/accounts' ? 'text-indigo-600 bg-indigo-50 border-t-2 border-indigo-600' : 'text-slate-600 hover:text-indigo-600'}`}
            >
              <Wallet size={20}/>
              <span className="text-[9px] font-bold uppercase tracking-tight">Accounts</span>
            </button>
          )}
          {hasPermission(PERMISSIONS.VIEW_REPORTS) && (
            <button 
              onClick={() => handleNavClick('reports')} 
              className={`flex-shrink-0 flex flex-col items-center justify-center gap-1 px-5 py-3 min-w-[80px] transition-all ${location.pathname === '/reports' ? 'text-indigo-600 bg-indigo-50 border-t-2 border-indigo-600' : 'text-slate-600 hover:text-indigo-600'}`}
            >
              <BarChart3 size={20}/>
              <span className="text-[9px] font-bold uppercase tracking-tight">Analytics</span>
            </button>
          )}
          {hasPermission(PERMISSIONS.MANAGE_USERS) && (
            <button 
              onClick={() => handleNavClick('users')} 
              className={`flex-shrink-0 flex flex-col items-center justify-center gap-1 px-5 py-3 min-w-[80px] transition-all ${location.pathname === '/users' ? 'text-indigo-600 bg-indigo-50 border-t-2 border-indigo-600' : 'text-slate-600 hover:text-indigo-600'}`}
            >
              <UserCircle size={20}/>
              <span className="text-[9px] font-bold uppercase tracking-tight">Users</span>
            </button>
          )}
          <button 
            onClick={() => { setProfileName(currentUser?.name || ''); setProfileUsername(currentUser?.username || ''); setSettingsTab('profile'); setSettingsModal(true); }} 
            className={`flex-shrink-0 flex flex-col items-center justify-center gap-1 px-5 py-3 min-w-[80px] transition-all text-slate-600 hover:text-indigo-600`}
          >
            <Settings size={20}/>
            <span className="text-[9px] font-bold uppercase tracking-tight">Settings</span>
          </button>
        </div>
      </div>

      <main ref={mainContentRef} className={`transition-all ${isMobile ? 'mb-20' : (isSidebarOpen ? 'ml-64 md:ml-[266px]' : 'ml-24 md:ml-[106px]')} flex-1 overflow-y-auto no-scrollbar p-4 md:p-6 lg:p-10 pr-5 scroll-smooth relative`}>
        
        {/* Auto-Save Status Indicator */}
        <div className="fixed top-4 right-4 z-[200] animate-in fade-in duration-300">
          {isSaving ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full shadow-lg font-bold text-xs">
              <Activity size={14} className="animate-spin" />
              <span>Saving...</span>
            </div>
          ) : lastSaved && (
            <div className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-full shadow-lg font-bold text-xs opacity-80">
              <Check size={14} />
            </div>
          )}
        </div>

        {/* Route-based page rendering */}
        {(location.pathname === '/' || location.pathname === '') && hasPermission(PERMISSIONS.VIEW_DASHBOARD) && <Dashboard />}
        {location.pathname === '/booking' && <OrderForm />}
        {location.pathname === '/orders' && canView('ORDERS') && <OrderList />}
        {location.pathname === '/accounts' && hasPermission(PERMISSIONS.VIEW_ACCOUNTS) && <AccountsView />}
        {location.pathname === '/expenses' && canView('EXPENSES') && <ExpensesView />}
        {location.pathname === '/reports' && canView('REPORTS') && <ReportsView />}
        
        {location.pathname === '/customers' && canView('CUSTOMERS') && (
          <CustomerList />
        )}

        {location.pathname === '/workers' && hasPermission(PERMISSIONS.VIEW_WORKERS) && (
          <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tighter">Staff Management</h2>
              <button onClick={() => setAddWorkerModal(true)} className="bg-indigo-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition flex items-center gap-2 text-sm"><Plus size={18} className="md:w-5 md:h-5"/> Add Staff</button>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
              {workers.map(w => {
                const visibleOrders = getVisibleOrders(orders);
                const jobs = visibleOrders.filter(o => o.assignments.cutter === w.name || o.assignments.stitcher === w.name);
                const earned = jobs.reduce((acc, o) => acc + (o.assignments.cutter === w.name ? o.assignments.cutterRate : o.assignments.stitcherRate), 0);
                const paid = workerPayments.filter(p => p.workerId === w.id).reduce((acc, p) => acc + p.amount, 0);
                const balance = earned - paid;
                return (
                  <div key={w.id} className="bg-white p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-[3rem] border border-slate-100 shadow-sm relative group">
                    <div className="flex justify-between items-start mb-4 md:mb-6">
                      <div><h3 className="text-lg md:text-xl font-black text-slate-800">{w.name}</h3><div className="flex flex-wrap gap-1 mt-2">{Array.isArray(w.roles) ? w.roles.map(r => <span key={r} className="text-[8px] md:text-[9px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 md:px-3 py-1 rounded-full">{r}</span>) : <span className="text-[8px] md:text-[9px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 md:px-3 py-1 rounded-full">{w.role || 'Unassigned'}</span>}</div></div>
                      <div className="flex gap-1 md:gap-2">
                        <button onClick={() => deleteWorker(w.id)} className="p-1.5 md:p-2 bg-red-50 text-red-600 rounded-lg md:rounded-xl hover:bg-red-600 hover:text-white transition"><Trash2 size={14} className="md:w-4 md:h-4"/></button>
                        <button onClick={() => {
                          setEditingWorker(w);
                          setWorkerRoleSelection(Array.isArray(w.roles) ? w.roles.reduce((acc, r) => ({...acc, [r]: true}), {}) : {});
                          setWorkerCustomRole('');
                        }} className="p-1.5 md:p-2 bg-blue-50 text-blue-600 rounded-lg md:rounded-xl hover:bg-blue-600 hover:text-white transition"><Edit3 size={14} className="md:w-4 md:h-4"/></button>
                        <div className="p-2 md:p-3 bg-slate-50 rounded-xl md:rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all"><Briefcase size={16} className="md:w-5 md:h-5"/></div>
                      </div>
                    </div>
                    <div className="space-y-3 md:space-y-4 pt-4 md:pt-6 border-t border-slate-50">
                       <div className="flex justify-between text-[9px] md:text-[10px] font-bold text-slate-400 uppercase"><span>Job Value</span><span>{formatCurrency(earned)}</span></div>
                       <div className="flex justify-between text-[9px] md:text-[10px] font-bold text-slate-400 uppercase"><span>Paid Cash</span><span className="text-red-500">-{formatCurrency(paid)}</span></div>
                       <div className="flex justify-between pt-3 md:pt-4"><span className="font-black text-slate-900 text-[9px] md:text-[10px] uppercase">{balance >= 0 ? 'Pending' : 'Extra Adv'}</span><span className={`text-lg md:text-xl font-black ${balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(balance)}</span></div>
                    </div>
                    <button onClick={() => setViewingWorkerLedger(w)} className="w-full mt-4 md:mt-6 py-3 md:py-3 bg-slate-900 text-white rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition shadow-lg">Add Payment</button>
                  </div>
                );
              })}
            </div>
            
            {/* Credentials Modal */}
            {credentialsModal && (
              <CredentialsModal 
                username={credentialsModal.username} 
                password={credentialsModal.password} 
                onClose={() => setCredentialsModal(null)}
              />
            )}
          </div>
        )}

        {location.pathname === '/users' && hasPermission(PERMISSIONS.MANAGE_USERS) && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <header className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">User Management</h2>
              <button onClick={() => { setSelectedPermissions([]); setAddUserModal(true); }} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition flex items-center gap-2"><Plus size={20}/> Add User</button>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {users.map(u => (
                <div key={u.id} className="bg-white p-6 md:p-8 rounded-[3rem] border border-slate-100 shadow-sm relative group">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-black text-slate-800">{u.name}</h3>
                      <p className="text-sm text-slate-500 font-medium">{u.username}</p>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full mt-2 inline-block ${
                        u.role === 'Admin' ? 'bg-red-50 text-red-600' :
                        u.role === 'Manager' ? 'bg-blue-50 text-blue-600' :
                        'bg-green-50 text-green-600'
                      }`}>{u.role}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => editUser(u.id)} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition"><Edit3 size={16}/></button>
                      <button onClick={() => setPasswordModal({ userId: u.id, mode: u.id === currentUser?.id ? 'self' : 'reset', username: u.username })} className="p-2 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-600 hover:text-white transition"><Key size={16}/></button>
                      {u.id !== currentUser?.id && (
                        <button onClick={() => deleteUser(u.id)} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition"><Trash2 size={16}/></button>
                      )}
                      <div className={`p-3 rounded-2xl transition-all ${
                        u.active ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white' : 'bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white'
                      }`}>
                        <UserCircle size={20}/>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4 pt-6 border-t border-slate-50">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                      <span className={`font-black text-sm ${u.active ? 'text-emerald-600' : 'text-red-600'}`}>
                        {u.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Login</span>
                      <span className="font-bold text-sm text-slate-600">
                        {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => toggleUserStatus(u.id)} className={`w-full mt-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition shadow-lg ${
                    u.active ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}>
                    {u.active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SHARED MODALS */}
        {settingsModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
            <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight">Settings</h3>
                <button onClick={() => setSettingsModal(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition"><X size={20}/></button>
              </div>
              
              {/* Tab Navigation */}
              <div className="flex gap-4 mb-6 border-b border-slate-200">
                <button 
                  onClick={() => setSettingsTab('profile')}
                  className={`pb-3 px-4 font-black text-sm uppercase tracking-wide transition-all ${settingsTab === 'profile' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Profile
                </button>
                {hasPermission(PERMISSIONS.MANAGE_USERS) && (
                  <button 
                    onClick={() => setSettingsTab('business')}
                    className={`pb-3 px-4 font-black text-sm uppercase tracking-wide transition-all ${settingsTab === 'business' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Business
                  </button>
                )}
                <button 
                  onClick={() => setSettingsTab('export')}
                  className={`pb-3 px-4 font-black text-sm uppercase tracking-wide transition-all ${settingsTab === 'export' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Export Data
                </button>
              </div>

              <div className="space-y-5">
                {/* PROFILE TAB */}
                {settingsTab === 'profile' && (
                  <>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Account</p>
                      <div className="mt-3 space-y-3">
                        <div>
                          <label className="text-[9px] font-black text-slate-400 uppercase">Full Name</label>
                          <input value={profileName} onChange={(e) => setProfileName(e.target.value)} className="w-full mt-1 p-3 bg-white rounded-xl border border-slate-100 font-bold text-sm outline-none focus:ring-2 ring-indigo-500" placeholder="Enter full name" />
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-slate-400 uppercase">Username</label>
                          <input value={profileUsername} onChange={(e) => setProfileUsername(e.target.value)} className="w-full mt-1 p-3 bg-white rounded-xl border border-slate-100 font-bold text-sm outline-none focus:ring-2 ring-indigo-500" placeholder="Enter username" />
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-[9px] font-black text-slate-400 uppercase">Role</span>
                          <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600">
                            {currentUser?.role || 'User'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={handleProfileSave} className="py-3 bg-emerald-600 text-white font-black rounded-2xl uppercase text-xs flex items-center justify-center gap-2">
                        <Save size={14}/> Save Profile
                      </button>
                      <button onClick={() => { setSettingsModal(false); setPasswordModal({ userId: currentUser?.id, mode: 'self', username: currentUser?.username }); }} className="py-3 bg-indigo-600 text-white font-black rounded-2xl uppercase text-xs flex items-center justify-center gap-2">
                        <Key size={14}/> Change Password
                      </button>
                    </div>
                    <button onClick={() => { setSettingsModal(false); handleLogout(); }} className="w-full py-3 bg-red-600 text-white font-black rounded-2xl uppercase text-xs flex items-center justify-center gap-2">
                      <Users size={14}/> Logout
                    </button>
                  </>
                )}

                {/* BUSINESS TAB */}
                {settingsTab === 'business' && hasPermission(PERMISSIONS.MANAGE_USERS) && (
                  <>
                    {/* Logo Section */}
                    <div className="p-6 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100">
                      <label className="text-xs font-black text-slate-600 uppercase tracking-widest block mb-3">Business Logo</label>
                      <div className="flex items-center gap-4">
                        {businessSettings.businessLogo instanceof File ? (
                          <img src={URL.createObjectURL(businessSettings.businessLogo)} alt="Logo" className="w-20 h-20 rounded-xl object-cover" />
                        ) : (
                          <div className="w-20 h-20 bg-white rounded-xl border-2 border-dashed border-indigo-300 flex items-center justify-center text-slate-300">
                            <Package size={32}/>
                          </div>
                        )}
                        <input type="file" accept="image/*" onChange={handleLogoChange} className="flex-1 text-sm cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-indigo-600 file:text-white file:font-bold hover:file:bg-indigo-700" />
                      </div>
                    </div>

                    {/* Business Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-black text-slate-600 uppercase tracking-widest block mb-2">Business Name</label>
                        <input 
                          type="text" 
                          value={businessSettings.businessName} 
                          onChange={(e) => setBusinessSettings({...businessSettings, businessName: e.target.value})} 
                          className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:ring-2 ring-indigo-500" 
                          placeholder="e.g., Designer Tailors" 
                        />
                      </div>
                      <div>
                        <label className="text-xs font-black text-slate-600 uppercase tracking-widest block mb-2">Business Phone</label>
                        <input 
                          type="tel" 
                          value={businessSettings.businessPhone} 
                          onChange={(e) => setBusinessSettings({...businessSettings, businessPhone: e.target.value.replace(/[^0-9]/g, '')})} 
                          className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:ring-2 ring-indigo-500" 
                          placeholder="e.g., 923251234567" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-black text-slate-600 uppercase tracking-widest block mb-2">WhatsApp Number</label>
                        <input 
                          type="tel" 
                          value={businessSettings.businessWhatsApp} 
                          onChange={(e) => setBusinessSettings({...businessSettings, businessWhatsApp: e.target.value.replace(/[^0-9]/g, '')})} 
                          className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:ring-2 ring-indigo-500" 
                          placeholder="e.g., 923001234567" 
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-black text-slate-600 uppercase tracking-widest block mb-2">Business Address</label>
                      <textarea 
                        value={businessSettings.businessAddress} 
                        onChange={(e) => setBusinessSettings({...businessSettings, businessAddress: e.target.value})} 
                        className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:ring-2 ring-indigo-500 resize-none" 
                        rows={3}
                        placeholder="Enter complete business address..." 
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button onClick={() => setSettingsModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-black rounded-2xl uppercase text-xs hover:bg-slate-200 transition">Cancel</button>
                      <button onClick={handleSaveBusinessSettings} className="flex-1 py-3 bg-indigo-600 text-white font-black rounded-2xl uppercase text-xs hover:bg-indigo-700 transition flex items-center justify-center gap-2"><Save size={14}/> Save Settings</button>
                    </div>
                  </>
                )}

                {/* EXPORT TAB */}
                {settingsTab === 'export' && (
                  <>
                    <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100">
                      <div className="flex items-center gap-2 mb-4">
                        <ArrowDownRight size={20} className="text-emerald-600"/>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">Export Your Data</h4>
                      </div>
                      <p className="text-xs text-slate-600 mb-6">Download your business data as CSV files. Perfect for backup, analysis, or importing into other systems.</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <button 
                          onClick={() => { exportOrders(); showToast('Orders exported successfully!', 'success'); }}
                          className="flex items-center justify-between p-4 bg-white hover:bg-emerald-50 rounded-xl border-2 border-emerald-200 transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-600 transition">
                              <Package size={20} className="text-emerald-600 group-hover:text-white"/>
                            </div>
                            <div className="text-left">
                              <p className="font-black text-sm text-slate-800">Orders</p>
                              <p className="text-[9px] text-slate-500 uppercase font-bold">{orders.length} records</p>
                            </div>
                          </div>
                          <ArrowDownRight size={18} className="text-emerald-600"/>
                        </button>

                        <button 
                          onClick={() => { exportCustomers(); showToast('Customers exported successfully!', 'success'); }}
                          className="flex items-center justify-between p-4 bg-white hover:bg-emerald-50 rounded-xl border-2 border-emerald-200 transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-600 transition">
                              <Users size={20} className="text-emerald-600 group-hover:text-white"/>
                            </div>
                            <div className="text-left">
                              <p className="font-black text-sm text-slate-800">Customers</p>
                              <p className="text-[9px] text-slate-500 uppercase font-bold">{customers.length} records</p>
                            </div>
                          </div>
                          <ArrowDownRight size={18} className="text-emerald-600"/>
                        </button>

                        <button 
                          onClick={() => { exportExpenses(); showToast('Expenses exported successfully!', 'success'); }}
                          className="flex items-center justify-between p-4 bg-white hover:bg-emerald-50 rounded-xl border-2 border-emerald-200 transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-600 transition">
                              <DollarSign size={20} className="text-emerald-600 group-hover:text-white"/>
                            </div>
                            <div className="text-left">
                              <p className="font-black text-sm text-slate-800">Expenses</p>
                              <p className="text-[9px] text-slate-500 uppercase font-bold">{expenses.length} records</p>
                            </div>
                          </div>
                          <ArrowDownRight size={18} className="text-emerald-600"/>
                        </button>

                        <button 
                          onClick={() => { 
                            const now = new Date();
                            const oneMonthAgo = new Date(now);
                            oneMonthAgo.setMonth(now.getMonth() - 1);
                            exportReport(oneMonthAgo.toISOString().split('T')[0], now.toISOString().split('T')[0]); 
                            showToast('Report exported successfully!', 'success');
                          }}
                          className="flex items-center justify-between p-4 bg-white hover:bg-emerald-50 rounded-xl border-2 border-emerald-200 transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-600 transition">
                              <BarChart3 size={20} className="text-emerald-600 group-hover:text-white"/>
                            </div>
                            <div className="text-left">
                              <p className="font-black text-sm text-slate-800">Report</p>
                              <p className="text-[9px] text-slate-500 uppercase font-bold">Last 30 days</p>
                            </div>
                          </div>
                          <ArrowDownRight size={18} className="text-emerald-600"/>
                        </button>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="flex items-start gap-2">
                        <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0"/>
                        <div>
                          <p className="text-xs font-bold text-blue-900 mb-1">About Exports</p>
                          <p className="text-[10px] text-blue-700">Files are downloaded as CSV format and can be opened in Excel, Google Sheets, or any spreadsheet application. All data includes complete details for easy analysis and backup.</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {passwordModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
            <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-2xl w-full max-w-md animate-in zoom-in-95">
              <h3 className="text-xl font-black mb-6 uppercase tracking-tight">
                {passwordModal.mode === 'reset' ? 'Reset Password' : 'Change Password'}
              </h3>
              <div className="space-y-4">
                <div className="text-xs font-bold text-slate-400 uppercase">User: {passwordModal.username || 'Current User'}</div>
                {passwordModal.mode === 'self' && (
                  <div>
                    <label className="text-xs font-bold text-slate-400 mb-1 block uppercase">Current Password</label>
                    <input type="password" id="currentPassword" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold outline-none focus:ring-2 ring-indigo-500" placeholder="Enter current password" />
                  </div>
                )}
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block uppercase">New Password</label>
                  <input type="password" id="newPassword" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold outline-none focus:ring-2 ring-indigo-500" placeholder="Enter new password" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block uppercase">Confirm New Password</label>
                  <input type="password" id="confirmPassword" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold outline-none focus:ring-2 ring-indigo-500" placeholder="Confirm new password" />
                </div>
                <div className="flex gap-2 mt-6">
                  <button onClick={() => setPasswordModal(null)} className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold rounded-2xl uppercase text-xs">Cancel</button>
                  <button onClick={() => handlePasswordChange({ userId: passwordModal.userId, requireCurrent: passwordModal.mode === 'self' })} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-2xl uppercase text-xs">Save Password</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {paymentModal && (() => {
          const visibleOrders = getVisibleOrders(orders);
          return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
            <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-2xl w-full max-w-sm animate-in zoom-in-95">
              <h3 className="text-xl font-black mb-6 uppercase tracking-tight">Record Receipt</h3>
              <input type="number" autoFocus id="pIn" defaultValue={(() => {
                  if (paymentModal.type === 'order') {
                    const o = visibleOrders.find(ord => ord.id === paymentModal.id);
                    return o ? Math.max(0, o.totalPrice - o.payments.reduce((a,b)=>a+b.amount,0)) : '';
                  } else {
                    const custOrders = visibleOrders.filter(o => o.customerId === paymentModal.id);
                    return Math.max(0, custOrders.reduce((acc, o) => acc + (o.totalPrice - o.payments.reduce((a,b)=>a+b.amount,0)), 0));
                  }
              })()} className="w-full p-6 bg-emerald-50 text-emerald-700 rounded-2xl font-black text-4xl border-none outline-none mb-2" placeholder="0"/>
              <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block ml-1">Deposit To</label>
              <select id="pAcc" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold outline-none focus:ring-2 ring-indigo-500 mb-6">
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <div className="flex gap-2"><button onClick={()=>setPaymentModal(null)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl text-[10px] uppercase tracking-widest">Cancel</button><button onClick={() => { const amt = document.getElementById('pIn').value; const accId = document.getElementById('pAcc').value; if(paymentModal.type==='order') addPartialPayment(paymentModal.id, amt, accId); else { let rem = Number(amt); visibleOrders.forEach(o => { if(o.customerId===paymentModal.id && rem>0){ const d = o.totalPrice - o.payments.reduce((a,b)=>a+b.amount,0); if(d>0){ const pay = Math.min(d, rem); rem -= pay; addPartialPayment(o.id, pay, accId); } } }); } setPaymentModal(null); }} className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest">Save</button></div>
            </div>
          </div>
          );
        })()}

        {viewingOrder && <OrderDetailView order={viewingOrder} onClose={() => setViewingOrder(null)} />}
        {viewingOrder && <OrderDetailView order={orders.find(o => o.id === viewingOrder.id) || viewingOrder} onClose={() => setViewingOrder(null)} />}
        {viewingCustomerId && <CustomerHistoryView customerId={viewingCustomerId} onClose={() => setViewingCustomerId(null)} />}
        {viewingWorkerLedger && <WorkerLedgerView worker={viewingWorkerLedger} onClose={() => setViewingWorkerLedger(null)} />}

        {addWorkerModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
            <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-2xl w-full max-w-md animate-in zoom-in-95 max-h-[90vh] overflow-y-auto no-scrollbar">
              <h3 className="text-xl font-black mb-6 uppercase tracking-tight">Add New Staff</h3>
              <div className="space-y-4">
                <div><label className="text-xs font-bold text-slate-400 mb-1 block uppercase">Full Name</label><input id="workerName" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold outline-none focus:ring-2 ring-indigo-500" placeholder="Enter staff name" /></div>
                
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-3 block uppercase">Select Roles</label>
                  <div className="space-y-2">
                    {PREDEFINED_ROLES.map(role => (
                      <label key={role} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition">
                        <input 
                          type="checkbox" 
                          checked={workerRoleSelection[role] || false}
                          onChange={(e) => setWorkerRoleSelection({...workerRoleSelection, [role]: e.target.checked})}
                          className="w-4 h-4 accent-indigo-600 rounded"
                        />
                        <span className="font-bold text-sm text-slate-700">{role}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block uppercase">Custom Role (Optional)</label>
                  <input 
                    id="workerCustomRole" 
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold outline-none focus:ring-2 ring-indigo-500" 
                    placeholder="e.g. Tailor, Presser" 
                    value={workerCustomRole}
                    onChange={(e) => setWorkerCustomRole(e.target.value)}
                  />
                </div>
                
                <div><label className="text-xs font-bold text-slate-400 mb-1 block uppercase">Rate per Suit (Rs)</label><input type="number" id="workerRate" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold outline-none focus:ring-2 ring-indigo-500" placeholder="0" /></div>
                
                <div className="flex gap-2 mt-6">
                  <button onClick={() => {
                    setAddWorkerModal(false);
                    setWorkerRoleSelection({});
                    setWorkerCustomRole('');
                    document.getElementById('workerName').value = '';
                    document.getElementById('workerRate').value = '';
                  }} className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold rounded-2xl uppercase text-xs">Cancel</button>
                  <button onClick={() => {
                    const name = document.getElementById('workerName').value.trim();
                    const rate = Number(document.getElementById('workerRate').value);
                    const selectedRoles = Object.keys(workerRoleSelection).filter(r => workerRoleSelection[r]);
                    const customRole = workerCustomRole.trim();
                    const allRoles = customRole ? [...selectedRoles, customRole] : selectedRoles;
                    
                    if (name && rate > 0 && allRoles.length > 0) {
                      addWorker({ name, roles: allRoles, ratePerSuit: rate });
                      setAddWorkerModal(false);
                      setWorkerRoleSelection({});
                      setWorkerCustomRole('');
                      document.getElementById('workerName').value = '';
                      document.getElementById('workerRate').value = '';
                    } else if (name && rate > 0) {
                      showToast('Please select at least one role', 'error');
                    }
                  }} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-2xl uppercase text-xs">Add Staff</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {editingWorker && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
            <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-2xl w-full max-w-md animate-in zoom-in-95 max-h-[90vh] overflow-y-auto no-scrollbar">
              <h3 className="text-xl font-black mb-6 uppercase tracking-tight">Edit Staff</h3>
              <div className="space-y-4">
                <div><label className="text-xs font-bold text-slate-400 mb-1 block uppercase">Full Name</label><input id="editWorkerName" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold outline-none focus:ring-2 ring-indigo-500" defaultValue={editingWorker.name} /></div>
                
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-3 block uppercase">Select Roles</label>
                  <div className="space-y-2">
                    {PREDEFINED_ROLES.map(role => (
                      <label key={role} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition">
                        <input 
                          type="checkbox" 
                          checked={workerRoleSelection[role] || false}
                          onChange={(e) => setWorkerRoleSelection({...workerRoleSelection, [role]: e.target.checked})}
                          className="w-4 h-4 accent-indigo-600 rounded"
                        />
                        <span className="font-bold text-sm text-slate-700">{role}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block uppercase">Custom Role (Optional)</label>
                  <input 
                    id="editWorkerCustomRole" 
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold outline-none focus:ring-2 ring-indigo-500" 
                    placeholder="e.g. Tailor, Presser"
                    value={workerCustomRole}
                    onChange={(e) => setWorkerCustomRole(e.target.value)}
                  />
                </div>
                
                <div><label className="text-xs font-bold text-slate-400 mb-1 block uppercase">Rate per Suit (Rs)</label><input type="number" id="editWorkerRate" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold outline-none focus:ring-2 ring-indigo-500" defaultValue={editingWorker.ratePerSuit} /></div>
                
                <div className="flex gap-2 mt-6">
                  <button onClick={() => {
                    setEditingWorker(null);
                    setWorkerRoleSelection({});
                    setWorkerCustomRole('');
                  }} className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold rounded-2xl uppercase text-xs">Cancel</button>
                  <button onClick={() => {
                    const name = document.getElementById('editWorkerName').value.trim();
                    const rate = Number(document.getElementById('editWorkerRate').value);
                    const selectedRoles = Object.keys(workerRoleSelection).filter(r => workerRoleSelection[r]);
                    const customRole = workerCustomRole.trim();
                    const allRoles = customRole ? [...selectedRoles, customRole] : selectedRoles;
                    
                    if (name && rate > 0 && allRoles.length > 0) {
                      updateWorker(editingWorker.id, { name, roles: allRoles, ratePerSuit: rate });
                    } else if (name && rate > 0) {
                      showToast('Please select at least one role', 'error');
                    }
                  }} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-2xl uppercase text-xs">Save Changes</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {addUserModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
            <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar animate-in zoom-in-95">
              <h3 className="text-xl font-black mb-6 uppercase tracking-tight">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h3>
              <div className="space-y-4">
                <div><label className="text-xs font-bold text-slate-400 mb-1 block uppercase">Full Name</label><input id="userName" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold outline-none focus:ring-2 ring-indigo-500" placeholder="Enter full name" defaultValue={editingUser?.name || ''} /></div>
                <div><label className="text-xs font-bold text-slate-400 mb-1 block uppercase">Username</label><input id="userUsername" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold outline-none focus:ring-2 ring-indigo-500" placeholder="Enter username" defaultValue={editingUser?.username || ''} /></div>
                <div><label className="text-xs font-bold text-slate-400 mb-1 block uppercase">Password</label><input type="password" id="userPassword" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold outline-none focus:ring-2 ring-indigo-500" placeholder="Enter password" /></div>
                <div><label className="text-xs font-bold text-slate-400 mb-1 block uppercase">Role</label>
                  <input id="userRole" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold outline-none focus:ring-2 ring-indigo-500" placeholder="e.g. Admin, Cutter, Manager" defaultValue={editingUser?.role || ''} />
                </div>
                
                {/* Permissions Section */}
                <div className="pt-4 border-t border-slate-200">
                  <label className="text-xs font-bold text-slate-400 mb-3 block uppercase">Permissions</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Dashboard */}
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <h4 className="text-xs font-black text-slate-600 mb-2 uppercase">Dashboard</h4>
                      <label className="flex items-center gap-2 text-sm mb-1 cursor-pointer">
                        <input type="checkbox" checked={selectedPermissions.includes(PERMISSIONS.VIEW_DASHBOARD)} onChange={(e) => {
                          if (e.target.checked) setSelectedPermissions([...selectedPermissions, PERMISSIONS.VIEW_DASHBOARD]);
                          else setSelectedPermissions(selectedPermissions.filter(p => p !== PERMISSIONS.VIEW_DASHBOARD));
                        }} className="w-4 h-4 text-indigo-600 rounded" />
                        <span>View Dashboard</span>
                      </label>
                    </div>
                    
                    {/* Orders */}
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <h4 className="text-xs font-black text-slate-600 mb-2 uppercase">Orders</h4>
                      {[
                        { perm: PERMISSIONS.VIEW_OWN_ORDERS, label: 'View Own Orders' },
                        { perm: PERMISSIONS.VIEW_ALL_ORDERS, label: 'View All Orders' },
                        { perm: PERMISSIONS.CREATE_ORDERS, label: 'Create Orders' },
                        { perm: PERMISSIONS.EDIT_ORDERS, label: 'Edit Orders' },
                        { perm: PERMISSIONS.DELETE_ORDERS, label: 'Delete Orders' },
                        { perm: PERMISSIONS.EDIT_ORDER_MEASUREMENTS, label: 'Edit Measurements' }
                      ].map(({ perm, label }) => (
                        <label key={perm} className="flex items-center gap-2 text-sm mb-1 cursor-pointer">
                          <input type="checkbox" checked={selectedPermissions.includes(perm)} onChange={(e) => {
                            if (e.target.checked) setSelectedPermissions([...selectedPermissions, perm]);
                            else setSelectedPermissions(selectedPermissions.filter(p => p !== perm));
                          }} className="w-4 h-4 text-indigo-600 rounded" />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                    
                    {/* Customers */}
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <h4 className="text-xs font-black text-slate-600 mb-2 uppercase">Customers</h4>
                      {[
                        { perm: PERMISSIONS.VIEW_OWN_CUSTOMERS, label: 'View Own Customers' },
                        { perm: PERMISSIONS.VIEW_ALL_CUSTOMERS, label: 'View All Customers' },
                        { perm: PERMISSIONS.CREATE_CUSTOMERS, label: 'Create Customers' },
                        { perm: PERMISSIONS.EDIT_CUSTOMERS, label: 'Edit Customers' },
                        { perm: PERMISSIONS.DELETE_CUSTOMERS, label: 'Delete Customers' },
                        { perm: PERMISSIONS.EDIT_CUSTOMER_MEASUREMENTS, label: 'Edit Measurements' }
                      ].map(({ perm, label }) => (
                        <label key={perm} className="flex items-center gap-2 text-sm mb-1 cursor-pointer">
                          <input type="checkbox" checked={selectedPermissions.includes(perm)} onChange={(e) => {
                            if (e.target.checked) setSelectedPermissions([...selectedPermissions, perm]);
                            else setSelectedPermissions(selectedPermissions.filter(p => p !== perm));
                          }} className="w-4 h-4 text-indigo-600 rounded" />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                    
                    {/* Workers */}
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <h4 className="text-xs font-black text-slate-600 mb-2 uppercase">Workers</h4>
                      {[
                        { perm: PERMISSIONS.VIEW_WORKERS, label: 'View Workers' },
                        { perm: PERMISSIONS.CREATE_WORKERS, label: 'Create Workers' },
                        { perm: PERMISSIONS.EDIT_WORKERS, label: 'Edit Workers' },
                        { perm: PERMISSIONS.DELETE_WORKERS, label: 'Delete Workers' },
                        { perm: PERMISSIONS.PAY_WORKERS, label: 'Pay Workers' }
                      ].map(({ perm, label }) => (
                        <label key={perm} className="flex items-center gap-2 text-sm mb-1 cursor-pointer">
                          <input type="checkbox" checked={selectedPermissions.includes(perm)} onChange={(e) => {
                            if (e.target.checked) setSelectedPermissions([...selectedPermissions, perm]);
                            else setSelectedPermissions(selectedPermissions.filter(p => p !== perm));
                          }} className="w-4 h-4 text-indigo-600 rounded" />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                    
                    {/* Expenses */}
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <h4 className="text-xs font-black text-slate-600 mb-2 uppercase">Expenses</h4>
                      {[
                        { perm: PERMISSIONS.VIEW_OWN_EXPENSES, label: 'View Own Expenses' },
                        { perm: PERMISSIONS.VIEW_ALL_EXPENSES, label: 'View All Expenses' },
                        { perm: PERMISSIONS.CREATE_EXPENSES, label: 'Create Expenses' },
                        { perm: PERMISSIONS.EDIT_EXPENSES, label: 'Edit Expenses' },
                        { perm: PERMISSIONS.DELETE_EXPENSES, label: 'Delete Expenses' }
                      ].map(({ perm, label }) => (
                        <label key={perm} className="flex items-center gap-2 text-sm mb-1 cursor-pointer">
                          <input type="checkbox" checked={selectedPermissions.includes(perm)} onChange={(e) => {
                            if (e.target.checked) setSelectedPermissions([...selectedPermissions, perm]);
                            else setSelectedPermissions(selectedPermissions.filter(p => p !== perm));
                          }} className="w-4 h-4 text-indigo-600 rounded" />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                    
                    {/* Other Permissions */}
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <h4 className="text-xs font-black text-slate-600 mb-2 uppercase">Other</h4>
                      {[
                        { perm: PERMISSIONS.VIEW_ACCOUNTS, label: 'View Accounts' },
                        { perm: PERMISSIONS.VIEW_OWN_REPORTS, label: 'View Own Reports' },
                        { perm: PERMISSIONS.VIEW_ALL_REPORTS, label: 'View All Reports' },
                        { perm: PERMISSIONS.MANAGE_USERS, label: 'Manage Users' }
                      ].map(({ perm, label }) => (
                        <label key={perm} className="flex items-center gap-2 text-sm mb-1 cursor-pointer">
                          <input type="checkbox" checked={selectedPermissions.includes(perm)} onChange={(e) => {
                            if (e.target.checked) setSelectedPermissions([...selectedPermissions, perm]);
                            else setSelectedPermissions(selectedPermissions.filter(p => p !== perm));
                          }} className="w-4 h-4 text-indigo-600 rounded" />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-6">
                  <button onClick={() => { setAddUserModal(false); setEditingUser(null); setSelectedPermissions([]); }} className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold rounded-2xl uppercase text-xs">Cancel</button>
                  <button onClick={() => {
                    const name = document.getElementById('userName').value.trim();
                    const username = document.getElementById('userUsername').value.trim();
                    const password = document.getElementById('userPassword').value;
                    const role = document.getElementById('userRole').value;

                    if (name && username && (password || editingUser)) {
                      if (editingUser) {
                        updateUser(editingUser.id, {
                          name,
                          username,
                          role,
                          permissions: selectedPermissions,
                          ...(password && { password })
                        });
                      } else {
                        addUser({ name, username, password, role, permissions: selectedPermissions });
                      }
                      setAddUserModal(false);
                      setEditingUser(null);
                      setSelectedPermissions([]);
                      document.getElementById('userName').value = '';
                      document.getElementById('userUsername').value = '';
                      document.getElementById('userPassword').value = '';
                    }
                  }} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-2xl uppercase text-xs">
                    {editingUser ? 'Update User' : 'Add User'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {editingOrder && <EditOrderModal order={editingOrder} onClose={() => setEditingOrder(null)} onSave={handleUpdateOrder} />}

        {editingMeasurements && hasPermission(PERMISSIONS.EDIT_ORDER_MEASUREMENTS) && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[250] flex items-center justify-center p-3 md:p-6">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto no-scrollbar animate-in zoom-in-95 flex flex-col">
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 md:p-8 rounded-t-3xl flex items-center justify-between">
                <div>
                  <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight">Order Measurements</h2>
                  <p className="text-sm md:text-base text-indigo-100 mt-2">Edit body measurements and styling notes</p>
                </div>
                <button onClick={() => setEditingMeasurements(null)} className="p-2 md:p-3 bg-white/20 hover:bg-white/30 rounded-full transition text-white ml-4 flex-shrink-0">
                  <X size={24}/>
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 p-4 md:p-8 space-y-6 md:space-y-8">
                {editingMeasurements.measurements?.map((profile, profileIdx) => (
                  <div key={profileIdx} className="bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-100 rounded-2xl md:rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition">
                    {/* Profile Header */}
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-4 md:px-8 py-4 md:py-6 text-white">
                      <h4 className="text-lg md:text-2xl font-black uppercase tracking-tight">{profile.profileName || `Profile ${profileIdx + 1}`}</h4>
                    </div>

                    {/* Measurements Grid */}
                    <div className="p-4 md:p-8 space-y-6">
                      <div>
                        <label className="text-xs md:text-sm font-black text-indigo-600 uppercase tracking-widest block mb-4">Body Measurements (in inches)</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 md:gap-4">
                          {[
                            { name: 'Length', color: 'from-blue-50 to-blue-100' },
                            { name: 'Shoulder', color: 'from-purple-50 to-purple-100' },
                            { name: 'Chest', color: 'from-red-50 to-red-100' },
                            { name: 'Waist', color: 'from-green-50 to-green-100' },
                            { name: 'Sleeve', color: 'from-yellow-50 to-yellow-100' },
                            { name: 'Daman', color: 'from-pink-50 to-pink-100' },
                            { name: 'Collar', color: 'from-cyan-50 to-cyan-100' },
                            { name: 'Pant Length', color: 'from-orange-50 to-orange-100' },
                            { name: 'Ghera', color: 'from-teal-50 to-teal-100' }
                          ].map(({ name, color }) => (
                            <div key={name} className={`bg-gradient-to-br ${color} rounded-xl md:rounded-2xl p-3 md:p-4 border border-slate-200 hover:border-indigo-300 transition`}>
                              <label className="text-[9px] md:text-xs font-black text-slate-600 uppercase block mb-2 tracking-widest">{name}</label>
                              <input
                                type="text"
                                placeholder="0"
                                className="w-full px-3 md:px-4 py-2 md:py-3 bg-white rounded-lg border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 font-bold text-base md:text-lg outline-none transition text-center"
                                defaultValue={profile.measurements[name.toLowerCase()] || ''}
                                onChange={(e) => {
                                  const updatedMeasurements = [...editingMeasurements.measurements];
                                  updatedMeasurements[profileIdx] = {
                                    ...updatedMeasurements[profileIdx],
                                    measurements: {
                                      ...updatedMeasurements[profileIdx].measurements,
                                      [name.toLowerCase()]: e.target.value
                                    }
                                  };
                                  setEditingMeasurements({
                                    ...editingMeasurements,
                                    measurements: updatedMeasurements
                                  });
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Styling Notes */}
                      <div className="pt-4 md:pt-6 border-t-2 border-indigo-200">
                        <label className="text-xs md:text-sm font-black text-indigo-600 uppercase tracking-widest block mb-3">Styling Notes & Special Instructions</label>
                        <textarea 
                          className="w-full px-4 md:px-6 py-3 md:py-4 bg-white border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl md:rounded-2xl font-medium text-sm md:text-base outline-none transition resize-none" 
                          rows={3}
                          placeholder="Add any special styling notes, fit preferences, or customization details..."
                          defaultValue={profile.styling || ''} 
                          onChange={(e) => {
                            const updatedMeasurements = [...editingMeasurements.measurements];
                            updatedMeasurements[profileIdx] = { 
                              ...updatedMeasurements[profileIdx], 
                              styling: e.target.value 
                            };
                            setEditingMeasurements({ 
                              ...editingMeasurements, 
                              measurements: updatedMeasurements 
                            });
                          }} 
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-slate-50 border-t-2 border-slate-200 px-4 md:px-8 py-4 md:py-6 flex gap-3">
                <button 
                  onClick={() => setEditingMeasurements(null)} 
                  className="flex-1 py-3 md:py-4 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-xl md:rounded-2xl uppercase text-xs md:text-sm tracking-widest transition active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setOrders(prev => prev.map(o =>
                      o.id === editingMeasurements.id
                        ? { ...o, measurements: editingMeasurements.measurements }
                        : o
                    ));
                    setEditingMeasurements(null);
                    showToast('Order measurements updated successfully!', 'success');
                  }} 
                  className="flex-1 py-3 md:py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black rounded-xl md:rounded-2xl uppercase text-xs md:text-sm tracking-widest shadow-lg hover:shadow-xl transition active:scale-95 flex items-center justify-center gap-2"
                >
                  <Check size={18}/> Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null })}
        type={confirmDialog.type}
      />

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-[999] space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`px-6 py-4 rounded-xl shadow-2xl font-bold text-sm min-w-[300px] animate-in slide-in-from-right duration-300 ${
              toast.type === 'success' ? 'bg-emerald-600 text-white' :
              toast.type === 'error' ? 'bg-red-600 text-white' :
              toast.type === 'warning' ? 'bg-orange-500 text-white' :
              'bg-indigo-600 text-white'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}

// --- MAIN CONTENT EXPORT ---
export { AppContent };

// --- SHARED HELPERS ---

function StatCard({ title, value, color }) {
  return (
    <div className={`p-6 rounded-[2.5rem] border border-slate-100 bg-white shadow-sm flex flex-col items-center text-center transition-transform hover:translate-y-[-4px]`}>
      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{title}</h3>
      <p className={`text-2xl font-black ${color.split(' ')[1]}`}>{value}</p>
      <div className={`mt-3 w-8 h-1 rounded-full ${color.split(' ')[0].replace('50', '200')}`}></div>
    </div>
  );
}

function ReportStat({ label, value, desc, icon, color }) {
  const cMap = { indigo: 'text-indigo-600 bg-indigo-50', emerald: 'text-emerald-600 bg-emerald-50', red: 'text-red-600 bg-red-50', orange: 'text-orange-600 bg-orange-50' };
  return (
    <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
       <div className={`w-12 h-12 rounded-2xl mb-6 flex items-center justify-center ${cMap[color]}`}>{icon}</div>
       <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{label}</h4>
       <p className="text-xl font-black mb-1">{value}</p>
       <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{desc}</p>
    </div>
  );
}

function ProgressRow({ label, value, total, color }) {
  const pc = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="space-y-2">
       <div className="flex justify-between text-[10px] font-black uppercase tracking-widest"><span>{label}</span><span className="text-indigo-600">{pc.toFixed(1)}%</span></div>
       <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full ${color} transition-all duration-1000`} style={{width: `${pc}%`}}></div></div>
    </div>
  );
}

function StatPanel({ label, rows, footer }) {
  return (
    <section className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
       <h3 className="font-black text-slate-400 text-[10px] uppercase mb-6 tracking-widest">{label}</h3>
       <div className="space-y-4 mb-6">
          {rows.map((r,i) => <div key={i} className="flex justify-between text-sm font-bold uppercase tracking-tight"><span className="text-slate-400">{r.l}</span><span className={`${r.c || ''}`}>{formatCurrency(r.v)}</span></div>)}
       </div>
       <div className="pt-6 border-t flex justify-between items-center"><span className="font-black text-xs uppercase tracking-wider">{footer.l}</span><span className={`text-2xl font-black ${footer.c}`}>{formatCurrency(footer.v)}</span></div>
    </section>
  );
}

function WorkerBadge({ label, name, onClick }) {
  return (
    <button onClick={onClick} className={`px-4 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest transition flex items-center gap-2 ${name ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-indigo-200 hover:text-indigo-600 shadow-sm'}`}>
      <span className="opacity-50">{label}:</span>{name || '+ Assign'}
    </button>
  );
}

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(username, password);
  };

  return (
    <div className="flex h-screen bg-slate-100 items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm">
        <h2 className="text-2xl font-black text-slate-800 mb-6 text-center">Login</h2>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-4 bg-slate-50 rounded-xl border-none font-bold"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 bg-slate-50 rounded-xl border-none font-bold"
          />
          <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black hover:bg-indigo-700 transition">
            Login
          </button>
        </div>
      </form>
    </div>
  );
}

function ExpenseEditModal({ expense, onClose, onSave, accounts }) {
  const [eData, setEData] = useState(expense);

  const handleSave = () => {
    onSave(expense.id, eData);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
      <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-2xl w-full max-w-md animate-in zoom-in-95">
        <h3 className="text-xl font-black mb-6 uppercase tracking-tight">Edit Expense</h3>
        <div className="space-y-4">
          <div className="space-y-1"><label className="text-xs font-bold text-slate-400 uppercase">Category</label><select value={eData.category} onChange={e=>setEData({...eData, category:e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold">{EXPENSE_CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></div>
          <div className="space-y-1"><label className="text-xs font-bold text-slate-400 uppercase">Amount (Rs)</label><input type="number" value={eData.amount} onChange={e=>setEData({...eData, amount:e.target.value})} className="w-full p-4 bg-red-50 text-red-700 rounded-2xl font-black text-3xl border-none outline-none" /></div>
          <div className="space-y-1"><label className="text-xs font-bold text-slate-400 uppercase">Paid From</label><select value={eData.accountId} onChange={e=>setEData({...eData, accountId:e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold">{accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
          <div className="space-y-1"><label className="text-xs font-bold text-slate-400 uppercase">Short Note</label><input value={eData.note} onChange={e=>setEData({...eData, note:e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border-none font-bold" /></div>
          <div className="flex gap-2 mt-6">
            <button onClick={onClose} className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold rounded-2xl uppercase text-xs">Cancel</button>
            <button onClick={handleSave} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-2xl uppercase text-xs">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}