// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import '@openzeppelin/contracts/access/Ownable.sol';
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import './JBA.sol';

contract Minter is Ownable {
  bytes32 public constant merkleRoot = 0xad394490230bbfbf2d72242f35618fb76505aa96b686a91c7ef775f263d98cd8;
  uint256 public BASE_PRICE = 0.05 ether;
  uint256 public constant MAX_PER_WALLET = 5;
  uint256 public constant MAX_JBA = 888;
  uint256 public constant FREE_MINT = 444;

  JBA private tokens;
  address private JBAAddress;

  event Log(uint256 amount, uint256 gas);
  event ResultsFromCall(bool success, bytes data);

  constructor(address payable _JBAAddress) {
    JBAAddress = _JBAAddress;
    tokens = JBA(_JBAAddress);
  }

  receive() external payable {}

  fallback() external payable {}

  function validateWhiteList(bytes32[] calldata merkleProof, address sender) private pure returns (bool) {
    bytes32 leaf = keccak256(abi.encodePacked(sender));
    return MerkleProof.verify(merkleProof, merkleRoot, leaf);
  }

  /**
  ***************************
  Public
  ***************************
   */

  function getBalance() public view returns (uint256) {
    return address(this).balance;
  }

  function mint(address to, bytes32[] calldata merkleProof) public payable {
    require(validateWhiteList(merkleProof, to), "User isnt whitelisted");
    require(tokens.totalSupply() < MAX_JBA, 'No more left to mint');
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

  function batchMint(address to, bytes32[] calldata merkleProof, uint256 batchMintAmt) public payable {
    // no free minting for batch
    require(validateWhiteList(merkleProof, to), "User isnt whitelisted");
    require((tokens.totalSupply() + batchMintAmt) <= MAX_JBA, 'No more left to mint');
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
    JBAAddress = _address;
    tokens = JBA(_address);
  }

  function setBasePrice(uint256 _basePrice) public onlyOwner {
    BASE_PRICE = _basePrice;
  }
}
