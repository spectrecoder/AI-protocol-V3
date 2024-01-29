// ACL token features and roles
const {FEATURE_ALL} = require("../../include/features_roles");

const NAME = "Custom ERC721";
const SYMBOL = "CER";

/**
 * Deploys Short ERC721 token with all the features enabled
 *
 * @param a0 smart contract deployer, owner, super admin
 * @param name token name, ERC-721 compatible descriptive name
 * @param symbol token symbol, ERC-721 compatible abbreviated name
 * @returns ShortERC721 instance
 */
async function short_erc721_deploy(a0, name = NAME, symbol = SYMBOL) {
	// deploy the token
	const token = await short_erc721_deploy_restricted(a0, name, symbol);

	// enable all permissions on the token
	await token.updateFeatures(FEATURE_ALL, {from: a0});

	// return the reference
	return token;
}

/**
 * Deploys Short ERC721 token with no features enabled
 *
 * @param a0 smart contract deployer, owner, super admin
 * @param name token name, ERC-721 compatible descriptive name
 * @param symbol token symbol, ERC-721 compatible abbreviated name
 * @returns ShortERC721 instance
 */
async function short_erc721_deploy_restricted(a0, name = NAME, symbol = SYMBOL) {
	// smart contracts required
	const ERC721Mock = artifacts.require("./ShortERC721Mock");

	// deploy ERC721 and return the reference
	return await ERC721Mock.new(name, symbol, {from: a0});
}

/**
 * Deploys Burnable Short ERC721 token with all the features enabled
 *
 * @param a0 smart contract deployer, owner, super admin
 * @param name token name, ERC-721 compatible descriptive name
 * @param symbol token symbol, ERC-721 compatible abbreviated name
 * @returns BurnableShortERC721 instance
 */
async function burnable_short_erc721_deploy(a0, name = NAME, symbol = SYMBOL) {
	// deploy the token
	const token = await burnable_short_erc721_deploy_restricted(a0, name, symbol);

	// enable all permissions on the token
	await token.updateFeatures(FEATURE_ALL, {from: a0});

	// return the reference
	return token;
}

/**
 * Deploys Burnable Short ERC721 token with no features enabled
 *
 * @param a0 smart contract deployer, owner, super admin
 * @param name token name, ERC-721 compatible descriptive name
 * @param symbol token symbol, ERC-721 compatible abbreviated name
 * @returns BurnableShortERC721 instance
 */
async function burnable_short_erc721_deploy_restricted(a0, name = NAME, symbol = SYMBOL) {
	// smart contracts required
	const BurnableERC721Mock = artifacts.require("./BurnableShortERC721Mock");

	// deploy ERC721 and return the reference
	return await BurnableERC721Mock.new(name, symbol, {from: a0});
}

/**
 * Deploys Tiny ERC721 token with all the features enabled
 *
 * @param a0 smart contract deployer, owner, super admin
 * @param name token name, ERC-721 compatible descriptive name
 * @param symbol token symbol, ERC-721 compatible abbreviated name
 * @returns TinyERC721 instance
 */
async function tiny_erc721_deploy(a0, name = NAME, symbol = SYMBOL) {
	// deploy the token
	const token = await tiny_erc721_deploy_restricted(a0, name, symbol);

	// enable all permissions on the token
	await token.updateFeatures(FEATURE_ALL, {from: a0});

	// return the reference
	return token;
}

/**
 * Deploys RoyalRC721 – adopted for OpeSea Tiny ERC721 with royalties and "owner",
 * and all the features enabled
 *
 * @param a0 smart contract deployer, owner, super admin
 * @param name token name, ERC-721 compatible descriptive name
 * @param symbol token symbol, ERC-721 compatible abbreviated name
 * @returns RoyalERC721 instance
 */
 async function royal_nft_deploy(a0, name = NAME, symbol = SYMBOL) {
	// deploy the token
	const token = await royal_nft_deploy_restricted(a0, name, symbol);

	// enable all permissions on the token
	await token.updateFeatures(FEATURE_ALL, {from: a0});

	// return the reference
	return token;
}

/**
 * Deploys RoyalERC721 – adopted for OpeSea Tiny ERC721 with royalties and "owner",
 * with no features enabled
 *
 * @param a0 smart contract deployer, owner, super admin
 * @param name token name, ERC-721 compatible descriptive name
 * @param symbol token symbol, ERC-721 compatible abbreviated name
 * @returns RoyalERC721 instance
 */
 async function royal_nft_deploy_restricted(a0, name = NAME, symbol = SYMBOL) {
	// smart contracts required
	const RoyalNFT = artifacts.require("./RoyalERC721Mock");

	// deploy ERC721 and return the reference
	return await RoyalNFT.new(name, symbol, {from: a0});
}

