// OpenZeppelin Voting Tests Runner
// See https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/test/token/ERC20/

// token constants
const {
	CONTRACT_NAME: ALI_CONTRACT_NAME,
	SYMBOL: ALI_SYMBOL,
	TOTAL_SUPPLY: ALI_S0,
} = require("./include/ali_erc20_constants");

// ACL token features and roles
const {
	ROLE_TOKEN_CREATOR,
	ROLE_TOKEN_DESTROYER,
} = require("../include/features_roles");

// Zeppelin unit tests – delivered as behaviours
// voting behaviour as in ERC20Votes.test.js
const {shouldBehaveLikeVoting} = require("./include/zeppelin/Voting.behavior");

// deployment routines in use
const {
	ali_erc20_deploy,
} = require("./include/deployment_routines");

// run OpenZeppelin voting delegation tests
contract("OpenZeppelin Voting Delegation Tests", function(accounts) {
	// extract accounts to be used:
	// A0 – special default zero account accounts[0] used by Truffle, reserved
	// a0 – deployment account having all the permissions, reserved
	// H0 – initial token holder account
	// a1, a2,... – working accounts to perform tests on
	const [A0, a0, H0, a1, a2] = accounts;

	// define test suite
	function test_suite(suite_name, deployment_fn, contract_name = ALI_CONTRACT_NAME, initial_supply = ALI_S0, symbol = ALI_SYMBOL) {
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

					// Zeppelin voting delegation test suite expects initial supply to be zero,
					// it is going to mint total supply tokens itself with A0
					await token.updateRole(A0, ROLE_TOKEN_CREATOR | ROLE_TOKEN_DESTROYER, {from: a0});

					// burn all the tokens: Zeppelin is going to mint them itself
					await token.burn(H0, initial_supply, {from: H0});
				});

				// initialize holder as a1, recipient as a2, ... and so on
				const [ holder, recipient, holderDelegatee, other1, other2 ] = accounts.slice(4);
				// function parameters' names are as in the original Voting tests
				shouldBehaveLikeVoting(contract_name, symbol, initial_supply, holder, recipient, holderDelegatee, other1, other2);
			}
		});
	}

	// run test suite
	test_suite("AliERC20v2", ali_erc20_deploy);
});
