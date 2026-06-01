#include "Factions/NHFactionSubsystem.h"

void UNHFactionSubsystem::Initialize(FSubsystemCollectionBase& Collection)
{
    Super::Initialize(Collection);
    SeedFactions();
    SeedRelationships();
    SeedTerritoryControl();
    UE_LOG(LogTemp, Log, TEXT("[NH|Factions] Subsystem initialized — %d factions registered."),
           FactionRegistry.Num());
}

// ── Seed Data ─────────────────────────────────────────────────────────────────

void UNHFactionSubsystem::SeedFactions()
{
    // ── 5 Institutional Factions ─────────────────────────────────

    auto AddInst = [&](FName ID, FString Name, FString Desc, float Power, FLinearColor Color)
    {
        FNHFactionData F;
        F.FactionID = ID; F.DisplayName = Name; F.Description = Desc;
        F.Alignment = ENHFactionAlignment::Institutional;
        F.PowerLevel = Power; F.FactionColor = Color;
        FactionRegistry.Add(ID, F);
        FNHPlayerFactionRecord R; R.FactionID = ID; R.Score = 0;
        R.Standing = ENHFactionStanding::Neutral;
        PlayerStandings.Add(ID, R);
    };

    AddInst("Administration",    "Administration",          "Warden's office and senior staff.",                  90.f, FLinearColor(0.8f,0.8f,0.8f));
    AddInst("CorrOfficers",      "Correctional Officers",   "Line COs — daily enforcement.",                      75.f, FLinearColor(0.2f,0.4f,0.8f));
    AddInst("Medical",           "Medical",                 "Infirmary staff — neutral but watchful.",            40.f, FLinearColor(0.9f,0.9f,1.f));
    AddInst("ChapelFlock",       "Chapel Flock",            "Chaplain-led faith group; uneasy neutrality.",       30.f, FLinearColor(0.9f,0.85f,0.6f));
    AddInst("OldGuard",          "Old Guard",               "Veteran COs — resistant to change, deeply corrupt.", 60.f, FLinearColor(0.4f,0.4f,0.3f));

    // ── 50 Inmate Factions ───────────────────────────────────────

    auto AddInmate = [&](FName ID, FString Name, FString Desc, float Power, FLinearColor Color)
    {
        FNHFactionData F;
        F.FactionID = ID; F.DisplayName = Name; F.Description = Desc;
        F.Alignment = ENHFactionAlignment::Inmate;
        F.PowerLevel = Power; F.FactionColor = Color;
        FactionRegistry.Add(ID, F);
        FNHPlayerFactionRecord R; R.FactionID = ID; R.Score = 0;
        R.Standing = ENHFactionStanding::Neutral;
        PlayerStandings.Add(ID, R);
    };

    // Major factions
    AddInmate("HollowKings",     "Hollow Kings",        "Dominant inmate power — control Yard and Spine.",    88.f, FLinearColor(0.7f,0.1f,0.1f));
    AddInmate("CrimsonVerdict",  "Crimson Verdict",     "Legal-minded gang; run the prison economy.",         82.f, FLinearColor(0.9f,0.1f,0.0f));
    AddInmate("DayroomSaints",   "Dayroom Saints",      "Chapel-aligned; respected even by guards.",         70.f, FLinearColor(0.9f,0.9f,0.5f));
    AddInmate("IronCircuit",     "Iron Circuit",        "Tech-savvy contraband ring — own the comms.",        74.f, FLinearColor(0.3f,0.8f,0.3f));
    AddInmate("SewerRats",       "Sewer Rats",          "GRAVE tunnel runners — know every passage.",         55.f, FLinearColor(0.4f,0.3f,0.2f));
    AddInmate("BlackLanternMob", "Black Lantern Mob",   "Silent operators; no public face, deep reach.",      78.f, FLinearColor(0.1f,0.1f,0.2f));

    // Mid-tier factions
    AddInmate("BreakwaterCrew",  "Breakwater Crew",     "Old-timers; nostalgic power structure.",             58.f, FLinearColor(0.5f,0.6f,0.7f));
    AddInmate("GravelCourt",     "Gravel Court",        "Run the gym and weight room.",                       62.f, FLinearColor(0.6f,0.5f,0.4f));
    AddInmate("NightWeavers",    "Night Weavers",       "Active after lockdown — the midnight shift.",        50.f, FLinearColor(0.2f,0.1f,0.5f));
    AddInmate("CorridorWolves",  "Corridor Wolves",     "Control choke points and hallway movement.",         54.f, FLinearColor(0.7f,0.5f,0.2f));
    AddInmate("TinRoofTerrors",  "Tin Roof Terrors",    "Workshop inmates — contraband craftsmen.",           48.f, FLinearColor(0.8f,0.6f,0.3f));
    AddInmate("SaltlineCreed",   "Saltline Creed",      "Medical ward faction — control meds flow.",         56.f, FLinearColor(0.8f,0.9f,0.8f));
    AddInmate("RedDebtors",      "Red Debtors",         "Loan sharks — half the prison owes them.",          68.f, FLinearColor(0.9f,0.2f,0.2f));
    AddInmate("VaultKeepers",    "Vault Keepers",       "Commissary cartel; food and supply chain.",         64.f, FLinearColor(0.8f,0.7f,0.2f));
    AddInmate("GhostCourt",      "Ghost Court",         "Invisible — no known members, only results.",       45.f, FLinearColor(0.8f,0.8f,0.9f));

    // Smaller / emerging factions
    AddInmate("MarrowPilgrims",  "Marrow Pilgrims",     "GRAVE cult; believe tunnels hold answers.",         35.f, FLinearColor(0.3f,0.2f,0.1f));
    AddInmate("FenceSitters",    "Fence Sitters",       "Informants; play both sides.",                      28.f, FLinearColor(0.5f,0.5f,0.5f));
    AddInmate("BloodyAprons",    "Bloody Aprons",       "Kitchen staff gang — control chow timing.",         42.f, FLinearColor(0.7f,0.2f,0.2f));
    AddInmate("LibraryCircle",   "Library Circle",      "Educated inmates — information brokers.",           38.f, FLinearColor(0.4f,0.6f,0.8f));
    AddInmate("CellPhoneCartel", "Cell Phone Cartel",   "Contraband comms — prized and hunted.",             44.f, FLinearColor(0.2f,0.7f,0.2f));

    // Add remaining 30 inmate factions at lower power levels
    TArray<TPair<FName,FString>> RemainingFactions = {
        {"RustBloods",     "Rust Bloods"},       {"OctaveSociety",  "Octave Society"},
        {"PaintedHands",   "Painted Hands"},     {"Cinderwalkers",  "Cinderwalkers"},
        {"RoachCouncil",   "Roach Council"},     {"NoonShade",      "Noon Shade"},
        {"BarrelChest",    "Barrel Chest Crew"}, {"GrayMarket",     "Gray Market"},
        {"LockpickGuild",  "Lockpick Guild"},    {"MossbackClan",   "Mossback Clan"},
        {"HexWarden",      "Hex Warden"},        {"EmberCourt",     "Ember Court"},
        {"WhisperArch",    "Whisper Arch"},      {"StoneDebt",      "Stone Debt"},
        {"BrassKnuckles",  "Brass Knuckles"},    {"ScalpelLine",    "Scalpel Line"},
        {"TunneledEast",   "Tunneled East"},     {"PrisonPulpit",   "Prison Pulpit"},
        {"NightMason",     "Night Mason"},       {"ColdFront",      "Cold Front"},
        {"WardensEyes",    "Warden's Eyes"},     {"SkinDebtors",    "Skin Debtors"},
        {"FloorNine",      "Floor Nine"},        {"DustCollectors", "Dust Collectors"},
        {"BrokenCompass",  "Broken Compass"},    {"ChalkCircle",    "Chalk Circle"},
        {"SaltAndBlood",   "Salt and Blood"},    {"ThumbBreakers",  "Thumb Breakers"},
        {"RottenOrchard",  "Rotten Orchard"},    {"LoneSlate",      "Lone Slate"},
    };

    float PowerStep = 35.f;
    for (const auto& Pair : RemainingFactions)
    {
        PowerStep = FMath::Max(10.f, PowerStep - 0.5f);
        FNHFactionData F;
        F.FactionID = Pair.Key; F.DisplayName = Pair.Value;
        F.Alignment = ENHFactionAlignment::Inmate;
        F.PowerLevel = PowerStep;
        F.FactionColor = FLinearColor(FMath::FRandRange(0.2f,0.9f),
                                      FMath::FRandRange(0.2f,0.9f),
                                      FMath::FRandRange(0.2f,0.9f));
        FactionRegistry.Add(Pair.Key, F);
        FNHPlayerFactionRecord R; R.FactionID = Pair.Key; R.Score = 0;
        R.Standing = ENHFactionStanding::Neutral;
        PlayerStandings.Add(Pair.Key, R);
    }
}

