// ACL token features and roles
const {FEATURE_ALL, FEATURE_NONE} = require("../../include/features_roles");

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
 * Deploys AliERC20 token Comp mock with all the features enabled
 *
 * @param a0 smart contract owner, super admin
 * @param H0 initial token holder address
 * @returns AliERC20 instance
 */
async function ali_erc20_deploy_comp_mock(a0, H0 = a0) {
	// smart contracts required
	const AliCompMock = artifacts.require("./AliCompMock");

	// deploy ALI token Comp mock
	const comp_mock =  await AliCompMock.new(H0, {from: a0});

	// enable all permissions on the ALI token Comp mock
	await comp_mock.updateFeatures(FEATURE_ALL, {from: a0});

	// return the mock
	return comp_mock;
}

/**
 * Deploys ERC1363 acceptor, which can accept ERC1363 transfers/approvals
 *
 * @param a0 smart contract owner, super admin
 * @returns ERC1363Receiver/ERC1363Spender instance
 */
async function erc1363_deploy_acceptor(a0) {
	// smart contracts required
	const ERC1363Mock = artifacts.require("./ERC1363Mock");

	// deploy ERC1363 mock and return
	return await ERC1363Mock.new({from: a0});
}

/**
 * Deploys ChildAliERC20 token with all the features enabled
 *
 * @param a0 smart contract owner, super admin
 * @returns ChildAliERC20 instance
 */
async function child_ali_erc20_deploy(a0) {
	// smart contracts required
	const ChildAliERC20 = artifacts.require("./ChildAliERC20v2");

	// deploy and return the reference to instance
	const token = await ChildAliERC20.new({from: a0});

	// enable all permissions on the token
	await token.updateFeatures(FEATURE_ALL, {from: a0});

	// return the reference
	return token;
}

/**
 * Deploys PolygonAliERC20v2 token with no features enabled
 *
 * @param a0 smart contract owner, super admin
 * @returns PolygonAliERC20v2 instance
 */
async function polygon_ali_erc20_deploy_restricted(a0) {
	// smart contracts required
	const PolygonAliERC20v2 = artifacts.require("./PolygonAliERC20v2");

	// deploy and return the reference to instance
	return await PolygonAliERC20v2.new({from: a0});
}

/**
 * Deploys OpAliERC20v2 token with all the features enabled
 *
 * @param a0 smart contract owner, super admin
 * @param bridge_address opBNB StandardBridge address
 * @param remote_token_address remote (L2) token address
 * @returns OpAliERC20v2 instance
 */
async function op_ali_erc20_deploy(a0, bridge_address, remote_token_address) {
	// deploy ALI token
	const ali = await op_ali_erc20_deploy_restricted(a0, bridge_address, remote_token_address);

	// enable all permissions on the ALI token
	await ali.updateFeatures(FEATURE_ALL, {from: a0});

	// return the reference
	return ali;
}

/**
 * Deploys OpAliERC20v2 token with no features enabled
 *
 * @param a0 smart contract owner, super admin
 * @param bridge_address opBNB StandardBridge address
 * @param remote_token_address remote (L2) token address
 * @returns OpAliERC20v2 instance
 */
async function op_ali_erc20_deploy_restricted(a0, bridge_address, remote_token_address) {
	// smart contracts required
	const OpAliERC20v2 = artifacts.require("./OpAliERC20v2");

	// deploy ALI token and return the reference
	return await OpAliERC20v2.new(bridge_address, remote_token_address, {from: a0});
}

// export public deployment API
module.exports = {
	ali_erc20_deploy,
	ali_erc20_deploy_restricted,
	ali_erc20_deploy_comp_mock,
	erc1363_deploy_acceptor,
	child_ali_erc20_deploy,
	polygon_ali_erc20_deploy_restricted,
	op_ali_erc20_deploy,
	op_ali_erc20_deploy_restricted,
};
