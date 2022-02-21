const MIRLs = artifacts.require("MIRLs");

module.exports = async function (deployer) {
  const instance = await deployer.deploy(MIRLs);
  console.log("Deployed MIRLs");
};
