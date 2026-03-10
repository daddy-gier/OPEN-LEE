#include "Characters/NHNPCCharacter.h"
#include "Narrative/NHDialogueComponent.h"
#include "AIBridge/OpenLEESubsystem.h"
#include "Kismet/GameplayStatics.h"

ANHNPCCharacter::ANHNPCCharacter()
{
    PrimaryActorTick.bCanEverTick = false;
    DialogueComponent = CreateDefaultSubobject<UNHDialogueComponent>(TEXT("DialogueComponent"));
    Role = TEXT("prisoner");
}

void ANHNPCCharacter::BeginConversation(const FString& PlayerInput)
{
    UOpenLEESubsystem* OLEE = UGameplayStatics::GetGameInstance(this)
        ->GetSubsystem<UOpenLEESubsystem>();
    if (!OLEE) return;

    FNPCDialogueRequest Req;
    Req.CharacterName      = CharacterName;
    Req.CharacterPersonality = Personality;
    Req.CharacterBackstory   = Backstory;
    Req.SceneContext         = TEXT("Inside Nightshade Hollow prison.");
    Req.PlayerInput          = PlayerInput;
    Req.ConversationHistory  = DialogueComponent->GetHistory();

    OLEE->RequestNPCDialogue(Req);
}

void ANHNPCCharacter::ModifyRelationship(int32 Delta)
{
    int32 Tier = static_cast<int32>(RelationshipWithPlayer) + Delta;
    Tier = FMath::Clamp(Tier, 0, 4);
    RelationshipWithPlayer = static_cast<ENHRelationshipTier>(Tier);
}
