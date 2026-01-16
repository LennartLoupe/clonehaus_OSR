import { Phase0Data } from './types';

export const PHASE0_DATA: Phase0Data = {
    organization: {
        id: 'org-001',
        name: 'Nebula Industries AI',
        status: 'DRAFT',
        authorityCeiling: 3,
        globalActions: ['READ', 'WRITE', 'EXECUTE', 'ESCALATE'],
        escalationBaseline: 'HUMAN_SENSITIVE',
        communicationPosture: 'BALANCED'
    },
    domains: [
        {
            id: 'dom-fin',
            organizationId: 'org-001',
            name: 'Financial Operations',
            mission: 'Ensure accuracy and compliance in automated financial reporting.',
            status: 'READY',
            authorityCeiling: 2,
            allowedActionCategories: ['Report Generation', 'Data Reconciliation', 'Fraud Detection'],
            scope: 'Financial reporting and compliance audit.',
            escalationPosture: 'HUMAN_SENSITIVE',
            constraints: ['All discrepancy reports require approval']
        },
        {
            id: 'dom-cust',
            organizationId: 'org-001',
            name: 'Customer Experience',
            mission: 'Deliver responsive and empathetic support across digital channels.',
            status: 'DRAFT',
            authorityCeiling: 1,
            allowedActionCategories: ['Inquiry Response', 'Ticket Triage', 'Sentiment Analysis'],
            scope: 'Customer support and sentiment tracking.',
            escalationPosture: 'ALWAYS_AUTO',
            constraints: ['No access to billing data']
        },
        {
            id: 'dom-tech',
            organizationId: 'org-001',
            name: 'Infrastructure Ops',
            mission: 'Maintain system stability and optimize resource allocation.',
            status: 'DRAFT',
            authorityCeiling: 3,
            allowedActionCategories: ['Log Analysis', 'Resource Scaling', 'Alert Management'],
            scope: 'System health monitoring and scaling.',
            escalationPosture: 'HUMAN_SENSITIVE',
            constraints: ['Production scaling requires limits']
        }
    ],
    agents: [
        // Financial Ops Agents
        {
            id: 'agt-fin-audit',
            domainId: 'dom-fin',
            name: 'Audit Sentinel',
            role: 'Compliance Auditor',
            executionType: 'ADVISORY',
            autonomyLevel: 1,
            executionSurface: 'READ',
            escalationBehavior: 'HUMAN_REQUIRED'
        },
        {
            id: 'agt-fin-recon',
            domainId: 'dom-fin',
            name: 'Reconciler X',
            role: 'Transaction Matcher',
            executionType: 'EXECUTION',
            autonomyLevel: 2,
            executionSurface: 'WRITE',
            escalationBehavior: 'AUTO'
        },
        // Customer Experience Agents
        {
            id: 'agt-cust-triage',
            domainId: 'dom-cust',
            name: 'Triage Mate',
            role: 'Ticket Router',
            executionType: 'DECISION',
            autonomyLevel: 2,
            executionSurface: 'WRITE',
            escalationBehavior: 'AUTO'
        },
        {
            id: 'agt-cust-resp',
            domainId: 'dom-cust',
            name: 'Responder Bot',
            role: 'First Responder',
            executionType: 'EXECUTION',
            autonomyLevel: 1,
            executionSurface: 'WRITE',
            escalationBehavior: 'HUMAN_REQUIRED'
        },
        // Infrastructure Ops Agents
        {
            id: 'agt-tech-mon',
            domainId: 'dom-tech',
            name: 'System Watchdog',
            role: 'Monitor',
            executionType: 'ADVISORY',
            autonomyLevel: 3,
            executionSurface: 'READ',
            escalationBehavior: 'AUTO'
        },
        {
            id: 'agt-tech-scale',
            domainId: 'dom-tech',
            name: 'AutoScaler',
            role: 'Resource Manager',
            executionType: 'EXECUTION',
            autonomyLevel: 3,
            executionSurface: 'EXECUTE',
            escalationBehavior: 'HUMAN_REQUIRED'
        }
    ]
};
