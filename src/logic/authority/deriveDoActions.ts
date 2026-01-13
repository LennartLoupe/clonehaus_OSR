import { Agent, Domain, Organization } from '@/app/data/types';
import { AuthorityResult } from './deriveAuthority';

/**
 * Do Action Derivation Engine (Phase 3A)
 * 
 * Pure logic for deriving specific, inspectable actions an agent could perform
 * based on its role, authority, and configuration.
 * 
 * CRITICAL: NO EXECUTION PATHS
 * This module is purely informational. No Runtime calls, no side effects.
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Action category - conceptual grouping of action types
 */
export type DoActionCategory =
    | 'DATA_ACCESS'
    | 'DATA_MODIFICATION'
    | 'DECISION_MAKING'
    | 'EXECUTION'
    | 'ESCALATION'
    | 'REPORTING'
    | 'OPERATIONS';

/**
 * Availability state - deterministic outcome of authority derivation
 */
export type DoActionState = 'ALLOWED' | 'RESTRICTED' | 'BLOCKED';

/**
 * A Do action is a declared, inspectable intent
 */
export interface DoAction {
    /** Unique identifier for this action */
    id: string;

    /** Human-readable verb phrase (e.g., "Reply to customer inquiry") */
    verbPhrase: string;

    /** Conceptual category this action belongs to */
    category: DoActionCategory;

    /** Minimum authority level required */
    requiredAuthority: number;

    /** Execution surface required (READ, WRITE, or EXECUTE) */
    requiredSurface: 'READ' | 'WRITE' | 'EXECUTE';

    /** Current availability state (derived) */
    state: DoActionState;

    /** Human-readable explanation of current state */
    reason: string;
}

/**
 * Collection of Do actions for an agent
 */
export interface DoActionSurface {
    actions: DoAction[];
}

// ============================================================================
// DERIVATION ENGINE
// ============================================================================

/**
 * Derive Do actions for an agent based on role, authority, and configuration.
 * Returns a deterministic list of actions with availability states.
 */
export function deriveDoActions(
    agent: Agent,
    authority: AuthorityResult,
    domain: Domain,
    organization: Organization
): DoActionSurface {
    // Get role-specific action templates
    const actionTemplates = getActionTemplatesForRole(agent.role);

    // Derive state for each action based on authority and configuration
    const actions = actionTemplates.map((template) =>
        deriveActionState(template, agent, authority)
    );

    return { actions };
}

// ============================================================================
// ROLE-BASED ACTION TEMPLATES
// ============================================================================

interface ActionTemplate {
    id: string;
    verbPhrase: string;
    category: DoActionCategory;
    requiredAuthority: number;
    requiredSurface: 'READ' | 'WRITE' | 'EXECUTE';
}

/**
 * Get action templates based on agent role.
 * These represent the conceptual capabilities an agent in this role might have.
 */
function getActionTemplatesForRole(role: string): ActionTemplate[] {
    const roleLower = role.toLowerCase();

    // Support-related roles
    if (roleLower.includes('support') || roleLower.includes('customer')) {
        return [
            {
                id: 'support_view_ticket',
                verbPhrase: 'View customer ticket',
                category: 'DATA_ACCESS',
                requiredAuthority: 0,
                requiredSurface: 'READ',
            },
            {
                id: 'support_reply_inquiry',
                verbPhrase: 'Reply to customer inquiry',
                category: 'DATA_MODIFICATION',
                requiredAuthority: 1,
                requiredSurface: 'WRITE',
            },
            {
                id: 'support_update_status',
                verbPhrase: 'Update ticket status',
                category: 'DATA_MODIFICATION',
                requiredAuthority: 1,
                requiredSurface: 'WRITE',
            },
            {
                id: 'support_escalate',
                verbPhrase: 'Escalate to specialist',
                category: 'ESCALATION',
                requiredAuthority: 1,
                requiredSurface: 'WRITE',
            },
            {
                id: 'support_close_ticket',
                verbPhrase: 'Close support ticket',
                category: 'DECISION_MAKING',
                requiredAuthority: 2,
                requiredSurface: 'WRITE',
            },
        ];
    }

    // Analyst-related roles
    if (roleLower.includes('analyst') || roleLower.includes('analytics')) {
        return [
            {
                id: 'analyst_view_data',
                verbPhrase: 'View analytics data',
                category: 'DATA_ACCESS',
                requiredAuthority: 0,
                requiredSurface: 'READ',
            },
            {
                id: 'analyst_export_data',
                verbPhrase: 'Export analytics data',
                category: 'DATA_ACCESS',
                requiredAuthority: 1,
                requiredSurface: 'READ',
            },
            {
                id: 'analyst_generate_report',
                verbPhrase: 'Generate compliance report',
                category: 'REPORTING',
                requiredAuthority: 2,
                requiredSurface: 'WRITE',
            },
            {
                id: 'analyst_schedule_job',
                verbPhrase: 'Schedule analysis job',
                category: 'EXECUTION',
                requiredAuthority: 2,
                requiredSurface: 'EXECUTE',
            },
            {
                id: 'analyst_approve_findings',
                verbPhrase: 'Approve analysis findings',
                category: 'DECISION_MAKING',
                requiredAuthority: 3,
                requiredSurface: 'WRITE',
            },
        ];
    }

    // Operations-related roles
    if (roleLower.includes('ops') || roleLower.includes('operations') || roleLower.includes('devops')) {
        return [
            {
                id: 'ops_view_logs',
                verbPhrase: 'View system logs',
                category: 'DATA_ACCESS',
                requiredAuthority: 0,
                requiredSurface: 'READ',
            },
            {
                id: 'ops_update_config',
                verbPhrase: 'Update configuration',
                category: 'DATA_MODIFICATION',
                requiredAuthority: 2,
                requiredSurface: 'WRITE',
            },
            {
                id: 'ops_restart_service',
                verbPhrase: 'Restart service',
                category: 'EXECUTION',
                requiredAuthority: 2,
                requiredSurface: 'EXECUTE',
            },
            {
                id: 'ops_deploy_staging',
                verbPhrase: 'Deploy to staging',
                category: 'EXECUTION',
                requiredAuthority: 2,
                requiredSurface: 'EXECUTE',
            },
            {
                id: 'ops_deploy_production',
                verbPhrase: 'Deploy to production',
                category: 'EXECUTION',
                requiredAuthority: 3,
                requiredSurface: 'EXECUTE',
            },
        ];
    }

    // Default/generic actions for other roles
    return [
        {
            id: 'generic_read_info',
            verbPhrase: 'Read information',
            category: 'DATA_ACCESS',
            requiredAuthority: 0,
            requiredSurface: 'READ',
        },
        {
            id: 'generic_update_record',
            verbPhrase: 'Update record',
            category: 'DATA_MODIFICATION',
            requiredAuthority: 1,
            requiredSurface: 'WRITE',
        },
        {
            id: 'generic_make_decision',
            verbPhrase: 'Make autonomous decision',
            category: 'DECISION_MAKING',
            requiredAuthority: 2,
            requiredSurface: 'WRITE',
        },
        {
            id: 'generic_execute_action',
            verbPhrase: 'Execute system action',
            category: 'EXECUTION',
            requiredAuthority: 2,
            requiredSurface: 'EXECUTE',
        },
        {
            id: 'generic_escalate',
            verbPhrase: 'Escalate to human',
            category: 'ESCALATION',
            requiredAuthority: 0,
            requiredSurface: 'READ',
        },
    ];
}

