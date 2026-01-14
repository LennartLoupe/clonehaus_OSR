/**
 * Persona Identity System (Phase 7A)
 * 
 * Defines immutable PersonaIdentity based on the Layered Persona System (LPS).
 * 
 * CRITICAL PRINCIPLES:
 * - Identity is IMMUTABLE after creation
 * - Identity exists BEFORE authority, policy, and execution
 * - Identity defines WHO an agent is, not WHAT it can do
 * - NO runtime mutation, NO policy learning hooks, NO execution paths
 * 
 * LPS Identity Layers (Canonical Order):
 * L1: Role Identity
 * L2: Domain Belonging
 * L3: Capability Posture
 * L4: Communication Style
 * L5: Ethical Frame (EAPP Anchor)
 */

// ============================================================================
// LPS LAYER ENUMERATIONS
// ============================================================================

/**
 * L3: Capability Posture
 * 
 * Describes how the agent approaches work.
 * NOT tied to execution type or permissions.
 */
export enum CapabilityPosture {
    /**
     * Recommends and advises, does not execute directly.
     */
    ADVISORY = 'ADVISORY',

    /**
     * Executes routine, well-defined operations.
     */
    OPERATIONAL = 'OPERATIONAL',

    /**
     * Analyzes information and reports findings.
     */
    ANALYTICAL = 'ANALYTICAL',

    /**
     * Oversees and coordinates other systems or agents.
     */
    SUPERVISORY = 'SUPERVISORY',
}

/**
 * L4: Communication Style
 * 
 * Tone and interaction posture.
 * Used for UX and explanation shaping (future phases).
 */
export enum CommunicationStyle {
    /**
     * Factual, no emotional coloring.
     */
    NEUTRAL = 'NEUTRAL',

    /**
     * Warm, considerate, acknowledges user concerns.
     */
    EMPATHETIC = 'EMPATHETIC',

    /**
     * Clear, authoritative, confident.
     */
    DIRECTIVE = 'DIRECTIVE',

    /**
     * Emphasizes risks, caveats, and uncertainties.
     */
    CAUTIOUS = 'CAUTIOUS',
}

// ============================================================================
// LPS LAYER TYPES
// ============================================================================

/**
 * L1: Role Identity
 * 
 * Defines the agent's role name and core purpose.
 */
export interface RoleIdentity {
    /**
     * Human-readable role name.
     * Example: "Infrastructure Monitoring Agent"
     */
    roleName: string;

    /**
     * One sentence purpose statement.
     * Example: "Monitors infrastructure health and alerts on anomalies."
     */
    purposeStatement: string;
}

/**
 * L2: Domain Belonging
 * 
 * Explicit domain affiliation.
 * Agents belong to exactly one domain.
 */
export interface DomainBelonging {
    /**
     * Domain ID (reference to Domain object).
     */
    domainId: string;

    /**
     * Domain name (read-only, for display).
     */
    domainName: string;
}

/**
 * L5: Ethical Frame (EAPP Anchor)
 * 
 * Explicit ethical constraints relevant to this persona.
 * References EAPP (Ethics-Aligned Persona Protocol) principles.
 */
export interface EthicalFrame {
    /**
     * EAPP principles this persona adheres to.
     * Examples: "Data Privacy", "Transparency", "Non-Harm"
     */
    eappPrinciples: string[];

    /**
     * Specific operational constraints.
     * Examples: "Never access production data directly", "Always log decisions"
     */
    constraints: string[];

    /**
     * Non-negotiable boundaries that cannot be overridden.
     * Examples: "Cannot delete user data", "Cannot bypass audit logs"
     */
    immutableCommitments: string[];
}

// ============================================================================
// PERSONA IDENTITY (IMMUTABLE)
// ============================================================================

/**
 * PersonaIdentity
 * 
 * Immutable, human-authored identity for an agent.
 * Defines WHO the agent is, not WHAT it can do.
 * 
 * CRITICAL: IMMUTABLE
 * - All fields are readonly
 * - Cannot be modified after creation
 * - Not affected by policy learning
 * - Not inferred from behavior
 * 
 * This is the foundation. Authority, policy, and execution
 * layer on top but never modify identity.
 */
