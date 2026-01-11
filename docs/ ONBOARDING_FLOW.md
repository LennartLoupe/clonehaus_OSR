# ONBOARDING_FLOW.md  
Clonehaus — First-Time User Flow (FTUF)

## Purpose

This document defines the **first-time user flow** for Clonehaus.  
The goal is to guide new users from a **blank slate** to a **structured AI organization**, using the **AI Org Chart as the primary system surface**.

This flow assumes:
- A **clean rebuild** (no legacy UI assumptions)
- A **unified application** containing OS, Studio, and Runtime concepts
- Progressive disclosure of complexity
- No prior knowledge of AI governance or persona design

---

## Core Mental Model (Non-Negotiable)

Clonehaus operates **top-down**:
Organization
└─ Domains
└─ Agents
- Rules and constraints flow **downward**
- Authority is never defined bottom-up
- Agents inherit from Domains
- Domains inherit from Organization
- Runtime enforces what is designed here

This mental model must be reinforced visually and verbally throughout onboarding.

---

## Phase 0: Entry Point — Clean Slate

### Screen: Welcome / Empty Canvas

**Visual State**
- Full-screen canvas
- Subtle grid or neutral background
- No nodes visible
- Empty state feels intentional, not broken

**Primary Message**
> “Map how AI operates in your organization.”

**Supporting Copy**
> “Start by defining where AI works, what it can do, and how it operates.”

**Primary CTA**
- **Create Organization**

**Secondary (optional)**
- View Example (low emphasis)

---

## Phase 1: Create Organization (Root Node)

### Interaction: Modal or Side Panel

**Required Inputs**
- Organization name

**Optional Inputs**
- Short description
- Industry selector (used later for hints only)

**System Actions**
- Create Organization Root Node
- Place node at center of canvas
- Set lifecycle state to `OS_DRAFT`

**Visual Result**
- Organization node appears with:
  - Name
  - “Organization Root” label
  - Draft status indicator

**Next CTA**
- **Define where AI operates**

---

## Phase 2: Explain the System (One-Time Overlay)

### Purpose
Prevent future confusion before users add structure.

**Overlay Copy**
> “Clonehaus works top-down.  
> Organization rules apply to domains.  
> Domain rules apply to agents.”

**Visual Aid**
- Animated highlight:
  - Organization → Domain → Agent

**CTA**
- Got it, continue

This explanation is skippable but shown by default.

---

## Phase 3: Define AI Domains (Where AI Operates)

### Screen State
- Organization node visible
- Empty space beneath it

**Prompt**
> “Where does AI operate in your organization?”

**Guidance**
> “Think in responsibilities, not teams.  
> Examples: Customer Support, Finance Ops, Marketing Ops.”

**Primary CTA**
- **Add Domain**

---

### 3a. Add Domain

**Domain Inputs**
- Domain name
- Short mission statement

**System Actions**
- Create Domain Node
- Connect it to Organization node
- Mark status as `DRAFT`

**Post-Creation Nudges**
> “Most organizations have 2–5 AI domains. You can add more later.”

**Next Actions**
- Add another domain
- Continue to agents

---

## Phase 4: Add Agents to a Domain

### Trigger
User clicks a Domain node.

### Side Panel: Domain Detail

**Top Section**
- Domain name
- Status
- Indicators showing inherited organization rules (read-only)

**Prompt**
> “Which AI agents operate in this domain?”

**Primary CTA**
- **Add Agent**

---

### 4a. Add Agent (Lightweight Studio Entry)

This step introduces agent specificity **without full persona design**.

**Agent Inputs**
- Agent name
- Agent type:
  - Advisory
  - Execution
  - Decision
- One-line responsibility

**Optional**
- Execution surface selector (read / write / execute)

**System Actions**
- Create Agent Node
- Attach to Domain node
- Automatically inherit constraints

**Visual Feedback**
- Domain indicators update
- Agent count updates
- Heat/authority visualization updates

---

## Phase 5: Introduce Authority (Passive Awareness)

Once at least one agent exists:

**UI Changes**
- Heat indicators appear on nodes
- Labels such as:
  - “Low autonomy”
  - “Execution allowed”

**Tooltip / Info Icon**
> “Authority flows from the organization through domains to agents.  
> You’ll fine-tune this later.”

No decisions required yet. This is awareness only.

---

## Phase 6: Organization Baseline (Level 1 Entry)

Only after agents exist do we require organization-wide rules.

**Prompt**
> “Before agents can operate, define organization-wide rules.”

**CTA on Organization Node**
- **Configure Organization Baseline**

This timing ensures relevance and user motivation.

---

## Phase 7: Organization Baseline Configuration

**Focus Areas**
- Hard boundaries
- Escalation defaults
- Ethical constraints
- Communication posture

**Design Rules**
- Plain language inputs
- No policy DSL
- Human-readable first

**Live Feedback**
- Changes immediately affect:
  - Domains
  - Agents
  - Heat/authority indicators

This reinforces the top-down model.

---

## Phase 8: System Readiness Check

The system automatically detects readiness when:
- Organization baseline exists
- At least one domain exists
- At least one agent exists

**UI State**
- “System Ready for Translation” indicator appears

**CTA**
- Review & lock
- Proceed to authority translation (later phase)

---

## Outcome of First-Time Flow

By the end of onboarding, the user understands:

- Where AI exists in their organization
- What each agent is responsible for
- How authority is structured
- That OS defines the foundation
- That Studio specializes agents later
- That Runtime enforces what is designed here

No documentation required to reach this understanding.

---

## Design Principles Reinforced

- Start concrete, not abstract
- Governance follows structure, not the other way around
- Visual thinking before policy writing
- Progressive disclosure of complexity
- Chart is the system, not a visualization

---

## Next Documents (Recommended)

- `AI_ORG_CHART_DATA_MODEL.md`
- `AUTHORITY_FLOW.md`
- `STUDIO_ENTRY_FLOW.md`
- `RUNTIME_HANDOFF.md`