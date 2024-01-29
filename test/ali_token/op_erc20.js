// Alethea ERC20: Mint/Burn Tests
// note: mint capabilities are disabled after token deployment into mainnet

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

// ACL token features and roles
const {
	ROLE_TOKEN_CREATOR,
	ROLE_TOKEN_DESTROYER,
} = require("../include/features_roles");

// deployment routines in use
const {op_ali_erc20_deploy_restricted} = require("./include/deployment_routines");

// run in-depth mint/burn tests
contract("OpAliERC20v2: L2/L3 bridge support functions", function(accounts) {
	// extract accounts to be used:
	// A0 – special default zero account accounts[0] used by Truffle, reserved
	// a0 – deployment account having all the permissions, reserved
	// H0 – initial token holder account
	// a1, a2,... – working accounts to perform tests on
	const [A0, a0, H0, a1, a2, a3, a4] = accounts;

	// define test suite
	function test_suite(suite_name, deployment_fn) {
		describe(suite_name, function() {
			const bridge_address = a1;
			const remote_token_address = a2;
			const to = a3;
			const from =  a4;
			const value = new BN(1);

			// deploy token
			let token;
			beforeEach(async function() {
				token = await deployment_fn.call(this, a0, bridge_address, remote_token_address);
			});

			describe("opBNB StandardBridge address gets set correctly", function() {
				it("BRIDGE()", async function() {
					expect(await token.BRIDGE()).to.equal(bridge_address);
				});
				it("bridge() IOptimismMintableERC20 legacy", async function() {
					expect(await token.bridge()).to.equal(bridge_address);
				});
				it("l2Bridge() legacy", async function() {
					expect(await token.l2Bridge()).to.equal(bridge_address);
				});
			});
			describe("remote (L2) token address gets set correctly", function() {
				it("REMOTE_TOKEN()", async function() {
					expect(await token.REMOTE_TOKEN()).to.equal(remote_token_address);
				});
				it("remoteToken() IOptimismMintableERC20 legacy", async function() {
					expect(await token.remoteToken()).to.equal(remote_token_address);
				});
				it("l1Token() ILegacyMintableERC20 legacy", async function() {
					expect(await token.l1Token()).to.equal(remote_token_address);
				});
			});
			it("bridge address has mint permission by default", async function() {
				expect(await token.isSenderInRole(ROLE_TOKEN_CREATOR, {from: bridge_address})).to.be.true;
			});
			it("bridge address has burn permission by default", async function() {
				expect(await token.isSenderInRole(ROLE_TOKEN_DESTROYER, {from: bridge_address})).to.be.true;
			});
			describe("bridge address can mint tokens by default", async function() {
				let receipt;
				beforeEach(async function() {
					receipt = await token.mint(to, value, {from: bridge_address});
				});
				it("token gets minted", async function() {
					expect(await token.balanceOf(to)).to.be.bignumber.that.equals(value);
				});
			});

			describe("when some tokens already exist", function() {
				beforeEach(async function() {
					await token.mint(from, value, {from: bridge_address});
				});
				describe("bridge address can burn tokens by default", async function() {
					let receipt;
					beforeEach(async function() {
						receipt = await token.burn(from, value, {from: bridge_address});
					});
					it("token gets burnt", async function() {
						expect(await token.balanceOf(to)).to.be.bignumber.that.equals("0");
					});
				});
			});
		});
	}

	// run test suite
	test_suite("OpAliERC20v2", op_ali_erc20_deploy_restricted);
});
