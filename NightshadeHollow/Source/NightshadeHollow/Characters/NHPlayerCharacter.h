#pragma once

#include "CoreMinimal.h"
#include "Characters/NHCharacterBase.h"
#include "NHPlayerCharacter.generated.h"

class USpringArmComponent;
class UCameraComponent;
class UEnhancedInputComponent;
class UInputMappingContext;
class UInputAction;

UCLASS()
class NIGHTSHADEHOLLOW_API ANHPlayerCharacter : public ANHCharacterBase
{
    GENERATED_BODY()

public:
    ANHPlayerCharacter();

    virtual void SetupPlayerInputComponent(UInputComponent* PlayerInputComponent) override;
    virtual void BeginPlay() override;
    virtual void Tick(float DeltaTime) override;

    // ── Camera ────────────────────────────────────────────────────

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "NH|Camera")
    USpringArmComponent* CameraBoom;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "NH|Camera")
    UCameraComponent* FollowCamera;

    // ── Input Mapping ─────────────────────────────────────────────

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "NH|Input")
    UInputMappingContext* DefaultMappingContext;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "NH|Input")
    UInputAction* MoveAction;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "NH|Input")
    UInputAction* LookAction;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "NH|Input")
    UInputAction* InteractAction;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "NH|Input")
    UInputAction* SprintAction;

    // ── Stats ─────────────────────────────────────────────────────

    UPROPERTY(BlueprintReadOnly, Category = "NH|Stats")
    int32 Suspicion = 0; // 0-100; too high = guard alert

    UPROPERTY(BlueprintReadOnly, Category = "NH|Stats")
    int32 Influence = 0; // social currency with other prisoners

    UFUNCTION(BlueprintCallable, Category = "NH|Stats")
    void ModifySuspicion(int32 Delta);

    UFUNCTION(BlueprintCallable, Category = "NH|Stats")
    void ModifyInfluence(int32 Delta);

    // ── Interaction ───────────────────────────────────────────────

    UFUNCTION(BlueprintCallable, Category = "NH|Interaction")
    void TryInteract();

private:
    void Move(const struct FInputActionValue& Value);
    void Look(const struct FInputActionValue& Value);
};
