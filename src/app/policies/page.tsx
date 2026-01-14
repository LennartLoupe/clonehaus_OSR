'use client';

import { useState } from 'react';
import { LearnedPolicy, PolicyStatus } from '@/logic/policy/learnedPolicy';
import { getAllLearnedPolicies } from '@/logic/staging/stagedActions';
import { formatCreatedTime, formatReviewDueTime, formatExpiryTime } from '@/utils/timeUtils';

/**
 * Policy Explorer Page (Phase 6)
 * 
 * First-class, read-only governance surface for viewing learned policies.
 * 
 * CRITICAL: READ-ONLY ONLY
 * - NO execution paths
 * - NO edit/apply/approve buttons
 * - NO mutations
 * 
 * This is governance visibility only.
 */

export default function PolicyExplorerPage() {
    const policies = getAllLearnedPolicies();
    const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);

    const selectedPolicy = selectedPolicyId
        ? policies.find(p => p.policyId === selectedPolicyId) ?? null
        : null;

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div style={styles.headerTitle}>POLICY EXPLORER</div>
                <div style={styles.headerSubtitle}>
                    Learned policies and governance memory
                </div>
            </div>

            <div style={styles.content}>
                {/* Policy List */}
                <div style={styles.listContainer}>
                    <div style={styles.listHeader}>
                        <div style={styles.listTitle}>All Policies</div>
                        <div style={styles.listCount}>{policies.length} learned</div>
                    </div>

                    {policies.length === 0 ? (
                        <div style={styles.emptyState}>
                            <div style={styles.emptyIcon}>📜</div>
                            <div style={styles.emptyTitle}>No policies learned yet</div>
                            <div style={styles.emptyMessage}>
                                Policies will appear here once the system learns from human approvals.
                            </div>
                        </div>
                    ) : (
                        <div style={styles.policyList}>
                            {policies.map(policy => (
                                <PolicyCard
                                    key={policy.policyId}
                                    policy={policy}
                                    isSelected={policy.policyId === selectedPolicyId}
                                    onClick={() => setSelectedPolicyId(policy.policyId)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Policy Detail Inspector */}
                {selectedPolicy && (
                    <div style={styles.detailContainer}>
                        <PolicyDetailInspector
                            policy={selectedPolicy}
                            onClose={() => setSelectedPolicyId(null)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// POLICY CARD
// ============================================================================

interface PolicyCardProps {
    policy: LearnedPolicy;
    isSelected: boolean;
    onClick: () => void;
}

function PolicyCard({ policy, isSelected, onClick }: PolicyCardProps) {
    return (
        <div
            style={{
                ...styles.card,
                ...(isSelected ? styles.cardSelected : {}),
            }}
            onClick={onClick}
        >
            {/* Policy Name */}
            <div style={styles.cardTitle}>
                {policy.constraint.description || 'Unnamed Policy'}
            </div>

            {/* Badges */}
            <div style={styles.cardBadges}>
                <ScopeBadge scope={policy.constraint.affectedScope} />
                <StatusBadge status={policy.lifecycle.status} />
            </div>

            {/* Timestamp */}
            <div style={styles.cardTimestamp}>
                {formatCreatedTime(policy.lifecycle.createdAt)}
            </div>
        </div>
    );
}

function ScopeBadge({ scope }: { scope: string }) {
    return (
        <div style={styles.scopeBadge}>
            {scope.split(':')[0] || 'INSTANCE'}
        </div>
    );
}

function StatusBadge({ status }: { status: PolicyStatus }) {
    const color = getStatusBadgeColor(status);

    return (
        <div style={{ ...styles.statusBadge, ...color }}>
            {status}
        </div>
    );
}

function getStatusBadgeColor(status: PolicyStatus): React.CSSProperties {
    switch (status) {
        case PolicyStatus.ACTIVE:
            return { background: '#2a2a2a', color: '#888' };
        case PolicyStatus.UNDER_REVIEW:
            return { background: '#2a2a1a', color: '#C8A96A', opacity: 0.8 };
        case PolicyStatus.EXPIRED:
            return { background: '#1a1a1a', color: '#666', textDecoration: 'line-through' };
        case PolicyStatus.OVERRIDDEN:
            return { background: '#252a2a', color: '#9b87c7', opacity: 0.8 };
        default:
            return { background: '#2a2a2a', color: '#888' };
    }
}

// ============================================================================
// POLICY DETAIL INSPECTOR
// ============================================================================

interface PolicyDetailInspectorProps {
    policy: LearnedPolicy;
    onClose: () => void;
}

function PolicyDetailInspector({ policy, onClose }: PolicyDetailInspectorProps) {
    return (
        <div style={styles.inspector}>
            {/* Close button */}
            <button style={styles.closeButton} onClick={onClose}>
                ✕
            </button>

            {/* Section 1: Policy Overview */}
            <InspectorSection title="POLICY OVERVIEW">
                <InfoRow label="Policy ID" value={policy.policyId} mono />
                <InfoRow label="Origin" value={`Learned from ${policy.sourceApprovalIntentId}`} />
                <InfoRow label="Approved by" value={policy.learnedBy} />
                <InfoRow label="Scope" value={policy.constraint.affectedScope} />
                <div style={styles.infoRow}>
                    <div style={styles.infoLabel}>Status:</div>
                    <StatusBadge status={policy.lifecycle.status} />
                </div>
            </InspectorSection>

            {/* Section 2: EAPP Anchoring (Non-collapsible) */}
            <InspectorSection title="EAPP ANCHORING" highlight>
                <div style={styles.eappNotice}>
                    This policy does not affect the following constraints:
                </div>
                <EAPPItem
                    title="Identity Layer (EAPP)"
                    description="Core values and ethical posture remain unchanged."
                />
                <EAPPItem
                    title="Ethical Invariants"
                    description="Non-delegable obligations are preserved."
                />
                <EAPPItem
                    title="Non-Delegable Authority"
                    description="Human-only decisions remain human-only."
                />
            </InspectorSection>

            {/* Section 3: LPS Impact Layer */}
            <InspectorSection title="LPS IMPACT LAYER">
                <div style={styles.lpsDescription}>
                    This policy adjusts how authority is interpreted at the <strong>{policy.primaryLayer}</strong> level.
                </div>
                <div style={styles.lpsLayers}>
                    <div style={styles.lpsLayerTitle}>Affected Layers:</div>
                    {policy.affectedLayers.map(layer => (
                        <div key={layer} style={styles.lpsLayerItem}>
                            • {layer} {layer === policy.primaryLayer ? '(Primary)' : '(Indirect)'}
                        </div>
                    ))}
                </div>
            </InspectorSection>

            {/* Section 4: Time & Lifecycle */}
            <InspectorSection title="LIFECYCLE">
                <div style={styles.lifecycleContainer}>
                    <div style={styles.lifecycleIcon}>⏱️</div>
                    <div style={styles.lifecycleContent}>
                        <div style={styles.lifecycleRow}>
                            {formatCreatedTime(policy.lifecycle.createdAt)}
                        </div>
                        <div style={styles.lifecycleRow}>
                            {formatReviewDueTime(policy.lifecycle.nextReviewDate)}
                        </div>
                        <div style={styles.lifecycleRow}>
                            {formatExpiryTime(policy.lifecycle.expiresAt)}
                        </div>
                    </div>
                </div>
            </InspectorSection>

            {/* Section 5: Conditional Effect */}
            <InspectorSection title="CONDITIONAL EFFECT">
                <div style={styles.conditionalNotice}>
                    If this policy were applied, the system would...
                </div>
                <div style={styles.conditionalEffect}>
                    {policy.systemReasoning}
                </div>
            </InspectorSection>
        </div>
    );
}

// ============================================================================
// INSPECTOR HELPER COMPONENTS
// ============================================================================

function InspectorSection({
    title,
    children,
    highlight = false
}: {
    title: string;
    children: React.ReactNode;
    highlight?: boolean;
}) {
    return (
        <div style={{
            ...styles.inspectorSection,
            ...(highlight ? styles.inspectorSectionHighlight : {}),
        }}>
            <div style={styles.inspectorSectionTitle}>{title}</div>
            <div style={styles.inspectorSectionContent}>{children}</div>
        </div>
    );
}

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
    return (
        <div style={styles.infoRow}>
            <div style={styles.infoLabel}>{label}:</div>
            <div style={{
                ...styles.infoValue,
                ...(mono ? { fontFamily: 'monospace', fontSize: '11px' } : {}),
            }}>
                {value}
            </div>
        </div>
    );
}

function EAPPItem({ title, description }: { title: string; description: string }) {
    return (
        <div style={styles.eappItem}>
            <div style={styles.eappCheck}>✓</div>
            <div style={styles.eappContent}>
                <div style={styles.eappTitle}>{title}</div>
                <div style={styles.eappDescription}>{description}</div>
            </div>
        </div>
    );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = {
    container: {
        minHeight: '100vh',
        background: '#0a0a0a',
        color: '#ddd',
    },
    header: {
        padding: '32px 40px',
        borderBottom: '1px solid #2a2a2a',
    },
    headerTitle: {
        fontSize: '20px',
        fontWeight: 600,
        color: '#C8A96A',
        letterSpacing: '1px',
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: '13px',
        color: '#888',
    },
    content: {
        display: 'flex',
        gap: 24,
        padding: 40,
    },
    listContainer: {
        flex: 1,
        maxWidth: 500,
    },
    listHeader: {
        display: 'flex',
        justifyContent: 'space-between' as const,
        alignItems: 'center' as const,
        marginBottom: 20,
        paddingBottom: 12,
        borderBottom: '1px solid #1a1a1a',
    },
    listTitle: {
        fontSize: '14px',
        fontWeight: 600,
        color: '#aaa',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px',
    },
    listCount: {
        fontSize: '12px',
        color: '#666',
    },
    policyList: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 12,
    },
    emptyState: {
        textAlign: 'center' as const,
        padding: '80px 40px',
        color: '#666',
    },
    emptyIcon: {
        fontSize: '48px',
        marginBottom: 16,
        opacity: 0.3,
    },
    emptyTitle: {
        fontSize: '16px',
        fontWeight: 500,
        marginBottom: 8,
        color: '#888',
    },
    emptyMessage: {
        fontSize: '13px',
        color: '#666',
        lineHeight: '1.6',
    },
    card: {
        padding: 16,
        background: '#0f0f0f',
        border: '1px solid #2a2a2a',
        borderRadius: 6,
        cursor: 'pointer',
        transition: 'border-color 0.2s',
    },
    cardSelected: {
        borderColor: '#C8A96A',
        background: '#1a1a1a',
    },
    cardTitle: {
        fontSize: '14px',
        color: '#ddd',
        fontWeight: 500,
        marginBottom: 12,
    },
    cardBadges: {
        display: 'flex',
        gap: 8,
        marginBottom: 12,
    },
    scopeBadge: {
        padding: '4px 10px',
        background: '#1a1a1a',
        border: '1px solid #2a2a2a',
        borderRadius: 3,
        fontSize: '10px',
        color: '#888',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px',
    },
    statusBadge: {
        padding: '4px 10px',
        borderRadius: 3,
        fontSize: '10px',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px',
        fontWeight: 500,
    },
    cardTimestamp: {
        fontSize: '11px',
        color: '#666',
    },
    detailContainer: {
        flex: 1,
        maxWidth: 700,
    },
    inspector: {
        background: '#0f0f0f',
        border: '1px solid #2a2a2a',
        borderRadius: 8,
        padding: 24,
        position: 'relative' as const,
    },
    closeButton: {
        position: 'absolute' as const,
        top: 16,
        right: 16,
        background: 'transparent',
        border: 'none',
        color: '#666',
        fontSize: '20px',
        cursor: 'pointer',
        padding: 8,
    },
    inspectorSection: {
        marginBottom: 28,
        paddingBottom: 28,
        borderBottom: '1px solid #1a1a1a',
    },
    inspectorSectionHighlight: {
        background: '#1a1a1a',
        margin: '0 -16px 28px',
        padding: '20px 16px 28px',
        borderRadius: 6,
        border: '1px solid #2a2a2a',
    },
    inspectorSectionTitle: {
        fontSize: '11px',
        fontWeight: 600,
        color: '#777',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px',
        marginBottom: 16,
    },
    inspectorSectionContent: {
        fontSize: '13px',
        color: '#ddd',
    },
    infoRow: {
        display: 'flex',
        marginBottom: 10,
        alignItems: 'center' as const,
    },
    infoLabel: {
        width: 130,
        fontSize: '12px',
        color: '#888',
        fontWeight: 500,
    },
    infoValue: {
        flex: 1,
        fontSize: '12px',
        color: '#aaa',
    },
    eappNotice: {
        fontSize: '13px',
        color: '#aaa',
        marginBottom: 16,
        fontStyle: 'italic' as const,
    },
    eappItem: {
        display: 'flex',
        gap: 12,
        marginBottom: 16,
    },
    eappCheck: {
        color: '#6FAF8E',
        fontSize: '16px',
        opacity: 0.7,
    },
    eappContent: {
        flex: 1,
    },
    eappTitle: {
        fontSize: '13px',
        fontWeight: 500,
        color: '#ddd',
        marginBottom: 4,
    },
    eappDescription: {
        fontSize: '12px',
        color: '#888',
        lineHeight: '1.5',
    },
    lpsDescription: {
        fontSize: '13px',
        color: '#aaa',
        marginBottom: 16,
        lineHeight: '1.6',
    },
    lpsLayers: {
        marginTop: 12,
    },
    lpsLayerTitle: {
        fontSize: '12px',
        color: '#888',
        marginBottom: 8,
        fontWeight: 500,
    },
    lpsLayerItem: {
        fontSize: '12px',
        color: '#aaa',
        marginBottom: 6,
        paddingLeft: 8,
    },
    lifecycleContainer: {
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start' as const,
    },
    lifecycleIcon: {
        fontSize: '16px',
        opacity: 0.5,
    },
    lifecycleContent: {
        flex: 1,
    },
    lifecycleRow: {
        fontSize: '12px',
        color: '#888',
        marginBottom: 6,
    },
    conditionalNotice: {
        fontSize: '13px',
        color: '#aaa',
        marginBottom: 12,
        fontStyle: 'italic' as const,
    },
    conditionalEffect: {
        fontSize: '13px',
        color: '#ddd',
        lineHeight: '1.6',
        padding: 12,
        background: '#0a0a0a',
        borderRadius: 4,
        borderLeft: '3px solid #2a2a2a',
    },
};
