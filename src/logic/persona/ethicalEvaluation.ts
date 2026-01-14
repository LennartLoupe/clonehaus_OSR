/**
 * Ethical Evaluation System (Phase 7B)
 * 
 * Binds PersonaIdentity to EAPP with non-overridable ethical veto.
 * 
 * CRITICAL PRINCIPLES:
 * - Ethics evaluation FIRST, before authority
 * - Cannot be bypassed by approvals or policy
 * - Deterministic, pure function (no side effects)
 * - If identity and authority conflict, ethics ALWAYS win
 * 
 * Purpose: Make ethics non-overridable.
 */

import { PersonaIdentity } from './personaIdentity';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Ethical verdict enumeration.
 */
export enum EthicalVerdict {
    /**
     * Action is compatible with agent's ethical frame.
     */
    ETHICS_ALLOWED = 'ETHICS_ALLOWED',

    /**
     * Action violates agent's ethical commitments.
     * This block CANNOT be overridden.
     */
    ETHICS_BLOCKED = 'ETHICS_BLOCKED',
}

/**
 * Result of ethical compatibility evaluation.
 */
export interface EthicalEvaluationResult {
    /**
     * Verdict: allowed or blocked.
     */
    verdict: EthicalVerdict;

    /**
     * One-sentence human explanation.
     * If blocked, states which commitment was violated.
     */
    explanation: string;

    /**
     * List of commitments that were violated (if any).
     */
    violatedCommitments: string[];
}

/**
 * Simplified proposed action for ethical evaluation.
 * 
 * Future phases will use richer action types.
 */
export interface ProposedAction {
    actionType: string;
    description: string;
    targetResource?: string;
    parameters?: Record<string, any>;
}

// ============================================================================
// ETHICAL EVALUATION (VETO LAYER)
// ============================================================================

/**
 * Evaluate ethical compatibility of a proposed action.
 * 
 * CRITICAL: DETERMINISTIC VETO
 * - Pure function, no side effects
 * - Evaluated BEFORE authority derivation
 * - Cannot be bypassed or overridden by any approval
 * - HIGH confidence when blocking
 * 
 * This is the ethical foundation that protects identity.
 * 
 * @param personaIdentity - Agent's identity with ethical frame
 * @param proposedAction - Action being evaluated
 * @returns Ethical verdict with explanation
 */
export function evaluateEthicalCompatibility(
    personaIdentity: PersonaIdentity,
    proposedAction: ProposedAction
): EthicalEvaluationResult {
    const violations: string[] = [];

    // Check against immutable commitments (hardest constraints)
    for (const commitment of personaIdentity.ethicalFrame.immutableCommitments) {
        if (actionViolatesCommitment(proposedAction, commitment)) {
            violations.push(commitment);
        }
    }

    // Check against operational constraints
    for (const constraint of personaIdentity.ethicalFrame.constraints) {
        if (actionViolatesConstraint(proposedAction, constraint)) {
            violations.push(constraint);
        }
    }

    // If any violations, block immediately
    if (violations.length > 0) {
        return {
            verdict: EthicalVerdict.ETHICS_BLOCKED,
            explanation: formatEthicalBlockReason(violations[0]),
            violatedCommitments: violations,
        };
    }

    // No violations - action is ethically compatible
    return {
        verdict: EthicalVerdict.ETHICS_ALLOWED,
        explanation: 'Action is compatible with agent\'s ethical frame.',
        violatedCommitments: [],
    };
}

// ============================================================================
// VIOLATION DETECTION (PATTERN MATCHING)
// ============================================================================

/**
 * Check if action violates an immutable commitment.
 * 
 * Pattern matching against commitment text.
 * Future phases may use more sophisticated matching.
 * 
 * @param action - Proposed action
 * @param commitment - Immutable commitment statement
 * @returns true if violation detected
 */
