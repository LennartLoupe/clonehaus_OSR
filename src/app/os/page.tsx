'use client';

import React from 'react';
import Link from 'next/link';
import { useStructure } from '@/state/StructureContext';
import { Lock, Unlock, Shield, AlertTriangle, Scale, Activity, Brain } from 'lucide-react';
import { Organization } from '@/app/data/types';

export default function OrganizationOSPage() {
    const { data, updateOrganization } = useStructure();
    const org = data.organization;
    const isLocked = org.status === 'LOCKED';

    return (
        <div style={styles.container}>
            {/* FIXED LEFT SIDEBAR */}
            <div style={styles.sidebar}>
                <div style={styles.sidebarTitle}>Structure</div>

                <div style={styles.navItemActive}>
                    <div style={styles.navIcon}><Shield size={14} /></div>
                    <span>Organization OS</span>
                </div>

                <Link href="/" style={styles.navItemDisabled}>
                    <div style={styles.navIcon}><Activity size={14} /></div>
                    <span>Domains</span>
                </Link>

                <div style={styles.navItemDisabled}>
                    <div style={styles.navIcon}><Brain size={14} /></div>
                    <span>Agents</span>
                </div>

                <Link href="/" style={styles.navItem}>
                    <div style={styles.navIcon}><Scale size={14} /></div>
                    <span>Policies (Read-Only)</span>
                </Link>
            </div>

            {/* CENTER CONTENT */}
            <div style={styles.mainContent}>

                {/* SECTION 1: IDENTITY */}
                <div style={styles.header}>
                    <div style={styles.headerTop}>
                        <h1 style={styles.pageTitle}>Organization Operating System</h1>
                        <div style={isLocked ? styles.statusBadgeLocked : styles.statusBadgeDraft}>
                            {isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                            {org.status}
                        </div>
                    </div>
                    <div style={styles.subheading}>
                        Company-wide governance, authority, and ethical boundaries.
                    </div>
                </div>

                <div style={styles.section}>
                    <div style={styles.sectionHeader}>
                        <div style={styles.sectionTitle}>1. Organization Identity</div>
                        <div style={styles.sectionDesc}>Establishes scope and authority of this layer.</div>
                    </div>

                    <div style={styles.card}>
                        <div style={styles.fieldRow}>
                            <label style={styles.label}>Organization Name</label>
                            <div style={styles.readOnlyValue}>{org.name}</div>
                        </div>
                        <div style={styles.helperText}>
                            This defines the maximum authority and ethical boundaries for all AI agents in the organization.
                        </div>
                    </div>
                </div>

                {/* SECTION 2: AUTHORITY CEILING */}
                <div style={styles.section}>
                    <div style={styles.sectionHeader}>
                        <div style={styles.sectionTitle}>2. Authority Ceiling</div>
                        <div style={styles.sectionDesc}>Define the maximum authority any AI can ever reach.</div>
                    </div>

                    <div style={styles.card}>
                        <div style={styles.sliderContainer}>
                            <div style={styles.sliderHeader}>
                                <label style={styles.label}>Maximum Authority Level</label>
                                <span style={styles.sliderValue}>{org.authorityCeiling}</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="5"
                                value={org.authorityCeiling}
                                disabled={isLocked}
                                onChange={(e) => updateOrganization({ authorityCeiling: parseInt(e.target.value) })}
                                style={styles.slider}
                            />
                            <div style={styles.sliderLabels}>
                                <span>1 (Advisory)</span>
                                <span>3 (Autonomous)</span>
                                <span>5 (Sovereign)</span>
                            </div>
                        </div>
                        <div style={styles.helperText}>
                            No domain or agent can exceed this level, regardless of approvals.
                        </div>
                    </div>
                </div>

                {/* SECTION 3: GLOBAL ACTION BOUNDARIES */}
                <div style={styles.section}>
                    <div style={styles.sectionHeader}>
                        <div style={styles.sectionTitle}>3. Global Action Boundaries</div>
                        <div style={styles.sectionDesc}>Define what kinds of actions AI is allowed to perform at all.</div>
                    </div>

                    <div style={styles.card}>
                        <ActionToggle
                            label="Read"
                            desc="Access and read information."
                            active={org.globalActions.includes('READ')}
                            disabled={isLocked || true} // Always allowed?
                            onToggle={() => toggleAction('READ', org, updateOrganization)}
                        />
                        <ActionToggle
                            label="Write"
                            desc="Create or modify information."
                            active={org.globalActions.includes('WRITE')}
                            disabled={isLocked}
                            onToggle={() => toggleAction('WRITE', org, updateOrganization)}
                        />
                        <ActionToggle
                            label="Execute"
                            desc="Perform actions that affect the real world."
                            active={org.globalActions.includes('EXECUTE')}
                            disabled={isLocked}
                            onToggle={() => toggleAction('EXECUTE', org, updateOrganization)}
                        />
                        <ActionToggle
                            label="Escalate"
                            desc="Request human intervention."
                            active={org.globalActions.includes('ESCALATE')}
                            disabled={isLocked}
                            onToggle={() => toggleAction('ESCALATE', org, updateOrganization)}
                        />
                        <div style={styles.helperText}>
                            Disallowed actions can never be enabled at lower levels.
                        </div>
                    </div>
                </div>

                {/* SECTION 4: ESCALATION BASELINE */}
                <div style={styles.section}>
                    <div style={styles.sectionHeader}>
                        <div style={styles.sectionTitle}>4. Escalation Baseline</div>
                        <div style={styles.sectionDesc}>Define default human-in-the-loop posture.</div>
                    </div>

                    <div style={styles.card}>
                        <RadioOption
                            label="Automatic where safe"
                            selected={org.escalationBaseline === 'ALWAYS_AUTO'}
                            disabled={isLocked}
                            onSelect={() => updateOrganization({ escalationBaseline: 'ALWAYS_AUTO' })}
                        />
                        <RadioOption
                            label="Human required for sensitive actions"
                            selected={org.escalationBaseline === 'HUMAN_SENSITIVE'}
                            disabled={isLocked}
                            onSelect={() => updateOrganization({ escalationBaseline: 'HUMAN_SENSITIVE' })}
                        />
                        <RadioOption
                            label="Human required by default"
                            selected={org.escalationBaseline === 'ALWAYS_HUMAN'}
                            disabled={isLocked}
                            onSelect={() => updateOrganization({ escalationBaseline: 'ALWAYS_HUMAN' })}
                        />
                        <div style={styles.helperText}>
                            Domains and agents may escalate more often, but never less.
                        </div>
                    </div>
                </div>

                {/* SECTION 5: ETHICAL COMMITMENTS */}
                <div style={styles.section}>
                    <div style={styles.sectionHeader}>
                        <div style={styles.sectionTitle}>5. Ethical Commitments (EAPP)</div>
                        <div style={styles.sectionDesc}>Non-negotiable ethical boundaries.</div>
                    </div>

                    <div style={styles.card}>
                        <ul style={styles.ethicsList}>
                            {[
                                "Do no harm to humans or the organization.",
                                "Do not deceive users about AI nature.",
                                "Do not access PII without explicit consent.",
                                "Maintain audit trails for all decisions."
                            ].map((item, i) => (
                                <li key={i} style={styles.ethicsItem}>
                                    <Lock size={14} style={{ marginRight: 8, opacity: 0.7 }} />
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <div style={styles.helperText}>
                            These commitments apply to all AI agents and cannot be overridden by policy or approval.
                        </div>
                    </div>
                </div>

                {/* SECTION 6: INHERITANCE PREVIEW */}
                <div style={styles.section}>
                    <div style={styles.previewPanel}>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>Inheritance Preview</div>
                        <div style={{ opacity: 0.7 }}>
                            All domains and agents will inherit the Authority Ceiling ({org.authorityCeiling}),
                            Action Boundaries ({org.globalActions.length} active),
                            Escalation Baseline ({org.escalationBaseline.replace('_', ' ')}),
                            and Ethical Commitments defined here.
                        </div>
                    </div>
                </div>

                {/* SECTION 7: GOVERNANCE ACTIONS */}
                <div style={styles.section} className="pb-20">
                    <div style={styles.card}>
                        {!isLocked ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ fontWeight: 600 }}>Lock Organization OS</div>
                                    <div style={{ fontSize: 12, opacity: 0.7 }}>Locking makes these rules enforceable. Changes afterward require a formal amendment.</div>
                                </div>
                                <button
                                    onClick={() => updateOrganization({ status: 'LOCKED' })}
                                    style={styles.lockButton}
                                >
                                    <Lock size={14} /> Lock OS
                                </button>
                            </div>
                        ) : (
                            <div style={styles.lockedMessage}>
                                <Lock size={16} />
                                <span>This Organization OS is locked. Amendments require review.</span>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

// TOGGLE HELPER
function toggleAction(action: string, org: Organization, update: any) {
    if (org.globalActions.includes(action)) {
        update({ globalActions: org.globalActions.filter(a => a !== action) });
    } else {
        update({ globalActions: [...org.globalActions, action] });
    }
}


// SUB-COMPONENTS
function ActionToggle({ label, desc, active, disabled, onToggle }: any) {
    return (
        <div style={{ ...styles.toggleRow, opacity: disabled ? 0.5 : 1 }}>
            <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{label}</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>{desc}</div>
            </div>
            <button
                onClick={!disabled ? onToggle : undefined}
                style={{
                    width: 40, height: 22,
                    borderRadius: 11,
                    background: active ? '#6FAF8E' : '#333',
                    position: 'relative',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s'
                }}
            >
                <div style={{
                    position: 'absolute', top: 2, left: active ? 20 : 2,
                    width: 18, height: 18, borderRadius: 9, background: 'white',
                    transition: 'left 0.2s'
                }} />
            </button>
        </div>
    );
}

function RadioOption({ label, selected, disabled, onSelect }: any) {
    return (
        <div
            onClick={!disabled ? onSelect : undefined}
            style={{
                ...styles.radioRow,
                opacity: disabled ? 0.6 : 1,
                cursor: disabled ? 'not-allowed' : 'pointer'
            }}
        >
            <div style={{
                width: 16, height: 16, borderRadius: 8, border: selected ? '4px solid #6FAF8E' : '1px solid #666',
                marginRight: 12
            }} />
            <span style={{ fontSize: 14 }}>{label}</span>
        </div>
    );
}

// STYLES
const styles = {
    container: {
        display: 'flex',
        minHeight: '100vh',
        background: '#050505',
        color: '#eee',
        fontFamily: 'Inter, sans-serif'
    },
    sidebar: {
        width: 250,
        borderRight: '1px solid #222',
        padding: 24,
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 8,
        position: 'fixed' as const,
        height: '100vh'
    },
    sidebarTitle: {
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase' as const,
        color: '#666',
        marginBottom: 12,
        letterSpacing: 1
    },
    navItemActive: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 12px',
        background: '#1a1a1a',
        borderRadius: 8,
        color: '#fff',
        fontWeight: 500,
        fontSize: 14
    },
    navItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 12px',
        color: '#888',
        fontSize: 14,
        textDecoration: 'none',
        borderRadius: 8,
        transition: 'background 0.2s'
    },
    navItemDisabled: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 12px',
        color: '#444',
        fontSize: 14,
        textDecoration: 'none',
        cursor: 'not-allowed'
    },
    navIcon: {
        opacity: 0.7
    },
    mainContent: {
        marginLeft: 250,
        flex: 1,
        maxWidth: 800,
        padding: '60px 80px'
    },
    header: {
        marginBottom: 40
    },
    headerTop: {
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        marginBottom: 8
    },
    pageTitle: {
        fontSize: 24,
        fontWeight: 600,
        color: '#fff'
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
        fontSize: 16
    },
    section: {
        marginBottom: 48
    },
    sectionHeader: {
        marginBottom: 16
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 600,
        color: '#fff',
        marginBottom: 4
    },
    sectionDesc: {
        fontSize: 14,
        color: '#666'
    },
    card: {
        background: '#111',
        border: '1px solid #222',
        borderRadius: 8,
        padding: 24
    },
    fieldRow: {
        marginBottom: 12
    },
    label: {
        display: 'block',
        fontSize: 12,
        fontWeight: 500,
        color: '#888',
        marginBottom: 8,
        textTransform: 'uppercase' as const
    },
    readOnlyValue: {
        fontSize: 16,
        color: '#fff',
        fontWeight: 500
    },
    helperText: {
        marginTop: 16,
        fontSize: 13,
        color: '#666',
        fontStyle: 'italic'
    },
    sliderContainer: {
        marginBottom: 16
    },
    sliderHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 12
    },
    sliderValue: {
        fontSize: 16,
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
        color: '#666'
    },
    toggleRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 0',
        borderBottom: '1px solid #222'
    },
    radioRow: {
        display: 'flex',
        alignItems: 'center',
        padding: '12px 0',
        borderBottom: '1px solid #222'
    },
    ethicsList: {
        listStyle: 'none',
        padding: 0,
        margin: 0
    },
    ethicsItem: {
        display: 'flex',
        alignItems: 'center',
        padding: '10px 0',
        color: '#ccc',
        fontSize: 14,
        borderBottom: '1px solid #222'
    },
    previewPanel: {
        background: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: 8,
        padding: 20,
        fontSize: 14,
        color: '#eee'
    },
    lockButton: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: '#eee',
        color: '#000',
        border: 'none',
        padding: '8px 16px',
        borderRadius: 6,
        fontWeight: 600,
        fontSize: 13,
        cursor: 'pointer'
    },
    lockedMessage: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        color: '#666',
        fontSize: 14,
        background: '#151515',
        padding: 12,
        borderRadius: 6,
        border: '1px solid #222'
    }
};
