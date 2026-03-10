# Characters — Nightshade Hollow

One JSON file per character. Use `CHARACTER_TEMPLATE.json` as your starting point.

## Minimum required fields for OPEN-LEE to run NPC dialogue

```json
{
  "id": "guard_holloway",
  "name": "Guard Holloway",
  "role": "guard",
  "personality": "...",
  "backstory": "..."
}
```

The `personality` and `backstory` fields are sent directly as the AI persona
to OPEN-LEE's `/api/game/npc-dialogue` endpoint. Write them as if you're
briefing an actor — vivid, specific, and in plain prose.

## Suggested starter characters

- The Player (background, motivation, crime)
- The Warden (antagonist or ambiguous authority)
- A veteran prisoner (mentor figure)
- A guard (enforcer)
- A fellow new arrival (mirror character)
- An informant (trust hazard)
- A mysterious long-timer (lore keeper)
