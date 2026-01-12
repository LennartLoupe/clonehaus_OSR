import { AuthorityResult } from './deriveAuthority';

/**
 * Compact Authority Formatting Utilities (Phase 2A.1)
 * 
 * Pure formatting functions that transform Phase 2A authority results
 * into compact, glanceable indicators.
 * 
 * NO NEW AUTHORITY LOGIC - formatting only.
 */

// ============================================================================
// AUTHORITY BADGE (Mode 1)
// ============================================================================

export interface AuthorityBadge {
    text: string;           // e.g., "AUTH: 1/3" or "AUTH: MAX"
    hasRestriction: boolean; // Shows if authority is reduced
    tooltip: string;        // Hover text
}

/**
 * Generate compact badge text from authority result.
 * Shows effective authority vs organizational maximum.
 */
export function formatAuthorityBadge(
    authority: AuthorityResult,
    orgCeiling: number
): AuthorityBadge {
    const effective = authority.effectiveAuthorityLevel;

    // Determine if there's a restriction
    const hasRestriction = effective < orgCeiling;

    // Generate badge text
    let text: string;
    if (effective === orgCeiling) {
        text = 'AUTH: MAX';
    } else {
        text = `AUTH: ${effective}/${orgCeiling}`;
        if (hasRestriction) {
            text += ' ↓';
        }
    }

    // Generate tooltip
    const tooltip = generateBadgeTooltip(authority);

    return {
        text,
        hasRestriction,
        tooltip,
    };
}

/**
 * Generate tooltip text for authority badge.
 * Compact version of full explanation.
 */
function generateBadgeTooltip(authority: AuthorityResult): string {
    const lines: string[] = [];

    lines.push(`Authority: ${authority.effectiveAuthorityLevel}`);

    // Find restrictions (RESTRICT impact)
    const restrictions = authority.reasoning.filter((r) => r.impact === 'RESTRICT');

    if (restrictions.length > 0) {
        lines.push('Restricted by:');
        restrictions.forEach((r) => {
            // Extract key constraint from detail
            const constraint = extractKeyConstraint(r.detail);
            lines.push(`• ${constraint}`);
        });
    } else {
        lines.push('Full authority granted');
    }

    return lines.join('\n');
}

/**
 * Extract the key constraint from a reasoning detail string.
 * Simplifies verbose explanations for compact display.
 */
function extractKeyConstraint(detail: string): string {
    // Extract domain ceiling constraints
    if (detail.includes('Domain caps')) {
        const match = detail.match(/authority level (\d+)/);
        if (match) {
            return `Domain ceiling (${match[1]})`;
        }
        return 'Domain ceiling';
    }

    if (detail.includes('Domain restricts')) {
        const match = detail.match(/level (\d+)/);
        if (match) {
            return `Domain ceiling (${match[1]})`;
        }
        return 'Domain restriction';
    }

    // Extract agent autonomy constraints
    if (detail.includes('Agent autonomy level')) {
        const match = detail.match(/autonomy level (\d+)/);
        if (match) {
            return `Agent autonomy (${match[1]})`;
        }
        return 'Agent autonomy';
    }

    // Extract execution surface constraints
    if (detail.includes('READ-only')) {
        return 'Execution surface: READ';
    }
    if (detail.includes('WRITE') && detail.includes('cannot EXECUTE')) {
        return 'Execution surface: WRITE';
    }

    // Extract execution type constraints
    if (detail.includes('ADVISORY')) {
        return 'Type: ADVISORY';
    }
    if (detail.includes('DECISION') && detail.includes('cannot execute')) {
        return 'Type: DECISION';
    }

    // Default: return simplified detail
    return detail;
}

// ============================================================================
// ONE-LINE REASON CHIP (Mode 2)
// ============================================================================

/**
 * Generate one-line reason text for compact chip display.
 * Shows the primary constraint affecting authority.
 */
export function formatReasonChip(authority: AuthorityResult): string {
    const restrictions = authority.reasoning.filter((r) => r.impact === 'RESTRICT');

    if (restrictions.length === 0) {
        return 'Full authority';
    }

    // Take the first (most significant) restriction
    const primary = restrictions[0];

    // Generate concise reason
    if (primary.detail.includes('Domain caps') || primary.detail.includes('Domain restricts')) {
        return 'Limited by domain policy';
    }

    if (primary.detail.includes('Agent autonomy')) {
        return 'Limited by agent autonomy';
    }

    if (primary.detail.includes('READ-only')) {
        return 'Restricted: READ-only';
    }

    if (primary.detail.includes('cannot EXECUTE')) {
        return 'Restricted: No EXECUTE';
    }

    if (primary.detail.includes('ADVISORY')) {
        return 'Advisory mode only';
    }

    if (primary.detail.includes('DECISION')) {
        return 'Decision only, no execution';
    }

    // Default
    return 'Authority restricted';
}

// ============================================================================
// AUTHORITY DELTA INDICATOR (Mode 3)
// ============================================================================

export interface AuthorityDelta {
    delta: number;          // e.g., -2 (reduced by 2)
    tooltip: string;        // Explanation of reduction
}

/**
 * Calculate authority delta (reduction from org ceiling).
 */
export function formatAuthorityDelta(
    authority: AuthorityResult,
    orgCeiling: number
): AuthorityDelta {
    const delta = authority.effectiveAuthorityLevel - orgCeiling;

    const tooltip = generateDeltaTooltip(authority, delta);

    return {
        delta,
        tooltip,
    };
}

/**
 * Generate tooltip explaining authority reduction.
 */
function generateDeltaTooltip(authority: AuthorityResult, delta: number): string {
    if (delta === 0) {
        return 'Full organizational authority maintained';
    }

    const lines: string[] = [];
    lines.push(`Authority reduced by ${Math.abs(delta)}:`);

    const restrictions = authority.reasoning.filter((r) => r.impact === 'RESTRICT');
    restrictions.forEach((r) => {
        const constraint = extractKeyConstraint(r.detail);
        lines.push(`• ${constraint}`);
    });

    return lines.join('\n');
}
