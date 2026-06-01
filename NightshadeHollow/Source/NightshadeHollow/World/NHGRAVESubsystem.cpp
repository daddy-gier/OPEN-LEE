#include "World/NHGRAVESubsystem.h"

void UNHGRAVESubsystem::Initialize(FSubsystemCollectionBase& Collection)
{
    Super::Initialize(Collection);
    SeedLocations();
    UE_LOG(LogTemp, Log, TEXT("[NH|GRAVE] Subsystem online — %d locations seeded."),
           Locations.Num());
}

void UNHGRAVESubsystem::SeedLocations()
{
    auto Add = [&](FName ID, ENHGRAVEStratum S, FString Name, FString Atmo,
                   FName Faction, bool bFlood, FString Lore)
    {
        FNHGRAVELocation L;
        L.LocationID = ID; L.Stratum = S; L.DisplayName = Name;
        L.Atmosphere = Atmo; L.ControllingFaction = Faction;
        L.bFlooded = bFlood; L.LoreNote = Lore; L.bDiscovered = false;
        Locations.Add(ID, L);
    };

    Add("GRAVE_S01_Access",
        ENHGRAVEStratum::S01_ServiceCorridor,
        "Service Corridor",
        "Bare concrete, buzzing fluorescents, maintenance carts left mid-aisle.",
        "SewerRats", false,
        "Guard maintenance logs show weekly inspections. Last entry: three months ago.");

    Add("GRAVE_S02_MaintA",
        ENHGRAVEStratum::S02_MaintenanceA,
        "Maintenance Level A",
        "Pipe work overhead, dripping water, tool cages locked with rusted padlocks.",
        "SewerRats", false,
        "Original construction: 1962. Expansion during the '89 riot aftermath.");

    Add("GRAVE_S03_MaintB",
        ENHGRAVEStratum::S03_MaintenanceB,
        "Maintenance Level B",
        "Narrower. The air tastes of grease and old copper.",
        "SewerRats", false,
        "A hand-drawn map is scratched into the wall. Someone counted the steps.");

    Add("GRAVE_S04_Vault",
        ENHGRAVEStratum::S04_UtilityVault,
        "Utility Vault",
        "Electrical panels, generator housing, the hum of the building's heartbeat.",
        "IronCircuit", false,
        "IronCircuit runs contraband comms through repurposed breaker panels.");

    Add("GRAVE_S05_RiotN",
        ENHGRAVEStratum::S05_RiotTunnelNorth,
        "Riot Tunnel North",
        "Wide enough for six men abreast. Designed to flood. Currently dry.",
        "SewerRats", false,
        "Built for staff evacuation after the '89 riot. Repurposed by inmates within a decade.");

    Add("GRAVE_S06_RiotS",
        ENHGRAVEStratum::S06_RiotTunnelSouth,
        "Riot Tunnel South",
        "Twin to the north tunnel. Charred wall — something burned here years ago.",
        "SewerRats", false,
        "Scorch marks date to 2004. Nobody official will say what happened.");

    Add("GRAVE_S07_Market",
        ENHGRAVEStratum::S07_BlackMarketLevel,
        "The Under-Market",
        "Makeshift stalls, string lights, the smell of cigarettes and cheap food.",
        "BlackLanternMob", false,
        "The most dangerous marketplace you'll never find on a map.");

    Add("GRAVE_S08_MilE",
        ENHGRAVEStratum::S08_OldMilTunnelEast,
        "Old Military Tunnel East",
        "Pre-prison construction. Cold War era. The walls feel older than the building.",
        NAME_None, false,
        "Decommissioned Army Corps of Engineers work. Original purpose classified.");

    Add("GRAVE_S09_MilW",
        ENHGRAVEStratum::S09_OldMilTunnelWest,
        "Old Military Tunnel West",
        "Collapsed partially. There is a way through if you're small enough.",
        NAME_None, false,
        "One end leads toward the outer perimeter. No one has followed it to the end and come back.");

    Add("GRAVE_S10_Subsid",
        ENHGRAVEStratum::S10_SubsidenceLayer,
        "Subsidence Layer",
        "The floor tilts. Cracks in the bedrock. It moves when heavy vehicles pass above.",
        NAME_None, false,
        "Geotechnical survey from 2018 was redacted. Structure is technically unsound.");

    Add("GRAVE_S11_FloodA",
        ENHGRAVEStratum::S11_FloodedChamberA,
        "Flooded Chamber A",
        "Black water to the knee. Echoes. Something moves below the surface.",
        NAME_None, true,
        "Flooded during the 2011 storm. Not officially on any maintenance schedule.");

    Add("GRAVE_S12_FloodB",
        ENHGRAVEStratum::S12_FloodedChamberB,
        "Flooded Chamber B",
        "Chest-deep. The walls are covered in something that looks like moss but isn't.",
        NAME_None, true,
        "MarrowPilgrims believe the water here is sacred. They won't say why.");

    Add("GRAVE_S13_Approach",
        ENHGRAVEStratum::S13_MarrowApproach,
        "The Marrow Approach",
        "The tunnel narrows. Symbols are carved into both walls. Older than the prison.",
        "MarrowPilgrims", false,
        "No one carves these symbols now. No one admits to carving them ever.");

    Add("GRAVE_S14_Church",
        ENHGRAVEStratum::S14_MarrowChurch,
        "Marrow Church",
        "A vaulted chamber impossible for this depth. Pews made of salvaged wood. A pulpit.",
        "MarrowPilgrims", false,
        "The Marrow Pilgrims hold services here. Attendance is invitation only.");

    Add("GRAVE_S15_Shrine",
        ENHGRAVEStratum::S15_BraxtonShrine,
        "Braxton Shrine",
        "A single candle always burns. Photographs, names, prayers. Absolute silence.",
        NAME_None, false,
        "No faction claims ownership. No one defiles it. That is the rule.");

    Add("GRAVE_S16_DeepVein",
        ENHGRAVEStratum::S16_DeepVein,
        "The Deep Vein",
        "A natural fissure running through the constructed tunnel. It breathes.",
        NAME_None, false,
        "The original surveyors noted it. Everyone since has pretended it isn't there.");

    Add("GRAVE_S17_Blast",
        ENHGRAVEStratum::S17_OldBlastChamber,
        "Old Blast Chamber",
        "Circular room, scorched, with a steel door that no longer seals.",
        NAME_None, false,
        "Used for controlled detonations during construction. Or so the official record says.");

    Add("GRAVE_S18_ThirtyThree",
        ENHGRAVEStratum::S18_ThirtyThreePassage,
        "Thirty-Three Passage",
        "The longest straight stretch in GRAVE. You can't see either end from the middle.",
        NAME_None, false,
        "Thirty-three inmates escaped through here in a single night. Only nine were recaptured. "
        "The other twenty-four are officially listed as deceased.");

    Add("GRAVE_S19_Fault",
        ENHGRAVEStratum::S19_BedrockFault,
        "Bedrock Fault",
        "The bedrock has split. The gap is navigable. The sound it makes is not something you forget.",
        NAME_None, false,
        "Geologically active. The prison sits on a micro-fault that nobody wants to talk about.");

    Add("GRAVE_S20_Escape",
        ENHGRAVEStratum::S20_EscapeRoot,
        "The Escape Root",
        "At -240 feet, an opening large enough for a person. Cold air from outside. Freedom or death.",
        NAME_None, false,
        "The end of the line. What's on the other side depends entirely on when you arrive.");
}

