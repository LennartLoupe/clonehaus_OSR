import { PolicyStatus } from './learnedPolicy';

/**
 * Policy Override System (Phase 5B)
 * 
 * Allows creation of temporary shadow rules that override policies
 * WITHOUT mutating the original policy.
 * 
 * CRITICAL CONSTRAINTS:
 * - NO MUTATION: Overrides never modify original policies
 * - TIME-BOUND: All overrides have mandatory expiry (max 30 days)
 * - VISIBLE: Overrides are always displayed alongside originals
 * - REVERSIBLE: Overrides can be removed, exposing original policy
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Override scope enumeration
 * 
 * Defines how broadly an override applies.
 */
export enum OverrideScope {
    /**
     * Override applies to this single instance only.
     */
    INSTANCE_ONLY = 'INSTANCE_ONLY',

    /**
     * Override applies across an entire domain.
     */
    DOMAIN = 'DOMAIN',

    /**
     * Override applies organization-wide.
     */
    ORGANIZATION = 'ORGANIZATION',
}

/**
 * Policy override record (Phase 5B)
 * 
 * Temporary shadow rule that takes precedence over a learned policy.
 * 
 * CRITICAL: NON-MUTATING
 * Overrides never modify the original policy. They create a shadow
 * that temporarily changes how the policy is interpreted.
 */
export interface PolicyOverride {
    // Identity
    overrideId: string;
    targetPolicyId: string;              // Policy being overridden

    // Scope
    scope: OverrideScope;

    // Justification
    reason: string;                       // Required, substantive explanation

    // Creator
    createdBy: string;                    // User ID
    createdAt: string;                    // ISO timestamp

    // Expiry
    expiresAt: string;                    // Always time-bound (max 30 days)

    // Computed status
    isActive: boolean;                    // Derived from expiresAt
}

// ============================================================================
// OVERRIDE CREATION
// ============================================================================

/**
 * Generate unique override ID.
 * Format: override-{timestamp}-{random}
 */
function generateOverrideId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `override-${timestamp}-${random}`;
}

/**
 * Create a policy override.
 * 
 * CRITICAL: NON-MUTATING
 * This function creates a shadow rule only. It does NOT modify the original policy.
 * 
 * @param targetPolicyId - ID of policy to override
 * @param scope - Override scope
 * @param reason - Justification (required, min 10 chars)
 * @param expiryDays - Days until expiry (max 30, no default)
 * @returns PolicyOverride
 * @throws Error if reason is insufficient or expiryDays > 30
 */
export function createPolicyOverride(
    targetPolicyId: string,
    scope: OverrideScope,
    reason: string,
    expiryDays: number
): PolicyOverride {
    // Validate reason is substantive
    if (!reason || reason.trim().length < 10) {
        throw new Error('Override reason must be at least 10 characters.');
    }

    // Validate expiry is time-bound (max 30 days)
    if (expiryDays > 30) {
        throw new Error('Override expiry cannot exceed 30 days.');
    }

    if (expiryDays <= 0) {
        throw new Error('Override expiry must be positive.');
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiryDays * 24 * 60 * 60 * 1000);

    return {
        overrideId: generateOverrideId(),
        targetPolicyId,
        scope,
        reason: reason.trim(),
        createdBy: 'current-user', // Placeholder
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        isActive: true, // Active when created
    };
}

// ============================================================================
// OVERRIDE STATUS
// ============================================================================

/**
 * Check if an override is currently active.
 * 
 * An override is active if current time < expiresAt.
 * 
 * @param override - PolicyOverride to check
 * @returns true if active
 */
export function isOverrideActive(override: PolicyOverride): boolean {
    const now = new Date();
    const expiryDate = new Date(override.expiresAt);
    return now < expiryDate;
}

/**
 * Update override active status based on current time.
 * 
 * @param override - PolicyOverride to update
 * @returns Updated PolicyOverride with current isActive status
 */
export function updateOverrideStatus(override: PolicyOverride): PolicyOverride {
    const active = isOverrideActive(override);

    if (active !== override.isActive) {
        return {
            ...override,
            isActive: active,
        };
    }

    return override;
}

/**
 * Get active policy status considering overrides.
 * 
 * If any active override exists for the policy, status is OVERRIDDEN.
 * Otherwise, returns the policy's current lifecycle status.
 * 
 * @param policyStatus - Policy's current lifecycle status
 * @param overrides - All overrides for this policy
 * @returns Effective policy status
 */
export function getActivePolicyStatus(
    policyStatus: PolicyStatus,
    overrides: PolicyOverride[]
): PolicyStatus {
    // Check if any override is active
    const hasActiveOverride = overrides.some(o => isOverrideActive(o));

    if (hasActiveOverride) {
        return PolicyStatus.OVERRIDDEN;
    }

    return policyStatus;
}

// ============================================================================
// OVERRIDE FILTERING
// ============================================================================

/**
 * Get all active overrides for a policy.
 * 
 * @param policyId - Policy ID
 * @param allOverrides - All overrides in the system
 * @returns Array of active overrides for this policy
 */
export function getActiveOverridesForPolicy(
    policyId: string,
    allOverrides: PolicyOverride[]
): PolicyOverride[] {
    return allOverrides
        .filter(o => o.targetPolicyId === policyId)
        .filter(o => isOverrideActive(o))
        .map(o => updateOverrideStatus(o));
}

/**
 * Get all expired overrides.
 * 
 * Useful for cleanup or archival purposes.
 * 
 * @param allOverrides - All overrides in the system
 * @returns Array of expired overrides
 */
export function getExpiredOverrides(allOverrides: PolicyOverride[]): PolicyOverride[] {
    return allOverrides
        .filter(o => !isOverrideActive(o))
        .map(o => updateOverrideStatus(o));
}
