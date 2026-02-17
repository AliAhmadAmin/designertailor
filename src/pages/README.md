# GeminiERP - Modular Code Structure

## Overview
The application has been refactored from a single monolithic file into a modular component-based architecture.

## Current Structure

### Core Files
- **src/App.jsx** - Lightweight Router wrapper (simplified, just 12 lines)
- **src/AppLogic.jsx** - Contains all the main application logic (AppContent component with 3,600+ lines)
- **src/main.jsx** - Application entry point

### Pages Directory (src/pages/)
Individual page components are being migrated here:
- **Dashboard.jsx** - Dashboard overview and analytics
- **Booking.jsx** - New order booking form  
- **Orders.jsx** - Orders management and tracking
- **Customers.jsx** - Customer database and management
- **Workers.jsx** - Staff/worker management
- **Expenses.jsx** - Expense tracking
- **Accounts.jsx** - Account management
- **Reports.jsx** - Reports and analytics
- **Users.jsx** - User management and permissions

### Components Directory (src/components/)
- **shared/** - Reusable components
  - ConfirmationModal.jsx - Professional confirmation dialogs

### Utils Directory (src/utils/)
- **constants.js** - All application constants (permissions, statuses, categories)
- **helpers.js** - Utility functions (formatting, calculations, exports)

## Current Phase: Structural Reorganization

### ✅ Completed
1. Created modular folder structure
2. Extracted constants to `utils/constants.js`
3. Extracted helper functions to `utils/helpers.js`
4. Created reusable ConfirmationModal component
5. Separated routing logic from business logic
6. Created page placeholder files for all sections
7. Backup of original logic in `AppLogic.jsx`

### 🔄 Next Phase: Component Migration
The next steps to complete the modularization:
1. Extract Dashboard component from AppLogic to pages/Dashboard.jsx
2. Extract OrderForm to pages/Booking.jsx
3. Extract OrderList to pages/Orders.jsx
4. Extract Customer components to pages/Customers.jsx
5. Extract Worker components to pages/Workers.jsx
6. Extract related components for other pages
7. Move modals and forms to components/ directory
8. Create a custom hook for shared state management
9. Update App.jsx to import and route to individual pages
10. Gradually refactor AppLogic.jsx to be a state management layer

## Benefits of This Structure
✅ Easier to navigate and find specific features
✅ Scalable for adding new pages and features  
✅ Better code organization and maintainability
✅ Improved team collaboration
✅ Code splitting opportunities for better performance
✅ Easier testing of individual components

## Notes
- The application currently works with AppLogic.jsx containing all logic
- This allows for a gradual migration without breaking functionality
- Once individual pages are extracted, AppLogic can be removed
- Consider implementing React Context or a custom hook for state management in the final version

## Application Routes
- `/` - Dashboard
- `/booking` - New Order Booking
- `/orders` - Orders Management
- `/customers` - Customers
- `/workers` - Staff Management
- `/expenses` - Expenses
- `/accounts` - Accounts
- `/reports` - Reports
- `/users` - User Management
