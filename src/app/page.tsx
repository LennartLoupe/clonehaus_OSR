'use client';

import { useState } from 'react';
import { OrgChartCanvas, NodeData } from '@/components/OrgChartCanvas';
import { ViewToggle, ViewMode } from '@/components/ViewToggle';

const DUMMY_DATA: NodeData = {
    id: 'org-1',
    type: 'ORGANIZATION',
    label: 'Acme Corporation',
    status: 'DRAFT',
    metadata: {},
    children: [],
};

export default function Home() {
    const [viewMode, setViewMode] = useState<ViewMode>('STRUCTURE');
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    return (
        <main className="relative w-full h-screen bg-black text-white overflow-hidden">
            {/* Top-right toggle */}
            <div className="absolute top-6 right-6 z-50">
                <ViewToggle
                    currentMode={viewMode}
                    onToggle={setViewMode}
                />
            </div>

            {/* Org Chart Canvas */}
            <OrgChartCanvas
                data={DUMMY_DATA}
                viewMode={viewMode}
                selectedNodeId={selectedNodeId}
                onNodeSelect={(node) => setSelectedNodeId(node.id)}
                onClearSelection={() => setSelectedNodeId(null)}
            />
        </main>
    );
}