#pragma once

#include "CoreMinimal.h"
#include "GameplayTagContainer.h"
#include "NHFactionTypes.generated.h"

// ── Faction Alignment ─────────────────────────────────────────────────────────

UENUM(BlueprintType)
enum class ENHFactionAlignment : uint8
{
    Inmate          UMETA(DisplayName = "Inmate"),
    Institutional   UMETA(DisplayName = "Institutional"),
};

// ── Faction Standing (player's rep with a specific faction) ──────────────────

UENUM(BlueprintType)
enum class ENHFactionStanding : uint8
{
    Nemesis     UMETA(DisplayName = "Nemesis"),       // -100 to -61
    Hostile     UMETA(DisplayName = "Hostile"),       // -60 to -21
    Distrustful UMETA(DisplayName = "Distrustful"),   // -20 to -1
    Neutral     UMETA(DisplayName = "Neutral"),       //   0
    Recognized  UMETA(DisplayName = "Recognized"),   //  +1 to +20
    Known       UMETA(DisplayName = "Known"),         // +21 to +60
    Respected   UMETA(DisplayName = "Respected"),    // +61 to +89
    Allied      UMETA(DisplayName = "Allied"),        // +90 to +100
};

// ── Faction Resource Types ────────────────────────────────────────────────────

UENUM(BlueprintType)
enum class ENHFactionResource : uint8
{
    DC              UMETA(DisplayName = "Dirt Currency"),
    Contraband      UMETA(DisplayName = "Contraband"),
    Weapons         UMETA(DisplayName = "Weapons"),
    Food            UMETA(DisplayName = "Food"),
    Information     UMETA(DisplayName = "Information"),
    Influence       UMETA(DisplayName = "Influence"),
};

// ── Inter-faction Relationship ────────────────────────────────────────────────

UENUM(BlueprintType)
enum class ENHFactionRelationship : uint8
{
    War         UMETA(DisplayName = "War"),
    Hostile     UMETA(DisplayName = "Hostile"),
    Tense       UMETA(DisplayName = "Tense"),
    Neutral     UMETA(DisplayName = "Neutral"),
    Tolerant    UMETA(DisplayName = "Tolerant"),
    Cooperative UMETA(DisplayName = "Cooperative"),
    Allied      UMETA(DisplayName = "Allied"),
};

// ── Territory Zone ────────────────────────────────────────────────────────────

UENUM(BlueprintType)
enum class ENHPrisonZone : uint8
{
    CellBlock_A     UMETA(DisplayName = "Cell Block A"),
    CellBlock_B     UMETA(DisplayName = "Cell Block B"),
    CellBlock_C     UMETA(DisplayName = "Cell Block C"),
    CellBlock_D     UMETA(DisplayName = "Cell Block D"),
    Yard            UMETA(DisplayName = "Yard"),
    Cafeteria       UMETA(DisplayName = "Cafeteria"),
    Gym             UMETA(DisplayName = "Gym"),
    Workshop        UMETA(DisplayName = "Workshop"),
    Library         UMETA(DisplayName = "Library"),
    Chapel          UMETA(DisplayName = "Chapel"),
    Infirmary       UMETA(DisplayName = "Infirmary"),
    Laundry         UMETA(DisplayName = "Laundry"),
    Education       UMETA(DisplayName = "Education"),
    Visitation      UMETA(DisplayName = "Visitation"),
    Commissary      UMETA(DisplayName = "Commissary"),
    Corridor_Spine  UMETA(DisplayName = "The Spine"),
    SolitaryWing    UMETA(DisplayName = "Solitary Wing"),
    Tunnels_GRAVE   UMETA(DisplayName = "GRAVE Tunnels"),
};

// ── Faction Data ──────────────────────────────────────────────────────────────

USTRUCT(BlueprintType)
struct FNHFactionData
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FName FactionID;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString DisplayName;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString Description;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    ENHFactionAlignment Alignment = ENHFactionAlignment::Inmate;

    /** Primary zones this faction controls */
    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    TArray<ENHPrisonZone> ControlledZones;

    /** Resource stockpiles */
    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    TMap<ENHFactionResource, int32> Resources;

    /** Faction size (active members) */
    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    int32 MemberCount = 0;

    /** Power level 0-100 — used in conflict resolution */
    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float PowerLevel = 50.f;

    /** Color used for UI and map indicators */
    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FLinearColor FactionColor = FLinearColor::White;
};

// ── Faction Relationship Entry ────────────────────────────────────────────────

USTRUCT(BlueprintType)
struct FNHFactionRelationEntry
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FName FactionA;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FName FactionB;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    ENHFactionRelationship Relationship = ENHFactionRelationship::Neutral;

    /** -100 to +100 heat/warmth score underlying the enum */
    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    float Score = 0.f;
};

// ── Player Faction Standing Record ───────────────────────────────────────────

USTRUCT(BlueprintType)
struct FNHPlayerFactionRecord
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadOnly)
    FName FactionID;

    /** -100 to +100 */
    UPROPERTY(BlueprintReadOnly)
    int32 Score = 0;

    UPROPERTY(BlueprintReadOnly)
    ENHFactionStanding Standing = ENHFactionStanding::Neutral;
};
