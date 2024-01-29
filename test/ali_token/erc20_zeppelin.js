// OpenZeppelin ERC20 Tests Runner
// See https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/test/token/ERC20/

// token constants
const {
	NAME: ALI_NAME,
	SYMBOL: ALI_SYMBOL,
	DECIMALS: ALI_DECIMALS,
	TOTAL_SUPPLY: ALI_S0,
} = require("./include/ali_erc20_constants");

// ACL token features and roles
const {
	ROLE_TOKEN_CREATOR,
	ROLE_TOKEN_DESTROYER,
} = require("../include/features_roles");

// Zeppelin unit tests – delivered as behaviours
// basic ERC20 behaviours
const {
	shouldBehaveLikeERC20,
	shouldBehaveLikeERC20Transfer, // TODO: use it to verify ERC1363 transfers
	shouldBehaveLikeERC20Approve,  // TODO: use it to verify ERC1363 approvals
} = require("./include/zeppelin/ERC20.behavior");
// extended ERC20 behaviours
const {
	shouldHaveBasicProps,
	shouldHaveAtomicApprove,
	shouldHaveMint,
	shouldHaveBurn,
} = require("./include/zeppelin/ERC20.behavior.ext");

// deployment routines in use
const {
	ali_erc20_deploy,
} = require("./include/deployment_routines");

// run OpenZeppelin ERC20 tests
contract("ERC20: OpenZeppelin ERC20 Tests", function(accounts) {
	// extract accounts to be used:
	// A0 – special default zero account accounts[0] used by Truffle, reserved
	// a0 – deployment account having all the permissions, reserved
	// H0 – initial token holder account
	// a1, a2,... – working accounts to perform tests on
	const [A0, a0, H0, a1, a2] = accounts;

	// define test suite
	function test_suite(suite_name, deployment_fn, initial_supply, name, symbol, decimals) {
		describe(suite_name, function() {
			// deploy token
			let token;
			beforeEach(async function() {
				token = await deployment_fn.call(this, a0, H0, initial_supply);
			});

			function run_zeppelin_erc20_tests(S0, H0, a1, a2) {
				// Zeppelin global setup
				beforeEach(async function() {
					// Zeppelin uses this.token shortcut to access token instance
					this.token = token;
				});

				describe("ALI ERC20 shouldBehaveLikeERC20", function() {
					// Zeppelin setup for ERC20 transfers: not required, full set of features already on deployment
					shouldBehaveLikeERC20("", S0, H0, a1, a2);
				});
				describe("ALI shouldHaveMint (ext)", function() {
					// Zeppelin setup for token minting
					beforeEach(async function() {
						// Zeppelin uses default zero account A0 (accounts[0]) to mint tokens,
						// grant this address a permission to mint
						await token.updateRole(A0, ROLE_TOKEN_CREATOR, {from: a0});
					});
					shouldHaveMint("", S0, H0, a1);
				});
				describe("ALI shouldHaveBurn (ext)", function() {
					// Zeppelin setup for token burning
					beforeEach(async function() {
						// Zeppelin uses default zero account A0 (accounts[0]) to burn tokens,
						// grant this address a permission to burn
						await token.updateRole(A0, ROLE_TOKEN_DESTROYER, {from: a0});
					});
					shouldHaveBurn("", S0, H0);
				});
				describe("ALI shouldHaveBasicProps (ext)", function() {
					shouldHaveBasicProps(name, symbol, decimals);
				});
				describe("ALI ERC20 shouldHaveApprove (ext)", function() {
					shouldHaveAtomicApprove("", S0, H0, a1);
				});
			}

			describe("without voting delegation involved", function() {
				run_zeppelin_erc20_tests(initial_supply, H0, a1, a2);
			});
			describe("with voting delegation involved", function() {
				// Zeppelin setup for case with delegation involved
				beforeEach(async function() {
					// delegate voting powers of accounts to themselves
					await token.delegate(H0, {from: H0});
					await token.delegate(a1, {from: a1});
					await token.delegate(a2, {from: a2});
				});
				run_zeppelin_erc20_tests(initial_supply, H0, a1, a2);
			});
		});
	}

	// run test suite
	test_suite("AliERC20v2", ali_erc20_deploy, ALI_S0, ALI_NAME, ALI_SYMBOL, ALI_DECIMALS);
});
