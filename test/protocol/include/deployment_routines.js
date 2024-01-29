// Both Truffle and Hardhat with Truffle make instances of web3 and artifacts available in the global scope

// web3 utils
const BN = web3.utils.BN;
const toWei = web3.utils.toWei;

// ACL token features and roles
const {
	FEATURE_LINKING,
	FEATURE_UNLINKING,
	FEATURE_DEPOSITS,
	FEATURE_WITHDRAWALS,
	FEATURE_ALL,
	ROLE_TOKEN_CREATOR,
	ROLE_MINTER,
	ROLE_BURNER,
	ROLE_EDITOR,
} = require("../../include/features_roles");

// block utils
const {default_deadline} = require("../../include/block_utils");

/**
 * Deploys AliERC20 token with all the features enabled
 *
 * @param a0 smart contract owner, super admin
 * @param H0 initial token holder address
 * @returns AliERC20 instance
 */
async function ali_erc20_deploy(a0, H0 = a0) {
	// deploy ALI token
	const token = await ali_erc20_deploy_restricted(a0, H0);

	// enable all permissions on the token
	await token.updateFeatures(FEATURE_ALL, {from: a0});

	// return the reference
	return token;
}

/**
 * Deploys AliERC20 token with no features enabled
 *
 * @param a0 smart contract owner, super admin
 * @param H0 initial token holder address
 * @returns AliERC20 instance
 */
async function ali_erc20_deploy_restricted(a0, H0 = a0) {
	// smart contracts required
	const AliERC20 = artifacts.require("./AliERC20v2");

	// deploy and return the reference to instance
	return await AliERC20.new(H0, {from: a0});
}

/**
 * Deploys Whitelabel ERC721 token with all the features enabled
 *
 * @param a0 smart contract owner, super admin
 * @param name ERC721 name, optional, default value "Revenants by Alethea AI"
 * @param symbol ERC721 symbol, optional, default value "REV"
 * @returns WhitelabelNFT instance
 */
async function revenants_erc721_deploy(a0, name, symbol) {
	// deploy the token
	const token = await revenants_erc721_deploy_restricted(a0, name, symbol);

	// enable all permissions on the token
	await token.updateFeatures(FEATURE_ALL, {from: a0});

	// return the reference
	return token;
}

/**
 * Deploys Whitelabel ERC721s token with no features enabled
 *
 * @param a0 smart contract owner, super admin
 * @param name ERC721 name, optional, default value "Revenants by Alethea AI"
 * @param symbol ERC721 symbol, optional, default value "REV"
 * @returns WhitelabelNFT instance
 */
async function revenants_erc721_deploy_restricted(a0, name = "Revenants by Alethea AI", symbol = "REV") {
	// deploy and return the reference to instance
	return await whitelabel_erc721_deploy_restricted(a0, name, symbol);
}

/**
 * Deploys Whitelabel ERC721 token with all the features enabled
 *
 * @param a0 smart contract owner, super admin
 * @param name ERC721 name, optional, default value "Whitelabel NFT"
 * @param symbol ERC721 symbol, optional, default value "WFT"
 * @returns WhitelabelNFT instance
 */
async function whitelabel_erc721_deploy(a0, name, symbol) {
	// deploy the token
	const token = await whitelabel_erc721_deploy_restricted(a0, name, symbol);

	// enable all permissions on the token
	await token.updateFeatures(FEATURE_ALL, {from: a0});

	// return the reference
	return token;
}

/**
 * Deploys Whitelabel ERC721 token with no features enabled
 *
 * @param a0 smart contract owner, super admin
 * @param name ERC721 name, optional, default value "Whitelabel NFT"
 * @param symbol ERC721 symbol, optional, default value "WFT"
 * @returns WhitelabelNFT instance
 */
async function whitelabel_erc721_deploy_restricted(a0, name = "Whitelabel NFT", symbol = "WFT") {
	// smart contracts required
	const WhitelabelNFT = artifacts.require("./WhitelabelNFT");

	// deploy and return the reference to instance
	return await WhitelabelNFT.new(name, symbol, {from: a0});
}

