# CoverVault Hackathon Plan
*Risk Token Trading Platform - Simplified for Hackathon*

## 🎯 Core Concept
**"Turn Insurance Risk Into Tradeable Tokens"**
- User deposits assets → Gets risk tokens → Trades them
- Feels like Robinhood for risk, not traditional insurance

---

## 📱 Simplified App Structure

### Pages (Priority Order)
```
🏠 Homepage (/) - Landing & value prop ✅ DONE
📊 Dashboard (/dashboard) - Main trading hub 🎯 FOCUS  
🔄 Trade (/trade) - Focused trading interface 🎯 FOCUS
⚙️ Admin (/admin) - Protocol management ✅ EXISTS
```

**Skip for Hackathon**: Demo page, Markets, Portfolio, Charts, Analytics

---

## 🎯 Core User Actions (Updated Terminology)

### Primary Actions:
1. **"Issue Risk Tokens"** (deposit assets → get CM-SENIOR + CM-JUNIOR)
2. **"Redeem For Assets"** (burn tokens → get back aUSDC/cUSDT)  
3. **"Rebalance Risk"** (swap between SENIOR ↔ JUNIOR on Uniswap)
4. **"Add Liquidity"** (provide liquidity to earn fees)

---

## 📊 Dashboard Page - "Risk Trading Hub"

**Purpose**: One-stop trading command center

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│ 📊 Risk Trading Dashboard              Phase: Coverage  │
└─────────────────────────────────────────────────────────┘

┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐
│PORTFOLIO    │ │SENIOR PRICE │ │JUNIOR PRICE │ │TODAY    │
│$10,247      │ │$0.98        │ │$1.05        │ │+$127    │
│+$127 (1.2%) │ │             │ │             │ │+1.2%    │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────┘

┌─────────────────────────────────────────────────────────┐
│                   QUICK TRADE                           │
│                                                         │
│ I want to:                                              │
│ ○ Get more safety (buy SENIOR)                         │
│ ● Increase upside (buy JUNIOR)                         │
│ ○ Exit position (redeem for assets)                    │
│                                                         │
│ Amount: $[____]    [Execute Trade]                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                 OTHER ACTIONS                           │
│                                                         │
│ [Issue Risk Tokens] [Redeem Assets] [Add Liquidity]    │
│ [Emergency Mode]    [Phase Info]    [Advanced Trade]   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────┐ ┌─────────────────────────────────┐
│  YOUR POSITIONS     │ │       PROTOCOL STATUS           │
│                     │ │                                 │
│ 🛡️ SENIOR: 500     │ │ Current Phase: COVERAGE         │
│ Value: $490         │ │ Time Remaining: 1d 14h 23m      │
│                     │ │                                 │
│ 🚀 JUNIOR: 300     │ │ Emergency Mode: ❌ Inactive     │
│ Value: $315         │ │                                 │
│                     │ │ Total TVL: $2.4M                │
│ 💧 LP TOKENS: 50   │ │ Your Share: 0.4%                │
│ Value: $200         │ │                                 │
└─────────────────────┘ └─────────────────────────────────┘
```

**Key Features**:
- Portfolio summary (no complex charts)
- Live token values (simple display)
- Big action buttons for main functions
- Protocol phase status
- Current positions breakdown

---

## 🔄 Trade Page - "Risk Token Exchange"

**Purpose**: Focused interface for all trading actions

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│ 🔄 Trade Risk Tokens                                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    ISSUE RISK TOKENS                    │
│                                                         │
│ Asset: [aUSDC ▼]     Amount: [____] USDC               │
│                                                         │
│ You'll receive:                                         │
│ • 500 CM-SENIOR tokens (priority claims)               │
│ • 500 CM-JUNIOR tokens (higher upside)                 │
│                                                         │
│               [Issue Risk Tokens]                       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   REDEEM FOR ASSETS                     │
│                                                         │
│ SENIOR: [____] tokens    JUNIOR: [____] tokens         │
│                                                         │
│ You'll receive:                                         │
│ • ~250 aUSDC + ~250 cUSDT (proportional split)         │
│                                                         │
│               [Redeem For Assets]                       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   REBALANCE RISK                        │
│                                                         │
│ From: [SENIOR ▼]     To: [JUNIOR ▼]                    │
│ Amount: [____] tokens                                   │
│                                                         │
│ Exchange rate: 1 SENIOR = 0.93 JUNIOR                  │
│ (Trade happens on Uniswap)                             │
│                                                         │
│               [Rebalance Risk]                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   ADD LIQUIDITY                         │
│                                                         │
│ Provide liquidity to earn trading fees                 │
│                                                         │
│ SENIOR: [____] tokens    JUNIOR: [____] tokens         │
│                                                         │
│ Est. LP tokens: ~100     Est. APR: 8.5%               │
│                                                         │
│               [Add Liquidity]                           │
└─────────────────────────────────────────────────────────┘
```

**Key Features**:
- Clear sections for each action type
- Simple input forms
- Immediate feedback on outcomes
- Direct integration with contracts
- No complex trading features (keep it simple)

---

## 🎨 Design Principles (Hackathon)

### **Keep It Simple**
- ✅ Clear action buttons
- ✅ Immediate value display  
- ✅ Simple form inputs
- ❌ No complex charts
- ❌ No advanced analytics
- ❌ No fancy animations

### **Focus on Core Value**
- ✅ Risk tokenization concept clear
- ✅ Trading terminology (not insurance)
- ✅ Professional trading feel
- ✅ Works with real contracts

### **Color System**
```
🛡️ SENIOR: Blue (#3B82F6) - Safety
🚀 JUNIOR: Amber (#F59E0B) - Risk  
💧 LIQUIDITY: Purple (#8B5CF6) - Yield
✅ SUCCESS: Green (#10B981)
❌ ERROR: Red (#EF4444)
```

---

## 🚀 Implementation Tasks

### **Dashboard Page** 🎯
- [ ] Portfolio summary cards
- [ ] **Quick Trade widget** ("I want more safety/upside/exit")
- [ ] Secondary action buttons (Issue/Redeem/Liquidity/Emergency)
- [ ] Position breakdown (SENIOR/JUNIOR/LP)
- [ ] Protocol phase display
- [ ] Connect to Web3 context

### **Trade Page** 🎯  
- [ ] **Quick Trade section** (intent-based trading)
- [ ] Advanced Trade section (precise amounts)
- [ ] Issue Risk Tokens form
- [ ] Redeem For Assets form
- [ ] Add Liquidity form
- [ ] Connect to contract functions

### **UI Polish**
- [ ] Consistent button styles
- [ ] Clear error messages
- [ ] Loading states
- [ ] Mobile responsive

---

## ✅ Success Criteria

**Demo Goals**:
1. ✅ Visitor understands "risk tokenization" in 30 seconds
2. ✅ Can issue tokens → see in portfolio → trade them
3. ✅ Feels like trading app, not insurance
4. ✅ Works with deployed contracts on testnet

**Hackathon Judges Should See**:
- 🎯 Clear innovation (risk → tradeable tokens)
- 🎯 Functional prototype with real contracts
- 🎯 Professional UI that demos the concept
- 🎯 Trading-focused UX (not traditional DeFi)

---

This plan focuses on **core functionality** with **clean execution** - perfect for demonstrating the risk tokenization concept in a hackathon! 🚀