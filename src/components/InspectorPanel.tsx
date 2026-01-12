'use client';

import { Phase0Data, Organization, Domain, Agent } from '@/app/data/types';

interface InspectorPanelProps {
    selectedNodeId: string | null;
    data: Phase0Data;
}

export function InspectorPanel({ selectedNodeId, data }: InspectorPanelProps) {
    // Determine node type and fetch data if selection exists
    const nodeInfo = selectedNodeId ? getNodeInfo(selectedNodeId, data) : null;
    const isVisible = !!nodeInfo;

    return (
        <div
            style={{
                ...styles.panel,
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
                pointerEvents: isVisible ? 'auto' : 'none',
            }}
        >
            {nodeInfo && (
                <>
                    {nodeInfo.type === 'ORGANIZATION' && (
                        <OrganizationView org={nodeInfo.data as Organization} />
                    )}
                    {nodeInfo.type === 'DOMAIN' && (
                        <DomainView
                            domain={nodeInfo.data as Domain}
                            organization={data.organization}
                        />
                    )}
                    {nodeInfo.type === 'AGENT' && (
                        <AgentView
                            agent={nodeInfo.data as Agent}
                            domain={
                                data.domains.find(
                                    (d) => d.id === (nodeInfo.data as Agent).domainId
                                )!
                            }
                            organization={data.organization}
                        />
                    )}
                </>
            )}
        </div>
    );
}

// Helper to find node data by ID
function getNodeInfo(
    nodeId: string,
    data: Phase0Data
): { type: 'ORGANIZATION' | 'DOMAIN' | 'AGENT'; data: Organization | Domain | Agent } | null {
    // Check if it's the organization
    if (data.organization.id === nodeId) {
        return { type: 'ORGANIZATION', data: data.organization };
    }

    // Check if it's a domain
    const domain = data.domains.find((d) => d.id === nodeId);
    if (domain) {
        return { type: 'DOMAIN', data: domain };
    }

    // Check if it's an agent
    const agent = data.agents.find((a) => a.id === nodeId);
    if (agent) {
        return { type: 'AGENT', data: agent };
    }

    return null;
}

// ORGANIZATION VIEW
function OrganizationView({ org }: { org: Organization }) {
    return (
        <div>
            <div style={styles.section}>
                <div style={styles.name}>{org.name}</div>
                <div style={styles.type}>ORGANIZATION</div>
            </div>

            <div style={styles.section}>
                <div style={styles.sectionTitle}>Attributes</div>
                <AttributeRow label="Status" value={org.status} />
                <AttributeRow label="Authority ceiling" value={String(org.authorityCeiling)} />
                <AttributeRow label="Escalation default" value={org.escalationDefault} />
                <AttributeRow label="Communication posture" value={org.communicationPosture} />
            </div>

            <div style={styles.section}>
                <div style={styles.sectionTitle}>Context</div>
                <div style={styles.contextText}>Root of hierarchy</div>
            </div>
        </div>
    );
}

// DOMAIN VIEW
function DomainView({ domain, organization }: { domain: Domain; organization: Organization }) {
    return (
        <div>
            <div style={styles.section}>
                <div style={styles.name}>{domain.name}</div>
                <div style={styles.type}>DOMAIN</div>
            </div>

            <div style={styles.section}>
                <div style={styles.sectionTitle}>Attributes</div>
                <div style={styles.missionText}>{domain.mission}</div>
                <AttributeRow label="Status" value={domain.status} />
                <AttributeRow label="Authority ceiling" value={String(domain.authorityCeiling)} />
            </div>

            <div style={styles.section}>
                <div style={styles.sectionTitle}>Context</div>
                <div style={styles.contextText}>Part of: {organization.name}</div>
            </div>
        </div>
    );
}

// AGENT VIEW
function AgentView({
    agent,
    domain,
    organization,
}: {
    agent: Agent;
    domain: Domain;
    organization: Organization;
}) {
    return (
        <div>
            <div style={styles.section}>
                <div style={styles.name}>{agent.name}</div>
                <div style={styles.type}>AGENT</div>
            </div>

            <div style={styles.section}>
                <div style={styles.sectionTitle}>Attributes</div>
                <AttributeRow label="Role" value={agent.role} />
                <AttributeRow label="Execution type" value={agent.executionType} />
                <AttributeRow label="Autonomy level" value={String(agent.autonomyLevel)} />
                <AttributeRow label="Execution surface" value={agent.executionSurface} />
                <AttributeRow label="Escalation behavior" value={agent.escalationBehavior} />
            </div>

            <div style={styles.section}>
                <div style={styles.sectionTitle}>Context</div>
                <div style={styles.contextText}>Operates within: {domain.name}</div>
                <div style={styles.contextText}>Organization: {organization.name}</div>
            </div>
        </div>
    );
}

// Simple attribute row component
function AttributeRow({ label, value }: { label: string; value: string }) {
    return (
        <div style={styles.attributeRow}>
            <div style={styles.attributeLabel}>{label}</div>
            <div style={styles.attributeValue}>{value}</div>
        </div>
    );
}

// Styles
const styles = {
    panel: {
        position: 'fixed' as const,
        top: 0,
        right: 0,
        width: '340px',
        height: '100vh',
        background: '#0a0a0a',
        borderLeft: '1px solid #2a2a2a',
        padding: '32px 24px',
        overflowY: 'auto' as const,
        color: '#fff',
        transition: 'opacity 250ms ease-out, transform 250ms ease-out',
    },
    emptyState: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        height: '200px',
        textAlign: 'center' as const,
    },
    emptyTitle: {
        fontSize: '16px',
        fontWeight: 500,
        marginBottom: '12px',
        color: '#999',
    },
    emptySubtext: {
        fontSize: '14px',
        color: '#666',
        lineHeight: '1.5',
    },
    section: {
        marginBottom: '32px',
    },
    name: {
        fontSize: '20px',
        fontWeight: 600,
        marginBottom: '8px',
        lineHeight: '1.3',
    },
    type: {
        fontSize: '12px',
        textTransform: 'uppercase' as const,
        color: '#888',
        letterSpacing: '0.5px',
    },
    sectionTitle: {
        fontSize: '13px',
        textTransform: 'uppercase' as const,
        color: '#888',
        letterSpacing: '0.5px',
        marginBottom: '16px',
        fontWeight: 500,
    },
    attributeRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: '12px',
        gap: '16px',
    },
    attributeLabel: {
        fontSize: '14px',
        color: '#aaa',
        flex: '0 0 auto',
    },
    attributeValue: {
        fontSize: '14px',
        color: '#fff',
        fontWeight: 500,
        textAlign: 'right' as const,
        flex: '1 1 auto',
    },
    missionText: {
        fontSize: '14px',
        color: '#ccc',
        lineHeight: '1.6',
        marginBottom: '16px',
        fontStyle: 'italic',
    },
    contextText: {
        fontSize: '14px',
        color: '#999',
        marginBottom: '8px',
        lineHeight: '1.5',
    },
};
