'use client';

import clsx from 'clsx';
import { Layers, Activity } from 'lucide-react';

export type ViewMode = 'STRUCTURE' | 'FOOTPRINT';

interface ViewToggleProps {
    currentMode: ViewMode;
    onToggle: (mode: ViewMode) => void;
}

export function ViewToggle({ currentMode, onToggle }: ViewToggleProps) {
    return (
        <div className="flex bg-[var(--card-bg)] p-1 rounded-lg border border-[var(--card-border)] shadow-lg backdrop-blur-md">
            <button
                onClick={() => onToggle('STRUCTURE')}
                className={clsx(
                    "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                    currentMode === 'STRUCTURE'
                        ? "bg-white text-black shadow-sm"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
            >
                <Layers size={16} />
                Structure
            </button>
            <button
                onClick={() => onToggle('FOOTPRINT')}
                className={clsx(
                    "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                    currentMode === 'FOOTPRINT'
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
            >
                <Activity size={16} />
                AI Footprint
            </button>
        </div>
    );
}
