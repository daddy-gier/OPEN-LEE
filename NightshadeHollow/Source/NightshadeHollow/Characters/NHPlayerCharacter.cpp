#include "Characters/NHPlayerCharacter.h"
#include "Camera/CameraComponent.h"
#include "GameFramework/SpringArmComponent.h"
#include "GameFramework/CharacterMovementComponent.h"
#include "EnhancedInputComponent.h"
#include "EnhancedInputSubsystems.h"
#include "InputActionValue.h"
#include "Math/RotationMatrix.h"

ANHPlayerCharacter::ANHPlayerCharacter()
{
    PrimaryActorTick.bCanEverTick = true;

    CameraBoom = CreateDefaultSubobject<USpringArmComponent>(TEXT("CameraBoom"));
    CameraBoom->SetupAttachment(RootComponent);
    CameraBoom->TargetArmLength = 400.f;
    CameraBoom->bUsePawnControlRotation = true;

    FollowCamera = CreateDefaultSubobject<UCameraComponent>(TEXT("FollowCamera"));
    FollowCamera->SetupAttachment(CameraBoom, USpringArmComponent::SocketName);
    FollowCamera->bUsePawnControlRotation = false;

    bUseControllerRotationYaw = false;
    GetCharacterMovement()->bOrientRotationToMovement = true;

    CharacterName = TEXT("Player");
    Role = TEXT("player");
}

void ANHPlayerCharacter::BeginPlay()
{
    Super::BeginPlay();

    if (APlayerController* PC = Cast<APlayerController>(GetController()))
    {
        if (UEnhancedInputLocalPlayerSubsystem* Subsystem =
            ULocalPlayer::GetSubsystem<UEnhancedInputLocalPlayerSubsystem>(PC->GetLocalPlayer()))
        {
            Subsystem->AddMappingContext(DefaultMappingContext, 0);
        }
    }
}

void ANHPlayerCharacter::Tick(float DeltaTime)
{
    Super::Tick(DeltaTime);
}

void ANHPlayerCharacter::SetupPlayerInputComponent(UInputComponent* PlayerInputComponent)
{
    Super::SetupPlayerInputComponent(PlayerInputComponent);

    if (UEnhancedInputComponent* EIC = Cast<UEnhancedInputComponent>(PlayerInputComponent))
    {
        EIC->BindAction(MoveAction,     ETriggerEvent::Triggered, this, &ANHPlayerCharacter::Move);
        EIC->BindAction(LookAction,     ETriggerEvent::Triggered, this, &ANHPlayerCharacter::Look);
        EIC->BindAction(InteractAction, ETriggerEvent::Started,   this, &ANHPlayerCharacter::TryInteract);
    }
}

void ANHPlayerCharacter::Move(const FInputActionValue& Value)
{
    FVector2D Axis = Value.Get<FVector2D>();
    if (AController* MyController = GetController())
    {
        const FRotator Rotation = MyController->GetControlRotation();
        const FRotator YawRotation(0, Rotation.Yaw, 0);
        AddMovementInput(FRotationMatrix(YawRotation).GetUnitAxis(EAxis::X), Axis.Y);
        AddMovementInput(FRotationMatrix(YawRotation).GetUnitAxis(EAxis::Y), Axis.X);
    }
}

void ANHPlayerCharacter::Look(const FInputActionValue& Value)
{
    FVector2D Axis = Value.Get<FVector2D>();
    AddControllerYawInput(Axis.X);
    AddControllerPitchInput(Axis.Y);
}

void ANHPlayerCharacter::TryInteract()
{
    // Line-trace forward; if we hit an interactable actor, call its interact interface.
    FVector Start = GetActorLocation();
    FVector End   = Start + GetActorForwardVector() * 250.f;

    FHitResult Hit;
    FCollisionQueryParams Params;
    Params.AddIgnoredActor(this);

    if (GetWorld()->LineTraceSingleByChannel(Hit, Start, End, ECC_Visibility, Params))
    {
        if (AActor* HitActor = Hit.GetActor())
        {
            UE_LOG(LogTemp, Log, TEXT("[NH] Player interacted with: %s"), *HitActor->GetName());
            // TODO: call INHInteractable::Execute_Interact(HitActor, this)
        }
    }
}

void ANHPlayerCharacter::ModifySuspicion(int32 Delta)
{
    Suspicion = FMath::Clamp(Suspicion + Delta, 0, 100);
    UE_LOG(LogTemp, Log, TEXT("[NH] Suspicion: %d"), Suspicion);
}

void ANHPlayerCharacter::ModifyInfluence(int32 Delta)
{
    Influence = FMath::Clamp(Influence + Delta, 0, 100);
    UE_LOG(LogTemp, Log, TEXT("[NH] Influence: %d"), Influence);
}
