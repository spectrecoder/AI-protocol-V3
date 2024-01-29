/**
 * Deploys AccessControl contract
 *
 * @param a0 smart contract deployer, owner, super admin
 * @returns AccessControl instance
 */
async function deploy_access_control(a0) {
	// deploy AccessControlMock
	const AccessControlMock = artifacts.require("AccessControlMock");

	// deploy and return the instance
	return await AccessControlMock.new(a0, {from: a0});
}

/**
 * Deploys UpgradeableAccessControl
 *
 * @param a0 smart contract deployer, owner, super admin
 * @param version version number to deploy, optional
 * @returns UpgradeableAccessControl instance
 */
async function deploy_upgradeable_ac(a0, version = 1) {
	// smart contracts required
	const UpgradeableAccessControl = artifacts.require("UpgradeableAccessControl" + (version || ""));

	// deploy and return
	return await UpgradeableAccessControl.new({from: a0});
}

/**
 * Deploys UpgradeableAccessControl via ERC1967Proxy
 *
 * @param a0 smart contract deployer, owner, super admin
 * @param version version number to deploy, optional
 * @returns ERC1967Proxy –> UpgradeableAccessControl instance
 */
async function deploy_erc1967_upgradeable_ac(a0, version = 1) {
	// smart contracts required
	const UpgradeableAccessControl = artifacts.require("UpgradeableAccessControl" + (version || ""));
	const Proxy = artifacts.require("ERC1967Proxy");

	// deploy the instance
	const instance = await UpgradeableAccessControl.new({from: a0});

	// prepare the initialization call bytes
	const init_data = instance.contract.methods.postConstruct().encodeABI();

	// deploy proxy, and initialize the impl (inline)
	const proxy = await Proxy.new(instance.address, init_data, {from: a0});

	// wrap the proxy into the impl ABI and return both proxy and instance
	return {proxy: await UpgradeableAccessControl.at(proxy.address), implementation: instance};
}

// export public deployment API
module.exports = {
	deploy_access_control,
	deploy_upgradeable_ac,
	deploy_erc1967_upgradeable_ac,
}
