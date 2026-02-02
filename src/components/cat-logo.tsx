import React from 'react';

export const CatLogo = ({ className = "w-10 h-10" }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 40 L30 20 L45 35 Q50 30 55 35 L70 20 L80 40 Q85 65 75 80 Q50 95 25 80 Q15 65 20 40" fill="white" stroke="#3b82f6" strokeWidth="4" />
        <circle cx="35" cy="55" r="3" fill="#3b82f6" />
        <circle cx="65" cy="55" r="3" fill="#3b82f6" />
        <path d="M45 65 Q50 70 55 65" stroke="#3b82f6" strokeWidth="2" fill="none" />
        <g transform="translate(60, 65) rotate(-15)">
            <rect x="18" y="5" width="4" height="15" rx="2" fill="#64748b" />
            <circle cx="20" cy="5" r="10" stroke="#334155" strokeWidth="3" fill="white" fillOpacity="0.5" />
        </g>
    </svg>
);
