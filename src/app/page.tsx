'use client';

import { useState } from 'react';
import { OrgChartCanvas } from '@/components/OrgChartCanvas';
import { InspectorPanel, ExplanationMode } from '@/components/InspectorPanel';
import { PHASE0_DATA } from '@/app/data/phase0.data';
import { buildOrgTree } from '@/app/data/buildOrgTree';
import { ViewMode } from '@/components/ViewToggle';
import PolicyExplorerPage from '@/app/policies/page';

export default function Home() {
    // Phase 6B: View toggle state (Structure | Policies)
    const [activeView, setActiveView] = useState<'structure' | 'policies'>('structure');

    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [explanationMode, setExplanationMode] = useState<ExplanationMode>('STANDARD');
    const viewMode: ViewMode = 'STRUCTURE';

    const treeData = buildOrgTree(PHASE0_DATA);

    return (
        <>
            {/* Phase 6B: Top-Level Governance Toggle */}
            <div style={styles.viewToggleContainer}>
                <div style={styles.viewToggle}>
                    <button
                        style={activeView === 'structure' ? styles.tabActive : styles.tabInactive}
                        onClick={() => setActiveView('structure')}
                    >
                        Structure
                    </button>
                    <button
                        style={activeView === 'policies' ? styles.tabActive : styles.tabInactive}
                        onClick={() => setActiveView('policies')}
                    >
                        Policies
                    </button>
                </div>
                <div style={styles.subtitle}>
                    Two ways to understand the system: how it is structured, and what it has learned.
                </div>
            </div>

            {/* Content swap based on active view */}
            {activeView === 'structure' ? (
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
                            minHeight: 'calc(100vh - 100px)',
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
            ) : (
                <PolicyExplorerPage />
            )}
        </>
    );
}

// Phase 6B: Toggle styles
const styles = {
    viewToggleContainer: {
        padding: '20px 40px 16px',
        background: '#0a0a0a',
        borderBottom: '1px solid #2a2a2a',
    },
    viewToggle: {
        display: 'flex',
        gap: 4,
        marginBottom: 8,
    },
    tabActive: {
        padding: '10px 20px',
        background: '#1a1a1a',
        border: 'none',
        borderBottom: '2px solid #C8A96A',
        color: '#ddd',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.2s',
    } as React.CSSProperties,
    tabInactive: {
        padding: '10px 20px',
        background: 'transparent',
        border: 'none',
        borderBottom: '2px solid transparent',
        color: '#888',
        fontSize: '14px',
        fontWeight: 400,
        cursor: 'pointer',
        transition: 'all 0.2s',
    } as React.CSSProperties,
    subtitle: {
        fontSize: '12px',
        color: '#666',
        fontStyle: 'italic' as const,
        marginTop: 4,
    },
};