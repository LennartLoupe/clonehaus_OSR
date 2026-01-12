/**
 * Authority Derivation Verification Script
 * 
 * This script demonstrates the authority derivation engine
 * using actual Phase 0 data.
 */

import { PHASE0_DATA } from './app/data/phase0.data';
import {
    deriveOrganizationAuthority,
    deriveDomainAuthority,
    deriveAgentAuthority,
} from './logic/authority/deriveAuthority';

console.log('='.repeat(80));
console.log('AUTHORITY DERIVATION ENGINE - VERIFICATION');
console.log('='.repeat(80));
console.log();

// ============================================================================
// ORGANIZATION AUTHORITY
// ============================================================================

console.log('1. ORGANIZATION AUTHORITY');
console.log('-'.repeat(80));
const orgAuthority = deriveOrganizationAuthority(PHASE0_DATA.organization);
console.log(`Organization: ${PHASE0_DATA.organization.name}`);
console.log(`Effective Authority Level: ${orgAuthority.effectiveAuthorityLevel}`);
console.log();
console.log('Authority Source Path:');
orgAuthority.authoritySourcePath.forEach((entry, index) => {
    console.log(`  ${index + 1}. ${entry.level}: ${entry.name} (ceiling: ${entry.ceiling})`);
});
console.log();
console.log('Blocked Actions:');
if (orgAuthority.blockedActions.length === 0) {
    console.log('  None - Full authority granted');
} else {
    orgAuthority.blockedActions.forEach((action, index) => {
        console.log(`  ${index + 1}. ${action}`);
    });
}
console.log();
console.log();

// ============================================================================
// DOMAIN AUTHORITY
// ============================================================================

console.log('2. DOMAIN AUTHORITY');
console.log('-'.repeat(80));

PHASE0_DATA.domains.forEach((domain, domainIndex) => {
    const domainAuthority = deriveDomainAuthority(PHASE0_DATA.organization, domain);

    console.log(`\nDomain ${domainIndex + 1}: ${domain.name}`);
    console.log(`Effective Authority Level: ${domainAuthority.effectiveAuthorityLevel}`);
    console.log();
    console.log('Authority Source Path:');
    domainAuthority.authoritySourcePath.forEach((entry, index) => {
        console.log(`  ${index + 1}. ${entry.level}: ${entry.name} (ceiling: ${entry.ceiling})`);
    });
    console.log();
    console.log('Blocked Actions:');
    if (domainAuthority.blockedActions.length === 0) {
        console.log('  None');
    } else {
        domainAuthority.blockedActions.slice(0, 3).forEach((action, index) => {
            console.log(`  ${index + 1}. ${action}`);
        });
        if (domainAuthority.blockedActions.length > 3) {
            console.log(`  ... and ${domainAuthority.blockedActions.length - 3} more`);
        }
    }
    console.log();
});

console.log();

// ============================================================================
// AGENT AUTHORITY
// ============================================================================

console.log('3. AGENT AUTHORITY');
console.log('-'.repeat(80));

PHASE0_DATA.agents.slice(0, 3).forEach((agent, agentIndex) => {
    const domain = PHASE0_DATA.domains.find((d) => d.id === agent.domainId)!;
    const agentAuthority = deriveAgentAuthority(PHASE0_DATA.organization, domain, agent);

    console.log(`\nAgent ${agentIndex + 1}: ${agent.name}`);
    console.log(`Role: ${agent.role}`);
    console.log(`Effective Authority Level: ${agentAuthority.effectiveAuthorityLevel}`);
    console.log();
    console.log('Authority Source Path:');
    agentAuthority.authoritySourcePath.forEach((entry, index) => {
        console.log(`  ${index + 1}. ${entry.level}: ${entry.name} (ceiling: ${entry.ceiling})`);
    });
    console.log();
    console.log('Sample Blocked Actions:');
    agentAuthority.blockedActions.slice(0, 4).forEach((action, index) => {
        console.log(`  ${index + 1}. ${action}`);
    });
    if (agentAuthority.blockedActions.length > 4) {
        console.log(`  ... and ${agentAuthority.blockedActions.length - 4} more restrictions`);
    }
    console.log();
});

// ============================================================================
// DETERMINISM VERIFICATION
// ============================================================================

console.log();
console.log('4. DETERMINISM VERIFICATION');
console.log('-'.repeat(80));

const testAgent = PHASE0_DATA.agents[0];
const testDomain = PHASE0_DATA.domains.find((d) => d.id === testAgent.domainId)!;

const result1 = deriveAgentAuthority(PHASE0_DATA.organization, testDomain, testAgent);
const result2 = deriveAgentAuthority(PHASE0_DATA.organization, testDomain, testAgent);

const isDeterministic =
    result1.effectiveAuthorityLevel === result2.effectiveAuthorityLevel &&
    JSON.stringify(result1.authoritySourcePath) === JSON.stringify(result2.authoritySourcePath) &&
    JSON.stringify(result1.blockedActions) === JSON.stringify(result2.blockedActions);

console.log(`Same input, same output: ${isDeterministic ? '✓ PASS' : '✗ FAIL'}`);
console.log(`Agent: ${testAgent.name}`);
console.log(`Runs: 2`);
console.log(`Results match: ${isDeterministic}`);

console.log();
console.log('='.repeat(80));
console.log('VERIFICATION COMPLETE');
console.log('='.repeat(80));
