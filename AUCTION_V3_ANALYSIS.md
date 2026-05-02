# ARTSOUL AUCTION V3 - DEEP ECONOMIC ANALYSIS & REDESIGN

**Date:** 2026-05-02  
**Status:** CRITICAL REVIEW - DO NOT IMPLEMENT YET  
**Purpose:** Game-theoretic analysis and improved auction mechanism design

---

## EXECUTIVE SUMMARY

**Current System Status:** ⚠️ VULNERABLE TO MANIPULATION

**Key Findings:**
- 10% deposit is insufficient deterrent for price manipulation
- No second-bidder fallback creates market inefficiency
- Floor price can be artificially inflated without real liquidity
- Weak penalties enable strategic gaming

**Recommendation:** Implement Auction V3 with dynamic deposits, reputation system, and multi-tier penalties

---

## PART 1: CURRENT SYSTEM ANALYSIS

### 1.1 Auction V2 Mechanism (As Implemented)

```
FLOW:
1. Creator uploads artwork → DRAFT
2. Creator starts 3-day auction
3. Bidders place bids with 10% deposit
4. Previous bidder gets refunded immediately
5. Auction ends → Winner has 24h to purchase
6. If winner purchases → NFT minted, floor price set
7. If winner doesn't purchase → loses 10% deposit
8. Artwork can be sold at ≥ floor price
```

**Key Parameters:**
- Auction Duration: 3 days
- Winner Window: 24 hours
- Deposit: 10% of bid
- Min Bid Increment: 5%
- Platform Fee: 2.5%
- Creator Royalty: 7.5%

---

### 1.2 CRITICAL VULNERABILITIES

#### ATTACK 1: Price Inflation Attack

**Scenario:**
```
1. Attacker bids 100 ETH on artwork worth 1 ETH
2. Pays only 10 ETH deposit
3. Does not complete purchase
4. Loses 10 ETH but sets floor at 100 ETH
```

**Impact:**
- False price signal to market
- Other artworks appear undervalued
- Attacker may profit from:
  - Owning similar artworks
  - Reputation manipulation
  - Market confusion

**Cost to Attacker:** 10 ETH  
**Damage to Market:** Massive (false floor price)

**Game Theory:** If attacker's benefit > 10% of inflated bid, attack is profitable

---

#### ATTACK 2: Coordinated Shill Bidding

**Scenario:**
```
1. Creator creates multiple wallets
2. Bids up own artwork with fake accounts
3. Each wallet pays 10% deposit
4. Final "winner" doesn't purchase
5. Floor price artificially high
```

**Cost:** 10% × number of bids  
**Benefit:** Inflated reputation + higher future sales

---

#### ATTACK 3: Winner Default Griefing

**Scenario:**
```
1. Legitimate bidders compete
2. Griefer bids slightly higher at last second
3. Griefer doesn't purchase
4. Legitimate buyers lose interest
5. Artwork stuck with inflated floor
```

**Impact:**
- Wastes everyone's time
- Damages creator's sales opportunity
- 10% penalty insufficient deterrent

---

#### ATTACK 4: No Second-Bidder Recovery

**Problem:**
```
Current: Winner defaults → Artwork goes to FOR_SALE
Better: Winner defaults → Second bidder gets option
```

**Lost Opportunity:**
- Second bidder was willing to pay their bid
- No mechanism to capture this demand
- Creator loses guaranteed sale

---

### 1.3 ECONOMIC ANALYSIS

#### Deposit Adequacy Test

**Question:** Is 10% deposit sufficient?

**Analysis:**
```
For manipulation to be unprofitable:
Penalty > Expected Benefit

Current:
Penalty = 10% of bid
Benefit = Variable (reputation, market manipulation, etc.)

Example:
- Bid 100 ETH, pay 10 ETH deposit
- If benefit > 10 ETH → attack profitable
```

**Conclusion:** 10% is TOO LOW for high-value manipulation

---

#### Penalty Distribution

