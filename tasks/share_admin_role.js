// admin role sharing task (testnets only): shares the admin role
// for all the contracts mentioned in config.js for the accounts specified

// Run: npx hardhat share --network goerli --account 0xDdaE907A17BE0C7CE85896077526aAa49Fdaf7Bd

// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
// const hre = require("hardhat");

// we use assert to fail fast in case of any errors
const assert = require("assert");

// BigNumber utils
const {
	print_amt,
	to_number,
} = require("../scripts/include/big_number_utils");

// roles in use
const {
	FULL_PRIVILEGES_MASK,
} = require("../scripts/include/features_roles");

// hardhat task to share the admin role
async function share_admin_role(taskArguments, hre, runSuper) {
	// Hardhat always runs the compile task when running scripts with its command
	// line interface.
	//
	// If this script is run directly using `node` you may want to call compile
	// manually to make sure everything is compiled
	// await hre.run('compile');

	// check if we're on the local hardhat test network
	if (network.name === "hardhat") {
		console.warn(
			"You are trying to deploy a contract to the Hardhat Network, which" +
			"gets automatically created and destroyed every time. Use the Hardhat" +
			" option '--network localhost'"
		);
	}

	// print some useful info on the account we're using for the deployment
	const [A0] = await web3.eth.getAccounts();
	let nonce = await web3.eth.getTransactionCount(A0);
	let balance = await web3.eth.getBalance(A0);
	// print initial debug information
	console.log("network %o", network.name);
	console.log("service account %o, nonce: %o, balance: %o ETH", A0, nonce, print_amt(balance));

	// ensure we're not executing this in the mainnet
	assert(network.name !== "mainnet" && network.name !== "polygon", "use this script in testnet only!");

	// get the account we need to grant the admin role for
	const account = taskArguments["account"];

	// config file contains known deployed addresses, deployment settings
	const Config = require('../scripts/config');

	// a collection of all known addresses (smart contracts and external)
	const conf = Config(network.name);

	// iterate over all the entries in the config
	for(const [contract_name, contract_address] of Object.entries(conf)) {
		// skip the external addresses if any (ex. ALI_H0)
		// TODO: refactor this, implement in a nicer way
		if(contract_name.indexOf("_") >= 0 || !contract_address) {
			continue;
		}

		const AccessControl = await hre.ethers.getContractFactory("AccessControl");
		console.log("Connecting to %o at %o", contract_name, contract_address);

		const contract_instance = await AccessControl.attach(contract_address);
		const features = await contract_instance.features();
		const r0 = await contract_instance.userRoles(A0);
		const r1 = await contract_instance.userRoles(account);
		console.log("Connected to %o at %o:", contract_name, contract_address);

		console.table([
			{"key": "Features", "value": features.toHexString()}, // 2
			{"key": "Deployer Role", "value": r0.toHexString()}, // 16
			{"key": "Role 1", "value": r1.toHexString()}, // 16
		]);

		if(r1.isZero()) {
			console.log(
				'Enabling all roles 0xFF...FF on %o %o for %o',
				contract_name,
				contract_address,
				account
			);
			await contract_instance.updateRole(account, FULL_PRIVILEGES_MASK);
		}
	}

}

// export public module API
module.exports = {
	share_admin_role,
};
