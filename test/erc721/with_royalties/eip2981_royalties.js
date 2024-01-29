// RoyalERC721: EIP-2981 related tests, including ACL

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
	MAX_UINT256,
} = constants;

// ACL token features and roles
const {
	ROLE_ROYALTY_MANAGER,
} = require("../../include/features_roles");

// deployment routines in use, token name and symbol
const {
	royal_nft_deploy
} = require("../include/deployment_routines");

// run eip2981 tests
contract("ERC721: eip2981 royalties", function(accounts) {
	// extract accounts to be used:
	// A0 – special default zero account accounts[0] used by Truffle, reserved
	// a0 – deployment account having all the permissions, reserved
	// H0 – initial token holder account
	// a1, a2,... – working accounts to perform tests on
	const [A0, a0, H0, a1, a2] = accounts;

	// test suite
	function eip2981_royalties_suite(contract_name, deployment_fn) {
		describe(contract_name, function() {
			// deploy token
			let token;
			let defaultRoyaltyReceiver = "0x379e2119f6e0D6088537da82968e2a7ea178dDcF";
			let defaultRoyaltyPercentage = "750";
			beforeEach(async function() {
				token = await deployment_fn.call(this, a0);
				await token.updateRole(A0, ROLE_ROYALTY_MANAGER, { from: a0 });
			});

			describe("eip2981 royalties", () => {
				it("should initialize with the correct default royalty address", async () => {
					expect(await token.royaltyReceiver()).to.equal(defaultRoyaltyReceiver);
				});

				it("should initialize with the correct default royalty percentage", async () => {
					expect(await token.royaltyPercentage()).to.be.bignumber.equal(defaultRoyaltyPercentage); // 7.5%
				});

				it("should calculate the correct amount of fees and receiver address", async () => {
					const price = web3.utils.toWei(new BN(1), "ether");
					const { receiver, royaltyAmount } = await token.royaltyInfo(MAX_UINT256, price);

					expect(receiver, "incorrect receiver").to.equal(defaultRoyaltyReceiver);
					expect(royaltyAmount, "incorrect royalty amount").to.be.bignumber.equal(price.mul(new BN(defaultRoyaltyPercentage)).div(new BN("10000")));
				});

				it("should be able to change royalty info if role uri changer", async () => {
					await token.setRoyaltyInfo(a1, "500", { from: A0 });

					expect(await token.royaltyReceiver(), "incorrect receiver").to.equal(a1);
					expect(await token.royaltyPercentage(), "incorrect royalty amount").to.bignumber.equal("500");
				});

				it("should emit an event when royalty info is changed", async () => {
					expectEvent(
						await token.setRoyaltyInfo(a1, "500", { from: A0 }),
						"RoyaltyInfoUpdated",
						{
							_by: A0,
							_receiver: a1,
							_percentage: "500",
						}
					);
				});

				it("should not be able to change royalty info without ROLE_ROYALTY_MANAGER role", async () => {
					await expectRevert(
						token.setRoyaltyInfo(a1, "500", { from: a1 }),
						"access denied"
					);
				});

				it("should throw if receiver is zero address but royalties are not zero", async () => {
					await expectRevert(
						token.setRoyaltyInfo(ZERO_ADDRESS, "500"),
						"invalid receiver"
					);
				});

				it("should not throw if receiver is zero address and royalties are zero", async () => {
					expectEvent(
						await token.setRoyaltyInfo(ZERO_ADDRESS, "0"),
						"RoyaltyInfoUpdated"
					);
				});
			});
		});
	}

	// batch_minting_suite("ShortERC721", short_erc721_deploy);
	// batch_minting_suite("BurnableShortERC721", burnable_short_erc721_deploy);
	eip2981_royalties_suite("RoyalNFT", royal_nft_deploy);
});
