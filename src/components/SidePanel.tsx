'use client';

import clsx from 'clsx';
import { NodeData } from './OrgChartCanvas';
import { X, Shield, Activity, Zap, Lock, Globe, MessageSquare, AlertTriangle } from 'lucide-react';
import { PHASE0_DATA } from '@/app/data/phase0.data';
import { Organization, Domain, Agent } from '@/app/data/types';

interface SidePanelProps {
    node: NodeData | null;
    onClose: () => void;
}

// Helpers to lookup authentic data from System of Record
function findOrganization(id: string): Organization | undefined {
    if (PHASE0_DATA.organization.id === id) return PHASE0_DATA.organization;
    return undefined;
}

function findDomain(id: string): Domain | undefined {
    return PHASE0_DATA.domains.find(d => d.id === id);
}

function findAgent(id: string): Agent | undefined {
    return PHASE0_DATA.agents.find(a => a.id === id);
}

function findDomainForAgent(agent: Agent): Domain | undefined {
    return PHASE0_DATA.domains.find(d => d.id === agent.domainId);
}

export function SidePanel({ node, onClose }: SidePanelProps) {
    // Resolve strict data object
    const org = node ? findOrganization(node.id) : undefined;
    const domain = node ? findDomain(node.id) : undefined;
    const agent = node ? findAgent(node.id) : undefined;

    // Resolve context for agents
    const agentDomain = agent ? findDomainForAgent(agent) : undefined;

    return (
        <div className={clsx(
            "fixed top-0 right-0 h-full w-[400px] bg-[var(--card-bg)] border-l border-[var(--card-border)] shadow-2xl z-50 transition-transform duration-300 transform font-sans",
            node ? "translate-x-0" : "translate-x-full"
        )}>
            {node && (
                <div className="flex flex-col h-full bg-[var(--card-bg)] text-[var(--foreground)]">
                    {/* 4. Global Panel Layout - Header Block */}
                    <div className="p-6 border-b border-[var(--card-border)] flex justify-between items-start bg-[#1a1a1a]">
                        <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                {org && 'Organization (Level 1)'}
                                {domain && 'Domain (Level 2)'}
                                {agent && 'Agent (Leaf Node)'}
                            </span>
                            <h2 className="text-2xl font-bold mt-2 text-white tracking-tight leading-tight">
                                {org?.name || domain?.name || agent?.name}
                            </h2>
                            <div className="mt-3 flex items-center gap-2">
                                {/* Status Badges */}
                                {org && (
                                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold border border-gray-600 text-gray-400 bg-gray-800">
                                        {org.status}
                                    </span>
                                )}
                                {domain && (
                                    <span className={clsx("px-2 py-0.5 rounded text-[10px] uppercase font-bold border",
                                        domain.status === 'READY' ? "border-green-900 text-green-500 bg-green-900/10" : "border-gray-600 text-gray-400 bg-gray-800"
                                    )}>
                                        {domain.status}
                                    </span>
                                )}
                                {agent && (
                                    <span className={clsx(
                                        "px-2 py-0.5 rounded text-[10px] uppercase font-bold border",
                                        agent.executionType === 'EXECUTION' ? "border-purple-900 text-purple-400 bg-purple-900/20" :
                                            agent.executionType === 'DECISION' ? "border-amber-900 text-amber-400 bg-amber-900/20" :
                                                "border-blue-900 text-blue-400 bg-blue-900/20"
                                    )}>
                                        {agent.executionType}
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content Scroll */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-8">

                        {/* --- 5. ORGANIZATION PANEL --- */}
                        {org && (
                            <>
                                <section className="space-y-4">
                                    <SectionHeader title="Primary Information" icon={Globe} />
                                    <div className="p-4 rounded-lg bg-black/20 border border-white/5 space-y-4">
                                        <div>
                                            <Label>Mission</Label>
                                            <Value>To integrate safe, autonomous intelligence into the core operating fabric of Nebula Industries.</Value>
                                        </div>
                                        <div>
                                            <Label>AI Posture</Label>
                                            <Value>{org.communicationPosture} • {org.escalationDefault} Escalation</Value>
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-4">
                                    <SectionHeader title="Authority & Culture" icon={Shield} />
                                    <div className="p-4 rounded-lg bg-black/20 border border-white/5 space-y-4 opacity-80">
                                        <div>
                                            <Label>Global Authority Ceiling</Label>
                                            <div className="mt-2 w-full bg-gray-800 h-2 rounded-full overflow-hidden relative">
                                                <div className="bg-[var(--accent)] h-full w-full opacity-50"></div>
                                                {/* Simulated Knob */}
                                                <div className="absolute top-1/2 right-0 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg"></div>
                                            </div>
                                            <span className="text-[10px] text-gray-500 mt-1 block">Level {org.authorityCeiling} (High) - Locked</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label>Escalation Default</Label>
                                                <Value>{org.escalationDefault}</Value>
                                            </div>
                                            <div>
                                                <Label>Comm. Posture</Label>
                                                <Value>{org.communicationPosture}</Value>
                                            </div>
                                        </div>
                                        <div>
                                            <Label>Ethical Constraints</Label>
                                            <ul className="text-sm text-gray-400 list-disc list-inside mt-1 space-y-1">
                                                <li>Human-in-the-loop for financial ops</li>
                                                <li>No autonomous external comms</li>
                                            </ul>
                                        </div>
                                    </div>
                                </section>

                                <div className="pt-8 border-t border-[var(--card-border)]">
                                    <DisabledButton label="Configure Organization Baseline" />
                                </div>
                            </>
                        )}

                        {/* --- 6. DOMAIN PANEL --- */}
                        {domain && (
                            <>
                                <section className="space-y-4">
                                    <SectionHeader title="Primary Information" icon={Activity} />
                                    <div className="p-4 rounded-lg bg-black/20 border border-white/5 space-y-4">
                                        <div>
                                            <Label>Domain Mission</Label>
                                            <Value>{domain.mission}</Value>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label>Parent Organization</Label>
                                                <Value>{PHASE0_DATA.organization.name}</Value>
                                            </div>
                                            <div>
                                                <Label>Agent Count</Label>
                                                <Value>{PHASE0_DATA.agents.filter(a => a.domainId === domain.id).length} Agents</Value>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-4">
                                    <SectionHeader title="Authority Scope" icon={Shield} />
                                    <div className="p-4 rounded-lg bg-black/20 border border-white/5 space-y-4">
                                        <div>
                                            <Label>Authority Ceiling</Label>
                                            <Value>Level {domain.authorityCeiling}</Value>
                                            <div className="w-full bg-gray-800 h-1.5 rounded-full mt-2 overflow-hidden">
                                                <div className="bg-[var(--accent)] h-full" style={{ width: `${(domain.authorityCeiling / 3) * 100}%` }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <Label>Allowed Categories</Label>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {domain.allowedActionCategories.map(cat => (
                                                    <span key={cat} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-gray-300">
                                                        {cat}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <div className="pt-8 border-t border-[var(--card-border)] space-y-3">
                                    <DisabledButton label="Configure Domain Scope" />
                                    <DisabledButton label="View Authority Translation" secondary />
                                </div>
                            </>
                        )}

                        {/* --- 7. AGENT PANEL --- */}
                        {agent && (
                            <>
                                <section className="space-y-4">
                                    <SectionHeader title="Primary Information" icon={Zap} />
                                    <div className="p-4 rounded-lg bg-black/20 border border-white/5 space-y-4">
                                        <div>
                                            <Label>Role</Label>
                                            <Value>{agent.role}</Value>
                                        </div>
                                        <div>
                                            <Label>Domain Affiliation</Label>
                                            <Value>{agentDomain?.name || 'Unknown Domain'}</Value>
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-4">
                                    <SectionHeader title="Behavior & Execution" icon={Shield} />
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-white/5 rounded border border-white/5">
                                            <Label>Autonomy</Label>
                                            <Value>Level {agent.autonomyLevel}</Value>
                                        </div>
                                        <div className="p-3 bg-white/5 rounded border border-white/5">
                                            <Label>Surface</Label>
                                            <Value>{agent.executionSurface}</Value>
                                        </div>
                                        <div className="col-span-2 p-3 bg-white/5 rounded border border-white/5">
                                            <Label>Escalation Behavior</Label>
                                            <Value>{agent.escalationBehavior === 'AUTO' ? 'Automatic Resolution' : 'Human Required'}</Value>
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-4">
                                    <SectionHeader title="Studio Preview" icon={MessageSquare} />
                                    <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
                                        <Label className="text-yellow-600/70">Identity Snapshot</Label>
                                        <p className="text-sm text-yellow-200/80 mt-1 italic">
                                            "I am {agent.name}, acting as {agent.role} for {agentDomain?.name}."
                                        </p>
                                    </div>
                                </section>

                                <div className="pt-8 border-t border-[var(--card-border)]">
                                    <DisabledButton label="Open in Studio" />
                                    <p className="text-[10px] text-center text-gray-600 mt-2">Persona configuration begins in Phase 1</p>
                                </div>
                            </>
                        )}

                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-[var(--card-border)] text-center bg-[#1a1a1a]">
                        <span className="text-[10px] text-gray-600 font-mono">ID: {node.id} • PHASE_0_STATIC</span>
                    </div>
                </div>
            )}
        </div>
    );
}

// Visual Primitives
function SectionHeader({ title, icon: Icon }: { title: string, icon: any }) {
    return (
        <div className="flex items-center gap-2 text-gray-400 font-semibold border-b border-white/5 pb-2">
            <Icon size={16} />
            <h3 className="text-sm uppercase tracking-wider">{title}</h3>
        </div>
    );
}

function Label({ children, className }: { children: React.ReactNode, className?: string }) {
    return <span className={clsx("text-[11px] font-medium text-gray-500 uppercase tracking-wide block mb-1", className)}>{children}</span>;
}

function Value({ children }: { children: React.ReactNode }) {
    return <span className="text-sm text-gray-200 block font-medium">{children}</span>;
}

function DisabledButton({ label, secondary }: { label: string, secondary?: boolean }) {
    return (
        <button disabled className={clsx(
            "w-full py-3 px-4 rounded border text-sm font-medium cursor-not-allowed flex justify-center items-center gap-2 transition-opacity",
            secondary
                ? "border-transparent text-gray-600 hover:text-gray-500 bg-transparent"
                : "border-white/10 text-gray-500 bg-white/5 opacity-50"
        )}>
            {secondary ? null : <Lock size={14} />}
            {label}
        </button>
    );
}
