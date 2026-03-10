#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "NHDialogueComponent.generated.h"

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnDialogueLine, FString, Line);

/** Attached to NPC actors; keeps per-NPC conversation history
 *  and broadcasts new lines to any listening UI widget. */
UCLASS(ClassGroup = (NightshadeHollow), meta = (BlueprintSpawnableComponent))
class NIGHTSHADEHOLLOW_API UNHDialogueComponent : public UActorComponent
{
    GENERATED_BODY()

public:
    UNHDialogueComponent();

    /** Maximum lines kept in memory per NPC (oldest are pruned) */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "NH|Dialogue")
    int32 MaxHistoryLength = 40;

    /** Fired whenever a new line arrives (player or NPC) */
    UPROPERTY(BlueprintAssignable, Category = "NH|Dialogue")
    FOnDialogueLine OnNewLine;

    /** Add a player line to history */
    UFUNCTION(BlueprintCallable, Category = "NH|Dialogue")
    void PushPlayerLine(const FString& Line);

    /** Add an NPC line to history (called when OPEN-LEE responds) */
    UFUNCTION(BlueprintCallable, Category = "NH|Dialogue")
    void PushNPCLine(const FString& Line);

    /** Full conversation as flat array for OPEN-LEE context */
    UFUNCTION(BlueprintCallable, Category = "NH|Dialogue")
    TArray<FString> GetHistory() const { return ConversationHistory; }

    UFUNCTION(BlueprintCallable, Category = "NH|Dialogue")
    void ClearHistory() { ConversationHistory.Empty(); }

private:
    TArray<FString> ConversationHistory;
    void Prune();
};
