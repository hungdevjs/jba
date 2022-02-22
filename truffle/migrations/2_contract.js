const JBA = artifacts.require("JBA");

module.exports = async function (deployer, network, accounts) {
  const instance = await deployer.deploy(JBA, { from: accounts[0] });
  console.log("Deployed JBA");
};
