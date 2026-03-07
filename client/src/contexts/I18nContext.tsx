import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { trpc } from "@/lib/trpc";

type Language = "en" | "km";

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  exchangeRate: number;
  formatCurrency: (amount: number | string, currency?: "USD" | "KHR") => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    "pos.terminal": "POS Terminal",
    "pos.search": "Search products (F1)...",
    "pos.all": "All Products",
    "pos.cart": "Current Order",
    "pos.checkout": "PAY NOW (F2)",
    "pos.total": "Total Amount",
    "pos.subtotal": "Subtotal",
    "pos.tax": "Tax",
    "pos.discount": "Discount",
    "pos.items": "Items",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.add": "Add",
    "nav.dashboard": "Dashboard",
    "nav.pos terminal": "POS Terminal",
    "nav.products": "Products",
    "nav.inventory": "Inventory",
    "nav.customers": "Customers",
    "nav.orders": "Orders",
    "nav.reports": "Reports",
    "nav.settings": "Settings",
    "nav.employees": "Employees",
    "nav.categories": "Categories",
    "nav.suppliers": "Suppliers",
    "nav.purchase orders": "Purchase Orders",
  },
  km: {
    "pos.terminal": "បញ្ជរលក់ទំនិញ",
    "pos.search": "ស្វែងរកទំនិញ (F1)...",
    "pos.all": "ទំនិញទាំងអស់",
    "pos.cart": "បញ្ជីទំនិញបច្ចុប្បន្ន",
    "pos.checkout": "បង់ប្រាក់ (F2)",
    "pos.total": "ចំនួនទឹកប្រាក់សរុប",
    "pos.subtotal": "សរុប",
    "pos.tax": "ពន្ធ",
    "pos.discount": "បញ្ចុះតម្លៃ",
    "pos.items": "មុខទំនិញ",
    "common.save": "រក្សាទុក",
    "common.cancel": "បោះបង់",
    "common.delete": "លុប",
    "common.edit": "កែសម្រួល",
    "common.add": "បន្ថែម",
    "nav.dashboard": "ផ្ទាំងគ្រប់គ្រង",
    "nav.pos terminal": "បញ្ជរលក់ទំនិញ",
    "nav.products": "ទំនិញ",
    "nav.inventory": "ស្តុក",
    "nav.customers": "អតិថិជន",
    "nav.orders": "ការបញ្ជាទិញ",
    "nav.reports": "របាយការណ៍",
    "nav.settings": "ការកំណត់",
    "nav.employees": "បុគ្គលិក",
    "nav.categories": "ប្រភេទ",
    "nav.suppliers": "អ្នកផ្គត់ផ្គង់",
    "nav.purchase orders": "ការបញ្ជាទិញទំនិញចូល",
  }
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem("yaya_language") as Language) || "en";
  });

  const { data: settings } = trpc.settings.getAll.useQuery();
  const exchangeRate = parseFloat(settings?.usdToKhrRate || "4100");

  useEffect(() => {
    localStorage.setItem("yaya_language", language);
  }, [language]);

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  const formatCurrency = (amount: number | string, currency: "USD" | "KHR" = "USD") => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    if (currency === "USD") {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(num);
    } else {
      const khrAmount = Math.round(num * exchangeRate / 100) * 100;
      return new Intl.NumberFormat("km-KH", { 
        style: "currency", 
        currency: "KHR",
        maximumFractionDigits: 0 
      }).format(khrAmount);
    }
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, exchangeRate, formatCurrency }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used within I18nProvider");
  return context;
}
