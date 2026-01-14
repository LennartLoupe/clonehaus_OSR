'use client';

import { PersonaIdentity } from '@/logic/persona/personaIdentity';
import { useState } from 'react';

/**
 * Persona Comparison Modal (Phase 7C)
 * 
 * Read-only comparison of persona identities across up to 3 agents.
 * 
 * CRITICAL: READ-ONLY
 * - No editing
 * - No copying identity between agents
 * - Accepts identity as input only
 * - Visual encoding shows difference, not judgment
 */

interface PersonaComparisonModalProps {
    identities: ReadonlyArray<Readonly<PersonaIdentity>>;
    onClose: () => void;
}

export function PersonaComparisonModal({ identities, onClose }: PersonaComparisonModalProps) {
    if (identities.length === 0) {
        return null;
    }

    // Check if there are ethical differences
    const hasEthicalDifferences = checkEthicalDifferences(identities);

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div style={styles.header}>
                    <div style={styles.headerTitle}>PERSONA COMPARISON</div>
                    <button style={styles.closeButton} onClick={onClose}>✕</button>
                </div>

                {/* Ethical Difference Banner */}
                {hasEthicalDifferences && (
                    <div style={styles.banner}>
                        ℹ️ These agents operate under different ethical commitments.
                        Authority and approval cannot bridge this difference.
                    </div>
                )}

                {/* Comparison Grid */}
                <div style={styles.grid}>
                    {/* Agent Headers */}
                    <div style={styles.headerRow}>
                        {identities.map((identity, i) => (
                            <div key={i} style={styles.agentHeader}>
                                <div style={styles.agentName}>{identity.roleIdentity.roleName}</div>
                                <div style={styles.agentId}>{identity.personaId}</div>
                            </div>
                        ))}
                    </div>

                    {/* Role Identity Row */}
                    <ComparisonRow
                        label="Role Identity"
                        values={identities.map(id => ({
                            primary: id.roleIdentity.roleName,
                            secondary: id.roleIdentity.purposeStatement,
                        }))}
                    />

                    {/* Domain Row */}
                    <ComparisonRow
                        label="Domain Belonging"
                        values={identities.map(id => ({
                            primary: id.domainBelonging.domainName,
                        }))}
                    />

                    {/* Capability Posture Row */}
                    <ComparisonRow
                        label="Capability Posture"
                        values={identities.map(id => ({
                            primary: id.capabilityPosture,
                        }))}
                    />

                    {/* Communication Style Row */}
                    <ComparisonRow
                        label="Communication Style"
                        values={identities.map(id => ({
                            primary: id.communicationStyle,
                        }))}
                    />

                    {/* Ethical Commitments Row */}
                    <EthicalCommitmentsRow identities={identities} />
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

interface ComparisonRowProps {
    label: string;
    values: Array<{ primary: string; secondary?: string }>;
}

function ComparisonRow({ label, values }: ComparisonRowProps) {
    // Check if all values match
    const allMatch = values.every(v => v.primary === values[0].primary);

    return (
        <div style={styles.row}>
            <div style={styles.rowLabel}>{label}</div>
            <div style={styles.rowValues}>
                {values.map((value, i) => (
                    <div
                        key={i}
                        style={{
                            ...styles.cell,
                            ...(allMatch ? styles.cellMatching : styles.cellDivergent),
                        }}
                    >
                        <div style={styles.cellPrimary}>{value.primary}</div>
                        {value.secondary && (
                            <div style={styles.cellSecondary}>{value.secondary}</div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function EthicalCommitmentsRow({ identities }: { identities: ReadonlyArray<Readonly<PersonaIdentity>> }) {
    // Check if ethical frames differ
    const hasEthicalDiff = checkEthicalDifferences(identities);

    return (
        <div style={styles.row}>
            <div style={styles.rowLabel}>Ethical Commitments</div>
            <div style={styles.rowValues}>
                {identities.map((identity, i) => {
                    const { immutableCommitments, constraints, eappPrinciples } = identity.ethicalFrame;
                    const hasCommitments = immutableCommitments.length > 0 || constraints.length > 0 || eappPrinciples.length > 0;

                    return (
                        <div
                            key={i}
                            style={{
                                ...styles.cell,
                                ...styles.ethicalCell,
                                ...(hasEthicalDiff ? styles.cellEthicalDivergent : {}),
                            }}
                        >
                            {hasCommitments ? (
                                <>
                                    {immutableCommitments.length > 0 && (
                                        <div style={styles.ethicalSection}>
                                            <div style={styles.ethicalLabel}>
                                                🔒 Immutable ({immutableCommitments.length})
                                            </div>
                                            {immutableCommitments.slice(0, 2).map((c, idx) => (
                                                <div key={idx} style={styles.ethicalItem}>• {c}</div>
                                            ))}
                                            {immutableCommitments.length > 2 && (
                                                <div style={styles.ethicalMore}>
                                                    +{immutableCommitments.length - 2} more
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {constraints.length > 0 && (
                                        <div style={styles.ethicalSection}>
                                            <div style={styles.ethicalLabel}>Constraints ({constraints.length})</div>
                                        </div>
                                    )}
                                    {eappPrinciples.length > 0 && (
                                        <div style={styles.ethicalSection}>
                                            <div style={styles.ethicalLabel}>EAPP ({eappPrinciples.length})</div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div style={styles.noEthics}>No ethical constraints defined</div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ============================================================================
// HELPERS
// ============================================================================

function checkEthicalDifferences(identities: ReadonlyArray<Readonly<PersonaIdentity>>): boolean {
    if (identities.length < 2) return false;

    const first = identities[0].ethicalFrame;

    for (let i = 1; i < identities.length; i++) {
        const current = identities[i].ethicalFrame;

        // Compare immutable commitments
        if (!arraysEqual(first.immutableCommitments, current.immutableCommitments)) {
            return true;
        }

        // Compare constraints
        if (!arraysEqual(first.constraints, current.constraints)) {
            return true;
        }

        // Compare EAPP principles
        if (!arraysEqual(first.eappPrinciples, current.eappPrinciples)) {
            return true;
        }
    }

    return false;
}

function arraysEqual(a: string[], b: string[]): boolean {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((val, i) => val === sortedB[i]);
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
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        zIndex: 1000,
        padding: 40,
    },
    modal: {
        width: '90%',
        maxWidth: 1200,
        maxHeight: '90vh',
        background: '#0a0a0a',
        border: '1px solid #2a2a2a',
        borderRadius: 8,
        overflow: 'auto',
    },
    header: {
        padding: '20px 24px',
        borderBottom: '1px solid #2a2a2a',
        display: 'flex',
        justifyContent: 'space-between' as const,
        alignItems: 'center' as const,
    },
    headerTitle: {
        fontSize: '14px',
        fontWeight: 600,
        color: '#C8A96A',
        letterSpacing: '1px',
    },
    closeButton: {
        background: 'transparent',
        border: 'none',
        color: '#666',
        fontSize: '20px',
        cursor: 'pointer',
        padding: 8,
    },
    banner: {
        padding: 16,
        background: '#1a1a1a',
        border: '1px solid #C8A96A',
        borderLeft: '3px solid #C8A96A',
        margin: '16px 24px',
        fontSize: '12px',
        color: '#ddd',
        lineHeight: '1.6',
    },
    grid: {
        padding: 24,
    },
    headerRow: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: 16,
        marginBottom: 24,
    },
    agentHeader: {
        padding: 12,
        background: '#0f0f0f',
        border: '1px solid #2a2a2a',
        borderRadius: 4,
    },
    agentName: {
        fontSize: '13px',
        fontWeight: 500,
        color: '#ddd',
        marginBottom: 4,
    },
    agentId: {
        fontSize: '10px',
        color: '#666',
        fontFamily: 'monospace',
    },
    row: {
        marginBottom: 24,
    },
    rowLabel: {
        fontSize: '11px',
        fontWeight: 600,
        color: '#888',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px',
        marginBottom: 12,
    },
    rowValues: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: 16,
    },
    cell: {
        padding: 12,
        background: '#0f0f0f',
        border: '1px solid #2a2a2a',
        borderRadius: 4,
    },
    cellMatching: {
        opacity: 0.7,
    },
    cellDivergent: {
        background: '#1a1a12',
        border: '1px solid #3a3a2a',
    },
    cellPrimary: {
        fontSize: '13px',
        color: '#ddd',
        marginBottom: 4,
    },
    cellSecondary: {
        fontSize: '11px',
        color: '#888',
        lineHeight: '1.4',
    },
    ethicalCell: {
        minHeight: 100,
    },
    cellEthicalDivergent: {
        background: '#1a1a12',
        border: '2px solid #C8A96A',
        borderLeft: '4px solid #C8A96A',
    },
    ethicalSection: {
        marginBottom: 12,
    },
    ethicalLabel: {
        fontSize: '10px',
        color: '#aaa',
        marginBottom: 6,
        fontWeight: 500,
    },
    ethicalItem: {
        fontSize: '11px',
        color: '#ddd',
        marginBottom: 3,
    },
    ethicalMore: {
        fontSize: '10px',
        color: '#666',
        fontStyle: 'italic' as const,
        marginTop: 4,
    },
    noEthics: {
        fontSize: '12px',
        color: '#666',
        fontStyle: 'italic' as const,
    },
};
