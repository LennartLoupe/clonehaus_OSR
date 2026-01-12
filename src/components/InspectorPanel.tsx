'use client';

import { Phase0Data, Organization, Domain, Agent } from '@/app/data/types';
import {
    deriveOrganizationAuthority,
    deriveDomainAuthority,
    deriveAgentAuthority,
    AuthorityResult,
} from '@/logic/authority/deriveAuthority';
import { deriveActionSurface, ActionState } from '@/logic/authority/deriveActionSurface';

export type ExplanationMode = 'MINIMAL' | 'STANDARD' | 'VERBOSE';

interface InspectorPanelProps {
    selectedNodeId: string | null;
    data: Phase0Data;
    explanationMode: ExplanationMode;
    onExplanationModeChange: (mode: ExplanationMode) => void;
}

export function InspectorPanel({
    selectedNodeId,
    data,
    explanationMode,
    onExplanationModeChange,
}: InspectorPanelProps) {
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
                    {/* Phase 2A.2: Mode Selector */}
                    <ExplanationModeSelector
                        mode={explanationMode}
                        onChange={onExplanationModeChange}
                    />

                    {nodeInfo.type === 'ORGANIZATION' && (
                        <OrganizationView
                            org={nodeInfo.data as Organization}
                            mode={explanationMode}
                        />
                    )}
                    {nodeInfo.type === 'DOMAIN' && (
                        <DomainView
                            domain={nodeInfo.data as Domain}
                            organization={data.organization}
                            mode={explanationMode}
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
                            mode={explanationMode}
                        />
                    )}
                </>
            )}
        </div>
    );
}

// ============================================================================
// MODE SELECTOR COMPONENT
// ============================================================================

function ExplanationModeSelector({
    mode,
    onChange,
}: {
    mode: ExplanationMode;
    onChange: (mode: ExplanationMode) => void;
}) {
    const modes: ExplanationMode[] = ['MINIMAL', 'STANDARD', 'VERBOSE'];

    return (
        <div style={styles.modeSelector}>
            <div style={styles.modeSelectorLabel}>Explanation</div>
            <div style={styles.modeSelectorButtons}>
                {modes.map((m) => (
                    <button
                        key={m}
                        onClick={() => onChange(m)}
                        style={{
                            ...styles.modeButton,
                            ...(mode === m ? styles.modeButtonActive : {}),
                        }}
                        aria-label={`${m.toLowerCase()} explanation mode`}
                        aria-pressed={mode === m}
                    >
                        {m.charAt(0) + m.slice(1).toLowerCase()}
                    </button>
                ))}
            </div>
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

// ============================================================================
// ORGANIZATION VIEW
// ============================================================================

function OrganizationView({ org, mode }: { org: Organization; mode: ExplanationMode }) {
    const authority = deriveOrganizationAuthority(org);

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

            {/* Authority Explanation (Mode-Aware) */}
            <AuthorityExplanation authority={authority} mode={mode} />
        </div>
    );
}

// ============================================================================
// DOMAIN VIEW
// ============================================================================

function DomainView({
    domain,
    organization,
    mode,
}: {
    domain: Domain;
    organization: Organization;
    mode: ExplanationMode;
}) {
    const authority = deriveDomainAuthority(organization, domain);

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

            {/* Authority Explanation (Mode-Aware) */}
            <AuthorityExplanation authority={authority} mode={mode} />
        </div>
    );
}

// ============================================================================
// AGENT VIEW
// ============================================================================

function AgentView({
    agent,
    domain,
    organization,
    mode,
}: {
    agent: Agent;
    domain: Domain;
    organization: Organization;
    mode: ExplanationMode;
}) {
    const authority = deriveAgentAuthority(organization, domain, agent);

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

            {/* Authority Explanation (Mode-Aware) */}
            <AuthorityExplanation authority={authority} mode={mode} />

            {/* Phase 2C.1: Action Surface */}
            <ActionSurfaceView agent={agent} authority={authority} domain={domain} organization={organization} />
        </div>
    );
}