/**
 * Deploys Personality Pod ERC721 token with all the features enabled
 *
 * @param a0 smart contract owner, super admin
 * @param name ERC721 name, optional, default value "iNFT Personality Pod"
 * @param symbol ERC721 symbol, optional, default value "POD"
 * @returns PersonalityPodERC721 instance
 */
async function persona_deploy(a0, name, symbol) {
	// deploy the token
	const token = await persona_deploy_restricted(a0, name, symbol);

	// enable all permissions on the token
	await token.updateFeatures(FEATURE_ALL, {from: a0});

	// return the reference
	return token;
}

/**
 * Deploys Personality Pod ERC721 token with no features enabled
 *
 * @param a0 smart contract owner, super admin
 * @param name ERC721 name, optional, default value "iNFT Personality Pod"
 * @param symbol ERC721 symbol, optional, default value "POD"
 * @returns PersonalityPodERC721 instance
 */
async function persona_deploy_restricted(a0, name = "iNFT Personality Pod", symbol = "POD") {
	// smart contracts required
	const PersonalityPodERC721 = artifacts.require("./PersonalityPodERC721");

	// deploy and return the reference to instance
	return await PersonalityPodERC721.new(name, symbol, {from: a0});
}

/**
 * Deploys Intelligent NFT v2
 *
 * If ALI ERC20 token instance address is specified – binds iNFT to it, deploys new one otherwise
 *
 * @param a0 smart contract owner, super admin
 * @param ali_addr AliERC20 token address, optional
 * @returns AliERC20 token instance, IntelligentNFTv2 instance
 */
async function intelligent_nft_deploy(a0, ali_addr) {
	// smart contracts required
	const AliERC20 = artifacts.require("./AliERC20v2");
	const IntelligentNFTv2 = artifacts.require("./IntelligentNFTv2");

	// link/deploy the contracts
	const ali = ali_addr? await AliERC20.at(ali_addr): await ali_erc20_deploy(a0);
	const iNft = await IntelligentNFTv2.new(ali.address, {from: a0});

	// return all the linked/deployed instances
	return {ali, iNft};
}

// default Linker initialization parameters and function to deploy and initialize the Linker with these parameters
const LINKER_PARAMS = {
	NEXT_ID: 0x1_0000_0000,
	LINK_PRICE: toWei(new BN(2_000), "ether"),
	LINK_FEE: toWei(new BN(200), "ether"),
};
const LINKER_PARAMS_V2 = {
	NEXT_ID: 0x2_0000_0000,
	LINK_PRICE: new BN(0),
	LINK_FEE: new BN(0),
};
const LINKER_PARAMS_V3 = LINKER_PARAMS_V2;

/**
 * Deploys Intelligent Linker with all the features enabled, and all the required roles set up,
 * whitelists the NFT on the Linker
 *
 * If AliERC20, PersonalityPodERC721, and IntelligentNFTv2 instance addresses are specified,
 * binds linker to them, deploys new instances otherwise
 *
 * @param a0 smart contract owner, super admin
 * @param ali_addr AliERC20 token address, optional
 * @param persona_addr PersonalityPodERC721 instance address, optional
 * @param iNft_addr IntelligentNFTv2 instance address, optional
 * @param nft_addr whitelisted NFT contract address on the linker
 * @returns AliERC20, PersonalityPodERC721, IntelligentNFTv2, IntelliLinker instances
 */
async function linker_deploy(a0, ali_addr, persona_addr, iNft_addr, nft_addr) {
	// deploy infrastructure required with no features and roles set up
	const {ali, persona, iNft, linker} = await linker_deploy_restricted(a0, ali_addr, persona_addr, iNft_addr);

	// features setup
	await linker.updateFeatures(FEATURE_LINKING | FEATURE_UNLINKING | FEATURE_DEPOSITS | FEATURE_WITHDRAWALS, {from: a0});

	// whitelist the NFT contract address provided
	if(nft_addr) {
		await linker.whitelistTargetContract(nft_addr, true, {from: a0});
	}

	// return all the linked/deployed instances
	return {ali, persona, iNft, linker};
}