**Current:**
```
Winner defaults → 10% deposit lost
Where does it go? → Stays in contract (platform keeps it)
```

**Problems:**
- Creator gets nothing (despite wasted time)
- Platform profits from failures
- No burn mechanism (no systemic deterrent)

---

#### Floor Price Validity

**Current System:**
```
Floor Price = Highest Bid (regardless of completion)
```

**Problem:**
- "Floor" implies liquidity at that price
- But if winner didn't buy, there's NO liquidity
- Misleading to future buyers

**Better Distinction:**
- **Auction Floor** (unverified) = Highest bid
- **Real Floor** (verified) = Actual completed sale

---

## PART 2: IMPROVED AUCTION V3 DESIGN

### 2.1 CORE PRINCIPLES

1. **Incentive Alignment:** Make honest bidding the dominant strategy
2. **Attack Resistance:** Make manipulation more expensive than benefit
3. **Market Efficiency:** Capture all legitimate demand
4. **Creator Protection:** Ensure creators aren't harmed by bad actors
5. **Transparency:** Clear distinction between verified and unverified prices

---

### 2.2 DYNAMIC DEPOSIT SYSTEM

**Problem:** Fixed 10% doesn't scale with risk

**Solution:** Risk-based deposit calculation

```solidity
function calculateDeposit(
    uint256 bidAmount,
    address bidder,
    uint256 artworkId
) public view returns (uint256) {
    uint256 baseDeposit = (bidAmount * BASE_DEPOSIT_BPS) / 10000;
    
    // Factor 1: Bid size (larger bids = higher deposit %)
    uint256 sizeMultiplier = calculateSizeMultiplier(bidAmount);
    
    // Factor 2: Bidder reputation
    uint256 reputationMultiplier = getReputationMultiplier(bidder);
    
    // Factor 3: Artwork volatility
    uint256 volatilityMultiplier = getVolatilityMultiplier(artworkId);
    
    uint256 deposit = baseDeposit * sizeMultiplier * reputationMultiplier * volatilityMultiplier / 1000000;
    
    // Clamp between 10% and 50%
    if (deposit < bidAmount * 1000 / 10000) deposit = bidAmount * 1000 / 10000; // Min 10%
    if (deposit > bidAmount * 5000 / 10000) deposit = bidAmount * 5000 / 10000; // Max 50%
    
    return deposit;
}
```

**Deposit Tiers:**
```
Bid Range          | Base Deposit | With Bad Reputation
-------------------|--------------|--------------------
0 - 1 ETH          | 10%          | 15%
1 - 10 ETH         | 15%          | 25%
10 - 100 ETH       | 25%          | 40%
100+ ETH           | 35%          | 50%
```

**Benefits:**
- Small bids: Low barrier to entry
- Large bids: High commitment required
- Bad actors: Progressively priced out

---

### 2.3 REPUTATION SYSTEM

**Wallet-Level Reputation Score**

```solidity
struct Reputation {
    uint256 totalBids;
    uint256 completedPurchases;
    uint256 defaults;
    uint256 totalVolume;
    uint256 lastDefaultTimestamp;
    bool restricted;
}

function getReputationScore(address user) public view returns (uint256) {
    Reputation memory rep = reputations[user];
    
    if (rep.restricted) return 0;
    if (rep.totalBids == 0) return 100; // Neutral start
    
    uint256 completionRate = (rep.completedPurchases * 100) / rep.totalBids;
    uint256 volumeBonus = min(rep.totalVolume / 1 ether, 50); // Max +50 points
    uint256 defaultPenalty = rep.defaults * 20; // -20 per default
    
    uint256 score = completionRate + volumeBonus;
    if (score > defaultPenalty) {
        score -= defaultPenalty;
    } else {
        score = 0;
    }
    
    // Recent default = extra penalty
    if (block.timestamp - rep.lastDefaultTimestamp < 30 days) {
        score = score / 2;
    }
    
    return min(score, 100);
}
```

