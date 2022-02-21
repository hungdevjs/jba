const Minter = artifacts.require("Minter");
const MIRLs = artifacts.require("MIRLs");

module.exports = async function (deployer, network, accounts) {
  console.log({ network, accounts });
  const MIRLsInstance = await MIRLs.deployed();
  console.log("MIRLs Deployed Address", MIRLsInstance.address);

  const instance = await deployer.deploy(Minter, MIRLsInstance.address);
  console.log("Deployed Minter", instance.address);
};
