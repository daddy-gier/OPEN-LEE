#pragma once

#include "CoreMinimal.h"
#include "UObject/Interface.h"
#include "NHInteractable.generated.h"

UINTERFACE(MinimalAPI, BlueprintType)
class UNHInteractable : public UInterface
{
    GENERATED_BODY()
};

/** Implement on any Actor the player can interact with (doors, items, NPCs, consoles). */
class NIGHTSHADEHOLLOW_API INHInteractable
{
    GENERATED_BODY()

public:
    /** Called when the player presses Interact while facing this actor. */
    UFUNCTION(BlueprintNativeEvent, BlueprintCallable, Category = "NH|Interaction")
    void Interact(AActor* Instigator);

    /** Returns the prompt shown in HUD when the player is in range (e.g. "Open Cell Door"). */
    UFUNCTION(BlueprintNativeEvent, BlueprintCallable, Category = "NH|Interaction")
    FString GetInteractPrompt() const;

    /** True when the actor can currently be interacted with. */
    UFUNCTION(BlueprintNativeEvent, BlueprintCallable, Category = "NH|Interaction")
    bool CanInteract(AActor* Instigator) const;
};
