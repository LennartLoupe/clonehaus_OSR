import { Agent } from '@/app/data/types';
import { AuthorityResult } from '../authority/deriveAuthority';
import { DoAction } from '../authority/deriveDoActions';
import { RuntimeVerdict } from '../authority/deriveRuntimeVerdict';
import { ExecutionReadiness } from '../authority/deriveExecutionReadiness';
import { LearnedPolicy, deriveLearnedPolicy } from '../policy/learnedPolicy';

/**
 * Execution Staging System (Phase 4A)
 * 
 * Pure logic for staging actions before execution.
 * 
 * CRITICAL: NO EXECUTION
 * This module manages staging state only. No tools, APIs, or external systems are invoked.
 * Staging and approval are purely state management operations.
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Staging states (Phase 4A)
 * 
 * State transitions:
 * - STAGED → REJECTED (human decision, permanent)
 * - STAGED → APPROVED (human decision, permanent)
 * - No automatic transitions allowed
 */
export type StagingState = 'STAGED' | 'REJECTED' | 'APPROVED';

/**
 * Persona alignment snapshot (placeholder for future LPS integration)
 */
interface PersonaSnapshot {
    alignmentStatus: 'ALIGNED' | 'PENDING';
    note: string;
}

/**
 * Immutable staged action with all snapshots
 * 
 * Once created, this object never changes (except for state transitions).
 * If upstream data changes, the staged action remains frozen but may be marked as out of date.
 */
export interface StagedAction {
    // Identity
    id: string; // Unique staged action ID
    stagedAt: string; // ISO timestamp
    stagedBy: string; // User identifier (placeholder)

    // Subject & Action
    agentId: string;
    agentName: string;
    actionId: string;
    actionName: string;

    // Immutable Snapshots (frozen at staging time)
    runtimeVerdict: RuntimeVerdict;
    executionReadiness: ExecutionReadiness;
    authorityResult: AuthorityResult;
    personaAlignment: PersonaSnapshot;

    // State
    state: StagingState;
    stateChangedAt?: string;
    stateChangedBy?: string;
    rejectionReason?: string;

    // Freshness
    isOutOfDate: boolean; // True if upstream data changed
}

// ============================================================================
// APPROVAL INTENT (Phase 4B)
// ============================================================================

/**
 * Approval scope for intent capture
 * 
 * INSTANCE_ONLY: Approve this specific action only
 * POLICY_CHANGE: Approve and suggest as a policy change
 */
export type ApprovalScope = 'INSTANCE_ONLY' | 'POLICY_CHANGE';

/**
 * Approval intent record (Phase 4B)
 * 
 * Captures human approval decision with justification and scope.
 * Does NOT trigger execution - this is intent capture only.
 */
export interface ApprovalIntent {
    // Identity
    id: string;
    createdAt: string;
    createdBy: string;

    // Subject
    stagedActionId: string;

    // Intent
    scope: ApprovalScope;
    justification: string;     // Required
    conditions?: string;        // Optional

    // Context snapshot (for audit)
    agentName: string;
    actionName: string;
    runtimeVerdictSnapshot: RuntimeVerdict;
    executionReadinessSnapshot: ExecutionReadiness;
}

// ============================================================================
// POLICY CHANGE PROPOSAL (Phase 4C)
// ============================================================================

/**
 * Proposal scope for policy materialization
 * 
 * Determines what level of the system would be affected
 */
export type ProposalScope = 'ORGANIZATION' | 'DOMAIN' | 'AGENT';

/**
 * Proposed change type
 * 
 * Categorizes what kind of policy change would be needed
 */
export type ProposedChangeType =
    | 'AUTHORITY_ADJUSTMENT'    // Would adjust authority level
    | 'ACTION_PERMISSION'       // Would add action to allowed set
    | 'ESCALATION_RULE'         // Would modify escalation policy
    | 'NONE';                   // No policy change needed

/**
 * Proposal status
 */
export type ProposalStatus = 'PROPOSED' | 'CONFIRMED' | 'DISMISSED';

