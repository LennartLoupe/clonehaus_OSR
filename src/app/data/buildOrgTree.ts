import { Phase0Data } from './types';
import { NodeData } from '@/components/OrgChartCanvas';

export function buildOrgTree(data: Phase0Data): NodeData {
    const domainNodes: Record<string, NodeData> = {};
    const agentNodesByDomain: Record<string, NodeData[]> = {};

    // Prepare agent buckets
    data.agents.forEach(agent => {
        if (!agentNodesByDomain[agent.domainId]) {
            agentNodesByDomain[agent.domainId] = [];
        }

        agentNodesByDomain[agent.domainId].push({
            id: agent.id,
            label: agent.name,
            type: 'AGENT',
            children: [],
        });
    });

    // Build domain nodes
    data.domains.forEach(domain => {
        domainNodes[domain.id] = {
            id: domain.id,
            label: domain.name,
            type: 'DOMAIN',
            children: agentNodesByDomain[domain.id] ?? [],
        };
    });

    // Build org root
    return {
        id: data.organization.id,
        label: data.organization.name,
        type: 'ORGANIZATION',
        children: Object.values(domainNodes),
    };
}