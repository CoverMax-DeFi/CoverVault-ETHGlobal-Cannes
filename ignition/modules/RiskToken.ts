import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const RiskTokenModule = buildModule("RiskTokenModule", (m) => {
  // Deploy mock yield tokens first - no constructor args needed
  const mockAUSDC = m.contract("MockAUSDC");
  const mockCUSDT = m.contract("MockCUSDT");

  // Deploy RiskVault - it will create the RiskToken contracts internally
  const riskVault = m.contract("RiskVault", [
    mockAUSDC,
    mockCUSDT
  ]);

  return { 
    mockAUSDC, 
    mockCUSDT, 
    riskVault 
  };
});

export default RiskTokenModule;