/**
 * Deploys Intelligent Linker with no features enabled, and no roles set up,
 * doesn't whitelist the NFT on the Linker
 *
 * If AliERC20, PersonalityPodERC721, and IntelligentNFTv2 instance addresses are specified,
 * binds linker to them, deploys new instances otherwise
 *
 * @param a0 smart contract owner, super admin
 * @param ali_addr AliERC20 token address, optional
 * @param persona_addr PersonalityPodERC721 instance address, optional
 * @param iNft_addr IntelligentNFTv2 instance address, optional
 * @returns AliERC20, PersonalityPodERC721, IntelligentNFTv2, IntelliLinker instances
 */
async function linker_deploy_restricted(a0, ali_addr, persona_addr, iNft_addr) {
	// smart contracts required
	const AliERC20 = artifacts.require("./AliERC20v2");
	const PersonalityPodERC721 = artifacts.require("./PersonalityPodERC721");
	const IntelligentNFTv2 = artifacts.require("./IntelligentNFTv2");

	// link/deploy the contracts
	let iNft, ali;
	if(iNft_addr) {
		iNft = await IntelligentNFTv2.at(iNft_addr);
		ali = await AliERC20.at(await iNft.aliContract());
	}
	else {
		({ali, iNft} = await intelligent_nft_deploy(a0, ali_addr));
	}
	const persona = persona_addr? await PersonalityPodERC721.at(persona_addr): await persona_deploy(a0);
	const linker = await linker_deploy_pure(a0, ali.address, persona.address, iNft.address);

	// linker permissions setup on iNFT
	await iNft.updateRole(linker.address, ROLE_MINTER | ROLE_BURNER | ROLE_EDITOR, {from: a0});

	// return all the linked/deployed instances
	return {ali, persona, iNft, linker};
}

/**
 * Deploys Intelligent Linker with no features enabled, and no roles set up,
 * doesn't whitelist the NFT on the Linker
 *
 * Requires a valid AliERC20, PersonalityPodERC721, and IntelligentNFTv2 instance addresses to be specified
 *
 * @param a0 smart contract owner, super admin
 * @param ali_addr AliERC20 token address, required
 * @param persona_addr PersonalityPodERC721 instance address, required
 * @param iNft_addr IntelligentNFTv2 instance address, required
 * @returns IntelliLinker instance
 */
async function linker_deploy_pure(a0, ali_addr, persona_addr, iNft_addr) {
	// smart contracts required
	const IntelliLinker = artifacts.require("./IntelliLinker");

	// deploy and return the reference to instance
	return await IntelliLinker.new(ali_addr, persona_addr, iNft_addr, {from: a0});
}

/**
 * Deploys Intelligent Linker v2 (Upgradeable) with all the features enabled, and all the required roles set up,
 * whitelists the NFT on the Linker
 *
 * If AliERC20, PersonalityPodERC721, and IntelligentNFTv2 instance addresses are specified,
 * binds linker to them, deploys new instances otherwise
 *
 * @param a0 smart contract owner, super admin
 * @param ali_addr AliERC20 token address, optional
 * @param persona_addr PersonalityPodERC721 instance address, optional
 * @param iNft_addr IntelligentNFTv2 instance address, optional
 * @param nft_addr whitelisted NFT contract address on the linker
 * @returns AliERC20, PersonalityPodERC721, IntelligentNFTv2, IntelliLinker instances
 */
async function linker_v2_deploy(a0, ali_addr, persona_addr, iNft_addr, nft_addr) {
	// deploy infrastructure required with no features and roles set up
	const {ali, persona, iNft, linker} = await linker_v2_deploy_restricted(a0, ali_addr, persona_addr, iNft_addr);

	// features setup
	await linker.updateFeatures(FEATURE_LINKING | FEATURE_UNLINKING | FEATURE_DEPOSITS | FEATURE_WITHDRAWALS, {from: a0});

	// whitelist the NFT contract address provided
	if(nft_addr) {
		await linker.whitelistTargetContract(nft_addr, true, true, {from: a0});
	}

	// return all the linked/deployed instances
	return {ali, persona, iNft, linker};
}

