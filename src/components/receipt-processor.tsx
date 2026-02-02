"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, Save, LogIn, Camera, Eye, Edit3, Store, MapPin, Calendar, CheckCircle2, AlertCircle, X } from "lucide-react";
import { processReceiptWithGemini } from "@/app/actions/ocr-actions";
import { CustomInput } from "@/components/ui/custom-input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
// Removed Textarea, Card, Input in favor of user's custom layout or simpler divs

interface Category {
    id: string;
    name: string;
    color: string;
}

interface ReceiptProcessorProps {
    customCategories?: Category[];
    onSaveSuccess?: (newReceipt: any) => void;
}

export default function ReceiptProcessor({ customCategories = [], onSaveSuccess }: ReceiptProcessorProps) {
    const { data: session, status } = useSession()
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

    const [formData, setFormData] = useState({
        shopName: "",
        date: "",
        address: "",
        receiptNo: "",
        category: "อาหาร", // Default
        discount: "",
        price: "",
        vat: "",
        wht: "",
        total: "",
        note: ""
    })

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const f = e.target.files[0]
            setFile(f)
            setPreview(URL.createObjectURL(f))
            setIsProcessing(true)
            setStatusMessage({ type: 'info', text: 'เจ้าแมวกำลังส่องใบเสร็จให้อยู่จ้า...' });

            try {
                // Simulate a minimum scan time for the animation to be seen
                await new Promise(resolve => setTimeout(resolve, 2000));

                const formData = new FormData();
                formData.append("file", f);

                const result = await processReceiptWithGemini(formData);

                if (result.success && result.data) {
                    const data = result.data;
                    setFormData(prev => ({
                        ...prev,
                        shopName: data.shopName || "",
                        date: data.date || "",
                        address: data.address || "",
                        receiptNo: data.receiptNo || "",
                        category: data.category || "อื่นๆ",
                        total: data.total?.toString() || "",
                        discount: data.discount?.toString() || "",
                        vat: data.vat?.toString() || "",
                        wht: data.wht?.toString() || "",
                        price: data.price?.toString() || "",
                    }));
                    setStatusMessage({ type: 'success', text: 'ส่องเสร็จแล้ว! แก้ไขข้อมูลหรือที่อยู่ได้เลยจ้า' });
                } else {
                    console.error("Gemini OCR Failed:", result.error);
                    setStatusMessage({ type: 'error', text: "แมวส่องไม่ออก ลองตรวจสอบรหัส API อีกทีนะ" });
                }

            } catch (error) {
                console.error("OCR Error", error);
                setStatusMessage({ type: 'error', text: "เกิดข้อผิดพลาดในการเชื่อมต่อกับเจ้าแมว" });
            } finally {
                setIsProcessing(false);
            }
        }
    }

    const handleInputChange = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }

    const handleSave = async () => {
        if (!file) return;
        setIsSaving(true);
        setStatusMessage({ type: 'info', text: 'กำลังบันทึกลง Google และประวัติเครื่อง...' });

        try {
            // 1. Upload to Drive
            const formDataObj = new FormData();
            formDataObj.append("file", file);

            const driveRes = await fetch("/api/upload-drive", {
                method: "POST",
                body: formDataObj
            });

            if (!driveRes.ok) {
                const err = await driveRes.json().catch(() => ({}));
                throw new Error(err.details || err.error || "Failed to upload image");
            }
            const driveData = await driveRes.json();

            const finalData = {
                ...formData,
                link: driveData.link,
                driveFileId: driveData.id, // Assuming API returns this
                id: Date.now(),
                timestamp: new Date().toISOString()
            };

            // 2. Append to Sheets
            const sheetRes = await fetch("/api/append-sheet", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(finalData)
            });

            if (!sheetRes.ok) {
                const err = await sheetRes.json().catch(() => ({}));
                throw new Error(err.details || err.error || "Failed to save to sheet");
            }

            // Success
            setStatusMessage({ type: 'success', text: 'บันทึกเรียบร้อยจ้า!' });
            if (onSaveSuccess) onSaveSuccess(finalData);

            // Reset (optional, or wait for user to switch tab)
            setFile(null);
            setPreview(null);
            setFormData({
                shopName: "",
                date: "",
                address: "",
                receiptNo: "",
                category: "อาหาร",
                discount: "",
                price: "",
                vat: "",
                wht: "",
                total: "",
                note: ""
            });


        } catch (e: any) {
            console.error(e);
            setStatusMessage({ type: 'error', text: `บันทึกไม่สำเร็จจ้า: ${e.message}` });
        } finally {
            setIsSaving(false);
        }
    }

    if (status === "loading") {
        return <div className="text-center p-8"><Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-400" /></div>
    }

    if (status === "unauthenticated") {
        return (
            <div className="max-w-md mx-auto mt-4 text-center bg-white/80 backdrop-blur rounded-2xl shadow-md border border-blue-100 p-8">
                <div className="bg-blue-50 p-4 rounded-full inline-block mb-4">
                    <LogIn className="h-10 w-10 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2 font-sans">เข้าสู่ระบบ (Sign In)</h3>
                <p className="text-gray-500 text-sm mb-6 font-sans">กรุณาเข้าสู่ระบบเพื่อใช้งาน Google Drive และ Sheets</p>
                <Button onClick={() => signIn("google")} className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all font-sans rounded-xl">
                    Sign in with Google
                </Button>
            </div>
        )
    }

    // --- RENDER ---
    return (
        <div className="space-y-6 font-sans animate-in fade-in relative">

            {/* Success Overlay with Pop Animation */}
            {statusMessage.type === 'success' && statusMessage.text.includes('บันทึกเรียบร้อย') && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-[2px] animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl p-8 shadow-2xl flex flex-col items-center justify-center text-center max-w-sm w-full animate-in zoom-in-50 slide-in-from-bottom-5 duration-500">
                        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6 animate-in zoom-in spin-in-12 duration-700 delay-100">
                            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-2">บันทึกเรียบร้อย!</h3>
                        <p className="text-slate-500 mb-6">ข้อมูลถูกส่งไปที่ Google Sheet แล้วจ้า</p>
                        <Button onClick={() => setStatusMessage({ type: '', text: '' })} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl w-full">
                            ตกลง (OK)
                        </Button>
                    </div>
                </div>
            )}

            {statusMessage.text && !statusMessage.text.includes('บันทึกเรียบร้อย') && (
                <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 border shadow-sm ${statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    statusMessage.type === 'error' ? 'bg-red-50 text-red-700 border-red-100' :
                        'bg-blue-50 text-blue-700 border-blue-100'
                    }`}>
                    {statusMessage.type === 'success' ? <CheckCircle2 size={18} /> : statusMessage.type === 'error' ? <AlertCircle size={18} /> : <Loader2 size={18} className="animate-spin" />}
                    <span className="text-sm font-medium">{statusMessage.text}</span>
                    <X size={16} className="ml-auto cursor-pointer opacity-50 hover:opacity-100" onClick={() => setStatusMessage({ type: '', text: '' })} />
                </div>
            )}

            <div className="grid lg:grid-cols-12 gap-8 items-start">
                {/* Left Column: Upload */}
                <div className="lg:col-span-5">
                    <div className="bg-white rounded-2xl shadow-sm border border-blue-50 p-6">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-blue-600"><Camera size={18} /> ส่องใบเสร็จ</h2>
                        <div className={`border-2 border-dashed rounded-2xl p-2 text-center cursor-pointer transition-all min-h-[300px] flex flex-col items-center justify-center relative overflow-hidden group ${file ? 'border-sky-300 bg-sky-50/50' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}>
                            {preview ? (
                                <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden rounded-lg">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={preview} alt="Receipt preview" className="max-h-[400px] w-full object-contain shadow-sm" />

                                    {/* Scanning Animation */}
                                    {isProcessing && (
                                        <div className="absolute inset-0 z-10">
                                            <div className="absolute top-0 left-0 w-full h-[5px] bg-blue-400 shadow-[0_0_20px_rgba(96,165,250,0.8)] animate-[scan_2s_ease-in-out_infinite]" />
                                            <div className="absolute inset-0 bg-blue-500/10" />
                                        </div>
                                    )}

                                    {!isProcessing && (
                                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm rounded-lg">
                                            <Camera className="h-8 w-8 text-white mb-2" />
                                            <span className="text-white font-medium">คลิกเพื่อเปลี่ยนรูป</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4 py-8">
                                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 mx-auto group-hover:scale-110 transition-transform"><Upload size={32} /></div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-600">ถ่ายรูป หรือ เลือกใบเสร็จ</p>
                                        <p className="text-xs text-slate-400 mt-1">JPG, PNG</p>
                                    </div>
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={handleFileChange}
                                disabled={isProcessing}
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column: Form */}
                <div className="lg:col-span-7">
                    <div className={`bg-white rounded-2xl shadow-sm border border-blue-50 p-6 transition-all duration-500 ${!file ? "opacity-50 pointer-events-none grayscale" : "shadow-xl shadow-blue-100/50 border-blue-100"}`}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold flex items-center gap-2 text-emerald-600"><Edit3 size={18} /> ตรวจสอบข้อมูล</h2>
                            <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-md transition-all">
                                {isSaving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />} บันทึกข้อมูล
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <CustomInput label="ชื่อร้าน (Shop Name)" value={formData.shopName} onChange={(v) => handleInputChange('shopName', v)} icon={Store} />
                            <CustomInput label="ที่อยู่ (Address)" value={formData.address} onChange={(v) => handleInputChange('address', v)} icon={MapPin} />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <CustomInput label="วันที่ (Date)" type="date" value={formData.date} onChange={(v) => handleInputChange('date', v)} icon={Calendar} />
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 font-sans">หมวดหมู่</label>
                                    <Select value={formData.category} onValueChange={(val) => handleInputChange('category', val)}>
                                        <SelectTrigger className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm focus:outline-none h-auto">
                                            <SelectValue placeholder="เลือกหมวดหมู่..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {customCategories.length > 0 ? (
                                                customCategories.map((cat) => (
                                                    <SelectItem key={cat.id} value={cat.name}>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                                                            {cat.name}
                                                        </div>
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="อาหาร">อาหาร</SelectItem> // Fallback
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <CustomInput label="เลขที่ใบเสร็จ" value={formData.receiptNo} onChange={(v) => handleInputChange('receiptNo', v)} />

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <CustomInput label="ราคา (Price)" type="number" step="0.01" value={formData.price} onChange={(v) => handleInputChange('price', v)} />
                                <CustomInput label="ส่วนลด (Disc)" type="number" step="0.01" value={formData.discount} onChange={(v) => handleInputChange('discount', v)} />
                                <CustomInput label="ภาษี (VAT)" type="number" step="0.01" value={formData.vat} onChange={(v) => handleInputChange('vat', v)} />
                                <CustomInput label="ยอดสุทธิ (Total)" type="number" step="0.01" value={formData.total} onChange={(v) => handleInputChange('total', v)} className="font-bold text-blue-600" />
                            </div>

                            <CustomInput label="โน้ตเพิ่มเติม" value={formData.note} onChange={(v) => handleInputChange('note', v)} placeholder="จดบันทึก..." />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