// ============================================================================
// AUTHORITY EXPLANATION (MODE-AWARE RENDERER)
// ============================================================================

function AuthorityExplanation({
    authority,
    mode,
}: {
    authority: AuthorityResult;
    mode: ExplanationMode;
}) {
    if (mode === 'MINIMAL') {
        return <MinimalExplanation authority={authority} />;
    }

    if (mode === 'STANDARD') {
        return <StandardExplanation authority={authority} />;
    }

    if (mode === 'VERBOSE') {
        return <VerboseExplanation authority={authority} />;
    }

    return null;
}

// MINIMAL MODE: One-line summary
function MinimalExplanation({ authority }: { authority: AuthorityResult }) {
    const restrictions = authority.reasoning.filter((r) => r.impact === 'RESTRICT');
    const primaryRestriction = restrictions[0];

    let summary = `Effective authority: ${authority.effectiveAuthorityLevel}`;
    if (primaryRestriction) {
        // Extract concise constraint
        const constraint = extractMainConstraint(primaryRestriction.detail);
        summary += ` (${constraint})`;
    }

    return (
        <div style={styles.section}>
            <div style={styles.sectionTitle}>Authority</div>
            <div style={styles.authorityLevel}>{summary}</div>
        </div>
    );
}

// STANDARD MODE: Current behavior (key limiting factors)
function StandardExplanation({ authority }: { authority: AuthorityResult }) {
    return (
        <div style={styles.section}>
            <div style={styles.sectionTitle}>Authority Explanation</div>
            <div style={styles.authorityLevel}>
                Effective authority: {authority.effectiveAuthorityLevel}
            </div>
            {authority.reasoning.map((step, index) => (
                <div key={index} style={styles.reasoningStep}>
                    • {step.level.toLowerCase()}: {step.detail}
                </div>
            ))}
        </div>
    );
}

