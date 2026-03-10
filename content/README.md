# Nightshade Hollow — Content Directory

This folder holds all **raw game content** for Nightshade Hollow: story docs,
character profiles, prison location data, lore, concept art references, and
audio briefs. Drop your files here in the appropriate subfolder.

## Folder Map

| Folder | What goes here |
|---|---|
| `story/` | Story structure, chapter outlines, major events, endings |
| `characters/` | Character profiles (one JSON per character) |
| `prison/` | Location descriptions, cell block layouts, rules, atmosphere |
| `lore/` | World-building: backstory, history, factions, myth |
| `art/` | Concept art files, style guides, reference boards |
| `audio/` | Music briefs, ambient sound notes, VO scripts |

## How OPEN-LEE Uses This Content

OPEN-LEE reads content from these folders to:
1. Build character personas for NPC dialogue (from `characters/*.json`)
2. Generate story event consequences (from `story/`)
3. Answer world-building questions during development
4. Feed context into the in-game AI backend at runtime

## Workflow

1. **You → drop files here** in any format (`.md`, `.txt`, `.json`, `.pdf`)
2. **OPEN-LEE** reads and converts them to structured game data
3. **UE5** loads the structured data at runtime via the NHNarrativeManager

The `*_TEMPLATE.*` files in each subfolder show you the exact format expected.
You don't have to use the exact format — just include the same fields.
