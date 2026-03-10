#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "GameplayTagContainer.h"
#include "NHCharacterBase.generated.h"

/** Relationship tier between the player and an NPC */
UENUM(BlueprintType)
enum class ENHRelationshipTier : uint8
{
    Hostile     UMETA(DisplayName = "Hostile"),
    Suspicious  UMETA(DisplayName = "Suspicious"),
    Neutral     UMETA(DisplayName = "Neutral"),
    Friendly    UMETA(DisplayName = "Friendly"),
    Trusted     UMETA(DisplayName = "Trusted"),
};

/** Base class for every character in Nightshade Hollow */
UCLASS(Abstract)
class NIGHTSHADEHOLLOW_API ANHCharacterBase : public ACharacter
{
    GENERATED_BODY()

public:
    ANHCharacterBase();

    virtual void BeginPlay() override;

    // ── Identity ─────────────────────────────────────────────────

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "NH|Identity")
    FString CharacterName;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "NH|Identity")
    FString Role; // "prisoner", "guard", "warden", "player"

    // ── Vitals ────────────────────────────────────────────────────

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "NH|Vitals")
    float MaxHealth = 100.f;

    UPROPERTY(BlueprintReadOnly, Category = "NH|Vitals")
    float CurrentHealth;

    UFUNCTION(BlueprintCallable, Category = "NH|Vitals")
    virtual void TakeDamage_NH(float Amount);

    UFUNCTION(BlueprintCallable, Category = "NH|Vitals")
    bool IsAlive() const { return CurrentHealth > 0.f; }

    // ── Tags ──────────────────────────────────────────────────────

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "NH|Tags")
    FGameplayTagContainer CharacterTags;

    // ── Events ────────────────────────────────────────────────────

    UFUNCTION(BlueprintNativeEvent, Category = "NH|Events")
    void OnDeath();
    virtual void OnDeath_Implementation();
};
