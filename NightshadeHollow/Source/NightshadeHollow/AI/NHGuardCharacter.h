#pragma once

#include "CoreMinimal.h"
#include "Characters/NHNPCCharacter.h"
#include "NHGuardCharacter.generated.h"

/** Alert state of a guard */
UENUM(BlueprintType)
enum class ENHGuardState : uint8
{
    Patrol      UMETA(DisplayName = "Patrol"),
    Suspicious  UMETA(DisplayName = "Suspicious"),
    Alerted     UMETA(DisplayName = "Alerted"),
    Searching   UMETA(DisplayName = "Searching"),
};

/**
 * Guard NPC — patrols waypoints, detects the player via sight/proximity,
 * and escalates suspicion on the player character.
 */
UCLASS()
class NIGHTSHADEHOLLOW_API ANHGuardCharacter : public ANHNPCCharacter
{
    GENERATED_BODY()

public:
    ANHGuardCharacter();

    virtual void BeginPlay() override;
    virtual void Tick(float DeltaTime) override;

    // ── Patrol ────────────────────────────────────────────────────

    /** World-space waypoints the guard walks between when idle */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "NH|Guard|Patrol")
    TArray<AActor*> PatrolWaypoints;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "NH|Guard|Patrol")
    float PatrolAcceptanceRadius = 150.f;

    // ── Detection ─────────────────────────────────────────────────

    /** Radius within which the guard always notices the player regardless of line-of-sight */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "NH|Guard|Detection")
    float ProximityAlertRadius = 250.f;

    /** Max distance for line-of-sight detection */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "NH|Guard|Detection")
    float SightRange = 1200.f;

    /** Half-angle of the guard's forward sight cone (degrees) */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "NH|Guard|Detection")
    float SightAngle = 60.f;

    /** Suspicion added per second while player is in sight */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "NH|Guard|Detection")
    float SuspicionRatePerSecond = 15.f;

    /** Suspicion drained per second when player is out of sight */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "NH|Guard|Detection")
    float SuspicionDecayPerSecond = 8.f;

    /** Guard's own suspicion meter (0-100); when it hits 100 the player gets alerted */
    UPROPERTY(BlueprintReadOnly, Category = "NH|Guard|Detection")
    float GuardSuspicion = 0.f;

    UPROPERTY(BlueprintReadOnly, Category = "NH|Guard|Detection")
    ENHGuardState GuardState = ENHGuardState::Patrol;

    UFUNCTION(BlueprintCallable, Category = "NH|Guard")
    void OnPlayerSpotted(APawn* Player);

    UFUNCTION(BlueprintCallable, Category = "NH|Guard")
    void OnPlayerLost();

private:
    void TickDetection(float DeltaTime);
    void TickPatrol();
    bool CanSeePlayer(APawn* Player) const;

    int32 CurrentWaypointIndex = 0;
    float SearchTimer = 0.f;
    static constexpr float SearchDuration = 8.f;
};