/**
 * Deploys Tiny ERC721 token with no features enabled
 *
 * @param a0 smart contract deployer, owner, super admin
 * @param name token name, ERC-721 compatible descriptive name
 * @param symbol token symbol, ERC-721 compatible abbreviated name
 * @returns TinyERC721 instance
 */
async function tiny_erc721_deploy_restricted(a0, name = NAME, symbol = SYMBOL) {
	// smart contracts required
	const TinyERC721Mock = artifacts.require("./TinyERC721Mock");

	// deploy ERC721 and return the reference
	return await TinyERC721Mock.new(name, symbol, {from: a0});
}

/**
 * Deploys Lockable Short ERC721 token with all the features enabled
 *
 * @param a0 smart contract deployer, owner, super admin
 * @param name token name, ERC-721 compatible descriptive name
 * @param symbol token symbol, ERC-721 compatible abbreviated name
 * @returns ShortERC721 instance
 */
async function lockable_short_erc721_deploy(a0, name = NAME, symbol = SYMBOL) {
	// smart contracts required
	const LockableShortERC721Mock = artifacts.require("./LockableShortERC721Mock");

	// deploy the token
	const token = await LockableShortERC721Mock.new(name, symbol, {from: a0});

	// enable all permissions on the token
	await token.updateFeatures(FEATURE_ALL, {from: a0});

	// return the reference
	return token;
}

/**
 * Deploys Lockable Tiny ERC721 token with all the features enabled
 *
 * @param a0 smart contract deployer, owner, super admin
 * @param name token name, ERC-721 compatible descriptive name
 * @param symbol token symbol, ERC-721 compatible abbreviated name
 * @returns TinyERC721 instance
 */
async function lockable_tiny_erc721_deploy(a0, name = NAME, symbol = SYMBOL) {
	// smart contracts required
	const LockableTinyERC721Mock = artifacts.require("./LockableTinyERC721Mock");

	// deploy the token
	const token = await LockableTinyERC721Mock.new(name, symbol, {from: a0});

	// enable all permissions on the token
	await token.updateFeatures(FEATURE_ALL, {from: a0});

	// return the reference
	return token;
}

/**
 * Deploys Zeppelin ERC721 Mock
 *
 * @param a0 smart contract deployer, owner, super admin
 * @param name token name, ERC-721 compatible descriptive name
 * @param symbol token symbol, ERC-721 compatible abbreviated name
 * @returns ERC721 instance
 */
async function zeppelin_erc721_deploy(a0, name = NAME, symbol = SYMBOL) {
	// smart contracts required
	const ZeppelinERC721Mock = artifacts.require("./ZeppelinERC721Mock");

	// deploy ERC721 and return the reference
	return await ZeppelinERC721Mock.new(name, symbol, {from: a0});
}

/**
 * Deploys Zeppelin ERC721 Receiver Mock
 *
 * @param a0 deployer, smart contract deployer, owner, super admin
 * @param retval return value receiver returns when receives the token,
 *       if error is set to "None"
 * @param error one of 0 (None), 1 (RevertWithMessage), 2 (RevertWithoutMessage), 3 (Panic)
 * @return ERC721Receiver instance
 */
async function erc721_receiver_deploy(a0, retval = "0x150b7a02", error = 0) {
	// smart contracts required
	const ZeppelinERC721ReceiverMock = artifacts.require("./ZeppelinERC721ReceiverMock");

	// deploy ERC721 receiver and return the reference
	return await ZeppelinERC721ReceiverMock.new(retval, error, {from: a0});
}

// export public deployment API
module.exports = {
	royal_nft_deploy,
	royal_nft_deploy_restricted,
	short_erc721_deploy,
	short_erc721_deploy_restricted,
	burnable_short_erc721_deploy,
	burnable_short_erc721_deploy_restricted,
	tiny_erc721_deploy,
	tiny_erc721_deploy_restricted,
	lockable_short_erc721_deploy,
	lockable_tiny_erc721_deploy,
	zeppelin_erc721_deploy,
	erc721_receiver_deploy,
	NAME,
	SYMBOL,
};