// VERBOSE MODE: Full details (all constraints + blocked actions)
function VerboseExplanation({ authority }: { authority: AuthorityResult }) {
    return (
        <div style={styles.section}>
            <div style={styles.sectionTitle}>Authority Explanation (Verbose)</div>
            <div style={styles.authorityLevel}>
                Effective authority: {authority.effectiveAuthorityLevel}
            </div>

            {/* Inheritance Chain */}
            <div style={styles.verboseSubSection}>
                <div style={styles.verboseSubTitle}>Inheritance Chain</div>
                {authority.authoritySourcePath.map((entry, index) => (
                    <div key={index} style={styles.verboseEntry}>
                        {index + 1}. {entry.level}: {entry.name} (ceiling: {entry.ceiling})
                    </div>
                ))}
            </div>

            {/* Detailed Reasoning */}
            <div style={styles.verboseSubSection}>
                <div style={styles.verboseSubTitle}>Derivation Reasoning</div>
                {authority.reasoning.map((step, index) => (
                    <div key={index} style={styles.verboseEntry}>
                        <div style={styles.verboseEntryHeader}>
                            {step.level} [{step.impact}]
                        </div>
                        <div style={styles.verboseEntryDetail}>{step.detail}</div>
                    </div>
                ))}
            </div>

            {/* Blocked Actions */}
            {authority.blockedActions.length > 0 && (
                <div style={styles.verboseSubSection}>
                    <div style={styles.verboseSubTitle}>Constraint Details</div>
                    {authority.blockedActions.map((action, index) => (
                        <div key={index} style={styles.verboseEntry}>
                            • {action}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Helper: Extract main constraint from detail for minimal mode
function extractMainConstraint(detail: string): string {
    if (detail.includes('Domain caps') || detail.includes('Domain restricts')) {
        return 'restricted by domain';
    }
    if (detail.includes('Agent autonomy')) {
        return 'restricted by agent autonomy';
    }
    if (detail.includes('READ-only')) {
        return 'READ-only surface';
    }
    if (detail.includes('cannot EXECUTE')) {
        return 'no EXECUTE';
    }
    if (detail.includes('ADVISORY')) {
        return 'advisory only';
    }
    return 'restricted';
}

// ============================================================================
// ACTION SURFACE VIEW (Phase 2C.1)
// ============================================================================

function ActionSurfaceView({
    agent,
    authority,
    domain,
    organization,
}: {
    agent: Agent;
    authority: AuthorityResult;
    domain: Domain;
    organization: Organization;
}) {
    const actionSurface = deriveActionSurface(agent, authority, domain, organization);

    return (
        <div style={styles.section}>
            <div style={styles.sectionTitle}>Action Surface</div>
            {actionSurface.actions.map((action) => (
                <div key={action.category} style={styles.actionRow} title={action.reason}>
                    <div style={styles.actionLabel}>{action.label}</div>
                    <div style={{
                        ...styles.actionBadge,
                        ...(action.state === 'ALLOWED' ? styles.actionBadgeAllowed : {}),
                        ...(action.state === 'RESTRICTED' ? styles.actionBadgeRestricted : {}),
                        ...(action.state === 'BLOCKED' ? styles.actionBadgeBlocked : {}),
                    }}>
                        {action.state}
                    </div>
                </div>
            ))}
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

// ============================================================================
// STYLES
// ============================================================================

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
    // Mode Selector
    modeSelector: {
        marginBottom: 24,
        paddingBottom: 16,
        borderBottom: '1px solid #2a2a2a',
    },
    modeSelectorLabel: {
        fontSize: 11,
        textTransform: 'uppercase' as const,
        color: '#666',
        letterSpacing: '0.5px',
        marginBottom: 10,
    },
    modeSelectorButtons: {
        display: 'flex',
        gap: 4,
    },
    modeButton: {
        flex: 1,
        padding: '6px 8px',
        fontSize: 11,
        fontWeight: 500,
        background: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: 4,
        color: '#999',
        cursor: 'pointer',
        transition: 'all 150ms ease',
    },
    modeButtonActive: {
        background: '#2a2a2a',
        borderColor: '#555',
        color: '#fff',
    },
    section: {
        marginBottom: 32,
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
    // Authority explanation styles
    authorityLevel: {
        fontSize: '15px',
        color: '#fff',
        fontWeight: 500,
        marginBottom: '14px',
    },
    reasoningStep: {
        fontSize: '14px',
        color: '#bbb',
        lineHeight: '1.7',
        marginBottom: '10px',
    },
    // Verbose mode styles
    verboseSubSection: {
        marginTop: 20,
    },
    verboseSubTitle: {
        fontSize: '12px',
        textTransform: 'uppercase' as const,
        color: '#777',
        letterSpacing: '0.5px',
        marginBottom: 10,
        fontWeight: 500,
    },
    verboseEntry: {
        fontSize: '13px',
        color: '#ccc',
        lineHeight: '1.6',
        marginBottom: '8px',
    },
    verboseEntryHeader: {
        fontSize: '12px',
        color: '#888',
        textTransform: 'uppercase' as const,
        marginBottom: 4,
    },
    verboseEntryDetail: {
        fontSize: '14px',
        color: '#bbb',
        lineHeight: '1.6',
    },
    // Phase 2C.1: Action Surface styles
    actionRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
        cursor: 'default',
    },
    actionLabel: {
        fontSize: '14px',
        color: '#ccc',
    },
    actionBadge: {
        fontSize: '11px',
        fontWeight: 600,
        padding: '4px 10px',
        borderRadius: 4,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.3px',
    },
    actionBadgeAllowed: {
        background: '#1a3a2a',
        color: '#6cc070',
        border: '1px solid #2a4a3a',
    },
    actionBadgeRestricted: {
        background: '#3a2f1a',
        color: '#daa520',
        border: '1px solid #4a3f2a',
    },
    actionBadgeBlocked: {
        background: '#2a1a1a',
        color: '#999',
        border: '1px solid #3a2a2a',
    },
};
