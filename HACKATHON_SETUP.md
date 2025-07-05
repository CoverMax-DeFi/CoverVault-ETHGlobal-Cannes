# 🚀 CoverVault Cross-Chain Hackathon Setup

## Quick Start: Cross-Chain Risk Tokens in 30 Minutes

This guide will get you from zero to working cross-chain risk tokens on Arbitrum Sepolia and Base Sepolia.

## 📋 Prerequisites

1. **Node.js** (v18+)
2. **Private key** with testnet ETH on both networks
3. **Basic Solidity knowledge**

## 🔧 Setup (5 minutes)

### 1. Install Dependencies

```bash
# Install LayerZero dependencies
npm install

# If you get errors, try:
npm install --force
```

### 2. Environment Setup

Create a `.env` file:

```bash
cp .env.example .env
```

Add your private key to `.env`:
```
PRIVATE_KEY=0x...your_private_key_here
```

### 3. Get Testnet ETH

- **Arbitrum Sepolia**: https://faucet.quicknode.com/arbitrum/sepolia
- **Base Sepolia**: https://faucet.quicknode.com/base/sepolia

You need ~0.01 ETH on each network for deployment.

## 🚀 Deployment (10 minutes)

### 1. Deploy to Arbitrum Sepolia

```bash
npx hardhat run scripts/deploy-cross-chain.ts --network arbitrumSepolia
```

Expected output:
```
🚀 Deploying Cross-Chain Risk Tokens for Hackathon...
Deploying on arbitrumSepolia (Chain ID: 421614)
Deployer address: 0x...
Deployer balance: 0.05 ETH

📝 Deploying Senior Token...
✅ Senior Token deployed to: 0x1234...

📝 Deploying Junior Token...
✅ Junior Token deployed to: 0x5678...

🎉 Deployment Summary:
==================================================
Network: arbitrumSepolia (421614)
Senior Token: 0x1234...
Junior Token: 0x5678...
LayerZero Endpoint: 0x6EDCE65403992e310A62460808c4b910D972f10f
==================================================
```

**📝 Save these addresses!** You'll need them for the next step.

### 2. Deploy to Base Sepolia

```bash
npx hardhat run scripts/deploy-cross-chain.ts --network baseSepolia
```

Save these addresses too!

## 🔗 Wire Contracts (10 minutes)

### Option A: Manual Wiring (Recommended for Hackathon)

Since LayerZero CLI can be complex, let's use a simple manual approach:

1. **Set Trusted Remotes** on each contract:

```bash
# On Arbitrum Sepolia - set Base Sepolia as trusted remote
npx hardhat console --network arbitrumSepolia
```

In the console:
```javascript
const seniorToken = await ethers.getContractAt("SimpleOFTRiskToken", "0x...ARB_SENIOR_ADDRESS");
const BASE_EID = 40245; // Base Sepolia endpoint ID
const baseAddress = "0x...BASE_SENIOR_ADDRESS";

// Set trusted remote (you'll need to call this as owner)
await seniorToken.setPeer(BASE_EID, ethers.zeroPadValue(baseAddress, 32));
```

Repeat for Base Sepolia → Arbitrum Sepolia and for Junior tokens.

### Option B: LayerZero CLI (If Available)

```bash
# First install create-lz-oapp
npm install -g @layerzerolabs/create-lz-oapp

# Wire the contracts (this may require additional setup)
npx hardhat lz:oapp:wire --oapp-config layerzero.config.ts
```

## 🧪 Test Cross-Chain Transfer (5 minutes)

### 1. Update Test Script

Edit `scripts/test-cross-chain.ts` and add your deployed addresses:

```typescript
const SENIOR_TOKEN_ADDRESS = "0x..."; // Your Arbitrum Sepolia address
const JUNIOR_TOKEN_ADDRESS = "0x..."; // Your Arbitrum Sepolia address
```

### 2. Run Basic Tests

```bash
npx hardhat run scripts/test-cross-chain.ts --network arbitrumSepolia
```

### 3. Test Cross-Chain Transfer

```bash
# In Hardhat console on Arbitrum Sepolia
npx hardhat console --network arbitrumSepolia
```