void UNHFactionSubsystem::SeedRelationships()
{
    // Major rivalries and alliances
    ModifyFactionRelationship("HollowKings",    "CrimsonVerdict",  -40.f); // rivals for top spot
    ModifyFactionRelationship("HollowKings",    "SewerRats",        30.f); // tunnel access agreement
    ModifyFactionRelationship("DayroomSaints",  "ChapelFlock",      60.f); // chapel alliance
    ModifyFactionRelationship("IronCircuit",    "CellPhoneCartel",  50.f); // comms cooperation
    ModifyFactionRelationship("BlackLanternMob","RedDebtors",       40.f); // economic partnership
    ModifyFactionRelationship("MarrowPilgrims", "SewerRats",        70.f); // tunnel cult alignment
    ModifyFactionRelationship("FenceSitters",   "CorrOfficers",     35.f); // informant relationship
    ModifyFactionRelationship("OldGuard",       "HollowKings",      20.f); // corrupt arrangement
    ModifyFactionRelationship("GravelCourt",    "HollowKings",     -20.f); // gym territory tension
}

void UNHFactionSubsystem::SeedTerritoryControl()
{
    ZoneControl.Add(ENHPrisonZone::Yard,            "HollowKings");
    ZoneControl.Add(ENHPrisonZone::Corridor_Spine,  "CrimsonVerdict");
    ZoneControl.Add(ENHPrisonZone::Gym,             "GravelCourt");
    ZoneControl.Add(ENHPrisonZone::Workshop,        "TinRoofTerrors");
    ZoneControl.Add(ENHPrisonZone::Commissary,      "VaultKeepers");
    ZoneControl.Add(ENHPrisonZone::Infirmary,       "SaltlineCreed");
    ZoneControl.Add(ENHPrisonZone::Chapel,          "DayroomSaints");
    ZoneControl.Add(ENHPrisonZone::Library,         "LibraryCircle");
    ZoneControl.Add(ENHPrisonZone::Tunnels_GRAVE,   "SewerRats");
    ZoneControl.Add(ENHPrisonZone::Cafeteria,       "BloodyAprons");
}

