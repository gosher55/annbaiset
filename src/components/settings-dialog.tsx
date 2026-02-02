"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Settings, Plus, X, Trash2 } from "lucide-react"

interface SettingsDialogProps {
    customCategories: string[]
    onAddCategory: (category: string) => void
    onRemoveCategory: (category: string) => void
}

export function SettingsDialog({ customCategories, onAddCategory, onRemoveCategory }: SettingsDialogProps) {
    const [newCategory, setNewCategory] = useState("")
    const [isOpen, setIsOpen] = useState(false)

    const handleAdd = () => {
        if (newCategory.trim()) {
            onAddCategory(newCategory.trim())
            setNewCategory("")
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-500 hover:text-blue-600 hover:bg-blue-50">
                    <Settings className="h-5 w-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>ตั้งค่า (Settings)</DialogTitle>
                    <DialogDescription>
                        จัดการหมวดหมู่และตั้งค่าอื่นๆ
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <h4 className="font-medium text-sm text-gray-700">เพิ่มหมวดหมู่ (Add Category)</h4>
                        <div className="flex gap-2">
                            <Input
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                placeholder="ชื่อหมวดหมู่ใหม่..."
                                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                            />
                            <Button onClick={handleAdd} size="icon" className="shrink-0 bg-blue-600 hover:bg-blue-700">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h4 className="font-medium text-sm text-gray-700">หมวดหมู่ทั้งหมด (All Categories)</h4>
                        {customCategories.length === 0 ? (
                            <p className="text-sm text-gray-400 italic text-center py-2">ไม่มีหมวดหมู่เพิ่มเติม</p>
                        ) : (
                            <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto p-1">
                                {customCategories.map((cat, index) => (
                                    <div key={index} className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm border border-blue-100">
                                        <span>{cat}</span>
                                        <button onClick={() => onRemoveCategory(cat)} className="text-blue-400 hover:text-red-500 ml-1">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
