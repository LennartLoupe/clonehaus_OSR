'use client';

import clsx from 'clsx';
import { ViewMode } from './ViewToggle';
import { NodeData } from './OrgChartCanvas';

export interface NodeProps {
    data: NodeData;
    viewMode: ViewMode;
    isSelected: boolean;
    isRelated?: boolean;
    isDeemphasized?: boolean;
    onClick: () => void;
}

export function Node({
    data,
    viewMode,
    isSelected,
    isRelated,
    isDeemphasized,
    onClick,
}: NodeProps) {
    return (
        <div
            onClick={onClick}
            className={clsx(
                'px-4 py-3 rounded-lg border cursor-pointer select-none transition-all',
                isSelected ? 'border-white bg-zinc-800' : 'border-zinc-700 bg-zinc-900',
                isRelated && !isSelected && 'border-zinc-500',
                isDeemphasized ? 'opacity-20 blur-[1px]' : 'opacity-100',
                'text-white'
            )}
        >
            <div className="text-sm font-medium">{data.label}</div>
            <div className="text-xs opacity-60">{data.type}</div>
        </div>
    );
}