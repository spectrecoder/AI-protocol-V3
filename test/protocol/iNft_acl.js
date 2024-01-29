// Alethea iNFT: features/roles (ACL) Tests

// Zeppelin test helpers
const {
	BN,
	balance,
	constants,
	expectEvent,
	expectRevert,
} = require("@openzeppelin/test-helpers");
const {
	ZERO_ADDRESS,
	ZERO_BYTES32,
	MAX_UINT256,
} = constants;

// Chai test helpers
const {expect} = require("chai");

// web3 utils
const toWei = web3.utils.toWei;

// ACL token features and roles
const {
	not,
	ROLE_MINTER,
	ROLE_BURNER,
	ROLE_EDITOR,
	ROLE_URI_MANAGER,
} = require("../include/features_roles");

// deployment routines in use
const {
	ali_erc20_deploy,
	revenants_erc721_deploy,
	persona_deploy,
	intelligent_nft_deploy,
} = require("./include/deployment_routines");

// run iNFT features/roles (ACL) tests
contract("iNFT: features/roles (ACL) tests", function(accounts) {
	// extract accounts to be used:
	// A0 – special default zero account accounts[0] used by Web3, reserved
	// a0 – deployment account having all the permissions, reserved
	// H0 – initial token holder account
	// a1, a2,... – working accounts to perform tests on
	const [A0, a0, H0, a1, a2, a3, a4] = accounts;

	// prerequisites
	let ali;
	beforeEach(async function() {
		ali = await ali_erc20_deploy(a0, H0);
	});

	// iNFT deployment
	let iNft;
	beforeEach(async function() {
		({iNft} = await intelligent_nft_deploy(a0, ali.address));
	});

	// auxiliary contracts required
	let nft, persona;
	beforeEach(async function() {
		nft = await revenants_erc721_deploy(a0);
		persona = await persona_deploy(a0);
	});

	// default operator
	const by = a1;

	describe("when iNFT exists (is already minted)", function() {
		const owner = H0;
		const nft_id = 1;
		const persona_id = 1;
		const deposit_value = toWei(new BN(2_000), "ether");
		const iNft_id = 1;
		// NOTE: use such a flow only in tests, not for production! (mint iNFT with a Linker only)
		beforeEach(async function() {
			await nft.mint(owner, nft_id, {from: a0});
			await persona.mint(owner, persona_id, {from: a0});
			await persona.transferFrom(owner, iNft.address, persona_id, {from: owner});
			await ali.transfer(iNft.address, deposit_value.muln(2), {from: owner});
			await iNft.mint(iNft_id, deposit_value, persona.address, persona_id, nft.address, nft_id, {from: a0});
		});

		// define functions to test
		async function increaseAli() {
			return await iNft.increaseAli(iNft_id, deposit_value, {from: by});
		}
		async function decreaseAli() {
			return await iNft.decreaseAli(iNft_id, deposit_value, owner, {from: by});
		}

		// test
		describe("when sender doesn't have ROLE_EDITOR permission", function() {
			beforeEach(async function() {
				await iNft.updateRole(by, not(ROLE_EDITOR), {from: a0});
			});
			describe("editing iNFT fails", function() {
				it("increasing ALI fails", async function() {
					await expectRevert(increaseAli(), "access denied");
				});
				it("decreasing ALI fails", async function() {
					await expectRevert(decreaseAli(), "access denied");
				});
			});
		});
		describe("when sender has ROLE_EDITOR permission", function() {
			beforeEach(async function() {
				await iNft.updateRole(by, ROLE_EDITOR, {from: a0});
			});
			describe("editing iNFT succeeds", function() {
				describe("increasing ALI succeeds", async function() {
					let receipt;
					beforeEach(async function() {
						receipt = await increaseAli();
					});
					it("locked ALI value increases", async function() {
						expect(await iNft.lockedValue(iNft_id)).to.be.bignumber.that.equals(deposit_value.muln(2));
					});
					it('"Updated" event is emitted', async function() {
						expectEvent(receipt, "Updated", {
							_by: by,
							_owner: owner,
							_recordId: new BN(iNft_id),
							_oldAliValue: deposit_value,
							_newAliValue: deposit_value.muln(2),
						})
					});
				});
				describe("decreasing ALI succeeds", async function() {
					let receipt;
					beforeEach(async function() {
						receipt = await decreaseAli();
					});
					it("locked ALI value decreases", async function() {
						expect(await iNft.lockedValue(iNft_id)).to.be.bignumber.that.equals("0");
					});
					it('"Updated" event is emitted', async function() {
						expectEvent(receipt, "Updated", {
							_by: by,
							_owner: owner,
							_recordId: new BN(iNft_id),
							_oldAliValue: deposit_value,
							_newAliValue: "0",
						})
					});
				});
			});
		});
	});
});
