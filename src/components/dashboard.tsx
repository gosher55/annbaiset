"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
    Search,
    RefreshCw,
    Eye,
    Trash2,
    Calendar,
    Store,
    CheckCircle2,
    AlertCircle,
    X,
    Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { CatLogo } from "./cat-logo";

const THAI_MONTHS = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

interface Category {
    id: string;
    name: string;
    color: string;
}

export default function Dashboard({
    onViewImage,
    categories = []
}: {
    onViewImage: (receipt: any) => void;
    categories?: Category[];
}) {
    const [receipts, setReceipts] = useState<any[]>([]);
    const [activeReceipt, setActiveReceipt] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCategory, setFilterCategory] = useState("All");
    const [filterMonth, setFilterMonth] = useState("All");
    const [filterYear, setFilterYear] = useState("All");
    const [availableYears, setAvailableYears] = useState<string[]>([]);

    const fetchData = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/receipts");
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || "Failed to fetch receipts");
            }
            const data = await res.json();
            // Reverse to show newest first
            setReceipts(Array.isArray(data) ? data.reverse() : []);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to load data from Google Sheet");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Extract unique years
    useEffect(() => {
        if (receipts.length > 0) {
            const years = Array.from(new Set(receipts.map(r => {
                if (!r.date) return "";
                // Date format usually YYYY-MM-DD
                return r.date.split("-")[0];
            }))).filter(y => y && y.length === 4).sort((a, b) => b.localeCompare(a));

            setAvailableYears(years);
            // Default to current year if available, else 'All' or first available
            // Actually 'All' is safer defaulting
        }
    }, [receipts]);


    const filteredReceipts = useMemo(() => {
        return receipts.filter((r) => {
            const storeName = r.shopName || r.store || "";
            const matchesSearch = storeName
                .toLowerCase()
                .includes(searchQuery.toLowerCase());
            const matchesCat =
                filterCategory === "All" || r.category === filterCategory;

            // Date format might be YYYY-MM-DD
            const dateStr = r.date || "";
            const [yearPart, monthPart] = dateStr.split("-");

            const matchesMonth =
                filterMonth === "All" || monthPart === filterMonth;

            const matchesYear =
                filterYear === "All" || yearPart === filterYear;

            return matchesSearch && matchesCat && matchesMonth && matchesYear;
        });
    }, [receipts, searchQuery, filterCategory, filterMonth, filterYear]);

    const totalAmount = filteredReceipts.reduce(
        (a, b) => a + Number(b.total || 0),
        0
    );

    const getCategoryColor = (catName: string) => {
        const found = categories.find(c => c.name === catName);
        return found ? found.color : "#94a3b8"; // Default slate
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-2xl p-6 shadow-lg shadow-blue-200">
                    <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest">
                        ยอดรวมที่กรอง
                    </p>
                    <p className="text-3xl font-bold mt-1">
                        ฿{totalAmount.toLocaleString()}
                    </p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-blue-50">
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                        ใบเสร็จรวม
                    </p>
                    <p className="text-3xl font-bold text-slate-700">
                        {filteredReceipts.length} ใบ
                    </p>
                </div>

                <div
                    onClick={fetchData}
                    className="bg-white border border-blue-100 rounded-2xl p-6 flex flex-col items-center justify-center text-blue-600 cursor-pointer hover:bg-blue-50 transition-colors group">
                    <div className={`p-2 rounded-full bg-blue-50 group-hover:bg-blue-100 mb-2 ${loading ? 'animate-spin' : ''}`}>
                        <RefreshCw size={20} />
                    </div>
                    <span className="text-xs font-bold">ดึงข้อมูลล่าสุด (Sync)</span>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-blue-50 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
                        size={16}
                    />
                    <input
                        type="text"
                        placeholder="ค้นหาร้านค้า..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    <select
                        className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:outline-none"
                        value={filterYear}
                        onChange={(e) => setFilterYear(e.target.value)}
                    >
                        <option value="All">ทุกปี</option>
                        {availableYears.map((y) => (
                            <option key={y} value={y}>
                                {y}
                            </option>
                        ))}
                    </select>

                    <select
                        className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:outline-none"
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value)}
                    >
                        <option value="All">ทุกเดือน</option>
                        {THAI_MONTHS.map((m, i) => (
                            <option key={m} value={(i + 1).toString().padStart(2, "0")}>
                                {m}
                            </option>
                        ))}
                    </select>
                    <select
                        className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:outline-none"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                    >
                        <option value="All">ทุกหมวดหมู่</option>
                        {/* We use categories prop here if available to show all possible cats, or derive from data */}
                        {/* Derive from data + prop to ensure coverage */}
                        {Array.from(new Set([...categories.map(c => c.name), ...receipts.map(r => r.category || "อื่นๆ")])).map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-blue-50 overflow-hidden shadow-sm">
                {loading ? (
                    <div className="p-12 text-center text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-400" />
                        กำลังโหลดข้อมูลจาก Google Sheet...
                    </div>
                ) : error ? (
                    <div className="p-12 text-center text-red-400">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                        {error}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase font-bold tracking-widest border-b border-slate-100">
                                <tr>
                                    <th className="p-4">วันที่</th>
                                    <th className="p-4">ร้านค้า</th>
                                    <th className="p-4">หมวดหมู่</th>
                                    <th className="p-4 text-right">ยอดสุทธิ</th>
                                    <th className="p-4 text-center">รูปภาพ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredReceipts.length > 0 ? (
                                    filteredReceipts.map((r, i) => (
                                        <tr
                                            key={i}
                                            className="hover:bg-slate-50/50 transition-all group"
                                        >
                                            <td className="p-4 text-xs text-slate-500 whitespace-nowrap">
                                                {r.date}
                                            </td>
                                            <td className="p-4">
                                                <p className="font-bold text-slate-700">
                                                    {r.shopName || r.store}
                                                </p>
                                                {r.receiptNo && (
                                                    <p className="text-[10px] text-slate-400">
                                                        #{r.receiptNo}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <span
                                                    className="px-2 py-0.5 text-[10px] rounded-full font-bold border flex items-center gap-1 w-fit"
                                                    style={{
                                                        backgroundColor: `${getCategoryColor(r.category)}20`, // 20% opacity
                                                        color: getCategoryColor(r.category),
                                                        borderColor: `${getCategoryColor(r.category)}40`
                                                    }}
                                                >
                                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getCategoryColor(r.category) }} />
                                                    {r.category || "Uncategorized"}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right font-bold text-slate-800">
                                                ฿{Number(r.total || 0).toLocaleString()}
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => setActiveReceipt(r)}
                                                        className={`p-2 rounded-lg transition-all ${r.link ? 'text-blue-400 hover:text-blue-600 hover:bg-blue-50' : 'text-slate-200 cursor-not-allowed'}`}
                                                        title="ดูรูปใบเสร็จ"
                                                        disabled={!r.link}
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="p-12 text-center text-slate-300 italic"
                                        >
                                            ยังไม่มีข้อมูลใน Sheet จ้า
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Image Viewer Modal */}
            {activeReceipt && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setActiveReceipt(null)}>
                    <div className="relative bg-white rounded-2xl overflow-hidden shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b flex items-center justify-between bg-white sticky top-0 z-10">
                            <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                <Store size={18} className="text-blue-500" />
                                {activeReceipt.shopName || "Receipt Preview"}
                            </h3>
                            <button onClick={() => setActiveReceipt(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-4 bg-slate-50 flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={(function () {
                                    try {
                                        const link = activeReceipt.link || "";
                                        const match = link.match(/\/d\/(.+?)\//);
                                        if (match && match[1]) return `/api/image-proxy?id=${match[1]}`;
                                        return link;
                                    } catch { return activeReceipt.link; }
                                })()}
                                alt="Receipt"
                                className="max-w-full h-auto object-contain rounded-lg shadow-sm"
                            />
                        </div>
                        <div className="p-4 border-t bg-white flex justify-between text-xs text-slate-500">
                            <span>วันที่: {activeReceipt.date}</span>
                            <span className="font-bold text-blue-600">฿{Number(activeReceipt.total).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
