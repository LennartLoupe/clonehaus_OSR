import { PolicyChangeProposal } from '../staging/stagedActions';

/**
 * Policy Learning System (Phase 5A)
 * 
 * Pure logic for learning policies from human approvals.
 * 
 * CRITICAL CONSTRAINTS:
 * - NO EXECUTION: Policies are inert records, never executed
 * - NO BEHAVIOR ADAPTATION: System cannot modify its own behavior
 * - MONOTONIC AUTHORITY: Policies can only restrict, never expand authority
 * - LPS LAYER BOUNDARIES: Only Policy layer can be modified
 * - EAPP COMPLIANCE: All policies must pass Ethics-Aligned Persona Protocol validation
 */

// ============================================================================
// LPS (LAYERED PERSONA SYSTEM) TYPES
// ============================================================================

/**
 * LPS Layer enumeration
 * 
 * Defines the six layers of the Layered Persona System.
 * Phase 5A may only write to POLICY layer.
 */
export enum LPSLayer {
    /**
     * Core values and ethical posture.
     * IMMUTABLE - Never modified by policy learning.
     */
    IDENTITY = 'IDENTITY',

    /**
     * Purpose and mission.
     * IMMUTABLE - Never modified by policy learning.
     */
    MANDATE = 'MANDATE',

    /**
     * Scope of permitted actions.
     * INDIRECT - Can be affected through restrictive policy overlays only.
     */
    AUTHORITY = 'AUTHORITY',

    /**
     * Available tools and capabilities.
     * INDIRECT - Conditions of use may be narrowed, but capabilities unchanged.
     */
    CAPABILITY = 'CAPABILITY',

    /**
     * Rules, constraints, and learned boundaries.
     * MUTABLE - Sole learning surface for Phase 5A.
     */
    POLICY = 'POLICY',

    /**
     * Runtime execution context.
     * OUT OF SCOPE - Execution is categorically excluded from Phase 5A.
     */
    EXECUTION = 'EXECUTION',
}

/**
 * LPS layer mutability matrix for Phase 5A
 */
export const LPS_MUTABILITY: Record<LPSLayer, 'NEVER' | 'INDIRECT' | 'YES' | 'OUT_OF_SCOPE'> = {
    [LPSLayer.IDENTITY]: 'NEVER',
    [LPSLayer.MANDATE]: 'NEVER',
    [LPSLayer.AUTHORITY]: 'INDIRECT',
    [LPSLayer.CAPABILITY]: 'INDIRECT',
    [LPSLayer.POLICY]: 'YES',
    [LPSLayer.EXECUTION]: 'OUT_OF_SCOPE',
};

// ============================================================================
// POLICY LIFECYCLE (PHASE 5B)
// ============================================================================

/**
 * Policy status enumeration (Phase 5B)
 * 
 * All policies have a lifecycle status that determines their authority contribution.
 */
export enum PolicyStatus {
    /**
     * Policy is active and contributes to authority derivation.
     */
    ACTIVE = 'ACTIVE',

    /**
     * Policy has reached its review date and requires human attention.
     */
    UNDER_REVIEW = 'UNDER_REVIEW',

    /**
     * Policy has expired and no longer affects authority.
     * Cannot be renewed - requires re-approval.
     */
    EXPIRED = 'EXPIRED',

    /**
     * Policy is shadowed by an active override.
     * Original policy unchanged, override takes precedence.
     */
    OVERRIDDEN = 'OVERRIDDEN',
}

/**
 * Policy lifecycle metadata (Phase 5B)
 * 
 * Every learned policy MUST have a lifecycle.
 * No policy can exist without review and expiry dates.
 * 
 * CRITICAL: MANDATORY EXPIRY
 * This ensures authority is always temporary and requires human attention.
 */
export interface PolicyLifecycle {
    policyId: string;
    createdAt: string;                    // ISO timestamp
    lastReviewedAt: string | null;        // Last manual review (null if never reviewed)
    reviewIntervalDays: number;           // Default: 90 days
    nextReviewDate: string;               // Calculated: lastReviewedAt + interval, or createdAt + interval
    expiresAt: string;                    // Hard expiry (default: createdAt + 180 days)
    status: PolicyStatus;
}

