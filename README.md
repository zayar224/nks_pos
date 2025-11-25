# Kernex POS System

A comprehensive Point of Sale (POS) system built with modern web technologies, designed for multi-shop management with advanced features like order tracking, loyalty programs, and detailed reporting.

## 📋 Overview

Kernex POS is a full-stack application that provides:
- **Cashier Interface**: Fast and intuitive POS checkout experience
- **Admin Dashboard**: Complete business management and analytics
- **Multi-Shop Support**: Manage multiple shops and branches from a single platform
- **Inventory Management**: Real-time stock tracking and transfers
- **Order Management**: Complete order lifecycle from creation to fulfillment
- **Customer Loyalty**: Loyalty tiers and points system
- **Comprehensive Reporting**: Sales reports, audit logs, and analytics
- **Multi-Language Support**: i18n support for internationalization
- **Role-Based Access**: Admin, Shop Owner, and Cashier roles with appropriate permissions

## 🏗️ Project Structure

```
.
├── backend/              # Node.js Express API server
│   ├── routes/          # API route handlers
│   ├── db.js            # MySQL database connection pool
│   ├── server.js        # Express server setup
│   └── uploads/         # User-uploaded files
├── frontend/            # React + Vite application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React context (Auth, etc.)
│   │   ├── api/         # API integration layer
│   │   ├── assets/      # Static assets
│   │   ├── App.jsx      # Main app component
│   │   └── i18n.js      # Internationalization setup
│   ├── package.json
│   └── vite.config.js   # Vite configuration
├── testkernexpos.sql    # Database schema
├── ecosystem.config.cjs # PM2 configuration for production
└── package.json         # Root package configuration
```

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL with mysql2/promise
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: express-validator
- **Password Hashing**: bcryptjs
- **Process Manager**: PM2 (ecosystem.config.cjs)

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Routing**: React Router v7
- **State Management**: React Context API
- **Charts**: Chart.js with react-chartjs-2
- **Icons**: React Icons
- **Animations**: Framer Motion
- **Internationalization**: i18next
- **Notifications**: React Hot Toast, React Toastify
- **PDF Export**: jsPDF
- **Barcode**: Quagga (barcode scanning)

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- MySQL Server
- npm or yarn package manager

### Installation

1. **Clone and install dependencies**:
```bash
npm run build
```

This command will:
- Install root dependencies
- Install backend dependencies
- Install frontend dependencies
- Build the frontend for production

2. **Configure environment variables**:

Create `backend/.env`:
```env
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=testkernexpos
DB_CONNECTION_LIMIT=10
PORT=5200
NODE_ENV=production
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5200/api
```

3. **Set up the database**:
```bash
mysql -u your_db_user -p < testkernexpos.sql
```

### Development

Start the backend server:
```bash
npm run dev
```

Start the frontend development server:
```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5277` and the backend at `http://localhost:3000` (or configured PORT).

### Production

Using PM2 for process management:
```bash
pm2 start ecosystem.config.cjs
```

The application will run on port 5200 with:
- Auto-restart on crashes
- Watch mode for file changes
- Maximum 10 restart limit per hour
- Ignored directories: `backend/uploads`, `logs`

## 📚 Database Schema

The system includes comprehensive database tables for:
- **Users & Authentication**: Users, sessions, roles
- **Products**: Products, categories, inventory, barcodes
- **Orders**: Orders, order items, order payments, status logs
- **Customers**: Customer profiles, loyalty points, e-wallet balance
- **Payments**: Payment methods, refunds, transaction history
- **Loyalty**: Loyalty tiers, tier configurations
- **Inventory**: Stock transfers, audit logs
- **Reporting**: Audit logs, detailed transaction records
- **Settings**: Tax rates, promotions, receipt settings, currencies

See [testkernexpos.sql](testkernexpos.sql) for full schema details.

## 🔐 Authentication & Authorization

The application uses JWT-based authentication with role-based access control:

- **Admin**: Full system access, user management, shop management
- **Shop Owner**: Shop-specific management and reporting
- **Cashier**: POS operations only

Protected routes are enforced through the [`ProtectedRoute`](frontend/src/App.jsx) component which validates user roles.

## 📖 Key Features

### Cashier Interface
- Fast checkout interface at `/`
- Barcode scanning support
- Multiple payment method support
- Receipt generation and printing

### Admin Dashboard
Access at `/dashboard` with comprehensive management:
- Sales reports and analytics
- Order history and management
- Customer management
- Product and inventory management
- User management
- Shop and branch management
- Promotions and loyalty tiers
- Employee attendance tracking
- Audit logs and compliance
- Stock transfers between branches

### API Routes

Key API endpoints:
- `/api/auth/*` - Authentication
- `/api/products/*` - Product management
- `/api/orders/*` - Order operations
- `/api/customers/*` - Customer data
- `/api/payment-methods/*` - Payment configurations
- `/api/reports/sales/*` - Sales reporting
- `/api/shops/*` - Shop management
- `/api/branches/*` - Branch management

See [backend/server.js](backend/server.js) for all configured routes.

## 🌍 Internationalization

The application supports multiple languages through i18next. Language configuration is in [frontend/src/i18n.js](frontend/src/i18n.js).

## 🛡️ Error Handling

- Global error boundary component: [`ErrorBoundary`](frontend/src/components/ErrorBoundary.jsx)
- API-level error handling with detailed error messages
- Server-side error logging with request information

## 📊 Reporting & Analytics

- Sales reports with customizable periods
- Order status tracking
- Customer loyalty analytics
- Audit logs for compliance
- Employee attendance reports

## 🔧 Configuration Files

- [`package.json`](package.json) - Root scripts and dependencies
- [`frontend/package.json`](frontend/package.json) - Frontend dependencies
- [`ecosystem.config.cjs`](ecosystem.config.cjs) - PM2 production configuration
- [`frontend/vite.config.js`](frontend/vite.config.js) - Vite build configuration
- [`frontend/eslint.config.js`](frontend/eslint.config.js) - Linting rules

## 📝 Scripts

```bash
# Root level
npm run dev        # Start backend in development
npm run build      # Install deps and build frontend
npm run start      # Start backend in production

# Frontend
cd frontend
npm run dev        # Development server on port 5277
npm run build      # Build for production
npm run lint       # Run ESLint
npm run preview    # Preview production build
```

## 📄 License

ISC

## 👥 Support

For issues and questions, please refer to the project documentation or contact the development team.
