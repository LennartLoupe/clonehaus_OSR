import { Phase0Data } from './types';

export type NodeData = {
    id: string;
    label: string;
    children?: NodeData[];
};

export function phase0ToOrgTree(data: Phase0Data): NodeData {
    const domainNodes: Record<string, NodeData> = {};

    // Build domain nodes
    for (const domain of data.domains) {
        domainNodes[domain.id] = {
            id: domain.id,
            label: domain.name,
            children: []
        };
    }

    // Attach agents to domains
    for (const agent of data.agents) {
        const domainNode = domainNodes[agent.domainId];
        if (!domainNode) continue;

        domainNode.children!.push({
            id: agent.id,
            label: agent.name
        });
    }

    // Root organization node
    return {
        id: data.organization.id,
        label: data.organization.name,
        children: Object.values(domainNodes)
    };
}