// ============================================================================
// EAPP (ETHICS-ALIGNED PERSONA PROTOCOL) VALIDATION TYPES
// ============================================================================

/**
 * EAPP validation result
 */
export interface EAPPValidation {
    passed: boolean;
    checks: {
        declaredIntent: ValidationCheck;
        boundedAuthority: ValidationCheck;
        explainability: ValidationCheck;
        driftPrevention: ValidationCheck;
    };
    violations: string[];
}

/**
 * Individual validation check result
 */
export interface ValidationCheck {
    passed: boolean;
    reason: string;
}

/**
 * Generic validation result
 */
export interface ValidationResult {
    valid: boolean;
    reason: string;
    violations?: string[];
}

// ============================================================================
// MONOTONICITY TYPES
// ============================================================================

/**
 * Authority directionality
 * 
 * Defines whether a policy change increases, maintains, or decreases authority.
 * Only RESTRICT and MAINTAIN are valid for Phase 5A.
 */
export enum AuthorityDirection {
    /**
     * Authority would increase (INVALID for Phase 5A)
     */
    EXPAND = 'EXPAND',

    /**
     * Authority stays the same (VALID)
     */
    MAINTAIN = 'MAINTAIN',

    /**
     * Authority decreases (VALID)
     */
    RESTRICT = 'RESTRICT',
}

/**
 * Monotonicity validation result
 */
export interface MonotonicityValidation {
    valid: boolean;
    direction: AuthorityDirection;
    reason: string;
    violations: string[];
}

// ============================================================================
// LEARNED POLICY TYPES
// ============================================================================

/**
 * Policy constraint type
 * 
 * Categorizes what kind of constraint is being learned.
 */
export type PolicyConstraintType =
    | 'ALWAYS_REQUIRE_APPROVAL'     // This action category always needs human approval
    | 'RESTRICT_TO_DOMAIN'          // Limit action to specific domain
    | 'NEVER_ALLOW_AUTONOMOUS'      // Block autonomous execution entirely
    | 'REDUCE_AUTHORITY_LEVEL';     // Lower authority ceiling for action category

/**
 * Learned policy constraint details
 */
export interface LearnedPolicyConstraint {
    type: PolicyConstraintType;
    description: string;              // Human-readable constraint
    technicalDetails: string;         // How it would be enforced
    affectedScope: string;            // What this applies to (agent, domain, org)
}

/**
 * Policy state snapshot (before/after)
 * Re-exported from staging for consistency
 */
export interface PolicyState {
    description: string;
    technicalDetails?: string;
}

/**
 * Learned policy record (Phase 5A)
 * 
 * Immutable record of a policy learned from human approval.
 * 
 * CRITICAL: INERT RECORD ONLY
 * This is a memory artifact. It does NOT execute, apply, or modify system behavior.
 * Confirming a learned policy does NOT activate it.
 */
export interface LearnedPolicy {
    // Identity
    policyId: string;
    learnedAt: string;                          // ISO timestamp
    learnedBy: string;                          // User identifier

    // Source
    sourceApprovalIntentId: string;             // Originating approval
    sourcePolicyProposalId: string;             // Confirmed proposal

    // LPS Layer Attribution
    affectedLayers: LPSLayer[];                 // Which layers this touches
    primaryLayer: LPSLayer;                     // Primary layer (always POLICY for Phase 5A)

    // Constraint
    constraint: LearnedPolicyConstraint;

    // Policy State (before/after)
    beforeState: PolicyState;
    afterState: PolicyState;

    // Justification
    humanJustification: string;                 // From approval
    systemReasoning: string;                    // Generated explanation

    // Validation Metadata
    eappValidation: EAPPValidation;             // EAPP compliance checks
    lpsValidation: ValidationResult;            // LPS boundary checks
    monotonicityValidation: MonotonicityValidation; // Authority direction checks

    // Explainability
    explanation: string;                        // Full human-readable explanation

    // Lifecycle (Phase 5B)
    lifecycle: PolicyLifecycle;                 // Mandatory lifecycle with review and expiry
}

