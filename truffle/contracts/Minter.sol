// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import '@openzeppelin/contracts/access/Ownable.sol';
import './MIRLs.sol';

contract Minter is Ownable {
  uint256 public BASE_PRICE = 0.05 ether;
  uint256 public constant MAX_PER_WALLET = 5;
  uint256 public constant MAX_MIRLS = 888;
  uint256 public constant FREE_MINT = 444;

  MIRLs private tokens;
  address private MIRLsAddress;

  event Log(uint256 amount, uint256 gas);
  event ResultsFromCall(bool success, bytes data);

  constructor(address payable _MIRLsAddress) {
    MIRLsAddress = _MIRLsAddress;
    tokens = MIRLs(_MIRLsAddress);
  }

  receive() external payable {}

  fallback() external payable {}

  /**
  ***************************
  Public
  ***************************
   */

  function getBalance() public view returns (uint256) {
    return address(this).balance;
  }

  function mint(address to) public payable {
    require(tokens.totalSupply() < MAX_MIRLS, 'No more left to mint');
    require(tokens.balanceOf(to) < MAX_PER_WALLET, 'You have minted your wallet limit');

    if (tokens.totalSupply() < FREE_MINT) {
      // free minting
      tokens.safeMint(to);
    } else {
      require(msg.value >= BASE_PRICE, 'Need to send more ether');
      tokens.safeMint(to);
    }

    emit Log(msg.value, gasleft());
  }

  function batchMint(address to, uint256 batchMintAmt) public payable {
    // no free minting for batch

    require((tokens.totalSupply() + batchMintAmt) <= MAX_MIRLS, 'No more left to mint');
    require((tokens.balanceOf(to) + batchMintAmt) <= MAX_PER_WALLET, 'You have minted your wallet limit');
    require(msg.value >= (BASE_PRICE * batchMintAmt), 'Need to send more ether');

    for (uint256 index = 0; index < batchMintAmt; index++) {
      tokens.safeMint(to);
    }

    emit Log(msg.value, gasleft());
  }

  /**
  ***************************
  Only Owner
  ***************************
   */

  function withdraw() external onlyOwner {
    uint256 balance = address(this).balance;
    require(balance > 0, 'No ether left to withdraw');

    (bool success, bytes memory data) = (msg.sender).call{value: balance}('');
    require(success, 'Withdrawal failed');
    emit ResultsFromCall(success, data);
  }

  /**
  ***************************
  Customization for the contract
  ***************************
   */

  function setContractAddress(address payable _address) external onlyOwner {
    MIRLsAddress = _address;
    tokens = MIRLs(_address);
  }

  function setBasePrice(uint256 _basePrice) public onlyOwner {
    BASE_PRICE = _basePrice;
  }
}
