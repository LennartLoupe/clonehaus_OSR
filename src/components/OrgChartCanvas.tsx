'use client';

import { PHASE0_DATA } from '@/app/data/phase0.data';
import {
    deriveOrganizationAuthority,
    deriveDomainAuthority,
    deriveAgentAuthority,
} from '@/logic/authority/deriveAuthority';
import { formatAuthorityBadge } from '@/logic/authority/compactFormatting';

export type NodeType = 'ORGANIZATION' | 'DOMAIN' | 'AGENT';

export interface NodeData {
    id: string;
    label: string;
    type: NodeType;
    children?: NodeData[];
}

interface OrgChartCanvasProps {
    data: NodeData;
    selectedNodeId: string | null;
    onNodeSelect: (node: NodeData) => void;
}

export function OrgChartCanvas({
    data,
    selectedNodeId,
    onNodeSelect,
}: OrgChartCanvasProps) {
    if (!data) {
        return (
            <div style={{ color: 'white', padding: 20 }}>
                OrgChartCanvas received no data.
            </div>
        );
    }

    return (
        <div style={{ color: 'white' }}>
            <TreeNode
                node={data}
                selectedNodeId={selectedNodeId}
                onNodeSelect={onNodeSelect}
            />
        </div>
    );
}

function TreeNode({
    node,
    selectedNodeId,
    onNodeSelect,
}: {
    node: NodeData;
    selectedNodeId: string | null;
    onNodeSelect: (node: NodeData) => void;
}) {
    const isSelected = selectedNodeId === node.id;

    // Phase 2A.1: Derive authority and format badge
    const authorityBadge = getAuthorityBadge(node);

    return (
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
            {/* CLICKABLE NODE BOX */}
            <div
                onClick={() => {
                    console.log('Clicked node:', node);
                    onNodeSelect(node);
                }}
                style={{
                    display: 'inline-block',
                    padding: '12px 16px',
                    border: '1px solid white',
                    borderRadius: 6,
                    cursor: 'pointer',
                    background: isSelected ? '#333' : '#000',
                    marginBottom: 12,
                    minWidth: 160,
                    position: 'relative',
                }}
            >
                <div style={{ fontWeight: 600 }}>{node.label}</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>{node.type}</div>

                {/* Phase 2A.1: Authority Badge */}
                {authorityBadge && (
                    <div
                        title={authorityBadge.tooltip}
                        style={{
                            position: 'absolute',
                            top: -8,
                            right: -8,
                            background: authorityBadge.hasRestriction ? '#444' : '#333',
                            border: authorityBadge.hasRestriction
                                ? '1px solid #888'
                                : '1px solid #555',
                            borderRadius: 4,
                            padding: '2px 6px',
                            fontSize: 10,
                            fontWeight: 600,
                            color: authorityBadge.hasRestriction ? '#ffa500' : '#999',
                            whiteSpace: 'nowrap',
                            cursor: 'help',
                        }}
                    >
                        {authorityBadge.text}
                    </div>
                )}
            </div>

            {/* CHILDREN */}
            {node.children && node.children.length > 0 && (
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: 24,
                        marginTop: 16,
                        flexWrap: 'wrap',
                    }}
                >
                    {node.children.map((child) => (
                        <TreeNode
                            key={child.id}
                            node={child}
                            selectedNodeId={selectedNodeId}
                            onNodeSelect={onNodeSelect}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

/**
 * Get authority badge for a node using Phase 2A authority derivation.
 * Returns null if authority cannot be derived.
 */
function getAuthorityBadge(node: NodeData) {
    const orgCeiling = PHASE0_DATA.organization.authorityCeiling;

    try {
        if (node.type === 'ORGANIZATION') {
            const authority = deriveOrganizationAuthority(PHASE0_DATA.organization);
            return formatAuthorityBadge(authority, orgCeiling);
        }

        if (node.type === 'DOMAIN') {
            const domain = PHASE0_DATA.domains.find((d) => d.id === node.id);
            if (!domain) return null;

            const authority = deriveDomainAuthority(PHASE0_DATA.organization, domain);
            return formatAuthorityBadge(authority, orgCeiling);
        }

        if (node.type === 'AGENT') {
            const agent = PHASE0_DATA.agents.find((a) => a.id === node.id);
            if (!agent) return null;

            const domain = PHASE0_DATA.domains.find((d) => d.id === agent.domainId);
            if (!domain) return null;

            const authority = deriveAgentAuthority(PHASE0_DATA.organization, domain, agent);
            return formatAuthorityBadge(authority, orgCeiling);
        }
    } catch (error) {
        console.error('Error deriving authority badge:', error);
        return null;
    }

    return null;
}