// ============================================================================
// EAPP VALIDATION LOGIC
// ============================================================================

/**
 * Validate EAPP compliance for a policy proposal.
 * 
 * EAPP Requirements:
 * 1. Declared Intent - Human approval with written justification
 * 2. Bounded Authority - Policy cannot increase authority
 * 3. Explainability - What/why/impact must be clear
 * 4. Drift Prevention - No implicit learning surfaces
 */
export function validateEAPPCompliance(proposal: PolicyChangeProposal): EAPPValidation {
    const checks = {
        declaredIntent: checkDeclaredIntent(proposal),
        boundedAuthority: checkBoundedAuthority(proposal),
        explainability: checkExplainability(proposal),
        driftPrevention: checkDriftPrevention(proposal),
    };

    const violations: string[] = [];
    Object.entries(checks).forEach(([key, check]) => {
        if (!check.passed) {
            violations.push(`${key}: ${check.reason}`);
        }
    });

    const passed = Object.values(checks).every(check => check.passed);

    return {
        passed,
        checks,
        violations,
    };
}

/**
 * Check 1: Declared Intent
 * 
 * Every learned policy must originate from explicit human approval
 * with written justification.
 */
function checkDeclaredIntent(proposal: PolicyChangeProposal): ValidationCheck {
    // Check justification exists and is non-empty
    if (!proposal.humanJustification || proposal.humanJustification.trim() === '') {
        return {
            passed: false,
            reason: 'No human justification provided. Declared intent requires written reasoning.',
        };
    }

    // Check justification is substantive (more than trivial)
    if (proposal.humanJustification.trim().length < 10) {
        return {
            passed: false,
            reason: 'Justification is too brief. Declared intent requires substantive explanation.',
        };
    }

    return {
        passed: true,
        reason: 'Human justification provided with clear intent.',
    };
}

/**
 * Check 2: Bounded Authority
 * 
 * Learned policies may never increase authority.
 * They can only preserve or restrict.
 */
function checkBoundedAuthority(proposal: PolicyChangeProposal): ValidationCheck {
    // Authority-increasing changes are categorically invalid
    const expandsAuthority =
        proposal.proposedChangeType === 'AUTHORITY_ADJUSTMENT' &&
        proposal.afterState.description.includes('would have elevated');

    if (expandsAuthority) {
        return {
            passed: false,
            reason: 'Policy would increase authority. Bounded authority requires monotonic restriction.',
        };
    }

    return {
        passed: true,
        reason: 'Policy does not increase authority.',
    };
}

/**
 * Check 3: Explainability
 * 
 * Every learned policy must store what changed, why, and what would be different.
 */
function checkExplainability(proposal: PolicyChangeProposal): ValidationCheck {
    // Check before/after states exist
    if (!proposal.beforeState?.description || !proposal.afterState?.description) {
        return {
            passed: false,
            reason: 'Before/after states missing. Explainability requires clear state comparison.',
        };
    }

    // Check system reasoning exists
    if (!proposal.systemReasoning || proposal.systemReasoning.trim() === '') {
        return {
            passed: false,
            reason: 'System reasoning missing. Explainability requires generated explanation.',
        };
    }

    return {
        passed: true,
        reason: 'Policy includes what changed, why, and impact.',
    };
}

/**
 * Check 4: Drift Prevention
 * 
 * No implicit learning surfaces. All policies are explicit and human-approved.
 */
function checkDriftPrevention(proposal: PolicyChangeProposal): ValidationCheck {
    // Check status is CONFIRMED (not auto-propagated or auto-applied)
    if (proposal.status !== 'CONFIRMED') {
        return {
            passed: false,
            reason: 'Policy not explicitly confirmed. Drift prevention requires human confirmation.',
        };
    }

    return {
        passed: true,
        reason: 'Policy explicitly confirmed by human, no automatic propagation.',
    };
}

// ============================================================================
// LPS LAYER BOUNDARY VALIDATION
// ============================================================================

