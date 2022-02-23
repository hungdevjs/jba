import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";

import whitelistAddresses from "./whitelistAddresses.json";

const leafNodes = whitelistAddresses.map((addr) => keccak256(addr));
const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });

const getHexProof = (account) => {
  const hexProof = merkleTree.getHexProof(keccak256(account));
  return hexProof;
};

export default getHexProof;
