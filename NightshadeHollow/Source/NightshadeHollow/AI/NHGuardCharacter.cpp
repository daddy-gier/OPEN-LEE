#include "AI/NHGuardCharacter.h"
#include "AIController.h"
#include "Kismet/GameplayStatics.h"
#include "Characters/NHPlayerCharacter.h"
#include "GameMode/NHGameMode.h"

ANHGuardCharacter::ANHGuardCharacter()
{
    PrimaryActorTick.bCanEverTick = true;
    CharacterRole = TEXT("guard");
}

void ANHGuardCharacter::BeginPlay()
{
    Super::BeginPlay();
}

void ANHGuardCharacter::Tick(float DeltaTime)
{
    Super::Tick(DeltaTime);
    TickDetection(DeltaTime);
    if (GuardState == ENHGuardState::Patrol)
    {
        TickPatrol();
    }
}

bool ANHGuardCharacter::CanSeePlayer(APawn* Player) const
{
    if (!Player || !GetWorld()) return false;

    const FVector EyeLoc    = GetActorLocation() + FVector(0.f, 0.f, 60.f);
    const FVector PlayerLoc = Player->GetActorLocation() + FVector(0.f, 0.f, 60.f);

    if (FVector::DistSquared(EyeLoc, PlayerLoc) > SightRange * SightRange) return false;

    const FVector  ToPlayer   = (PlayerLoc - EyeLoc).GetSafeNormal();
    const float    DotProduct = FVector::DotProduct(GetActorForwardVector(), ToPlayer);
    if (DotProduct < FMath::Cos(FMath::DegreesToRadians(SightAngle))) return false;

    FHitResult Hit;
    FCollisionQueryParams Params;
    Params.AddIgnoredActor(this);
    Params.AddIgnoredActor(Player);
    return !GetWorld()->LineTraceSingleByChannel(Hit, EyeLoc, PlayerLoc, ECC_Visibility, Params);
}

void ANHGuardCharacter::TickDetection(float DeltaTime)
{
    APawn*              PlayerPawn = UGameplayStatics::GetPlayerPawn(this, 0);
    ANHPlayerCharacter* PlayerChar = Cast<ANHPlayerCharacter>(PlayerPawn);

    bool bCanSee = PlayerChar && CanSeePlayer(PlayerPawn);

    // Proximity always counts, even without line-of-sight
    if (!bCanSee && PlayerChar)
    {
        const float DistSq = FVector::DistSquared(GetActorLocation(), PlayerChar->GetActorLocation());
        if (DistSq <= ProximityAlertRadius * ProximityAlertRadius)
        {
            bCanSee = true;
        }
    }

    switch (GuardState)
    {
    case ENHGuardState::Patrol:
    case ENHGuardState::Suspicious:
        if (bCanSee)
        {
            GuardSuspicion = FMath::Clamp(GuardSuspicion + SuspicionRatePerSecond * DeltaTime, 0.f, 100.f);
            if (GuardSuspicion >= 100.f)
            {
                OnPlayerSpotted(PlayerPawn);
            }
            else
            {
                GuardState = ENHGuardState::Suspicious;
            }
        }
        else if (GuardState == ENHGuardState::Suspicious)
        {
            GuardSuspicion = FMath::Clamp(GuardSuspicion - SuspicionDecayPerSecond * DeltaTime, 0.f, 100.f);
            if (GuardSuspicion <= 0.f)
            {
                GuardState = ENHGuardState::Patrol;
            }
        }
        break;

    case ENHGuardState::Alerted:
        if (bCanSee)
        {
            if (PlayerChar)
            {
                PlayerChar->ModifySuspicion(FMath::RoundToInt(SuspicionRatePerSecond * DeltaTime));
            }
        }
        else
        {
            OnPlayerLost();
        }
        break;

    case ENHGuardState::Searching:
        SearchTimer -= DeltaTime;
        if (bCanSee)
        {
            OnPlayerSpotted(PlayerPawn);
        }
        else if (SearchTimer <= 0.f)
        {
            GuardState = ENHGuardState::Patrol;
            UE_LOG(LogTemp, Log, TEXT("[NH|Guard] %s search expired, returning to patrol."), *CharacterName);
        }
        break;
    }
}

void ANHGuardCharacter::OnPlayerSpotted(APawn* Player)
{
    GuardState     = ENHGuardState::Alerted;
    GuardSuspicion = 100.f;

    UE_LOG(LogTemp, Warning, TEXT("[NH|Guard] %s has spotted the player!"), *CharacterName);

    ANHPlayerCharacter* PlayerChar = Cast<ANHPlayerCharacter>(Player);
    if (PlayerChar)
    {
        PlayerChar->ModifySuspicion(50);

        if (PlayerChar->Suspicion >= 100)
        {
            if (ANHGameMode* GM = Cast<ANHGameMode>(GetWorld()->GetAuthGameMode()))
            {
                GM->OnSuspicionMaxed();
            }
        }
    }
}

void ANHGuardCharacter::OnPlayerLost()
{
    GuardState  = ENHGuardState::Searching;
    SearchTimer = SearchDuration;
    UE_LOG(LogTemp, Log, TEXT("[NH|Guard] %s lost the player — searching for %.1f seconds."),
           *CharacterName, SearchDuration);
}

void ANHGuardCharacter::TickPatrol()
{
    if (PatrolWaypoints.Num() == 0) return;

    if (CurrentWaypointIndex >= PatrolWaypoints.Num())
    {
        CurrentWaypointIndex = 0;
    }

    AActor* Target = PatrolWaypoints[CurrentWaypointIndex];
    if (!IsValid(Target))
    {
        CurrentWaypointIndex = (CurrentWaypointIndex + 1) % PatrolWaypoints.Num();
        return;
    }

    AAIController* AIC = Cast<AAIController>(GetController());
    if (!AIC) return;

    const float Dist = FVector::Dist(GetActorLocation(), Target->GetActorLocation());
    if (Dist <= PatrolAcceptanceRadius)
    {
        CurrentWaypointIndex = (CurrentWaypointIndex + 1) % PatrolWaypoints.Num();
    }
    else
    {
        AIC->MoveToActor(Target, PatrolAcceptanceRadius);
    }
}
