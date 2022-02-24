const { deployProxy, upgradeProxy } = require("@openzeppelin/truffle-upgrades");
const { assert, expect } = require("chai");
require("chai").use(require("chai-as-promised")).should();

const JBA = artifacts.require("JBA");
const JBAv2 = artifacts.require("JBAv2");
contract("JBA", (accounts) => {
  let jba;
  let jba2;

  beforeEach(async function () {
    jba = await deployProxy(JBA, [accounts[0]]);
    jba2 = await upgradeProxy(jba.address, JBAv2);
  });

  describe("upgrades", () => {
    it("works with new function", async () => {
      expect(jba.onlyV2Function).to.be.a("undefined");
      jba2.onlyV2Function.should.be.a("function");
      const result2 = await jba2.onlyV2Function();
      assert.equal(result2.toString(), "It's v2");
    });
  });
});
