import { Agent, Domain, Organization } from '@/app/data/types';
import { AuthorityResult } from './deriveAuthority';
import { DoAction, DoActionState } from './deriveDoActions';

/**
 * Runtime Verdict Derivation Engine (Phase 3B)
 * 
 * Pure logic for deriving what would happen if an agent attempted a Do Action.
 * 
 * CRITICAL: NO EXECUTION
 * This module is purely explanatory. No Runtime calls, no side effects, no execution.
 * The verdict explains what WOULD happen, not what WILL happen.
 */

// ============================================================================
// CANONICAL CONTRACT (Phase 3B)
// ============================================================================

/**
 * RuntimeVerdict — Canonical Output Contract
 * 
 * This type MUST match the user-provided specification exactly.
 * No deviations, no extensions, no shortcuts.
 */
export type RuntimeVerdict = {
    verdictId: string;
    evaluatedAt: string;

    subject: {
        agentId: string;
        agentName: string;
        domainId: string;
        organizationId: string;
    };

    action: {
        actionId: string;
        actionName: string;
        actionCategory: 'READ' | 'WRITE' | 'DECIDE' | 'EXECUTE' | 'ESCALATE';
    };

    decision: {
        status: 'ALLOWED' | 'BLOCKED' | 'ESCALATION_REQUIRED';
        confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    };

    reasoning: {
        summary: string;
        appliedConstraints: Array<{
            source: 'ORGANIZATION' | 'DOMAIN' | 'AGENT' | 'EAPP' | 'RUNTIME';
            description: string;
        }>;
    };

    execution: {
        attempted: true;
        executed: false;
        executionPath: null;
    };

    escalation?: {
        required: true;
        reason: string;
        expectedApproverRole: string;
    };

    guarantees: {
        deterministic: true;
        reversible: true;
        persisted: false;
        executable: false;
    };
};

// ============================================================================
// DERIVATION ENGINE
// ============================================================================

/**
 * Derive a RuntimeVerdict for a specific agent attempting a specific Do Action.
 * 
 * This is the ONLY function that produces RuntimeVerdicts in the system.
 * Same input → same output (deterministic).
 */
export function deriveRuntimeVerdict(
    agent: Agent,
    doAction: DoAction,
    authority: AuthorityResult,
    domain: Domain,
    organization: Organization
): RuntimeVerdict {
    // Generate deterministic verdict ID
    const verdictId = generateVerdictId(agent.id, doAction.id);
    const evaluatedAt = new Date().toISOString();

    // Build subject information
    const subject = {
        agentId: agent.id,
        agentName: agent.name,
        domainId: domain.id,
        organizationId: organization.id,
    };

    // Build action information (map Do Action categories to verdict categories)
    const action = {
        actionId: doAction.id,
        actionName: doAction.verbPhrase,
        actionCategory: mapActionCategory(doAction.category),
    };

    // Derive decision based on Do Action state
    const decision = deriveDecision(doAction);

    // Build reasoning with constraint attribution
    const reasoning = deriveReasoning(
        doAction,
        agent,
        authority,
        domain,
        organization
    );

    // Build execution guarantee (always false in Phase 3B)
    const execution = {
        attempted: true as const,
        executed: false as const,
        executionPath: null,
    };

    // Build escalation object if needed
    const escalation = decision.status === 'ESCALATION_REQUIRED'
        ? deriveEscalation(doAction, agent, domain)
        : undefined;

    // Build guarantees (all static in Phase 3B)
    const guarantees = {
        deterministic: true as const,
        reversible: true as const,
        persisted: false as const,
        executable: false as const,
    };

    return {
        verdictId,
        evaluatedAt,
        subject,
        action,
        decision,
        reasoning,
        execution,
        escalation,
        guarantees,
    };
}

// ============================================================================
// DECISION DERIVATION
// ============================================================================

/**
 * Derive verdict decision based on Do Action state.
 * 
 * Mapping:
 * - ALLOWED → status: ALLOWED, confidence: HIGH
 * - BLOCKED → status: BLOCKED, confidence: HIGH
 * - RESTRICTED → status: ESCALATION_REQUIRED, confidence: MEDIUM
 */
function deriveDecision(doAction: DoAction): {
    status: 'ALLOWED' | 'BLOCKED' | 'ESCALATION_REQUIRED';
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
} {
    if (doAction.state === 'ALLOWED') {
        return {
            status: 'ALLOWED',
            confidence: 'HIGH',
        };
    }

    if (doAction.state === 'BLOCKED') {
        return {
            status: 'BLOCKED',
            confidence: 'HIGH',
        };
    }

    // RESTRICTED → requires escalation
    return {
        status: 'ESCALATION_REQUIRED',
        confidence: 'MEDIUM',
    };
}

// ============================================================================
// REASONING DERIVATION
// ============================================================================

