// OpenZeppelin EIP2612 Tests Runner
// See https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/test/token/ERC20/extensions/

// token constants
const {
	CONTRACT_NAME: ALI_NAME,
	SYMBOL: ALI_SYMBOL,
	TOTAL_SUPPLY: ALI_S0,
} = require("./include/ali_erc20_constants");

// Zeppelin EIP2612 unit tests – delivered as behaviours
const {shouldBehaveLikeEIP2612} = require("./include/zeppelin/EIP2612.behavior");

// deployment routines in use
const {
	ali_erc20_deploy,
} = require("./include/deployment_routines");

// run OpenZeppelin EIP2612 tests
contract("ERC20: OpenZeppelin EIP2612 Tests", function(accounts) {
	// extract accounts to be used:
	// A0 – special default zero account accounts[0] used by Truffle, reserved
	// a0 – deployment account having all the permissions, reserved
	// H0 – initial token holder account
	// a1, a2,... – working accounts to perform tests on
	const [A0, a0, H0, a1, a2] = accounts;

	// define test suite
	function test_suite(suite_name, deployment_fn, initial_supply, contract_name) {
		describe(suite_name, function() {
			// deploy token
			let token;
			beforeEach(async function() {
				token = await deployment_fn.call(this, a0, H0, initial_supply);
			});

			{
				// Zeppelin global setup
				beforeEach(async function() {
					// Zeppelin uses this.token shortcut to access token instance
					this.token = token;
				});

				// execute Zeppelin EIP2612 tests as behavior
				shouldBehaveLikeEIP2612(contract_name, undefined, undefined, H0, a1);
			}
		});
	}

	// run test suite
	test_suite("AliERC20v2", ali_erc20_deploy, ALI_S0, ALI_NAME);
});
