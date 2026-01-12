'use client';

import { useState } from 'react';
import { OrgChartCanvas } from '@/components/OrgChartCanvas';
import { InspectorPanel, ExplanationMode } from '@/components/InspectorPanel';
import { PHASE0_DATA } from '@/app/data/phase0.data';
import { buildOrgTree } from '@/app/data/buildOrgTree';
import { ViewMode } from '@/components/ViewToggle';

export default function Home() {
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [explanationMode, setExplanationMode] = useState<ExplanationMode>('STANDARD');
    const viewMode: ViewMode = 'STRUCTURE';

    const treeData = buildOrgTree(PHASE0_DATA);

    return (
        <>
            <div
                onClick={(e) => {
                    // Clear selection if clicking the background (not a node)
                    if (e.target === e.currentTarget) {
                        setSelectedNodeId(null);
                    }
                }}
                style={{
                    padding: 40,
                    background: 'black',
                    minHeight: '100vh',
                }}
            >
                <h1 style={{ color: 'white', marginBottom: 20 }}>DEBUG VIEW</h1>

                <OrgChartCanvas
                    data={treeData}
                    viewMode={viewMode}
                    selectedNodeId={selectedNodeId}
                    onNodeSelect={(node) => {
                        console.log('Selected:', node);
                        setSelectedNodeId(node.id);
                    }}
                />
            </div>

            <InspectorPanel
                selectedNodeId={selectedNodeId}
                data={PHASE0_DATA}
                explanationMode={explanationMode}
                onExplanationModeChange={setExplanationMode}
            />
        </>
    );
}