**Reputation Effects:**
```
Score 80-100: Normal deposits (10-35%)
Score 50-79:  +50% deposit requirement
Score 20-49:  +100% deposit requirement
Score 0-19:   +150% deposit requirement
Score 0:      Bidding restricted
```

**Reputation Recovery:**
- Complete 5 successful purchases → +10 points
- 90 days without default → Reset recent penalty
- High volume trading → Bonus points

---

### 2.4 MULTI-TIER PENALTY SYSTEM

**Current:** Lose 10% deposit → Platform keeps it

**Improved:** Graduated penalties with distribution

```solidity
function handleWinnerDefault(uint256 artworkId) internal {
    Auction storage auction = auctions[artworkId];
    Artwork storage artwork = artworks[artworkId];
    
    uint256 deposit = auction.winnerDeposit;
    
    // Penalty distribution:
    // 40% → Creator (compensation for wasted time)
    // 30% → Burned (systemic deterrent)
    // 20% → Second bidder (if they purchase)
    // 10% → Platform
    
    uint256 creatorShare = (deposit * 4000) / 10000;
    uint256 burnShare = (deposit * 3000) / 10000;
    uint256 incentiveShare = (deposit * 2000) / 10000;
    uint256 platformShare = (deposit * 1000) / 10000;
    
    // Pay creator immediately
    payable(artwork.creator).transfer(creatorShare);
    
    // Burn tokens (send to dead address)
    payable(BURN_ADDRESS).transfer(burnShare);
    
    // Hold incentive for second bidder
    secondBidderIncentives[artworkId] = incentiveShare;
    
    // Platform fee
    // (stays in contract)
    
    // Update reputation
    reputations[auction.auctionWinner].defaults++;
    reputations[auction.auctionWinner].lastDefaultTimestamp = block.timestamp;
    
    // Restrict if too many defaults
    if (reputations[auction.auctionWinner].defaults >= 3) {
        reputations[auction.auctionWinner].restricted = true;
    }
}
```

**Why This Works:**
- Creator compensated (not harmed by attack)
- Burn reduces circulating ETH (benefits all holders)
- Second bidder incentivized (captures demand)
- Platform gets small fee (operational costs)
- Attacker loses MORE than just deposit (reputation damage)

---

### 2.5 SECOND-BIDDER FALLBACK

**Mechanism:**

```solidity
function offerToSecondBidder(uint256 artworkId) external {
    require(msg.sender == artwork.creator || msg.sender == owner(), "Not authorized");
    
    Auction storage auction = auctions[artworkId];
    require(auction.ended && !auction.winnerPurchased, "Invalid state");
    require(block.timestamp > auction.winnerDeadline, "Winner window active");
    
    // Find second highest bidder
    address secondBidder = findSecondHighestBidder(artworkId);
    require(secondBidder != address(0), "No second bidder");
    
    Bid memory secondBid = getSecondHighestBid(artworkId);
    
    // Offer to second bidder at their bid price + incentive
    secondBidderOffers[artworkId] = SecondBidderOffer({
        bidder: secondBidder,
        price: secondBid.amount,
        incentive: secondBidderIncentives[artworkId],
        deadline: block.timestamp + 24 hours,
        active: true
    });
    
    emit SecondBidderOffered(artworkId, secondBidder, secondBid.amount);
}

function purchaseBySecondBidder(uint256 artworkId) external payable nonReentrant {
    SecondBidderOffer storage offer = secondBidderOffers[artworkId];
    require(offer.active, "No active offer");
    require(msg.sender == offer.bidder, "Not the second bidder");
    require(block.timestamp <= offer.deadline, "Offer expired");
    
    // Calculate payment (bid - original deposit + get incentive back)
    Bid memory originalBid = getUserBid(artworkId, msg.sender);
    uint256 remainingPayment = offer.price - originalBid.deposit;
    require(msg.value >= remainingPayment, "Insufficient payment");
    
    // Mint NFT
    uint256 tokenId = nftContract.mintNFT(
        artwork.creator,
        msg.sender,
        artwork.metadataURI,
        royaltyFeeBps
    );
    
    // Pay creator
    uint256 platformFee = (offer.price * platformFeeBps) / 10000;
    uint256 creatorAmount = offer.price - platformFee;
    payable(artwork.creator).transfer(creatorAmount);
    
    // Give incentive to second bidder (from winner's forfeited deposit)
    payable(msg.sender).transfer(offer.incentive);
    
    // Update state
    artwork.tokenId = tokenId;
    artwork.currentOwner = msg.sender;
    artwork.status = ArtworkStatus.SOLD;
    artwork.floorPrice = offer.price; // Real floor (verified)
    offer.active = false;
    
    emit SecondBidderPurchased(artworkId, msg.sender, tokenId, offer.incentive);
}
```

