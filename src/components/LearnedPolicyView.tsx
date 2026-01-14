'use client';

import { LearnedPolicy, LPSLayer, LPS_MUTABILITY, PolicyStatus } from '@/logic/policy/learnedPolicy';
import { formatCreatedTime, formatReviewDueTime, formatExpiryTime } from '@/utils/timeUtils';

/**
 * Learned Policy View (Phase 5A)
 * 
 * Read-only display of a single learned policy with full explainability.
 * 
 * CRITICAL: READ-ONLY ONLY
 * No edit, apply, or enable buttons. Policies are inert memory artifacts.
 */

interface LearnedPolicyViewProps {
    policy: LearnedPolicy;
}

export function LearnedPolicyView({ policy }: LearnedPolicyViewProps) {
    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div style={styles.headerTitle}>LEARNED POLICY</div>
                <div style={styles.headerMeta}>
                    Learned {formatTimestamp(policy.learnedAt)} by {policy.learnedBy}
                </div>
            </div>

            {/* Inert Notice */}
            <div style={styles.inertNotice}>
                ℹ This is a memory record only. This policy is not active and does not affect system behavior.
            </div>

            {/* Policy Origin */}
            <Section title="POLICY ORIGIN">
                <InfoRow label="Source Approval" value={policy.sourceApprovalIntentId} />
                <InfoRow label="Source Proposal" value={policy.sourcePolicyProposalId} />
            </Section>

            {/* Lifecycle (Phase 5C) */}
            <Section title="LIFECYCLE">
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
                <div style={styles.lifecycleStatus}>
                    Status: <span style={getStatusColor(policy.lifecycle.status)}>{policy.lifecycle.status}</span>
                </div>
            </Section>

            {/* Affected Layers */}
            <Section title="AFFECTED LPS LAYERS">
                <div style={styles.layersContainer}>
                    <LayerBadge layer={policy.primaryLayer} isPrimary={true} />
                    {policy.affectedLayers
                        .filter(l => l !== policy.primaryLayer)
                        .map(layer => (
                            <LayerBadge key={layer} layer={layer} isPrimary={false} />
                        ))
                    }
                </div>
            </Section>

            {/* Constraint Details */}
            <Section title="CONSTRAINT">
                <div style={styles.constraintType}>{formatConstraintType(policy.constraint.type)}</div>
                <div style={styles.constraintDescription}>{policy.constraint.description}</div>
                <div style={styles.constraintTechnical}>{policy.constraint.technicalDetails}</div>
                <InfoRow label="Scope" value={policy.constraint.affectedScope} />
            </Section>

            {/* Before/After States */}
            <Section title="POLICY STATE">
                <StateComparison
                    label="Before"
                    state={policy.beforeState}
                />
                <StateComparison
                    label="After"
                    state={policy.afterState}
                />
            </Section>

            {/* Human Justification */}
            <Section title="HUMAN JUSTIFICATION">
                <div style={styles.justification}>{policy.humanJustification}</div>
            </Section>

            {/* System Reasoning */}
            <Section title="SYSTEM ANALYSIS">
                <div style={styles.reasoning}>{policy.systemReasoning}</div>
            </Section>

            {/* Validation Status */}
            <Section title="VALIDATION">
                <ValidationStatus policy={policy} />
            </Section>

            {/* Full Explanation */}
            <Section title="COMPLETE EXPLANATION">
                <pre style={styles.explanation}>{policy.explanation}</pre>
            </Section>
        </div>
    );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={styles.section}>
            <div style={styles.sectionTitle}>{title}</div>
            <div style={styles.sectionContent}>{children}</div>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div style={styles.infoRow}>
            <div style={styles.infoLabel}>{label}:</div>
            <div style={styles.infoValue}>{value}</div>
        </div>
    );
}

function StateComparison({ label, state }: { label: string; state: any }) {
    return (
        <div style={styles.stateRow}>
            <div style={styles.stateLabel}>{label}:</div>
            <div style={styles.stateValue}>
                <div style={styles.stateDescription}>{state.description}</div>
                {state.technicalDetails && (
                    <div style={styles.stateTechnical}>{state.technicalDetails}</div>
                )}
            </div>
        </div>
    );
}

function LayerBadge({ layer, isPrimary }: { layer: LPSLayer; isPrimary: boolean }) {
    const mutability = LPS_MUTABILITY[layer];

    return (
        <div style={{
            ...styles.layerBadge,
            ...(isPrimary ? styles.layerBadgePrimary : {}),
        }}>
            <div style={styles.layerName}>{layer}</div>
            <div style={styles.layerMutability}>{mutability}</div>
        </div>
    );
}

function ValidationStatus({ policy }: { policy: LearnedPolicy }) {
    return (
        <div style={styles.validationContainer}>
            <ValidationCheck
                label="EAPP Compliance"
                passed={policy.eappValidation.passed}
                details={policy.eappValidation.violations.join(', ') || 'All checks passed'}
            />
            <ValidationCheck
                label="LPS Boundaries"
                passed={policy.lpsValidation.valid}
                details={policy.lpsValidation.reason}
            />
            <ValidationCheck
                label="Monotonicity"
                passed={policy.monotonicityValidation.valid}
                details={`Direction: ${policy.monotonicityValidation.direction}`}
            />
        </div>
    );
}

