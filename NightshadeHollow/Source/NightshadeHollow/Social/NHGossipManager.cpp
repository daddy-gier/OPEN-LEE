#include "Social/NHGossipManager.h"

FGuid UNHGossipManager::PublishGossip(const FString& Originator, const FString& Subject,
                                       ENHGossipType Type, const FString& Content,
                                       float InitialCredibility)
{
    FNHGossipPacket Packet;
    Packet.GossipID         = FGuid::NewGuid();
    Packet.OriginatorName   = Originator;
    Packet.SubjectName      = Subject;
    Packet.GossipType       = Type;
    Packet.Content          = Content;
    Packet.Credibility      = FMath::Clamp(InitialCredibility, 0.f, 1.f);
    Packet.HopCount         = 0;
    Packet.CreatedAt        = GetWorld() ? GetWorld()->GetTimeSeconds() : 0.f;
    Packet.KnowingNPCs.Add(Originator);

    ActiveGossip.Add(Packet.GossipID, Packet);
    UE_LOG(LogTemp, Log, TEXT("[NH|Gossip] Published '%s' about %s (credibility %.2f)"),
           *Content.Left(40), *Subject, Packet.Credibility);

    return Packet.GossipID;
}

void UNHGossipManager::SimulateNPCInteraction(const FString& NPC_A, const FString& NPC_B)
{
    // Both NPCs may share gossip with each other during the interaction
    TArray<FGuid> GossipKeys;
    ActiveGossip.GetKeys(GossipKeys);

    for (FGuid ID : GossipKeys)
    {
        FNHGossipPacket& Packet = ActiveGossip[ID];
        if (Packet.Credibility < NoiseCutoff) continue;

        const bool bAKnows = Packet.KnowingNPCs.Contains(NPC_A);
        const bool bBKnows = Packet.KnowingNPCs.Contains(NPC_B);

        if (bAKnows && !bBKnows && FMath::FRand() < SpreadChancePerInteraction)
        {
            TrySpreadPacket(Packet, NPC_B);
        }
        else if (bBKnows && !bAKnows && FMath::FRand() < SpreadChancePerInteraction)
        {
            TrySpreadPacket(Packet, NPC_A);
        }
    }
}

void UNHGossipManager::TrySpreadPacket(FNHGossipPacket& Packet, const FString& ReceiverName)
{
    Packet.Credibility = FMath::Max(0.f, Packet.Credibility - CredibilityDecayPerHop);
    if (Packet.Credibility < NoiseCutoff) return;

    Packet.HopCount++;
    Packet.KnowingNPCs.Add(ReceiverName);
    OnGossipSpread.Broadcast(Packet, ReceiverName);

    if (!Packet.bReachedAuthorities && IsAuthorityNPC(ReceiverName))
    {
        Packet.bReachedAuthorities = true;
        OnGossipReachedAuthorities.Broadcast(Packet);
        UE_LOG(LogTemp, Warning, TEXT("[NH|Gossip] Gossip about '%s' reached authorities via %s"),
               *Packet.SubjectName, *ReceiverName);
    }
}

TArray<FNHGossipPacket> UNHGossipManager::GetGossipKnownBy(const FString& NPCName) const
{
    TArray<FNHGossipPacket> Result;
    for (const auto& Pair : ActiveGossip)
    {
        if (Pair.Value.KnowingNPCs.Contains(NPCName))
        {
            Result.Add(Pair.Value);
        }
    }
    return Result;
}

TArray<FNHGossipPacket> UNHGossipManager::GetGossipAbout(const FString& SubjectName) const
{
    TArray<FNHGossipPacket> Result;
    for (const auto& Pair : ActiveGossip)
    {
        if (Pair.Value.SubjectName.Equals(SubjectName, ESearchCase::IgnoreCase))
        {
            Result.Add(Pair.Value);
        }
    }
    return Result;
}

void UNHGossipManager::PlantGossip(const FString& NPCName, FGuid GossipID)
{
    FNHGossipPacket* Packet = ActiveGossip.Find(GossipID);
    if (!Packet || Packet->KnowingNPCs.Contains(NPCName)) return;
    Packet->KnowingNPCs.Add(NPCName);
    OnGossipSpread.Broadcast(*Packet, NPCName);
}

void UNHGossipManager::PurgeExpiredGossip(float MaxAgeSeconds)
{
    const float Now = GetWorld() ? GetWorld()->GetTimeSeconds() : 0.f;
    TArray<FGuid> ToRemove;
    for (const auto& Pair : ActiveGossip)
    {
        if ((Now - Pair.Value.CreatedAt) > MaxAgeSeconds || Pair.Value.Credibility < NoiseCutoff)
        {
            ToRemove.Add(Pair.Key);
        }
    }
    for (FGuid ID : ToRemove) ActiveGossip.Remove(ID);
    if (ToRemove.Num() > 0)
    {
        UE_LOG(LogTemp, Log, TEXT("[NH|Gossip] Purged %d expired packets."), ToRemove.Num());
    }
}

bool UNHGossipManager::IsAuthorityNPC(const FString& NPCName) const
{
    // Authority keywords — matches guard/CO/warden NPC names
    static const TArray<FString> AuthorityKeywords = {
        TEXT("Guard"), TEXT("CO"), TEXT("Officer"), TEXT("Warden"),
        TEXT("Sergeant"), TEXT("Captain"), TEXT("Lieutenant")
    };
    for (const FString& Keyword : AuthorityKeywords)
    {
        if (NPCName.Contains(Keyword, ESearchCase::IgnoreCase)) return true;
    }
    return false;
}
