# Nightshade Hollow — Story Structure

> Fill in each section. Every chapter maps to a game level or major area
> of the prison. Each event maps to a gameplay trigger that OPEN-LEE will
> resolve when the player makes a choice.

---

## Premise

*1-2 sentences: who is the player, why are they in Nightshade Hollow, what do they want?*

---

## The Prison

**Official Name:** Nightshade Hollow Correctional Facility
**Location:**
**Known For:**
**Warden:**
**Dark Secret:**

---

## Act Structure

### Act 1 — Arrival
**Goal:** Survive first days; learn the rules; meet key NPCs.

| Event ID | Event Name | Player Choices | Consequence A | Consequence B |
|---|---|---|---|---|
| `ev_arrival_01` | First Night in Cell | Fight / Submit | Gains Influence / Loses Health | |
| `ev_arrival_02` | | | | |

**Chapter End Condition:**
**Story Flags Set:**

---

### Act 2 — Survival & Alliance
**Goal:** Form alliances; discover the prison's hidden truth.

| Event ID | Event Name | Player Choices | Consequence A | Consequence B |
|---|---|---|---|---|
| `ev_ch2_01` | | | | |

**Chapter End Condition:**
**Story Flags Set:**

---

### Act 3 — The Plan
**Goal:** Devise and prepare the escape / confrontation.

| Event ID | Event Name | Player Choices | Consequence A | Consequence B |
|---|---|---|---|---|
| `ev_ch3_01` | | | | |

**Chapter End Condition:**
**Story Flags Set:**

---

### Act 4 — The Breaking Point
**Goal:** Execute the plan; everything falls apart in some way.

| Event ID | Event Name | Player Choices | Consequence A | Consequence B |
|---|---|---|---|---|
| `ev_ch4_01` | | | | |

---

### Act 5 — Resolution
**Multiple Endings:**

| Ending ID | Name | Trigger Conditions | Description |
|---|---|---|---|
| `end_escape` | The Escape | flags: [...] | |
| `end_stay` | Acceptance | flags: [...] | |
| `end_truth` | Expose Everything | flags: [...] | |

---

## Key Story Flags

List every flag name you want the game to track:

```
met_warden
cell_block_c_unlocked
riot_triggered
found_contraband
informant_exposed
escape_route_found
```

---

## Themes

*What is this story really about? (e.g. power, redemption, identity, trust)*

---

## Tone Reference

*How should the game feel? (e.g. slow-burn psychological thriller, gritty realism, dark hope)*
