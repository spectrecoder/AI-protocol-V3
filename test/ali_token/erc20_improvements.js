// Alethea ERC20: ERC20 Improvements Tests

// Zeppelin test helpers
const {
	BN,
	constants,
	expectEvent,
	expectRevert,
} = require("@openzeppelin/test-helpers");
const {
	assert,
	expect,
} = require("chai");
const {
	ZERO_ADDRESS,
	ZERO_BYTES32,
	MAX_UINT256,
} = constants;

// token constants
const {TOTAL_SUPPLY: ALI_S0} = require("./include/ali_erc20_constants");

// deployment routines in use
const {
	ali_erc20_deploy,
} = require("./include/deployment_routines");

// run tests for ERC20 improvements required
contract("ERC20: ERC20 Improvements Required", function(accounts) {
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

			// Support for atomic allowance modification, resolution of well-known ERC20 issue with approve
			// – is checked in a separate Zeppelin ERC20 test file

			describe("It should be possible to set ERC20 allowance to “unlimited” value (2**256-1)", function() {
				const owner = H0;
				const to = a1;
				const spender = a2;
				const valueToSpend = initial_supply;
				describe("when allowance is *not* set to “unlimited”", function() {
					// initial allowance value: not “unlimited”
					const oldValue = MAX_UINT256.subn(1);
					// new allowance value
					const value = oldValue.sub(valueToSpend);
					beforeEach(async function() {
						await token.approve(spender, oldValue, {from: owner});
					});
					describe("transfer on behalf changes the allowance", function() {
						let receipt;
						beforeEach(async function() {
							receipt = await token.transferFrom(owner, to, valueToSpend, {from: spender});
						});
						it("changes allowance value", async function() {
							expect(await token.allowance(owner, spender)).to.be.bignumber.that.equals(value);
						});
						it("emits improved Approval event (arXiv:1907.00903)", async function() {
							expectEvent(receipt, "Approval", {owner, spender, oldValue, value});
						});
						it("emits Approval event", async function() {
							expectEvent(receipt, "Approval", {owner, spender, value});
						});
					});
				});
				describe("when allowance is set to “unlimited”", function() {
					// initial allowance value: not “unlimited”
					const oldValue = MAX_UINT256;
					// new allowance value: not changed
					const value = oldValue;
					beforeEach(async function() {
						await token.approve(spender, oldValue, {from: owner});
					});
					describe("transfer on behalf doesn't change the allowance", function() {
						let receipt;
						beforeEach(async function() {
							receipt = await token.transferFrom(owner, to, valueToSpend, {from: spender});
						});
						it("doesn't change allowance value", async function() {
							expect(await token.allowance(owner, spender)).to.be.bignumber.that.equals(value);
						});
						it("doesn't emit improved Approval event (arXiv:1907.00903)", async function() {
							expectEvent.notEmitted(receipt, "Approval");
						});
						it("doesn't emit Approval event", async function() {
							expectEvent.notEmitted(receipt, "Approval");
						});
					});
				});
			});
		});
	}

	// run test suite
	test_suite("AliERC20v2", ali_erc20_deploy, ALI_S0);
});
