import React, { useState, useEffect } from "react";
import { Box, Button, Typography } from "@mui/material";
import Web3 from "web3";
import Moralis from "moralis";

import JBA from "../abis/JBA.json";
import Minter from "../abis/Minter.json";
import { MoralisConfigs, chainId, networkId } from "../utils/constants";

const { serverUrl, appId } = MoralisConfigs;

Moralis.start({ serverUrl, appId });

const signingMessage = `Welcome to JBA.

Click to sign in and authenticate to the site: https://jba.vercel.app/

This request will not trigger a blockchain transaction or cost any gas fees.

Your authentication status will reset after 24 hours.`;

const ROLES = {
  MINTER: "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6",
};

const Admin = () => {
  const [baseContractAddress, setBaseContractAddress] = useState(null);
  const [minterContractAddress, setMinterContractAddress] = useState(null);
  const [baseContract, setBaseContract] = useState(null);
  const [account, setAccount] = useState();
  const [web3, setWeb3] = useState(null);

  useEffect(() => {
    (async () => {
      await enableWeb3onMoralis();
      if (JBA.networks[networkId]) {
        setBaseContractAddress(JBA.networks[networkId].address);
      }
      if (Minter.networks[networkId]) {
        setMinterContractAddress(Minter.networks[networkId].address);
      }
    })();

    return () => {
      unsubscribeAccountChange();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unsubscribeAccountChange = Moralis.onAccountChanged(async () => {
    console.log("ON ACCOUNT CHANGE");
    await enableWeb3onMoralis();
    setAccount(Moralis.account);
  });

  useEffect(() => {
    if (web3) {
      const _baseContract = new web3.eth.Contract(JBA.abi, baseContractAddress);
      setBaseContract(_baseContract);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [web3]);

  const enableWeb3onMoralis = async () => {
    const isWeb3Active = Moralis.ensureWeb3IsInstalled();
    if (isWeb3Active) {
      console.log("Activated");
    } else {
      await Moralis.enableWeb3();
      const _web3 = new Web3(Moralis.provider);
      setWeb3(_web3);
    }
  };

  const connectWallet = async () => {
    console.log("connectWallet");
    await enableWeb3onMoralis();
    await Moralis.switchNetwork(chainId);

    console.log(`switchNetwork - Moralis.chainId: ${Moralis.chainId}`);

    // auth with moralis
    Moralis.authenticate({ signingMessage: signingMessage }).then(
      async function (user) {
        let userEthAddress = user.get("ethAddress");
        console.log(`user ethAddress: ${userEthAddress}`);
        setAccount(userEthAddress);
      }
    );
  };

  const addRole = async (addr, hashedRole) => {
    const sendOptions = {
      contractAddress: baseContractAddress,
      functionName: "grantRole",
      abi: JBA.abi,
      params: {
        role: hashedRole,
        account: addr,
      },
    };

    const transaction = await Moralis.executeFunction(sendOptions);
    console.log(transaction.hash);
    // Wait until the transaction is confirmed
    await transaction.wait();
    alert("Success");
  };

  return (
    <Box
      height="100vh"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
    >
      <Typography>Admin functions</Typography>
      {account ? (
        <Box display="flex" flexDirection="column" gap={3}>
          <Button
            variant="contained"
            onClick={() => addRole(minterContractAddress, ROLES.MINTER)}
          >
            Grant MINTER_ROLE for Minter contract
          </Button>
        </Box>
      ) : (
        <Button variant="contained" onClick={connectWallet}>
          Connect Wallet
        </Button>
      )}
    </Box>
  );
};

export default Admin;
