'use client';

import { useState } from 'react';
import { Phase0Data, Organization, Domain, Agent } from '@/app/data/types';
import {
    deriveOrganizationAuthority,
    deriveDomainAuthority,
    deriveAgentAuthority,
    AuthorityResult,
} from '@/logic/authority/deriveAuthority';
import { deriveActionSurface, ActionState } from '@/logic/authority/deriveActionSurface';
import { deriveDoActions, DoAction, DoActionState } from '@/logic/authority/deriveDoActions';
import { deriveRuntimeVerdict, RuntimeVerdict } from '@/logic/authority/deriveRuntimeVerdict';
import { deriveExecutionReadiness, ExecutionReadiness, ExecutionReadinessState } from '@/logic/authority/deriveExecutionReadiness';
import {
    StagedAction,
    createStagedAction,
    canStageAction,
    approveStagedAction,
    rejectStagedAction,
    ApprovalIntent,
    ApprovalScope,
    createApprovalIntent,
    PolicyChangeProposal,
    derivePolicyChangeProposal,
    confirmPolicyProposal,
    dismissPolicyProposal,
} from '@/logic/staging/stagedActions';
import { ApprovalReviewPanel } from './ApprovalReviewPanel';
import { PolicyImplicationsView } from './PolicyImplicationsView';
import { PersonaIdentitySection } from './persona/PersonaIdentitySection';
import { PersonaComparisonModal } from './persona/PersonaComparisonModal';
import { getPersonaIdentityForAgent, initializePersonaIdentityMappings } from '@/logic/persona/personaIdentityMapping';
import { getAllPersonaIdentities } from '@/logic/persona/personaIdentity';

export type ExplanationMode = 'MINIMAL' | 'STANDARD' | 'VERBOSE';

interface InspectorPanelProps {
    selectedNodeId: string | null;
    data: Phase0Data;
    explanationMode: ExplanationMode;
    onExplanationModeChange: (mode: ExplanationMode) => void;
}

export function InspectorPanel({
    selectedNodeId,
    data,
    explanationMode,
    onExplanationModeChange,
}: InspectorPanelProps) {
    // Determine node type and fetch data if selection exists
    const nodeInfo = selectedNodeId ? getNodeInfo(selectedNodeId, data) : null;
    const isVisible = !!nodeInfo;

    return (
        <div
            style={{
                ...styles.panel,
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
                pointerEvents: isVisible ? 'auto' : 'none',
            }}
        >
            {nodeInfo && (
                <>
                    {/* Phase 2A.2: Mode Selector */}
                    <ExplanationModeSelector
                        mode={explanationMode}
                        onChange={onExplanationModeChange}
                    />

                    {nodeInfo.type === 'ORGANIZATION' && (
                        <OrganizationView
                            org={nodeInfo.data as Organization}
                            mode={explanationMode}
                        />
                    )}
                    {nodeInfo.type === 'DOMAIN' && (
                        <DomainView
                            domain={nodeInfo.data as Domain}
                            organization={data.organization}
                            mode={explanationMode}
                        />
                    )}
                    {nodeInfo.type === 'AGENT' && (
                        <AgentViewWithState
                            agent={nodeInfo.data as Agent}
                            domain={
                                data.domains.find(
                                    (d) => d.id === (nodeInfo.data as Agent).domainId
                                )!
                            }
                            organization={data.organization}
                            mode={explanationMode}
                        />
                    )}
                </>
            )}
        </div>
    );
}

// ============================================================================
// MODE SELECTOR COMPONENT
// ============================================================================

function ExplanationModeSelector({
    mode,
    onChange,
}: {
    mode: ExplanationMode;
    onChange: (mode: ExplanationMode) => void;
}) {
    const modes: ExplanationMode[] = ['MINIMAL', 'STANDARD', 'VERBOSE'];

    return (
        <div style={styles.modeSelector}>
            <div style={styles.modeSelectorLabel}>Explanation</div>
            <div style={styles.modeSelectorButtons}>
                {modes.map((m) => (
                    <button
                        key={m}
                        onClick={() => onChange(m)}
                        style={{
                            ...styles.modeButton,
                            ...(mode === m ? styles.modeButtonActive : {}),
                        }}
                        aria-label={`${m.toLowerCase()} explanation mode`}
                        aria-pressed={mode === m}
                    >
                        {m.charAt(0) + m.slice(1).toLowerCase()}
                    </button>
                ))}
            </div>
        </div>
    );
}

// Helper to find node data by ID
function getNodeInfo(
    nodeId: string,
    data: Phase0Data
): { type: 'ORGANIZATION' | 'DOMAIN' | 'AGENT'; data: Organization | Domain | Agent } | null {
    // Check if it's the organization
    if (data.organization.id === nodeId) {
        return { type: 'ORGANIZATION', data: data.organization };
    }

    // Check if it's a domain
    const domain = data.domains.find((d) => d.id === nodeId);
    if (domain) {
        return { type: 'DOMAIN', data: domain };
    }

    // Check if it's an agent
    const agent = data.agents.find((a) => a.id === nodeId);
    if (agent) {
        return { type: 'AGENT', data: agent };
    }

    return null;
}

// ============================================================================
// ORGANIZATION VIEW
// ============================================================================

function OrganizationView({ org, mode }: { org: Organization; mode: ExplanationMode }) {
    const authority = deriveOrganizationAuthority(org);

    return (
        <div>
            <div style={styles.section}>
                <div style={styles.name}>{org.name}</div>
                <div style={styles.type}>ORGANIZATION</div>
            </div>

            <div style={styles.section}>
                <div style={styles.sectionTitle}>Attributes</div>
                <AttributeRow label="Status" value={org.status} />
                <AttributeRow label="Authority ceiling" value={String(org.authorityCeiling)} />
                <AttributeRow label="Escalation default" value={org.escalationDefault} />
                <AttributeRow label="Communication posture" value={org.communicationPosture} />
            </div>

            <div style={styles.section}>
                <div style={styles.sectionTitle}>Context</div>
                <div style={styles.contextText}>Root of hierarchy</div>
            </div>

            {/* Authority Explanation (Mode-Aware) */}
            <AuthorityExplanation authority={authority} mode={mode} />
        </div>
    );
}