/**
 * Deploys Intelligent Linker v2 (Upgradeable) with no features enabled, and no roles set up,
 * doesn't whitelist the NFT on the Linker
 *
 * If AliERC20, PersonalityPodERC721, and IntelligentNFTv2 instance addresses are specified,
 * binds linker to them, deploys new instances otherwise
 *
 * @param a0 smart contract owner, super admin
 * @param ali_addr AliERC20 token address, optional
 * @param persona_addr PersonalityPodERC721 instance address, optional
 * @param iNft_addr IntelligentNFTv2 instance address, optional
 * @returns AliERC20, PersonalityPodERC721, IntelligentNFTv2, IntelliLinker instances
 */
async function linker_v2_deploy_restricted(a0, ali_addr, persona_addr, iNft_addr) {
	// smart contracts required
	const AliERC20 = artifacts.require("./AliERC20v2");
	const PersonalityPodERC721 = artifacts.require("./PersonalityPodERC721");
	const IntelligentNFTv2 = artifacts.require("./IntelligentNFTv2");

	// link/deploy the contracts
	let iNft, ali;
	if(iNft_addr) {
		iNft = await IntelligentNFTv2.at(iNft_addr);
		ali = await AliERC20.at(await iNft.aliContract());
	}
	else {
		({ali, iNft} = await intelligent_nft_deploy(a0, ali_addr));
	}
	const persona = persona_addr? await PersonalityPodERC721.at(persona_addr): await persona_deploy(a0);
	const linker = await linker_v2_deploy_pure(a0, ali.address, persona.address, iNft.address);

	// linker permissions setup on iNFT
	await iNft.updateRole(linker.address, ROLE_MINTER | ROLE_BURNER | ROLE_EDITOR, {from: a0});

	// return all the linked/deployed instances
	return {ali, persona, iNft, linker};
}

/**
 * Deploys Intelligent Linker v2 (Upgradeable) wrapped into ERC1967Proxy,
 * with no features enabled, and no roles set up, doesn't whitelist the NFT on the Linker
 *
 * Requires a valid AliERC20, PersonalityPodERC721, and IntelligentNFTv2 instance addresses to be specified
 *
 * @param a0 smart contract owner, super admin
 * @param ali_addr AliERC20 token address, required
 * @param persona_addr PersonalityPodERC721 instance address, required
 * @param iNft_addr IntelligentNFTv2 instance address, required
 * @returns IntelliLinker instance
 */
async function linker_v2_deploy_pure(a0, ali_addr, persona_addr, iNft_addr) {
	// smart contracts required
	const IntelliLinker = artifacts.require("./IntelliLinkerV2");
	const Proxy = artifacts.require("./ERC1967Proxy");

	// deploy implementation without a proxy
	const instance = await IntelliLinker.new({from: a0});

	// prepare the initialization call bytes to initialize the proxy (upgradeable compatibility)
	const init_data = instance.contract.methods.postConstruct(ali_addr, persona_addr, iNft_addr).encodeABI();

	// deploy proxy, and initialize the implementation (inline)
	const proxy = await Proxy.new(instance.address, init_data, {from: a0});

	// wrap the proxy into the implementation ABI and return
	return await IntelliLinker.at(proxy.address);
}

/**
 * Deploys Intelligent Linker v3 (Upgradeable) with all the features enabled, and all the required roles set up,
 * whitelists the NFT on the Linker
 *
 * If AliERC20, PersonalityPodERC721, and IntelligentNFTv2 instance addresses are specified,
 * binds linker to them, deploys new instances otherwise
 *
 * @param a0 smart contract owner, super admin
 * @param ali_addr AliERC20 token address, optional
 * @param persona_addr PersonalityPodERC721 instance address, optional
 * @param iNft_addr IntelligentNFTv2 instance address, optional
 * @param nft_addr whitelisted NFT contract address on the linker
 * @returns AliERC20, PersonalityPodERC721, IntelligentNFTv2, IntelliLinker instances
 */
