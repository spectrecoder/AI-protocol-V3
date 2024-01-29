// copy and export all the ERC20 related constants from AliERC20

// Auxiliary BN stuff
const BN = web3.utils.BN;
const TEN = new BN(10);

// Name of the token: Artificial Liquid Intelligence Token
const NAME = "Artificial Liquid Intelligence Token";

// Smart contract name (including version) for EIP712 signatures
const CONTRACT_NAME = "AliERC20v2";

// Symbol of the token: ALI
const SYMBOL = "ALI";

// Decimals of the token: 18
const DECIMALS = 18;

// Decimals multiplier (DM): 10^18
const DM = TEN.pow(new BN(DECIMALS));

// Total supply of the token: initially 10,000,000,000
const TOTAL_SUPPLY = new BN(10_000_000_000).mul(DM); // 10 billion * 10^18

// export all the constants
module.exports = {
	NAME,
	CONTRACT_NAME,
	SYMBOL,
	DECIMALS,
	DM,
	TOTAL_SUPPLY,
};
