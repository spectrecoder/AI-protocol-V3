// EIP712 library to construct and sign authorization messages for NFT Factory

// EIP712 helpers
const EIP712 = require('../../ali_token/include/comp/eip712');

// NFT Factory EIP-712 constants and functions
const NFT_FACTORY_EIP712_TYPES = {
	MintWithAuthorization: [
		{name: "contract", type: "address"},
		{name: "to", type: "address"},
		{name: "tokenId", type: "uint256"},
		{name: "validAfter", type: "uint256"},
		{name: "validBefore", type: "uint256"},
		{name: "nonce", type: "bytes32"},
	],
	CancelAuthorization: [
		{name: "authorizer", type: "address"},
		{name: "nonce", type: "bytes32"},
	],
};

// deadline (unix timestamp) which is always 5 seconds in the future (overridable)
async function default_deadline(offset = 0, length = 5) {
	const block = await web3.eth.getBlock("latest");
	return {
		deadline: block.timestamp + offset + length,
		validAfter: block.timestamp + offset,
		validBefore: block.timestamp + offset + length,
	}
}

/**
 * @param CONTRACT_NAME EIP712 contract name to use for EIP712 signature
 */
class NFTFactoryEIP712 {
	// NFT Factory contract name
	CONTRACT_NAME = "NFTFactoryV1";

	constructor(CONTRACT_NAME = "NFTFactoryV1") {
		this.CONTRACT_NAME = CONTRACT_NAME;
	}

	// builds EIP712 domain
	eip712_domain = async(factory_addr) => {
		// Alethea: Chain ID opcode hardcoded at 1 in Ganache-cli, but not in Hardhat
		// See: https://github.com/trufflesuite/ganache/issues/1643
		//      https://github.com/trufflesuite/ganache-core/issues/515
		const chainId = await web3.eth.net.getId();
		// build the domain
		return {name: this.CONTRACT_NAME, chainId, verifyingContract: factory_addr};
	}

	// helper function to EIP712 sign any of the auth-like ALI token call
	eip712_sign = async(factory_addr, fn_name, params, p_key) => {
		return EIP712.sign(await this.eip712_domain(factory_addr), fn_name, params, NFT_FACTORY_EIP712_TYPES, p_key);
	}

	// helper function to build EIP712 Permit signature
	eip712_mint = async(factory_addr, contract, to, tokenId, validAfter, validBefore, nonce, p_key) => {
		return this.eip712_sign(
			factory_addr,
			"MintWithAuthorization",
			{contract, to, tokenId, validAfter, validBefore, nonce},
			p_key
		);
	}

	// helper function to build EIP712 PermitForAll signature
	eip712_cancel = async(factory_addr, authorizer, nonce, p_key) => {
		return this.eip712_sign(
			factory_addr,
			"CancelAuthorization",
			{authorizer, nonce},
			p_key
		);
	}
}

// export public module API
module.exports = {
	NFT_FACTORY_EIP712_TYPES,
	default_deadline,
	NFTFactoryEIP712,
}
