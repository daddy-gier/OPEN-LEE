#include "Characters/NHCharacterBase.h"

ANHCharacterBase::ANHCharacterBase()
{
    PrimaryActorTick.bCanEverTick = false;
}

void ANHCharacterBase::BeginPlay()
{
    Super::BeginPlay();
    CurrentHealth = MaxHealth;
}

void ANHCharacterBase::TakeDamage_NH(float Amount)
{
    if (!IsAlive()) return;
    CurrentHealth = FMath::Max(0.f, CurrentHealth - Amount);
    if (!IsAlive()) OnDeath();
}

void ANHCharacterBase::OnDeath_Implementation()
{
    UE_LOG(LogTemp, Log, TEXT("[NH] %s has died."), *CharacterName);
}
