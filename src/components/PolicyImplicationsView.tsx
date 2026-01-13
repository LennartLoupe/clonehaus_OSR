'use client';

import { PolicyChangeProposal } from '@/logic/staging/stagedActions';

/**
 * Policy Implications View (Phase 4C)
 * 
 * Displays policy change proposals derived from approved ApprovalIntents.
 * Shows what the system WOULD change, but does NOT apply changes.
 * 
 * CRITICAL: NO POLICY APPLICATION
 * Confirming a proposal does NOT apply any changes. It only marks ready for future phases.
 */

interface PolicyImplicationsViewProps {
    proposal: PolicyChangeProposal;
    onConfirm: (proposalId: string) => void;
    onDismiss: (proposalId: string) => void;
}

export function PolicyImplicationsView({ proposal, onConfirm, onDismiss }: PolicyImplicationsViewProps) {
    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>POLICY IMPLICATIONS</div>

            {/* Warning */}
            <div style={styles.warning}>
                ⚠ This does not execute anything. Proposed changes are not applied.
            </div>

            {/* Proposed Change Type */}
            <Section title="PROPOSED CHANGE">
                <div style={styles.changeType}>{formatChangeType(proposal.proposedChangeType)}</div>
            </Section>

            {/* Before/After States */}
            <Section title="WHAT WOULD CHANGE">
                <StateComparison
                    label="Current"
                    state={proposal.beforeState}
                />
                <StateComparison
                    label="Proposed"
                    state={proposal.afterState}
                />
            </Section>

            {/* System Analysis */}
            <Section title="SYSTEM ANALYSIS">
                <div style={styles.reasoning}>{proposal.systemReasoning}</div>
            </Section>

            {/* Human Justification */}
            <Section title="HUMAN JUSTIFICATION">
                <div style={styles.justification}>{proposal.humanJustification}</div>
            </Section>

            {/* Actions */}
            {proposal.status === 'PROPOSED' && (
                <div style={styles.actions}>
                    <button
                        onClick={() => onConfirm(proposal.proposalId)}
                        style={styles.confirmButton}
                    >
                        Confirm Proposal
                    </button>
                    <button
                        onClick={() => onDismiss(proposal.proposalId)}
                        style={styles.dismissButton}
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* Status Display */}
            {proposal.status === 'CONFIRMED' && (
                <div style={styles.statusConfirmed}>
                    Proposal confirmed. Ready for future phases.
                </div>
            )}
            {proposal.status === 'DISMISSED' && (
                <div style={styles.statusDismissed}>
                    Proposal dismissed. System state unchanged.
                </div>
            )}
        </div>
    );
}

// Helper components
function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={styles.section}>
            <div style={styles.sectionTitle}>{title}</div>
            <div style={styles.sectionContent}>{children}</div>
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

// Helper functions
function formatChangeType(type: string): string {
    return type
        .split('_')
        .map(word => word.charAt(0) + word.slice(1).toLowerCase())
        .join(' ');
}

// ============================================================================
// STYLES
// ============================================================================

const styles = {
    container: {
        marginBottom: 24,
        padding: 16,
        background: '#0f0f0f',
        border: '1px solid #2a2a2a',
        borderRadius: 6,
    },
    header: {
        fontSize: '12px',
        textTransform: 'uppercase' as const,
        color: '#C8A96A', // Muted amber
        letterSpacing: '0.5px',
        marginBottom: 16,
        fontWeight: 600,
    },
    warning: {
        marginBottom: 20,
        padding: 12,
        background: '#1a1a1a',
        border: '1px solid #3a3a2a',
        borderRadius: 4,
        fontSize: '12px',
        color: '#C8A96A',
        fontWeight: 500,
    },
    section: {
        marginBottom: 20,
        paddingBottom: 20,
        borderBottom: '1px solid #1a1a1a',
    },
    sectionTitle: {
        fontSize: '11px',
        textTransform: 'uppercase' as const,
        color: '#777',
        letterSpacing: '0.5px',
        marginBottom: 12,
        fontWeight: 500,
    },
    sectionContent: {
        fontSize: '13px',
        color: '#ddd',
    },
    changeType: {
        fontSize: '14px',
        color: '#fff',
        fontWeight: 500,
    },
    stateRow: {
        marginBottom: 16,
    },
    stateLabel: {
        fontSize: '12px',
        color: '#888',
        marginBottom: 6,
        fontWeight: 500,
    },
    stateValue: {
        paddingLeft: 12,
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
    reasoning: {
        fontSize: '13px',
        color: '#a1a1aa',
        lineHeight: '1.6',
    },
    justification: {
        fontSize: '13px',
        color: '#ddd',
        lineHeight: '1.6',
        fontStyle: 'italic' as const,
    },
    actions: {
        display: 'flex',
        gap: 12,
        marginTop: 20,
    },
    confirmButton: {
        flex: 1,
        padding: '12px 20px',
        background: '#2a2a2a',
        color: '#C8A96A',
        border: '1px solid #3a3a3a',
        borderRadius: 4,
        fontSize: '13px',
        fontWeight: 500,
        cursor: 'pointer',
    },
    dismissButton: {
        flex: 1,
        padding: '12px 20px',
        background: 'transparent',
        color: '#888',
        border: '1px solid #2a2a2a',
        borderRadius: 4,
        fontSize: '13px',
        fontWeight: 500,
        cursor: 'pointer',
    },
    statusConfirmed: {
        marginTop: 16,
        padding: 12,
        background: '#1a2a1a',
        border: '1px solid #2a3a2a',
        borderRadius: 4,
        fontSize: '12px',
        color: '#6FAF8E',
        textAlign: 'center' as const,
    },
    statusDismissed: {
        marginTop: 16,
        padding: 12,
        background: '#1a1a1a',
        border: '1px solid #2a2a2a',
        borderRadius: 4,
        fontSize: '12px',
        color: '#888',
        textAlign: 'center' as const,
    },
};