/**
 * Policy state snapshot (before/after)
 */
export interface PolicyState {
    description: string;         // Human-readable state
    technicalDetails?: string;   // Additional context
}

/**
 * Policy change proposal (Phase 4C)
 * 
 * Derived from approved ApprovalIntent when scope is POLICY_CHANGE.
 * Shows what the system would need to change, but does NOT apply changes.
 * 
 * CRITICAL: NO POLICY APPLICATION
 * Confirming a proposal does NOT apply any changes. It only marks ready for future phases.
 */
export interface PolicyChangeProposal {
    // Identity
    proposalId: string;
    sourceApprovalIntentId: string;
    createdAt: string;

    // Target
    scope: ProposalScope;
    targetId: string;            // Org/Domain/Agent ID
    targetName: string;

    // Change Details
    proposedChangeType: ProposedChangeType;
    beforeState: PolicyState;    // Current state snapshot
    afterState: PolicyState;     // Proposed state (NOT applied)

    // Reasoning
    humanJustification: string;  // From ApprovalIntent
    systemReasoning: string;     // Derived explanation

    // Status
    status: ProposalStatus;
    confirmedAt?: string;
    dismissedAt?: string;

    // Phase 5A: Learned Policy (if derived)
    learnedPolicyId?: string;    // ID of derived LearnedPolicy (if successful)
}

// ============================================================================
// STAGING ELIGIBILITY
// ============================================================================

/**
 * Determine if a Do Action can be staged.
 * 
 * Cannot stage if:
 * - Execution readiness is BLOCKED_HARD
 * 
 * Can stage if:
 * - NOT_ELIGIBLE, ELIGIBLE_PENDING_APPROVAL, or ELIGIBLE_AUTOMATIC
 */
export function canStageAction(
    doAction: DoAction,
    executionReadiness: ExecutionReadiness
): boolean {
    // Cannot stage if hard blocked
    if (executionReadiness.state === 'BLOCKED_HARD') {
        return false;
    }

    // Can stage all other states
    return true;
}

// ============================================================================
// STAGED ACTION CREATION
// ============================================================================

/**
 * Generate unique staged action ID.
 * Format: staged-{timestamp}-{random}
 */
function generateStagedActionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `staged-${timestamp}-${random}`;
}

/**
 * Create an immutable staged action snapshot.
 * 
 * This function deep copies all input data to ensure the staged action
 * is completely frozen and independent of future changes.
 */
export function createStagedAction(
    agent: Agent,
    doAction: DoAction,
    verdict: RuntimeVerdict,
    readiness: ExecutionReadiness,
    authority: AuthorityResult
): StagedAction {
    return {
        // Identity
        id: generateStagedActionId(),
        stagedAt: new Date().toISOString(),
        stagedBy: 'current-user', // Placeholder for auth integration

        // Subject & Action
        agentId: agent.id,
        agentName: agent.name,
        actionId: doAction.id,
        actionName: doAction.verbPhrase,

        // Deep copy snapshots to ensure immutability
        runtimeVerdict: JSON.parse(JSON.stringify(verdict)),
        executionReadiness: JSON.parse(JSON.stringify(readiness)),
        authorityResult: JSON.parse(JSON.stringify(authority)),
        personaAlignment: {
            alignmentStatus: 'ALIGNED',
            note: 'Persona alignment check pending LPS integration',
        },

        // Initial state
        state: 'STAGED',
        isOutOfDate: false,
    };
}

// ============================================================================
// STATE TRANSITIONS
// ============================================================================

/**
 * Approve a staged action.
 * 
 * Can only approve actions in STAGED state.
 * This is a permanent transition.
 */
export function approveStagedAction(action: StagedAction): StagedAction {
    if (action.state !== 'STAGED') {
        throw new Error('Can only approve STAGED actions');
    }

    return {
        ...action,
        state: 'APPROVED',
        stateChangedAt: new Date().toISOString(),
        stateChangedBy: 'current-user', // Placeholder
    };
}

