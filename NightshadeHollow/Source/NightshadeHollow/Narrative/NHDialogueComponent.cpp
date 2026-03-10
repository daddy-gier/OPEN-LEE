#include "Narrative/NHDialogueComponent.h"

UNHDialogueComponent::UNHDialogueComponent()
{
    PrimaryComponentTick.bCanEverTick = false;
}

void UNHDialogueComponent::PushPlayerLine(const FString& Line)
{
    ConversationHistory.Add(FString::Printf(TEXT("PLAYER: %s"), *Line));
    OnNewLine.Broadcast(FString::Printf(TEXT("PLAYER: %s"), *Line));
    Prune();
}

void UNHDialogueComponent::PushNPCLine(const FString& Line)
{
    ConversationHistory.Add(FString::Printf(TEXT("NPC: %s"), *Line));
    OnNewLine.Broadcast(FString::Printf(TEXT("NPC: %s"), *Line));
    Prune();
}

void UNHDialogueComponent::Prune()
{
    while (ConversationHistory.Num() > MaxHistoryLength)
    {
        ConversationHistory.RemoveAt(0);
    }
}