// ============================================================================
// DOMAIN VIEW
// ============================================================================

function DomainView({
    domain,
    organization,
    mode,
}: {
    domain: Domain;
    organization: Organization;
    mode: ExplanationMode;
}) {
    const authority = deriveDomainAuthority(organization, domain);

    return (
        <div>
            <div style={styles.section}>
                <div style={styles.name}>{domain.name}</div>
                <div style={styles.type}>DOMAIN</div>
            </div>

            <div style={styles.section}>
                <div style={styles.sectionTitle}>Attributes</div>
                <div style={styles.missionText}>{domain.mission}</div>
                <AttributeRow label="Status" value={domain.status} />
                <AttributeRow label="Authority ceiling" value={String(domain.authorityCeiling)} />
            </div>

            <div style={styles.section}>
                <div style={styles.sectionTitle}>Context</div>
                <div style={styles.contextText}>Part of: {organization.name}</div>
            </div>

            {/* Authority Explanation (Mode-Aware) */}
            <AuthorityExplanation authority={authority} mode={mode} />
        </div>
    );
}

// ============================================================================
// AGENT VIEW
// ============================================================================

// AgentView with state management for Do Action selection
function AgentViewWithState({
    agent,
    domain,
    organization,
    mode,
}: {
    agent: Agent;
    domain: Domain;
    organization: Organization;
    mode: ExplanationMode;
}) {
    const [selectedDoActionId, setSelectedDoActionId] = useState<string | null>(null);
    const [stagedActions, setStagedActions] = useState<StagedAction[]>([]);
    const [approvalIntents, setApprovalIntents] = useState<ApprovalIntent[]>([]);
    const [selectedStagedAction, setSelectedStagedAction] = useState<StagedAction | null>(null);
    const [policyProposals, setPolicyProposals] = useState<PolicyChangeProposal[]>([]);
    const [showComparisonModal, setShowComparisonModal] = useState(false);

    // Stage action handler
    const handleStageAction = (
        agent: Agent,
        doAction: DoAction,
        verdict: RuntimeVerdict,
        readiness: ExecutionReadiness,
        authority: AuthorityResult
    ) => {
        const staged = createStagedAction(agent, doAction, verdict, readiness, authority);
        setStagedActions([...stagedActions, staged]);
    };

    // Approve action handler - opens approval review panel
    const handleApproveAction = (actionId: string) => {
        const action = stagedActions.find(a => a.id === actionId);
        if (action) {
            setSelectedStagedAction(action);
        }
    };

    // Submit approval handler - creates intent and transitions state
    const handleSubmitApproval = (
        scope: ApprovalScope,
        justification: string,
        conditions?: string
    ) => {
        if (!selectedStagedAction) return;

        // Create approval intent
        const intent = createApprovalIntent(
            selectedStagedAction,
            scope,
            justification,
            conditions
        );
        setApprovalIntents([...approvalIntents, intent]);

        // Transition staged action to APPROVED
        setStagedActions(
            stagedActions.map(action =>
                action.id === selectedStagedAction.id
                    ? approveStagedAction(action)
                    : action
            )
        );

        // Phase 4C: Derive policy proposal if scope is POLICY_CHANGE
        if (scope === 'POLICY_CHANGE') {
            const proposal = derivePolicyChangeProposal(intent);
            if (proposal) {
                setPolicyProposals([...policyProposals, proposal]);
            }
        }

        // Close review panel
        setSelectedStagedAction(null);
    };

    // Confirm policy proposal handler
    const handleConfirmProposal = (proposalId: string) => {
        setPolicyProposals(
            policyProposals.map(p =>
                p.proposalId === proposalId ? confirmPolicyProposal(p) : p
            )
        );
    };

    // Dismiss policy proposal handler
    const handleDismissProposal = (proposalId: string) => {
        setPolicyProposals(
            policyProposals.map(p =>
                p.proposalId === proposalId ? dismissPolicyProposal(p) : p
            )
        );
    };

    // Reject staged action handler
    const handleRejectAction = (actionId: string, reason: string) => {
        setStagedActions(
            stagedActions.map(action =>
                action.id === actionId ? rejectStagedAction(action, reason) : action
            )
        );
    };

    return (
        <>
            {/* Phase 4B: Approval Review Panel */}
            {selectedStagedAction && (
                <ApprovalReviewPanel
                    stagedAction={selectedStagedAction}
                    onSubmit={handleSubmitApproval}
                    onCancel={() => setSelectedStagedAction(null)}
                />
            )}

            {/* Phase 7C: Persona Comparison Modal */}
            {showComparisonModal && (
                <PersonaComparisonModal
                    identities={getAllPersonaIdentities().filter(id => id !== null)}
                    onClose={() => setShowComparisonModal(false)}
                />
            )}

            <AgentView
                agent={agent}
                domain={domain}
                organization={organization}
                mode={mode}
                selectedDoActionId={selectedDoActionId}
                onDoActionSelect={setSelectedDoActionId}
                stagedActions={stagedActions}
                onStageAction={handleStageAction}
                onApproveAction={handleApproveAction}
                onRejectAction={handleRejectAction}
                policyProposals={policyProposals}
                onConfirmProposal={handleConfirmProposal}
                onDismissProposal={handleDismissProposal}
                onShowComparison={() => setShowComparisonModal(true)}
            />
        </>
    );
}

