"use client";

import { useState, useEffect } from "react";
import { Settings, RefreshCw, LogIn, X } from "lucide-react";
import { CatLogo } from "@/components/cat-logo";
import ReceiptProcessor from "@/components/receipt-processor";
import Dashboard from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { useSession, signIn, signOut } from "next-auth/react"

interface Category {
  id: string;
  name: string;
  color: string;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: "1", name: "อาหาร", color: "#f87171" }, // red-400
  { id: "2", name: "ช้อปปิ้ง", color: "#60a5fa" }, // blue-400
  { id: "3", name: "เดินทาง", color: "#fbbf24" }, // amber-400
  { id: "4", name: "ค่าน้ำค่าไฟ", color: "#34d399" }, // emerald-400
  { id: "5", name: "อื่นๆ", color: "#94a3b8" }, // slate-400
];

export default function Home() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("upload");
  const [dashboardKey, setDashboardKey] = useState(0); // Used to force refresh Dashboard
  const [categories, setCategories] = useState<Category[]>([]);

  // We no longer need to load receipts from LocalStorage as Dashboard fetches from API

  const handleSaveSuccess = (newReceipt: any) => {
    // Increment key to force Dashboard to re-fetch data when we switch to it
    setDashboardKey(prev => prev + 1);
    setActiveTab("dashboard");
  };

  const handleDelete = (id: number) => {
    // handled in Dashboard
  }

  // Load categories from LocalStorage
  useEffect(() => {
    const savedCats = localStorage.getItem("abs_categories_v2");
    if (savedCats) {
      setCategories(JSON.parse(savedCats));
    } else {
      setCategories(DEFAULT_CATEGORIES);
    }
  }, []);

  const saveCategories = (newCats: Category[]) => {
    setCategories(newCats);
    localStorage.setItem("abs_categories_v2", JSON.stringify(newCats));
  };

  const handleAddCategory = (name: string, color: string) => {
    if (name && !categories.find(c => c.name === name)) {
      saveCategories([...categories, { id: Date.now().toString(), name, color }]);
    }
  };

  const handleDeleteCategory = (id: string) => {
    if (confirm(`คุณต้องการลบหมวดหมู่นี้ใช่ไหม?`)) {
      saveCategories(categories.filter(c => c.id !== id));
    }
  };

  // Settings Tab Component (Simple version)
  const SettingsTab = () => {
    const [newCatInput, setNewCatInput] = useState("");
    const [newCatColor, setNewCatColor] = useState("#3b82f6"); // Default blue

    return (
      <div className="max-w-xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
        <div className="bg-white rounded-2xl shadow-sm border border-blue-50 overflow-hidden">
          <div className="bg-blue-600 p-6 flex items-center gap-2 text-white">
            <Settings size={22} /> <h2 className="text-xl font-bold">ตั้งค่าระบบ (Settings)</h2>
          </div>
          <div className="p-6 space-y-6">

            {/* Category Management */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                จัดการหมวดหมู่ (Categories)
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={newCatColor}
                  onChange={(e) => setNewCatColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border-none p-0 overflow-hidden"
                  title="เลือกสี"
                />
                <input
                  value={newCatInput}
                  onChange={(e) => setNewCatInput(e.target.value)}
                  placeholder="เพิ่มหมวดหมู่ใหม่..."
                  className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <Button onClick={() => { handleAddCategory(newCatInput, newCatColor); setNewCatInput(""); }} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                  เพิ่ม
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {categories.map(cat => (
                  <div key={cat.id} className="group flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-600 hover:bg-white hover:shadow-sm transition-all">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></span>
                    {cat.name}
                    <button onClick={() => handleDeleteCategory(cat.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full h-px bg-slate-100 my-4" />

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600">บัญชีผู้ใช้ (Account)</label>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <span className="text-sm text-slate-600">{session?.user?.email || "Guest"}</span>
                <Button variant="outline" size="sm" onClick={() => signOut()}>Sign Out</Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600">การเชื่อมต่อ (Connections)</label>
              <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 text-sm">
                เชื่อมต่อกับ Server Actions เรียบร้อย (Connected to Secure Backend)
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  };

  return (
    <div className="min-h-screen font-sans text-slate-800 pb-20">
      {/* Navbar */}
      <nav className="bg-white border-b border-blue-100 sticky top-0 z-20 backdrop-blur-sm bg-white/90">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => setActiveTab("dashboard")}
          >
            <CatLogo className="w-10 h-10 group-hover:rotate-12 transition-transform duration-300" />
            <div className="flex flex-col -gap-1">
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent leading-none">
                Annbaiset
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                แอน-ใบ-เสร็จ
              </span>
            </div>
          </div>
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("upload")}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${activeTab === "upload"
                ? "bg-white text-blue-600 font-bold shadow-sm"
                : "text-slate-500 hover:text-slate-700"
                }`}
            >
              สแกน
            </button>
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${activeTab === "dashboard"
                ? "bg-white text-blue-600 font-bold shadow-sm"
                : "text-slate-500 hover:text-slate-700"
                }`}
            >
              ประวัติ
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`px-3 py-2 rounded-lg text-sm transition-all ${activeTab === "settings"
                ? "bg-white text-blue-600 font-bold shadow-sm"
                : "text-slate-500 hover:text-slate-700"
                }`}
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto p-4 md:p-8">
        {activeTab === "upload" && (
          <ReceiptProcessor
            customCategories={categories}
            onSaveSuccess={handleSaveSuccess}
          />
        )}
        {activeTab === "dashboard" && (
          <Dashboard
            key={dashboardKey} // Forces re-mount and fetch on change
            categories={categories}
            onViewImage={(r) => r.link ? window.open(r.link, "_blank") : alert("No image link")}
          />
        )}
        {activeTab === "settings" && <SettingsTab />}
      </main>
    </div>
  );
}
