import { useState, useCallback } from 'react';
import { Phase0Data, Domain, Agent } from '@/app/data/types';
import { PHASE0_DATA } from '@/app/data/phase0.data';

export interface StructureStore {
    data: Phase0Data;
    moveDomain: (dragIndex: number, hoverIndex: number) => void;
    moveAgent: (agentId: string, targetDomainId: string) => void;
    addDomain: (name: string, description?: string) => void;
    deleteDomain: (domainId: string) => void;
    addAgent: (domainId: string, name: string) => void;
    deleteAgent: (agentId: string) => void;
    updateOrganization: (updates: Partial<import('@/app/data/types').Organization>) => void;
    // Phase 8B: Update Domain
    updateDomain: (domainId: string, updates: Partial<Domain>) => void;
}

export function useStructureStore(initialData: Phase0Data = PHASE0_DATA): StructureStore {
    const [data, setData] = useState<Phase0Data>(initialData);

    // Reorder domains within the organization
    const moveDomain = useCallback((dragIndex: number, hoverIndex: number) => {
        setData((prev) => {
            const newDomains = [...prev.domains];
            const [draggedDomain] = newDomains.splice(dragIndex, 1);
            newDomains.splice(hoverIndex, 0, draggedDomain);
            return { ...prev, domains: newDomains };
        });
    }, []);

    // Move an agent to a different domain
    const moveAgent = useCallback((agentId: string, targetDomainId: string) => {
        setData((prev) => {
            // Find the agent
            const agentIndex = prev.agents.findIndex(a => a.id === agentId);
            if (agentIndex === -1) return prev;

            const agent = prev.agents[agentIndex];

            // If already in target domain, do nothing
            if (agent.domainId === targetDomainId) return prev;

            // Update agent's domainId
            const newAgents = [...prev.agents];
            newAgents[agentIndex] = { ...agent, domainId: targetDomainId };

            return { ...prev, agents: newAgents };
        });
    }, []);

    // Add a new Domain
    const addDomain = useCallback((name: string, description: string = '') => {
        const newDomain: Domain = {
            id: crypto.randomUUID(),
            name,
            mission: description,
            status: 'ACTIVE',
            authorityCeiling: 1, // Default to low authority for safety
        };

        setData((prev) => ({
            ...prev,
            domains: [...prev.domains, newDomain]
        }));
    }, []);

    // Delete a Domain (only if empty)
    const deleteDomain = useCallback((domainId: string) => {
        setData((prev) => {
            // Check if domain has agents
            const hasAgents = prev.agents.some(a => a.domainId === domainId);
            if (hasAgents) {
                // In a real app we might return an error, but for this simpler store 
                // we'll just log and ignore (UI should strictly prevent this anyway via UX)
                console.warn('Cannot delete non-empty domain');
                return prev;
            }

            return {
                ...prev,
                domains: prev.domains.filter(d => d.id !== domainId)
            };
        });
    }, []);

    // Add a new Agent
    const addAgent = useCallback((domainId: string, name: string) => {
        const newAgent: Agent = {
            id: crypto.randomUUID(),
            domainId,
            name,
            role: 'New Agent', // Default
            executionType: 'ADVISORY', // Safest default
            autonomyLevel: 1, // Lowest default
            executionSurface: 'READ', // Safest default
            escalationBehavior: 'HUMAN_REQUIRED' // Safest default
        };

        setData((prev) => ({
            ...prev,
            agents: [...prev.agents, newAgent]
        }));
    }, []);

    // Delete an Agent
    const deleteAgent = useCallback((agentId: string) => {
        setData((prev) => ({
            ...prev,
            agents: prev.agents.filter(a => a.id !== agentId)
        }));
    }, []);

    // Phase 8A: Update Organization
    const updateOrganization = useCallback((updates: Partial<Organization>) => {
        setData((prev) => ({
            ...prev,
            organization: { ...prev.organization, ...updates }
        }));
    }, []);

    // Phase 8B: Update Domain
    const updateDomain = useCallback((domainId: string, updates: Partial<Domain>) => {
        setData((prev) => ({
            ...prev,
            domains: prev.domains.map(d =>
                d.id === domainId ? { ...d, ...updates } : d
            )
        }));
    }, []);

    return {
        data,
        moveDomain,
        moveAgent,
        addDomain,
        deleteDomain,
        addAgent,
        deleteAgent,
        updateOrganization,
        updateDomain
    };
}