function AgentView({
    agent,
    domain,
    organization,
    mode,
    selectedDoActionId,
    onDoActionSelect,
    stagedActions,
    onStageAction,
    onApproveAction,
    onRejectAction,
    policyProposals,
    onConfirmProposal,
    onDismissProposal,
    onShowComparison,
}: {
    agent: Agent;
    domain: Domain;
    organization: Organization;
    mode: ExplanationMode;
    selectedDoActionId: string | null;
    onDoActionSelect: (actionId: string | null) => void;
    stagedActions: StagedAction[];
    onStageAction: (
        agent: Agent,
        doAction: DoAction,
        verdict: RuntimeVerdict,
        readiness: ExecutionReadiness,
        authority: AuthorityResult
    ) => void;
    onApproveAction: (actionId: string) => void;
    onRejectAction: (actionId: string, reason: string) => void;
    policyProposals: PolicyChangeProposal[];
    onConfirmProposal: (proposalId: string) => void;
    onDismissProposal: (proposalId: string) => void;
    onShowComparison: () => void;
}) {
    const authority = deriveAgentAuthority(organization, domain, agent);

    return (
        <div>
            {/* Phase 4A: Staged Actions List */}
            {stagedActions.length > 0 && (
                <StagedActionsListView
                    stagedActions={stagedActions}
                    onApproveAction={onApproveAction}
                    onRejectAction={onRejectAction}
                />
            )}

            {/* Phase 4C: Policy Implications */}
            {policyProposals.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                    {policyProposals.map(proposal => (
                        <PolicyImplicationsView
                            key={proposal.proposalId}
                            proposal={proposal}
                            onConfirm={onConfirmProposal}
                            onDismiss={onDismissProposal}
                        />
                    ))}
                </div>
            )}

            <div style={styles.section}>
                <div style={styles.name}>{agent.name}</div>
                <div style={styles.type}>AGENT</div>
            </div>

            <div style={styles.section}>
                <div style={styles.sectionTitle}>Attributes</div>
                <AttributeRow label="Role" value={agent.role} />
                <AttributeRow label="Execution type" value={agent.executionType} />
                <AttributeRow label="Autonomy level" value={String(agent.autonomyLevel)} />
                <AttributeRow label="Execution surface" value={agent.executionSurface} />
                <AttributeRow label="Escalation behavior" value={agent.escalationBehavior} />
            </div>

            <div style={styles.section}>
                <div style={styles.sectionTitle}>Context</div>
                <div style={styles.contextText}>Operates within: {domain.name}</div>
                <div style={styles.contextText}>Organization: {organization.name}</div>
            </div>

            {/* Authority Explanation (Mode-Aware) */}
            <AuthorityExplanation authority={authority} mode={mode} />

            {/* Phase 7C: Persona Identity */}
            <PersonaIdentitySectionWrapper agentId={agent.id} onShowComparison={onShowComparison} />

            {/* Phase 2C.1: Action Surface */}
            <ActionSurfaceView agent={agent} authority={authority} domain={domain} organization={organization} />

            {/* Phase 3A: Do Actions */}
            <DoActionsView
                agent={agent}
                authority={authority}
                domain={domain}
                organization={organization}
                selectedDoActionId={selectedDoActionId}
                onDoActionSelect={onDoActionSelect}
            />

            {/* Phase 3B: Runtime Verdict */}
            <RuntimeVerdictView
                agent={agent}
                authority={authority}
                domain={domain}
                organization={organization}
                selectedDoActionId={selectedDoActionId}
                stagedActions={stagedActions}
                onStageAction={onStageAction}
            />
        </div>
    );
}

// ============================================================================
// AUTHORITY EXPLANATION (MODE-AWARE RENDERER)
// ============================================================================

function AuthorityExplanation({
    authority,
    mode,
}: {
    authority: AuthorityResult;
    mode: ExplanationMode;
}) {
    if (mode === 'MINIMAL') {
        return <MinimalExplanation authority={authority} />;
    }

    if (mode === 'STANDARD') {
        return <StandardExplanation authority={authority} />;
    }

    if (mode === 'VERBOSE') {
        return <VerboseExplanation authority={authority} />;
    }

    return null;
}

// MINIMAL MODE: One-line summary
function MinimalExplanation({ authority }: { authority: AuthorityResult }) {
    const restrictions = authority.reasoning.filter((r) => r.impact === 'RESTRICT');
    const primaryRestriction = restrictions[0];

    let summary = `Effective authority: ${authority.effectiveAuthorityLevel}`;
    if (primaryRestriction) {
        // Extract concise constraint
        const constraint = extractMainConstraint(primaryRestriction.detail);
        summary += ` (${constraint})`;
    }

    return (
        <div style={styles.section}>
            <div style={styles.sectionTitle}>Authority</div>
            <div style={styles.authorityLevel}>{summary}</div>
        </div>
    );
}

// STANDARD MODE: Current behavior (key limiting factors)
function StandardExplanation({ authority }: { authority: AuthorityResult }) {
    return (
        <div style={styles.section}>
            <div style={styles.sectionTitle}>Authority Explanation</div>
            <div style={styles.authorityLevel}>
                Effective authority: {authority.effectiveAuthorityLevel}
            </div>
            {authority.reasoning.map((step, index) => (
                <div key={index} style={styles.reasoningStep}>
                    • {step.level.toLowerCase()}: {step.detail}
                </div>
            ))}
        </div>
    );
}

