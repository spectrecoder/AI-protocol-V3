// Alethea Polygon ERC20: Deposit/Withdraw Tests
// note: mint capabilities are disabled after token deployment into mainnet

// Zeppelin test helpers
const { BN, constants, expectEvent, expectRevert } = require("@openzeppelin/test-helpers");
const { assert, expect } = require("chai");
const { ZERO_ADDRESS, ZERO_BYTES32, MAX_UINT256 } = constants;

// token constants
const { TOTAL_SUPPLY: S0 } = require("./include/ali_erc20_constants");

// ACL token features and roles
const {
	FEATURE_OWN_BURNS,
	FEATURE_BURNS_ON_BEHALF,
	ROLE_TOKEN_CREATOR,
	ROLE_TOKEN_DESTROYER,
} = require("../include/features_roles");

// deployment routines in use
const { polygon_ali_erc20_deploy_restricted } = require("./include/deployment_routines");

// run in-depth deposit/withdraw tests
contract("PolygonAliERC20: Deposit/Withdraw", function (accounts) {
	// extract accounts to be used:
	// A0 – special default zero account accounts[0] used by Truffle, reserved
	// a0 – deployment account having all the permissions, reserved
	// H0 – initial token holder account
	// a1, a2,... – working accounts to perform tests on
	const [A0, a0, H0, a1, a2] = accounts;

	let ali;
	beforeEach(async function () {
		ali = await polygon_ali_erc20_deploy_restricted(a0);
		await ali.deposit(H0, web3.eth.abi.encodeParameter("uint256", S0), {from: a0});
	});

	const by = a1;
	const to = H0;
	const from = H0;
	const value = S0;
	describe("Deposit", function () {
		function behaves_like_deposit(by, to, value) {
			it("when the recipient is zero address – deposit reverts", async function () {
				await expectRevert(
					ali.deposit(ZERO_ADDRESS, web3.eth.abi.encodeParameter("uint256", value), { from: by }),
					"zero address"
				);
			});
			it("when amount is too big and causes total supply overflow – deposit reverts", async function () {
				await expectRevert(
					ali.deposit(to, web3.eth.abi.encodeParameter("uint256", MAX_UINT256), { from: by }),
					"zero value or arithmetic overflow"
				);
			});
			it("when amount is zero – deposit reverts", async function () {
				await expectRevert(
					ali.deposit(to, web3.eth.abi.encodeParameter("uint256", 0), { from: by }),
					"zero value or arithmetic overflow"
				);
			});
			it("when amount is too big to fit into uint192 – deposit reverts", async function () {
				await expectRevert(
					ali.deposit(to, web3.eth.abi.encodeParameter("uint256", new BN(2).pow(new BN(192))), { from: by }),
					"total supply overflow (uint192)"
				);
			});
			describe("otherwise (when recipient and amount are valid)", function () {
				let receipt;
				beforeEach(async function () {
					receipt = await ali.deposit(to, web3.eth.abi.encodeParameter("uint256", value), { from: by });
				});
				it("total supply increases", async function () {
					expect(await ali.totalSupply()).to.be.a.bignumber.that.equals(S0.add(value));
				});
				it("recipient balance increases", async function () {
					expect(await ali.balanceOf(to)).to.be.a.bignumber.that.equals(S0.add(value));
				});
				it("emits Minted event", async function () {
					expectEvent(receipt, "Minted", { by, to, value });
				});
				it("emits improved Transfer event (arXiv:1907.00903)", async function () {
					expectEvent(receipt, "Transfer", { by, from: ZERO_ADDRESS, to, value });
				});
				it("emits ERC20 Transfer event", async function () {
					expectEvent(receipt, "Transfer", { from: ZERO_ADDRESS, to, value });
				});
			});
		}

		describe("when performed by TOKEN_CREATOR", function () {
			beforeEach(async function () {
				await ali.updateRole(by, ROLE_TOKEN_CREATOR, { from: a0 });
			});
			behaves_like_deposit(by, to, value);
		});
		it("when performed not by TOKEN_CREATOR – deposit reverts", async function () {
			await expectRevert(
				ali.deposit(to, web3.eth.abi.encodeParameter("uint256", value), { from: by }),
				"access denied"
			);
		});
	});
	describe("Withdraw", function () {
		function withdraw_reverts(by, from, value, msg) {
			beforeEach(async function () {
				await ali.deposit(from, web3.eth.abi.encodeParameter("uint256", value), { from: a0 });
			});
			it("withdraw reverts", async function () {
				await expectRevert(ali.withdraw(value, { from: by }), msg);
			});
		}
		function execute_withdraw_scenarios(by, from, value) {
			function behaves_like_withdraw(by, from, value) {
				let s1, b1, receipt;
				beforeEach(async function () {
					s1 = await ali.totalSupply();
					b1 = await ali.balanceOf(from);
					receipt = await ali.withdraw(value, { from: by });
				});
				it("total supply decreases", async function () {
					expect(await ali.totalSupply()).to.be.a.bignumber.that.equals(s1.sub(value));
				});
				it("supplier balance decreases", async function () {
					expect(await ali.balanceOf(from)).to.be.a.bignumber.that.equals(b1.sub(value));
				});
				it("emits Burnt event", async function () {
					expectEvent(receipt, "Burnt", { by, from, value });
				});
				it("emits improved Transfer event (arXiv:1907.00903)", async function () {
					expectEvent(receipt, "Transfer", { by, from, to: ZERO_ADDRESS, value });
				});
				it("emits ERC20 Transfer event", async function () {
					expectEvent(receipt, "Transfer", { from, to: ZERO_ADDRESS, value });
				});
			}

			it("when the amount is zero – withdraw reverts", async function () {
				await expectRevert(ali.withdraw(0, { from: a0 }), "zero value burn");
			});
			it("when supplier doesn't have enough tokens – withdraw reverts", async function () {
				await expectRevert(ali.withdraw(S0.addn(1), { from: a0 }), "burn amount exceeds balance");
			});
			describe("when amount and supplier address are correct", function () {
				behaves_like_withdraw(by, from, value);
			});
		}

		describe("when withdrawing own tokens", function () {
			const by = from;
			describe("when OWN_BURNS is enabled", function () {
				beforeEach(async function () {
					await ali.updateFeatures(FEATURE_OWN_BURNS, { from: a0 });
				});
				execute_withdraw_scenarios(by, from, value);
			});
			describe("when OWN_BURNS is not enabled", function () {
				withdraw_reverts(by, from, value, "burns are disabled");
			});
		});
	});
});
