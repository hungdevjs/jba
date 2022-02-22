const JBA = artifacts.require("JBA");

module.exports = async function (deployer) {
  const instance = await deployer.deploy(JBA);
  console.log("Deployed JBA");
};
