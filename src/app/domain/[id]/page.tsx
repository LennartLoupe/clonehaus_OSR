'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useStructure } from '@/state/StructureContext';
import { Lock, Unlock, Shield, AlertTriangle, Scale, Activity, Brain, Check, ChevronLeft, Plus, X } from 'lucide-react';
import { Domain, Organization } from '@/app/data/types';
import { formatAuthorityBadge } from '@/logic/authority/compactFormatting';
import { deriveDomainAuthority } from '@/logic/authority/deriveAuthority';

export default function DomainStudioPage() {
    const params = useParams();
    const router = useRouter();
    const { data, updateDomain } = useStructure();
    const domainId = params.id as string;

    const domain = data.domains.find(d => d.id === domainId);
    const org = data.organization;
    const domainAgents = data.agents.filter(a => a.domainId === domainId);

    if (!domain) return <div style={styles.container}>Domain not found</div>;

    const isLocked = domain.status === 'READY'; // In 8B prompt, 'Lock' is irreversible. Using 'READY' as locked state? Prompt says "Lock Domain". Let's assume Status 'READY' = Locked for now, or just add a 'LOCKED' status if strictly needed. Type says DRAFT | READY. Let's treat READY as Locked.

    // Constraint Logic
    const maxAuthority = org.authorityCeiling;
    const orgAllowedActions = org.globalActions;

    // Derived Authority for Badge
    const derivedAuth = deriveDomainAuthority(org, domain);
    const badge = formatAuthorityBadge(derivedAuth, org.authorityCeiling);

    return (
        <div style={styles.container}>
            {/* 1. HEADER / BREADCRUMB */}
            <div style={styles.topBar}>
                <div style={styles.breadcrumb}>
                    <Link href="/" style={styles.breadcrumbLink}>{org.name}</Link>
                    <span style={styles.breadcrumbSep}>/</span>
                    <span style={styles.breadcrumbActive}>{domain.name}</span>
                </div>
                <div style={styles.studioLabel}>Domain Studio</div>
            </div>

            <div style={styles.content}>

                {/* 2. CONTEXT HEADER */}
                <div style={styles.header}>
                    <div style={styles.headerTop}>
                        <h1 style={styles.pageTitle}>{domain.name}</h1>
                        <div style={isLocked ? styles.statusBadgeLocked : styles.statusBadgeDraft}>
                            {isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                            {domain.status}
                        </div>
                    </div>
                    <div style={styles.subheading}>
                        Parent Organization Ceiling: <strong>Level {org.authorityCeiling}</strong>
                    </div>
                </div>

                <div style={styles.grid}>
                    <div style={styles.mainColumn}>

                        {/* 3. MISSION & SCOPE */}
                        <div style={styles.section}>
                            <div style={styles.sectionHeader}>
                                <div style={styles.sectionTitle}>Mission & Scope</div>
                                <div style={styles.sectionDesc}>Define what this domain is responsible for.</div>
                            </div>
                            <div style={styles.card}>
                                <div style={styles.fieldRow}>
                                    <label style={styles.label}>Mission Statement</label>
                                    <input
                                        style={styles.input}
                                        value={domain.mission}
                                        disabled={isLocked}
                                        onChange={(e) => updateDomain(domainId, { mission: e.target.value })}
                                        placeholder="E.g. Ensure financial accuracy..."
                                    />
                                </div>
                                <div style={styles.fieldRow}>
                                    <label style={styles.label}>Scope Description</label>
                                    <textarea
                                        style={styles.textarea}
                                        value={domain.scope || ''}
                                        disabled={isLocked}
                                        onChange={(e) => updateDomain(domainId, { scope: e.target.value })}
                                        placeholder="Defined boundaries of operation..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 4. AUTHORITY ENVELOPE */}
                        <div style={styles.section}>
                            <div style={styles.sectionHeader}>
                                <div style={styles.sectionTitle}>Authority Envelope</div>
                                <div style={styles.sectionDesc}>Constrained by Organization Ceiling ({maxAuthority}).</div>
                            </div>
                            <div style={styles.card}>
                                <div style={styles.sliderContainer}>
                                    <div style={styles.sliderHeader}>
                                        <label style={styles.label}>Domain Authority Limit</label>
                                        <span style={styles.sliderValue}>{domain.authorityCeiling}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max={maxAuthority} // CONSTRAINED
                                        value={domain.authorityCeiling}
                                        disabled={isLocked}
                                        onChange={(e) => updateDomain(domainId, { authorityCeiling: parseInt(e.target.value) })}
                                        style={styles.slider}
                                    />
                                    <div style={styles.sliderLabels}>
                                        <span>1</span>
                                        <span style={{ color: '#666' }}>Max Allowed: {maxAuthority}</span>
                                    </div>
                                </div>
                                {domain.authorityCeiling >= maxAuthority && (
                                    <div style={styles.constraintNote}>
                                        <AlertTriangle size={14} /> At Organization limit. Cannot increase further.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 5. ALLOWED ACTION CATEGORIES */}
                        <div style={styles.section}>
                            <div style={styles.sectionHeader}>
                                <div style={styles.sectionTitle}>Allowed Action Categories</div>
                                <div style={styles.sectionDesc}>Uncheck to restrict specific capabilities within this domain.</div>
                            </div>
                            <div style={styles.card}>
                                <div style={styles.checklist}>
                                    {orgAllowedActions.map(action => {
                                        const isAllowed = domain.allowedActionCategories?.includes(action);
                                        return (
                                            <label key={action} style={styles.checkRow}>
                                                <input
                                                    type="checkbox"
                                                    checked={isAllowed}
                                                    disabled={isLocked}
                                                    onChange={() => {
                                                        const current = domain.allowedActionCategories || [];
                                                        const fresh = current.includes(action)
                                                            ? current.filter(a => a !== action)
                                                            : [...current, action];
                                                        updateDomain(domainId, { allowedActionCategories: fresh });
                                                    }}
                                                    style={{ marginRight: 10 }}
                                                />
                                                <span style={{ color: isAllowed ? '#fff' : '#666' }}>{action}</span>
                                            </label>
                                        );
                                    })}
                                    {orgAllowedActions.length === 0 && <div style={{ color: '#666', fontStyle: 'italic' }}>No global actions allowed by Organization.</div>}
                                </div>
                                <div style={styles.helperText}>Removed categories will no longer be available to agents in this domain.</div>
                            </div>
                        </div>

                        {/* 6. ESCALATION POSTURE */}
                        <div style={styles.section}>
                            <div style={styles.sectionHeader}>
                                <div style={styles.sectionTitle}>Escalation & Risk Posture</div>
                                <div style={styles.sectionDesc}>Default behavior for uncertainty.</div>
                            </div>
                            <div style={styles.card}>
                                <select
                                    style={styles.select}
                                    value={domain.escalationPosture || 'HUMAN_SENSITIVE'}
                                    disabled={isLocked}
                                    onChange={(e) => updateDomain(domainId, { escalationPosture: e.target.value as any })}
                                >
                                    <option value="ALWAYS_AUTO">Allow autonomous handling within limits</option>
                                    <option value="HUMAN_SENSITIVE">Escalate on uncertainty</option>
                                    <option value="ALWAYS_HUMAN">Always escalate</option>
                                </select>
                            </div>
                        </div>

                        {/* 7. DOMAIN CONSTRAINTS */}
                        <div style={styles.section}>
                            <div style={styles.sectionHeader}>
                                <div style={styles.sectionTitle}>Domain Constraints</div>
                                <div style={styles.sectionDesc}>Specific prohibitions and required checks.</div>
                            </div>
                            <div style={styles.card}>
                                <div style={styles.constraintList}>
                                    {(domain.constraints || []).map((c, i) => (
                                        <div key={i} style={styles.constraintItem}>
                                            <Shield size={14} style={{ marginRight: 8, color: '#ff6b6b' }} />
                                            <span>{c}</span>
                                            {!isLocked && (
                                                <button
                                                    onClick={() => {
                                                        const newC = [...(domain.constraints || [])];
                                                        newC.splice(i, 1);
                                                        updateDomain(domainId, { constraints: newC });
                                                    }}
                                                    style={styles.deleteBtn}
                                                >
                                                    <X size={12} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {!isLocked && (
                                    <div style={styles.addConstraintRow}>
                                        <input
                                            id="new-constraint"
                                            style={styles.miniInput}
                                            placeholder="E.g. Refunds > €500 require approval"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    const val = (e.currentTarget as HTMLInputElement).value;
                                                    if (val) {
                                                        updateDomain(domainId, { constraints: [...(domain.constraints || []), val] });
                                                        (e.currentTarget as HTMLInputElement).value = '';
                                                    }
                                                }
                                            }}
                                        />
                                        <button
                                            onClick={() => {
                                                const el = document.getElementById('new-constraint') as HTMLInputElement;
                                                if (el.value) {
                                                    updateDomain(domainId, { constraints: [...(domain.constraints || []), el.value] });
                                                    el.value = '';
                                                }
                                            }}
                                            style={styles.miniAddBtn}
                                        >
                                            Add
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* RIGHT COLUMN: PREVIEW & ACTIONS */}
                    <div style={styles.sideColumn}>

                        {/* AGENT PREVIEW */}
                        <div style={styles.section}>
                            <div style={styles.sectionHeader}>
                                <div style={styles.sectionTitle}>Agent Preview</div>
                            </div>
                            <div style={styles.previewCard}>
                                {domainAgents.map(agent => (
                                    <div key={agent.id} style={styles.agentRow}>
                                        <div style={styles.agentName}>{agent.name}</div>
                                        <div style={styles.agentDetail}>Inherits Domain Limits</div>
                                    </div>
                                ))}
                                {domainAgents.length === 0 && <div style={{ opacity: 0.5, fontSize: 13 }}>No agents in domain.</div>}
                            </div>
                        </div>

                        {/* ACTIONS */}
                        <div style={styles.actionCard}>
                            {!isLocked ? (
                                <>
                                    <button
                                        style={styles.saveBtn}
                                        onClick={() => router.push('/')}
                                    >
                                        Save & Return
                                    </button>
                                    <button
                                        style={styles.lockBtn}
                                        onClick={() => {
                                            if (confirm('Locking this domain will freeze its governance rules. Continue?')) {
                                                updateDomain(domainId, { status: 'READY' });
                                            }
                                        }}
                                    >
                                        <Lock size={14} /> Lock Domain
                                    </button>
                                </>
                            ) : (
                                <div style={styles.lockedMsg}>
                                    <Lock size={14} /> Domain Locked
                                </div>
                            )}
                            <Link href="/" style={styles.backLink}>Cancel</Link>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

const styles = {
    container: {
        minHeight: '100vh',
        background: '#0a0a0a',
        color: '#eee',
        fontFamily: 'Inter, sans-serif'
    },
    topBar: {
        background: '#000',
        borderBottom: '1px solid #222',
        padding: '0 40px',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    breadcrumb: {
        display: 'flex',
        alignItems: 'center',
        fontSize: 14,
        color: '#888'
    },
    breadcrumbLink: {
        color: '#888',
        textDecoration: 'none',
        fontWeight: 500
    },
    breadcrumbSep: {
        margin: '0 8px',
        color: '#444'
    },
    breadcrumbActive: {
        color: '#fff',
        fontWeight: 600
    },
    studioLabel: {
        fontSize: 12,
        fontWeight: 700,
        textTransform: 'uppercase' as const,
        letterSpacing: 1,
        color: '#6FAF8E',
        background: 'rgba(111, 175, 142, 0.1)',
        padding: '4px 8px',
        borderRadius: 4
    },
    content: {
        maxWidth: 1000,
        margin: '0 auto',
        padding: '40px 20px'
    },
    header: {
        marginBottom: 40,
        borderBottom: '1px solid #222',
        paddingBottom: 20
    },
    headerTop: {
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        marginBottom: 8
    },
    pageTitle: {
        fontSize: 28,
        fontWeight: 700,
        color: '#fff',
        margin: 0
    },
    statusBadgeDraft: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 11,
        fontWeight: 600,
        background: '#333',
        color: '#aaa',
        padding: '4px 8px',
        borderRadius: 4,
        textTransform: 'uppercase' as const
    },
    statusBadgeLocked: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 11,
        fontWeight: 600,
        background: '#1a3a2a',
        color: '#6FAF8E',
        padding: '4px 8px',
        borderRadius: 4,
        textTransform: 'uppercase' as const
    },
    subheading: {
        color: '#888',
        fontSize: 14
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: '1fr 300px',
        gap: 40
    },
    mainColumn: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 40
    },
    sideColumn: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 40
    },
    section: {},
    sectionHeader: {
        marginBottom: 16
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: 600,
        color: '#fff',
        marginBottom: 4
    },
    sectionDesc: {
        fontSize: 13,
        color: '#666'
    },
    card: {
        background: '#111',
        border: '1px solid #222',
        borderRadius: 8,
        padding: 24
    },
    fieldRow: {
        marginBottom: 16
    },
    label: {
        display: 'block',
        fontSize: 12,
        fontWeight: 500,
        color: '#888',
        marginBottom: 8,
        textTransform: 'uppercase' as const
    },
    input: {
        width: '100%',
        background: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: 6,
        padding: '10px 12px',
        color: '#fff',
        fontSize: 14,
        outline: 'none'
    },
    textarea: {
        width: '100%',
        minHeight: 80,
        background: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: 6,
        padding: '10px 12px',
        color: '#fff',
        fontSize: 14,
        outline: 'none',
        resize: 'vertical' as const
    },
    sliderContainer: {
        marginBottom: 8
    },
    sliderHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 12
    },
    sliderValue: {
        fontSize: 18,
        fontWeight: 600,
        color: '#6FAF8E'
    },
    slider: {
        width: '100%',
        accentColor: '#6FAF8E',
        marginBottom: 8
    },
    sliderLabels: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 12,
        color: '#888'
    },
    constraintNote: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 12,
        color: '#e6bd5c',
        marginTop: 12,
        background: 'rgba(230, 189, 92, 0.1)',
        padding: 8,
        borderRadius: 4
    },
    checklist: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 12
    },
    checkRow: {
        display: 'flex',
        alignItems: 'center',
        fontSize: 14,
        cursor: 'pointer'
    },
    helperText: {
        marginTop: 16,
        fontSize: 13,
        color: '#666',
        fontStyle: 'italic'
    },
    select: {
        width: '100%',
        background: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: 6,
        padding: '10px 12px',
        color: '#fff',
        fontSize: 14,
        outline: 'none',
        appearance: 'none' as const
    },
    constraintList: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 8,
        marginBottom: 12
    },
    constraintItem: {
        display: 'flex',
        alignItems: 'center',
        background: '#1a1a1a',
        padding: '8px 12px',
        borderRadius: 4,
        fontSize: 13,
        color: '#ddd',
        border: '1px solid #2a2a2a'
    },
    deleteBtn: {
        marginLeft: 'auto',
        background: 'transparent',
        border: 'none',
        color: '#666',
        cursor: 'pointer',
        padding: 4,
        display: 'flex'
    },
    addConstraintRow: {
        display: 'flex',
        gap: 8
    },
    miniInput: {
        flex: 1,
        background: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: 6,
        padding: '8px 12px',
        color: '#fff',
        fontSize: 13,
        outline: 'none'
    },
    miniAddBtn: {
        background: '#333',
        border: 'none',
        color: '#fff',
        borderRadius: 6,
        padding: '0 12px',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer'
    },
    previewCard: {
        background: '#111',
        border: '1px solid #222',
        borderRadius: 8,
        padding: 16
    },
    agentRow: {
        padding: '8px 0',
        borderBottom: '1px solid #222',
        fontSize: 13
    },
    agentName: {
        fontWeight: 500,
        color: '#eee'
    },
    agentDetail: {
        fontSize: 11,
        color: '#666',
        marginTop: 2
    },
    actionCard: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 12
    },
    saveBtn: {
        background: '#fff',
        color: '#000',
        border: 'none',
        padding: '12px',
        borderRadius: 6,
        fontWeight: 600,
        fontSize: 14,
        cursor: 'pointer',
        textAlign: 'center' as const
    },
    lockBtn: {
        background: '#1a1a1a',
        color: '#888',
        border: '1px solid #333',
        padding: '12px',
        borderRadius: 6,
        fontWeight: 600,
        fontSize: 14,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8
    },
    backLink: {
        textAlign: 'center' as const,
        fontSize: 13,
        color: '#666',
        textDecoration: 'none',
        marginTop: 8
    },
    lockedMsg: {
        background: '#151515',
        color: '#666',
        border: '1px solid #222',
        padding: '12px',
        borderRadius: 6,
        textAlign: 'center' as const,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        fontSize: 14
    }
};
