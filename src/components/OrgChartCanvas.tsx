'use client';

import { useState } from 'react';
import { Phase0Data, Organization, Domain, Agent } from '@/app/data/types';
import {
    deriveOrganizationAuthority,
    deriveDomainAuthority,
    deriveAgentAuthority,
} from '@/logic/authority/deriveAuthority';
import { formatAuthorityBadge } from '@/logic/authority/compactFormatting';
import { Plus, Trash2 } from 'lucide-react';

// ============================================================================
// TYPES & PROPS
// ============================================================================

export type NodeType = 'ORGANIZATION' | 'DOMAIN' | 'AGENT';

interface OrgChartCanvasProps {
    lookupData: Phase0Data;
    selectedNodeId: string | null;
    onNodeSelect: (node: { id: string; type: NodeType; label: string }) => void;
    // Actions
    onMoveAgent: (agentId: string, targetDomainId: string) => void;
    onAddDomain: (name: string) => void;
    onDeleteDomain: (id: string) => void;
    onAddAgent: (domainId: string, name: string) => void;
    onDeleteAgent: (id: string) => void;
    // Unused
    data?: any;
    onMoveDomain?: any;
}

// Drag item types
interface DragItem {
    type: NodeType;
    id: string;
}

// ============================================================================
// CANVAS COMPONENT (HIERARCHY LAYOUT)
// ============================================================================

export function OrgChartCanvas({
    lookupData,
    selectedNodeId,
    onNodeSelect,
    onMoveAgent,
    onAddDomain,
    onDeleteDomain,
    onAddAgent,
    onDeleteAgent,
}: OrgChartCanvasProps) {
    const [draggingItem, setDraggingItem] = useState<DragItem | null>(null);

    // Organization Data
    const org = lookupData.organization;
    const domains = lookupData.domains;
    const agents = lookupData.agents;

    return (
        <div style={{
            color: 'white',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center', // Center everything horizontally
            paddingTop: 40,
            overflowX: 'auto', // Allow scroll if domains are wide
        }}>

            {/* 1. ORGANIZATION CARD (Top Center) */}
            <div style={{ position: 'relative', marginBottom: 40, zIndex: 10 }}>
                <OrganizationCard
                    org={org}
                    selectedNodeId={selectedNodeId}
                    onNodeSelect={onNodeSelect}
                    onAddDomain={onAddDomain}
                />

                {/* Vertical Connector Line */}
                <div style={{
                    position: 'absolute',
                    left: '50%',
                    bottom: -40,
                    width: 2,
                    height: 40,
                    background: '#333',
                    transform: 'translateX(-50%)'
                }} />
            </div>

            {/* 2. DOMAIN LANES CONTAINER */}
            {/* We wrap in a container that allows the connector line to branch out if we wanted, 
                but for now we just center the row. */}
            <div style={{
                display: 'flex',
                gap: 24,
                justifyContent: 'center',
                alignItems: 'flex-start',
                paddingBottom: 40,
                minWidth: 'min-content', // Ensure it doesn't shrink below content
                paddingLeft: 40,
                paddingRight: 40,
                position: 'relative'
            }}>
                {/* Horizontal Connector Line (Top of domains) */}
                {domains.length > 1 && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 40 + 150, // Approx middle of first domain
                        right: 40 + 150, // Approx middle of last domain
                        height: 2,
                        background: '#333',
                        display: 'none' // Hidden for now, simpler visual is cleaner
                    }} />
                )}

                {domains.map(domain => (
                    <DomainLane
                        key={domain.id}
                        domain={domain}
                        agents={agents.filter(a => a.domainId === domain.id)}
                        lookupData={lookupData}
                        selectedNodeId={selectedNodeId}
                        onNodeSelect={onNodeSelect}
                        draggingItem={draggingItem}
                        onDragStart={setDraggingItem}
                        onDragEnd={() => setDraggingItem(null)}
                        onMoveAgent={onMoveAgent}
                        onDeleteDomain={onDeleteDomain}
                        onAddAgent={onAddAgent}
                        onDeleteAgent={onDeleteAgent}
                    />
                ))}

                {/* Empty State */}
                {domains.length === 0 && (
                    <div style={{
                        color: '#666',
                        fontStyle: 'italic',
                        padding: 20,
                        border: '1px dashed #333',
                        borderRadius: 8
                    }}>
                        No domains defined.
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// ORGANIZATION CARD
// ============================================================================

function OrganizationCard({
    org,
    selectedNodeId,
    onNodeSelect,
    onAddDomain
}: {
    org: Organization;
    selectedNodeId: string | null;
    onNodeSelect: any;
    onAddDomain: (name: string) => void;
}) {
    const isSelected = selectedNodeId === org.id;

    return (
        <div style={{
            width: 380,
            background: isSelected ? '#1a1a1a' : '#000',
            border: isSelected ? '2px solid #fff' : '2px solid #333',
            borderRadius: 12,
            padding: 20,
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            cursor: 'pointer',
            position: 'relative',
            transition: 'all 0.2s ease'
        }}
            onClick={(e) => {
                e.stopPropagation();
                onNodeSelect({ id: org.id, type: 'ORGANIZATION', label: org.name });
            }}
        >
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 8 }}>
                Organization Root
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>
                {org.name}
            </div>
            <div style={{ fontSize: 13, color: '#666', marginTop: 8 }}>
                Authority Ceiling: {org.authorityCeiling}
            </div>

            {/* Subtle Add Domain Action */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    const name = prompt('Enter new Domain name:');
                    if (name) onAddDomain(name);
                }}
                style={{
                    position: 'absolute',
                    right: 12,
                    top: 12,
                    background: 'transparent',
                    border: 'none',
                    color: '#444',
                    cursor: 'pointer',
                    padding: 4
                }}
                title="Add Domain"
            >
                <Plus size={16} />
            </button>
        </div>
    );
}

