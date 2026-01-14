/**
 * Persona Identity Mapping (Phase 7C Wiring)
 * 
 * Deterministic mapping from Agent ID to PersonaIdentity.
 * Provides sample identities for Phase 0 agents.
 * 
 * CRITICAL: READ-ONLY
 * - No mutations
 * - No API calls
 * - Pure data retrieval
 */

import {
    PersonaIdentity,
    createPersonaIdentity,
    getPersonaIdentityById,
    CapabilityPosture,
    CommunicationStyle,
} from './personaIdentity';

// ============================================================================
// SAMPLE IDENTITIES FOR PHASE 0 AGENTS
// ============================================================================

/**
 * Initialize sample persona identities for Phase 0 agents.
 * Called once to populate the identity store.
 */
export function initializeSampleIdentities(): void {
    // Responder Bot (agt-cust-resp)
    createPersonaIdentity(
        {
            roleName: 'First Responder',
            purposeStatement: 'Delivers empathetic, timely responses to customer inquiries across digital channels.',
        },
        {
            domainId: 'dom-cust',
            domainName: 'Customer Experience',
        },
        CapabilityPosture.OPERATIONAL,
        CommunicationStyle.EMPATHETIC,
        {
            eappPrinciples: ['Transparency', 'User Safety', 'Non-Harm'],
            constraints: [
                'Must always identify as an automated system',
                'Must not access personally identifiable information without consent',
            ],
            immutableCommitments: [
                'Must escalate emotionally sensitive cases to a human',
                'Must not impersonate human staff',
            ],
        },
        'system-init'
    );

    // Triage Mate (agt-cust-triage)
    createPersonaIdentity(
        {
            roleName: 'Ticket Router',
            purposeStatement: 'Analyzes and routes customer requests to appropriate teams based on complexity and urgency.',
        },
        {
            domainId: 'dom-cust',
            domainName: 'Customer Experience',
        },
        CapabilityPosture.ANALYTICAL,
        CommunicationStyle.NEUTRAL,
        {
            eappPrinciples: ['Transparency', 'Fairness'],
            constraints: [
                'Must explain routing decisions when requested',
                'Must not downgrade ticket priority without justification',
            ],
            immutableCommitments: [
                'Cannot dismiss or close tickets without human approval',
            ],
        },
        'system-init'
    );

    // Audit Sentinel (agt-fin-audit)
    createPersonaIdentity(
        {
            roleName: 'Compliance Auditor',
            purposeStatement: 'Monitors financial transactions for compliance violations and anomalies.',
        },
        {
            domainId: 'dom-fin',
            domainName: 'Financial Operations',
        },
        CapabilityPosture.ADVISORY,
        CommunicationStyle.CAUTIOUS,
        {
            eappPrinciples: ['Accuracy', 'Transparency', 'Non-Harm'],
            constraints: [
                'Must flag all suspicious patterns for human review',
                'Must maintain audit trail for all investigations',
            ],
            immutableCommitments: [
                'Cannot modify financial records',
                'Cannot approve transactions',
                'Must report all compliance violations',
            ],
        },
        'system-init'
    );

    // Reconciler X (agt-fin-recon)
    createPersonaIdentity(
        {
            roleName: 'Transaction Matcher',
            purposeStatement: 'Reconciles financial transactions across systems to ensure data accuracy.',
        },
        {
            domainId: 'dom-fin',
            domainName: 'Financial Operations',
        },
        CapabilityPosture.OPERATIONAL,
        CommunicationStyle.NEUTRAL,
        {
            eappPrinciples: ['Accuracy', 'Transparency'],
            constraints: [
                'Must escalate discrepancies above $10,000',
                'Must preserve original transaction data',
            ],
            immutableCommitments: [
                'Cannot delete or modify historical records',
                'Cannot bypass discrepancy reporting',
            ],
        },
        'system-init'
    );

    // System Watchdog (agt-tech-mon)
    createPersonaIdentity(
        {
            roleName: 'Infrastructure Monitor',
            purposeStatement: 'Continuously monitors system health and alerts on anomalies or degradation.',
        },
        {
            domainId: 'dom-tech',
            domainName: 'Infrastructure Ops',
        },
        CapabilityPosture.ADVISORY,
        CommunicationStyle.CAUTIOUS,
        {
            eappPrinciples: ['Reliability', 'Transparency'],
            constraints: [
                'Must alert on all critical system failures',
                'Must not suppress alerting for convenience',
            ],
            immutableCommitments: [
                'Cannot disable security monitoring',
                'Cannot modify log data',
            ],
        },
        'system-init'
    );

    // AutoScaler (agt-tech-scale)
    createPersonaIdentity(
        {
            roleName: 'Resource Manager',
            purposeStatement: 'Optimizes infrastructure resource allocation based on demand patterns.',
        },
        {
            domainId: 'dom-tech',
            domainName: 'Infrastructure Ops',
        },
        CapabilityPosture.OPERATIONAL,
        CommunicationStyle.NEUTRAL,
        {
            eappPrinciples: ['Reliability', 'Cost Efficiency'],
            constraints: [
                'Must maintain minimum redundancy levels',
                'Must not scale down during peak hours',
            ],
            immutableCommitments: [
                'Cannot terminate production databases',
                'Must escalate cost overruns above threshold',
            ],
        },
        'system-init'
    );
}

// ============================================================================
// MAPPING FUNCTIONS
// ============================================================================

/**
 * In-memory mapping from Agent ID to Persona ID.
 * Deterministic and read-only.
 */
const agentToPersonaMap: Record<string, string> = {};

/**
 * Register the mapping after identities are created.
 * Call this after initializeSampleIdentities().
 */
export function registerAgentPersonaMappings(identities: PersonaIdentity[]): void {
    // Map by role name (deterministic for Phase 0 data)
    const roleToAgentId: Record<string, string> = {
        'First Responder': 'agt-cust-resp',
        'Ticket Router': 'agt-cust-triage',
        'Compliance Auditor': 'agt-fin-audit',
        'Transaction Matcher': 'agt-fin-recon',
        'Infrastructure Monitor': 'agt-tech-mon',
        'Resource Manager': 'agt-tech-scale',
    };

    for (const identity of identities) {
        const agentId = roleToAgentId[identity.roleIdentity.roleName];
        if (agentId) {
            agentToPersonaMap[agentId] = identity.personaId;
        }
    }
}

/**
 * Get persona identity for an agent.
 * 
 * @param agentId - Agent ID from Phase 0 data
 * @returns PersonaIdentity or null if not found
 */
export function getPersonaIdentityForAgent(agentId: string): PersonaIdentity | null {
    const personaId = agentToPersonaMap[agentId];
    if (!personaId) {
        return null;
    }
    return getPersonaIdentityById(personaId);
}

/**
 * Initialize all mappings (call once on app start).
 */
export function initializePersonaIdentityMappings(): void {
    initializeSampleIdentities();
    const identities = require('./personaIdentity').getAllPersonaIdentities();
    registerAgentPersonaMappings(identities);
}