/**
 * Reject a staged action with a reason.
 * 
 * Can only reject actions in STAGED state.
 * This is a permanent transition.
 */
export function rejectStagedAction(
    action: StagedAction,
    reason: string
): StagedAction {
    if (action.state !== 'STAGED') {
        throw new Error('Can only reject STAGED actions');
    }

    return {
        ...action,
        state: 'REJECTED',
        stateChangedAt: new Date().toISOString(),
        stateChangedBy: 'current-user', // Placeholder
        rejectionReason: reason,
    };
}

// ============================================================================
// FRESHNESS DETECTION
// ============================================================================

/**
 * Check if a staged action is out of date by comparing current state
 * to the staged snapshot.
 * 
 * For Phase 4A, this is a placeholder. Future phases will implement
 * proper comparison logic.
 */
export function checkStagedActionFreshness(
    stagedAction: StagedAction,
    currentAuthority: AuthorityResult
): boolean {
    // Placeholder: Compare authority result
    // Future: Deep comparison of all snapshot fields
    return stagedAction.authorityResult.effectiveAuthorityLevel !== currentAuthority.effectiveAuthorityLevel;
}

// ============================================================================
// APPROVAL INTENT CREATION (Phase 4B)
// ============================================================================

/**
 * Generate unique approval intent ID.
 * Format: approval-{timestamp}-{random}
 */
function generateApprovalIntentId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `approval-${timestamp}-${random}`;
}

/**
 * Create an immutable approval intent record.
 * 
 * CRITICAL: NO EXECUTION
 * This function creates an intent record only. It does NOT trigger execution.
 * 
 * @throws Error if justification is empty
 */
export function createApprovalIntent(
    stagedAction: StagedAction,
    scope: ApprovalScope,
    justification: string,
    conditions?: string
): ApprovalIntent {
    // Validate justification
    if (!justification || justification.trim() === '') {
        throw new Error('Justification is required for approval');
    }

    return {
        // Identity
        id: generateApprovalIntentId(),
        createdAt: new Date().toISOString(),
        createdBy: 'current-user', // Placeholder for auth integration

        // Subject
        stagedActionId: stagedAction.id,

        // Intent
        scope,
        justification: justification.trim(),
        conditions: conditions?.trim() || undefined,

        // Context snapshot
        agentName: stagedAction.agentName,
        actionName: stagedAction.actionName,
        runtimeVerdictSnapshot: stagedAction.runtimeVerdict,
        executionReadinessSnapshot: stagedAction.executionReadiness,
    };
}

// ============================================================================
// POLICY PROPOSAL DERIVATION (Phase 4C)
// ============================================================================

/**
 * Generate unique policy proposal ID.
 * Format: proposal-{timestamp}-{random}
 */
function generateProposalId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `proposal-${timestamp}-${random}`;
}

/**
 * Analyze what kind of policy change would be required.
 * 
 * Based on execution readiness gates and runtime verdict, determine
 * what type of policy change would enable autonomous execution.
 */
function analyzeRequiredChange(
    readiness: ExecutionReadiness,
    verdict: RuntimeVerdict
): ProposedChangeType {
    // If already ELIGIBLE_AUTOMATIC, no change needed
    if (readiness.state === 'ELIGIBLE_AUTOMATIC') {
        return 'NONE';
    }

    // If NOT_ELIGIBLE due to authority, suggest authority adjustment
    if (readiness.state === 'NOT_ELIGIBLE' &&
        !readiness.gates.authorityAlignment.passed) {
        return 'AUTHORITY_ADJUSTMENT';
    }

    // If ELIGIBLE_PENDING_APPROVAL, suggest action permission
    if (readiness.state === 'ELIGIBLE_PENDING_APPROVAL') {
        return 'ACTION_PERMISSION';
    }

    // If BLOCKED_HARD due to escalation, suggest escalation rule
    if (readiness.state === 'BLOCKED_HARD' &&
        !readiness.gates.escalationResolution.passed) {
        return 'ESCALATION_RULE';
    }

    // If verdict requires escalation, suggest escalation rule
    if (verdict.decision.confidence === 'LOW') {
        return 'ESCALATION_RULE';
    }

    return 'NONE';
}