/**
 * Validate LPS layer boundaries for a policy proposal.
 * 
 * Phase 5A Rules:
 * - Identity layer: NEVER writable
 * - Mandate layer: NEVER writable
 * - Authority layer: Only through restrictive overlays
 * - Capability layer: Conditions may narrow, capabilities unchanged
 * - Policy layer: YES, sole learning surface
 * - Execution layer: OUT OF SCOPE
 */
export function validateLPSBoundaries(proposal: PolicyChangeProposal): ValidationResult {
    // Determine which layer(s) this proposal would affect
    const affectedLayers = determineAffectedLayers(proposal);

    // Check for forbidden layer access
    const violations: string[] = [];

    if (affectedLayers.includes(LPSLayer.IDENTITY)) {
        violations.push('Cannot modify IDENTITY layer. Core values are immutable.');
    }

    if (affectedLayers.includes(LPSLayer.MANDATE)) {
        violations.push('Cannot modify MANDATE layer. Purpose is immutable.');
    }

    if (affectedLayers.includes(LPSLayer.EXECUTION)) {
        violations.push('Cannot modify EXECUTION layer. Execution is out of scope for Phase 5A.');
    }

    // For AUTHORITY and CAPABILITY layers, ensure changes are restrictive only
    if (affectedLayers.includes(LPSLayer.AUTHORITY)) {
        const isRestrictive = proposal.proposedChangeType !== 'AUTHORITY_ADJUSTMENT' ||
            !proposal.afterState.description.includes('elevated');

        if (!isRestrictive) {
            violations.push('AUTHORITY layer changes must be restrictive. Cannot elevate authority.');
        }
    }

    const valid = violations.length === 0;

    return {
        valid,
        reason: valid
            ? 'Policy respects LPS layer boundaries.'
            : 'Policy violates LPS layer boundaries.',
        violations,
    };
}

/**
 * Determine which LPS layers a proposal would affect.
 */
function determineAffectedLayers(proposal: PolicyChangeProposal): LPSLayer[] {
    const layers: LPSLayer[] = [];

    // All learned policies affect Policy layer
    layers.push(LPSLayer.POLICY);

    // Determine additional affected layers based on change type
    switch (proposal.proposedChangeType) {
        case 'AUTHORITY_ADJUSTMENT':
            layers.push(LPSLayer.AUTHORITY);
            break;

        case 'ACTION_PERMISSION':
            layers.push(LPSLayer.CAPABILITY);
            break;

        case 'ESCALATION_RULE':
            // Escalation affects policy layer only
            break;

        case 'NONE':
            // No additional layers
            break;
    }

    return layers;
}

// ============================================================================
// MONOTONICITY VALIDATION
// ============================================================================

/**
 * Validate authority directionality (monotonicity).
 * 
 * All learned policies must be monotonic:
 * - Authority may only stay the same or decrease
 * - Restrictions may be added, never removed
 * - Safeguards accumulate over time
 */
export function validateMonotonicity(proposal: PolicyChangeProposal): MonotonicityValidation {
    const direction = determineAuthorityDirection(proposal);
    const violations: string[] = [];

    // EXPAND is categorically invalid
    if (direction === AuthorityDirection.EXPAND) {
        violations.push('Policy would increase authority. Monotonic constraint violated.');
        violations.push('Learned policies can only restrict or maintain authority, never expand.');
    }

    const valid = direction !== AuthorityDirection.EXPAND;

    return {
        valid,
        direction,
        reason: valid
            ? `Authority direction is ${direction} (valid).`
            : `Authority direction is ${direction} (invalid).`,
        violations,
    };
}

/**
 * Determine authority direction from before/after states.
 */
function determineAuthorityDirection(proposal: PolicyChangeProposal): AuthorityDirection {
    const before = proposal.beforeState.description.toLowerCase();
    const after = proposal.afterState.description.toLowerCase();

    // Check for authority expansion indicators
    const expandIndicators = [
        'elevated authority',
        'would have elevated',
        'increased to permit',
        'permitted autonomously',
        'not require escalation',
        'greater autonomy',
    ];

    const isExpanding = expandIndicators.some(indicator => after.includes(indicator));
    if (isExpanding) {
        return AuthorityDirection.EXPAND;
    }

    // Check for authority restriction indicators
    const restrictIndicators = [
        'requires approval',
        'limited authority',
        'requires escalation',
        'not permitted',
        'restricted to',
    ];

    const isRestricting = restrictIndicators.some(indicator => after.includes(indicator));
    if (isRestricting) {
        return AuthorityDirection.RESTRICT;
    }

    // No change detected
    return AuthorityDirection.MAINTAIN;
}