async function linker_v3_deploy(a0, ali_addr, persona_addr, iNft_addr, nft_addr) {
	// deploy linker v2 and other infrastructure required
	const {ali, persona, iNft, linker} = await linker_v2_deploy(a0, ali_addr, persona_addr, iNft_addr)

	// upgrade linker v2 –> v3 and return all the linked/deployed instances
	return {ali, persona, iNft, linker: await linker_v2_v3_upgrade_pure(a0, linker)};
}

/**
 * Deploys Intelligent Linker v3 (Upgradeable) with no features enabled, and no roles set up,
 * doesn't whitelist the NFT on the Linker
 *
 * If AliERC20, PersonalityPodERC721, and IntelligentNFTv2 instance addresses are specified,
 * binds linker to them, deploys new instances otherwise
 *
 * @param a0 smart contract owner, super admin
 * @param ali_addr AliERC20 token address, optional
 * @param persona_addr PersonalityPodERC721 instance address, optional
 * @param iNft_addr IntelligentNFTv2 instance address, optional
 * @returns AliERC20, PersonalityPodERC721, IntelligentNFTv2, IntelliLinker instances
 */
async function linker_v3_deploy_restricted(a0, ali_addr, persona_addr, iNft_addr) {
	// deploy linker v2 and other infrastructure required
	const {ali, persona, iNft, linker} = await linker_v2_deploy_restricted(a0, ali_addr, persona_addr, iNft_addr)

	// upgrade linker v2 –> v3 and return all the linked/deployed instances
	return {ali, persona, iNft, linker: await linker_v2_v3_upgrade_pure(a0, linker)};
}

/**
 * Deploys Intelligent Linker v3 (Upgradeable) wrapped into ERC1967Proxy,
 * with no features enabled, and no roles set up, doesn't whitelist the NFT on the Linker
 *
 * Requires a valid AliERC20, PersonalityPodERC721, and IntelligentNFTv2 instance addresses to be specified
 *
 * @param a0 smart contract owner, super admin
 * @param ali_addr AliERC20 token address, required
 * @param persona_addr PersonalityPodERC721 instance address, required
 * @param iNft_addr IntelligentNFTv2 instance address, required
 * @returns IntelliLinker instance
 */
async function linker_v3_deploy_pure(a0, ali_addr, persona_addr, iNft_addr) {
	// deploy linker v2
	const linker = await linker_v2_deploy_pure(a0, ali_addr, persona_addr, iNft_addr)

	// upgrade linker v2 –> v3 and return the upgraded linker
	return linker_v2_v3_upgrade_pure(a0, linker);
}

/**
 * Upgrades Intelligent Linker v2 to v3, without altering existing features.
 *
 * Requires valid IntelliLinkerV2 and IntelligentNFTv2Escrow instance addresses specified
 *
 * @param a0 smart contract owner, super admin
 * @param linker IntelliLinkerV2 instance, required
 * @returns IntelliLinkerV3 instance
 */
async function linker_v2_v3_upgrade_pure(a0, linker) {
	// smart contracts required
	const IntelliLinkerV3 = artifacts.require("./IntelliLinkerV3");

	// deploy new implementation
	const linker_v3 = await IntelliLinkerV3.new({from: a0});

	// execute the upgrade
	await linker.upgradeTo(linker_v3.address, {from: a0});

	// wrap the address into V3 ABI and return
	return await IntelliLinkerV3.at(linker.address);
}

// export public deployment API
module.exports = {
	ali_erc20_deploy,
	ali_erc20_deploy_restricted,
	revenants_erc721_deploy,
	revenants_erc721_deploy_restricted,
	whitelabel_erc721_deploy,
	whitelabel_erc721_deploy_restricted,
	persona_deploy,
	persona_deploy_restricted,
	intelligent_nft_deploy,
	LINKER_PARAMS,
	linker_deploy,
	linker_deploy_restricted,
	linker_deploy_pure,
	LINKER_PARAMS_V2,
	linker_v2_deploy,
	linker_v2_deploy_restricted,
	linker_v2_deploy_pure,
	LINKER_PARAMS_V3,
	linker_v3_deploy,
	linker_v3_deploy_restricted,
	linker_v3_deploy_pure,
};
