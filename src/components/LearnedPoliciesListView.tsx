'use client';

import { LearnedPolicy, LPSLayer } from '@/logic/policy/learnedPolicy';
import { LearnedPolicyView } from './LearnedPolicyView';
import { useState } from 'react';

/**
 * Learned Policies List View (Phase 5A)
 * 
 * Displays all learned policies in chronological order with filtering.
 * 
 * CRITICAL: READ-ONLY ARCHIVE
 * This is a historical record view. No policy activation or application.
 */

interface LearnedPoliciesListViewProps {
    policies: LearnedPolicy[];
}

export function LearnedPoliciesListView({ policies }: LearnedPoliciesListViewProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [filterLayer, setFilterLayer] = useState<LPSLayer | 'ALL'>('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    // Filter policies
    const filteredPolicies = policies.filter(policy => {
        // Layer filter
        if (filterLayer !== 'ALL' && !policy.affectedLayers.includes(filterLayer)) {
            return false;
        }

        // Search filter
        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            const matchesSearch =
                policy.humanJustification.toLowerCase().includes(query) ||
                policy.constraint.description.toLowerCase().includes(query) ||
                policy.systemReasoning.toLowerCase().includes(query);
            if (!matchesSearch) {
                return false;
            }
        }

        return true;
    });

    // Sort by most recent first
    const sortedPolicies = [...filteredPolicies].sort((a, b) => {
        return new Date(b.learnedAt).getTime() - new Date(a.learnedAt).getTime();
    });

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div style={styles.headerTitle}>LEARNED POLICIES</div>
                <div style={styles.headerSubtitle}>
                    Memory archive of human-approved policy constraints
                </div>
            </div>

            {/* Archival Notice */}
            <div style={styles.archivalNotice}>
                📚 This is a read-only archive. Learned policies are memory records and do not affect active system behavior.
            </div>

            {/* Filters */}
            <div style={styles.filters}>
                {/* Search */}
                <input
                    type="text"
                    placeholder="Search justifications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={styles.searchInput}
                />

                {/* Layer Filter */}
                <select
                    value={filterLayer}
                    onChange={(e) => setFilterLayer(e.target.value as LPSLayer | 'ALL')}
                    style={styles.layerSelect}
                >
                    <option value="ALL">All Layers</option>
                    <option value={LPSLayer.POLICY}>Policy Layer</option>
                    <option value={LPSLayer.AUTHORITY}>Authority Layer</option>
                    <option value={LPSLayer.CAPABILITY}>Capability Layer</option>
                </select>
            </div>

            {/* Policies List */}
            {sortedPolicies.length === 0 ? (
                <EmptyState hasFilters={filterLayer !== 'ALL' || searchQuery.trim() !== ''} />
            ) : (
                <div style={styles.policiesList}>
                    {sortedPolicies.map(policy => (
                        <PolicyCard
                            key={policy.policyId}
                            policy={policy}
                            isExpanded={expandedId === policy.policyId}
                            onToggle={() => setExpandedId(
                                expandedId === policy.policyId ? null : policy.policyId
                            )}
                        />
                    ))}
                </div>
            )}

            {/* Count */}
            <div style={styles.footer}>
                Showing {sortedPolicies.length} of {policies.length} learned policies
            </div>
        </div>
    );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function PolicyCard({
    policy,
    isExpanded,
    onToggle
}: {
    policy: LearnedPolicy;
    isExpanded: boolean;
    onToggle: () => void;
}) {
    return (
        <div style={styles.policyCard}>
            {/* Collapsed View */}
            <div style={styles.cardHeader} onClick={onToggle}>
                <div style={styles.cardHeaderLeft}>
                    <div style={styles.cardConstraint}>
                        {policy.constraint.description}
                    </div>
                    <div style={styles.cardMeta}>
                        {formatTimestamp(policy.learnedAt)} · {policy.primaryLayer}
                    </div>
                </div>
                <div style={styles.cardHeaderRight}>
                    <span style={styles.expandIcon}>
                        {isExpanded ? '−' : '+'}
                    </span>
                </div>
            </div>

            {/* Expanded View */}
            {isExpanded && (
                <div style={styles.cardExpanded}>
                    <LearnedPolicyView policy={policy} />
                </div>
            )}
        </div>
    );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
    return (
        <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📭</div>
            <div style={styles.emptyTitle}>
                {hasFilters ? 'No matching policies' : 'No policies have been learned yet'}
            </div>
            <div style={styles.emptyDescription}>
                {hasFilters
                    ? 'Try adjusting your filters or search query.'
                    : 'Policies are learned when you confirm a policy change proposal derived from an approval with POLICY_CHANGE scope.'}
            </div>
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
    });
}

// ============================================================================
// STYLES
// ============================================================================

const styles = {
    container: {
        padding: 24,
    },
    header: {
        marginBottom: 24,
    },
    headerTitle: {
        fontSize: '18px',
        textTransform: 'uppercase' as const,
        color: '#C8A96A',
        letterSpacing: '1px',
        fontWeight: 600,
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: '13px',
        color: '#888',
    },
    archivalNotice: {
        marginBottom: 24,
        padding: 14,
        background: '#1a1a1a',
        border: '1px solid #2a2a2a',
        borderRadius: 6,
        fontSize: '12px',
        color: '#888',
        fontWeight: 500,
    },
    filters: {
        display: 'flex',
        gap: 12,
        marginBottom: 24,
    },
    searchInput: {
        flex: 1,
        padding: '10px 14px',
        background: '#0f0f0f',
        border: '1px solid #2a2a2a',
        borderRadius: 6,
        color: '#ddd',
        fontSize: '13px',
        outline: 'none',
    } as React.CSSProperties,
    layerSelect: {
        padding: '10px 14px',
        background: '#0f0f0f',
        border: '1px solid #2a2a2a',
        borderRadius: 6,
        color: '#ddd',
        fontSize: '13px',
        outline: 'none',
        cursor: 'pointer',
    } as React.CSSProperties,
    policiesList: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 16,
    },
    policyCard: {
        background: '#0a0a0a',
        border: '1px solid #2a2a2a',
        borderRadius: 8,
        overflow: 'hidden',
    },
    cardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        cursor: 'pointer',
        transition: 'background 0.2s',
    } as React.CSSProperties,
    cardHeaderLeft: {
        flex: 1,
    },
    cardConstraint: {
        fontSize: '14px',
        color: '#fff',
        fontWeight: 500,
        marginBottom: 6,
    },
    cardMeta: {
        fontSize: '11px',
        color: '#666',
    },
    cardHeaderRight: {
        marginLeft: 16,
    },
    expandIcon: {
        fontSize: '18px',
        color: '#C8A96A',
        fontWeight: 600,
    },
    cardExpanded: {
        paddingTop: 0,
    },
    emptyState: {
        padding: 48,
        textAlign: 'center' as const,
    },
    emptyIcon: {
        fontSize: '48px',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: '16px',
        color: '#888',
        fontWeight: 500,
        marginBottom: 8,
    },
    emptyDescription: {
        fontSize: '13px',
        color: '#666',
        lineHeight: '1.6',
        maxWidth: 480,
        margin: '0 auto',
    },
    footer: {
        marginTop: 24,
        padding: 12,
        fontSize: '11px',
        color: '#666',
        textAlign: 'center' as const,
    },
};
