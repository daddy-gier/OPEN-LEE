#include "Economy/NHHitMarket.h"

void UNHHitMarket::Initialize(FSubsystemCollectionBase& Collection)
{
    Super::Initialize(Collection);

    // Protected characters — success probability locked at 0%
    ProtectedTargets.Add(TEXT("Ari"));
    ProtectedTargets.Add(TEXT("Ariana"));
    ProtectedTargets.Add(TEXT("Mariah"));
    ProtectedTargets.Add(TEXT("Mari"));
    ProtectedTargets.Add(TEXT("Lee"));
    ProtectedTargets.Add(TEXT("Maddox"));
    ProtectedTargets.Add(TEXT("Braxton"));

    UE_LOG(LogTemp, Log, TEXT("[NH|HitMarket] Hit market open. %d protected targets."),
           ProtectedTargets.Num());
}

FGuid UNHHitMarket::PostContract(const FString& Requester, const FString& TargetName, int32 Bounty)
{
    if (Bounty <= 0)
    {
        UE_LOG(LogTemp, Warning, TEXT("[NH|HitMarket] Contract rejected — zero bounty."));
        return FGuid();
    }

    FNHHitContract Contract;
    Contract.ContractID         = FGuid::NewGuid();
    Contract.Requester          = Requester;
    Contract.TargetName         = TargetName;
    Contract.Bounty             = Bounty;
    Contract.Status             = IsProtectedTarget(TargetName)
                                    ? ENHHitStatus::Blocked
                                    : ENHHitStatus::Pending;
    Contract.SuccessProbability = ComputeSuccessProbability(TargetName);
    Contract.CreatedAt          = 0.f; // set by world time if needed

    Contracts.Add(Contract.ContractID, Contract);
    OnHitContractPosted.Broadcast(Contract);

    UE_LOG(LogTemp, Log, TEXT("[NH|HitMarket] Contract posted: %s → %s (%d DC, p=%.2f, status=%d)"),
           *Requester, *TargetName, Bounty, Contract.SuccessProbability, (int32)Contract.Status);

    return Contract.ContractID;
}

bool UNHHitMarket::AcceptContract(FGuid ContractID, const FString& ContractorName)
{
    FNHHitContract* C = Contracts.Find(ContractID);
    if (!C || C->Status != ENHHitStatus::Pending) return false;

    C->Contractor = ContractorName;
    C->Status     = ENHHitStatus::Accepted;

    UE_LOG(LogTemp, Log, TEXT("[NH|HitMarket] %s accepted contract on %s."),
           *ContractorName, *C->TargetName);
    return true;
}

void UNHHitMarket::ResolveContract(FGuid ContractID)
{
    FNHHitContract* C = Contracts.Find(ContractID);
    if (!C) return;

    if (C->Status == ENHHitStatus::Blocked)
    {
        UE_LOG(LogTemp, Warning,
               TEXT("[NH|HitMarket] Contract on '%s' is blocked — protected target. Resolved: FAILED."),
               *C->TargetName);
        C->Status = ENHHitStatus::Failed;
        OnHitContractResolved.Broadcast(*C, false);
        return;
    }

    if (C->Status != ENHHitStatus::Accepted && C->Status != ENHHitStatus::InProgress) return;

    const bool bSuccess = FMath::FRand() <= C->SuccessProbability;
    C->Status = bSuccess ? ENHHitStatus::Completed : ENHHitStatus::Failed;

    OnHitContractResolved.Broadcast(*C, bSuccess);
    UE_LOG(LogTemp, Log, TEXT("[NH|HitMarket] Contract on %s resolved: %s"),
           *C->TargetName, bSuccess ? TEXT("SUCCESS") : TEXT("FAILED"));
}

bool UNHHitMarket::CancelContract(FGuid ContractID, const FString& RequesterName)
{
    FNHHitContract* C = Contracts.Find(ContractID);
    if (!C || !C->Requester.Equals(RequesterName, ESearchCase::IgnoreCase)) return false;
    if (C->Status == ENHHitStatus::InProgress || C->Status == ENHHitStatus::Completed) return false;

    C->Status = ENHHitStatus::Cancelled;
    return true;
}

TArray<FNHHitContract> UNHHitMarket::GetOpenContracts() const
{
    TArray<FNHHitContract> Result;
    for (const auto& Pair : Contracts)
    {
        if (Pair.Value.Status == ENHHitStatus::Pending ||
            Pair.Value.Status == ENHHitStatus::Accepted)
        {
            Result.Add(Pair.Value);
        }
    }
    return Result;
}

TArray<FNHHitContract> UNHHitMarket::GetContractsOnTarget(const FString& TargetName) const
{
    TArray<FNHHitContract> Result;
    for (const auto& Pair : Contracts)
    {
        if (Pair.Value.TargetName.Equals(TargetName, ESearchCase::IgnoreCase))
        {
            Result.Add(Pair.Value);
        }
    }
    return Result;
}

bool UNHHitMarket::IsProtectedTarget(const FString& TargetName) const
{
    for (const FString& Protected : ProtectedTargets)
    {
        if (TargetName.Equals(Protected, ESearchCase::IgnoreCase)) return true;
    }
    return false;
}

bool UNHHitMarket::SpendPlayerDC(int32 Amount)
{
    if (PlayerDC < Amount) return false;
    PlayerDC -= Amount;
    return true;
}

void UNHHitMarket::AddPlayerDC(int32 Amount)
{
    PlayerDC = FMath::Max(0, PlayerDC + Amount);
}

float UNHHitMarket::ComputeSuccessProbability(const FString& TargetName) const
{
    if (IsProtectedTarget(TargetName)) return 0.f;
    return 0.5f; // base probability — faction/reputation modifiers applied externally
}
