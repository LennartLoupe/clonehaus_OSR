import { Organization, Domain, Agent } from '@/app/data/types';

/**
 * Authority Derivation Engine (T4)
 * 
 * Pure, deterministic logic for deriving authority levels and explaining inheritance chains.
 * No side effects, no UI dependencies, fully testable in isolation.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface AuthoritySourcePathEntry {
    level: 'ORGANIZATION' | 'DOMAIN' | 'AGENT';
    name: string;
    ceiling: number;
}

export interface AuthorityReasonStep {
    level: 'ORGANIZATION' | 'DOMAIN' | 'AGENT';
    rule: string;
    impact: 'ALLOW' | 'RESTRICT';
    detail: string;
}

export interface AuthorityResult {
    effectiveAuthorityLevel: number;
    authoritySourcePath: AuthoritySourcePathEntry[];
    blockedActions: string[];
    reasoning: AuthorityReasonStep[];  // T5: Explanation layer
}

// ============================================================================
// ORGANIZATION AUTHORITY
// ============================================================================

/**
 * Derive authority for an organization node.
 * Organization is the root, so it sets the absolute ceiling.
 */
export function deriveOrganizationAuthority(org: Organization): AuthorityResult {
    const effectiveAuthorityLevel = org.authorityCeiling;

    const authoritySourcePath: AuthoritySourcePathEntry[] = [
        {
            level: 'ORGANIZATION',
            name: org.name,
            ceiling: org.authorityCeiling,
        },
    ];

    const blockedActions: string[] = [];

    // Derive blocked actions based on organization ceiling
    if (org.authorityCeiling < 3) {
        blockedActions.push('Blocked: Organization authority ceiling is below maximum (3)');
    }
    if (org.authorityCeiling < 2) {
        blockedActions.push('Blocked: Organization authority ceiling restricts mid-level actions');
    }
    if (org.authorityCeiling < 1) {
        blockedActions.push('Blocked: Organization authority ceiling restricts all non-advisory actions');
    }

    // T5: Build reasoning explanation
    const reasoning: AuthorityReasonStep[] = [
        {
            level: 'ORGANIZATION',
            rule: `Organization authority ceiling = ${org.authorityCeiling}`,
            impact: 'ALLOW',
            detail: `This organization establishes the maximum level of authority available.`,
        },
    ];

    return {
        effectiveAuthorityLevel,
        authoritySourcePath,
        blockedActions,
        reasoning,
    };
}

// ============================================================================
// DOMAIN AUTHORITY
// ============================================================================

/**
 * Derive authority for a domain node.
 * Domain inherits from organization and can only reduce authority, never increase.
 */
export function deriveDomainAuthority(org: Organization, domain: Domain): AuthorityResult {
    // Effective authority is the minimum of org and domain ceilings
    const effectiveAuthorityLevel = Math.min(org.authorityCeiling, domain.authorityCeiling);

    const authoritySourcePath: AuthoritySourcePathEntry[] = [
        {
            level: 'ORGANIZATION',
            name: org.name,
            ceiling: org.authorityCeiling,
        },
        {
            level: 'DOMAIN',
            name: domain.name,
            ceiling: domain.authorityCeiling,
        },
    ];

    const blockedActions: string[] = [];

    // Check if domain ceiling restricts authority below organization
    if (domain.authorityCeiling < org.authorityCeiling) {
        blockedActions.push(
            `Blocked: Domain authority ceiling (${domain.authorityCeiling}) is lower than organization ceiling (${org.authorityCeiling})`
        );
    }

    // Derive blocked actions based on effective authority level
    if (effectiveAuthorityLevel < 3) {
        blockedActions.push(`Blocked: Effective authority level (${effectiveAuthorityLevel}) restricts high-authority actions`);
    }
    if (effectiveAuthorityLevel < 2) {
        blockedActions.push(`Blocked: Effective authority level (${effectiveAuthorityLevel}) restricts mid-level actions`);
    }
    if (effectiveAuthorityLevel < 1) {
        blockedActions.push(`Blocked: Effective authority level (${effectiveAuthorityLevel}) restricts all non-advisory actions`);
    }

    // T5: Build reasoning explanation
    const reasoning: AuthorityReasonStep[] = [
        {
            level: 'ORGANIZATION',
            rule: `Organization authority ceiling = ${org.authorityCeiling}`,
            impact: 'ALLOW',
            detail: `This organization allows its domains and agents to operate with full authority.`,
        },
    ];

    if (domain.authorityCeiling < org.authorityCeiling) {
        reasoning.push({
            level: 'DOMAIN',
            rule: `Domain authority ceiling = ${domain.authorityCeiling}`,
            impact: 'RESTRICT',
            detail: `This domain limits how much authority its agents can use.`,
        });
    } else {
        reasoning.push({
            level: 'DOMAIN',
            rule: `Domain authority ceiling = ${domain.authorityCeiling}`,
            impact: 'ALLOW',
            detail: `This domain maintains the organization's authority level.`,
        });
    }

    return {
        effectiveAuthorityLevel,
        authoritySourcePath,
        blockedActions,
        reasoning,
    };
}

// ============================================================================
// AGENT AUTHORITY
// ============================================================================

/**
 * Derive authority for an agent node.
 * Agent inherits from organization → domain chain and applies its own configuration.
 */
