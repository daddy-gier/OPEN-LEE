#pragma once

#include "CoreMinimal.h"
#include "Characters/NHCharacterBase.h"
#include "NHNPCCharacter.generated.h"

class UNHDialogueComponent;

/** An AI-driven character in Nightshade Hollow.
 *  Each NPC holds its own personality and backstory; when the player
 *  speaks to them, those fields are sent to OPEN-LEE via OpenLEESubsystem
 *  and the returned dialogue line is displayed. */
UCLASS()
class NIGHTSHADEHOLLOW_API ANHNPCCharacter : public ANHCharacterBase
{
    GENERATED_BODY()

public:
    ANHNPCCharacter();

    // ── AI Profile (fed to OPEN-LEE) ──────────────────────────────

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "NH|NPC|Profile")
    FString Personality;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "NH|NPC|Profile")
    FString Backstory;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "NH|NPC|Profile")
    ENHRelationshipTier RelationshipWithPlayer = ENHRelationshipTier::Neutral;

    // ── Dialogue ──────────────────────────────────────────────────

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "NH|NPC|Dialogue")
    UNHDialogueComponent* DialogueComponent;

    UFUNCTION(BlueprintCallable, Category = "NH|NPC|Dialogue")
    void BeginConversation(const FString& PlayerInput);

    UFUNCTION(BlueprintCallable, Category = "NH|NPC|Dialogue")
    void ModifyRelationship(int32 Delta);

    // ── Routine ───────────────────────────────────────────────────

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "NH|NPC|Routine")
    TArray<FString> DailyRoutine; // e.g. ["breakfast","yard","work","dinner","lockdown"]
};