function actionViolatesCommitment(
    action: ProposedAction,
    commitment: string
): boolean {
    // Simple pattern matching (Phase 7B)
    // Future: semantic analysis, LLM evaluation

    const commitmentLower = commitment.toLowerCase();
    const actionDescLower = action.description.toLowerCase();
    const actionTypeLower = action.actionType.toLowerCase();

    // Example patterns:
    // "Cannot delete user data" → check for "delete" + "user data"
    // "Cannot bypass audit logs" → check for "bypass" + "audit"
    // "Never manipulate financial outcomes" → check for "manipulate" + "financial"

    // Extract key prohibition terms
    const prohibitions = [
        'cannot', 'never', 'must not', 'prohibited from',
        'not allowed', 'forbidden'
    ];

    let isProhibition = false;
    for (const term of prohibitions) {
        if (commitmentLower.includes(term)) {
            isProhibition = true;
            break;
        }
    }

    if (!isProhibition) {
        return false; // Not a prohibition statement
    }

    // Extract prohibited action keywords
    const keywords = extractKeywords(commitment);

    // Check if action description or type contains prohibited keywords
    for (const keyword of keywords) {
        if (actionDescLower.includes(keyword) || actionTypeLower.includes(keyword)) {
            return true; // Violation detected
        }
    }

    return false;
}

/**
 * Check if action violates an operational constraint.
 * 
 * Similar to commitment check but for softer constraints.
 * 
 * @param action - Proposed action
 * @param constraint - Operational constraint
 * @returns true if violation detected
 */
function actionViolatesConstraint(
    action: ProposedAction,
    constraint: string
): boolean {
    // Same pattern matching as commitments
    // In future, constraints might have different severity
    return actionViolatesCommitment(action, constraint);
}

/**
 * Extract keywords from commitment/constraint statement.
 * 
 * Simple keyword extraction for pattern matching.
 * Future: NLP, semantic understanding.
 * 
 * @param statement - Commitment or constraint text
 * @returns Array of keywords
 */
function extractKeywords(statement: string): string[] {
    const lower = statement.toLowerCase();

    // Remove common prohibition terms
    let cleaned = lower
        .replace(/cannot/g, '')
        .replace(/never/g, '')
        .replace(/must not/g, '')
        .replace(/not allowed/g, '')
        .replace(/prohibited from/g, '')
        .replace(/forbidden/g, '');

    // Split into words and filter
    const words = cleaned
        .split(/\s+/)
        .filter(w => w.length > 3) // Filter short words
        .filter(w => !['this', 'that', 'with', 'from', 'have'].includes(w));

    return words;
}

// ============================================================================
// EXPLANATION FORMATTING
// ============================================================================

/**
 * Format ethical block reason for display.
 * 
 * Pattern: "This action conflicts with the agent's ethical commitment
 * to [X]. This restriction cannot be overridden."
 * 
 * @param violation - Violated commitment/constraint
 * @returns Formatted explanation
 */
function formatEthicalBlockReason(violation: string): string {
    // Clean up violation text for readability
    let cleaned = violation.trim();

    // Remove leading prohibition terms for smoother reading
    cleaned = cleaned
        .replace(/^cannot\s+/i, '')
        .replace(/^never\s+/i, '')
        .replace(/^must not\s+/i, '')
        .replace(/^not allowed to\s+/i, '')
        .replace(/^prohibited from\s+/i, '');

    // Ensure first letter is lowercase for sentence flow
    if (cleaned.length > 0) {
        cleaned = cleaned.charAt(0).toLowerCase() + cleaned.slice(1);
    }

    return `This action conflicts with the agent's ethical commitment to ${cleaned}. This restriction cannot be overridden.`;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if an agent has any ethical constraints defined.
 * 
 * @param personaIdentity - Agent's identity
 * @returns true if ethical frame is non-empty
 */
export function hasEthicalConstraints(personaIdentity: PersonaIdentity): boolean {
    return (
        personaIdentity.ethicalFrame.immutableCommitments.length > 0 ||
        personaIdentity.ethicalFrame.constraints.length > 0 ||
        personaIdentity.ethicalFrame.eappPrinciples.length > 0
    );
}

/**
 * Get summary of ethical frame for display.
 * 
 * @param personaIdentity - Agent's identity
 * @returns Human-readable summary
 */
export function getEthicalFrameSummary(personaIdentity: PersonaIdentity): string {
    const { immutableCommitments, constraints, eappPrinciples } = personaIdentity.ethicalFrame;

    const parts: string[] = [];

    if (eappPrinciples.length > 0) {
        parts.push(`${eappPrinciples.length} EAPP principle(s)`);
    }

    if (immutableCommitments.length > 0) {
        parts.push(`${immutableCommitments.length} immutable commitment(s)`);
    }

    if (constraints.length > 0) {
        parts.push(`${constraints.length} operational constraint(s)`);
    }

    if (parts.length === 0) {
        return 'No ethical constraints defined';
    }

    return parts.join(', ');
}