// ============================================================================
// DOMAIN LANE
// ============================================================================

function DomainLane({
    domain,
    agents,
    lookupData,
    selectedNodeId,
    onNodeSelect,
    draggingItem,
    onDragStart,
    onDragEnd,
    onMoveAgent,
    onDeleteDomain,
    onAddAgent,
    onDeleteAgent
}: {
    domain: Domain;
    agents: Agent[];
    lookupData: Phase0Data;
    selectedNodeId: string | null;
    onNodeSelect: any;
    draggingItem: DragItem | null;
    onDragStart: (item: DragItem) => void;
    onDragEnd: () => void;
    onMoveAgent: (id: string, targetId: string) => void;
    onDeleteDomain: (id: string) => void;
    onAddAgent: (domainId: string, name: string) => void;
    onDeleteAgent: (id: string) => void;
}) {
    const isSelected = selectedNodeId === domain.id;
    const [isDragOver, setIsDragOver] = useState(false);

    // Authority Badge
    const authority = deriveDomainAuthority(lookupData.organization, domain);
    const badge = formatAuthorityBadge(authority, lookupData.organization.authorityCeiling);

    // Drop Logic
    const isValidTarget = draggingItem?.type === 'AGENT';

    const handleDragOver = (e: React.DragEvent) => {
        if (!isValidTarget) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (!isDragOver) setIsDragOver(true);
    };

    const handleDrop = (e: React.DragEvent) => {
        if (!isValidTarget || !draggingItem) return;
        e.preventDefault();
        setIsDragOver(false);
        onMoveAgent(draggingItem.id, domain.id);
        onDragEnd(); // Reset local drag state
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Connector Dot */}
            <div style={{ width: 8, height: 8, background: '#333', borderRadius: '50%', marginBottom: 12 }} />

            <div
                onDragOver={handleDragOver}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                style={{
                    width: 300,
                    background: '#0a0a0a',
                    border: isDragOver
                        ? '2px dashed #4CAF50'
                        : isSelected ? '1px solid #fff' : '1px solid #333',
                    borderRadius: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    opacity: (draggingItem?.type === 'DOMAIN' && draggingItem.id === domain.id) ? 0.5 : 1,
                    transition: 'border 0.2s',
                    minHeight: 200
                }}
            >
                {/* Lane Header */}
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        onNodeSelect({ id: domain.id, type: 'DOMAIN', label: domain.name });
                    }}
                    style={{
                        padding: 16,
                        borderBottom: '1px solid #222',
                        cursor: 'pointer',
                        background: isSelected ? '#1a1a1a' : 'transparent',
                        borderTopLeftRadius: 8,
                        borderTopRightRadius: 8,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start'
                    }}
                >
                    <div>
                        <div style={{ fontWeight: 600, fontSize: 15, color: '#eee' }}>{domain.name}</div>
                        {badge && (
                            <div style={{ fontSize: 11, color: badge.hasRestriction ? '#ffa500' : '#888', marginTop: 4 }}>
                                {badge.text}
                            </div>
                        )}
                        <a
                            href={`/domain/${domain.id}`}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                display: 'inline-block',
                                marginTop: 8,
                                fontSize: 11,
                                color: '#6FAF8E',
                                textDecoration: 'none',
                                fontWeight: 500,
                                border: '1px solid #6FAF8E',
                                padding: '2px 8px',
                                borderRadius: 4
                            }}
                        >
                            Open Studio &rarr;
                        </a>
                    </div>

                    {/* Delete Domain */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (agents.length > 0) {
                                alert('Cannot delete domain with agents. Move or delete them first.');
                                return;
                            }
                            if (confirm(`Delete domain "${domain.name}"?`)) {
                                onDeleteDomain(domain.id);
                            }
                        }}
                        style={{
                            ...styles.iconButton,
                            color: agents.length > 0 ? '#333' : '#555',
                            cursor: agents.length > 0 ? 'not-allowed' : 'pointer'
                        }}
                    >
                        <Trash2 size={14} />
                    </button>
                </div>

                {/* Agent List Area */}
                <div style={{ padding: 12, flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {agents.map(agent => (
                        <AgentCard
                            key={agent.id}
                            agent={agent}
                            domain={domain}
                            lookupData={lookupData}
                            selectedNodeId={selectedNodeId}
                            onNodeSelect={onNodeSelect}
                            onDragStart={onDragStart}
                            onDeleteAgent={onDeleteAgent}
                        />
                    ))}

                    {/* Add Agent Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            const name = prompt('Enter new Agent name:');
                            if (name) onAddAgent(domain.id, name);
                        }}
                        style={styles.addAgentButton}
                    >
                        <Plus size={14} /> <span>Add Agent</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// AGENT CARD
// ============================================================================

function AgentCard({
    agent,
    domain,
    lookupData,
    selectedNodeId,
    onNodeSelect,
    onDragStart,
    onDeleteAgent
}: {
    agent: Agent;
    domain: Domain;
    lookupData: Phase0Data;
    selectedNodeId: string | null;
    onNodeSelect: any;
    onDragStart: (item: DragItem) => void;
    onDeleteAgent: (id: string) => void;
}) {
    const isSelected = selectedNodeId === agent.id;

    // Authority Badge
    const authority = deriveAgentAuthority(lookupData.organization, domain, agent);
    const badge = formatAuthorityBadge(authority, lookupData.organization.authorityCeiling);

    const handleDragStart = (e: React.DragEvent) => {
        e.stopPropagation();
        const item: DragItem = { type: 'AGENT', id: agent.id };
        onDragStart(item);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('application/json', JSON.stringify(item));
    };

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            onClick={(e) => {
                e.stopPropagation();
                onNodeSelect({ id: agent.id, type: 'AGENT', label: agent.name });
            }}
            style={{
                padding: '12px 14px',
                background: isSelected ? '#333' : '#151515',
                border: isSelected ? '1px solid #fff' : '1px solid #333',
                borderRadius: 6,
                cursor: 'grab',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.4)' : 'none',
                transition: 'all 0.1s'
            }}
        >
            <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#ddd', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {agent.name}
                </div>
                {badge && (
                    <div style={{ fontSize: 10, color: badge.hasRestriction ? '#ffa500' : '#888', marginTop: 2 }}>
                        {badge.text}
                    </div>
                )}
            </div>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete agent "${agent.name}"?`)) {
                        onDeleteAgent(agent.id);
                    }
                }}
                style={styles.iconButton}
                title="Delete Agent"
            >
                <Trash2 size={12} />
            </button>
        </div>
    );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = {
    addAgentButton: {
        background: 'transparent',
        border: '1px dashed #333',
        color: '#555',
        padding: '10px',
        borderRadius: 6,
        fontSize: 12,
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        marginTop: 12,
        transition: 'all 0.2s'
    },
    iconButton: {
        background: 'transparent',
        border: 'none',
        color: '#555',
        cursor: 'pointer',
        padding: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.7,
        borderRadius: 4
    }
};