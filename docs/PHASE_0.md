# PHASE 0 — Static Foundation (No Backend)

## Purpose

Phase 0 establishes a **fully navigable, visually complete, static version** of the Clonehaus OSR application.

This phase:
- Implements the **AI Org Chart as the primary and only surface**
- Unifies OS, Studio, and Runtime conceptually in one UI
- Introduces **no real backend logic**
- Uses static data and mocked state only

The goal is **clarity, correctness, and maturity of structure** before any persistence or enforcement logic is introduced.

---

## Non-Goals (Strict)

Phase 0 does NOT include:
- Authentication
- Databases
- API calls
- Runtime enforcement
- Real policy execution
- Agent execution or LLM integration

If it requires a backend, it is **out of scope**.

---

## Core Assumption

Everything lives inside the **AI Org Chart**.

There are no “sections,” “modules,” or “apps.”
OS, Studio, and Runtime are **modes of interaction with nodes** in the same graph.

---

## Primary Views (Must Exist)

### 1. AI Org Chart Canvas (Default View)

The canvas is the home screen.

**Required features:**
- Centered Organization Root node
- Domain nodes (Level 2) branching below
- Agent nodes branching below domains
- Pan + zoom support
- Grid background
- Dark, premium visual style (matching mockup)

**No empty states.**
If no data exists, show a sample organization.

---

### 2. Structure View vs AI Footprint View

A toggle in the top-right switches modes.

#### Structure View
- Clean hierarchy
- Emphasis on ownership and containment
- No heat overlays

#### AI Footprint View
- Heatmap overlays enabled
- Visual encoding of:
  - Autonomy level
  - Execution surface
  - Escalation sensitivity

Switching views must:
- Not reload the page
- Not reset selection
- Only affect visual styling

---

## Node Types (Static)

### Organization Root (Level 1)

**Displayed as:**
- Single large node at top
- Status badge (OS Draft / Locked)

**Clicking opens right-side panel with:**
- Global authority ceiling (slider, disabled)
- Global escalation defaults
- Ethical constraints
- Communication posture
- “Configure Organization Baseline” (disabled button)

All fields are static text or disabled inputs.

---

### Domain Nodes (Level 2)

**Displayed as:**
- Medium-sized nodes
- Status: Draft / Ready
- Agent count
- Autonomy ceiling indicator

**Clicking opens right-side panel with:**
- Domain mission
- Inherited authority ceiling visualization
- Domain-specific constraints
- Allowed action categories
- “Configure Domain Scope” (disabled)
- “View Authority Translation” (disabled)

---

### Agent Nodes (Leaf Nodes)

**Displayed as:**
- Small nodes
- Role name
- Execution type badge:
  - Advisory
  - Decision
  - Execution

**Clicking opens right-side panel with:**
- Agent type
- Execution surface
- Autonomy level
- Escalation behavior
- Studio configuration preview
- “Open in Studio (Coming Soon)” button

No editing allowed.

---

## Right-Side Detail Panel (Global)

This panel:
- Slides in from the right
- Is context-aware (Org / Domain / Agent)
- Never stacks
- Always replaces previous content

Must include:
- Clear hierarchy label (Level 1 / Level 2 / Agent)
- Status indicator
- Consistent section layout

---

## Heatmap Legend (AI Footprint View Only)

A floating legend in bottom-left showing:

### Heat Dimensions
- Autonomy Level (gradient)
- Execution Surface (Read / Write / Execute)
- Escalation Sensitivity (color dot)

Legend must be:
- Always visible in Footprint View
- Hidden in Structure View

---

## Static Data Source

All data is loaded from a **single static file**, for example: