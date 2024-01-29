// Alethea ERC20: Voting Delegation Tests

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

// BN constants and utilities
const {random_bn} = require("../include/bn_utils");

// token constants
const {
	DM,
	TOTAL_SUPPLY: ALI_S0,
} = require("./include/ali_erc20_constants");

// deployment routines in use
const {
	ali_erc20_deploy,
} = require("./include/deployment_routines");

// run tests for voting delegation
contract("ERC20: Voting Delegation", function(accounts) {
	// extract accounts to be used:
	// A0 – special default zero account accounts[0] used by Truffle, reserved
	// a0 – deployment account having all the permissions, reserved
	// H0 – initial token holder account
	// a1, a2,... – working accounts to perform tests on
	const [A0, a0, H0, a1, a2] = accounts;

	// define test suite
	function test_suite(suite_name, deployment_fn, S0) {
		describe(suite_name, function() {
			// deploy token
			let token;
			beforeEach(async function() {
				token = await deployment_fn.call(this, a0, H0, S0);
			});

			describe("Voting Delegation Requirements", function() {
				const delegator = a1;
				const delegate = a2;
				let value; // using randomized value for every test
				beforeEach(async function() {
					value = random_bn(1, S0.divn(2));
				});
				describe("Token holders posses voting power associated with their tokens", function() {
					beforeEach(async function() {
						await token.delegate(delegate, {from: delegate});
					});
					describe("when there are no tokens on the balance", function() {
						it("own voting power is zero", async function() {
							expect(await token.votingPowerOf(delegate)).to.be.bignumber.that.equals('0');
						});
					});
					describe("when there are some tokens on the balance", function() {
						beforeEach(async function() {
							await token.transfer(delegate, value, {from: H0});
						});
						it("own voting power is equal to token balance", async function() {
							expect(await token.votingPowerOf(delegate)).to.be.bignumber.that.equals(value);
						});
					});
				});
				describe("Token holders should be able to act as delegators and to delegate their voting power to any other address – a delegate", function() {
					beforeEach(async function() {
						await token.transfer(delegator, value, {from: H0});
					});
					describe("when holder didn't delegate", function() {
						it("delegate voting power is zero", async function() {
							expect(await token.votingPowerOf(delegate)).to.be.bignumber.that.equals('0');
						});
					});
					describe("when holder delegated", function() {
						let receipt;
						beforeEach(async function() {
							receipt = await token.delegate(delegate, {from: delegator});
						});
						it("delegate voting power is equal to delegator token balance", async function() {
							expect(await token.votingPowerOf(delegate)).to.be.bignumber.that.equals(value);
						});
						it("DelegateChanged event is emitted", async function() {
							expectEvent(receipt, "DelegateChanged", {source: delegator, from: ZERO_ADDRESS, to: delegate})
						});
						it("VotingPowerChanged event is emitted", async function() {
							expectEvent(receipt, "VotingPowerChanged", {target: delegate, fromVal: new BN(0), toVal: value})
						});
					});
				});
				describe("Any address may become a delegate; delegates are not necessarily token owners", function() {
					beforeEach(async function() {
						await token.transfer(delegator, value, {from: H0});
						await token.delegate(delegate, {from: delegate});
						await token.delegate(delegate, {from: delegator});
					});
					describe("when delegate has own tokens", function() {
						const value2 = random_bn(1, S0.divn(2));
						beforeEach(async function() {
							await token.transfer(delegate, value2, {from: H0});
						});
						it("delegate voting power is sum of delegate and delegator token balances", async function() {
							expect(await token.votingPowerOf(delegate)).to.be.bignumber.that.equals(value.add(value2));
						});
					});
					describe("when delegate doesn't have own tokens", function() {
						it("delegate voting power is equal to the delegator token balance", async function() {
							expect(await token.votingPowerOf(delegate)).to.be.bignumber.that.equals(value);
						});
					});
				});
				describe("Voting power delegation doesn’t affect token balances", function() {
					beforeEach(async function() {
						await token.delegate(delegate, {from: H0});
					});
					it("delegator voting power is zero", async function() {
						expect(await token.votingPowerOf(H0)).to.be.bignumber.that.equals('0');
					});
					it("delegator token balance remains non-zero", async function() {
						expect(await token.balanceOf(H0)).to.be.bignumber.that.equals(S0);
					});
				});
				describe("It should be possible to retrieve voting power of any delegate for any point in time, defined by the Ethereum block number (block height)", function() {
					const blocks = Math.floor(Math.random() * 192) + 64;
					beforeEach(async function() {
						await token.delegate(delegate, {from: delegate});
						await token.transfer(delegate, value, {from: H0});
					});
					it(`voting power at any block in ${blocks} blocks range is correct`, async function() {
						let lastBlock;
						for(let i = 0; i < blocks; i++) {
							const receipt = await token.delegate(i % 2 === 0? delegate: H0, {from: H0});
							lastBlock = receipt.receipt.blockNumber;
						}
						for(let i = 0; i < blocks; i++) {
							expect(await token.votingPowerAt(delegate, lastBlock - blocks + i), "bock " + i)
								.to.be.bignumber.that.equals(i % 2 === 0? value: S0);
						}
					});
				});
				describe("Delegators should be able to revoke their voting power delegation", function() {
					beforeEach(async function() {
						await token.transfer(delegator, value, {from: H0});
						await token.delegate(delegate, {from: delegator});
					});
					it("delegate's initial voting power is non-zero", async function() {
						expect(await token.votingPowerOf(delegate)).to.be.bignumber.that.equals(value);
					});
					describe("when delegator delegates to the zero address", function() {
						let receipt;
						beforeEach(async function() {
							receipt = await token.delegate(ZERO_ADDRESS, {from: delegator});
						});
						it("voting power of the previous delegate changes to zero", async function() {
							expect(await token.votingPowerOf(delegate)).to.be.bignumber.that.equals('0');
						});
						it("DelegateChanged event is emitted", async function() {
							expectEvent(receipt, "DelegateChanged", {source: delegator, from: delegate, to: ZERO_ADDRESS})
						});
						it("VotingPowerChanged event is emitted", async function() {
							expectEvent(receipt, "VotingPowerChanged", {target: delegate, fromVal: value, toVal: new BN(0)})
						});
					});
				});
			});
		});
	}

	// run test suite
	test_suite("AliERC20v2", ali_erc20_deploy, ALI_S0);
});
