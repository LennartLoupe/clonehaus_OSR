'use client';

import { PersonaIdentity, getCapabilityPostureDescription, getCommunicationStyleDescription } from '@/logic/persona/personaIdentity';
import { useState } from 'react';

/**
 * Persona Identity Section (Phase 7C)
 * 
 * Read-only display of agent's immutable persona identity.
 * Shows all 5 LPS layers with clear, archival presentation.
 * 
 * CRITICAL: READ-ONLY
 * - No edit affordances
 * - No mutation functions
 * - Identity accepted as input only
 */

interface PersonaIdentitySectionProps {
    identity: Readonly<PersonaIdentity>;
    onCompareClick?: () => void;
}

export function PersonaIdentitySection({ identity, onCompareClick }: PersonaIdentitySectionProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div style={styles.container}>
            {/* Section Header */}
            <div
                style={styles.header}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div style={styles.headerTitle}>PERSONA IDENTITY</div>
                <div style={styles.headerToggle}>{isExpanded ? '−' : '+'}</div>
            </div>

            {/* Collapsible Content */}
            {isExpanded && (
                <div style={styles.content}>
                    {/* Role Identity */}
                    <div style={styles.section}>
                        <div style={styles.sectionTitle}>Role Identity</div>
                        <div style={styles.field}>
                            <div style={styles.fieldLabel}>Name:</div>
                            <div style={styles.fieldValue}>{identity.roleIdentity.roleName}</div>
                        </div>
                        <div style={styles.field}>
                            <div style={styles.fieldLabel}>Purpose:</div>
                            <div style={styles.fieldValue}>{identity.roleIdentity.purposeStatement}</div>
                        </div>
                    </div>

                    {/* Domain Belonging */}
                    <div style={styles.section}>
                        <div style={styles.sectionTitle}>Domain</div>
                        <div style={styles.fieldValue}>{identity.domainBelonging.domainName}</div>
                    </div>

                    {/* Capability Posture */}
                    <div style={styles.section}>
                        <div style={styles.sectionTitle}>Capability Posture</div>
                        <div style={styles.badge}>{identity.capabilityPosture}</div>
                        <div style={styles.description}>
                            {getCapabilityPostureDescription(identity.capabilityPosture)}
                        </div>
                    </div>

                    {/* Communication Style */}
                    <div style={styles.section}>
                        <div style={styles.sectionTitle}>Communication Style</div>
                        <div style={styles.badge}>{identity.communicationStyle}</div>
                        <div style={styles.description}>
                            {getCommunicationStyleDescription(identity.communicationStyle)}
                        </div>
                    </div>

                    {/* Ethical Frame */}
                    <div style={styles.section}>
                        <div style={styles.sectionTitle}>Ethical Frame (EAPP)</div>

                        {/* Immutable Commitments */}
                        {identity.ethicalFrame.immutableCommitments.length > 0 && (
                            <div style={styles.ethicalSubsection}>
                                <div style={styles.ethicalSubtitle}>Immutable Commitments:</div>
                                {identity.ethicalFrame.immutableCommitments.map((commitment, i) => (
                                    <div key={i} style={styles.listItem}>• {commitment}</div>
                                ))}
                            </div>
                        )}

                        {/* Constraints */}
                        {identity.ethicalFrame.constraints.length > 0 && (
                            <div style={styles.ethicalSubsection}>
                                <div style={styles.ethicalSubtitle}>Operational Constraints:</div>
                                {identity.ethicalFrame.constraints.map((constraint, i) => (
                                    <div key={i} style={styles.listItem}>• {constraint}</div>
                                ))}
                            </div>
                        )}

                        {/* EAPP Principles */}
                        {identity.ethicalFrame.eappPrinciples.length > 0 && (
                            <div style={styles.ethicalSubsection}>
                                <div style={styles.ethicalSubtitle}>EAPP Principles:</div>
                                {identity.ethicalFrame.eappPrinciples.map((principle, i) => (
                                    <div key={i} style={styles.listItem}>• {principle}</div>
                                ))}
                            </div>
                        )}

                        {/* Non-Override Notice */}
                        <div style={styles.notice}>
                            ℹ️ These commitments cannot be overridden.
                        </div>
                    </div>

                    {/* Compare Button */}
                    {onCompareClick && (
                        <button style={styles.compareButton} onClick={onCompareClick}>
                            Compare with other agents
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = {
    container: {
        marginBottom: 20,
        background: '#0f0f0f',
        border: '1px solid #2a2a2a',
        borderRadius: 6,
    },
    header: {
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between' as const,
        alignItems: 'center' as const,
        cursor: 'pointer',
        borderBottom: '1px solid #1a1a1a',
    },
    headerTitle: {
        fontSize: '11px',
        fontWeight: 600,
        color: '#C8A96A',
        letterSpacing: '0.5px',
        textTransform: 'uppercase' as const,
    },
    headerToggle: {
        fontSize: '14px',
        color: '#666',
    },
    content: {
        padding: 16,
    },
    section: {
        marginBottom: 20,
        paddingBottom: 20,
        borderBottom: '1px solid #1a1a1a',
    },
    sectionTitle: {
        fontSize: '11px',
        fontWeight: 600,
        color: '#888',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px',
        marginBottom: 10,
    },
    field: {
        marginBottom: 10,
    },
    fieldLabel: {
        fontSize: '11px',
        color: '#666',
        marginBottom: 4,
    },
    fieldValue: {
        fontSize: '13px',
        color: '#ddd',
        lineHeight: '1.5',
    },
    badge: {
        display: 'inline-block',
        padding: '4px 10px',
        background: '#1a1a1a',
        border: '1px solid #2a2a2a',
        borderRadius: 3,
        fontSize: '10px',
        color: '#C8A96A',
        fontWeight: 500,
        letterSpacing: '0.5px',
        marginBottom: 8,
    },
    description: {
        fontSize: '12px',
        color: '#888',
        lineHeight: '1.5',
        fontStyle: 'italic' as const,
    },
    ethicalSubsection: {
        marginBottom: 14,
    },
    ethicalSubtitle: {
        fontSize: '11px',
        color: '#aaa',
        marginBottom: 6,
        fontWeight: 500,
    },
    listItem: {
        fontSize: '12px',
        color: '#ddd',
        marginBottom: 4,
        paddingLeft: 8,
    },
    notice: {
        fontSize: '11px',
        color: '#888',
        marginTop: 12,
        padding: '8px 12px',
        background: '#1a1a1a',
        borderRadius: 4,
        fontStyle: 'italic' as const,
    },
    compareButton: {
        width: '100%',
        padding: '10px 16px',
        background: '#1a1a1a',
        border: '1px solid #2a2a2a',
        borderRadius: 4,
        color: '#888',
        fontSize: '12px',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.2s',
        marginTop: 8,
    },
};