// ============================================================================
// POLICY EXPLANATION GENERATION
// ============================================================================

/**
 * Generate comprehensive human-readable explanation for a learned policy.
 * 
 * Explanation includes:
 * - What changed
 * - Why it changed (human justification)
 * - What would be different if applied (system reasoning)
 * - Which layer(s) it affects
 */
export function generatePolicyExplanation(policy: LearnedPolicy): string {
    const parts: string[] = [];

    // What changed
    parts.push('## What Changed');
    parts.push(policy.constraint.description);
    parts.push('');

    // Before/After
    parts.push('**Before:** ' + policy.beforeState.description);
    parts.push('**After:** ' + policy.afterState.description);
    parts.push('');

    // Why it changed
    parts.push('## Why This Was Learned');
    parts.push(policy.humanJustification);
    parts.push('');

    // Impact
    parts.push('## What Would Be Different');
    parts.push(policy.systemReasoning);
    parts.push('');

    // Affected layers
    parts.push('## Affected System Layers');
    parts.push(`Primary Layer: ${policy.primaryLayer}`);
    if (policy.affectedLayers.length > 1) {
        const otherLayers = policy.affectedLayers.filter(l => l !== policy.primaryLayer);
        parts.push(`Additional Layers: ${otherLayers.join(', ')}`);
    }
    parts.push('');

    // Validation status
    parts.push('## Validation');
    parts.push(`✓ EAPP Compliance: ${policy.eappValidation.passed ? 'Passed' : 'Failed'}`);
    parts.push(`✓ LPS Boundaries: ${policy.lpsValidation.valid ? 'Respected' : 'Violated'}`);
    parts.push(`✓ Monotonicity: ${policy.monotonicityValidation.valid ? policy.monotonicityValidation.direction : 'Failed'}`);

    return parts.join('\n');
}

// ============================================================================
// POLICY DERIVATION
// ============================================================================

/**
 * Generate unique learned policy ID.
 * Format: learned-{timestamp}-{random}
 */
function generateLearnedPolicyId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `learned-${timestamp}-${random}`;
}

/**
 * Derive constraint details from proposal.
 */
function deriveConstraint(proposal: PolicyChangeProposal): LearnedPolicyConstraint {
    let type: PolicyConstraintType;
    let description: string;
    let technicalDetails: string;

    switch (proposal.proposedChangeType) {
        case 'AUTHORITY_ADJUSTMENT':
            type = 'REDUCE_AUTHORITY_LEVEL';
            description = `Reduced authority for ${proposal.targetName}`;
            technicalDetails = 'Authority ceiling lowered for specified action category';
            break;

        case 'ACTION_PERMISSION':
            type = 'ALWAYS_REQUIRE_APPROVAL';
            description = `Always require human approval for this action`;
            technicalDetails = 'Action added to approval-required set';
            break;

        case 'ESCALATION_RULE':
            type = 'NEVER_ALLOW_AUTONOMOUS';
            description = `Block autonomous execution in this context`;
            technicalDetails = 'Escalation policy enforced for this action category';
            break;

        case 'NONE':
        default:
            type = 'ALWAYS_REQUIRE_APPROVAL';
            description = 'Policy constraint details unavailable';
            technicalDetails = 'Manual review recommended';
            break;
    }

    return {
        type,
        description,
        technicalDetails,
        affectedScope: `${proposal.scope}: ${proposal.targetName}`,
    };
}

/**
 * Derive a learned policy from a confirmed policy change proposal.
 * 
 * CRITICAL: NO POLICY APPLICATION
 * This function creates an immutable policy record only.
 * It does NOT activate, apply, or execute anything.
 * 
 * @param proposal - Confirmed PolicyChangeProposal
 * @returns LearnedPolicy or null if validation fails
 */
