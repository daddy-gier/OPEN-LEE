#include "Social/NHRoutineManager.h"
#include "TimerManager.h"
#include "Engine/World.h"

void UNHRoutineManager::Initialize(FSubsystemCollectionBase& Collection)
{
    Super::Initialize(Collection);

    if (UWorld* World = GetWorld())
    {
        World->GetTimerManager().SetTimer(
            BlockAdvanceTimer,
            this,
            &UNHRoutineManager::OnBlockTimerFired,
            SecondsPerBlock,
            /*bLoop=*/true);
    }

    UE_LOG(LogTemp, Log, TEXT("[NH|Routine] Routine manager online. Block duration: %.0f seconds."),
           SecondsPerBlock);
}

void UNHRoutineManager::Deinitialize()
{
    if (UWorld* World = GetWorld())
    {
        World->GetTimerManager().ClearTimer(BlockAdvanceTimer);
    }
    Super::Deinitialize();
}

void UNHRoutineManager::OnBlockTimerFired()
{
    AdvanceTimeBlock();
}

void UNHRoutineManager::AdvanceTimeBlock()
{
    const int32 NextIndex = ((int32)CurrentTimeBlock + 1) % 12; // 12 time blocks
    SetTimeBlock((ENHTimeBlock)NextIndex);
}

void UNHRoutineManager::SetTimeBlock(ENHTimeBlock Block)
{
    CurrentTimeBlock = Block;
    OnTimeBlockChanged.Broadcast(Block);

    UE_LOG(LogTemp, Log, TEXT("[NH|Routine] Time block → %d"), (int32)Block);

    if (IsCountBlock())
    {
        OnCountCalled.Broadcast(Block);
        UE_LOG(LogTemp, Warning, TEXT("[NH|Routine] COUNT TIME — all inmates to assigned positions."));
    }
    if (Block == ENHTimeBlock::Lockdown)
    {
        TriggerLockdown(ENHLockdownReason::Scheduled);
    }
    else if (bLockdownActive && ActiveLockdownReason == ENHLockdownReason::Scheduled)
    {
        LiftLockdown();
    }
}

bool UNHRoutineManager::IsCountBlock() const
{
    return CurrentTimeBlock == ENHTimeBlock::MorningCount ||
           CurrentTimeBlock == ENHTimeBlock::AfternoonCount;
}

void UNHRoutineManager::RegisterNPCSchedule(const FString& NPCName,
                                             const TArray<FNHRoutineSlot>& Schedule)
{
    NPCSchedules.Add(NPCName, Schedule);
}

bool UNHRoutineManager::GetCurrentAssignment(const FString& NPCName, FNHRoutineSlot& OutSlot) const
{
    const TArray<FNHRoutineSlot>* Schedule = NPCSchedules.Find(NPCName);
    if (!Schedule) return false;

    for (const FNHRoutineSlot& Slot : *Schedule)
    {
        if (Slot.TimeBlock == CurrentTimeBlock)
        {
            OutSlot = Slot;
            return true;
        }
    }
    return false;
}

TArray<FString> UNHRoutineManager::GetNPCsInZone(ENHPrisonZone Zone) const
{
    TArray<FString> Result;
    for (const auto& Pair : NPCSchedules)
    {
        for (const FNHRoutineSlot& Slot : Pair.Value)
        {
            if (Slot.TimeBlock == CurrentTimeBlock && Slot.AssignedZone == Zone)
            {
                Result.Add(Pair.Key);
                break;
            }
        }
    }
    return Result;
}

void UNHRoutineManager::TriggerLockdown(ENHLockdownReason Reason)
{
    bLockdownActive      = true;
    ActiveLockdownReason = Reason;
    OnLockdownTriggered.Broadcast(Reason, /*bIsLifted=*/false);
    UE_LOG(LogTemp, Warning, TEXT("[NH|Routine] LOCKDOWN — Reason: %d"), (int32)Reason);
}

void UNHRoutineManager::LiftLockdown()
{
    if (!bLockdownActive) return;
    bLockdownActive = false;
    OnLockdownTriggered.Broadcast(ActiveLockdownReason, /*bIsLifted=*/true);
    UE_LOG(LogTemp, Log, TEXT("[NH|Routine] Lockdown lifted."));
}