**Benefits:**
- Captures legitimate demand
- Second bidder gets discount (incentive from defaulter)
- Creator still gets sale
- Market efficiency improved

---

### 2.6 FLOOR PRICE VALIDITY SYSTEM

**Two Types of Floor Prices:**

```solidity
struct FloorPrice {
    uint256 auctionFloor;      // Highest bid (unverified)
    uint256 realFloor;         // Actual sale price (verified)
    bool verified;             // Has real sale occurred?
    uint256 timestamp;
}

mapping(uint256 => FloorPrice) public floorPrices;
```

**UI Display:**
```
Unverified Floor: 10 ETH ⚠️ (Auction bid, not completed)
Verified Floor: 5 ETH ✓ (Last actual sale)
```

**Smart Contract Logic:**
```solidity
function setForSale(uint256 artworkId, uint256 price) external {
    Artwork storage artwork = artworks[artworkId];
    require(artwork.creator == msg.sender, "Not creator");
    
    FloorPrice storage floor = floorPrices[artworkId];
    
    if (floor.verified) {
        // Use real floor
        require(price >= floor.realFloor, "Below verified floor");
    } else {
        // Use auction floor but warn
        require(price >= floor.auctionFloor, "Below auction floor");
        // Note: This is unverified, creator takes risk
    }
    
    artwork.salePrice = price;
    artwork.status = ArtworkStatus.FOR_SALE;
}
```

---

### 2.7 TIME-DECAY PENALTIES

**Concept:** Longer you wait to default, higher the penalty

```solidity
function calculateDefaultPenalty(uint256 artworkId) public view returns (uint256) {
    Auction storage auction = auctions[artworkId];
    uint256 timeElapsed = block.timestamp - auction.winnerDeadline;
    
    // Base penalty: lose deposit
    uint256 penalty = auction.winnerDeposit;
    
    // Time decay: +1% per hour late
    uint256 hoursLate = timeElapsed / 1 hour;
    uint256 additionalPenalty = (auction.highestBid * hoursLate * 100) / 10000;
    
    // Cap at 50% of bid
    uint256 maxPenalty = auction.highestBid / 2;
    if (penalty + additionalPenalty > maxPenalty) {
        return maxPenalty;
    }
    
    return penalty + additionalPenalty;
}
```

**Effect:**
- Immediate default: Lose deposit only
- 1 hour late: Lose deposit + 1% of bid
- 24 hours late: Lose deposit + 24% of bid
- Forces quick decision

---

## PART 3: ADVANCED MECHANISMS

### 3.1 ANTI-SNIPING: Soft Close

**Problem:** Last-second bids prevent fair competition

**Solution:** Extend auction if bid in final minutes

```solidity
function placeBid(uint256 artworkId) external payable {
    // ... existing checks ...
    
    // Soft close: extend auction if bid in last 10 minutes
    if (auction.endTime - block.timestamp < 10 minutes) {
        auction.endTime = block.timestamp + 10 minutes;
        emit AuctionExtended(artworkId, auction.endTime);
    }
    
    // ... rest of bid logic ...
}
```

---

### 3.2 MINIMUM VIABLE BID

**Problem:** Tiny bids waste everyone's time

**Solution:** Minimum bid based on artwork value

