const chainDistributorAbi = [
  {
    inputs: [
      { internalType: 'contract IGovernanceAddressProvider', name: '_a', type: 'address' },
      { internalType: 'contract IRootChainManager', name: '_rootChainManager', type: 'address' },
      { internalType: 'address', name: '_erc20Predicate', type: 'address' },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'address', name: 'account', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'shares', type: 'uint256' },
    ],
    name: 'PayeeAdded',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'uint256', name: 'newTokens', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'releasedAt', type: 'uint256' },
    ],
    name: 'TokensReleased',
    type: 'event',
  },
  {
    inputs: [],
    name: 'a',
    outputs: [{ internalType: 'contract IGovernanceAddressProvider', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address[]', name: '_payees', type: 'address[]' },
      { internalType: 'uint256[]', name: '_shares', type: 'uint256[]' },
    ],
    name: 'changePayees',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'erc20Predicate',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getPayees',
    outputs: [{ internalType: 'address[]', name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'mintableTokens',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'payees',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  { inputs: [], name: 'release', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  {
    inputs: [],
    name: 'rootChainManager',
    outputs: [{ internalType: 'contract IRootChainManager', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'shares',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalShares',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
];

export default chainDistributorAbi;
