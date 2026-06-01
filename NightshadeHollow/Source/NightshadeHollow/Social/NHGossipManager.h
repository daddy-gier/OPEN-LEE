#pragma once

#include "CoreMinimal.h"
#include "Subsystems/WorldSubsystem.h"
#include "NHGossipManager.generated.h"

// ── Gossip Type ───────────────────────────────────────────────────────────────

UENUM(BlueprintType)
enum class ENHGossipType : uint8
{
    Rumor           UMETA(DisplayName = "Rumor"),
    Sighting        UMETA(DisplayName = "Sighting"),
    Threat          UMETA(DisplayName = "Threat"),
    Trade           UMETA(DisplayName = "Trade Opportunity"),
    Warning         UMETA(DisplayName = "Warning"),
    FactionMove     UMETA(DisplayName = "Faction Move"),
    Contraband      UMETA(DisplayName = "Contraband"),
    Betrayal        UMETA(DisplayName = "Betrayal"),
    Hit             UMETA(DisplayName = "Hit Contract"),
    PlayerActivity  UMETA(DisplayName = "Player Activity"),
};

// ── Gossip Packet ─────────────────────────────────────────────────────────────

USTRUCT(BlueprintType)
struct FNHGossipPacket
{
    GENERATED_BODY()

    /** Unique ID for this piece of gossip */
    UPROPERTY(BlueprintReadOnly)
    FGuid GossipID;

    /** Who originally generated this gossip (character name or "System") */
    UPROPERTY(BlueprintReadOnly)
    FString OriginatorName;

    /** Subject of the gossip */
    UPROPERTY(BlueprintReadOnly)
    FString SubjectName;

    UPROPERTY(BlueprintReadOnly)
    ENHGossipType GossipType = ENHGossipType::Rumor;

    /** Human-readable content */
    UPROPERTY(BlueprintReadOnly)
    FString Content;

    /** 0.0 – 1.0. Decays each NPC hop; below 0.1 the gossip is treated as noise */
    UPROPERTY(BlueprintReadOnly)
    float Credibility = 1.f;

    /** How many NPCs this has already passed through */
    UPROPERTY(BlueprintReadOnly)
    int32 HopCount = 0;

    /** Game time when created */
    UPROPERTY(BlueprintReadOnly)
    float CreatedAt = 0.f;

    /** NPCs that currently know this gossip (by CharacterName) */
    UPROPERTY(BlueprintReadOnly)
    TArray<FString> KnowingNPCs;

    /** Whether this gossip has reached guard/staff channels */
    UPROPERTY(BlueprintReadOnly)
    bool bReachedAuthorities = false;
};

DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnGossipSpread,
    const FNHGossipPacket&, Packet, const FString&, NewKnowerName);

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnGossipReachedAuthorities,
    const FNHGossipPacket&, Packet);

/**
 * NHGossipManager — WorldSubsystem simulating information spread through the prison.
 *
 * Gossip packets originate from events or NPCs, then spread NPC-to-NPC during
 * conversations. Each hop reduces credibility by CredibilityDecayPerHop.
 * When credibility falls below the noise floor the packet expires.
 * Staff/guard NPCs who receive gossip may escalate it to authorities.
 */
UCLASS()
class NIGHTSHADEHOLLOW_API UNHGossipManager : public UWorldSubsystem
{
    GENERATED_BODY()

public:
    // ── Configuration ─────────────────────────────────────────────

    /** Credibility lost each time gossip passes to a new NPC */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "NH|Gossip")
    float CredibilityDecayPerHop = 0.12f;

    /** Gossip below this credibility is silently discarded */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "NH|Gossip")
    float NoiseCutoff = 0.08f;

    /** Probability per interaction that gossip spreads to a bystander NPC */
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "NH|Gossip")
    float SpreadChancePerInteraction = 0.45f;

    // ── API ───────────────────────────────────────────────────────

    /** Inject a new gossip packet into the simulation */
    UFUNCTION(BlueprintCallable, Category = "NH|Gossip")
    FGuid PublishGossip(const FString& Originator, const FString& Subject,
                        ENHGossipType Type, const FString& Content,
                        float InitialCredibility = 1.f);

    /** Called by NPC dialogue system when two NPCs interact */
    UFUNCTION(BlueprintCallable, Category = "NH|Gossip")
    void SimulateNPCInteraction(const FString& NPC_A, const FString& NPC_B);

    /** Returns all gossip currently known by a given NPC */
    UFUNCTION(BlueprintCallable, Category = "NH|Gossip")
    TArray<FNHGossipPacket> GetGossipKnownBy(const FString& NPCName) const;

    /** Returns gossip about a specific subject */
    UFUNCTION(BlueprintCallable, Category = "NH|Gossip")
    TArray<FNHGossipPacket> GetGossipAbout(const FString& SubjectName) const;

    /** Directly plant gossip in a specific NPC's knowledge (e.g. player tells them) */
    UFUNCTION(BlueprintCallable, Category = "NH|Gossip")
    void PlantGossip(const FString& NPCName, FGuid GossipID);

    /** Expire all gossip older than MaxAgeSeconds */
    UFUNCTION(BlueprintCallable, Category = "NH|Gossip")
    void PurgeExpiredGossip(float MaxAgeSeconds = 600.f);

    // ── Delegates ─────────────────────────────────────────────────

    UPROPERTY(BlueprintAssignable, Category = "NH|Gossip")
    FOnGossipSpread OnGossipSpread;

    UPROPERTY(BlueprintAssignable, Category = "NH|Gossip")
    FOnGossipReachedAuthorities OnGossipReachedAuthorities;

private:
    TMap<FGuid, FNHGossipPacket> ActiveGossip;

    void TrySpreadPacket(FNHGossipPacket& Packet, const FString& ReceiverName);
    bool IsAuthorityNPC(const FString& NPCName) const;
};