export function deriveLearnedPolicy(proposal: PolicyChangeProposal): LearnedPolicy | null {
    // Only derive from CONFIRMED proposals
    if (proposal.status !== 'CONFIRMED') {
        return null;
    }

    // Validate EAPP compliance
    const eappValidation = validateEAPPCompliance(proposal);
    if (!eappValidation.passed) {
        console.error('EAPP validation failed:', eappValidation.violations);
        return null;
    }

    // Validate LPS boundaries
    const lpsValidation = validateLPSBoundaries(proposal);
    if (!lpsValidation.valid) {
        console.error('LPS boundary validation failed:', lpsValidation.violations);
        return null;
    }

    // Validate monotonicity
    const monotonicityValidation = validateMonotonicity(proposal);
    if (!monotonicityValidation.valid) {
        console.error('Monotonicity validation failed:', monotonicityValidation.violations);
        return null;
    }

    // Determine affected layers
    const affectedLayers = determineAffectedLayers(proposal);
    const primaryLayer = LPSLayer.POLICY; // Always POLICY for Phase 5A

    // Derive constraint
    const constraint = deriveConstraint(proposal);

    // Phase 5B: Create lifecycle (mandatory) - must create before policy object
    const policyId = generateLearnedPolicyId();
    const lifecycle = createPolicyLifecycle(policyId);

    // Create learned policy
    const policy: LearnedPolicy = {
        // Identity
        policyId,
        learnedAt: new Date().toISOString(),
        learnedBy: 'current-user', // Placeholder

        // Source
        sourceApprovalIntentId: proposal.sourceApprovalIntentId,
        sourcePolicyProposalId: proposal.proposalId,

        // LPS Layer Attribution
        affectedLayers,
        primaryLayer,

        // Constraint
        constraint,

        // Policy State
        beforeState: proposal.beforeState,
        afterState: proposal.afterState,

        // Justification
        humanJustification: proposal.humanJustification,
        systemReasoning: proposal.systemReasoning,

        // Validation Metadata
        eappValidation,
        lpsValidation,
        monotonicityValidation,

        // Explainability (generated lazily)
        explanation: '', // Will be set below

        // Lifecycle (Phase 5B)
        lifecycle,
    };

    // Generate explanation
    policy.explanation = generatePolicyExplanation(policy);

    return policy;
}

// ============================================================================
// POLICY LIFECYCLE MANAGEMENT (PHASE 5B)
// ============================================================================

/**
 * Create a policy lifecycle with mandatory review and expiry dates.
 * 
 * CRITICAL: MANDATORY EXPIRY
 * Every policy MUST have an expiry date. No policy can exist indefinitely.
 * 
 * @param policyId - Policy ID
 * @param reviewIntervalDays - Days between reviews (default: 90)
 * @param expiryDays - Days until expiry (default: 180)
 * @returns PolicyLifecycle
 */
export function createPolicyLifecycle(
    policyId: string,
    reviewIntervalDays: number = 90,
    expiryDays: number = 180
): PolicyLifecycle {
    const now = new Date();
    const createdAt = now.toISOString();

    // Calculate next review date (createdAt + reviewIntervalDays)
    const nextReviewDate = new Date(now.getTime() + reviewIntervalDays * 24 * 60 * 60 * 1000);

    // Calculate expiry date (createdAt + expiryDays)
    const expiresAt = new Date(now.getTime() + expiryDays * 24 * 60 * 60 * 1000);

    return {
        policyId,
        createdAt,
        lastReviewedAt: null, // Never reviewed yet
        reviewIntervalDays,
        nextReviewDate: nextReviewDate.toISOString(),
        expiresAt: expiresAt.toISOString(),
        status: PolicyStatus.ACTIVE,
    };
}

/**
 * Check if a policy has expired.
 * 
 * A policy is expired if current time > expiresAt.
 * Expired policies do NOT contribute to authority derivation.
 * 
 * @param lifecycle - Policy lifecycle
 * @returns true if expired
 */
