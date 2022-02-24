const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const { assert, expect } = require("chai");

const JBA = artifacts.require("../contracts/JBA.sol");

require("chai").use(require("chai-as-promised")).should();

contract("JBA", (accounts) => {
  let contract;
  beforeEach(async function () {
    // Deploy a new Box contract for each test
    contract = await deployProxy(JBA, [accounts[0]]);
  });

  describe("deployment", async () => {
    it("deploys successfully", async () => {
      const address = contract.address;
      assert.notEqual(address, 0x0);
      assert.notEqual(address, "");
      assert.notEqual(address, null);
      assert.notEqual(address, undefined);
    });

    it("has a name", async () => {
      const name = await contract.name();
      assert.equal(name, "JBA");
    });

    it("has a symbol", async () => {
      const symbol = await contract.symbol();
      assert.equal(symbol, "JBA");
    });
  });

  describe("minting", async () => {
    it("creates a new token", async () => {
      const result = await contract.safeMint(accounts[0]);
      const totalSupply = await contract.totalSupply();
      // SUCCESS
      assert.equal(totalSupply, 1);
      const event = result.logs[0].args;
      assert.equal(event.tokenId.toNumber(), 0, "id is correct");
      assert.equal(
        event.from,
        "0x0000000000000000000000000000000000000000",
        "from is correct"
      );
      assert.equal(event.to, accounts[0], "to is correct");
    });
  });
});
