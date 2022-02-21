import React, { useState, useEffect } from "react";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import Web3 from "web3";
import Moralis from "moralis";

import MIRLs from "./abis/MIRLs.json";
import Minter from "./abis/Minter.json";

const serverUrl = "https://mndttulob3te.usemoralis.com:2053/server";
const appId = "BneLsmybBe0xewJ70WDlVCaMjwEswr3hxyPQO7kd";

Moralis.start({ serverUrl, appId });

const TOTAL_MINT_AMT = 888;
const FREE_MINT_AMT = 444;
const MINT_PRICE = 0.0;

const chainId = "0x539"; //Ganache
// const chainId = '0x4'; //Rinkeby
// const chainId = '0x1'; //Ethereum Mainnet

const networkId = "5777"; // Ganache
// const networkId = '4'; //Rinkeby
// const networkId = '1'; //Ethereum Mainnet

const signingMessage = `Welcome to MIRLs.

Click to sign in and authenticate to the site: https://random.com/

This request will not trigger a blockchain transaction or cost any gas fees.

Your authentication status will reset after 24 hours.`;

const App = () => {
  const [mintAmount, setMintAmount] = useState(1);
  const [isMinting, setIsMinting] = useState(false);
  const [baseContractAddress, setBaseContractAddress] = useState(null);
  const [minterContractAddress, setMinterContractAddress] = useState(null);
  const [baseContract, setBaseContract] = useState(null);
  // const [minterContract, setMinterContract] = useState(null);
  const [account, setAccount] = useState();
  const [totalySupply, setTotalySupply] = useState(0);
  // const [balanceOf, setBalanceOf] = useState(0);
  const [web3, setWeb3] = useState(null);
  const [open, setOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  useEffect(() => {
    (async () => {
      if (MIRLs.networks[networkId]) {
        setBaseContractAddress(MIRLs.networks[networkId].address);
      }
      if (Minter.networks[networkId]) {
        setMinterContractAddress(Minter.networks[networkId].address);
      }
      // console.log({
      //   baseContractAddress: MIRLs.networks[networkId].address,
      //   minterContractAddress: Minter.networks[networkId].address,
      // });
    })();

    return () => {
      unsubscribeAccountChange();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (web3) {
      const _baseContract = new web3.eth.Contract(
        MIRLs.abi,
        baseContractAddress
      );
      setBaseContract(_baseContract);

      // const _minterContract = new web3.eth.Contract(Minter.abi, minterContractAddress);
      // setMinterContract(_minterContract);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [web3]);

  useEffect(() => {
    (async () => {
      if (baseContract) {
        // load base contract data
        const totalSupplyResult = await Moralis.executeFunction({
          contractAddress: baseContractAddress,
          functionName: "totalSupply",
          abi: MIRLs.abi,
        });
        console.log("totalSupply: ", totalSupplyResult.toString());
        setTotalySupply(totalSupplyResult.toNumber());

        // const result = await baseContract.methods.totalSupply().call();
        // console.log('totalMinted', result);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseContract]);

  const unsubscribeAccountChange = Moralis.onAccountChanged(async () => {
    console.log("ON ACCOUNT CHANGE");
    // Moralis.User.logOut();
    // web3.currentProvider.disconnect();
    await enableWeb3onMoralis();
    const account = await Moralis.account;
    setAccount(account);
  });

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

    console.log(`switchNetwork - Moralis.chainId: ${await Moralis.chainId}`);

    // auth with moralis
    Moralis.authenticate({ signingMessage: signingMessage }).then(
      async function (user) {
        let userEthAddress = user.get("ethAddress");
        console.log(`user ethAddress: ${userEthAddress}`);
        setAccount(userEthAddress);
      }
    );
  };

  // const mintOneFree = async () => {
  //   const ethValue = Moralis.Units.ETH('0.0');

  //   const transaction = await Moralis.executeFunction({
  //     contractAddress: minterContractAddress,
  //     functionName: 'mint',
  //     abi: Minter.abi,
  //     msgValue: ethValue,
  //     params: {
  //       to: account,
  //     },
  //   });
  //   console.log('transaction.hash', transaction.hash);
  //   // Wait until the transaction is confirmed
  //   await transaction.wait();
  // };
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
    // console.log(ethValue);

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
      // if (totalySupply < FREE_MINT_AMT) {
      //   // free minting
      //   await mintOneFree();
      // } else {
      //   if (parseInt(mintAmount, 10) > 1) {
      //     // batch paid minting
      //     await mintBatchPaid();
      //   } else {
      //     // single paid minting
      //     await mintOnePaid();
      //   }
      // }

      if (parseInt(mintAmount, 10) > 1) {
        // batch paid minting
        await mintBatchPaid();
      } else {
        // single paid minting
        await mintOnePaid();
      }

      // Get total minted tokens
      const totalSupplyResult = await Moralis.executeFunction({
        contractAddress: baseContractAddress,
        functionName: "totalSupply",
        abi: MIRLs.abi,
      });
      console.log("totalSupply: ", totalSupplyResult.toString());
      setTotalySupply(totalSupplyResult.toNumber());
      setMintAmount(totalSupplyResult.toNumber());

      // Get Balance of tokens
      const balanceOfResult = await Moralis.executeFunction({
        contractAddress: baseContractAddress,
        functionName: "balanceOf",
        abi: MIRLs.abi,
        params: {
          owner: account,
        },
      });
      console.log("balanceOf: ", balanceOfResult.toString());
      // setBalanceOf(balanceOfResult.toNumber());
    } catch (error) {
      console.log("minting error", { error }, error.message);
      setOpen(true);

      if (error?.error?.message) {
        setErrorMessage(error.error.message);
      } else {
        setErrorMessage(error.message);
      }

      setIsMinting(false);
    }

    setIsMinting(false);

    // try {
    //   // minterContract.methods.mint().send({ from: account, value: Moralis.Units.ETH(0.08) });
    //   // _contract.methods.transferFrom(accounts[0], accounts[0], 0).call();
    //   // console.log(await _contract.methods.balanceOf(accounts[0]).call());
    // } catch (error) {
    //   console.log(error);
    // }
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

  if (isMinting) return <>Minting...</>;

  return (
    <div id="mint" className="section">
      <Dialog open={open} onClose={handleClose}>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {errorMessage}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} autoFocus>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Grid container alignItems="space-between">
        <Grid item xs={12} md={8} my="auto">
          <div className="mint-poster-outer">
            <div className="mint-poster-inner">
              <h2 id="mint-title">Feeling lucky?</h2>
              {account ? (
                <React.Fragment>
                  <div disabled className=".mint-account">
                    {`Your account: ${account}`}
                  </div>
                  <p className="mint-subtitle">
                    Minting Lucky Chonks will give you good luck!
                  </p>

                  {/* {totalySupply >= FREE_MINT_AMT && (
                    <div id="mint-amount-input-container">
                      <input id="mint-amount-input" value={mintAmount} onChange={onChangeAmount} />
                      <div id="mint-amount-input-gradient-background" />
                      <button className="mint-amount-btn" id="mint-amount-btn-decrease" onClick={onDecrease}>
                        -
                      </button>
                      <button className="mint-amount-btn" id="mint-amount-btn-increase" onClick={onIncrease}>
                        +
                      </button>
                    </div>
                  )} */}

                  <div id="mint-amount-input-container">
                    <input
                      id="mint-amount-input"
                      value={mintAmount}
                      onChange={onChangeAmount}
                    />
                    <div id="mint-amount-input-gradient-background" />
                    <button
                      className="mint-amount-btn"
                      id="mint-amount-btn-decrease"
                      onClick={onDecrease}
                    >
                      -
                    </button>
                    <button
                      className="mint-amount-btn"
                      id="mint-amount-btn-increase"
                      onClick={onIncrease}
                    >
                      +
                    </button>
                  </div>

                  <p className="mint-hint-text">Amount max 2 per wallet</p>
                  <button
                    className="mint-btn"
                    id="mint-chonks-btn"
                    onClick={minting}
                  >
                    Mint
                  </button>
                </React.Fragment>
              ) : (
                <button
                  className="mint-btn"
                  id="connect-wallet-btn"
                  onClick={connectWallet}
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </Grid>
        {/* <Grid container item xs={12} md={4} my="auto" px={2}>
          {mintingCats.map((cat, index) => (
            <MintingCatItem key={index} {...cat} />
          ))}
        </Grid> */}
      </Grid>
    </div>
  );
};

export default App;