// VERBOSE MODE: Full details (all constraints + blocked actions)
function VerboseExplanation({ authority }: { authority: AuthorityResult }) {
    return (
        <div style={styles.section}>
            <div style={styles.sectionTitle}>Authority Explanation (Verbose)</div>
            <div style={styles.authorityLevel}>
                Effective authority: {authority.effectiveAuthorityLevel}
            </div>

            {/* Inheritance Chain */}
            <div style={styles.verboseSubSection}>
                <div style={styles.verboseSubTitle}>Inheritance Chain</div>
                {authority.authoritySourcePath.map((entry, index) => (
                    <div key={index} style={styles.verboseEntry}>
                        {index + 1}. {entry.level}: {entry.name} (ceiling: {entry.ceiling})
                    </div>
                ))}
            </div>

            {/* Detailed Reasoning */}
            <div style={styles.verboseSubSection}>
                <div style={styles.verboseSubTitle}>Derivation Reasoning</div>
                {authority.reasoning.map((step, index) => (
                    <div key={index} style={styles.verboseEntry}>
                        <div style={styles.verboseEntryHeader}>
                            {step.level} [{step.impact}]
                        </div>
                        <div style={styles.verboseEntryDetail}>{step.detail}</div>
                    </div>
                ))}
            </div>

            {/* Blocked Actions */}
            {authority.blockedActions.length > 0 && (
                <div style={styles.verboseSubSection}>
                    <div style={styles.verboseSubTitle}>Constraint Details</div>
                    {authority.blockedActions.map((action, index) => (
                        <div key={index} style={styles.verboseEntry}>
                            • {action}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Helper: Extract main constraint from detail for minimal mode
function extractMainConstraint(detail: string): string {
    if (detail.includes('Domain caps') || detail.includes('Domain restricts')) {
        return 'restricted by domain';
    }
    if (detail.includes('Agent autonomy')) {
        return 'restricted by agent autonomy';
    }
    if (detail.includes('READ-only')) {
        return 'READ-only surface';
    }
    if (detail.includes('cannot EXECUTE')) {
        return 'no EXECUTE';
    }
    if (detail.includes('ADVISORY')) {
        return 'advisory only';
    }
    return 'restricted';
}


// ============================================================================
// PERSONA IDENTITY SECTION WRAPPER (Phase 7C)
// ============================================================================

function PersonaIdentitySectionWrapper({
    agentId,
    onShowComparison,
}: {
    agentId: string;
    onShowComparison: () => void;
}) {
    const identity = getPersonaIdentityForAgent(agentId);
    
    if (!identity) {
        // No identity defined - show placeholder
        return (
            <div style={styles.section}>
                <div style={styles.sectionTitle}>PERSONA IDENTITY</div>
                <div style={styles.contextText}>No identity defined for this agent.</div>
            </div>
        );
    }
    
    return (
        <PersonaIdentitySection
            identity={identity}
            onCompareClick={onShowComparison}
        />
    );
}

// ============================================================================
// ACTION SURFACE VIEW (Phase 2C.1)
// ============================================================================

function ActionSurfaceView({
    agent,
    authority,
    domain,
    organization,
}: {
    agent: Agent;
    authority: AuthorityResult;
    domain: Domain;
    organization: Organization;
}) {
    const actionSurface = deriveActionSurface(agent, authority, domain, organization);

    return (
        <div style={styles.section}>
            <div style={styles.sectionTitle}>Action Surface</div>
            {actionSurface.actions.map((action) => (
                <div key={action.category} style={styles.actionRow} title={action.reason}>
                    <div style={styles.actionLabel}>{action.label}</div>
                    <div style={{
                        ...styles.actionBadge,
                        ...(action.state === 'ALLOWED' ? styles.actionBadgeAllowed : {}),
                        ...(action.state === 'RESTRICTED' ? styles.actionBadgeRestricted : {}),
                        ...(action.state === 'BLOCKED' ? styles.actionBadgeBlocked : {}),
                    }}>
                        {action.state}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ============================================================================
// DO ACTIONS VIEW (Phase 3A)
// ============================================================================

function DoActionsView({
    agent,
    authority,
    domain,
    organization,
    selectedDoActionId,
    onDoActionSelect,
}: {
    agent: Agent;
    authority: AuthorityResult;
    domain: Domain;
    organization: Organization;
    selectedDoActionId: string | null;
    onDoActionSelect: (actionId: string | null) => void;
}) {
    const doActionSurface = deriveDoActions(agent, authority, domain, organization);

    // Don't render if no actions
    if (doActionSurface.actions.length === 0) {
        return null;
    }

    return (
        <div style={styles.section}>
            <div style={styles.sectionTitle}>Do Actions</div>
            <div style={styles.doActionsExplainer}>
                What this agent could do if execution were permitted
            </div>
            {doActionSurface.actions.map((action) => {
                const isSelected = selectedDoActionId === action.id;
                return (
                    <div
                        key={action.id}
                        style={{
                            ...styles.doActionRow,
                            ...(isSelected ? styles.doActionRowSelected : {}),
                        }}
                        title={action.reason}
                        onClick={() => onDoActionSelect(isSelected ? null : action.id)}
                    >
                        <div style={styles.doActionLabel}>{action.verbPhrase}</div>
                        <div
                            style={{
                                ...styles.doActionBadge,
                                ...(action.state === 'ALLOWED' ? styles.doActionBadgeAllowed : {}),
                                ...(action.state === 'RESTRICTED' ? styles.doActionBadgeRestricted : {}),
                                ...(action.state === 'BLOCKED' ? styles.doActionBadgeBlocked : {}),
                            }}
                        >
                            {action.state}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ============================================================================
// RUNTIME VERDICT VIEW (Phase 3B)
// ============================================================================

function RuntimeVerdictView({
    agent,
    authority,
    domain,
    organization,
    selectedDoActionId,
    stagedActions,
    onStageAction,
}: {
    agent: Agent;
    authority: AuthorityResult;
    domain: Domain;
    organization: Organization;
    selectedDoActionId: string | null;
    stagedActions: StagedAction[];
    onStageAction: (
        agent: Agent,
        doAction: DoAction,
        verdict: RuntimeVerdict,
        readiness: ExecutionReadiness,
        authority: AuthorityResult
    ) => void;
}) {
    // Don't render if no action selected
    if (!selectedDoActionId) {
        return null;
    }

    // Get the selected Do Action
    const doActionSurface = deriveDoActions(agent, authority, domain, organization);
    const selectedAction = doActionSurface.actions.find(a => a.id === selectedDoActionId);

    if (!selectedAction) {
        return null;
    }

    // Derive runtime verdict
    const verdict = deriveRuntimeVerdict(agent, selectedAction, authority, domain, organization);

    // Map confidence to display labels
    const confidenceLabel = verdict.decision.confidence === 'HIGH'
        ? 'Clear outcome'
        : 'Requires escalation';

    // Map confidence to icon
    const confidenceIcon = verdict.decision.confidence === 'HIGH'
        ? '●' // Solid dot
        : '◐'; // Half-filled dot

    // Tooltip content
    const confidenceTooltip = verdict.decision.confidence === 'HIGH'
        ? 'The system has enough information to determine the result without ambiguity. This does not mean the action is approved or safe — only that the rules lead to a clear conclusion.'
        : 'The system can partially assess this action but intentionally defers the final decision to a human or external process.';

    return (
        <div style={styles.section}>
            <div style={styles.sectionTitle}>Runtime Verdict</div>

            {/* Verdict Status */}
            <div
                style={{
                    ...styles.verdictStatusBadge,
                    ...(verdict.decision.status === 'ALLOWED' ? styles.verdictStatusAllowed : {}),
                    ...(verdict.decision.status === 'BLOCKED' ? styles.verdictStatusBlocked : {}),
                    ...(verdict.decision.status === 'ESCALATION_REQUIRED' ? styles.verdictStatusEscalation : {}),
                }}
            >
                {verdict.decision.status.replace('_', ' ')}
            </div>

            {/* System Assessment (Confidence) */}
            <div style={styles.verdictAssessmentSection}>
                <div style={styles.verdictAssessmentLabel}>System assessment:</div>
                <div style={styles.verdictAssessmentRow}>
                    <span style={styles.verdictConfidenceIcon}>{confidenceIcon}</span>
                    <span style={styles.verdictConfidenceLabel}>{confidenceLabel}</span>
                    <span
                        style={styles.verdictTooltipIcon}
                        title={confidenceTooltip}
                        aria-label={`About ${confidenceLabel}: ${confidenceTooltip}`}
                    >
                        ⓘ
                    </span>
                </div>
            </div>

            {/* Summary */}
            <div style={styles.verdictSummary}>
                {verdict.reasoning.summary}
            </div>

            {/* Applied Constraints */}
            <div style={styles.verdictConstraintsTitle}>Applied Constraints</div>
            {verdict.reasoning.appliedConstraints.map((constraint, index) => (
                <div key={index} style={styles.verdictConstraintRow}>
                    <div style={styles.verdictConstraintSource}>{constraint.source}</div>
                    <div style={styles.verdictConstraintDescription}>{constraint.description}</div>
                </div>
            ))}

            {/* Escalation Info */}
            {verdict.escalation && (
                <div style={styles.verdictEscalation}>
                    <div style={styles.verdictEscalationTitle}>Escalation Required</div>
                    <div style={styles.verdictEscalationText}>{verdict.escalation.reason}</div>
                    <div style={styles.verdictEscalationText}>
                        Expected approver: {verdict.escalation.expectedApproverRole}
                    </div>
                </div>
            )}

            {/* Execution Guarantee */}
            <div style={styles.verdictGuarantee}>
                Explanatory Only — No execution will occur
            </div>

            {/* Phase 3C: Execution Readiness */}
            <ExecutionReadinessView
                agent={agent}
                doAction={selectedAction}
                authority={authority}
                verdict={verdict}
                domain={domain}
                organization={organization}
                stagedActions={stagedActions}
                onStageAction={onStageAction}
            />
        </div>
    );
}

// ============================================================================
// EXECUTION READINESS VIEW (Phase 3C)
// ============================================================================

function ExecutionReadinessView({
    agent,
    doAction,
    authority,
    verdict,
    domain,
    organization,
    stagedActions,
    onStageAction,
}: {
    agent: Agent;
    doAction: DoAction;
    authority: AuthorityResult;
    verdict: RuntimeVerdict;
    domain: Domain;
    organization: Organization;
    stagedActions: StagedAction[];
    onStageAction: (
        agent: Agent,
        doAction: DoAction,
        verdict: RuntimeVerdict,
        readiness: ExecutionReadiness,
        authority: AuthorityResult
    ) => void;
}) {
    // Derive execution readiness
    const readiness = deriveExecutionReadiness(agent, doAction, authority, verdict, domain, organization);

    return (
        <div style={styles.executionSection}>
            <div style={styles.executionTitle}>Execution Readiness</div>

            {/* Readiness Badge */}
            <div
                style={{
                    ...styles.executionBadge,
                    ...(readiness.state === 'ELIGIBLE_AUTOMATIC' ? styles.executionBadgeAuto : {}),
                    ...(readiness.state === 'ELIGIBLE_PENDING_APPROVAL' ? styles.executionBadgePending : {}),
                    ...(readiness.state === 'NOT_ELIGIBLE' ? styles.executionBadgeNotEligible : {}),
                    ...(readiness.state === 'BLOCKED_HARD' ? styles.executionBadgeBlocked : {}),
                }}
            >
                {readiness.state.replace(/_/g, ' ')}
            </div>

            {/* Preconditions Checklist */}
            <div style={styles.executionPreconditionsTitle}>Preconditions:</div>

            <div style={styles.executionPreconditionRow}>
                <span style={styles.executionCheckIcon}>
                    {readiness.gates.authorityAlignment.passed ? '✓' : '✕'}
                </span>
                <span
                    style={styles.executionPreconditionLabel}
                    title={readiness.gates.authorityAlignment.reason}
                >
                    Authority Alignment
                </span>
            </div>

            <div style={styles.executionPreconditionRow}>
                <span style={styles.executionCheckIcon}>
                    {readiness.gates.actionSurfaceCompatibility.passed ? '✓' : '✕'}
                </span>
                <span
                    style={styles.executionPreconditionLabel}
                    title={readiness.gates.actionSurfaceCompatibility.reason}
                >
                    Action Surface Compatibility
                </span>
            </div>

            <div style={styles.executionPreconditionRow}>
                <span style={styles.executionCheckIcon}>
                    {readiness.gates.escalationResolution.passed ? '✓' : '✕'}
                </span>
                <span
                    style={styles.executionPreconditionLabel}
                    title={readiness.gates.escalationResolution.reason}
                >
                    Escalation Resolution
                </span>
            </div>

            <div style={styles.executionPreconditionRow}>
                <span style={styles.executionCheckIcon}>
                    {readiness.gates.personaAlignment.passed ? '✓' : '✕'}
                </span>
                <span
                    style={styles.executionPreconditionLabel}
                    title={readiness.gates.personaAlignment.reason}
                >
                    Persona Alignment
                </span>
            </div>

            {/* Summary */}
            <div style={styles.executionSummary}>
                {readiness.summary}
            </div>

            {/* Phase 4A: Stage Action Button */}
            {canStageAction(doAction, readiness) && !stagedActions.some(sa => sa.actionId === doAction.id && sa.state === 'STAGED') && (
                <button
                    style={styles.stageActionButton}
                    onClick={() => onStageAction(agent, doAction, verdict, readiness, authority)}
                >
                    Stage Action
                </button>
            )}
        </div>
    );
}

// ============================================================================
// STAGED ACTIONS LIST VIEW (Phase 4A)
// ============================================================================

function StagedActionsListView({
    stagedActions,
    onApproveAction,
    onRejectAction,
}: {
    stagedActions: StagedAction[];
    onApproveAction: (actionId: string) => void;
    onRejectAction: (actionId: string, reason: string) => void;
}) {
    return (
        <div style={styles.stagedActionsSection}>
            <div style={styles.stagedActionsTitle}>Staged Actions ({stagedActions.length})</div>

            {stagedActions.map(action => (
                <div key={action.id} style={styles.stagedActionCard}>
                    {/* State Badge */}
                    <div
                        style={{
                            ...styles.stagedActionBadge,
                            ...(action.state === 'STAGED' ? styles.stagedActionBadgeStaged : {}),
                            ...(action.state === 'APPROVED' ? styles.stagedActionBadgeApproved : {}),
                            ...(action.state === 'REJECTED' ? styles.stagedActionBadgeRejected : {}),
                        }}
                    >
                        {action.state}
                    </div>

                    {/* Action Info */}
                    <div style={styles.stagedActionInfo}>
                        <div style={styles.stagedActionName}>
                            {action.agentName} • {action.actionName}
                        </div>
                        <div style={styles.stagedActionTime}>
                            Staged {new Date(action.stagedAt).toLocaleTimeString()}
                        </div>
                    </div>

                    {/* State Transition Actions */}
                    {action.state === 'STAGED' && (
                        <div style={styles.stagedActionControls}>
                            <button
                                style={styles.approveButton}
                                onClick={() => onApproveAction(action.id)}
                            >
                                Approve
                            </button>
                            <button
                                style={styles.rejectButton}
                                onClick={() => onRejectAction(action.id, 'Manually rejected')}
                            >
                                Reject
                            </button>
                        </div>
                    )}

                    {/* Rejection Reason */}
                    {action.state === 'REJECTED' && action.rejectionReason && (
                        <div style={styles.rejectionReason}>
                            Reason: {action.rejectionReason}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

// Simple attribute row component
function AttributeRow({ label, value }: { label: string; value: string }) {
    return (
        <div style={styles.attributeRow}>
            <div style={styles.attributeLabel}>{label}</div>
            <div style={styles.attributeValue}>{value}</div>
        </div>
    );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = {
    panel: {
        position: 'fixed' as const,
        top: 0,
        right: 0,
        width: '340px',
        height: '100vh',
        background: '#0a0a0a',
        borderLeft: '1px solid #2a2a2a',
        padding: '32px 24px',
        overflowY: 'auto' as const,
        color: '#fff',
        transition: 'opacity 250ms ease-out, transform 250ms ease-out',
    },
    // Mode Selector
    modeSelector: {
        marginBottom: 24,
        paddingBottom: 16,
        borderBottom: '1px solid #2a2a2a',
    },
    modeSelectorLabel: {
        fontSize: 11,
        textTransform: 'uppercase' as const,
        color: '#666',
        letterSpacing: '0.5px',
        marginBottom: 10,
    },
    modeSelectorButtons: {
        display: 'flex',
        gap: 4,
    },
    modeButton: {
        flex: 1,
        padding: '6px 8px',
        fontSize: 11,
        fontWeight: 500,
        background: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: 4,
        color: '#999',
        cursor: 'pointer',
        transition: 'all 150ms ease',
    },
    modeButtonActive: {
        background: '#2a2a2a',
        borderColor: '#555',
        color: '#fff',
    },
    section: {
        marginBottom: 32,
    },
    name: {
        fontSize: '20px',
        fontWeight: 600,
        marginBottom: '8px',
        lineHeight: '1.3',
    },
    type: {
        fontSize: '12px',
        textTransform: 'uppercase' as const,
        color: '#888',
        letterSpacing: '0.5px',
    },
    sectionTitle: {
        fontSize: '13px',
        textTransform: 'uppercase' as const,
        color: '#888',
        letterSpacing: '0.5px',
        marginBottom: '16px',
        fontWeight: 500,
    },
    attributeRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: '12px',
        gap: '16px',
    },
    attributeLabel: {
        fontSize: '14px',
        color: '#aaa',
        flex: '0 0 auto',
    },
    attributeValue: {
        fontSize: '14px',
        color: '#fff',
        fontWeight: 500,
        textAlign: 'right' as const,
        flex: '1 1 auto',
    },
    missionText: {
        fontSize: '14px',
        color: '#ccc',
        lineHeight: '1.6',
        marginBottom: '16px',
        fontStyle: 'italic',
    },
    contextText: {
        fontSize: '14px',
        color: '#999',
        marginBottom: '8px',
        lineHeight: '1.5',
    },
    // Authority explanation styles
    authorityLevel: {
        fontSize: '15px',
        color: '#fff',
        fontWeight: 500,
        marginBottom: '14px',
    },
    reasoningStep: {
        fontSize: '14px',
        color: '#bbb',
        lineHeight: '1.7',
        marginBottom: '10px',
    },
    // Verbose mode styles
    verboseSubSection: {
        marginTop: 20,
    },
    verboseSubTitle: {
        fontSize: '12px',
        textTransform: 'uppercase' as const,
        color: '#777',
        letterSpacing: '0.5px',
        marginBottom: 10,
        fontWeight: 500,
    },
    verboseEntry: {
        fontSize: '13px',
        color: '#ccc',
        lineHeight: '1.6',
        marginBottom: '8px',
    },
    verboseEntryHeader: {
        fontSize: '12px',
        color: '#888',
        textTransform: 'uppercase' as const,
        marginBottom: 4,
    },
    verboseEntryDetail: {
        fontSize: '14px',
        color: '#bbb',
        lineHeight: '1.6',
    },
    // Phase 2C.1: Action Surface styles
    actionRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
        cursor: 'default',
    },
    actionLabel: {
        fontSize: '14px',
        color: '#ccc',
    },
    actionBadge: {
        fontSize: '11px',
        fontWeight: 600,
        padding: '4px 10px',
        borderRadius: 4,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.3px',
    },
    actionBadgeAllowed: {
        background: '#1a3a2a',
        color: '#6cc070',
        border: '1px solid #2a4a3a',
    },
    actionBadgeRestricted: {
        background: '#3a2f1a',
        color: '#daa520',
        border: '1px solid #4a3f2a',
    },
    actionBadgeBlocked: {
        background: '#2a1a1a',
        color: '#999',
        border: '1px solid #3a2a2a',
    },
    // Phase 3A: Do Actions styles
    doActionsExplainer: {
        fontSize: '12px',
        color: '#666',
        marginBottom: '14px',
        fontStyle: 'italic',
        lineHeight: '1.5',
    },
    doActionRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px',
        cursor: 'pointer',
        opacity: 0.85,
        padding: '8px',
        borderRadius: 4,
        border: '1px solid transparent',
        transition: 'all 150ms ease',
    },
    doActionRowSelected: {
        border: '1px solid #3a3a3a',
        background: '#1a1a1a',
        opacity: 1,
    },
    doActionLabel: {
        fontSize: '14px',
        color: '#ccc',
    },
    doActionBadge: {
        fontSize: '10px',
        fontWeight: 600,
        padding: '3px 8px',
        borderRadius: 3,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.3px',
    },
    doActionBadgeAllowed: {
        background: '#1a3a2a',
        color: '#6cc070',
        border: '1px solid #2a4a3a',
    },
    doActionBadgeRestricted: {
        background: '#3a2f1a',
        color: '#daa520',
        border: '1px solid #4a3f2a',
    },
    doActionBadgeBlocked: {
        background: '#2a1a1a',
        color: '#999',
        border: '1px solid #3a2a2a',
    },
    // Phase 3B: Runtime Verdict styles
    verdictStatusBadge: {
        fontSize: '12px',
        fontWeight: 700,
        padding: '6px 12px',
        borderRadius: 4,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px',
        marginBottom: 20,
        display: 'inline-block',
    },
    verdictStatusAllowed: {
        background: '#1a3a2a',
        color: '#6FAF8E', // Muted green-gray per spec
        border: '1px solid #2a4a3a',
    },
    verdictStatusBlocked: {
        background: '#3a1a1a',
        color: '#d97070',
        border: '1px solid #4a2a2a',
    },
    verdictStatusEscalation: {
        background: '#3a2f1a',
        color: '#C8A96A', // Muted amber-gray per spec
        border: '1px solid #4a3f2a',
    },
    verdictAssessmentSection: {
        marginBottom: 20,
    },
    verdictAssessmentLabel: {
        fontSize: '11px',
        color: '#888',
        marginBottom: 8,
        textTransform: 'none' as const,
    },
    verdictAssessmentRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
    },
    verdictConfidenceIcon: {
        fontSize: '16px',
        color: '#999',
        lineHeight: '1',
    },
    verdictConfidenceLabel: {
        fontSize: '13px',
        color: '#bbb',
        fontWeight: 500,
    },
    verdictTooltipIcon: {
        fontSize: '14px',
        color: '#666',
        cursor: 'help',
        userSelect: 'none' as const,
    },
    verdictSummary: {
        fontSize: '15px',
        color: '#fff',
        lineHeight: '1.6',
        marginBottom: 20,
        fontWeight: 500,
    },
    verdictConstraintsTitle: {
        fontSize: '12px',
        textTransform: 'uppercase' as const,
        color: '#777',
        letterSpacing: '0.5px',
        marginBottom: 12,
        fontWeight: 500,
    },
    verdictConstraintRow: {
        marginBottom: 12,
    },
    verdictConstraintSource: {
        fontSize: '10px',
        textTransform: 'uppercase' as const,
        color: '#666',
        letterSpacing: '0.5px',
        marginBottom: 4,
    },
    verdictConstraintDescription: {
        fontSize: '13px',
        color: '#bbb',
        lineHeight: '1.5',
    },
    verdictEscalation: {
        marginTop: 16,
        padding: 12,
        background: '#1a1a1a',
        border: '1px solid #2a2a2a',
        borderRadius: 4,
    },
    verdictEscalationTitle: {
        fontSize: '11px',
        textTransform: 'uppercase' as const,
        color: '#daa520',
        letterSpacing: '0.5px',
        marginBottom: 8,
        fontWeight: 600,
    },
    verdictEscalationText: {
        fontSize: '13px',
        color: '#ccc',
        lineHeight: '1.5',
        marginBottom: 4,
    },
    verdictGuarantee: {
        marginTop: 20,
        paddingTop: 16,
        borderTop: '1px solid #2a2a2a',
        fontSize: '11px',
        color: '#666',
        fontStyle: 'italic',
        textAlign: 'center' as const,
    },
    // Phase 3C: Execution Readiness styles
    executionSection: {
        marginTop: 24,
        paddingTop: 20,
        borderTop: '1px solid #2a2a2a',
    },
    executionTitle: {
        fontSize: '12px',
        textTransform: 'uppercase' as const,
        color: '#777',
        letterSpacing: '0.5px',
        marginBottom: 16,
        fontWeight: 500,
    },
    executionBadge: {
        fontSize: '11px',
        fontWeight: 700,
        padding: '5px 10px',
        borderRadius: 3,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.4px',
        marginBottom: 20,
        display: 'inline-block',
    },
    executionBadgeAuto: {
        background: '#1a3a2a',
        color: '#6FAF8E', // Muted green
        border: '1px solid #2a4a3a',
    },
    executionBadgePending: {
        background: '#3a2f1a',
        color: '#C8A96A', // Muted amber
        border: '1px solid #4a3f2a',
    },
    executionBadgeNotEligible: {
        background: '#2a2a2a',
        color: '#666', // Gray
        border: '1px solid #3a3a3a',
    },
    executionBadgeBlocked: {
        background: '#3a1a1a',
        color: '#d97070', // Muted red
        border: '1px solid #4a2a2a',
    },
    executionPreconditionsTitle: {
        fontSize: '11px',
        color: '#888',
        marginBottom: 12,
        fontWeight: 500,
    },
    executionPreconditionRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    executionCheckIcon: {
        fontSize: '14px',
        color: '#999',
        fontWeight: 'bold',
        width: 16,
        textAlign: 'center' as const,
    },
    executionPreconditionLabel: {
        fontSize: '13px',
        color: '#bbb',
        cursor: 'help',
    },
    executionSummary: {
        marginTop: 16,
        paddingTop: 14,
        borderTop: '1px solid #2a2a2a',
        fontSize: '13px',
        color: '#a1a1aa', // Muted neutral (zinc-400 equivalent)
        lineHeight: '1.6',
        fontStyle: 'normal' as const,
    },
    // Phase 4A: Staging styles
    stageActionButton: {
        marginTop: 20,
        width: '100%',
        padding: '10px 16px',
        background: '#2a2a2a',
        color: '#999',
        border: '1px solid #3a3a3a',
        borderRadius: 4,
        fontSize: '13px',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    stagedActionsSection: {
        marginBottom: 24,
        padding: 16,
        background: '#0f0f0f',
        border: '1px solid #2a2a2a',
        borderRadius: 6,
    },
    stagedActionsTitle: {
        fontSize: '12px',
        textTransform: 'uppercase' as const,
        color: '#777',
        letterSpacing: '0.5px',
        marginBottom: 16,
        fontWeight: 500,
    },
    stagedActionCard: {
        marginBottom: 12,
        padding: 12,
        background: '#1a1a1a',
        border: '1px solid #2a2a2a',
        borderRadius: 4,
    },
    stagedActionBadge: {
        display: 'inline-block',
        fontSize: '10px',
        fontWeight: 700,
        padding: '4px 8px',
        borderRadius: 3,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.4px',
        marginBottom: 8,
    },
    stagedActionBadgeStaged: {
        background: '#2a2a2a',
        color: '#999',
        border: '1px solid #3a3a3a',
    },
    stagedActionBadgeApproved: {
        background: '#1a3a2a',
        color: '#6FAF8E',
        border: '1px solid #2a4a3a',
    },
    stagedActionBadgeRejected: {
        background: '#3a1a1a',
        color: '#d97070',
        border: '1px solid #4a2a2a',
    },
    stagedActionInfo: {
        marginBottom: 12,
    },
    stagedActionName: {
        fontSize: '14px',
        color: '#ddd',
        marginBottom: 4,
        fontWeight: 500,
    },
    stagedActionTime: {
        fontSize: '11px',
        color: '#666',
    },
    stagedActionControls: {
        display: 'flex',
        gap: 8,
        marginTop: 12,
    },
    approveButton: {
        flex: 1,
        padding: '8px 12px',
        background: '#1a3a2a',
        color: '#6FAF8E',
        border: '1px solid #2a4a3a',
        borderRadius: 3,
        fontSize: '12px',
        fontWeight: 500,
        cursor: 'pointer',
    },
    rejectButton: {
        flex: 1,
        padding: '8px 12px',
        background: '#3a1a1a',
        color: '#d97070',
        border: '1px solid #4a2a2a',
        borderRadius: 3,
        fontSize: '12px',
        fontWeight: 500,
        cursor: 'pointer',
    },
    rejectionReason: {
        marginTop: 8,
        padding: 8,
        background: '#0a0a0a',
        border: '1px solid #2a2a2a',
        borderRadius: 3,
        fontSize: '11px',
        color: '#999',
        fontStyle: 'italic' as const,
    },
};
