"use client";

import * as React from "react";

export type Toast = {
    id?: string;
    title?: string;
    description?: string;
    variant?: string
};

type ToastContextType = {
    toast: (toast: Toast) => void;
};

const ToastContext = React.createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = React.useState<Toast[]>([]);

    const toast = (newToast: Toast) => {
        setToasts((prev) => [...prev, newToast]);
    };

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            {/* You can render toast UI later */}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = React.useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used inside ToastProvider");
    }
    return context;
}
