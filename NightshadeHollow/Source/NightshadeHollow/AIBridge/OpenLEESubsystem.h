#pragma once

#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "HttpModule.h"
#include "Interfaces/IHttpRequest.h"
#include "Interfaces/IHttpResponse.h"
#include "OpenLEESubsystem.generated.h"

// ─────────────────────────────────────────────
//  Delegates — Blueprint-callable callbacks
// ─────────────────────────────────────────────

DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnNPCDialogueReceived,
    FString, CharacterName,
    FString, DialogueLine);

DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnStoryEventResolved,
    FString, Outcome,
    FString, NarrativeText);

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnBackendHealthChanged,
    bool, bIsOnline);

// ─────────────────────────────────────────────
//  Request structs
// ─────────────────────────────────────────────

USTRUCT(BlueprintType)
struct FNPCDialogueRequest
{
    GENERATED_BODY()

    /** NPC's display name (e.g. "Guard Holloway") */
    UPROPERTY(BlueprintReadWrite, Category = "OPEN-LEE|Dialogue")
    FString CharacterName;

    /** Short personality description used as the AI persona */
    UPROPERTY(BlueprintReadWrite, Category = "OPEN-LEE|Dialogue")
    FString CharacterPersonality;

    /** Key backstory facts that shape this NPC's responses */
    UPROPERTY(BlueprintReadWrite, Category = "OPEN-LEE|Dialogue")
    FString CharacterBackstory;

    /** What is happening in the scene right now */
    UPROPERTY(BlueprintReadWrite, Category = "OPEN-LEE|Dialogue")
    FString SceneContext;

    /** What the player just said or did to trigger this dialogue */
    UPROPERTY(BlueprintReadWrite, Category = "OPEN-LEE|Dialogue")
    FString PlayerInput;

    /** Previous lines in this conversation (alternating player/npc) */
    UPROPERTY(BlueprintReadWrite, Category = "OPEN-LEE|Dialogue")
    TArray<FString> ConversationHistory;
};

USTRUCT(BlueprintType)
struct FStoryEventRequest
{
    GENERATED_BODY()

    /** Identifier matching a story event defined in content/story/ */
    UPROPERTY(BlueprintReadWrite, Category = "OPEN-LEE|Story")
    FString EventName;

    /** The choice the player made at this event */
    UPROPERTY(BlueprintReadWrite, Category = "OPEN-LEE|Story")
    FString PlayerChoice;

    /** Snapshot of world context relevant to evaluating consequences */
    UPROPERTY(BlueprintReadWrite, Category = "OPEN-LEE|Story")
    FString WorldContext;

    /** Currently active story flags (e.g. ["met_warden","found_key"]) */
    UPROPERTY(BlueprintReadWrite, Category = "OPEN-LEE|Story")
    TArray<FString> ActiveStoryFlags;
};

// ─────────────────────────────────────────────
//  Subsystem
// ─────────────────────────────────────────────

UCLASS(Config=Game)
class NIGHTSHADEHOLLOW_API UOpenLEESubsystem : public UGameInstanceSubsystem
{
    GENERATED_BODY()

public:
    virtual void Initialize(FSubsystemCollectionBase& Collection) override;
    virtual void Deinitialize() override;

    // ── Public API (Blueprint-callable) ──────────────────────────

    /** Fire an NPC dialogue request; result fires OnNPCDialogueReceived */
    UFUNCTION(BlueprintCallable, Category = "OPEN-LEE|Dialogue")
    void RequestNPCDialogue(const FNPCDialogueRequest& Request);

    /** Fire a story-event resolution; result fires OnStoryEventResolved */
    UFUNCTION(BlueprintCallable, Category = "OPEN-LEE|Story")
    void RequestStoryEvent(const FStoryEventRequest& Request);

    /** Ping the backend; result fires OnBackendHealthChanged */
    UFUNCTION(BlueprintCallable, Category = "OPEN-LEE|System")
    void CheckBackendHealth();

    // ── Events ───────────────────────────────────────────────────

    UPROPERTY(BlueprintAssignable, Category = "OPEN-LEE|Dialogue")
    FOnNPCDialogueReceived OnNPCDialogueReceived;

    UPROPERTY(BlueprintAssignable, Category = "OPEN-LEE|Story")
    FOnStoryEventResolved OnStoryEventResolved;

    UPROPERTY(BlueprintAssignable, Category = "OPEN-LEE|System")
    FOnBackendHealthChanged OnBackendHealthChanged;

    // ── State ─────────────────────────────────────────────────────

    UPROPERTY(BlueprintReadOnly, Category = "OPEN-LEE|System")
    bool bBackendOnline = false;

    /** Override in DefaultGame.ini: [/Script/NightshadeHollow.OpenLEESubsystem] BackendURL=... */
    UPROPERTY(Config, BlueprintReadOnly, Category = "OPEN-LEE|System")
    FString BackendURL = TEXT("http://localhost:3001");

private:
    void SendRequest(const FString& Endpoint,
                     const FString& JsonBody,
                     TFunction<void(FHttpResponsePtr, bool)> Callback);

    void HandleDialogueResponse(FHttpResponsePtr Response, bool bSuccess, FString CharacterName);
    void HandleStoryEventResponse(FHttpResponsePtr Response, bool bSuccess);
    void HandleHealthResponse(FHttpResponsePtr Response, bool bSuccess);
};
