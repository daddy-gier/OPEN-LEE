#pragma once

#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "NHHitMarket.generated.h"

// ── Hit Status ────────────────────────────────────────────────────────────────

UENUM(BlueprintType)
enum class ENHHitStatus : uint8
{
    Pending     UMETA(DisplayName = "Pending"),
    Accepted    UMETA(DisplayName = "Accepted"),
    InProgress  UMETA(DisplayName = "In Progress"),
    Completed   UMETA(DisplayName = "Completed"),
    Failed      UMETA(DisplayName = "Failed"),
    Cancelled   UMETA(DisplayName = "Cancelled"),
    Blocked     UMETA(DisplayName = "Blocked"),   // protected target — always 0%
};

// ── Hit Contract ──────────────────────────────────────────────────────────────

USTRUCT(BlueprintType)
struct FNHHitContract
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadOnly)
    FGuid ContractID;

    /** Who placed the contract */
    UPROPERTY(BlueprintReadOnly)
    FString Requester;

    /** Who the hit is on */
    UPROPERTY(BlueprintReadOnly)
    FString TargetName;

    /** DC (Dirt Currency) bounty offered */
    UPROPERTY(BlueprintReadOnly)
    int32 Bounty = 0;

    /** Who accepted (empty if Pending) */
    UPROPERTY(BlueprintReadOnly)
    FString Contractor;

    UPROPERTY(BlueprintReadOnly)
    ENHHitStatus Status = ENHHitStatus::Pending;

    /** 0.0 – 1.0. Protected characters are pinned at 0.0 */
    UPROPERTY(BlueprintReadOnly)
    float SuccessProbability = 0.5f;

    UPROPERTY(BlueprintReadOnly)
    float CreatedAt = 0.f;
};

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnHitContractPosted, const FNHHitContract&, Contract);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnHitContractResolved, const FNHHitContract&, Contract, bool, bSucceeded);

/**
 * NHHitMarket — GameInstanceSubsystem managing hit contracts in the prison economy.
 *
 * Inmates can pay DC (Dirt Currency) to place contracts on other characters.
 * Protected characters (Ari, Mariah, Lee) have their success probability
 * permanently locked at 0% — contracts can be placed but will never execute.
 * The contractor NPC is resolved via faction/reputation logic.
 */
UCLASS()
class NIGHTSHADEHOLLOW_API UNHHitMarket : public UGameInstanceSubsystem
{
    GENERATED_BODY()

public:
    virtual void Initialize(FSubsystemCollectionBase& Collection) override;

    // ── Contracts ─────────────────────────────────────────────────

    /** Post a hit contract. Returns the ContractID or an invalid GUID if rejected. */
    UFUNCTION(BlueprintCallable, Category = "NH|HitMarket")
    FGuid PostContract(const FString& Requester, const FString& TargetName, int32 Bounty);

    /** Accept an open contract on behalf of an NPC contractor */
    UFUNCTION(BlueprintCallable, Category = "NH|HitMarket")
    bool AcceptContract(FGuid ContractID, const FString& ContractorName);

    /** Attempt resolution — rolls against SuccessProbability */
    UFUNCTION(BlueprintCallable, Category = "NH|HitMarket")
    void ResolveContract(FGuid ContractID);

    UFUNCTION(BlueprintCallable, Category = "NH|HitMarket")
    bool CancelContract(FGuid ContractID, const FString& RequesterName);

    // ── Query ─────────────────────────────────────────────────────

    UFUNCTION(BlueprintCallable, Category = "NH|HitMarket")
    TArray<FNHHitContract> GetOpenContracts() const;

    UFUNCTION(BlueprintCallable, Category = "NH|HitMarket")
    TArray<FNHHitContract> GetContractsOnTarget(const FString& TargetName) const;

    UFUNCTION(BlueprintPure, Category = "NH|HitMarket")
    bool IsProtectedTarget(const FString& TargetName) const;

    // ── DC Currency ───────────────────────────────────────────────

    UFUNCTION(BlueprintCallable, Category = "NH|HitMarket")
    int32 GetPlayerDC() const { return PlayerDC; }

    UFUNCTION(BlueprintCallable, Category = "NH|HitMarket")
    bool SpendPlayerDC(int32 Amount);

    UFUNCTION(BlueprintCallable, Category = "NH|HitMarket")
    void AddPlayerDC(int32 Amount);

    // ── Delegates ─────────────────────────────────────────────────

    UPROPERTY(BlueprintAssignable, Category = "NH|HitMarket")
    FOnHitContractPosted OnHitContractPosted;

    UPROPERTY(BlueprintAssignable, Category = "NH|HitMarket")
    FOnHitContractResolved OnHitContractResolved;

private:
    TMap<FGuid, FNHHitContract> Contracts;
    int32 PlayerDC = 0;

    /** Permanently protected names — success probability is always 0% */
    TSet<FString> ProtectedTargets;

    float ComputeSuccessProbability(const FString& TargetName) const;
};
