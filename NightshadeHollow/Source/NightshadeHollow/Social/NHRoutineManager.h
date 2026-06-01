#pragma once

#include "CoreMinimal.h"
#include "Subsystems/WorldSubsystem.h"
#include "Factions/NHFactionTypes.h"
#include "NHRoutineManager.generated.h"

// ── Time Block ────────────────────────────────────────────────────────────────

UENUM(BlueprintType)
enum class ENHTimeBlock : uint8
{
    EarlyMorning    UMETA(DisplayName = "Early Morning (4-6)"),   // 04:00 - 06:00
    Breakfast       UMETA(DisplayName = "Breakfast (6-7)"),       // 06:00 - 07:00
    MorningCount    UMETA(DisplayName = "Morning Count (7-8)"),   // 07:00 - 08:00  ← mandatory
    WorkDetail      UMETA(DisplayName = "Work Detail (8-11)"),    // 08:00 - 11:00
    MidMorning      UMETA(DisplayName = "Mid-Morning (11-12)"),   // 11:00 - 12:00
    Lunch           UMETA(DisplayName = "Lunch (12-13)"),         // 12:00 - 13:00
    AfternoonWork   UMETA(DisplayName = "Afternoon Work (13-16)"),// 13:00 - 16:00
    RecreationYard  UMETA(DisplayName = "Rec / Yard (16-18)"),    // 16:00 - 18:00
    AfternoonCount  UMETA(DisplayName = "Afternoon Count (18)"),  // 18:00        ← mandatory
    Dinner          UMETA(DisplayName = "Dinner (18-19)"),        // 18:00 - 19:00
    EveningFree     UMETA(DisplayName = "Evening Free (19-21)"),  // 19:00 - 21:00
    Lockdown        UMETA(DisplayName = "Lockdown (21+)"),        // 21:00 +       ← everyone in cells
};

// ── Routine Assignment ────────────────────────────────────────────────────────

USTRUCT(BlueprintType)
struct FNHRoutineSlot
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    ENHTimeBlock TimeBlock = ENHTimeBlock::Lockdown;

    /** Where this NPC should be during this block */
    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    ENHPrisonZone AssignedZone = ENHPrisonZone::CellBlock_A;

    /** Optional task description fed to OPEN-LEE for contextual dialogue */
    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString Activity; // e.g. "washing dishes", "lifting weights", "reading"

    /** Whether deviation from this slot raises suspicion */
    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    bool bMandatory = false;
};

// ── Lockdown Reason ───────────────────────────────────────────────────────────

UENUM(BlueprintType)
enum class ENHLockdownReason : uint8
{
    Scheduled       UMETA(DisplayName = "Scheduled"),
    Emergency       UMETA(DisplayName = "Emergency"),
    FightDetected   UMETA(DisplayName = "Fight Detected"),
    EscapeAttempt   UMETA(DisplayName = "Escape Attempt"),
    Contraband      UMETA(DisplayName = "Contraband Found"),
    OfficerDown     UMETA(DisplayName = "Officer Down"),
    Riot            UMETA(DisplayName = "Riot"),
};

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnTimeBlockChanged, ENHTimeBlock, NewBlock);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnLockdownTriggered, ENHLockdownReason, Reason, bool, bIsLifted);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnCountCalled, ENHTimeBlock, CountBlock);

/**
 * NHRoutineManager — WorldSubsystem driving the prison's daily schedule.
 *
 * Advances the time block as real time passes. NPCs query their assigned
 * zone and activity for the current block. Lockdowns override all routines
 * and trigger movement restrictions. Count blocks are mandatory — deviation
 * raises an immediate staff alert.
 */
UCLASS()
class NIGHTSHADEHOLLOW_API UNHRoutineManager : public UWorldSubsystem
{
    GENERATED_BODY()

public:
    virtual void Initialize(FSubsystemCollectionBase& Collection) override;
    virtual void Deinitialize() override;

    // ── Time ──────────────────────────────────────────────────────

    UPROPERTY(BlueprintReadOnly, Category = "NH|Routine")
    ENHTimeBlock CurrentTimeBlock = ENHTimeBlock::EarlyMorning;

    /** Real-world seconds per time block (default: 5 minutes per block) */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "NH|Routine")
    float SecondsPerBlock = 300.f;

    UFUNCTION(BlueprintCallable, Category = "NH|Routine")
    void AdvanceTimeBlock();

    UFUNCTION(BlueprintCallable, Category = "NH|Routine")
    void SetTimeBlock(ENHTimeBlock Block);

    UFUNCTION(BlueprintPure, Category = "NH|Routine")
    bool IsCountBlock() const;

    UFUNCTION(BlueprintPure, Category = "NH|Routine")
    bool IsLockdownActive() const { return bLockdownActive; }

    // ── NPC Routine Registration ───────────────────────────────────

    /** Register a daily schedule for an NPC */
    UFUNCTION(BlueprintCallable, Category = "NH|Routine")
    void RegisterNPCSchedule(const FString& NPCName, const TArray<FNHRoutineSlot>& Schedule);

    /** Returns where an NPC should be right now */
    UFUNCTION(BlueprintCallable, Category = "NH|Routine")
    bool GetCurrentAssignment(const FString& NPCName, FNHRoutineSlot& OutSlot) const;

    /** Returns all NPCs assigned to a zone in the current block */
    UFUNCTION(BlueprintCallable, Category = "NH|Routine")
    TArray<FString> GetNPCsInZone(ENHPrisonZone Zone) const;

    // ── Lockdown ──────────────────────────────────────────────────

    UFUNCTION(BlueprintCallable, Category = "NH|Routine")
    void TriggerLockdown(ENHLockdownReason Reason);

    UFUNCTION(BlueprintCallable, Category = "NH|Routine")
    void LiftLockdown();

    // ── Delegates ─────────────────────────────────────────────────

    UPROPERTY(BlueprintAssignable, Category = "NH|Routine")
    FOnTimeBlockChanged OnTimeBlockChanged;

    UPROPERTY(BlueprintAssignable, Category = "NH|Routine")
    FOnLockdownTriggered OnLockdownTriggered;

    UPROPERTY(BlueprintAssignable, Category = "NH|Routine")
    FOnCountCalled OnCountCalled;

private:
    bool bLockdownActive = false;
    ENHLockdownReason ActiveLockdownReason;
    float BlockTimer = 0.f;

    // NPC name → schedule (one slot per time block)
    TMap<FString, TArray<FNHRoutineSlot>> NPCSchedules;

    FTimerHandle BlockAdvanceTimer;
    void OnBlockTimerFired();
};