```javascript
const [deployer] = await ethers.getSigners();
const seniorToken = await ethers.getContractAt("SimpleOFTRiskToken", "0x...ARB_ADDRESS");

// Mint some tokens first
await seniorToken.vaultMint(deployer.address, ethers.parseEther("100"));

// Prepare cross-chain transfer
const sendParam = {
  dstEid: 40245, // Base Sepolia
  to: ethers.zeroPadValue(deployer.address, 32),
  amountLD: ethers.parseEther("10"),
  minAmountLD: ethers.parseEther("9.9"),
  extraOptions: "0x",
  composeMsg: "0x",
  oftCmd: "0x"
};

// Quote the fee
const [nativeFee] = await seniorToken.quoteSend(sendParam, false);
console.log(`Fee: ${ethers.formatEther(nativeFee)} ETH`);

// Send the tokens!
const tx = await seniorToken.send(sendParam, [nativeFee, 0], deployer.address, {
  value: nativeFee
});

console.log(`Transfer sent: ${tx.hash}`);
```

### 4. Verify on Destination

```bash
# Check Base Sepolia
npx hardhat console --network baseSepolia
```

```javascript
const seniorToken = await ethers.getContractAt("SimpleOFTRiskToken", "0x...BASE_ADDRESS");
const [deployer] = await ethers.getSigners();
const balance = await seniorToken.balanceOf(deployer.address);
console.log(`Balance on Base: ${ethers.formatEther(balance)} CV-SENIOR`);
```

## 🎯 Demo Script

### The 2-Minute Demo

1. **Show Starting State**:
   - Arbitrum: 100 CV-SENIOR tokens
   - Base: 0 CV-SENIOR tokens

2. **Execute Transfer**:
   - Transfer 10 CV-SENIOR from Arbitrum to Base
   - Show LayerZero transaction

3. **Show End State**:
   - Arbitrum: 90 CV-SENIOR tokens
   - Base: 10 CV-SENIOR tokens

4. **The Magic**: "Same token, works on any chain!"

## 🐛 Troubleshooting

### Common Issues

1. **"Invalid import" errors**:
   ```bash
   npm install --force
   npx hardhat compile
   ```

2. **"Insufficient funds"**:
   - Get more testnet ETH from faucets
   - Check you're using the right network

3. **"Trusted remote not set"**:
   - Make sure you called `setPeer` on both chains
   - Use correct endpoint IDs

4. **"LayerZero fee too high"**:
   - This is normal (~$0.50-2.00 on testnets)
   - Make sure you have enough ETH for gas + fee

### Network Information

| Network | Chain ID | LayerZero EID | RPC |
|---------|----------|---------------|-----|
| Arbitrum Sepolia | 421614 | 40231 | https://sepolia-rollup.arbitrum.io/rpc |
| Base Sepolia | 84532 | 40245 | https://sepolia.base.org |

### Useful Commands

```bash
# Check balances
npx hardhat run scripts/test-cross-chain.ts --network arbitrumSepolia
npx hardhat run scripts/test-cross-chain.ts --network baseSepolia

# Verify contracts (optional)
npx hardhat verify --network arbitrumSepolia 0x... "CoverVault Senior Token" "CV-SENIOR" 0x6EDCE65403992e310A62460808c4b910D972f10f 0x... 0x...

# Clean and recompile
npx hardhat clean
npx hardhat compile
```

## 🎉 Success Criteria

By the end, you should have:

- ✅ **Cross-chain tokens deployed** on 2 networks
- ✅ **Working transfers** between chains
- ✅ **Demo-ready** functionality
- ✅ **Under 30 minutes** total setup time

## 🚀 Next Level Features

If you finish early, add these:

1. **Frontend integration** with MetaMask switching
2. **Real-time balance updates** across chains
3. **Transfer history** with LayerZero Scan links
4. **Gas estimation** and fee display
5. **Batch transfers** for multiple tokens

## 🎯 Judging Points

- **Innovation**: Cross-chain native risk tokens
- **Technical**: Real LayerZero implementation
- **Demo**: Clean, working cross-chain transfers
- **Practical**: Solves real DeFi UX problems

## 📱 Presentation Tips

- **Hook**: "Risk tokens that work everywhere"
- **Problem**: "DeFi is fragmented across chains"
- **Solution**: "Native cross-chain tokens via LayerZero"
- **Demo**: Live cross-chain transfer
- **Impact**: "One token, any chain, zero friction"

Good luck! 🍀

---

**Questions?** Check the [detailed docs](docs/LAYERZERO_CROSS_CHAIN_IMPLEMENTATION.md) or the [contract implementations](docs/CONTRACT_IMPLEMENTATIONS.md).