// ── Query ─────────────────────────────────────────────────────────────────────

const FNHFactionData* UNHFactionSubsystem::GetFactionData(FName FactionID) const
{
    return FactionRegistry.Find(FactionID);
}

ENHFactionRelationship UNHFactionSubsystem::GetFactionRelationship(FName A, FName B) const
{
    const ENHFactionRelationship* Found = FactionRelationships.Find(MakeRelationshipKey(A, B));
    return Found ? *Found : ENHFactionRelationship::Neutral;
}

ENHFactionStanding UNHFactionSubsystem::GetPlayerStanding(FName FactionID) const
{
    const FNHPlayerFactionRecord* R = PlayerStandings.Find(FactionID);
    return R ? R->Standing : ENHFactionStanding::Neutral;
}

int32 UNHFactionSubsystem::GetPlayerScore(FName FactionID) const
{
    const FNHPlayerFactionRecord* R = PlayerStandings.Find(FactionID);
    return R ? R->Score : 0;
}

FName UNHFactionSubsystem::GetZoneController(ENHPrisonZone Zone) const
{
    const FName* F = ZoneControl.Find(Zone);
    return F ? *F : NAME_None;
}

TArray<FName> UNHFactionSubsystem::GetPlayerAlliedFactions() const
{
    TArray<FName> Result;
    for (const auto& Pair : PlayerStandings)
    {
        if (Pair.Value.Standing >= ENHFactionStanding::Respected)
        {
            Result.Add(Pair.Key);
        }
    }
    return Result;
}

TArray<FName> UNHFactionSubsystem::GetPlayerHostileFactions() const
{
    TArray<FName> Result;
    for (const auto& Pair : PlayerStandings)
    {
        if (Pair.Value.Standing <= ENHFactionStanding::Hostile)
        {
            Result.Add(Pair.Key);
        }
    }
    return Result;
}

// ── Mutation ──────────────────────────────────────────────────────────────────

void UNHFactionSubsystem::ModifyPlayerStanding(FName FactionID, int32 Delta)
{
    FNHPlayerFactionRecord* R = PlayerStandings.Find(FactionID);
    if (!R) return;

    R->Score = FMath::Clamp(R->Score + Delta, -100, 100);
    ENHFactionStanding OldStanding = R->Standing;
    R->Standing = ScoreToStanding(R->Score);

    if (R->Standing != OldStanding)
    {
        OnPlayerFactionStandingChanged.Broadcast(FactionID, R->Standing);
        UE_LOG(LogTemp, Log, TEXT("[NH|Factions] Player standing with %s → %d"),
               *FactionID.ToString(), (int32)R->Standing);
    }
}

