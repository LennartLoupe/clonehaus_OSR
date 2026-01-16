'use client';

import { Phase0Data, Organization, Domain, Agent } from '@/app/data/types';
import {
    deriveOrganizationAuthority,
    deriveDomainAuthority,
    deriveAgentAuthority,
    AuthorityResult
} from '@/logic/authority/deriveAuthority';
import { formatAuthorityBadge } from '@/logic/authority/compactFormatting';
import { getPersonaIdentityForAgent } from '@/logic/persona/personaIdentityMapping';
import {
    Clock,
    Shield,
    Lock,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    HelpCircle,
    Network,
    User,
    Brain,
    Scale,
    Activity
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export type ExplanationMode = 'STANDARD' | 'TECHNICAL' | 'AUDIT';

export interface InspectorPanelProps {
    selectedNodeId: string | null;
    data: Phase0Data;
    explanationMode: ExplanationMode;
    onExplanationModeChange: (mode: ExplanationMode) => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function InspectorPanel({
    selectedNodeId,
    data,
    explanationMode,
    onExplanationModeChange,
}: InspectorPanelProps) {
    // 1. Resolve Selected Node
    const org = data.organization;
    let selectedType: 'ORGANIZATION' | 'DOMAIN' | 'AGENT' | null = null;
    let selectedEntity: Organization | Domain | Agent | null = null;
    let parentDomain: Domain | null = null;

    if (selectedNodeId === org.id) {
        selectedType = 'ORGANIZATION';
        selectedEntity = org;
    } else {
        const domain = data.domains.find(d => d.id === selectedNodeId);
        if (domain) {
            selectedType = 'DOMAIN';
            selectedEntity = domain;
        } else {
            const agent = data.agents.find(a => a.id === selectedNodeId);
            if (agent) {
                selectedType = 'AGENT';
                selectedEntity = agent;
                parentDomain = data.domains.find(d => d.id === agent.domainId) || null;
            }
        }
    }

    // 2. Early Return if nothing selected
    if (!selectedNodeId || !selectedEntity || !selectedType) {
        return (
            <div style={{ ...styles.panel, transform: 'translateX(100%)', opacity: 0 }}>
                {/* Hidden state */}
            </div>
        );
    }

    return (
        <div style={styles.panel}>
            {/* HEADER */}
            <InspectorHeader
                type={selectedType}
                name={selectedEntity.name}
                status={(selectedEntity as any).status || 'ACTIVE'}
            />

            {/* SCROLLABLE CONTENT */}
            <div style={styles.content}>

                {/* SECTION 1: OS CONTEXT */}
                <SectionOSContext
                    type={selectedType}
                    org={org}
                    domain={parentDomain || (selectedType === 'DOMAIN' ? (selectedEntity as Domain) : undefined)}
                />

                {/* SECTION 2: PERSONA IDENTITY (Agents Only) */}
                {selectedType === 'AGENT' && (
                    <SectionPersonaIdentity agent={selectedEntity as Agent} />
                )}

                {/* SECTION 3: RUNTIME AUTHORITY */}
                <SectionRuntimeAuthority
                    type={selectedType}
                    org={org}
                    domain={parentDomain || (selectedType === 'DOMAIN' ? (selectedEntity as Domain) : undefined)}
                    agent={selectedType === 'AGENT' ? (selectedEntity as Agent) : undefined}
                />

                {/* SECTION 4: EXECUTION READINESS (Agents Only) */}
                {selectedType === 'AGENT' && (
                    <SectionExecutionReadiness />
                )}
            </div>
        </div>
    );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function InspectorHeader({ type, name, status }: { type: string, name: string, status: string }) {
    return (
        <div style={styles.header}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={styles.typeLabel}>{type}</span>
                <span style={styles.statusBadge}>{status}</span>
            </div>
            <div style={styles.entityName}>{name}</div>
        </div>
    );
}

function SectionOSContext({ type, org, domain }: { type: string, org: Organization, domain?: Domain }) {
    return (
        <div style={styles.section}>
            <SectionTitle icon={<Network size={14} />} title="OS Context" />

            <div style={styles.contextRow}>
                <span style={styles.contextLabel}>Organization</span>
                <span style={styles.contextValue}>{org.name}</span>
            </div>

            {domain && (
                <div style={styles.contextRow}>
                    <span style={styles.contextLabel}>Domain</span>
                    <span style={styles.contextValue}>{domain.name}</span>
                </div>
            )}

            {/* Constraints logic mock (Phase A simplistic) */}
            <div style={styles.contextBlock}>
                <div style={styles.contextLabel}>Inherited Constraints</div>
                <ul style={styles.bulletList}>
                    <li>Subject to Organization Authority Ceiling ({org.authorityCeiling})</li>
                    {domain && <li>Subject to Domain Mission: "{domain.mission}"</li>}
                </ul>
            </div>
        </div>
    );
}

function SectionPersonaIdentity({ agent }: { agent: Agent }) {
    const identity = getPersonaIdentityForAgent(agent.id);

    return (
        <div style={styles.section}>
            <SectionTitle icon={<User size={14} />} title="Persona Identity" />

            {identity ? (
                <>
                    <div style={styles.contextRow}>
                        <span style={styles.contextLabel}>Assigned Role</span>
                        <span style={styles.contextValue}>{identity.roleIdentity.roleName}</span>
                    </div>

                    <div style={{ ...styles.contextBlock, marginTop: 12 }}>
                        <div style={styles.contextLabel}>Purpose</div>
                        <div style={styles.readOnlyText}>{identity.roleIdentity.purposeStatement}</div>
                    </div>

                    <div style={{ ...styles.contextBlock, marginTop: 12 }}>
                        <div style={styles.contextLabel}>Ethical Commitments <Lock size={10} style={{ display: 'inline', marginLeft: 4 }} /></div>
                        <ul style={styles.bulletList}>
                            {identity.ethicalFrame.immutableCommitments.map((c, i) => (
                                <li key={i}>{c}</li>
                            ))}
                        </ul>
                        <div style={styles.noticeText}>These commitments cannot be overridden.</div>
                    </div>
                </>
            ) : (
                <div style={styles.readOnlyText}>No extended persona identity definition found.</div>
            )}
        </div>
    );
}

function SectionRuntimeAuthority({ type, org, domain, agent }: { type: string, org: Organization, domain?: Domain, agent?: Agent }) {
    // Derive authority based on selection
    let authority: AuthorityResult | null = null;
    if (type === 'ORGANIZATION') authority = deriveOrganizationAuthority(org);
    else if (type === 'DOMAIN' && domain) authority = deriveDomainAuthority(org, domain);
    else if (type === 'AGENT' && domain && agent) authority = deriveAgentAuthority(org, domain, agent);

    if (!authority) return null;

    return (
        <div style={styles.section}>
            <SectionTitle icon={<Scale size={14} />} title="Runtime Authority" />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {authority.doActions.map((action, i) => {
                    const statusColor =
                        action.verdict === 'ALLOWED' ? '#6FAF8E' :
                            action.verdict === 'ESCALATION_REQUIRED' ? '#C8A96A' : '#d97070';
                    const statusBg =
                        action.verdict === 'ALLOWED' ? '#1a3a2a' :
                            action.verdict === 'ESCALATION_REQUIRED' ? '#3a2f1a' : '#3a1a1a';

                    return (
                        <div key={i} style={styles.actionRow}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={styles.actionName}>{action.actionName}</span>
                                <span style={{
                                    ...styles.verdictBadge,
                                    color: statusColor,
                                    background: statusBg,
                                    border: `1px solid ${statusBg}`
                                }}>
                                    {action.verdict.replace('_', ' ')}
                                </span>
                            </div>
                            <div style={styles.actionReason}>
                                {action.reasons[0] || 'No specific constraint.'}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function SectionExecutionReadiness() {
    return (
        <div style={styles.section}>
            <SectionTitle icon={<Activity size={14} />} title="Execution Readiness" />

            <div style={styles.gateRow}>
                <div style={styles.gateLabel}>
                    <Shield size={12} color="#6FAF8E" /> Authority Gate
                </div>
                <div style={styles.gateStatus}>PASS</div>
            </div>
            <div style={styles.gateRow}>
                <div style={styles.gateLabel}>
                    <Brain size={12} color="#6FAF8E" /> Persona Alignment
                </div>
                <div style={styles.gateStatus}>PASS</div>
            </div>
            <div style={styles.gateRow}>
                <div style={styles.gateLabel}>
                    <AlertTriangle size={12} color="#C8A96A" /> Escalation Check
                </div>
                <div style={{ ...styles.gateStatus, color: '#C8A96A' }}>PENDING</div>
            </div>

            <div style={styles.executionSummary}>
                Execution would require explicit human approval due to escalation requirements.
            </div>
        </div>
    );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode, title: string }) {
    return (
        <div style={styles.sectionHeader}>
            <span style={{ opacity: 0.7 }}>{icon}</span>
            <span style={styles.sectionTitleText}>{title}</span>
        </div>
    );
}


// ============================================================================
// STYLES
// ============================================================================

const styles = {
    panel: {
        position: 'fixed' as const,
        top: 20,
        right: 20,
        bottom: 20,
        width: '380px',
        height: 'auto',
        background: '#0e0e0e',
        border: '1px solid #333',
        borderRadius: 16,
        display: 'flex',
        flexDirection: 'column' as const,
        color: '#fff',
        boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
        zIndex: 100,
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden'
    },
    header: {
        padding: '24px 24px 16px',
        borderBottom: '1px solid #222',
        background: '#111'
    },
    content: {
        flex: 1,
        overflowY: 'auto' as const,
        padding: '24px',
        paddingTop: 8
    },
    typeLabel: {
        fontSize: '10px',
        fontWeight: 700,
        textTransform: 'uppercase' as const,
        letterSpacing: '1px',
        color: '#666',
    },
    statusBadge: {
        fontSize: '10px',
        fontWeight: 600,
        background: '#1a3a2a',
        color: '#6FAF8E',
        padding: '2px 8px',
        borderRadius: 4,
        textTransform: 'uppercase' as const,
    },
    entityName: {
        fontSize: '20px',
        fontWeight: 600,
        color: '#fff',
        lineHeight: 1.2
    },
    section: {
        marginTop: 24,
        marginBottom: 24,
    },
    sectionHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
        paddingBottom: 8,
        borderBottom: '1px solid #222',
        color: '#888'
    },
    sectionTitleText: {
        fontSize: '12px',
        fontWeight: 600,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px'
    },
    contextRow: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '13px',
        marginBottom: 8,
        color: '#ddd'
    },
    contextLabel: {
        color: '#666',
    },
    contextValue: {
        fontWeight: 500
    },
    contextBlock: {
        marginTop: 12,
        background: '#151515',
        padding: 12,
        borderRadius: 6,
        border: '1px solid #222'
    },
    bulletList: {
        margin: 0,
        paddingLeft: 16,
        marginTop: 8,
        fontSize: '12px',
        color: '#aaa',
        lineHeight: 1.5
    },
    readOnlyText: {
        fontSize: '13px',
        color: '#888',
        fontStyle: 'italic',
        lineHeight: 1.5
    },
    noticeText: {
        fontSize: '11px',
        color: '#666',
        marginTop: 8,
        fontStyle: 'italic'
    },
    actionRow: {
        background: '#121212',
        border: '1px solid #222',
        padding: 10,
        borderRadius: 6
    },
    actionName: {
        fontSize: '13px',
        fontWeight: 500,
        color: '#eee'
    },
    verdictBadge: {
        fontSize: '9px',
        fontWeight: 700,
        padding: '2px 6px',
        borderRadius: 3,
        textTransform: 'uppercase' as const,
    },
    actionReason: {
        fontSize: '11px',
        color: '#666',
        lineHeight: 1.4
    },
    gateRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 0',
        borderBottom: '1px solid #1a1a1a'
    },
    gateLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: '13px',
        color: '#ccc'
    },
    gateStatus: {
        fontSize: '11px',
        fontWeight: 700,
        color: '#6FAF8E'
    },
    executionSummary: {
        marginTop: 16,
        fontSize: '12px',
        color: '#888',
        fontStyle: 'italic',
        textAlign: 'center' as const,
        lineHeight: 1.5
    }
};