/**
 * Generate system reasoning for the proposed change.
 * 
 * Uses conditional language ("would", "could", "if applied") to explain
 * what the change would mean for the system.
 */
function generateSystemReasoning(
    changeType: ProposedChangeType,
    agentName: string,
    actionName: string
): string {
    switch (changeType) {
        case 'AUTHORITY_ADJUSTMENT':
            return `If applied, this would adjust ${agentName}'s authority level to permit ${actionName}. This change would affect future similar actions by raising the agent's baseline authority for this action category.`;

        case 'ACTION_PERMISSION':
            return `If applied, this would add ${actionName} to ${agentName}'s permitted action set without requiring human approval. This would enable autonomous execution for this specific action type in similar contexts.`;

        case 'ESCALATION_RULE':
            return `If applied, this would modify escalation policy to reduce or remove escalation requirements for ${actionName} in similar contexts. This would allow the agent to proceed with greater autonomy.`;

        case 'NONE':
            return `No policy change is required. The current system configuration already supports this action for autonomous execution. The approval was instance-specific only.`;

        default:
            return 'Analysis could not determine a specific policy change. Manual review recommended.';
    }
}

/**
 * Generate before/after policy state descriptions.
 */
function generatePolicyStates(
    changeType: ProposedChangeType,
    agentName: string,
    actionName: string
): { before: PolicyState; after: PolicyState } {
    switch (changeType) {
        case 'AUTHORITY_ADJUSTMENT':
            return {
                before: {
                    description: `${agentName} has limited authority for ${actionName}`,
                    technicalDetails: 'Current authority level insufficient for autonomous execution'
                },
                after: {
                    description: `${agentName} would have elevated authority for ${actionName}`,
                    technicalDetails: 'Authority level would be increased to permit autonomous execution'
                }
            };

        case 'ACTION_PERMISSION':
            return {
                before: {
                    description: `${actionName} requires human approval`,
                    technicalDetails: 'Action not in permitted set for autonomous execution'
                },
                after: {
                    description: `${actionName} would be permitted autonomously`,
                    technicalDetails: 'Action would be added to permitted set'
                }
            };

        case 'ESCALATION_RULE':
            return {
                before: {
                    description: `${actionName} requires escalation in this context`,
                    technicalDetails: 'Current escalation policy blocks autonomous execution'
                },
                after: {
                    description: `${actionName} would not require escalation in similar contexts`,
                    technicalDetails: 'Escalation policy would be relaxed for this action type'
                }
            };

        case 'NONE':
            return {
                before: {
                    description: `${agentName} can execute ${actionName} autonomously`,
                    technicalDetails: 'No policy barriers exist'
                },
                after: {
                    description: 'No change needed',
                    technicalDetails: 'System already supports this action'
                }
            };

        default:
            return {
                before: {
                    description: 'Current state unknown',
                    technicalDetails: 'Analysis incomplete'
                },
                after: {
                    description: 'Proposed state unknown',
                    technicalDetails: 'Manual review required'
                }
            };
    }
}

/**
 * Derive a policy change proposal from an approved ApprovalIntent.
 * 
 * CRITICAL: NO POLICY APPLICATION
 * This function only creates a proposal showing what WOULD change.
 * It does NOT apply any changes to the system.
 * 
 * @param approvalIntent - The approved intent to derive from
 * @returns PolicyChangeProposal or null if scope is INSTANCE_ONLY
 */
