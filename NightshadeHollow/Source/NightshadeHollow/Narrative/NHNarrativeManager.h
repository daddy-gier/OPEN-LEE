#pragma once

#include "CoreMinimal.h"
#include "Subsystems/WorldSubsystem.h"
#include "NHNarrativeManager.generated.h"

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnStoryFlagChanged, FString, FlagName);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnChapterChanged, int32, NewChapter);

/** World-level subsystem that tracks story state for the current session.
 *
 *  Story flags are string keys that represent permanent world changes:
 *  "met_warden", "cell_block_c_locked", "riot_started", etc.
 *
 *  Chapters map to major act breaks in the Nightshade Hollow narrative.
 */
UCLASS()
class NIGHTSHADEHOLLOW_API UNHNarrativeManager : public UWorldSubsystem
{
    GENERATED_BODY()

public:
    // ── Story Flags ───────────────────────────────────────────────

    UFUNCTION(BlueprintCallable, Category = "NH|Narrative")
    void SetFlag(const FString& Flag);

    UFUNCTION(BlueprintCallable, Category = "NH|Narrative")
    void ClearFlag(const FString& Flag);

    UFUNCTION(BlueprintPure, Category = "NH|Narrative")
    bool HasFlag(const FString& Flag) const;

    UFUNCTION(BlueprintPure, Category = "NH|Narrative")
    TArray<FString> GetAllFlags() const;

    UPROPERTY(BlueprintAssignable, Category = "NH|Narrative")
    FOnStoryFlagChanged OnFlagSet;

    UPROPERTY(BlueprintAssignable, Category = "NH|Narrative")
    FOnStoryFlagChanged OnFlagCleared;

    // ── Chapters ──────────────────────────────────────────────────

    UPROPERTY(BlueprintReadOnly, Category = "NH|Narrative")
    int32 CurrentChapter = 1;

    UFUNCTION(BlueprintCallable, Category = "NH|Narrative")
    void AdvanceChapter();

    UPROPERTY(BlueprintAssignable, Category = "NH|Narrative")
    FOnChapterChanged OnChapterChanged;

    // ── Player Choices Log ────────────────────────────────────────

    UFUNCTION(BlueprintCallable, Category = "NH|Narrative")
    void LogPlayerChoice(const FString& EventName, const FString& Choice);

    UFUNCTION(BlueprintPure, Category = "NH|Narrative")
    TArray<FString> GetChoiceLog() const { return PlayerChoiceLog; }

private:
    TSet<FString> StoryFlags;
    TArray<FString> PlayerChoiceLog;
};
