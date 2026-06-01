#pragma once

#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "Factions/NHFactionTypes.h"
#include "NHFactionSubsystem.generated.h"

DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnPlayerFactionStandingChanged,
    FName, FactionID, ENHFactionStanding, NewStanding);

DECLARE_DYNAMIC_MULTICAST_DELEGATE_ThreeParams(FOnFactionRelationshipChanged,
    FName, FactionA, FName, FactionB, ENHFactionRelationship, NewRelationship);

DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnTerritoryControlChanged,
    ENHPrisonZone, Zone, FName, ControllingFaction);

/**
 * NHFactionSubsystem — manages all 55 factions in Nightshade Hollow.
 *
 * Tracks territory control, inter-faction relationships, player standing
 * per faction, and faction resources (DC, contraband, influence, etc.).
 * Seeded from JSON content files; queryable from Blueprint and C++.
 */
UCLASS()
class NIGHTSHADEHOLLOW_API UNHFactionSubsystem : public UGameInstanceSubsystem
{
    GENERATED_BODY()

public:
    virtual void Initialize(FSubsystemCollectionBase& Collection) override;

    // ── Query ─────────────────────────────────────────────────────

    UFUNCTION(BlueprintCallable, Category = "NH|Factions")
    const FNHFactionData* GetFactionData(FName FactionID) const;

    UFUNCTION(BlueprintCallable, Category = "NH|Factions")
    ENHFactionRelationship GetFactionRelationship(FName FactionA, FName FactionB) const;

    UFUNCTION(BlueprintCallable, Category = "NH|Factions")
    ENHFactionStanding GetPlayerStanding(FName FactionID) const;

    UFUNCTION(BlueprintCallable, Category = "NH|Factions")
    int32 GetPlayerScore(FName FactionID) const;

    /** Returns the faction that controls a given zone, or NAME_None if contested */
    UFUNCTION(BlueprintCallable, Category = "NH|Factions")
    FName GetZoneController(ENHPrisonZone Zone) const;

    UFUNCTION(BlueprintCallable, Category = "NH|Factions")
    TArray<FName> GetPlayerAlliedFactions() const;

    UFUNCTION(BlueprintCallable, Category = "NH|Factions")
    TArray<FName> GetPlayerHostileFactions() const;

    // ── Mutation ──────────────────────────────────────────────────

    /** Adjust the player's standing with a faction. Delta: -100 to +100 */
    UFUNCTION(BlueprintCallable, Category = "NH|Factions")
    void ModifyPlayerStanding(FName FactionID, int32 Delta);

    /** Ripple a standing change to allied/enemy factions (allied get half, enemies get inverse) */
    UFUNCTION(BlueprintCallable, Category = "NH|Factions")
    void ModifyPlayerStandingWithRipple(FName FactionID, int32 Delta);

    /** Shift the relationship between two factions */
    UFUNCTION(BlueprintCallable, Category = "NH|Factions")
    void ModifyFactionRelationship(FName FactionA, FName FactionB, float Delta);

    /** Assign territory zone to a faction (set NAME_None to mark as contested) */
    UFUNCTION(BlueprintCallable, Category = "NH|Factions")
    void SetZoneControl(ENHPrisonZone Zone, FName FactionID);

    UFUNCTION(BlueprintCallable, Category = "NH|Factions")
    void AddFactionResource(FName FactionID, ENHFactionResource Resource, int32 Amount);

    // ── Delegates ─────────────────────────────────────────────────

    UPROPERTY(BlueprintAssignable, Category = "NH|Factions")
    FOnPlayerFactionStandingChanged OnPlayerFactionStandingChanged;

    UPROPERTY(BlueprintAssignable, Category = "NH|Factions")
    FOnFactionRelationshipChanged OnFactionRelationshipChanged;

    UPROPERTY(BlueprintAssignable, Category = "NH|Factions")
    FOnTerritoryControlChanged OnTerritoryControlChanged;

private:
    void SeedFactions();
    void SeedRelationships();
    void SeedTerritoryControl();
    ENHFactionStanding ScoreToStanding(int32 Score) const;
    FName MakeRelationshipKey(FName A, FName B) const;

    TMap<FName, FNHFactionData>         FactionRegistry;
    TMap<FName, FNHPlayerFactionRecord> PlayerStandings;
    TMap<FName, ENHFactionRelationship> FactionRelationships; // key = "FactionA:FactionB" sorted
    TMap<ENHPrisonZone, FName>          ZoneControl;
};
