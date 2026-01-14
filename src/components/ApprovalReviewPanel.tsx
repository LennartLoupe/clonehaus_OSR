'use client';

import { useState } from 'react';
import { StagedAction, ApprovalScope } from '@/logic/staging/stagedActions';

/**
 * Approval Review Panel (Phase 4B)
 * 
 * Human-centered approval review and intent capture system.
 * 
 * CRITICAL: NO EXECUTION
 * Approving an action creates an ApprovalIntent record but does NOT execute anything.
 */

interface ApprovalReviewPanelProps {
    stagedAction: StagedAction;
    onSubmit: (scope: ApprovalScope, justification: string, conditions?: string) => void;
    onCancel: () => void;
}

export function ApprovalReviewPanel({ stagedAction, onSubmit, onCancel }: ApprovalReviewPanelProps) {
    const [scope, setScope] = useState<ApprovalScope>('INSTANCE_ONLY');
    const [justification, setJustification] = useState('');
    const [conditions, setConditions] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = () => {
        // Validate justification
        if (!justification.trim()) {
            setError('Justification is required');
            return;
        }

        // Clear error and submit
        setError(null);
        onSubmit(scope, justification, conditions || undefined);
    };

    const verdict = stagedAction.runtimeVerdict;
    const readiness = stagedAction.executionReadiness;

    return (
        <div style={styles.overlay} onClick={onCancel}>
            <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div style={styles.header}>APPROVAL REVIEW</div>

                {/* Explanation */}
                <div style={styles.explanation}>
                    You are reviewing a proposed action. Approving does not execute anything.
                </div>

                {/* Action */}
                <Section title="ACTION">
                    <div style={styles.actionDescription}>
                        {stagedAction.agentName} • {stagedAction.actionName}
                    </div>
                </Section>

                {/* Context */}
                <Section title="CONTEXT">
                    <InfoRow label="Agent" value={stagedAction.agentName} />
                    <InfoRow label="Staged at" value={new Date(stagedAction.stagedAt).toLocaleString()} />
                </Section>

                {/* Runtime Verdict Snapshot */}
                <Section title="RUNTIME VERDICT">
                    <InfoRow label="Decision" value={verdict.decision.status} />
                    <InfoRow
                        label="Confidence"
                        value={verdict.decision.confidence === 'HIGH' ? 'Clear outcome' : 'Requires escalation'}
                    />
                    <InfoRow label="Reason" value={verdict.reasoning.summary} />
                </Section>

                {/* Execution Readiness Snapshot */}
                <Section title="EXECUTION READINESS">
                    <InfoRow label="State" value={readiness.state.replace(/_/g, ' ')} />
                    <div style={styles.readinessSummary}>{readiness.summary}</div>
                </Section>

                {/* Approval Intent Form */}
                <Section title="APPROVAL INTENT">
                    {/* Scope Selector */}
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Approval Scope</label>
                        <div style={styles.radioGroup}>
                            <label style={styles.radioLabel}>
                                <input
                                    type="radio"
                                    name="scope"
                                    checked={scope === 'INSTANCE_ONLY'}
                                    onChange={() => setScope('INSTANCE_ONLY')}
                                    style={styles.radio}
                                />
                                <span style={styles.radioText}>Approve this instance only</span>
                            </label>
                            <label style={styles.radioLabel}>
                                <input
                                    type="radio"
                                    name="scope"
                                    checked={scope === 'POLICY_CHANGE'}
                                    onChange={() => setScope('POLICY_CHANGE')}
                                    style={styles.radio}
                                />
                                <span style={styles.radioText}>Approve as a policy change</span>
                            </label>
                        </div>
                    </div>

                    {/* Justification (required) */}
                    <div style={styles.formGroup}>
                        <label style={styles.label}>
                            Justification <span style={styles.required}>*</span>
                        </label>
                        <textarea
                            value={justification}
                            onChange={(e) => setJustification(e.target.value)}
                            rows={4}
                            placeholder="Explain why you are approving this action..."
                            style={styles.textarea}
                        />
                    </div>

                    {/* Conditions (optional) */}
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Conditions (optional)</label>
                        <textarea
                            value={conditions}
                            onChange={(e) => setConditions(e.target.value)}
                            rows={2}
                            placeholder="Any conditions or constraints for this approval..."
                            style={styles.textarea}
                        />
                    </div>

                    {/* Error Message */}
                    {error && <div style={styles.error}>{error}</div>}
                </Section>

                {/* Actions */}
                <div style={styles.actions}>
                    <button onClick={handleSubmit} style={styles.submitButton}>
                        Submit Approval
                    </button>
                    <button onClick={onCancel} style={styles.cancelButton}>
                        Cancel
                    </button>
                </div>
            </div>
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

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div style={styles.infoRow}>
            <div style={styles.infoLabel}>{label}</div>
            <div style={styles.infoValue}>{value}</div>
        </div>
    );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = {
    overlay: {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    panel: {
        width: '600px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflowY: 'auto' as const,
        background: '#0a0a0a',
        border: '1px solid #2a2a2a',
        borderRadius: 8,
        padding: 24,
    },
    header: {
        fontSize: '14px',
        textTransform: 'uppercase' as const,
        color: '#C8A96A', // Muted amber
        letterSpacing: '1px',
        marginBottom: 16,
        fontWeight: 600,
    },
    explanation: {
        fontSize: '13px',
        color: '#a1a1aa',
        lineHeight: '1.6',
        marginBottom: 24,
        padding: 12,
        background: '#1a1a1a',
        border: '1px solid #2a2a2a',
        borderRadius: 4,
    },
    section: {
        marginBottom: 24,
        paddingBottom: 24,
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
    actionDescription: {
        fontSize: '15px',
        color: '#fff',
        fontWeight: 500,
    },
    infoRow: {
        display: 'flex',
        marginBottom: 8,
        fontSize: '13px',
    },
    infoLabel: {
        width: '140px',
        color: '#888',
        flexShrink: 0,
    },
    infoValue: {
        color: '#ddd',
        flex: 1,
    },
    readinessSummary: {
        marginTop: 12,
        fontSize: '13px',
        color: '#a1a1aa',
        lineHeight: '1.6',
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        display: 'block',
        fontSize: '12px',
        color: '#aaa',
        marginBottom: 8,
        fontWeight: 500,
    },
    required: {
        color: '#C8A96A',
    },
    radioGroup: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 12,
    },
    radioLabel: {
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
    },
    radio: {
        marginRight: 8,
        cursor: 'pointer',
    },
    radioText: {
        fontSize: '13px',
        color: '#ddd',
    },
    textarea: {
        width: '100%',
        padding: 12,
        background: '#1a1a1a',
        border: '1px solid #2a2a2a',
        borderRadius: 4,
        color: '#ddd',
        fontSize: '13px',
        fontFamily: 'inherit',
        resize: 'vertical' as const,
    },
    error: {
        marginTop: 12,
        padding: 12,
        background: '#3a1a1a',
        border: '1px solid #d97070',
        borderRadius: 4,
        color: '#d97070',
        fontSize: '12px',
    },
    actions: {
        display: 'flex',
        gap: 12,
        marginTop: 24,
    },
    submitButton: {
        flex: 1,
        padding: '12px 20px',
        background: '#2a2a2a',
        color: '#C8A96A', // Muted amber
        border: '1px solid #3a3a3a',
        borderRadius: 4,
        fontSize: '13px',
        fontWeight: 500,
        cursor: 'pointer',
    },
    cancelButton: {
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
};