export function deriveAgentAuthority(
    org: Organization,
    domain: Domain,
    agent: Agent
): AuthorityResult {
    // Effective authority is the minimum across the full chain
    const effectiveAuthorityLevel = Math.min(
        org.authorityCeiling,
        domain.authorityCeiling,
        agent.autonomyLevel
    );

    const authoritySourcePath: AuthoritySourcePathEntry[] = [
        {
            level: 'ORGANIZATION',
            name: org.name,
            ceiling: org.authorityCeiling,
        },
        {
            level: 'DOMAIN',
            name: domain.name,
            ceiling: domain.authorityCeiling,
        },
        {
            level: 'AGENT',
            name: agent.name,
            ceiling: agent.autonomyLevel,
        },
    ];

    const blockedActions: string[] = [];

    // Check inheritance chain restrictions
    if (domain.authorityCeiling < org.authorityCeiling) {
        blockedActions.push(
            `Blocked: Domain ceiling (${domain.authorityCeiling}) reduces organization ceiling (${org.authorityCeiling})`
        );
    }

    if (agent.autonomyLevel < domain.authorityCeiling) {
        blockedActions.push(
            `Blocked: Agent autonomy level (${agent.autonomyLevel}) is lower than domain ceiling (${domain.authorityCeiling})`
        );
    }

    if (agent.autonomyLevel < org.authorityCeiling) {
        blockedActions.push(
            `Blocked: Agent autonomy level (${agent.autonomyLevel}) is lower than organization ceiling (${org.authorityCeiling})`
        );
    }

    // Execution surface restrictions
    if (agent.executionSurface === 'READ') {
        blockedActions.push('Blocked: Agent execution surface is READ-only (no WRITE or EXECUTE)');
    } else if (agent.executionSurface === 'WRITE') {
        blockedActions.push('Blocked: Agent execution surface does not allow EXECUTE actions');
    }

    // Execution type restrictions
    if (agent.executionType === 'ADVISORY') {
        blockedActions.push('Blocked: Agent execution type is ADVISORY (recommendations only, no direct actions)');
    } else if (agent.executionType === 'DECISION') {
        blockedActions.push('Blocked: Agent execution type is DECISION (can decide but cannot execute)');
    }

    // Escalation behavior context
    if (agent.escalationBehavior === 'HUMAN_REQUIRED') {
        blockedActions.push('Blocked: Agent requires human approval for escalations (cannot auto-escalate)');
    }

    // Authority level restrictions
    if (effectiveAuthorityLevel < 3) {
        blockedActions.push(`Blocked: Effective authority (${effectiveAuthorityLevel}) restricts high-risk operations`);
    }
    if (effectiveAuthorityLevel < 2) {
        blockedActions.push(`Blocked: Effective authority (${effectiveAuthorityLevel}) restricts moderate-risk operations`);
    }
    if (effectiveAuthorityLevel < 1) {
        blockedActions.push(`Blocked: Effective authority (${effectiveAuthorityLevel}) restricts all non-advisory operations`);
    }

    // T5: Build reasoning explanation
    const reasoning: AuthorityReasonStep[] = [
        {
            level: 'ORGANIZATION',
            rule: `Organization authority ceiling = ${org.authorityCeiling}`,
            impact: 'ALLOW',
            detail: `This organization allows its domains and agents to operate with full authority.`,
        },
    ];

    if (domain.authorityCeiling < org.authorityCeiling) {
        reasoning.push({
            level: 'DOMAIN',
            rule: `Domain authority ceiling = ${domain.authorityCeiling}`,
            impact: 'RESTRICT',
            detail: `This domain restricts the scope of actions its agents can perform.`,
        });
    } else {
        reasoning.push({
            level: 'DOMAIN',
            rule: `Domain authority ceiling = ${domain.authorityCeiling}`,
            impact: 'ALLOW',
            detail: `This domain maintains the organization's level of authority.`,
        });
    }

    // Agent-specific reasoning
    const agentReason: AuthorityReasonStep = {
        level: 'AGENT',
        rule: `Agent autonomy level = ${agent.autonomyLevel}, execution surface = ${agent.executionSurface}`,
        impact: agent.autonomyLevel < effectiveAuthorityLevel ? 'RESTRICT' : 'ALLOW',
        detail: '',
    };

    if (agent.autonomyLevel < Math.min(org.authorityCeiling, domain.authorityCeiling)) {
        agentReason.detail = `This agent is configured to operate with limited autonomy.`;
    } else if (agent.executionSurface === 'READ') {
        agentReason.detail = `This agent is restricted to reading information.`;
        agentReason.impact = 'RESTRICT';
    } else if (agent.executionSurface === 'WRITE') {
        agentReason.detail = `This agent can modify information but cannot take direct actions.`;
        agentReason.impact = 'RESTRICT';
    } else if (agent.executionType === 'ADVISORY') {
        agentReason.detail = `This agent provides recommendations and cannot act independently.`;
        agentReason.impact = 'RESTRICT';
    } else if (agent.executionType === 'DECISION') {
        agentReason.detail = `This agent can decide what should happen but cannot execute those decisions.`;
        agentReason.impact = 'RESTRICT';
    } else {
        agentReason.detail = `This agent is permitted to operate within its assigned scope.`;
    }

    reasoning.push(agentReason);

    return {
        effectiveAuthorityLevel,
        authoritySourcePath,
        blockedActions,
        reasoning,
    };
}
