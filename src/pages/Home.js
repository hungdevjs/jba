import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  Typography,
  TextField,
  Stack,
} from "@mui/material";
import Web3 from "web3";
import Moralis from "moralis";

import JBA from "../abis/JBA.json";
import Minter from "../abis/Minter.json";
import { MoralisConfigs, ChainIds, NetworkIds } from "../utils/constants";

const { serverUrl, appId } = MoralisConfigs;

Moralis.start({ serverUrl, appId });

const TOTAL_MINT_AMT = 888;
const FREE_MINT_AMT = 444;
const MINT_PRICE = 0.0;

const chainId = ChainIds.ganache; // Ganache
// const chainId = ChainIds.rinkeby; // Rinkeby
// const chainId = ChainIds.mainnet; // Mainnet

const networkId = NetworkIds.ganache; // Ganache
// const networkId = NetworkIds.rinkeby; // Rinkeby
// const networkId = NetworkIds.mainnet; // Mainnet

const signingMessage = `Welcome to JBA.

Click to sign in and authenticate to the site: https://random.com/

This request will not trigger a blockchain transaction or cost any gas fees.

Your authentication status will reset after 24 hours.`;

const Home = () => {
  const [mintAmount, setMintAmount] = useState(1);
  const [isMinting, setIsMinting] = useState(false);
  const [baseContractAddress, setBaseContractAddress] = useState(null);
  const [minterContractAddress, setMinterContractAddress] = useState(null);
  const [baseContract, setBaseContract] = useState(null);
  const [account, setAccount] = useState();
  const [balance, setBalance] = useState(0);
  const [totalySupply, setTotalySupply] = useState(0);
  const [web3, setWeb3] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

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

  const getTotalMintedToken = async () => {
    console.log(baseContract);
    if (!baseContract) return;

    const totalSupplyResult = await Moralis.executeFunction({
      contractAddress: baseContractAddress,
      functionName: "totalSupply",
      abi: JBA.abi,
    });
    console.log("totalSupply: ", totalSupplyResult.toString());
    setTotalySupply(totalSupplyResult.toNumber());
  };

  useEffect(() => {
    getTotalMintedToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseContract]);

  const getBalance = async () => {
    if (account) {
      const balanceOfResult = await Moralis.executeFunction({
        contractAddress: baseContractAddress,
        functionName: "balanceOf",
        abi: JBA.abi,
        params: {
          owner: account,
        },
      });
      console.log("balanceOf: ", balanceOfResult.toString());
      setBalance(balanceOfResult.toNumber());
    }
  };

  useEffect(() => {
    getBalance();
  }, [account]);

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

  const mintOnePaid = async () => {
    const ethValue = Moralis.Units.ETH(MINT_PRICE);

    const transaction = await Moralis.executeFunction({
      contractAddress: minterContractAddress,
      functionName: "mint",
      abi: Minter.abi,
      msgValue: ethValue,
      params: {
        to: account,
      },
    });
    console.log("transaction.hash", transaction.hash);
    // Wait until the transaction is confirmed
    await transaction.wait();
  };

  const mintBatchPaid = async () => {
    console.log("mintBatchPaid");
    const batchSize = parseInt(mintAmount, 10);
    const ethValue = Moralis.Units.ETH(MINT_PRICE * batchSize);

    const transaction = await Moralis.executeFunction({
      contractAddress: minterContractAddress,
      functionName: "batchMint",
      abi: Minter.abi,
      msgValue: ethValue,
      params: {
        to: account,
        batchMintAmt: batchSize,
      },
    });
    console.log("transaction.hash", transaction.hash);
    // Wait until the transaction is confirmed
    await transaction.wait();
  };

  const minting = async () => {
    console.log("MINTING");
    setIsMinting(true);

    try {
      if (parseInt(mintAmount, 10) > 1) {
        // batch paid minting
        await mintBatchPaid();
      } else {
        // single paid minting
        await mintOnePaid();
      }

      // Get total minted tokens
      await getTotalMintedToken();

      // Get Balance of tokens
      await getBalance();
    } catch (error) {
      console.log("minting error", { error }, error.message);

      if (error?.error?.message) {
        setErrorMessage(error.error.message);
      } else {
        setErrorMessage(error.message);
      }

      setIsMinting(false);
    }

    setIsMinting(false);
  };

  const onChangeAmount = (event) => {
    const amount = +event.target.value.replace(/\D/, ""); // only positive numbers
    if (amount <= 2) setMintAmount(amount);
  };

  const onDecrease = () => {
    if (mintAmount > 1) setMintAmount(mintAmount - 1);
  };

  const onIncrease = () => {
    let maxSpinner = 2;

    if (TOTAL_MINT_AMT - totalySupply < 2) {
      maxSpinner = TOTAL_MINT_AMT - totalySupply;
    }

    if (mintAmount < maxSpinner) setMintAmount(mintAmount + 1);
  };

  if (isMinting)
    return (
      <Box
        height="100vh"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
      >
        Minting...
      </Box>
    );

  return (
    <>
      <Dialog open={!!errorMessage} onClose={() => setErrorMessage(null)}>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {errorMessage}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setErrorMessage(null)} autoFocus>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Box
        height="100vh"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
      >
        <Box mb={2}>
          <Typography variant="h6">Let's get some JBA!</Typography>
        </Box>
        {account ? (
          <>
            <Stack mb={2} spacing={2}>
              <Typography align="center">Your account: {account}</Typography>
              <Typography align="center">
                Total minted JBAs: {totalySupply}
              </Typography>
              <Typography align="center">
                Your JBAs balance: {balance}
              </Typography>
              <Typography align="center">
                Minting JBA will give you good luck!
              </Typography>
            </Stack>

            <Box display="flex" gap={2} mb={2}>
              <Button variant="outlined" onClick={onDecrease}>
                -
              </Button>
              <TextField value={mintAmount} onChange={onChangeAmount} />
              <Button variant="outlined" onClick={onIncrease}>
                +
              </Button>
            </Box>

            <Box display="flex" flexDirection="column" gap={2}>
              <Typography>Amount max 2 JBAs per wallet</Typography>
              <Button variant="contained" onClick={minting}>
                Mint
              </Button>
            </Box>
          </>
        ) : (
          <Button variant="contained" onClick={connectWallet}>
            Connect Wallet
          </Button>
        )}
      </Box>
    </>
  );
};

export default Home;