// ============================================================================
// STATE DERIVATION
// ============================================================================

/**
 * Derive the availability state for a single action template.
 * Uses authority derivation and agent configuration to determine state.
 */
function deriveActionState(
    template: ActionTemplate,
    agent: Agent,
    authority: AuthorityResult
): DoAction {
    // Check execution surface compatibility
    const surfaceCheck = checkExecutionSurface(template.requiredSurface, agent.executionSurface);
    if (!surfaceCheck.allowed) {
        return {
            ...template,
            state: 'BLOCKED',
            reason: surfaceCheck.reason,
        };
    }

    // Check execution type compatibility
    const typeCheck = checkExecutionType(template.category, agent.executionType);
    if (!typeCheck.allowed) {
        return {
            ...template,
            state: 'BLOCKED',
            reason: typeCheck.reason,
        };
    }

    // Check authority level
    const authorityCheck = checkAuthorityLevel(
        template.requiredAuthority,
        authority.effectiveAuthorityLevel
    );
    if (!authorityCheck.allowed) {
        return {
            ...template,
            state: authorityCheck.restricted ? 'RESTRICTED' : 'BLOCKED',
            reason: authorityCheck.reason,
        };
    }

    // All checks passed - action is allowed
    return {
        ...template,
        state: 'ALLOWED',
        reason: 'This agent is permitted to perform this action.',
    };
}

/**
 * Check if agent's execution surface supports the required surface
 */
function checkExecutionSurface(
    required: 'READ' | 'WRITE' | 'EXECUTE',
    agentSurface: 'READ' | 'WRITE' | 'EXECUTE'
): { allowed: boolean; reason: string } {
    const surfaceHierarchy = { READ: 1, WRITE: 2, EXECUTE: 3 };

    if (surfaceHierarchy[agentSurface] >= surfaceHierarchy[required]) {
        return { allowed: true, reason: '' };
    }

    if (required === 'WRITE' && agentSurface === 'READ') {
        return {
            allowed: false,
            reason: 'This agent is restricted to reading information.',
        };
    }

    if (required === 'EXECUTE' && agentSurface !== 'EXECUTE') {
        return {
            allowed: false,
            reason: 'This agent is not configured to execute actions.',
        };
    }

    return {
        allowed: false,
        reason: 'This action requires a higher execution surface than this agent has.',
    };
}

/**
 * Check if agent's execution type supports the action category
 */
function checkExecutionType(
    category: DoActionCategory,
    executionType: 'ADVISORY' | 'DECISION' | 'EXECUTION'
): { allowed: boolean; reason: string } {
    // ADVISORY agents can only read/report
    if (executionType === 'ADVISORY') {
        if (category === 'DATA_ACCESS' || category === 'REPORTING') {
            return { allowed: true, reason: '' };
        }
        return {
            allowed: false,
            reason: 'This agent provides recommendations and cannot take direct actions.',
        };
    }

    // DECISION agents cannot execute
    if (executionType === 'DECISION') {
        if (category === 'EXECUTION' || category === 'OPERATIONS') {
            return {
                allowed: false,
                reason: 'This agent can decide what should happen but cannot execute decisions.',
            };
        }
        return { allowed: true, reason: '' };
    }

    // EXECUTION agents can do everything
    return { allowed: true, reason: '' };
}

/**
 * Check if agent's authority level meets the required level
 */
function checkAuthorityLevel(
    required: number,
    effective: number
): { allowed: boolean; restricted: boolean; reason: string } {
    if (effective >= required) {
        return { allowed: true, restricted: false, reason: '' };
    }

    // Close to required - restricted
    if (effective === required - 1) {
        return {
            allowed: false,
            restricted: true,
            reason: `This action requires higher authority than this agent currently has (needs ${required}, has ${effective}).`,
        };
    }

    // Far from required - blocked
    return {
        allowed: false,
        restricted: false,
        reason: `This action requires authority level ${required}, but this agent has level ${effective}.`,
    };
}
