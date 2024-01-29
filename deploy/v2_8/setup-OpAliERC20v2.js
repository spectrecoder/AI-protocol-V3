// run: npx hardhat deploy --network base_goerli --tags setup-OpAliERC20v2

// script is built for hardhat-deploy plugin:
// A Hardhat Plugin For Replicable Deployments And Easy Testing
// https://www.npmjs.com/package/hardhat-deploy

// BN utils
const {
	toBN,
	print_amt,
} = require("../../scripts/include/bn_utils");

// ACL token features and roles
const {
	FEATURE_ALL,
} = require("../../scripts/include/features_roles");

// deployment utils (contract state printers)
const {
	print_contract_details,
} = require("../../scripts/deployment_utils");

// to be picked up and executed by hardhat-deploy plugin
module.exports = async function({deployments, getChainId, getNamedAccounts, getUnnamedAccounts}) {
	// print some useful info on the account we're using for the deployment
	const chainId = await getChainId();
	const accounts = await web3.eth.getAccounts();
	// do not use the default account for tests
	const A0 = network.name === "hardhat"? accounts[1]: accounts[0];
	const nonce = await web3.eth.getTransactionCount(A0);
	const balance = await web3.eth.getBalance(A0);

	// print initial debug information
	console.log("script: %o", require("path").basename(__filename));
	console.log("network %o %o", chainId, network.name);
	console.log("accounts: %o, service account %o, nonce: %o, balance: %o ETH", accounts.length, A0, nonce, print_amt(balance));

	// the script is designed to be run in L2 only
	assert(
		network.name === "base_mainnet" || network.name === "base_goerli"
		|| network.name === "opBnb" || network.name === "opBnb_testnet"
		|| network.name === "localhost" || network.name === "hardhat",
		"unsupported network: " + network.name
	);

	// setup OpAliERC20v2
	{
		// get deployment details
		const deployment = await deployments.get("OpAliERC20v2");
		const contract = new web3.eth.Contract(deployment.abi, deployment.address);

		// print proxy info, and determine if transfers are enabled
		const {features} = await print_contract_details(A0, deployment.abi, deployment.address);

		// verify if transfers are enabled and enable if required
		const requested_features = toBN(FEATURE_ALL);
		if(!features.eq(requested_features)) {
			// prepare the updateFeatures call bytes for the contract call
			const call_data = contract.methods.updateFeatures(requested_features).encodeABI();

			// update the features as required
			const receipt = await deployments.rawTx({
				from: A0,
				to: deployment.address,
				data: call_data, // updateFeatures(requested_features)
			});
			console.log("OpAliERC20v2.updateFeatures(%o): %o", requested_features.toString(2), receipt.transactionHash);
		}
	}
};

// Tags represent what the deployment script acts on. In general, it will be a single string value,
// the name of the contract it deploys or modifies.
// Then if another deploy script has such tag as a dependency, then when the latter deploy script has a specific tag
// and that tag is requested, the dependency will be executed first.
// https://www.npmjs.com/package/hardhat-deploy#deploy-scripts-tags-and-dependencies
module.exports.tags = ["setup-OpAliERC20v2", "v2_8", "setup", "L2", "l2"];
module.exports.dependencies = ["OpAliERC20v2"];