bool UNHGRAVESubsystem::DiscoverLocation(FName LocationID)
{
    FNHGRAVELocation* L = Locations.Find(LocationID);
    if (!L || L->bDiscovered) return false;

    L->bDiscovered = true;
    OnLocationDiscovered.Broadcast(*L);
    UE_LOG(LogTemp, Log, TEXT("[NH|GRAVE] Discovered: %s (%s)"),
           *L->DisplayName, *LocationID.ToString());
    return true;
}

bool UNHGRAVESubsystem::IsDiscovered(FName LocationID) const
{
    const FNHGRAVELocation* L = Locations.Find(LocationID);
    return L && L->bDiscovered;
}

TArray<FNHGRAVELocation> UNHGRAVESubsystem::GetDiscoveredLocations() const
{
    TArray<FNHGRAVELocation> Result;
    for (const auto& Pair : Locations)
    {
        if (Pair.Value.bDiscovered) Result.Add(Pair.Value);
    }
    return Result;
}

const FNHGRAVELocation* UNHGRAVESubsystem::GetLocation(FName LocationID) const
{
    return Locations.Find(LocationID);
}

void UNHGRAVESubsystem::SetFloodState(ENHGRAVEStratum Stratum, bool bFlooded)
{
    for (auto& Pair : Locations)
    {
        if (Pair.Value.Stratum == Stratum)
        {
            Pair.Value.bFlooded = bFlooded;
            OnFloodChanged.Broadcast(Stratum, bFlooded);
            return;
        }
    }
}

bool UNHGRAVESubsystem::IsStratumFlooded(ENHGRAVEStratum Stratum) const
{
    for (const auto& Pair : Locations)
    {
        if (Pair.Value.Stratum == Stratum) return Pair.Value.bFlooded;
    }
    return false;
}
