export const scoreContractAbi = [
  {
    type: "event",
    anonymous: false,
    name: "ScoreUpdated",
    inputs: [
      { indexed: true, name: "player", type: "address" },
      { indexed: false, name: "previousBest", type: "uint256" },
      { indexed: false, name: "newBest", type: "uint256" },
      { indexed: false, name: "timestamp", type: "uint256" },
    ],
  },
  {
    type: "function",
    stateMutability: "nonpayable",
    name: "submitScore",
    inputs: [{ name: "score", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    stateMutability: "view",
    name: "getBestScore",
    inputs: [{ name: "player", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

