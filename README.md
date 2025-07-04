# CoverVault 🛡️

*A decentralized insurance protocol powered by tradeable risk tokens*

## Overview

CoverVault is a revolutionary insurance protocol that transforms traditional insurance through **tradeable risk tokens** and **yield-bearing collateral**. Users deposit yield-bearing assets (like aUSDC or cUSDT) and receive dual-tier risk tokens that can be traded on Uniswap. The more risk tokens sold in the market, the more insurance coverage is provided to the community.

## 🧠 How It Works

### The Insurance Mechanism

1. **Deposit Phase** (2 days): Users deposit yield-bearing assets (aUSDC, cUSDT) into insurance pools
2. **Token Issuance**: For each deposit, users receive equal amounts of:
   - **Senior Risk Tokens** (CV-SENIOR) - Lower risk, priority claims
   - **Junior Risk Tokens** (CV-JUNIOR) - Higher risk, subordinate claims
3. **Trading Phase**: Risk tokens can be traded on Uniswap like any ERC20 token
4. **Coverage Phase** (5 days): Active insurance period where claims can be submitted
5. **Redemption Phase**: Token holders can redeem remaining tokens for underlying assets

### The Risk-Insurance Relationship

The core innovation is that **selling risk tokens = providing insurance coverage**:

- When you **hold** risk tokens: You bear the risk of insurance claims
- When you **sell** risk tokens: You transfer that risk to the buyer
- When you **buy** risk tokens: You're taking on insurance risk for potential yield

### Example Scenarios

#### Basic Insurance Flow
```
1. Alice deposits 1000 aUSDC → receives 500 CV-SENIOR + 500 CV-JUNIOR tokens
2. Bob deposits 1000 aUSDC → receives 500 CV-SENIOR + 500 CV-JUNIOR tokens
3. Bob sells 200 CV-SENIOR tokens to Charlie on Uniswap for USDC
4. Pool: 2000 aUSDC | Outstanding tokens: 1800 total (800 CV-SENIOR + 1000 CV-JUNIOR)
5. If insurance claims occur, remaining assets are shared proportionally among token holders
```

#### Risk Tier Trading (Advanced Strategy)
```
1. Bob holds 500 CV-SENIOR + 500 CV-JUNIOR tokens (from 1000 aUSDC deposit)
2. Bob wants more downside protection, so he trades on CV-SENIOR/CV-JUNIOR pool:
   - Sells 200 CV-JUNIOR tokens → receives 190 CV-SENIOR tokens (5% discount)
3. Bob now holds 690 CV-SENIOR + 300 CV-JUNIOR tokens (990 total)
4. Result: Bob forfeited 10 tokens of potential upside for senior claim priority
5. If claims happen: Bob's 690 senior tokens get paid before any junior tokens
```

## 🏗️ Protocol Architecture

### Core Contracts

- **[`RiskVault.sol`](contracts/RiskVault.sol)**: Main protocol contract managing deposits, claims, and tokenization
- **[`RiskToken.sol`](contracts/RiskToken.sol)**: ERC20 implementation for risk tokens with mint/burn functionality
- **[`IRiskToken.sol`](contracts/IRiskToken.sol)**: Interface for risk token operations

### Supported Assets

- **aUSDC**: Aave interest-bearing USDC
- **cUSDT**: Compound interest-bearing USDT
- *Extensible to other yield-bearing assets*

### Risk Token Tiers

| Token Type | Risk Level | Claim Priority | Use Case |
|------------|------------|----------------|----------|
| CV-SENIOR  | Lower      | First claims   | Conservative insurance providers |
| CV-JUNIOR  | Higher     | Subordinate    | Risk-seeking yield farmers |

## 🔄 Protocol Lifecycle

### Phase 1: Deposit Period (2 days)
- Users deposit yield-bearing assets
- Dual-tier risk tokens are minted 1:1 with deposits
- Tokens can be traded immediately on Uniswap

### Phase 2: Coverage Period (5 days)
- Active insurance coverage for deposited assets
- Claims can be submitted and processed
- Risk tokens continue trading on secondary markets

### Phase 3: Senior Claims (1 day)
- Priority redemption period for senior token holders
- Senior tokens have first claim on remaining assets

### Phase 4: Final Claims (1 day)
- All remaining tokens can be redeemed
- Protocol cycle completes and can restart

## 💰 Economic Model

### For Insurance Providers
- **Deposit** yield-bearing assets to earn insurance premiums
- **Hold tokens** to bear risk and earn yield from claims that don't materialize
- **Sell tokens** to reduce risk exposure and lock in profits

### For Risk Traders
- **Buy risk tokens** on Uniswap to speculate on insurance outcomes
- **Sell risk tokens** to exit positions or reduce exposure
- **Arbitrage** between risk levels and market pricing

### For Insurance Seekers
- **Submit claims** backed by evidence when covered events occur
- **Receive payouts** from the insurance pool when claims are approved
- **Benefit** from community-funded insurance coverage

## 🦄 Uniswap Integration

### Why Uniswap?
Risk tokens are standard ERC20 tokens that can be traded on any DEX. Uniswap provides:
- **Liquidity**: Deep markets for risk token trading
- **Price Discovery**: Market-driven risk pricing
- **Accessibility**: Anyone can buy/sell insurance risk
- **Composability**: Risk tokens can be used in other DeFi protocols

