import { Agent, Domain, Organization } from '@/app/data/types';
import { AuthorityResult } from './deriveAuthority';

/**
 * Action Surface Derivation (Phase 2C.1)
 * 
 * Pure logic for deriving what actions an agent can perform
 * based on authority, execution surface, and execution type.
 * 
 * NO EXECUTION - Visualization only.
 */

// ============================================================================
// TYPES
// ============================================================================

export type ActionCategory =
    | 'READ_DATA'
    | 'WRITE_DATA'
    | 'MAKE_DECISIONS'
    | 'EXECUTE_ACTIONS'
    | 'ESCALATE_HUMAN';

export type ActionState = 'ALLOWED' | 'RESTRICTED' | 'BLOCKED';

export interface ActionStatus {
    category: ActionCategory;
    label: string;
    state: ActionState;
    reason: string;
}

export interface ActionSurface {
    actions: ActionStatus[];
}

// ============================================================================
// ACTION DERIVATION
// ============================================================================

/**
 * Derive action surface for an agent.
 * Determines what actions are allowed, restricted, or blocked.
 */
export function deriveActionSurface(
    agent: Agent,
    authority: AuthorityResult,
    domain: Domain,
    organization: Organization
): ActionSurface {
    const actions: ActionStatus[] = [
        deriveReadDataAction(agent, authority),
        deriveWriteDataAction(agent, authority),
        deriveMakeDecisionsAction(agent, authority),
        deriveExecuteActionsAction(agent, authority),
        deriveEscalateHumanAction(agent, authority),
    ];

    return { actions };
}

// ============================================================================
// INDIVIDUAL ACTION DERIVATIONS
// ============================================================================

/**
 * Read Data - Always allowed for READ or higher execution surface
 */
function deriveReadDataAction(agent: Agent, authority: AuthorityResult): ActionStatus {
    // All agents can read data (minimum execution surface)
    return {
        category: 'READ_DATA',
        label: 'Read Data',
        state: 'ALLOWED',
        reason: 'This agent is allowed to view information.',
    };
}

/**
 * Write Data - Requires WRITE or EXECUTE surface
 */
function deriveWriteDataAction(agent: Agent, authority: AuthorityResult): ActionStatus {
    if (agent.executionSurface === 'READ') {
        return {
            category: 'WRITE_DATA',
            label: 'Write Data',
            state: 'BLOCKED',
            reason: 'This agent is restricted to reading information.',
        };
    }

    if (agent.executionType === 'ADVISORY') {
        return {
            category: 'WRITE_DATA',
            label: 'Write Data',
            state: 'BLOCKED',
            reason: 'This agent can advise but cannot modify data on its own.',
        };
    }

    // Check authority level
    if (authority.effectiveAuthorityLevel < 2) {
        return {
            category: 'WRITE_DATA',
            label: 'Write Data',
            state: 'RESTRICTED',
            reason: 'This action is limited by the agent\'s assigned authority level.',
        };
    }

    return {
        category: 'WRITE_DATA',
        label: 'Write Data',
        state: 'ALLOWED',
        reason: 'This agent is permitted to modify information.',
    };
}

/**
 * Make Decisions - Requires DECISION or EXECUTION type
 */
function deriveMakeDecisionsAction(agent: Agent, authority: AuthorityResult): ActionStatus {
    if (agent.executionType === 'ADVISORY') {
        return {
            category: 'MAKE_DECISIONS',
            label: 'Make Decisions',
            state: 'BLOCKED',
            reason: 'This agent provides recommendations and cannot make decisions independently.',
        };
    }

    if (authority.effectiveAuthorityLevel < 1) {
        return {
            category: 'MAKE_DECISIONS',
            label: 'Make Decisions',
            state: 'BLOCKED',
            reason: 'This agent\'s authority level does not permit decision-making.',
        };
    }

    if (authority.effectiveAuthorityLevel < 2) {
        return {
            category: 'MAKE_DECISIONS',
            label: 'Make Decisions',
            state: 'RESTRICTED',
            reason: 'This agent can make decisions within a limited scope.',
        };
    }

    return {
        category: 'MAKE_DECISIONS',
        label: 'Make Decisions',
        state: 'ALLOWED',
        reason: 'This agent is permitted to make decisions.',
    };
}

/**
 * Execute Actions - Requires EXECUTION type and EXECUTE surface
 */
function deriveExecuteActionsAction(agent: Agent, authority: AuthorityResult): ActionStatus {
    if (agent.executionSurface !== 'EXECUTE') {
        return {
            category: 'EXECUTE_ACTIONS',
            label: 'Execute Actions',
            state: 'BLOCKED',
            reason: 'This agent is not configured to take direct actions.',
        };
    }

    if (agent.executionType !== 'EXECUTION') {
        return {
            category: 'EXECUTE_ACTIONS',
            label: 'Execute Actions',
            state: 'BLOCKED',
            reason: 'This agent\'s role does not include taking direct actions.',
        };
    }

    if (authority.effectiveAuthorityLevel < 3) {
        return {
            category: 'EXECUTE_ACTIONS',
            label: 'Execute Actions',
            state: 'RESTRICTED',
            reason: 'This agent can take actions but only within a limited scope.',
        };
    }

    return {
        category: 'EXECUTE_ACTIONS',
        label: 'Execute Actions',
        state: 'ALLOWED',
        reason: 'This agent is permitted to take direct actions.',
    };
}

/**
 * Escalate to Human - Based on escalation behavior
 */
function deriveEscalateHumanAction(agent: Agent, authority: AuthorityResult): ActionStatus {
    if (agent.escalationBehavior === 'HUMAN_REQUIRED') {
        return {
            category: 'ESCALATE_HUMAN',
            label: 'Escalate to Human',
            state: 'ALLOWED',
            reason: 'Actions at this level require human involvement.',
        };
    }

    // AUTO escalation is allowed but not required
    return {
        category: 'ESCALATE_HUMAN',
        label: 'Escalate to Human',
        state: 'ALLOWED',
        reason: 'This agent can request human guidance when appropriate.',
    };
}
