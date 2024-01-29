// https://hardhat.org/plugins/solidity-coverage.html
// https://github.com/sc-forks/solidity-coverage#config-options
module.exports = {
	// Ganache only: ganache-core options
	// https://github.com/trufflesuite/ganache-core/tree/master#options
/*
	providerOptions: {
		host: "localhost",
		network_id: 0xeeeb04de,
		port: 8669,
		default_balance_ether: 10000,
		total_accounts: 35,
		// gasLimit: 0xffffffff,
		gasPrice: 1,
	},
*/
	// Array of contracts or folders (with paths expressed relative to the contracts directory)
	// that should be skipped when doing instrumentation.
	skipFiles: [
		"interfaces",
		"mocks",
	],

	// Set default mocha options here, use special reporters etc.
	mocha: {
		// timeout: 100000,

		// disable mocha timeouts:
		// https://mochajs.org/api/mocha#enableTimeouts
		enableTimeouts: false,
		// https://github.com/mochajs/mocha/issues/3813
		timeout: false,

		// https://github.com/sc-forks/solidity-coverage/blob/master/docs/advanced.md#skipping-tests
		grep: "@skip-on-coverage", // Find everything with this tag
		invert: true               // Run the grep's inverse set.
	},

};
