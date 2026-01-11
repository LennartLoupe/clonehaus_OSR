'use client';

import React, { useState } from 'react';
import clsx from 'clsx';
import { Node } from './Node';
import { ViewMode } from './ViewToggle';

export interface NodeData {
    id: string;
    type: 'ORGANIZATION' | 'DOMAIN' | 'AGENT';
    label: string;
    status: 'DRAFT' | 'ACTIVE' | 'LOCKED' | 'READY';
    metadata?: Record<string, any>;
    children?: NodeData[];
}

interface OrgChartCanvasProps {
    data: NodeData;
    viewMode: ViewMode;
    selectedNodeId: string | null;
    onNodeSelect: (node: NodeData) => void;
    onClearSelection?: () => void;
}

export function OrgChartCanvas({
    data,
    viewMode,
    selectedNodeId,
    onNodeSelect,
    onClearSelection
}: OrgChartCanvasProps) {
    if (!data) {
        return (
            <div className="w-full h-full flex items-center justify-center text-sm opacity-60">
                No data loaded
            </div>
        );
    }

    return (
        <div
            className="w-full h-full overflow-auto bg-[var(--background)]"
            onClick={(e) => {
                if (e.target === e.currentTarget && onClearSelection) {
                    onClearSelection();
                }
            }}
        >
            <div className="min-w-fit min-h-fit p-16 flex justify-center">
                <Tree
                    node={data}
                    viewMode={viewMode}
                    selectedNodeId={selectedNodeId}
                    onSelect={onNodeSelect}
                />
            </div>
        </div>
    );
}

function Tree({
    node,
    viewMode,
    selectedNodeId,
    onSelect
}: {
    node: NodeData;
    viewMode: ViewMode;
    selectedNodeId: string | null;
    onSelect: (n: NodeData) => void;
}) {
    const isSelected = node.id === selectedNodeId;
    const children = node.children ?? [];

    return (
        <div className="flex flex-col items-center gap-6">
            <Node
                data={node}
                viewMode={viewMode}
                isSelected={isSelected}
                isRelated={false}
                isDeemphasized={false}
                onClick={() => onSelect(node)}
            />

            {children.length > 0 && (
                <div className="flex gap-10">
                    {children.map((child) => (
                        <Tree
                            key={child.id}
                            node={child}
                            viewMode={viewMode}
                            selectedNodeId={selectedNodeId}
                            onSelect={onSelect}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}