```solidity
function createAuction(uint256 artworkId) external {
    // ... existing checks ...
    
    // Minimum starting price: 0.001 ETH or creator value
    require(
        artwork.creatorValue >= 0.001 ether,
        "Starting price too low"
    );
    
    // ... rest of auction creation ...
}
```

---

### 3.3 CREATOR RESERVE PRICE

**Concept:** Creator can set hidden reserve

```solidity
struct Auction {
    // ... existing fields ...
    uint256 reservePrice;      // Hidden minimum
    bool reserveMet;
}

function endAuction(uint256 artworkId) external {
    // ... existing checks ...
    
    if (auction.highestBid < auction.reservePrice) {
        // Reserve not met - auction fails
        artwork.status = ArtworkStatus.DRAFT;
        // Refund highest bidder
        payable(auction.highestBidder).transfer(auction.highestBid);
        emit AuctionFailedReserve(artworkId);
    } else {
        // Reserve met - proceed normally
        // ... existing end auction logic ...
    }
}
```

---

### 3.4 WHALE PROTECTION

**Problem:** Single whale can dominate all auctions

**Solution:** Progressive bidding tax

```solidity
function calculateBiddingTax(address bidder, uint256 bidAmount) public view returns (uint256) {
    // Get bidder's active bids across all auctions
    uint256 activeBidVolume = getActiveBidVolume(bidder);
    
    // Progressive tax:
    // 0-10 ETH active: 0% tax
    // 10-50 ETH active: 1% tax
    // 50-100 ETH active: 2% tax
    // 100+ ETH active: 5% tax
    
    if (activeBidVolume < 10 ether) return 0;
    if (activeBidVolume < 50 ether) return bidAmount / 100;
    if (activeBidVolume < 100 ether) return bidAmount * 2 / 100;
    return bidAmount * 5 / 100;
}
```

**Effect:** Encourages distribution of bids across many users

---

## PART 4: IMPLEMENTATION ROADMAP

### Phase 1: Core V3 (Week 1-2)
- [ ] Dynamic deposit system
- [ ] Basic reputation tracking
- [ ] Penalty distribution (creator + burn)
- [ ] Floor price verification flag

### Phase 2: Advanced Features (Week 3-4)
- [ ] Second-bidder fallback
- [ ] Time-decay penalties
- [ ] Soft close anti-sniping
- [ ] Reputation-based restrictions

### Phase 3: Optimization (Week 5-6)
- [ ] Gas optimization
- [ ] Batch operations
- [ ] Emergency pause mechanism
- [ ] Upgrade path

### Phase 4: Testing (Week 7-8)
- [ ] Unit tests (100% coverage)
- [ ] Integration tests
- [ ] Attack simulations
- [ ] Economic modeling

### Phase 5: Audit & Deploy (Week 9-12)
- [ ] External security audit
- [ ] Bug bounty program
- [ ] Testnet deployment
- [ ] Mainnet deployment

---

## PART 5: ECONOMIC MODELING

### 5.1 Attack Cost Analysis

**Scenario: Price Inflation Attack**

```
V2 (Current):
- Bid: 100 ETH
- Deposit: 10 ETH
- Cost: 10 ETH
- Benefit: If > 10 ETH → Profitable

V3 (Proposed):
- Bid: 100 ETH
- Deposit: 35 ETH (large bid tier)
- Penalty Distribution:
  - Creator: 14 ETH
  - Burn: 10.5 ETH
  - Incentive pool: 7 ETH
  - Platform: 3.5 ETH
- Reputation: -20 points, restricted after 3 defaults
- Cost: 35 ETH + reputation damage
- Benefit: Must be > 35 ETH + future opportunity cost

Result: Attack 3.5x more expensive, reputation damage makes repeat attacks impossible
```

---

### 5.2 Honest Bidder Incentives

**V2:**
```
Win auction → Pay full bid
Lose auction → Get deposit back
Default → Lose 10%
```

