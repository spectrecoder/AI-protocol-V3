// run: npx hardhat deploy --network base_goerli --tags setup-SubjectNFT

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
	FEATURE_TRANSFERS,
	FEATURE_TRANSFERS_ON_BEHALF,
	ROLE_TOKEN_CREATOR,
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

	// setup SubjectNFT
	{
		// get deployment details
		const deployment = await deployments.get("SubjectNFT");
		const contract = new web3.eth.Contract(deployment.abi, deployment.address);

		// SharesFactory_Proxy address
		const {address: factory_address} = await deployments.get("SharesFactory_Proxy");

		// print proxy info, determine features and roles enabled
		const {features, r1} = await print_contract_details(A0, deployment.abi, deployment.address, factory_address);
		const requested_features = toBN(FEATURE_TRANSFERS | FEATURE_TRANSFERS_ON_BEHALF);
		const requested_r1 = toBN(ROLE_TOKEN_CREATOR);

		// verify if features are enabled and enable if required
		if(!features.eq(requested_features)) {
			// prepare the updateFeatures call bytes for the contract call
			const call_data = contract.methods.updateFeatures(requested_features).encodeABI();

			// update the features as required
			const receipt = await deployments.rawTx({
				from: A0,
				to: deployment.address,
				data: call_data, // updateFeatures(requested_features)
			});
			console.log("SubjectNFT.updateFeatures(%o): %o", requested_features.toString(2), receipt.transactionHash);
		}

		// verify if permissions are enabled and enable if required
		if(!r1.eq(requested_r1)) {
			// prepare the updateRole call bytes for the contract call
			const call_data = contract.methods.updateRole(factory_address, requested_r1).encodeABI();

			// update the features as required
			const receipt = await deployments.rawTx({
				from: A0,
				to: deployment.address,
				data: call_data, // updateRole(factory_address, requested_r1)
			});
			console.log("SubjectNFT.updateRole(%o, %o): %o", factory_address, requested_features.toString(2), receipt.transactionHash);
		}
	}
};

// Tags represent what the deployment script acts on. In general, it will be a single string value,
// the name of the contract it deploys or modifies.
// Then if another deploy script has such tag as a dependency, then when the latter deploy script has a specific tag
// and that tag is requested, the dependency will be executed first.
// https://www.npmjs.com/package/hardhat-deploy#deploy-scripts-tags-and-dependencies
module.exports.tags = ["setup-SubjectNFT", "v3_0", "setup"];
module.exports.dependencies = ["SubjectNFT", "SharesFactory_Proxy"];
