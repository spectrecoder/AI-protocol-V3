// copy and export all the ERC20 related constants from AliERC20

// Both Truffle anf Hardhat with Truffle make an instance of web3 available in the global scope
// BigNumber constants, functions to work with BigNumber
const {BigNumber} = require("@ethersproject/bignumber");

// Auxiliary BN stuff
const TEN = BigNumber.from(10);

// Name of the token: Artificial Liquid Intelligence Token
const NAME = "Artificial Liquid Intelligence Token";

// Smart contract name (including version) for EIP712 signatures
const CONTRACT_NAME = "AliERC20v2";

// Symbol of the token: ALI
const SYMBOL = "ALI";

// Decimals of the token: 18
const DECIMALS = 18;

// Decimals multiplier (DM): 10^18
const DM = TEN.pow(BigNumber.from(DECIMALS));

// Total supply of the token: initially 10,000,000,000
const TOTAL_SUPPLY = BigNumber.from(10_000_000_000).mul(DM); // 10 billion * 10^18

// export all the constants
module.exports = {
	NAME,
	CONTRACT_NAME,
	SYMBOL,
	DECIMALS,
	DM,
	TOTAL_SUPPLY,
};
