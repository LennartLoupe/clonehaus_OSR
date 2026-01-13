import { Agent, Domain, Organization } from '@/app/data/types';
import { AuthorityResult } from './deriveAuthority';
import { DoAction } from './deriveDoActions';
import { RuntimeVerdict } from './deriveRuntimeVerdict';

/**
 * Execution Readiness Derivation Engine (Phase 3C)
 * 
 * Pure logic for determining when execution is eligible to exist for a Do Action.
 * 
 * CRITICAL: NO EXECUTION
 * This module defines eligibility only. No execution paths, no API calls, no side effects.
 * Execution is a derived state, not an action.
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Execution readiness states (Phase 3C)
 */
export type ExecutionReadinessState =
    | 'NOT_ELIGIBLE'
    | 'ELIGIBLE_PENDING_APPROVAL'
    | 'ELIGIBLE_AUTOMATIC'
    | 'BLOCKED_HARD';

/**
 * Execution precondition gate result
 */
interface GateResult {
    passed: boolean;
    reason: string;
}

/**
 * Execution readiness with all gate results
 */
export interface ExecutionReadiness {
    state: ExecutionReadinessState;
    gates: {
        authorityAlignment: GateResult;
        actionSurfaceCompatibility: GateResult;
        escalationResolution: GateResult;
        personaAlignment: GateResult;
    };
    summary: string;
}

// ============================================================================
// DERIVATION ENGINE
// ============================================================================

/**
 * Derive execution readiness for a Do Action.
 * 
 * All four gates must pass for execution to be eligible.
 * Same input → same output (deterministic).
 */
export function deriveExecutionReadiness(
    agent: Agent,
    doAction: DoAction,
    authority: AuthorityResult,
    verdict: RuntimeVerdict,
    domain: Domain,
    organization: Organization
): ExecutionReadiness {
    // Evaluate all four precondition gates
    const gates = {
        authorityAlignment: evaluateAuthorityGate(doAction, authority, domain, organization),
        actionSurfaceCompatibility: evaluateActionSurfaceGate(doAction, agent),
        escalationResolution: evaluateEscalationGate(verdict, agent),
        personaAlignment: evaluatePersonaGate(doAction, agent),
    };

    // Derive state from gate results
    const state = deriveReadinessState(gates, verdict);

    // Generate summary
    const summary = generateSummary(state, gates);

    return {
        state,
        gates,
        summary,
    };
}

// ============================================================================
// GATE 1: AUTHORITY ALIGNMENT
// ============================================================================

/**
 * Gate 1: Authority Alignment
 * 
 * Checks:
 * - Effective authority ≥ required authority
 * - No org or domain restriction violated
 */
function evaluateAuthorityGate(
    doAction: DoAction,
    authority: AuthorityResult,
    domain: Domain,
    organization: Organization
): GateResult {
    // Check if authority meets requirement
    if (authority.effectiveAuthorityLevel < doAction.requiredAuthority) {
        return {
            passed: false,
            reason: `This action requires authority level ${doAction.requiredAuthority}, but effective authority is ${authority.effectiveAuthorityLevel}.`,
        };
    }

    // Check if domain restricts this action category
    const isActionCategoryAllowed = domain.allowedActionCategories?.includes(doAction.category) ?? true;
    if (!isActionCategoryAllowed) {
        return {
            passed: false,
            reason: `This domain does not permit ${doAction.category} actions.`,
        };
    }

    return {
        passed: true,
        reason: 'Authority level meets requirements and domain permits this action category.',
    };
}

// ============================================================================
// GATE 2: ACTION SURFACE COMPATIBILITY
// ============================================================================

/**
 * Gate 2: Action Surface Compatibility
 * 
 * Checks:
 * - Execution surface supports the action
 * - No READ / WRITE / EXECUTE mismatch
 */
function evaluateActionSurfaceGate(
    doAction: DoAction,
    agent: Agent
): GateResult {
    const surfaceHierarchy = { READ: 1, WRITE: 2, EXECUTE: 3 };
    const agentLevel = surfaceHierarchy[agent.executionSurface];
    const requiredLevel = surfaceHierarchy[doAction.requiredSurface];

    if (agentLevel < requiredLevel) {
        return {
            passed: false,
            reason: `This action requires ${doAction.requiredSurface} surface, but agent has ${agent.executionSurface}.`,
        };
    }

    return {
        passed: true,
        reason: 'Agent execution surface supports this action.',
    };
}

