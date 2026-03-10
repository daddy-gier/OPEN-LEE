#include "Narrative/NHNarrativeManager.h"

void UNHNarrativeManager::SetFlag(const FString& Flag)
{
    if (!StoryFlags.Contains(Flag))
    {
        StoryFlags.Add(Flag);
        OnFlagSet.Broadcast(Flag);
        UE_LOG(LogTemp, Log, TEXT("[NH|Story] Flag SET: %s"), *Flag);
    }
}

void UNHNarrativeManager::ClearFlag(const FString& Flag)
{
    if (StoryFlags.Contains(Flag))
    {
        StoryFlags.Remove(Flag);
        OnFlagCleared.Broadcast(Flag);
        UE_LOG(LogTemp, Log, TEXT("[NH|Story] Flag CLEARED: %s"), *Flag);
    }
}

bool UNHNarrativeManager::HasFlag(const FString& Flag) const
{
    return StoryFlags.Contains(Flag);
}

TArray<FString> UNHNarrativeManager::GetAllFlags() const
{
    return StoryFlags.Array();
}

void UNHNarrativeManager::AdvanceChapter()
{
    CurrentChapter++;
    OnChapterChanged.Broadcast(CurrentChapter);
    UE_LOG(LogTemp, Log, TEXT("[NH|Story] Chapter advanced to %d"), CurrentChapter);
}

void UNHNarrativeManager::LogPlayerChoice(const FString& EventName, const FString& Choice)
{
    PlayerChoiceLog.Add(FString::Printf(TEXT("[Ch%d] %s -> %s"), CurrentChapter, *EventName, *Choice));
}