export interface PersonaIdentity {
    // Identity Metadata
    readonly personaId: string;
    readonly createdAt: string;           // ISO timestamp
    readonly authoredBy: string;          // User who defined this identity

    // L1: Role Identity
    readonly roleIdentity: RoleIdentity;

    // L2: Domain Belonging
    readonly domainBelonging: DomainBelonging;

    // L3: Capability Posture
    readonly capabilityPosture: CapabilityPosture;

    // L4: Communication Style
    readonly communicationStyle: CommunicationStyle;

    // L5: Ethical Frame
    readonly ethicalFrame: EthicalFrame;
}

// ============================================================================
// STORAGE & FUNCTIONS
// ============================================================================

/**
 * In-memory storage for persona identities (Phase 7A).
 * 
 * Future phases may persist to database.
 */
const personaIdentityStore: PersonaIdentity[] = [];

/**
 * Generate unique persona ID.
 * Format: persona-{timestamp}-{random}
 */
function generatePersonaId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `persona-${timestamp}-${random}`;
}

/**
 * Create a new PersonaIdentity.
 * 
 * CRITICAL: IMMUTABLE
 * Once created, the identity cannot be changed.
 * 
 * @param roleIdentity - L1: Role and purpose
 * @param domainBelonging - L2: Domain affiliation
 * @param capabilityPosture - L3: How agent approaches work
 * @param communicationStyle - L4: Interaction tone
 * @param ethicalFrame - L5: EAPP constraints
 * @param authoredBy - User who created this identity
 * @returns Immutable PersonaIdentity
 */
export function createPersonaIdentity(
    roleIdentity: RoleIdentity,
    domainBelonging: DomainBelonging,
    capabilityPosture: CapabilityPosture,
    communicationStyle: CommunicationStyle,
    ethicalFrame: EthicalFrame,
    authoredBy: string
): PersonaIdentity {
    const identity: PersonaIdentity = {
        personaId: generatePersonaId(),
        createdAt: new Date().toISOString(),
        authoredBy,
        roleIdentity,
        domainBelonging,
        capabilityPosture,
        communicationStyle,
        ethicalFrame,
    };

    personaIdentityStore.push(identity);

    // Return frozen object for runtime immutability
    return Object.freeze(identity) as PersonaIdentity;
}

/**
 * Get persona identity by ID.
 * 
 * @param personaId - Unique persona ID
 * @returns PersonaIdentity or null if not found
 */
export function getPersonaIdentityById(personaId: string): PersonaIdentity | null {
    return personaIdentityStore.find(p => p.personaId === personaId) ?? null;
}

/**
 * Get all persona identities.
 * 
 * @returns Read-only array of all persona identities
 */
export function getAllPersonaIdentities(): ReadonlyArray<PersonaIdentity> {
    return Object.freeze([...personaIdentityStore]);
}

/**
 * Clear all persona identities (for testing/reset only).
 */
export function clearPersonaIdentities(): void {
    personaIdentityStore.length = 0;
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

/**
 * Get human-readable description of capability posture.
 */
export function getCapabilityPostureDescription(posture: CapabilityPosture): string {
    switch (posture) {
        case CapabilityPosture.ADVISORY:
            return 'Provides recommendations and guidance without direct execution';
        case CapabilityPosture.OPERATIONAL:
            return 'Executes well-defined, routine operations within scope';
        case CapabilityPosture.ANALYTICAL:
            return 'Analyzes information and generates reports and insights';
        case CapabilityPosture.SUPERVISORY:
            return 'Oversees and coordinates other systems or agents';
        default:
            return '';
    }
}

/**
 * Get human-readable description of communication style.
 */
export function getCommunicationStyleDescription(style: CommunicationStyle): string {
    switch (style) {
        case CommunicationStyle.NEUTRAL:
            return 'Factual and objective, without emotional coloring';
        case CommunicationStyle.EMPATHETIC:
            return 'Warm and considerate, acknowledges user concerns';
        case CommunicationStyle.DIRECTIVE:
            return 'Clear and authoritative, provides confident guidance';
        case CommunicationStyle.CAUTIOUS:
            return 'Emphasizes risks, caveats, and potential uncertainties';
        default:
            return '';
    }
}
