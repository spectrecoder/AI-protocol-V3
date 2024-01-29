// token locking (transferable optional interface) tests

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

// deployment routines in use, token name and symbol
const {
	lockable_short_erc721_deploy,
	lockable_tiny_erc721_deploy,
} = require("./include/deployment_routines");

// run token locking tests
contract("ERC721: token locking", function(accounts) {
	// extract accounts to be used:
	// A0 – special default zero account accounts[0] used by Truffle, reserved
	// a0 – deployment account having all the permissions, reserved
	// H0 – initial token holder account
	// a1, a2,... – working accounts to perform tests on
	const [A0, a0, H0, a1, a2] = accounts;

	// test suite
	function locking_suite(contract_name, deployment_fn) {
		describe(contract_name, function() {
			// deploy token
			let token;
			beforeEach(async function() {
				token = await deployment_fn.call(this, a0);
			});

			// setup aux constants
			const from = H0;
			const to = a2;
			const tokenId = 1;

			// minting setup
			beforeEach(async function() {
				await token.mint(from, tokenId, {from: a0});
			});

			describe("when token is not transferable", function() {
				beforeEach(async function() {
					await token.setTransferable(tokenId, false, {from: a0});
				});
				it("isTransferable returns false", async function() {
					expect(await token.isTransferable(tokenId)).to.be.false;
				});
				it("token transfer fails", async function() {
					await expectRevert(token.transferFrom(from, to, tokenId, {from}), "locked token");
				});
			});
			describe("when token is transferable", function() {
				beforeEach(async function() {
					await token.setTransferable(tokenId, true, {from: a0});
				});
				it("isTransferable returns true", async function() {
					expect(await token.isTransferable(tokenId)).to.be.true;
				});
				it("token transfer succeeds", async function() {
					await token.transferFrom(from, to, tokenId, {from});
				});
			});
		});
	}

	locking_suite("ShortERC721", lockable_short_erc721_deploy);
	locking_suite("TinyERC721", lockable_tiny_erc721_deploy);
});