function ValidationCheck({ label, passed, details }: { label: string; passed: boolean; details: string }) {
    return (
        <div style={styles.validationCheck}>
            <div style={styles.validationLabel}>
                <span style={passed ? styles.validationPassed : styles.validationFailed}>
                    {passed ? '✓' : '✗'}
                </span>
                {' '}{label}
            </div>
            <div style={styles.validationDetails}>{details}</div>
        </div>
    );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatTimestamp(iso: string): string {
    const date = new Date(iso);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatConstraintType(type: string): string {
    return type
        .split('_')
        .map(word => word.charAt(0) + word.slice(1).toLowerCase())
        .join(' ');
}

/**
 * Get neutral status color (Phase 5C).
 * NO urgency colors - all muted and secondary.
 */
function getStatusColor(status: PolicyStatus): React.CSSProperties {
    switch (status) {
        case PolicyStatus.ACTIVE:
            return { color: '#888' }; // Neutral gray
        case PolicyStatus.UNDER_REVIEW:
            return { color: '#C8A96A', opacity: 0.6 }; // Muted amber
        case PolicyStatus.EXPIRED:
            return { color: '#666', textDecoration: 'line-through' }; // Muted gray, crossed out
        case PolicyStatus.OVERRIDDEN:
            return { color: '#9b87c7', opacity: 0.6 }; // Muted purple
        default:
            return { color: '#888' };
    }
}

// ============================================================================
// STYLES
// ============================================================================

const styles = {
    container: {
        marginBottom: 32,
        padding: 24,
        background: '#0a0a0a',
        border: '1px solid #2a2a2a',
        borderRadius: 8,
    },
    header: {
        marginBottom: 20,
        paddingBottom: 16,
        borderBottom: '1px solid #1a1a1a',
    },
    headerTitle: {
        fontSize: '14px',
        textTransform: 'uppercase' as const,
        color: '#C8A96A',
        letterSpacing: '1px',
        fontWeight: 600,
        marginBottom: 8,
    },
    headerMeta: {
        fontSize: '12px',
        color: '#666',
    },
    inertNotice: {
        marginBottom: 24,
        padding: 14,
        background: '#1a1a1a',
        border: '1px solid #2a2a2a',
        borderRadius: 6,
        fontSize: '12px',
        color: '#888',
        fontWeight: 500,
    },
    section: {
        marginBottom: 24,
        paddingBottom: 24,
        borderBottom: '1px solid #151515',
    },
    sectionTitle: {
        fontSize: '11px',
        textTransform: 'uppercase' as const,
        color: '#777',
        letterSpacing: '0.5px',
        marginBottom: 14,
        fontWeight: 600,
    },
    sectionContent: {
        fontSize: '13px',
        color: '#ddd',
    },
    infoRow: {
        display: 'flex',
        marginBottom: 10,
    },
    infoLabel: {
        width: 140,
        fontSize: '12px',
        color: '#888',
        fontWeight: 500,
    },
    infoValue: {
        flex: 1,
        fontSize: '12px',
        color: '#aaa',
        fontFamily: 'monospace',
    },
    // Phase 5C: Lifecycle time display
    lifecycleContainer: {
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start' as const,
        marginBottom: 14,
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
        fontWeight: 400,
    },
    lifecycleStatus: {
        fontSize: '11px',
        color: '#666',
        marginTop: 8,
        paddingTop: 8,
        borderTop: '1px solid #1a1a1a',
    },
    layersContainer: {
        display: 'flex',
        gap: 10,
        flexWrap: 'wrap' as const,
    },
    layerBadge: {
        padding: '8px 12px',
        background: '#1a1a1a',
        border: '1px solid #2a2a2a',
        borderRadius: 4,
    },
    layerBadgePrimary: {
        background: '#1a1a12',
        border: '1px solid #3a3a2a',
    },
    layerName: {
        fontSize: '11px',
        color: '#C8A96A',
        fontWeight: 600,
        marginBottom: 4,
    },
    layerMutability: {
        fontSize: '9px',
        color: '#666',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px',
    },
    constraintType: {
        fontSize: '14px',
        color: '#fff',
        fontWeight: 500,
        marginBottom: 10,
    },
    constraintDescription: {
        fontSize: '13px',
        color: '#ddd',
        marginBottom: 8,
    },
    constraintTechnical: {
        fontSize: '11px',
        color: '#888',
        fontStyle: 'italic' as const,
        marginBottom: 12,
    },
    stateRow: {
        marginBottom: 18,
    },
    stateLabel: {
        fontSize: '12px',
        color: '#888',
        marginBottom: 8,
        fontWeight: 500,
    },
    stateValue: {
        paddingLeft: 16,
        borderLeft: '2px solid #2a2a2a',
    },
    stateDescription: {
        fontSize: '13px',
        color: '#ddd',
        marginBottom: 4,
    },
    stateTechnical: {
        fontSize: '11px',
        color: '#666',
        fontStyle: 'italic' as const,
    },
    justification: {
        fontSize: '13px',
        color: '#ddd',
        lineHeight: '1.6',
        fontStyle: 'italic' as const,
        padding: 12,
        background: '#0f0f0f',
        borderRadius: 4,
    },
    reasoning: {
        fontSize: '13px',
        color: '#a1a1aa',
        lineHeight: '1.6',
    },
    validationContainer: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 14,
    },
    validationCheck: {
        padding: 12,
        background: '#0f0f0f',
        borderRadius: 4,
    },
    validationLabel: {
        fontSize: '12px',
        fontWeight: 500,
        marginBottom: 6,
    },
    validationPassed: {
        color: '#6FAF8E',
    },
    validationFailed: {
        color: '#D77A61',
    },
    validationDetails: {
        fontSize: '11px',
        color: '#888',
    },
    explanation: {
        fontSize: '11px',
        color: '#999',
        lineHeight: '1.8',
        fontFamily: 'monospace',
        padding: 16,
        background: '#0f0f0f',
        borderRadius: 4,
        whiteSpace: 'pre-wrap' as const,
        overflow: 'auto',
    },
};