void UNHFactionSubsystem::ModifyPlayerStandingWithRipple(FName FactionID, int32 Delta)
{
    ModifyPlayerStanding(FactionID, Delta);

    // Allies get half the benefit/penalty
    for (const auto& RelPair : FactionRelationships)
    {
        // Only process relationships involving FactionID
        FString KeyStr = RelPair.Key.ToString();
        FString FA, FB;
        if (!KeyStr.Split(TEXT(":"), &FA, &FB)) continue;

        FName OtherFaction = NAME_None;
        if (FName(*FA) == FactionID)       OtherFaction = FName(*FB);
        else if (FName(*FB) == FactionID)  OtherFaction = FName(*FA);
        if (OtherFaction == NAME_None) continue;

        int32 RippleDelta = 0;
        switch (RelPair.Value)
        {
        case ENHFactionRelationship::Allied:      RippleDelta =  FMath::RoundToInt(Delta * 0.5f); break;
        case ENHFactionRelationship::Cooperative: RippleDelta =  FMath::RoundToInt(Delta * 0.25f); break;
        case ENHFactionRelationship::Hostile:     RippleDelta = -FMath::RoundToInt(Delta * 0.25f); break;
        case ENHFactionRelationship::War:         RippleDelta = -FMath::RoundToInt(Delta * 0.5f); break;
        default: break;
        }
        if (RippleDelta != 0) ModifyPlayerStanding(OtherFaction, RippleDelta);
    }
}

void UNHFactionSubsystem::ModifyFactionRelationship(FName A, FName B, float Delta)
{
    FName Key = MakeRelationshipKey(A, B);
    ENHFactionRelationship* Existing = FactionRelationships.Find(Key);
    float CurrentScore = 0.f;
    if (Existing) CurrentScore = (float)*Existing * 16.f - 48.f; // rough reverse of enum→score

    float NewScore = FMath::Clamp(CurrentScore + Delta, -100.f, 100.f);

    ENHFactionRelationship NewRel;
    if      (NewScore <= -80) NewRel = ENHFactionRelationship::War;
    else if (NewScore <= -40) NewRel = ENHFactionRelationship::Hostile;
    else if (NewScore <= -10) NewRel = ENHFactionRelationship::Tense;
    else if (NewScore <=  10) NewRel = ENHFactionRelationship::Neutral;
    else if (NewScore <=  40) NewRel = ENHFactionRelationship::Tolerant;
    else if (NewScore <=  70) NewRel = ENHFactionRelationship::Cooperative;
    else                      NewRel = ENHFactionRelationship::Allied;

    FactionRelationships.Add(Key, NewRel);
    OnFactionRelationshipChanged.Broadcast(A, B, NewRel);
}

void UNHFactionSubsystem::SetZoneControl(ENHPrisonZone Zone, FName FactionID)
{
    ZoneControl.Add(Zone, FactionID);
    OnTerritoryControlChanged.Broadcast(Zone, FactionID);
    UE_LOG(LogTemp, Log, TEXT("[NH|Factions] Zone %d now controlled by %s"),
           (int32)Zone, *FactionID.ToString());
}

void UNHFactionSubsystem::AddFactionResource(FName FactionID, ENHFactionResource Resource, int32 Amount)
{
    FNHFactionData* F = FactionRegistry.Find(FactionID);
    if (!F) return;
    int32& Current = F->Resources.FindOrAdd(Resource);
    Current = FMath::Max(0, Current + Amount);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

ENHFactionStanding UNHFactionSubsystem::ScoreToStanding(int32 Score) const
{
    if (Score <= -90) return ENHFactionStanding::Nemesis;
    if (Score <= -40) return ENHFactionStanding::Hostile;
    if (Score <=  -1) return ENHFactionStanding::Distrustful;
    if (Score ==   0) return ENHFactionStanding::Neutral;
    if (Score <=  20) return ENHFactionStanding::Recognized;
    if (Score <=  60) return ENHFactionStanding::Known;
    if (Score <=  89) return ENHFactionStanding::Respected;
    return ENHFactionStanding::Allied;
}

FName UNHFactionSubsystem::MakeRelationshipKey(FName A, FName B) const
{
    // Canonical order: alphabetically smaller first
    FString SA = A.ToString(), SB = B.ToString();
    if (SA > SB) Swap(SA, SB);
    return FName(*(SA + TEXT(":") + SB));
}