### Trading Strategy Examples

#### 1. Risk Tier Arbitrage (CV-SENIOR ↔ CV-JUNIOR Pool)
```solidity
// Strategy: Trade down risk by converting junior to senior tokens
// Bob wants more downside protection, less upside exposure
uniswapRouter.swapExactTokensForTokens(
    200 * 1e18, // Sell 200 CV-JUNIOR tokens
    190 * 1e18, // Expect ~190 CV-SENIOR tokens (forfeit some upside)
    [juniorToken, seniorToken],
    msg.sender,
    deadline
);

// Result: Bob now has more senior tokens (priority claims)
// but less junior tokens (subordinate claims)
```

#### 2. Complete Risk Exit (Risk Token → Stablecoin)
```solidity
// Strategy: Exit insurance position entirely
// Sell risk tokens for stablecoins to eliminate exposure
uniswapRouter.swapExactTokensForTokens(
    250 * 1e18, // Sell 250 CV-SENIOR tokens
    minAmountOut,
    [seniorToken, USDC],
    msg.sender,
    deadline
);
```

#### 3. Risk Speculation (Stablecoin → Risk Token)
```solidity
// Strategy: Buy underpriced risk for potential yield
// Charlie thinks insurance claims are unlikely
uniswapRouter.swapExactTokensForTokens(
    1000 * 1e6, // Spend 1000 USDC
    minTokensOut,
    [USDC, juniorToken],
    msg.sender,
    deadline
);
```

## 🔧 Technical Implementation

### Smart Contract Features

- **Reentrancy Protection**: All external functions protected against reentrancy attacks
- **Phase-Based Logic**: Automated lifecycle management with time-based phases
- **Proportional Redemption**: Fair distribution of assets based on token holdings
- **Emergency Pause**: Owner can pause protocol in emergencies
- **Claim Processing**: Structured insurance claim submission and approval system

### Security Considerations

- **Audited OpenZeppelin contracts** for standard functionality
- **Custom errors** for gas-efficient error handling
- **Precision math** using 27-decimal precision for accurate calculations
- **Access controls** with owner-only administrative functions

## 📊 Key Metrics

### Protocol Health
- **Total Value Locked (TVL)**: Combined value of all deposited assets
- **Insurance Coverage Ratio**: Amount of active insurance coverage
- **Token Distribution**: Spread of risk across token holders
- **Claim Success Rate**: Percentage of approved vs submitted claims

### Market Dynamics
- **Risk Token Price**: Market valuation of insurance risk
- **Liquidity Depth**: Available trading volume on Uniswap
- **Volatility**: Price stability of risk tokens
- **Arbitrage Opportunities**: Price differences between risk tiers

## 🚀 Getting Started

### For Developers

```bash
# Clone the repository
git clone https://github.com/zalatar242/CoverVault.git
cd CoverVault

# Install dependencies
npm install

# Compile contracts
npm run compile

# Run tests
npm run test

# Deploy to local network
npm run deploy:localhost

# Deploy to Flow testnet
npm run deploy:flow-testnet
```

### For Users

1. **Deposit Assets**: Call `depositAsset(asset, amount)` with your yield-bearing tokens
2. **Receive Risk Tokens**: Get equal amounts of senior and junior tokens
3. **Trade on Uniswap**: Buy/sell risk tokens to manage your exposure
4. **Submit Claims**: Use `submitInsuranceClaim(asset, amount, evidence)` if needed
5. **Redeem Tokens**: Call `redeemAllTokens()` to exit your position

## 📈 Use Cases

### 1. DeFi Risk Management
- **Protect** yield farming positions against smart contract risks
- **Hedge** lending positions against liquidation events
- **Insure** staking rewards against slashing conditions

### 2. Institutional Insurance
- **Corporate** treasury protection for crypto holdings
- **Protocol** insurance for DAOs and DeFi projects
- **Custodial** services for institutional crypto exposure

### 3. Speculation and Trading
- **Trade** insurance risk like any other asset class
- **Arbitrage** between different risk levels and time periods
- **Provide liquidity** to insurance markets for yield

## 🔮 Future Enhancements

- **Multi-Asset Support**: Expand to more yield-bearing assets
- **Dynamic Pricing**: Implement automated risk pricing mechanisms
- **Cross-Chain**: Deploy on multiple blockchains for broader access
- **Governance**: Introduce community governance for protocol parameters
- **Advanced Claims**: Implement automated claim processing with oracles

## 📄 Contract Addresses

### Flow Testnet
- **RiskVault**: `[To be deployed]`
- **CV-SENIOR Token**: `[Auto-deployed by RiskVault]`
- **CV-JUNIOR Token**: `[Auto-deployed by RiskVault]`

### Mainnet
- **RiskVault**: `[To be deployed]`
- **CV-SENIOR Token**: `[Auto-deployed by RiskVault]`
- **CV-JUNIOR Token**: `[Auto-deployed by RiskVault]`

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines and join our community:

- **GitHub**: [Issues and PRs](https://github.com/zalatar242/CoverVault/issues)
- **Discord**: [Community chat](https://discord.gg/covervault)
- **Twitter**: [@CoverVault](https://twitter.com/covervault)

## 📜 License

MIT License - see [LICENSE](LICENSE) for details.

---

*CoverVault: Where insurance meets DeFi innovation* 🚀
