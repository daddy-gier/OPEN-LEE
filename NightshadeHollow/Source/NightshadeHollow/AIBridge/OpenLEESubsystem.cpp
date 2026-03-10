#include "AIBridge/OpenLEESubsystem.h"
#include "HttpModule.h"
#include "Interfaces/IHttpRequest.h"
#include "Interfaces/IHttpResponse.h"
#include "Dom/JsonObject.h"
#include "Serialization/JsonWriter.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonSerializer.h"

// ─────────────────────────────────────────────────────────────────
//  Lifecycle
// ─────────────────────────────────────────────────────────────────

void UOpenLEESubsystem::Initialize(FSubsystemCollectionBase& Collection)
{
    Super::Initialize(Collection);
    UE_LOG(LogTemp, Log, TEXT("[OPEN-LEE] Subsystem initialized. Backend: %s"), *BackendURL);
    CheckBackendHealth();
}

void UOpenLEESubsystem::Deinitialize()
{
    Super::Deinitialize();
}

// ─────────────────────────────────────────────────────────────────
//  Public API
// ─────────────────────────────────────────────────────────────────

void UOpenLEESubsystem::RequestNPCDialogue(const FNPCDialogueRequest& Request)
{
    // Build history JSON array
    TArray<TSharedPtr<FJsonValue>> HistoryArray;
    for (const FString& Line : Request.ConversationHistory)
    {
        HistoryArray.Add(MakeShareable(new FJsonValueString(Line)));
    }

    TSharedPtr<FJsonObject> Body = MakeShareable(new FJsonObject());
    Body->SetStringField(TEXT("character"), Request.CharacterName);
    Body->SetStringField(TEXT("personality"), Request.CharacterPersonality);
    Body->SetStringField(TEXT("backstory"), Request.CharacterBackstory);
    Body->SetStringField(TEXT("context"), Request.SceneContext);
    Body->SetStringField(TEXT("playerInput"), Request.PlayerInput);
    Body->SetArrayField(TEXT("conversationHistory"), HistoryArray);

    FString JsonBody;
    auto Writer = TJsonWriterFactory<>::Create(&JsonBody);
    FJsonSerializer::Serialize(Body.ToSharedRef(), Writer);

    FString CapturedName = Request.CharacterName;
    SendRequest(TEXT("/api/game/npc-dialogue"), JsonBody,
        [this, CapturedName](FHttpResponsePtr Response, bool bSuccess)
        {
            HandleDialogueResponse(Response, bSuccess, CapturedName);
        });
}

void UOpenLEESubsystem::RequestStoryEvent(const FStoryEventRequest& Request)
{
    TArray<TSharedPtr<FJsonValue>> FlagsArray;
    for (const FString& Flag : Request.ActiveStoryFlags)
    {
        FlagsArray.Add(MakeShareable(new FJsonValueString(Flag)));
    }

    TSharedPtr<FJsonObject> Body = MakeShareable(new FJsonObject());
    Body->SetStringField(TEXT("event"), Request.EventName);
    Body->SetStringField(TEXT("playerChoice"), Request.PlayerChoice);
    Body->SetStringField(TEXT("worldContext"), Request.WorldContext);
    Body->SetArrayField(TEXT("activeStoryFlags"), FlagsArray);

    FString JsonBody;
    auto Writer = TJsonWriterFactory<>::Create(&JsonBody);
    FJsonSerializer::Serialize(Body.ToSharedRef(), Writer);

    SendRequest(TEXT("/api/game/story-event"), JsonBody,
        [this](FHttpResponsePtr Response, bool bSuccess)
        {
            HandleStoryEventResponse(Response, bSuccess);
        });
}

