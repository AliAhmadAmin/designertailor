// Order and Item Constants
export const ORDER_STATUSES = ['Booked', 'Cutting', 'Stitching', 'Ready', 'Delivered'];
export const ITEM_TYPES = ['Shalwar Kameez', '3-Piece Suit', 'Waistcoat', 'Sherwani', 'Shirt/Pant'];
export const EXPENSE_CATEGORIES = ['Rent', 'Electricity', 'Staff Refreshment', 'Materials', 'Marketing', 'Others'];
export const PAYMENT_MODES = ['Cash', 'Online Transfer', 'Card', 'Cheque'];
export const API_BASE = 'api';

// Pagination
export const ITEMS_PER_PAGE = 10;

// Permissions
export const PERMISSIONS = {
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
export const ROLE_PERMISSIONS = {
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
