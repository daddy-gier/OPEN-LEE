#pragma once

#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"
#include "NHGameMode.generated.h"

UCLASS()
class NIGHTSHADEHOLLOW_API ANHGameMode : public AGameModeBase
{
    GENERATED_BODY()

public:
    ANHGameMode();

    /** Called when the player's suspicion reaches 100 */
    UFUNCTION(BlueprintNativeEvent, BlueprintCallable, Category = "NH|GameMode")
    void OnSuspicionMaxed();
    virtual void OnSuspicionMaxed_Implementation();

    /** Called when the player escapes or wins a chapter */
    UFUNCTION(BlueprintNativeEvent, BlueprintCallable, Category = "NH|GameMode")
    void OnChapterComplete(int32 Chapter);
    virtual void OnChapterComplete_Implementation(int32 Chapter);
};
