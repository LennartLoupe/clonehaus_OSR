export interface Organization {
    id: string;
    name: string;
    status: 'DRAFT' | 'LOCKED';
    authorityCeiling: number;
    escalationDefault: 'AUTO' | 'HUMAN';
    communicationPosture: 'FORMAL' | 'BALANCED' | 'FRIENDLY';
}

export interface Domain {
    id: string;
    organizationId: string;
    name: string;
    mission: string;
    status: 'DRAFT' | 'READY';
    authorityCeiling: number;
    allowedActionCategories: string[];
}

export interface Agent {
    id: string;
    domainId: string;
    name: string;
    role: string;
    executionType: 'ADVISORY' | 'DECISION' | 'EXECUTION';
    autonomyLevel: number;
    executionSurface: 'READ' | 'WRITE' | 'EXECUTE';
    escalationBehavior: 'AUTO' | 'HUMAN_REQUIRED';
}

export interface Phase0Data {
    organization: Organization;
    domains: Domain[];
    agents: Agent[];
}