**V3:**
```
Win auction → Pay full bid, build reputation
Lose auction → Get deposit back
Be second bidder when winner defaults → Get discount + incentive
Default → Lose 35%, damage reputation, compensate creator
```

**Dominant Strategy:** Bid honestly, complete purchases

---

### 5.3 Creator Protection

**V2:**
```
Winner defaults → Creator gets nothing, wasted 3 days
```

**V3:**
```
Winner defaults → Creator gets:
- 40% of deposit (compensation)
- Option to offer to second bidder
- Verified floor price only if sale completes
```

**Result:** Creators protected from griefing

---

## PART 6: COMPARISON TABLE

| Feature | V1 (Old) | V2 (Current) | V3 (Proposed) |
|---------|----------|--------------|---------------|
| **Deposit** | 100% upfront | 10% fixed | 10-50% dynamic |
| **Penalty** | None | Lose deposit | Multi-tier + burn |
| **Reputation** | None | None | Full system |
| **Second Bidder** | No | No | Yes + incentive |
| **Floor Validity** | N/A | Unverified | Verified flag |
| **Anti-Sniping** | No | No | Soft close |
| **Creator Compensation** | N/A | No | 40% of penalty |
| **Attack Resistance** | Low | Medium | High |
| **Gas Cost** | High | Medium | Medium-High |
| **Complexity** | Low | Medium | High |

---

## PART 7: RISKS & MITIGATIONS

### Risk 1: Complexity
**Issue:** V3 is significantly more complex  
**Mitigation:**
- Modular design
- Extensive testing
- Gradual rollout
- Fallback to V2 if needed

### Risk 2: Gas Costs
**Issue:** More logic = higher gas  
**Mitigation:**
- Optimize storage
- Batch operations
- Off-chain reputation calculation
- Layer 2 deployment option

### Risk 3: User Experience
**Issue:** Dynamic deposits may confuse users  
**Mitigation:**
- Clear UI explanations
- Deposit calculator
- Reputation dashboard
- Educational content

### Risk 4: Gaming Reputation
**Issue:** Users may try to game reputation system  
**Mitigation:**
- Multiple reputation factors
- Time-weighted scoring
- Volume requirements
- Manual review for suspicious activity

---

## PART 8: ALTERNATIVE APPROACHES

### Alternative 1: Commit-Reveal Bidding
**Concept:** Bidders commit hash, reveal later  
**Pros:** Prevents bid sniping  
**Cons:** Complex UX, requires two transactions

### Alternative 2: Vickrey Auction (Second-Price)
**Concept:** Winner pays second-highest bid  
**Pros:** Incentivizes true valuation  
**Cons:** Confusing for users, less revenue

### Alternative 3: Dutch Auction (Descending Price)
**Concept:** Price starts high, decreases over time  
**Pros:** Fast, efficient  
**Cons:** Doesn't fit "floor price discovery" model

### Alternative 4: Bonding Curve
**Concept:** Price increases with each purchase  
**Pros:** Continuous liquidity  
**Cons:** Not suitable for unique NFTs

**Recommendation:** Stick with English auction (ascending) but add V3 improvements

---

## PART 9: LEGAL & COMPLIANCE

### Regulatory Considerations
- **Securities Law:** Ensure NFTs aren't classified as securities
- **AML/KYC:** Consider requirements for high-value transactions
- **Tax Reporting:** Provide transaction records
- **Terms of Service:** Clear rules about bidding and defaults

### Platform Liability
- **Disclaimer:** Platform doesn't guarantee artwork value
- **Dispute Resolution:** Process for handling conflicts
- **Refund Policy:** Clear rules (generally no refunds)

---

## PART 10: CONCLUSION

### Summary of Improvements

**V2 → V3 Upgrades:**
1. ✅ Dynamic deposits (10-50%) based on risk
2. ✅ Reputation system with restrictions
3. ✅ Multi-tier penalties (creator + burn + incentive)
4. ✅ Second-bidder fallback mechanism
5. ✅ Verified vs unverified floor prices
6. ✅ Time-decay penalties
7. ✅ Soft close anti-sniping
8. ✅ Creator compensation for defaults

