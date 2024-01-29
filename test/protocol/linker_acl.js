// Alethea iNFT Linker: features/roles (ACL) Tests

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

// ACL token features and roles
const {
	not,
	FEATURE_LINKING,
	FEATURE_UNLINKING,
	FEATURE_ALLOW_ANY_NFT_CONTRACT,
	FEATURE_DEPOSITS,
	FEATURE_WITHDRAWALS,
	ROLE_NEXT_ID_MANAGER,
	ROLE_LINK_PRICE_MANAGER,
	ROLE_WHITELIST_MANAGER,
} = require("../include/features_roles");

// deployment routines in use
const {
	revenants_erc721_deploy,
	linker_deploy_restricted,
	LINKER_PARAMS,
} = require("./include/deployment_routines");

// run iNFT Linker features/roles (ACL) tests
contract("iNFT Linker: features/roles (ACL) tests", function(accounts) {
	// extract accounts to be used:
	// A0 – special default zero account accounts[0] used by Web3, reserved
	// a0 – deployment account having all the permissions, reserved
	// H0 – initial token holder account
	// a1, a2,... – working accounts to perform tests on
	const [A0, a0, H0, a1, a2, a3, a4] = accounts;

	// NFT deployment
	let nft, new_nft;
	beforeEach(async function() {
		nft = await revenants_erc721_deploy(a0);
		new_nft = await revenants_erc721_deploy(a0);
	});

	// default operator
	const by = a1;

	// rest of the tokens and protocol deployment
	let ali, persona, iNft, linker;
	beforeEach(async function() {
		({ali, persona, iNft, linker} = await linker_deploy_restricted(a0));
	});

	// mint NFT, AI Personality, and ERC20 tokens to
	const owner = H0;
	const nft_id = 1;
	const persona_id = 1;
	const link_price = new BN(LINKER_PARAMS.LINK_PRICE);
	const new_link_price = link_price.divn(2);
	const deposit_value = link_price.muln(2).divn(3);
	const link_fee = new BN(LINKER_PARAMS.LINK_FEE);
	const new_link_fee = new_link_price.divn(2);
	const new_treasury = a2;
	const next_id = LINKER_PARAMS.NEXT_ID;
	const new_next_id = next_id * 2;
	beforeEach(async function() {
		await nft.mint(owner, nft_id, {from: a0});
		await persona.mint(owner, persona_id, {from: a0});
		await persona.approve(linker.address, persona_id, {from: owner});
		await ali.mint(owner, link_price.add(deposit_value), {from: a0});
		await ali.approve(linker.address, link_price.add(deposit_value), {from: owner});
	});

	async function link() {
		return await linker.link(persona_id, nft.address, nft_id, {from: owner});
	}
	async function unlink() {
		return await linker.unlink(next_id, {from: owner});
	}
	async function unlinkNFT() {
		return await linker.unlinkNFT(nft.address, nft_id, {from: owner});
	}
	async function deposit() {
		return await linker.deposit(next_id, deposit_value, {from: owner});
	}
	async function withdraw() {
		return await linker.withdraw(next_id, deposit_value, {from: owner});
	}
	function link_succeeds() {
		let receipt;
		beforeEach(async function() {
			receipt = await link();
		});
		it("iNFT gets created", async function() {
			expect(await iNft.exists(next_id)).to.be.true;
		});
		it("owner of iNFT is as expected", async function() {
			expect(await iNft.ownerOf(next_id)).to.equal(owner);
		});
		it("AI Personality gets locked", async function() {
			expect(await persona.ownerOf(persona_id)).to.equal(iNft.address);
		});
		it('"Linked" event is emitted', async function() {
			expectEvent(receipt, "Linked", {
				_by: owner,
				_iNftId: new BN(next_id),
				_linkPrice: link_price,
				_linkFee: new BN(0),
				_personalityContract: persona.address,
				_personalityId: new BN(persona_id),
				_targetContract: nft.address,
				_targetId: new BN(nft_id),
			});
		});
	}
	function unlink_succeeds(unlink) {
		let receipt;
		beforeEach(async function() {
			receipt = await unlink.call(this);
		});
		it("iNFT gets destroyed", async function() {
			expect(await iNft.exists(next_id)).to.be.false;
		});
		it("AI Personality gets released", async function() {
			expect(await persona.ownerOf(persona_id)).to.equal(owner);
		});
		it('"Unlinked" event is emitted', async function() {
			expectEvent(receipt, "Unlinked", {
				_by: owner,
				_iNftId: new BN(next_id),
			});
		});
	}
	function deposit_succeeds() {
		let receipt;
		beforeEach(async function() {
			receipt = await deposit();
		});
		it("cumulative ALI obligation increases", async function() {
			expect(await iNft.aliBalance()).to.be.bignumber.that.equals(link_price.add(deposit_value));
		});
		it("locked ALI value increases", async function() {
			expect(await iNft.lockedValue(next_id)).to.be.bignumber.that.equals(link_price.add(deposit_value));
		});
		it('"LinkUpdated" event is emitted', async function() {
			expectEvent(receipt, "LinkUpdated", {
				_by: owner,
				_iNftId: new BN(next_id),
				_aliDelta: deposit_value,
				_feeValue: '0',
			});
		});
	}
	function withdrawal_succeeds() {
		let receipt;
		beforeEach(async function() {
			receipt = await withdraw();
		});
		it("cumulative ALI obligation decreases", async function() {
			expect(await iNft.aliBalance()).to.be.bignumber.that.equals(link_price.sub(deposit_value));
		});
		it("locked ALI value decreases", async function() {
			expect(await iNft.lockedValue(next_id)).to.be.bignumber.that.equals(link_price.sub(deposit_value));
		});
		it('"LinkUpdated" event is emitted', async function() {
			expectEvent(receipt, "LinkUpdated", {
				_by: owner,
				_iNftId: new BN(next_id),
				_aliDelta: deposit_value.neg(),
				_feeValue: "0",
			});
		});
	}
	describe("when FEATURE_LINKING is disabled", function() {
		beforeEach(async function() {
			await linker.updateFeatures(not(FEATURE_LINKING), {from: a0});
		});
		it("linking fails", async function() {
			await expectRevert(link(), "linking is disabled");
		});
	});
	describe("when FEATURE_ALLOW_ANY_NFT_CONTRACT is disabled", function() {
		beforeEach(async function() {
			await linker.updateFeatures(not(FEATURE_ALLOW_ANY_NFT_CONTRACT), {from: a0});
		});
		it("linking to the non-whitelisted NFT fails", async function() {
			await expectRevert(link(), "not a whitelisted NFT contract");
		});
	});
	describe("when FEATURE_LINKING and FEATURE_ALLOW_ANY_NFT_CONTRACT are enabled", function() {
		beforeEach(async function() {
			await linker.updateFeatures(FEATURE_LINKING | FEATURE_ALLOW_ANY_NFT_CONTRACT, {from: a0});
		});
		describe("linking succeeds", function() {
			link_succeeds();
		});
	});
	describe("when iNFT exists (already linked)", function() {
		beforeEach(async function() {
			await linker.updateFeatures(FEATURE_LINKING | FEATURE_ALLOW_ANY_NFT_CONTRACT, {from: a0});
			await link();
		});
		describe("when FEATURE_UNLINKING is disabled", function() {
			beforeEach(async function() {
				await linker.updateFeatures(not(FEATURE_UNLINKING), {from: a0});
			});
			it("unlinking fails", async function() {
				await expectRevert(unlink(), "unlinking is disabled");
			});
			it("unlinking NFT fails", async function() {
				await expectRevert(unlinkNFT(), "unlinking is disabled");
			});
		});
		describe("when FEATURE_UNLINKING is enabled", function() {
			beforeEach(async function() {
				await linker.updateFeatures(FEATURE_UNLINKING, {from: a0});
			});
			describe("unlinking succeeds", function() {
				unlink_succeeds(unlink);
			});
			describe("unlinking succeeds", function() {
				unlink_succeeds(unlinkNFT);
			});
		});
		describe("when FEATURE_DEPOSITS is disabled", function() {
			beforeEach(async function() {
				await linker.updateFeatures(not(FEATURE_DEPOSITS), {from: a0});
			});
			it("deposit fails", async function() {
				await expectRevert(deposit(), "deposits are disabled");
			});
		});
		describe("when FEATURE_DEPOSITS is enabled", function() {
			beforeEach(async function() {
				await linker.updateFeatures(FEATURE_DEPOSITS, {from: a0});
			});
			describe("deposit succeeds", function() {
				deposit_succeeds();
			});
		});
		describe("after link price is set to zero", function() {
			beforeEach(async function() {
				await linker.updateLinkPrice(0, 0, ZERO_ADDRESS, {from: a0});
			});
			describe("when FEATURE_WITHDRAWALS is disabled", function() {
				beforeEach(async function() {
					await linker.updateFeatures(not(FEATURE_WITHDRAWALS), {from: a0});
				});
				it("withdrawal fails", async function() {
					await expectRevert(withdraw(), "withdrawals are disabled");
				});
			});
			describe("when FEATURE_WITHDRAWALS is enabled", function() {
				beforeEach(async function() {
					await linker.updateFeatures(FEATURE_WITHDRAWALS, {from: a0});
				});
				describe("withdrawal succeeds", function() {
					withdrawal_succeeds();
				});
			});
		});
	});

	async function updateNextId() {
		return await linker.updateNextId(new_next_id, {from: by});
	}
	describe("when sender doesn't have ROLE_NEXT_ID_MANAGER permission", function() {
		beforeEach(async function() {
			await linker.updateRole(by, not(ROLE_NEXT_ID_MANAGER), {from: a0});
		});
		it("updateNextId fails", async function() {
			await expectRevert(updateNextId(), "access denied");
		});
	});
	describe("when sender has ROLE_NEXT_ID_MANAGER permission", function() {
		beforeEach(async function() {
			await linker.updateRole(by, ROLE_NEXT_ID_MANAGER, {from: a0});
		});
		describe("updateNextId succeeds", function() {
			let receipt;
			beforeEach(async function() {
				receipt = await updateNextId();
			});
			it("nextId gets set as expected", async function() {
				expect(await linker.nextId()).to.be.bignumber.that.equals(new_next_id + "");
			});
			it('"NextIdChanged" event is emitted', async function() {
				expectEvent(receipt, "NextIdChanged", {
					_by: by,
					_oldVal: new BN(next_id),
					_newVal: new BN(new_next_id),
				});
			});
		});
	});

	async function updateLinkPrice() {
		return await linker.updateLinkPrice(new_link_price, new_link_fee, new_treasury, {from: by});
	}
	describe("when sender doesn't have ROLE_LINK_PRICE_MANAGER permission", function() {
		beforeEach(async function() {
			await linker.updateRole(by, not(ROLE_LINK_PRICE_MANAGER), {from: a0});
		});
		it("updateLinkPrice fails", async function() {
			await expectRevert(updateLinkPrice(), "access denied");
		});
	});
	describe("when sender has ROLE_LINK_PRICE_MANAGER permission", function() {
		beforeEach(async function() {
			await linker.updateRole(by, ROLE_LINK_PRICE_MANAGER, {from: a0});
		});
		describe("updateLinkPrice succeeds", function() {
			let receipt;
			beforeEach(async function() {
				receipt = await updateLinkPrice();
			});
			it("linkPrice gets set as expected", async function() {
				expect(await linker.linkPrice()).to.be.bignumber.that.equals(new_link_price);
			});
			it("linkFee gets set as expected", async function() {
				expect(await linker.linkFee()).to.be.bignumber.that.equals(new_link_fee);
			});
			it("treasury gets set as expected", async function() {
				expect(await linker.feeDestination()).to.equal(new_treasury);
			});
			it('"LinkPriceChanged" event is emitted', async function() {
				expectEvent(receipt, "LinkPriceChanged", {
					_by: by,
					_linkPrice: new_link_price,
					_linkFee: new_link_fee,
					_feeDestination: new_treasury,
				});
			});
		});
	});

	async function whitelistTargetContract() {
		return await linker.whitelistTargetContract(new_nft.address, true, {from: by});
	}
	describe("when sender doesn't have ROLE_WHITELIST_MANAGER permission", function() {
		beforeEach(async function() {
			await linker.updateRole(by, not(ROLE_WHITELIST_MANAGER), {from: a0});
		});
		it("whitelistTargetContract fails", async function() {
			await expectRevert(whitelistTargetContract(), "access denied");
		});
	});
	describe("when sender has ROLE_WHITELIST_MANAGER permission", function() {
		beforeEach(async function() {
			await linker.updateRole(by, ROLE_WHITELIST_MANAGER, {from: a0});
		});
		describe("whitelistTargetContract succeeds", function() {
			let receipt;
			beforeEach(async function() {
				receipt = await whitelistTargetContract();
			});
			it("whitelistTargetContract gets set as expected", async function() {
				expect(await linker.whitelistedTargetContracts(new_nft.address)).to.be.true;
			});
			it('"TargetContractWhitelisted" event is emitted', async function() {
				expectEvent(receipt, "TargetContractWhitelisted", {
					_by: by,
					_targetContract: new_nft.address,
					_oldVal: false,
					_newVal: true,
				});
			});
		})
	});
});