export function isExpired(lifecycle: PolicyLifecycle): boolean {
    const now = new Date();
    const expiryDate = new Date(lifecycle.expiresAt);
    return now > expiryDate;
}

/**
 * Check if a policy needs review.
 * 
 * A policy needs review if current time > nextReviewDate.
 * 
 * @param lifecycle - Policy lifecycle
 * @returns true if review needed
 */
export function needsReview(lifecycle: PolicyLifecycle): boolean {
    const now = new Date();
    const reviewDate = new Date(lifecycle.nextReviewDate);
    return now > reviewDate;
}

/**
 * Renew a policy with new review and expiry dates.
 * 
 * CRITICAL: CANNOT RENEW EXPIRED POLICIES
 * Expired policies require re-approval through the full derivation process.
 * 
 * @param policy - LearnedPolicy to renew
 * @param reviewIntervalDays - New review interval (optional, uses existing if not provided)
 * @returns Updated LearnedPolicy with new lifecycle dates
 * @throws Error if policy is expired
 */
export function renewPolicy(
    policy: LearnedPolicy,
    reviewIntervalDays?: number
): LearnedPolicy {
    // Cannot renew expired policies
    if (policy.lifecycle.status === PolicyStatus.EXPIRED) {
        throw new Error('Cannot renew expired policy. Re-approval required.');
    }

    // Cannot renew if already expired (by time)
    if (isExpired(policy.lifecycle)) {
        throw new Error('Policy has expired. Re-approval required.');
    }

    const now = new Date();
    const interval = reviewIntervalDays ?? policy.lifecycle.reviewIntervalDays;

    // Calculate new next review date
    const nextReviewDate = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);

    // Calculate new expiry date (doubled interval from now)
    const expiryDays = interval * 2;
    const expiresAt = new Date(now.getTime() + expiryDays * 24 * 60 * 60 * 1000);

    // Create updated lifecycle
    const updatedLifecycle: PolicyLifecycle = {
        ...policy.lifecycle,
        lastReviewedAt: now.toISOString(),
        reviewIntervalDays: interval,
        nextReviewDate: nextReviewDate.toISOString(),
        expiresAt: expiresAt.toISOString(),
        status: PolicyStatus.ACTIVE, // back to active if was under review
    };

    return {
        ...policy,
        lifecycle: updatedLifecycle,
    };
}

/**
 * Mark a policy to expire.
 * 
 * This is an explicit human decision to let a policy expire.
 * The policy immediately becomes inactive and does not affect authority.
 * 
 * @param policy - LearnedPolicy to expire
 * @returns Updated LearnedPolicy with EXPIRED status
 */
export function letPolicyExpire(policy: LearnedPolicy): LearnedPolicy {
    const updatedLifecycle: PolicyLifecycle = {
        ...policy.lifecycle,
        status: PolicyStatus.EXPIRED,
    };

    return {
        ...policy,
        lifecycle: updatedLifecycle,
    };
}

/**
 * Update policy status based on lifecycle state.
 * 
 * This function checks if policy needs review or has expired,
 * and updates status accordingly.
 * 
 * @param policy - LearnedPolicy to check
 * @returns Updated LearnedPolicy with current status
 */
export function updatePolicyStatus(policy: LearnedPolicy): LearnedPolicy {
    // Don't change if already expired or overridden
    if (policy.lifecycle.status === PolicyStatus.EXPIRED ||
        policy.lifecycle.status === PolicyStatus.OVERRIDDEN) {
        return policy;
    }

    let newStatus: PolicyStatus = policy.lifecycle.status;

    // Check if expired
    if (isExpired(policy.lifecycle)) {
        newStatus = PolicyStatus.EXPIRED;
    }
    // Check if needs review
    else if (needsReview(policy.lifecycle)) {
        newStatus = PolicyStatus.UNDER_REVIEW;
    }

    // Update if status changed
    if (newStatus !== policy.lifecycle.status) {
        return {
            ...policy,
            lifecycle: {
                ...policy.lifecycle,
                status: newStatus,
            },
        };
    }

    return policy;
}