void UOpenLEESubsystem::CheckBackendHealth()
{
    TSharedRef<IHttpRequest, ESPMode::ThreadSafe> HttpRequest = FHttpModule::Get().CreateRequest();
    HttpRequest->SetURL(BackendURL + TEXT("/api/game/health"));
    HttpRequest->SetVerb(TEXT("GET"));
    HttpRequest->SetHeader(TEXT("Content-Type"), TEXT("application/json"));
    HttpRequest->OnProcessRequestComplete().BindLambda(
        [this](FHttpRequestPtr Req, FHttpResponsePtr Response, bool bSuccess)
        {
            HandleHealthResponse(Response, bSuccess);
        });
    HttpRequest->ProcessRequest();
}

// ─────────────────────────────────────────────────────────────────
//  Private helpers
// ─────────────────────────────────────────────────────────────────

void UOpenLEESubsystem::SendRequest(
    const FString& Endpoint,
    const FString& JsonBody,
    TFunction<void(FHttpResponsePtr, bool)> Callback)
{
    if (!bBackendOnline)
    {
        UE_LOG(LogTemp, Warning, TEXT("[OPEN-LEE] Backend offline — skipping request to %s"), *Endpoint);
        return;
    }

    TSharedRef<IHttpRequest, ESPMode::ThreadSafe> HttpRequest = FHttpModule::Get().CreateRequest();
    HttpRequest->SetURL(BackendURL + Endpoint);
    HttpRequest->SetVerb(TEXT("POST"));
    HttpRequest->SetHeader(TEXT("Content-Type"), TEXT("application/json"));
    HttpRequest->SetContentAsString(JsonBody);
    HttpRequest->OnProcessRequestComplete().BindLambda(
        [Callback](FHttpRequestPtr Req, FHttpResponsePtr Response, bool bSuccess)
        {
            Callback(Response, bSuccess);
        });
    HttpRequest->ProcessRequest();
}

void UOpenLEESubsystem::HandleDialogueResponse(
    FHttpResponsePtr Response, bool bSuccess, FString CharacterName)
{
    if (!bSuccess || !Response.IsValid())
    {
        UE_LOG(LogTemp, Error, TEXT("[OPEN-LEE] NPC dialogue request failed"));
        return;
    }

    TSharedPtr<FJsonObject> JsonObj;
    TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Response->GetContentAsString());
    if (!FJsonSerializer::Deserialize(Reader, JsonObj) || !JsonObj.IsValid())
    {
        UE_LOG(LogTemp, Error, TEXT("[OPEN-LEE] Failed to parse NPC dialogue JSON"));
        return;
    }

    FString DialogueLine = JsonObj->GetStringField(TEXT("dialogue"));
    OnNPCDialogueReceived.Broadcast(CharacterName, DialogueLine);
}

void UOpenLEESubsystem::HandleStoryEventResponse(FHttpResponsePtr Response, bool bSuccess)
{
    if (!bSuccess || !Response.IsValid())
    {
        UE_LOG(LogTemp, Error, TEXT("[OPEN-LEE] Story event request failed"));
        return;
    }

    TSharedPtr<FJsonObject> JsonObj;
    TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Response->GetContentAsString());
    if (!FJsonSerializer::Deserialize(Reader, JsonObj) || !JsonObj.IsValid())
    {
        UE_LOG(LogTemp, Error, TEXT("[OPEN-LEE] Failed to parse story event JSON"));
        return;
    }

    FString Outcome      = JsonObj->GetStringField(TEXT("outcome"));
    FString NarrativeText = JsonObj->GetStringField(TEXT("narrative"));
    OnStoryEventResolved.Broadcast(Outcome, NarrativeText);
}

void UOpenLEESubsystem::HandleHealthResponse(FHttpResponsePtr Response, bool bSuccess)
{
    bool bNowOnline = bSuccess && Response.IsValid() && Response->GetResponseCode() == 200;
    if (bNowOnline != bBackendOnline)
    {
        bBackendOnline = bNowOnline;
        OnBackendHealthChanged.Broadcast(bBackendOnline);
        UE_LOG(LogTemp, Log, TEXT("[OPEN-LEE] Backend is now %s"),
               bBackendOnline ? TEXT("ONLINE") : TEXT("OFFLINE"));
    }
}
