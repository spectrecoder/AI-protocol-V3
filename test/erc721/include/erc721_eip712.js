// ALI token constants required
const {CONTRACT_NAME} = require("./erc721_constants");

// EIP712 helpers
const EIP712 = require('../../ali_token/include/comp/eip712');

// ERC721 EIP-712 constants and functions
const ERC721_EIP712_TYPES = {
	Permit: [
		{name: 'owner', type: 'address'},
		{name: 'operator', type: 'address'},
		{name: 'tokenId', type: 'uint256'},
		{name: 'nonce', type: 'uint256'},
		{name: 'deadline', type: 'uint256'},
	],
	PermitForAll: [
		{name: 'owner', type: 'address'},
		{name: 'operator', type: 'address'},
		{name: 'approved', type: 'bool'},
		{name: 'nonce', type: 'uint256'},
		{name: 'deadline', type: 'uint256'},
	],
};

// builds EIP712 domain
async function eip712_domain(token_address) {
	// AI Protocol: Chain ID opcode hardcoded at 1 in Ganache-cli, but not in Hardhat
	// See: https://github.com/trufflesuite/ganache/issues/1643
	//      https://github.com/trufflesuite/ganache-core/issues/515
	const chainId = await web3.eth.net.getId();
	// build the domain
	return {name: CONTRACT_NAME, chainId, verifyingContract: token_address};
}

// helper function to EIP712 sign any of the auth-like ALI token call
async function eip712_sign(token_address, fn_name, params, p_key) {
	return EIP712.sign(await eip712_domain(token_address), fn_name, params, ERC721_EIP712_TYPES, p_key);
}

// deadline (unix timestamp) which is always 5 seconds in the future (overridable)
async function default_deadline(offset = 5) {
	const block = await web3.eth.getBlock("latest");
	return block.timestamp + offset;
}

// helper function to build EIP712 Permit signature
async function eip712_permit(token_address, owner, operator, tokenId, nonce, deadline, p_key) {
	return eip712_sign(
		token_address,
		'Permit',
		{owner, operator, tokenId, nonce, deadline},
		p_key
	);
}

// helper function to build EIP712 PermitForAll signature
async function eip712_permit_for_all(token_address, owner, operator, approved, nonce, deadline, p_key) {
	return eip712_sign(
		token_address,
		'PermitForAll',
		{owner, operator, approved, nonce, deadline},
		p_key
	);
}

module.exports = {
	ERC721_EIP712_TYPES,
	eip712_domain,
	eip712_sign,
	default_deadline,
	eip712_permit,
	eip712_permit_for_all,
}
