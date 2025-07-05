// test/RiskVault.test.ts

const { expect } = require("chai");
const { ethers } = require("hardhat");
const { ZeroAddress } = require("ethers");

describe("RiskVault", function () {
  let vault;
  let ausdc;
  let cusdt;
  let owner, user;

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();

    // Deploy mocks
    const MockAUSDCFactory = await ethers.getContractFactory("MockAUSDC");
    ausdc = await MockAUSDCFactory.deploy();

    const MockCUSDTFactory = await ethers.getContractFactory("MockCUSDT");
    cusdt = await MockCUSDTFactory.deploy();

    // Deploy vault
    const VaultFactory = await ethers.getContractFactory("RiskVault");
    vault = await VaultFactory.deploy(await ausdc.getAddress(), await cusdt.getAddress());

    // Mint tokens to user
    await ausdc.mint(user.address, 1000);
    await cusdt.mint(user.address, 1000);
  });

  it("should deploy with correct asset addresses", async () => {
    expect(await vault.aUSDC()).to.equal(await ausdc.getAddress());
    expect(await vault.cUSDT()).to.equal(await cusdt.getAddress());
  });

  it("should allow deposit and issue tokens", async () => {
    await ausdc.connect(user).approve(await vault.getAddress(), 100);
    await expect(vault.connect(user).depositAsset(await ausdc.getAddress(), 100))
      .to.emit(vault, "AssetDeposited")
      .withArgs(user.address, await ausdc.getAddress(), 100, 100);

    const [senior, junior] = await vault.getUserTokenBalances(user.address);
    expect(senior).to.equal(50);
    expect(junior).to.equal(50);
  });

  it("should revert if deposit is below minimum", async () => {
    await ausdc.connect(user).approve(await vault.getAddress(), 5);
    await expect(
      vault.connect(user).depositAsset(await ausdc.getAddress(), 5)
    ).to.be.reverted;
  });

  it("should revert if deposit is uneven", async () => {
    await ausdc.connect(user).approve(await vault.getAddress(), 11);
    await expect(
      vault.connect(user).depositAsset(await ausdc.getAddress(), 11)
    ).to.be.reverted;
  });

  it("should revert if asset is unsupported", async () => {
    const [random] = await ethers.getSigners();
    await expect(
      vault.connect(user).depositAsset(random.address, 100)
    ).to.be.reverted;
  });

  it("should allow withdrawal after deposit", async () => {
    await ausdc.connect(user).approve(await vault.getAddress(), 100);
    await vault.connect(user).depositAsset(await ausdc.getAddress(), 100);

    const [senior, junior] = await vault.getUserTokenBalances(user.address);

    await expect(
      vault.connect(user).withdraw(senior, junior, ZeroAddress)
    ).to.emit(vault, "TokensWithdrawn");

    const [seniorAfter, juniorAfter] = await vault.getUserTokenBalances(user.address);
    expect(seniorAfter).to.equal(0);
    expect(juniorAfter).to.equal(0);
  });

  it("should revert withdrawal with zero tokens", async () => {
    await expect(
      vault.connect(user).withdraw(0, 0, ZeroAddress)
    ).to.be.reverted;
  });
});