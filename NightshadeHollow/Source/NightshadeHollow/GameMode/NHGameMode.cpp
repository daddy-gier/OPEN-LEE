#include "GameMode/NHGameMode.h"
#include "Characters/NHPlayerCharacter.h"

ANHGameMode::ANHGameMode()
{
    DefaultPawnClass = ANHPlayerCharacter::StaticClass();
}

void ANHGameMode::OnSuspicionMaxed_Implementation()
{
    UE_LOG(LogTemp, Warning, TEXT("[NH] Player suspicion maxed — triggering guard response."));
}

void ANHGameMode::OnChapterComplete_Implementation(int32 Chapter)
{
    UE_LOG(LogTemp, Log, TEXT("[NH] Chapter %d complete!"), Chapter);
}
