// Alethea ERC20: Deployment Tests

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
// enable chai-subset to allow containSubset, see https://www.chaijs.com/plugins/chai-subset/
require("chai").use(require("chai-subset"));

// token constants
const {TOTAL_SUPPLY: S0} = require("./include/ali_erc20_constants");

// ALI EIP712 helpers
const {eip712_cancel} = require("./include/ali_eip712");
// deployment routines in use
const {
	ali_erc20_deploy_restricted,
} = require("./include/deployment_routines");

// helper functions in use
const {
	expectEventInTransaction
} = require("../include/helper");

// run ERC20 deployment tests
contract("ERC20: Deployment tests", function(accounts) {
	// extract accounts to be used:
	// A0 – special default zero account accounts[0] used by Truffle, reserved
	// a0 – deployment account having all the permissions, reserved
	// H0 – initial token holder account
	const [A0, a0, H0, a1] = accounts;

	// define test suite
	function test_suite(suite_name, deployment_fn) {
		describe(suite_name, function() {
			// deploy token
			let token;
			beforeEach(async function() {
				token = await deployment_fn.call(this, a0, H0, S0);
			});

			function doesnt_deploy(a0, H0) {
				it("deployment reverts", async function() {
					await expectRevert(ali_erc20_deploy_restricted(a0, H0), "_initialHolder not set (zero address)");
				});
			}

			function deploys(a0, H0, S0) {
				it("initial token supply is S0", async function() {
					expect(await token.totalSupply(), "incorrect S0").to.be.a.bignumber.that.equals(S0);
				});
				it("H0 gets the entire initial balance B0 = S0", async function() {
					expect(await token.balanceOf(H0), "B0 ≠ S0").to.be.a.bignumber.that.equals(S0);
				});
				it("H0 doesn't have a delegate", async function() {
					expect(await token.votingDelegates(H0)).to.equal(ZERO_ADDRESS);
				});
				it("initial H0 voting power is zero", async function() {
					expect(await token.votingPowerOf(H0)).to.be.a.bignumber.that.equals('0');
				});
				it("votingPowerHistoryOf(H0) is empty", async function() {
					expect(await token.votingPowerHistoryOf(H0)).to.be.an('array').that.is.empty;
				});
				it("entireSupplyHistory has single element", async function() {
					expect((await token.entireSupplyHistory()).length).to.equal(1);
				});
				it("totalSupplyHistoryLength is one", async function() {
					expect(await token.totalSupplyHistoryLength()).to.be.bignumber.that.equals('1');
				});
				it("emits Minted event", async function() {
					await expectEvent.inConstruction(token, "Minted", {
						by: a0,
						to: H0,
						value: S0
					});
				});
				it("emits improved Transfer event (arXiv:1907.00903)", async function() {
					await expectEventInTransaction(token.transactionHash, "Transfer", [{
						type: "address",
						name: "by",
						indexed: true,
						value: a0,
					}, {
						type: "address",
						name: "from",
						indexed: true,
						value: ZERO_ADDRESS,
					}, {
						type: "address",
						name: "to",
						indexed: true,
						value: H0,
					}, {
						type: "uint256",
						name: "value",
						value: S0,
					}]);
				});
				it("emits ERC20 Transfer event", async function() {
					await expectEventInTransaction(
						token.transactionHash, "Transfer", [{
							type: "address",
							name: "from",
							indexed: true,
							value: ZERO_ADDRESS,
						}, {
							type: "address",
							name: "to",
							indexed: true,
							value: H0,
						}, {
							type: "uint256",
							name: "value",
							value: S0,
						}]);
				});

				// 2 tests just to improve test coverage
				it("coverage: decreaseAllowance(0) fails", async function() {
					await expectRevert(token.decreaseAllowance(a1, 0, {from: H0}), "zero value approval decrease");
				});
				it("", async function() {
					const w = web3.eth.accounts.create();
					const {v, r, s} = await eip712_cancel(token.address, H0, ZERO_BYTES32, w.privateKey);
					await expectRevert(token.cancelAuthorization(H0, ZERO_ADDRESS, v, r, s, {from: H0}), "invalid signature");
				});
			}

			describe("when deployment arguments are incorrect", function() {
				describe("when initial holder H0 is not set (zero)", function() {
					// noinspection UnnecessaryLocalVariableJS
					const H0 = ZERO_ADDRESS;
					doesnt_deploy(a0, H0);
				});
			});
			describe("when deployment arguments are correct", function() {
				describe("when H0 is not a deployment account a0", function() {
					beforeEach(async function() {
						token = await deployment_fn(a0, H0);
					});
					it("H0 doesn't have any permissions", async function() {
						expect(await token.getRole(H0)).to.be.a.bignumber.that.equals('0');
					});

					deploys(a0, H0, S0);
				});
				describe("when H0 is a0", function() {
					const a0 = H0;

					beforeEach(async function() {
						token = await deployment_fn(a0, H0);
					});
					it("H0 preservers full permissions bitmask", async function() {
						expect(await token.getRole(H0)).to.be.a.bignumber.that.equals(MAX_UINT256);
					});

					deploys(a0, H0, S0);
				});
			});
		});
	}

	// run test suite
	test_suite("AliERC20v2", ali_erc20_deploy_restricted);
});
