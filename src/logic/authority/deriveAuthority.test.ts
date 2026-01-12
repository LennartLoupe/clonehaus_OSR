import { describe, it, expect } from '@jest/globals';
import {
    deriveOrganizationAuthority,
    deriveDomainAuthority,
    deriveAgentAuthority,
} from './deriveAuthority';
import { Organization, Domain, Agent } from '@/app/data/types';

describe('Authority Derivation Engine', () => {
    // Test data
    const testOrg: Organization = {
        id: 'org-001',
        name: 'Test Organization',
        status: 'LOCKED',
        authorityCeiling: 3,
        escalationDefault: 'HUMAN',
        communicationPosture: 'BALANCED',
    };

    const testDomain: Domain = {
        id: 'dom-001',
        organizationId: 'org-001',
        name: 'Test Domain',
        mission: 'Test mission',
        status: 'READY',
        authorityCeiling: 2,
        allowedActionCategories: ['Test'],
    };

    const testAgent: Agent = {
        id: 'agt-001',
        domainId: 'dom-001',
        name: 'Test Agent',
        role: 'Test Role',
        executionType: 'EXECUTION',
        autonomyLevel: 2,
        executionSurface: 'WRITE',
        escalationBehavior: 'AUTO',
    };

    describe('deriveOrganizationAuthority', () => {
        it('should derive authority for organization', () => {
            const result = deriveOrganizationAuthority(testOrg);

            expect(result.effectiveAuthorityLevel).toBe(3);
            expect(result.authoritySourcePath).toHaveLength(1);
            expect(result.authoritySourcePath[0]).toEqual({
                level: 'ORGANIZATION',
                name: 'Test Organization',
                ceiling: 3,
            });
        });

        it('should be deterministic', () => {
            const result1 = deriveOrganizationAuthority(testOrg);
            const result2 = deriveOrganizationAuthority(testOrg);

            expect(result1).toEqual(result2);
        });

        it('should show blocked actions for low authority org', () => {
            const lowAuthOrg: Organization = {
                ...testOrg,
                authorityCeiling: 1,
            };

            const result = deriveOrganizationAuthority(lowAuthOrg);

            expect(result.effectiveAuthorityLevel).toBe(1);
            expect(result.blockedActions.length).toBeGreaterThan(0);
        });
    });

    describe('deriveDomainAuthority', () => {
        it('should derive authority for domain', () => {
            const result = deriveDomainAuthority(testOrg, testDomain);

            // Domain ceiling (2) is lower than org (3), so effective = 2
            expect(result.effectiveAuthorityLevel).toBe(2);
            expect(result.authoritySourcePath).toHaveLength(2);
            expect(result.authoritySourcePath[0].level).toBe('ORGANIZATION');
            expect(result.authoritySourcePath[1].level).toBe('DOMAIN');
        });

        it('should enforce top-down inheritance (can only reduce)', () => {
            const highDomain: Domain = {
                ...testDomain,
                authorityCeiling: 5, // Higher than org ceiling of 3
            };

            const result = deriveDomainAuthority(testOrg, highDomain);

            // Should be capped at org ceiling
            expect(result.effectiveAuthorityLevel).toBe(3);
        });

        it('should explain restriction when domain reduces org authority', () => {
            const result = deriveDomainAuthority(testOrg, testDomain);

            const hasRestrictionBlock = result.blockedActions.some((action) =>
                action.includes('Domain authority ceiling')
            );
            expect(hasRestrictionBlock).toBe(true);
        });

        it('should be deterministic', () => {
            const result1 = deriveDomainAuthority(testOrg, testDomain);
            const result2 = deriveDomainAuthority(testOrg, testDomain);

            expect(result1).toEqual(result2);
        });
    });

    describe('deriveAgentAuthority', () => {
        it('should derive authority for agent', () => {
            const result = deriveAgentAuthority(testOrg, testDomain, testAgent);

            // Full chain: org=3, domain=2, agent=2 → min = 2
            expect(result.effectiveAuthorityLevel).toBe(2);
            expect(result.authoritySourcePath).toHaveLength(3);
            expect(result.authoritySourcePath[0].level).toBe('ORGANIZATION');
            expect(result.authoritySourcePath[1].level).toBe('DOMAIN');
            expect(result.authoritySourcePath[2].level).toBe('AGENT');
        });

        it('should enforce full chain minimum', () => {
            const lowAgent: Agent = {
                ...testAgent,
                autonomyLevel: 1, // Lower than domain (2) and org (3)
            };

            const result = deriveAgentAuthority(testOrg, testDomain, lowAgent);

            expect(result.effectiveAuthorityLevel).toBe(1);
        });

        it('should block based on execution surface', () => {
            const readOnlyAgent: Agent = {
                ...testAgent,
                executionSurface: 'READ',
            };

            const result = deriveAgentAuthority(testOrg, testDomain, readOnlyAgent);

            const hasReadBlock = result.blockedActions.some((action) =>
                action.includes('READ-only')
            );
            expect(hasReadBlock).toBe(true);
        });

        it('should block based on execution type', () => {
            const advisoryAgent: Agent = {
                ...testAgent,
                executionType: 'ADVISORY',
            };

            const result = deriveAgentAuthority(testOrg, testDomain, advisoryAgent);

            const hasAdvisoryBlock = result.blockedActions.some((action) =>
                action.includes('ADVISORY')
            );
            expect(hasAdvisoryBlock).toBe(true);
        });

        it('should be deterministic', () => {
            const result1 = deriveAgentAuthority(testOrg, testDomain, testAgent);
            const result2 = deriveAgentAuthority(testOrg, testDomain, testAgent);

            expect(result1).toEqual(result2);
        });

        it('should have no side effects', () => {
            const orgBefore = { ...testOrg };
            const domainBefore = { ...testDomain };
            const agentBefore = { ...testAgent };

            deriveAgentAuthority(testOrg, testDomain, testAgent);

            // Verify input objects were not mutated
            expect(testOrg).toEqual(orgBefore);
            expect(testDomain).toEqual(domainBefore);
            expect(testAgent).toEqual(agentBefore);
        });
    });

    describe('Authority Inheritance Chain', () => {
        it('should demonstrate strict top-down inheritance', () => {
            const restrictiveOrg: Organization = {
                ...testOrg,
                authorityCeiling: 1,
            };
            const permissiveDomain: Domain = {
                ...testDomain,
                authorityCeiling: 3,
            };
            const permissiveAgent: Agent = {
                ...testAgent,
                autonomyLevel: 3,
            };

            const result = deriveAgentAuthority(
                restrictiveOrg,
                permissiveDomain,
                permissiveAgent
            );

            // Even though domain and agent want 3, org ceiling of 1 restricts all
            expect(result.effectiveAuthorityLevel).toBe(1);
        });

        it('should show complete source path', () => {
            const result = deriveAgentAuthority(testOrg, testDomain, testAgent);

            expect(result.authoritySourcePath[0].name).toBe('Test Organization');
            expect(result.authoritySourcePath[1].name).toBe('Test Domain');
            expect(result.authoritySourcePath[2].name).toBe('Test Agent');
        });
    });
});
