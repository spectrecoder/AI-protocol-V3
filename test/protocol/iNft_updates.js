// iNFT: update (increase/decrease) locked ALI tokens tests

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

// deployment routines in use
const {
	ali_erc20_deploy,
	revenants_erc721_deploy,
	persona_deploy,
	intelligent_nft_deploy,
} = require("./include/deployment_routines");

// run iNFT update ALI tests
contract("iNFT: update (increase/decrease) locked ALI tests", function(accounts) {
	// extract accounts to be used:
	// A0 – special default zero account accounts[0] used by Web3, reserved
	// a0 – deployment account having all the permissions, reserved
	// H0 – initial token holder account
	// a1, a2,... – working accounts to perform tests on
	const [A0, a0, H0, a1, a2, a3] = accounts;

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
			await ali.transfer(iNft.address, deposit_value, {from: owner});
			await iNft.mint(iNft_id, deposit_value, persona.address, persona_id, nft.address, nft_id, {from: a0});
		});

		describe("increasing ALI", function() {
			it("fails if value is zero", async function() {
				await expectRevert(iNft.increaseAli(iNft_id, 0, {from: a0}), "zero value");
			});
			it("fails if iNFT doesn't exist", async function() {
				await ali.transfer(iNft.address, deposit_value, {from: owner});
				await expectRevert(iNft.increaseAli(0, deposit_value, {from: a0}), "iNFT doesn't exist");
			});
			it("fails if ALI tokens are not yet transferred", async function() {
				await expectRevert(iNft.increaseAli(iNft_id, deposit_value, {from: a0}), "ALI tokens not yet transferred");
			});
			describe("succeeds otherwise", async function() {
				let receipt;
				beforeEach(async function() {
					await ali.transfer(iNft.address, deposit_value, {from: owner});
					receipt = await iNft.increaseAli(iNft_id, deposit_value, {from: a0});
				});
				it("cumulative ALI obligation increases as expected", async function() {
					expect(await iNft.aliBalance()).to.be.bignumber.that.equals(deposit_value.muln(2));
				});
				it("locked ALI value increases as expected", async function() {
					expect(await iNft.lockedValue(iNft_id)).to.be.bignumber.that.equals(deposit_value.muln(2));
				});
				it('"Updated" event is emitted', async function() {
					expectEvent(receipt, "Updated", {
						_by: a0,
						_owner: owner,
						_recordId: new BN(iNft_id),
						_oldAliValue: deposit_value,
						_newAliValue: deposit_value.muln(2),
					})
				});
			});
		});
		describe("decreasing ALI", function() {
			it("fails if value is zero", async function() {
				await expectRevert(iNft.decreaseAli(iNft_id, 0, owner, {from: a0}), "zero value");
			});
			it("fails if the recipient is zero", async function() {
				await expectRevert(iNft.decreaseAli(iNft_id, deposit_value, ZERO_ADDRESS, {from: a0}), "zero address");
			});
			it("fails if iNFT doesn't exist", async function() {
				await expectRevert(iNft.decreaseAli(0, deposit_value, owner, {from: a0}), "iNFT doesn't exist");
			});
			it("fails if there is not enough ALI on the iNFT", async function() {
				await expectRevert(iNft.decreaseAli(iNft_id, deposit_value.addn(1), owner, {from: a0}), "not enough ALI");
			});
			describe("succeeds otherwise", async function() {
				let receipt;
				beforeEach(async function() {
					receipt = await iNft.decreaseAli(iNft_id, deposit_value, owner, {from: a0});
				});
				it("cumulative ALI obligation decreases as expected", async function() {
					expect(await iNft.aliBalance()).to.be.bignumber.that.equals("0");
				});
				it("locked ALI value decreases as expected", async function() {
					expect(await iNft.lockedValue(iNft_id)).to.be.bignumber.that.equals("0");
				});
				it('"Updated" event is emitted', async function() {
					expectEvent(receipt, "Updated", {
						_by: a0,
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
