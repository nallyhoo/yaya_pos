# YaYa Mart POS System

A professional, high-performance Point of Sale (POS) system designed for the Cambodian retail market. Built with a modern full-stack architecture, it features real-time inventory tracking, dual-currency support, and robust role-based security.

## 🚀 Key Features

### 🛡️ Security & Authentication
-   **JWT-Based Auth:** Secure session management with persistent tokens.
-   **Role-Based Access Control (RBAC):** 
    -   **Admin:** Full system control, settings, and employee management.
    -   **Manager:** Analytics, inventory viewing, and customer management.
    -   **Cashier:** Fast-access POS terminal and basic sales operations.
-   **Password Hashing:** All credentials secured using `bcryptjs`.

### 🛒 Modern POS Terminal
-   **Fast Checkout:** Optimized UI with keyboard shortcuts (`F1`-`F4`, `Esc`) for lightning-fast operations.
-   **Barcode Ready:** Plug-and-play support for barcode scanners with automatic product detection.
-   **Split Payments:** Support for multiple payment methods in a single transaction (e.g., Cash + Card).
-   **Cart Persistence:** Active carts are saved to `localStorage` to prevent data loss on refresh.

### 🇰🇭 Localization (i18n)
-   **Dual Language:** Instantly toggle the entire UI between **English** and **Khmer**.
-   **Dual Currency:** Real-time conversion and display of **USD** and **Cambodian Riel (KHR)**.
-   **Configurable Exchange Rate:** Admin-controlled exchange rate (default: 4100 KHR).
-   **Localized Receipts:** Professional thermal-style receipts with Khmer currency equivalents.

### 📦 Advanced Inventory & Suppliers
-   **Supplier Management:** Track vendors, contact info, and Tax IDs.
-   **Purchase Orders (PO):** replenishment flow with automated stock sync and cost-price tracking.
-   **Real-time Alerts:** Low-stock and out-of-stock indicators with animated dashboard alerts.

### 💎 Premium UI/UX
-   **Skeleton Loaders:** Professional animated placeholders for all data-heavy sections.
-   **Modern Components:** Built with Radix UI, shadcn/ui, and Tailwind CSS v4.
-   **Responsive Design:** Fully functional on desktop, tablets, and large-format POS displays.

## 🛠️ Tech Stack

-   **Frontend:** React 19, TypeScript, Vite, TanStack Query, tRPC Client, Lucide Icons.
-   **Backend:** Node.js, Express, tRPC Server (Typesafe API).
-   **Database:** LibSQL / SQLite with Drizzle ORM.
-   **Security:** JWT (jose), bcryptjs.

## 📦 Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/nallyhoo/yaya_pos.git
    cd yaya_pos
    ```

2.  **Install dependencies:**
    ```bash
    npm install --legacy-peer-deps
    ```

3.  **Environment Setup:**
    Create a `.env` file in the root:
    ```env
    DATABASE_URL=file:local.db
    NODE_ENV=development
    JWT_SECRET=your-secure-secret-key
    PORT=3001
    ```

4.  **Initialize Database:**
    ```bash
    # This will create the tables and apply the schema
    npx tsx migrate-fix.ts
    npx tsx migrate-advanced.ts
    npx tsx migrate-payments.ts
    ```

5.  **Seed Demo Data:**
    ```bash
    node seed.mjs
    ```

6.  **Run Development Server:**
    ```bash
    npm run dev
    ```

## 🔐 Demo Credentials

| Role | Username | Password |
| :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` |
| **Manager** | `sarah` | `pos123` |
| **Cashier** | `mike` | `pos123` |

## 📄 License

This project is licensed under the MIT License.