// ============================================================================
// GATE 3: ESCALATION RESOLUTION
// ============================================================================

/**
 * Gate 3: Escalation Resolution
 * 
 * Checks:
 * - If escalation required: policy must be defined
 * - No silent escalation
 */
function evaluateEscalationGate(
    verdict: RuntimeVerdict,
    agent: Agent
): GateResult {
    // If escalation is required by the verdict
    if (verdict.escalation) {
        // Check if escalation policy is defined (escalation behavior exists)
        if (!agent.escalationBehavior) {
            return {
                passed: false,
                reason: 'Escalation is required but no escalation policy is defined.',
            };
        }

        // Check if escalation target exists
        if (!verdict.escalation.expectedApproverRole) {
            return {
                passed: false,
                reason: 'Escalation is required but no approver role is specified.',
            };
        }

        return {
            passed: true,
            reason: `Escalation policy defined: ${verdict.escalation.expectedApproverRole} approval required.`,
        };
    }

    // No escalation required
    return {
        passed: true,
        reason: 'No escalation required for this action.',
    };
}

// ============================================================================
// GATE 4: PERSONA ALIGNMENT (EAPP + LPS)
// ============================================================================

/**
 * Gate 4: Persona Alignment
 * 
 * Checks:
 * - Action does not violate persona constraints
 * - Ethical boundaries respected
 * - No persona contradictions
 * 
 * Note: Placeholder for future EAPP integration. Always passes for Phase 3C.
 */
function evaluatePersonaGate(
    doAction: DoAction,
    agent: Agent
): GateResult {
    // Placeholder: Future EAPP integration
    // For Phase 3C, this gate always passes
    return {
        passed: true,
        reason: 'Persona alignment check passed (EAPP integration pending).',
    };
}

// ============================================================================
// STATE DERIVATION
// ============================================================================

/**
 * Derive execution readiness state from gate results.
 * 
 * Rules:
 * - If all gates fail critically → BLOCKED_HARD
 * - If gates pass but escalation required → ELIGIBLE_PENDING_APPROVAL
 * - If all gates pass and no escalation → ELIGIBLE_AUTOMATIC
 * - Otherwise → NOT_ELIGIBLE
 */
function deriveReadinessState(
    gates: ExecutionReadiness['gates'],
    verdict: RuntimeVerdict
): ExecutionReadinessState {
    const allPassed = Object.values(gates).every(gate => gate.passed);
    const anyFailed = Object.values(gates).some(gate => !gate.passed);

    // If all gates fail or critical gates fail
    if (!gates.authorityAlignment.passed && !gates.actionSurfaceCompatibility.passed) {
        return 'BLOCKED_HARD';
    }

    // If any gate fails, not eligible
    if (anyFailed) {
        return 'NOT_ELIGIBLE';
    }

    // All gates pass - check if escalation required
    if (allPassed) {
        if (verdict.escalation) {
            return 'ELIGIBLE_PENDING_APPROVAL';
        }
        return 'ELIGIBLE_AUTOMATIC';
    }

    // Default
    return 'NOT_ELIGIBLE';
}

// ============================================================================
// SUMMARY GENERATION
// ============================================================================

/**
 * Generate human-readable verdict explanation based on readiness state.
 * 
 * CANONICAL LANGUAGE (Phase 3C Extension)
 * These strings are locked and must match the specification exactly.
 */
function generateSummary(
    state: ExecutionReadinessState,
    gates: ExecutionReadiness['gates']
): string {
    switch (state) {
        case 'ELIGIBLE_AUTOMATIC':
            return 'All preconditions are satisfied. This action could run autonomously if execution were enabled.';

        case 'ELIGIBLE_PENDING_APPROVAL':
            return 'Execution is possible, but only with explicit human approval. This action cannot run autonomously.';

        case 'BLOCKED_HARD':
            return 'Critical preconditions failed. Execution is not possible and is explicitly forbidden.';

        case 'NOT_ELIGIBLE':
            return 'This agent is not permitted to perform this action. Execution is not appropriate in this context.';

        default:
            return 'Execution eligibility could not be determined.';
    }
}