**Attack Resistance:**
- Price inflation: 3.5x more expensive
- Shill bidding: Reputation system prevents
- Griefing: Creator compensated
- Market manipulation: Verified floors prevent

**Economic Soundness:**
- Honest bidding is dominant strategy
- Creators protected from bad actors
- Market efficiency improved
- Systemic value (burn mechanism)

---

## NEXT STEPS

### Before Implementation:
1. **Team Discussion:** Review this analysis
2. **Economic Modeling:** Run simulations
3. **Legal Review:** Check compliance
4. **Community Feedback:** Gather input

### Implementation Priority:
1. **High Priority:** Dynamic deposits, reputation, penalty distribution
2. **Medium Priority:** Second-bidder fallback, floor verification
3. **Low Priority:** Advanced features (whale protection, etc.)

### Testing Strategy:
1. Unit tests for all functions
2. Attack simulations
3. Gas optimization
4. Testnet deployment (3+ months)
5. Bug bounty program
6. External audit
7. Mainnet deployment

---

## APPENDIX A: SMART CONTRACT OUTLINE

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ArtSoulMarketplaceV3 {
    // Structs
    struct Reputation {
        uint256 totalBids;
        uint256 completedPurchases;
        uint256 defaults;
        uint256 totalVolume;
        uint256 lastDefaultTimestamp;
        bool restricted;
    }
    
    struct FloorPrice {
        uint256 auctionFloor;
        uint256 realFloor;
        bool verified;
        uint256 timestamp;
    }
    
    struct SecondBidderOffer {
        address bidder;
        uint256 price;
        uint256 incentive;
        uint256 deadline;
        bool active;
    }
    
    // State
    mapping(address => Reputation) public reputations;
    mapping(uint256 => FloorPrice) public floorPrices;
    mapping(uint256 => SecondBidderOffer) public secondBidderOffers;
    
    // Constants
    uint256 public constant BASE_DEPOSIT_BPS = 1000; // 10%
    uint256 public constant MAX_DEPOSIT_BPS = 5000;  // 50%
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;
    
    // Functions
    function calculateDeposit(uint256 bidAmount, address bidder, uint256 artworkId) public view returns (uint256);
    function getReputationScore(address user) public view returns (uint256);
    function handleWinnerDefault(uint256 artworkId) internal;
    function offerToSecondBidder(uint256 artworkId) external;
    function purchaseBySecondBidder(uint256 artworkId) external payable;
    
    // ... (rest of implementation)
}
```

---

## APPENDIX B: GAS COST ESTIMATES

| Operation | V2 Gas | V3 Gas | Increase |
|-----------|--------|--------|----------|
| Upload Artwork | 150k | 150k | 0% |
| Create Auction | 100k | 120k | +20% |
| Place Bid | 80k | 110k | +37% |
| End Auction | 200k | 250k | +25% |
| Winner Purchase | 300k | 320k | +7% |
| Second Bidder Purchase | N/A | 350k | New |

**Total Cost Increase:** ~20-25% average  
**Justification:** Security and efficiency gains worth the cost

---

## APPENDIX C: REPUTATION SCORE EXAMPLES

```
User A:
- 10 bids, 10 completed = 100% completion
- 50 ETH volume = +50 bonus
- 0 defaults = 0 penalty
- Score: 100 (capped)

User B:
- 20 bids, 15 completed = 75% completion
- 100 ETH volume = +50 bonus (capped)
- 2 defaults = -40 penalty
- Score: 85

User C:
- 5 bids, 2 completed = 40% completion
- 5 ETH volume = +5 bonus
- 3 defaults = -60 penalty
- Recent default = /2 penalty
- Score: 0 (restricted)
```

---

**END OF ANALYSIS**

**Status:** Ready for team review  
**Next Action:** Schedule discussion meeting  
**Timeline:** 3-4 months to full deployment (if approved)

---

*This document is a living analysis. Update as new attack vectors or improvements are discovered.*
