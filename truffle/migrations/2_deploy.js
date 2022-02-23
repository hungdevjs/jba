const { deployProxy } = require("@openzeppelin/truffle-upgrades");
const JBA = artifacts.require("JBA");
const Minter = artifacts.require("Minter");

module.exports = async function (deployer, network, accounts) {
  if (!process.env.DEPLOYED_ADDRESS) {
    console.log("Deploying base contract");
    const contract = await deployProxy(JBA, [accounts[0]], {
      deployer,
      initializer: "initialize",
    });
    console.log("Deployed", contract.address);

    console.log("Deploying minter contract");
    const minter = await deployer.deploy(Minter, contract.address);
    console.log("Deployed Minter", minter.address);
  }
};
