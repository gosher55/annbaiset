import React from "react";
import { LucideIcon } from "lucide-react";

interface CustomInputProps {
    label: string;
    value: string | number;
    onChange: (value: string) => void;
    type?: string;
    icon?: LucideIcon;
    placeholder?: string;
    className?: string;
    step?: string;
}

export const CustomInput = ({
    label,
    value,
    onChange,
    type = "text",
    icon: Icon,
    placeholder = "",
    className = "",
    step,
}: CustomInputProps) => (
    <div className={`space-y-1 ${className}`}>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 font-sans">
            {Icon && <Icon size={12} />} {label}
        </label>
        <input
            type={type}
            step={step}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all text-sm font-sans text-slate-700"
        />
    </div>
);
