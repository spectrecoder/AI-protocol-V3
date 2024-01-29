// ALI token constants required
const {CONTRACT_NAME} = require("./ali_erc20_constants");

// EIP712 helpers
const EIP712 = require('./comp/eip712');

// ALI EIP-712 constants and functions
const ALI_EIP712_TYPES = {
	Delegation: [
		{name: 'delegate', type: 'address'},
		{name: 'nonce', type: 'uint256'},
		{name: 'expiry', type: 'uint256'}
	],
	Permit: [
		{name: 'owner', type: 'address'},
		{name: 'spender', type: 'address'},
		{name: 'value', type: 'uint256'},
		{name: 'nonce', type: 'uint256'},
		{name: 'deadline', type: 'uint256'},
	],
	TransferWithAuthorization: [
		{name: 'from', type: 'address'},
		{name: 'to', type: 'address'},
		{name: 'value', type: 'uint256'},
		{name: 'validAfter', type: 'uint256'},
		{name: 'validBefore', type: 'uint256'},
		{name: 'nonce', type: 'bytes32'},
	],
	ReceiveWithAuthorization: [
		{name: 'from', type: 'address'},
		{name: 'to', type: 'address'},
		{name: 'value', type: 'uint256'},
		{name: 'validAfter', type: 'uint256'},
		{name: 'validBefore', type: 'uint256'},
		{name: 'nonce', type: 'bytes32'},
	],
	CancelAuthorization: [
		{name: 'authorizer', type: 'address'},
		{name: 'nonce', type: 'bytes32'},
	],
};

// builds EIP712 domain
async function eip712_domain(contract_address, contract_name = CONTRACT_NAME) {
	// Alethea: Chain ID opcode hardcoded at 1 in Ganache-cli, but not in Hardhat
	// See: https://github.com/trufflesuite/ganache/issues/1643
	//      https://github.com/trufflesuite/ganache-core/issues/515
	const chainId = await web3.eth.net.getId();
	// build the domain
	return {name: contract_name, chainId, verifyingContract: contract_address};
}

// helper function to EIP712 sign any of the auth-like ALI token call
async function eip712_sign(contract_address, fn_name, params, p_key) {
	return EIP712.sign(await eip712_domain(contract_address), fn_name, params, ALI_EIP712_TYPES, p_key);
}

// helper function to build EIP712 Delegation signature
async function eip712_delegate(contract_address, delegate, nonce, expiry, p_key) {
	return await eip712_sign(
		contract_address,
		'Delegation',
		{delegate, nonce, expiry},
		p_key
	);
}

// helper function to build EIP712 Permit signature
async function eip712_permit(contract_address, owner, spender, value, nonce, deadline, p_key) {
	return eip712_sign(
		contract_address,
		'Permit',
		{owner, spender, value, nonce, deadline},
		p_key
	);
}

// helper function to build EIP712 TransferWithAuthorization signature
async function eip712_transfer(contract_address, from, to, value, validAfter, validBefore, nonce, p_key) {
	return await eip712_sign(
		contract_address,
		'TransferWithAuthorization',
		{from, to, value, validAfter, validBefore, nonce},
		p_key
	);
}

// helper function to build EIP712 ReceiveWithAuthorization signature
async function eip712_receive(contract_address, from, to, value, validAfter, validBefore, nonce, p_key) {
	return await eip712_sign(
		contract_address,
		'ReceiveWithAuthorization',
		{from, to, value, validAfter, validBefore, nonce},
		p_key
	);
}

// helper function to build EIP712 CancelAuthorization signature
async function eip712_cancel(contract_address, authorizer, nonce, p_key) {
	return await eip712_sign(
		contract_address,
		'CancelAuthorization',
		{authorizer, nonce},
		p_key
	);
}

// export all the constants
module.exports = {
	ALI_EIP712_TYPES,
	eip712_domain,
	eip712_sign,
	eip712_delegate,
	eip712_permit,
	eip712_transfer,
	eip712_receive,
	eip712_cancel,
}
