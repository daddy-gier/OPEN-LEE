#pragma once

#include "CoreMinimal.h"
#include "Subsystems/WorldSubsystem.h"
#include "NHGRAVESubsystem.generated.h"

/**
 * GRAVE — Government Riot Assault & Violent Engagement
 *
 * The under-prison network at Nightshade Hollow. 20 strata descending to
 * approximately -240 feet. Contains riot tunnels, maintenance layers,
 * a black market, flooded sections, the Marrow Church, Braxton Shrine,
 * and the bedrock escape route used in the canon 33-inmate breakout.
 *
 * GRAVE is never shown in top-down plan view. It is vertical depth,
 * layers, cross-sections, and dread.
 */

// ── Stratum ───────────────────────────────────────────────────────────────────

UENUM(BlueprintType)
enum class ENHGRAVEStratum : uint8
{
    S01_ServiceCorridor     UMETA(DisplayName = "S-01 Service Corridor (-12ft)"),
    S02_MaintenanceA        UMETA(DisplayName = "S-02 Maintenance A (-24ft)"),
    S03_MaintenanceB        UMETA(DisplayName = "S-03 Maintenance B (-36ft)"),
    S04_UtilityVault        UMETA(DisplayName = "S-04 Utility Vault (-48ft)"),
    S05_RiotTunnelNorth     UMETA(DisplayName = "S-05 Riot Tunnel North (-60ft)"),
    S06_RiotTunnelSouth     UMETA(DisplayName = "S-06 Riot Tunnel South (-72ft)"),
    S07_BlackMarketLevel    UMETA(DisplayName = "S-07 Black Market Level (-84ft)"),
    S08_OldMilTunnelEast    UMETA(DisplayName = "S-08 Old Military Tunnel East (-96ft)"),
    S09_OldMilTunnelWest    UMETA(DisplayName = "S-09 Old Military Tunnel West (-108ft)"),
    S10_SubsidenceLayer     UMETA(DisplayName = "S-10 Subsidence Layer (-120ft)"),
    S11_FloodedChamberA     UMETA(DisplayName = "S-11 Flooded Chamber A (-132ft)"),
    S12_FloodedChamberB     UMETA(DisplayName = "S-12 Flooded Chamber B (-144ft)"),
    S13_MarrowApproach      UMETA(DisplayName = "S-13 Marrow Approach (-156ft)"),
    S14_MarrowChurch        UMETA(DisplayName = "S-14 Marrow Church (-168ft)"),
    S15_BraxtonShrine       UMETA(DisplayName = "S-15 Braxton Shrine (-180ft)"),
    S16_DeepVein            UMETA(DisplayName = "S-16 Deep Vein (-192ft)"),
    S17_OldBlastChamber     UMETA(DisplayName = "S-17 Old Blast Chamber (-204ft)"),
    S18_ThirtyThreePassage  UMETA(DisplayName = "S-18 Thirty-Three Passage (-216ft)"),
    S19_BedrockFault        UMETA(DisplayName = "S-19 Bedrock Fault (-228ft)"),
    S20_EscapeRoot          UMETA(DisplayName = "S-20 Escape Root (-240ft)"),
};

// ── Location ──────────────────────────────────────────────────────────────────

USTRUCT(BlueprintType)
struct FNHGRAVELocation
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FName LocationID;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    ENHGRAVEStratum Stratum = ENHGRAVEStratum::S01_ServiceCorridor;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString DisplayName;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString Atmosphere; // fed to OPEN-LEE for scene context

    /** True = physically accessible with the right key/knowledge */
    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    bool bDiscovered = false;

    /** Controlling faction (SewerRats, MarrowPilgrims, etc.) */
    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FName ControllingFaction;

    /** Whether this location is currently flooded */
    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    bool bFlooded = false;

    /** Historical note — shown in lore panel */
    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString LoreNote;
};

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnGRAVELocationDiscovered,
    const FNHGRAVELocation&, Location);

DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnGRAVEFloodChanged,
    ENHGRAVEStratum, Stratum, bool, bNowFlooded);

/**
 * NHGRAVESubsystem — WorldSubsystem managing the under-prison GRAVE network.
 *
 * Tracks discovery state, faction control per stratum, flood status,
 * and access permissions. The canon escape event (33 inmates, S-18) is
 * a story flag baked into NHNarrativeManager; GRAVE tracks the physical state.
 */
UCLASS()
class NIGHTSHADEHOLLOW_API UNHGRAVESubsystem : public UWorldSubsystem
{
    GENERATED_BODY()

public:
    virtual void Initialize(FSubsystemCollectionBase& Collection) override;

    // ── Discovery ─────────────────────────────────────────────────

    UFUNCTION(BlueprintCallable, Category = "NH|GRAVE")
    bool DiscoverLocation(FName LocationID);

    UFUNCTION(BlueprintPure, Category = "NH|GRAVE")
    bool IsDiscovered(FName LocationID) const;

    UFUNCTION(BlueprintCallable, Category = "NH|GRAVE")
    TArray<FNHGRAVELocation> GetDiscoveredLocations() const;

    UFUNCTION(BlueprintCallable, Category = "NH|GRAVE")
    const FNHGRAVELocation* GetLocation(FName LocationID) const;

    // ── Flood ─────────────────────────────────────────────────────

    UFUNCTION(BlueprintCallable, Category = "NH|GRAVE")
    void SetFloodState(ENHGRAVEStratum Stratum, bool bFlooded);

    UFUNCTION(BlueprintPure, Category = "NH|GRAVE")
    bool IsStratumFlooded(ENHGRAVEStratum Stratum) const;

    // ── Delegates ─────────────────────────────────────────────────

    UPROPERTY(BlueprintAssignable, Category = "NH|GRAVE")
    FOnGRAVELocationDiscovered OnLocationDiscovered;

    UPROPERTY(BlueprintAssignable, Category = "NH|GRAVE")
    FOnGRAVEFloodChanged OnFloodChanged;

private:
    void SeedLocations();
    TMap<FName, FNHGRAVELocation> Locations;
};
