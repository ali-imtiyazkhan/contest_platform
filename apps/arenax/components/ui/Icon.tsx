"use client";

import React from "react";
import type { LucideIcon } from "lucide-react";

interface IconProps {
    icon: LucideIcon;
    className?: string;
}

export default function Icon({ icon, className }: IconProps) {
    return React.createElement(icon as any, { className });
}
