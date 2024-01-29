// Coinbase EIP3009 Tests Runner
// See https://github.com/CoinbaseStablecoin/eip-3009/blob/master/test/

// token constants
const {TOTAL_SUPPLY: ALI_S0} = require("./include/ali_erc20_constants");

// Coinbase EIP3009 unit tests – delivered as behaviours
const {shouldBehaveLikeEIP3009} = require("./include/coinbase/EIP3009.behavior");

// deployment routines in use
const {
	ali_erc20_deploy,
} = require("./include/deployment_routines");

// run Coinbase EIP3009 tests
contract("ERC20: Coinbase EIP3009 Tests", function(accounts) {
	// extract accounts to be used:
	// A0 – special default zero account accounts[0] used by Truffle, reserved
	// a0 – deployment account having all the permissions, reserved
	// H0 – initial token holder account
	// a1, a2,... – working accounts to perform tests on
	const [A0, a0, H0, a1, a2] = accounts;

	// define test suite
	function test_suite(suite_name, deployment_fn, initial_supply) {
		describe(suite_name, function() {
			// deploy token
			let token;
			beforeEach(async function() {
				token = await deployment_fn.call(this, a0, H0, initial_supply);
			});

			{
				// Coinbase global setup
				beforeEach(async function() {
					// Coinbase uses this.token shortcut to access token instance
					this.token = token;
				});

				// execute Coinbase EIP3009 tests as behavior
				shouldBehaveLikeEIP3009(initial_supply, H0, a1);
			}
		});
	}

	// run test suite
	test_suite("AliERC20v2", ali_erc20_deploy, ALI_S0);
});