export function derivePolicyChangeProposal(
    approvalIntent: ApprovalIntent
): PolicyChangeProposal | null {
    // Only derive if scope is POLICY_CHANGE
    if (approvalIntent.scope !== 'POLICY_CHANGE') {
        return null;
    }

    // Analyze what would need to change
    const changeType = analyzeRequiredChange(
        approvalIntent.executionReadinessSnapshot,
        approvalIntent.runtimeVerdictSnapshot
    );

    // Generate before/after states
    const { before, after } = generatePolicyStates(
        changeType,
        approvalIntent.agentName,
        approvalIntent.actionName
    );

    // Generate system reasoning
    const systemReasoning = generateSystemReasoning(
        changeType,
        approvalIntent.agentName,
        approvalIntent.actionName
    );

    return {
        proposalId: generateProposalId(),
        sourceApprovalIntentId: approvalIntent.id,
        createdAt: new Date().toISOString(),

        scope: 'AGENT', // Simplified for Phase 4C - always agent-level
        targetId: approvalIntent.agentName, // Using name as ID placeholder
        targetName: approvalIntent.agentName,

        proposedChangeType: changeType,
        beforeState: before,
        afterState: after,

        humanJustification: approvalIntent.justification,
        systemReasoning,

        status: 'PROPOSED',
    };
}

/**
 * Confirm a policy proposal.
 * 
 * CRITICAL: NO POLICY APPLICATION
 * This only marks the proposal as CONFIRMED. It does NOT apply changes.
 * 
 * Phase 5A: Triggers policy learning derivation.
 */
export function confirmPolicyProposal(proposal: PolicyChangeProposal): PolicyChangeProposal {
    if (proposal.status !== 'PROPOSED') {
        throw new Error('Can only confirm PROPOSED proposals');
    }

    const confirmed: PolicyChangeProposal = {
        ...proposal,
        status: 'CONFIRMED' as const,
        confirmedAt: new Date().toISOString(),
    };

    // Phase 5A: Try to derive learned policy
    const learnedPolicy = tryDeriveLearnedPolicy(confirmed);
    if (learnedPolicy) {
        confirmed.learnedPolicyId = learnedPolicy.policyId;
        // Store in memory (Phase 5A - in-memory storage)
        learnedPoliciesStore.push(learnedPolicy);
    }

    return confirmed;
}

/**
 * Dismiss a policy proposal.
 * 
 * Marks the proposal as DISMISSED. System state remains unchanged.
 */
export function dismissPolicyProposal(proposal: PolicyChangeProposal): PolicyChangeProposal {
    if (proposal.status !== 'PROPOSED') {
        throw new Error('Can only dismiss PROPOSED proposals');
    }

    return {
        ...proposal,
        status: 'DISMISSED',
        dismissedAt: new Date().toISOString(),
    };
}

// ============================================================================
// PHASE 5A: LEARNED POLICY STORAGE
// ============================================================================

/**
 * In-memory storage for learned policies (Phase 5A).
 * 
 * Future phases may persist to database, but for Phase 5A we use
 * in-memory storage to demonstrate the concept without persistence complexity.
 */
const learnedPoliciesStore: LearnedPolicy[] = [];

/**
 * Try to derive a learned policy from a confirmed proposal.
 * 
 * CRITICAL: NO EXECUTION
 * This function creates a memory record only. No execution, no application.
 * 
 * @param proposal - CONFIRMED PolicyChangeProposal
 * @returns LearnedPolicy or null if derivation fails
 */
export function tryDeriveLearnedPolicy(proposal: PolicyChangeProposal): LearnedPolicy | null {
    try {
        return deriveLearnedPolicy(proposal);
    } catch (error) {
        console.error('Failed to derive learned policy:', error);
        return null;
    }
}

/**
 * Get all learned policies from in-memory store.
 * 
 * Returns a frozen copy to prevent mutation of the store.
 */
export function getAllLearnedPolicies(): ReadonlyArray<LearnedPolicy> {
    return Object.freeze([...learnedPoliciesStore]);
}

/**
 * Get a specific learned policy by ID.
 */
export function getLearnedPolicyById(id: string): LearnedPolicy | null {
    return learnedPoliciesStore.find(p => p.policyId === id) ?? null;
}

/**
 * Clear all learned policies (for testing/reset only).
 */
export function clearLearnedPolicies(): void {
    learnedPoliciesStore.length = 0;
}