/**
 * Derive reasoning with constraint attribution.
 * 
 * Processes constraints in canonical order:
 * 1. Organization
 * 2. Domain
 * 3. Agent
 * 4. EAPP (placeholder)
 * 5. Runtime
 */
function deriveReasoning(
    doAction: DoAction,
    agent: Agent,
    authority: AuthorityResult,
    domain: Domain,
    organization: Organization
): {
    summary: string;
    appliedConstraints: Array<{
        source: 'ORGANIZATION' | 'DOMAIN' | 'AGENT' | 'EAPP' | 'RUNTIME';
        description: string;
    }>;
} {
    const appliedConstraints: Array<{
        source: 'ORGANIZATION' | 'DOMAIN' | 'AGENT' | 'EAPP' | 'RUNTIME';
        description: string;
    }> = [];

    // Organization constraints
    if (organization.authorityCeiling < 3) {
        appliedConstraints.push({
            source: 'ORGANIZATION',
            description: `This organization limits how much authority its members can exercise.`,
        });
    }

    // Domain constraints
    if (domain.authorityCeiling < organization.authorityCeiling) {
        appliedConstraints.push({
            source: 'DOMAIN',
            description: `This domain restricts the scope of actions its agents can perform.`,
        });
    }

    // Agent constraints
    if (agent.autonomyLevel < authority.effectiveAuthorityLevel) {
        appliedConstraints.push({
            source: 'AGENT',
            description: `This agent is configured to operate with limited autonomy.`,
        });
    }

    if (agent.executionSurface === 'READ' && doAction.requiredSurface !== 'READ') {
        appliedConstraints.push({
            source: 'AGENT',
            description: `This agent is restricted to reading information.`,
        });
    }

    if (agent.executionSurface === 'WRITE' && doAction.requiredSurface === 'EXECUTE') {
        appliedConstraints.push({
            source: 'AGENT',
            description: `This agent can modify information but cannot take direct actions.`,
        });
    }

    if (agent.executionType === 'ADVISORY') {
        appliedConstraints.push({
            source: 'AGENT',
            description: `This agent provides recommendations and cannot act independently.`,
        });
    }

    if (agent.executionType === 'DECISION' && doAction.category === 'EXECUTION') {
        appliedConstraints.push({
            source: 'AGENT',
            description: `This agent can decide what should happen but cannot execute those decisions.`,
        });
    }

    // Runtime constraints (structural safety)
    appliedConstraints.push({
        source: 'RUNTIME',
        description: `No execution is permitted in the current system phase.`,
    });

    // Generate summary based on decision status
    const summary = generateSummary(doAction, agent);

    return {
        summary,
        appliedConstraints,
    };
}

/**
 * Generate human-readable summary sentence.
 * Uses plain language and focuses on consequences.
 */
function generateSummary(doAction: DoAction, agent: Agent): string {
    if (doAction.state === 'ALLOWED') {
        return `${agent.name} is permitted to ${doAction.verbPhrase.toLowerCase()}.`;
    }

    if (doAction.state === 'BLOCKED') {
        return `${agent.name} cannot ${doAction.verbPhrase.toLowerCase()} due to authority restrictions.`;
    }

    // RESTRICTED
    return `${agent.name} would need approval to ${doAction.verbPhrase.toLowerCase()}.`;
}

// ============================================================================
// ESCALATION DERIVATION
// ============================================================================

/**
 * Derive escalation information for ESCALATION_REQUIRED verdicts.
 */
function deriveEscalation(
    doAction: DoAction,
    agent: Agent,
    domain: Domain
): {
    required: true;
    reason: string;
    expectedApproverRole: string;
} {
    // Determine appropriate approver based on escalation behavior
    const expectedApproverRole = agent.escalationBehavior === 'HUMAN_REQUIRED'
        ? 'Human Operator'
        : 'Domain Administrator';

    return {
        required: true,
        reason: `This action requires higher authority than ${agent.name} currently has.`,
        expectedApproverRole,
    };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate deterministic verdict ID from agent and action IDs.
 */
function generateVerdictId(agentId: string, actionId: string): string {
    // Simple but deterministic: combine IDs with separator
    return `verdict_${agentId}_${actionId}_${Date.now()}`;
}

/**
 * Map Do Action category to Runtime Verdict action category.
 */
function mapActionCategory(
    doActionCategory: string
): 'READ' | 'WRITE' | 'DECIDE' | 'EXECUTE' | 'ESCALATE' {
    switch (doActionCategory) {
        case 'DATA_ACCESS':
            return 'READ';
        case 'DATA_MODIFICATION':
            return 'WRITE';
        case 'DECISION_MAKING':
            return 'DECIDE';
        case 'EXECUTION':
        case 'OPERATIONS':
            return 'EXECUTE';
        case 'ESCALATION':
            return 'ESCALATE';
        case 'REPORTING':
            return 'WRITE'; // Reports are a form of data output
        default:
            return 'READ'; // Safe default
    }
}
