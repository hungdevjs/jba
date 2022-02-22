const Minter = artifacts.require("Minter");
const JBA = artifacts.require("JBA");

module.exports = async function (deployer, network, accounts) {
  console.log({ network, accounts });
  const JBAInstance = await JBA.deployed();
  console.log("JBA Deployed Address", JBAInstance.address);

  const instance = await deployer.deploy(Minter, JBAInstance.address);
  console.log("Deployed Minter", instance.address);
};
