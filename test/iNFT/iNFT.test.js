const {web3, artifacts, expect} = require("hardhat");

// smart contracts in use
const iNFT = artifacts.require("IntelligentNFTv2");
const ERC20Mock = artifacts.require("ZeppelinERC20Mock");
const ERC165DenierMock = artifacts.require("ERC165DenierMock");

// features and roles
const {
	ROLE_MINTER,
	ROLE_BURNER,
	ROLE_URI_MANAGER,
	FEATURE_TRANSFERS,
	FULL_PRIVILEGES_MASK,
} = require("../include/features_roles");

// Zeppelin helpers
const {BN, constants, expectEvent, expectRevert} = require("@openzeppelin/test-helpers");
const {ZERO_ADDRESS, ZERO_BYTES32} = constants;

const {shouldSupportInterfaces} = require("./SupportsInterface");

// BN utils
const {random_bits} = require("../include/bn_utils");

// deployment routines in use
const {
	ali_erc20_deploy_restricted,
	revenants_erc721_deploy_restricted,
	persona_deploy_restricted,
	intelligent_nft_deploy,
} = require("../protocol/include/deployment_routines");
const {zeppelin_erc721_deploy} = require("../erc721/include/deployment_routines");

contract("constructor tests", (accounts) => {
	const [a0, a1, a2] = accounts;

	let aliContract,
		erc165DenierContract;
	beforeEach(async function() {
		aliContract = await ERC20Mock.new({from: a0});

		await aliContract.mint(a0, web3.utils.toWei("100", "ether"), {from: a0});
		await aliContract.mint(a1, web3.utils.toWei("100", "ether"), {from: a1});
		await aliContract.mint(a2, web3.utils.toWei("100", "ether"), {from: a2});

		erc165DenierContract = await ERC165DenierMock.new({from: a0});
	});

	it("should not deploy with a zero address ali token contract", async function() {
		await expectRevert(iNFT.new(ZERO_ADDRESS, {from: a0}), "ALI Token addr is not set");
	});

	it("should not deploy with a non-erc20 ali token contract", async function() {
		await expectRevert(intelligent_nft_deploy(a0, erc165DenierContract.address), "unexpected ALI Token type");
	});

	it("should deploy with a correct ali token contract and assign default admin role", async function() {
		const {iNft: iNftContract} = await intelligent_nft_deploy(a0, aliContract.address);

		expect(await iNftContract.isSenderInRole(FULL_PRIVILEGES_MASK, {from: a0})).to.be.true;
	});

	it("should deploy with the real ali token contract and assign default admin role", async function() {
		const realAliContract = await ali_erc20_deploy_restricted(a0);
		const {iNft: iNftContract} = await intelligent_nft_deploy(a0, realAliContract.address);

		expect(await iNftContract.isSenderInRole(FULL_PRIVILEGES_MASK, {from: a0})).to.be.true;
	});
});

contract("iNFT tests", function(accounts) {
	const [a0, a1, a2] = accounts;

	let realAiPersonalityContract,
		aiPersonalityContract,
		realTargetNftContract,
		targetNftContract,
		realAliContract,
		aliContract,
		iNftContract,
		erc165DenierContract;
	beforeEach(async function() {
		aliContract = await ERC20Mock.new({from: a0});
		realAliContract = await ali_erc20_deploy_restricted(a0);

		await aliContract.mint(a0, web3.utils.toWei("100", "ether"), {from: a0});
		await aliContract.mint(a1, web3.utils.toWei("100", "ether"), {from: a1});
		await aliContract.mint(a2, web3.utils.toWei("100", "ether"), {from: a2});

		aiPersonalityContract = await zeppelin_erc721_deploy(a0);
		realAiPersonalityContract = await persona_deploy_restricted(a0);

		await realAiPersonalityContract.updateFeatures(FEATURE_TRANSFERS, {from: a0});

		erc165DenierContract = await ERC165DenierMock.new({from: a0})

		targetNftContract = await zeppelin_erc721_deploy(a0);
		realTargetNftContract = await revenants_erc721_deploy_restricted(a0);

		({iNft: iNftContract} = await intelligent_nft_deploy(a0, aliContract.address));
	});

	// helper functions
	const mintRandomRealTargetNft = async(to, n = 1) => {
		const id = random_bits(32);

		for(let i = 0; i < n; i++) {
			await realTargetNftContract.safeMint(to, id.addn(i), ZERO_BYTES32, {from: a0});
		}

		return id;
	}

	const mintRandomRealAiPersonality = async(to, n = 1) => {
		const id = random_bits(32);

		for(let i = 0; i < n; i++) {
			await realAiPersonalityContract.safeMint(to, id.addn(i), ZERO_BYTES32, {from: a0});
		}

		return id;
	}

	const mintRandomTargetNft = async(to, n = 1) => {
		const id = random_bits(64);

		for(let i = 0; i < n; i++) {
			await targetNftContract.mint(to, id.addn(i), {from: a0});
		}

		return id;
	}

	const mintRandomAiPersonality = async(to, n = 1) => {
		const id = random_bits(64);

		for(let i = 0; i < n; i++) {
			await aiPersonalityContract.mint(to, id.addn(i), {from: a0});
		}

		return id;
	}

	const mintRandomAliTokens = async(to) => {
		const amount = random_bits(32);

		await aliContract.mint(to, amount, {from: a0});

		return amount;
	}

	describe("mint", function() {
		it("should not be able to mint without the minter role", async function() {
			const targetNft = await mintRandomTargetNft(a1);
			const aiPersonality = await mintRandomAiPersonality(a1);
			await aiPersonalityContract.transferFrom(a1, iNftContract.address, aiPersonality, {from: a1});
			const aliTokens = await mintRandomAliTokens(a1);
			await aliContract.transfer(iNftContract.address, aliTokens, {from: a1});

			await expectRevert(
				iNftContract.mint(
					random_bits(64), // Random iNFT ID
					aliTokens,
					aiPersonalityContract.address,
					aiPersonality,
					targetNftContract.address,
					targetNft,
					{from: a1}
				),
				"access denied"
			);
		});

		it("should be able to mint with the minter role", async function() {
			const targetNft = await mintRandomTargetNft(a1);
			const aiPersonality = await mintRandomAiPersonality(a1);
			await aiPersonalityContract.transferFrom(a1, iNftContract.address, aiPersonality, {from: a1});
			const aliTokens = await mintRandomAliTokens(a1);
			await aliContract.transfer(iNftContract.address, aliTokens, {from: a1});
			await iNftContract.updateRole(a1, ROLE_MINTER, {from: a0});
			const iNftId = random_bits(64);

			expectEvent(
				await iNftContract.mint(
					iNftId,
					aliTokens,
					aiPersonalityContract.address,
					aiPersonality,
					targetNftContract.address,
					targetNft,
					{from: a1}
				),
				"Minted",
				{
					_by: a1,
					_owner: a1,
					_recordId: iNftId,
					_aliValue: aliTokens,
					_personalityContract: aiPersonalityContract.address,
					_personalityId: aiPersonality,
					_targetContract: targetNftContract.address,
					_targetId: targetNft
				}
			);
		})

		it("should be able to mint with the minter role and the real ai personality contract", async function() {
			const targetNft = await mintRandomTargetNft(a1);
			const realAiPersonality = await mintRandomRealAiPersonality(a1);
			await realAiPersonalityContract.transferFrom(a1, iNftContract.address, realAiPersonality, {from: a1});
			const aliTokens = await mintRandomAliTokens(a1);
			await aliContract.transfer(iNftContract.address, aliTokens, {from: a1})
			await iNftContract.updateRole(a1, ROLE_MINTER, {from: a0});
			const iNftId = random_bits(64);

			expectEvent(
				await iNftContract.mint(
					iNftId,
					aliTokens,
					realAiPersonalityContract.address,
					realAiPersonality,
					targetNftContract.address,
					targetNft,
					{from: a1}
				),
				"Minted",
				{
					_by: a1,
					_owner: a1,
					_recordId: iNftId,
					_aliValue: aliTokens,
					_personalityContract: realAiPersonalityContract.address,
					_personalityId: realAiPersonality,
					_targetContract: targetNftContract.address,
					_targetId: targetNft
				}
			);
		});

		it("should be able to mint with the minter role and the real target nft contract", async function() {
			const realTargetNft = await mintRandomRealTargetNft(a1);
			const aiPersonality = await mintRandomAiPersonality(a1);
			await aiPersonalityContract.transferFrom(a1, iNftContract.address, aiPersonality, {from: a1});
			const aliTokens = await mintRandomAliTokens(a1);
			await aliContract.transfer(iNftContract.address, aliTokens, {from: a1});
			await iNftContract.updateRole(a1, ROLE_MINTER, {from: a0});
			const iNftId = random_bits(64);

			expectEvent(
				await iNftContract.mint(
					iNftId,
					aliTokens,
					aiPersonalityContract.address,
					aiPersonality,
					realTargetNftContract.address,
					realTargetNft,
					{from: a1}
				),
				"Minted",
				{
					_by: a1,
					_owner: a1,
					_recordId: iNftId,
					_aliValue: aliTokens,
					_personalityContract: aiPersonalityContract.address,
					_personalityId: aiPersonality,
					_targetContract: realTargetNftContract.address,
					_targetId: realTargetNft
				}
			);
		});

		it("should not be able to mint with non-erc721 ai personality", async function() {
			const targetNft = await mintRandomTargetNft(a1);
			const aliTokens = await mintRandomAliTokens(a1);
			await aliContract.transfer(iNftContract.address, aliTokens, {from: a1});
			await iNftContract.updateRole(a1, ROLE_MINTER, {from: a0});
			const iNftId = random_bits(64);

			await expectRevert(
				iNftContract.mint(
					iNftId,
					aliTokens,
					erc165DenierContract.address,
					random_bits(64), // Random ID
					targetNftContract.address,
					targetNft,
					{from: a1}
				),
				"personality is not ERC721"
			);
		});

		it("should not be able to mint with non-erc721 target nft", async function() {
			const aiPersonality = await mintRandomAiPersonality(a1);
			await aiPersonalityContract.transferFrom(a1, iNftContract.address, aiPersonality, {from: a1});
			const aliTokens = await mintRandomAliTokens(a1);
			await aliContract.transfer(iNftContract.address, aliTokens, {from: a1});
			await iNftContract.updateRole(a1, ROLE_MINTER, {from: a0});
			const iNftId = random_bits(64);

			await expectRevert(
				iNftContract.mint(
					iNftId,
					aliTokens,
					aiPersonalityContract.address,
					aiPersonality,
					erc165DenierContract.address,
					random_bits(64), // Random ID
					{from: a1}
				),
				"target NFT is not ERC721"
			);
		});

		it("should not be able to mint iNFT with taken id", async function() {
			const targetNft = await mintRandomTargetNft(a1);
			const aiPersonality = await mintRandomAiPersonality(a1);
			await aiPersonalityContract.transferFrom(a1, iNftContract.address, aiPersonality, {from: a1})
			const aliTokens = await mintRandomAliTokens(a1);
			await aliContract.transfer(iNftContract.address, aliTokens, {from: a1});
			await iNftContract.updateRole(a1, ROLE_MINTER, {from: a0});
			const iNftId = random_bits(64);

			await iNftContract.mint(
				iNftId, // Use same iNftId as the first call (causes error)
				aliTokens,
				aiPersonalityContract.address,
				aiPersonality,
				targetNftContract.address,
				targetNft,
				{from: a1}
			);

			const targetNft2 = await mintRandomTargetNft(a2);
			const aiPersonality2 = await mintRandomAiPersonality(a2);
			await aiPersonalityContract.transferFrom(a2, iNftContract.address, aiPersonality2, {from: a2});
			const aliTokens2 = await mintRandomAliTokens(a2);
			await aliContract.transfer(iNftContract.address, aliTokens, {from: a2});
			await iNftContract.updateRole(a2, ROLE_MINTER, {from: a0});

			await expectRevert(
				iNftContract.mint(
					iNftId,
					aliTokens2,
					aiPersonalityContract.address,
					aiPersonality2,
					targetNftContract.address,
					targetNft2,
					{from: a2}
				),
				"iNFT already exists"
			)
		})

		it("should not be able to mint iNFT with taken nft", async function() {
			const targetNft = await mintRandomTargetNft(a1);
			const aiPersonality = await mintRandomAiPersonality(a1);
			await aiPersonalityContract.transferFrom(a1, iNftContract.address, aiPersonality, {from: a1});
			const aliTokens = await mintRandomAliTokens(a1);
			await aliContract.transfer(iNftContract.address, aliTokens, {from: a1});
			await iNftContract.updateRole(a1, ROLE_MINTER, {from: a0});
			const iNftId = random_bits(64);

			await iNftContract.mint(
				iNftId, // Use same iNftId as the first call (causes error)
				aliTokens,
				aiPersonalityContract.address,
				aiPersonality,
				targetNftContract.address,
				targetNft,
				{from: a1}
			);

			const aiPersonality2 = await mintRandomAiPersonality(a2);
			await aiPersonalityContract.transferFrom(a2, iNftContract.address, aiPersonality2, {from: a2});
			const aliTokens2 = await mintRandomAliTokens(a2);
			await aliContract.transfer(iNftContract.address, aliTokens, {from: a2});
			await iNftContract.updateRole(a2, ROLE_MINTER, {from: a0});
			const iNftId2 = random_bits(64);

			await expectRevert(
				iNftContract.mint(
					iNftId2,
					aliTokens2,
					aiPersonalityContract.address,
					aiPersonality2,
					targetNftContract.address,
					targetNft, // Use the same targetNft (causes error)
					{from: a2}
				),
				"NFT is already bound"
			);
		});

		it("should not be able to mint iNFT with taken ai personality", async function() {
			const targetNft = await mintRandomTargetNft(a1);
			const aiPersonality = await mintRandomAiPersonality(a1);
			await aiPersonalityContract.transferFrom(a1, iNftContract.address, aiPersonality, {from: a1});
			const aliTokens = await mintRandomAliTokens(a1);
			await aliContract.transfer(iNftContract.address, aliTokens, {from: a1});
			await iNftContract.updateRole(a1, ROLE_MINTER, {from: a0});
			const iNftId = random_bits(64);

			await iNftContract.mint(
				iNftId,
				aliTokens,
				aiPersonalityContract.address,
				aiPersonality,
				targetNftContract.address,
				targetNft,
				{from: a1}
			);

			const iNftId2 = random_bits(64);
			const targetNft2 = await mintRandomTargetNft(a2);
			const aliTokens2 = await mintRandomAliTokens(a2);
			await aliContract.transfer(iNftContract.address, aliTokens, {from: a2});
			await iNftContract.updateRole(a2, ROLE_MINTER, {from: a0});

			await expectRevert(
				iNftContract.mint(
					iNftId2,
					aliTokens2,
					aiPersonalityContract.address,
					aiPersonality, // Use same aiPersonality as the first call (causes error)
					targetNftContract.address,
					targetNft2,
					{from: a2}
				),
				"personality already linked"
			);
		});

		it("should not be able to mint without transferring ai personality", async function() {
			const targetNft = await mintRandomTargetNft(a1);
			const aiPersonality = await mintRandomAiPersonality(a1);
			const aliTokens = await mintRandomAliTokens(a1);
			await aliContract.transfer(iNftContract.address, aliTokens, {from: a1});
			await iNftContract.updateRole(a1, ROLE_MINTER, {from: a0});
			const iNftId = random_bits(64);

			await expectRevert(
				iNftContract.mint(
					iNftId,
					aliTokens,
					aiPersonalityContract.address,
					aiPersonality,
					targetNftContract.address,
					targetNft,
					{from: a1}
				),
				"personality is not yet transferred"
			);
		});

		it("should not be able to mint when not sending ali tokens promised", async function() {
			const targetNft = await mintRandomTargetNft(a1);
			const aiPersonality = await mintRandomAiPersonality(a1);
			await aiPersonalityContract.transferFrom(a1, iNftContract.address, aiPersonality, {from: a1});
			const aliTokens = await mintRandomAliTokens(a1);
			await iNftContract.updateRole(a1, ROLE_MINTER, {from: a0});
			const iNftId = random_bits(64);

			await expectRevert(
				iNftContract.mint(
					iNftId,
					aliTokens,
					aiPersonalityContract.address,
					aiPersonality,
					targetNftContract.address,
					targetNft,
					{from: a1}
				),
				"ALI tokens not yet transferred"
			);
		});

		it("should be able to mint without sending ali tokens", async function() {
			const targetNft = await mintRandomTargetNft(a1);
			const aiPersonality = await mintRandomAiPersonality(a1);
			await aiPersonalityContract.transferFrom(a1, iNftContract.address, aiPersonality, {from: a1});
			await iNftContract.updateRole(a1, ROLE_MINTER, {from: a0});
			const iNftId = random_bits(64);

			expectEvent(
				await iNftContract.mint(
					iNftId,
					"0",
					aiPersonalityContract.address,
					aiPersonality,
					targetNftContract.address,
					targetNft,
					{from: a1}
				),
				"Minted"
			);
		});

		it("should create correct bindings when minting", async function() {
			const targetNft = await mintRandomTargetNft(a1);
			const aiPersonality = await mintRandomAiPersonality(a1);
			await aiPersonalityContract.transferFrom(a1, iNftContract.address, aiPersonality, {from: a1});
			const aliTokens = await mintRandomAliTokens(a1);
			await aliContract.transfer(iNftContract.address, aliTokens, {from: a1});
			await iNftContract.updateRole(a1, ROLE_MINTER, {from: a0});
			const iNftId = random_bits(64);

			await iNftContract.mint(
				iNftId,
				aliTokens,
				aiPersonalityContract.address,
				aiPersonality,
				targetNftContract.address,
				targetNft,
				{from: a1}
			);

			const binding = await iNftContract.bindings(iNftId);

			expect(binding.personalityContract).to.equal(aiPersonalityContract.address);
			expect(binding.personalityId).to.be.bignumber.that.equals(aiPersonality);
			expect(binding.aliValue).to.be.bignumber.that.equals(aliTokens);
			expect(binding.targetContract).to.equal(targetNftContract.address);
			expect(binding.targetId).to.be.bignumber.that.equals(targetNft);

			expect(await iNftContract.personalityBindings(aiPersonalityContract.address, aiPersonality)).to.be.bignumber.that.equals(iNftId);
		});

		it("should create correct reverse bindings when minting", async function() {
			const targetNft = await mintRandomTargetNft(a1);
			const aiPersonality = await mintRandomAiPersonality(a1);
			await aiPersonalityContract.transferFrom(a1, iNftContract.address, aiPersonality, {from: a1});
			const aliTokens = await mintRandomAliTokens(a1);
			await aliContract.transfer(iNftContract.address, aliTokens, {from: a1});
			await iNftContract.updateRole(a1, ROLE_MINTER, {from: a0});
			const iNftId = random_bits(64);

			await iNftContract.mint(
				iNftId,
				aliTokens,
				aiPersonalityContract.address,
				aiPersonality,
				targetNftContract.address,
				targetNft,
				{from: a1}
			);

			const reverseBinding = await iNftContract.reverseBindings(targetNftContract.address, targetNft);

			expect(reverseBinding).to.be.bignumber.that.equals(iNftId);
		});

		it("should increase total supply by 1 when minting", async function() {
			const initialSupply = await iNftContract.totalSupply();
			const targetNft = await mintRandomTargetNft(a1);
			const aiPersonality = await mintRandomAiPersonality(a1)
			await aiPersonalityContract.transferFrom(a1, iNftContract.address, aiPersonality, {from: a1});
			const aliTokens = await mintRandomAliTokens(a1);
			await aliContract.transfer(iNftContract.address, aliTokens, {from: a1});
			await iNftContract.updateRole(a1, ROLE_MINTER, {from: a0});
			const iNftId = random_bits(64);

			await iNftContract.mint(
				iNftId,
				aliTokens,
				aiPersonalityContract.address,
				aiPersonality,
				targetNftContract.address,
				targetNft,
				{from: a1}
			);

			const newSupply = await iNftContract.totalSupply();

			expect(newSupply).to.be.bignumber.that.equals(initialSupply.addn(1));
		});
	});

	describe("batch mint", function() {
		it("should not be able to batch mint without the minter role", async function() {
			const n = 2;
			const targetNft = await mintRandomTargetNft(a1, n);
			const aiPersonality = await mintRandomAiPersonality(a1, n);
			await aiPersonalityContract.transferFrom(a1, iNftContract.address, aiPersonality, {from: a1});
			await aiPersonalityContract.transferFrom(a1, iNftContract.address, aiPersonality.addn(1), {from: a1});
			const aliTokens = await mintRandomAliTokens(a1).then(t => t.muln(n));
			await aliContract.transfer(iNftContract.address, aliTokens, {from: a1});

			await expectRevert(
				iNftContract.mintBatch(
					random_bits(64), // Random iNFT ID
					aliTokens.divn(n),
					aiPersonalityContract.address,
					aiPersonality,
					targetNftContract.address,
					targetNft,
					n,
					{from: a1}
				),
				"access denied"
			);
		});

		it("should be able to batch mint with the minter role", async function() {
			const n = 2;
			const targetNft = await mintRandomTargetNft(a1, n);
			const aiPersonality = await mintRandomAiPersonality(a1, n);
			await aiPersonalityContract.transferFrom(a1, iNftContract.address, aiPersonality, {from: a1});
			await aiPersonalityContract.transferFrom(a1, iNftContract.address, aiPersonality.addn(1), {from: a1});
			const aliTokens = await mintRandomAliTokens(a1).then(t => t.muln(n));
			await aliContract.transfer(iNftContract.address, aliTokens, {from: a1})
			await iNftContract.updateRole(a1, ROLE_MINTER, {from: a0});
			const iNftId = random_bits(64);

			expectEvent(
				await iNftContract.mintBatch(
					iNftId,
					aliTokens.divn(n),
					aiPersonalityContract.address,
					aiPersonality,
					targetNftContract.address,
					targetNft,
					n,
					{from: a1}
				),
				"Minted",
				{
					_by: a1,
					_owner: a1,
					_recordId: iNftId,
					_aliValue: aliTokens.divn(n),
					_personalityContract: aiPersonalityContract.address,
					_personalityId: aiPersonality,
					_targetContract: targetNftContract.address,
					_targetId: targetNft
				}
			);
		});

		it("should not be able to batch mint with non-erc721 ai personality", async function() {
			const n = 2;
			const targetNft = await mintRandomTargetNft(a1, n);
			const aliTokens = await mintRandomAliTokens(a1).then(t => t.muln(n));
			await aliContract.transfer(iNftContract.address, aliTokens, {from: a1});
			await iNftContract.updateRole(a1, ROLE_MINTER, {from: a0});
			const iNftId = random_bits(64);

			await expectRevert(
				iNftContract.mintBatch(
					iNftId,
					aliTokens.divn(n),
					erc165DenierContract.address,
					random_bits(64), // Random ID
					targetNftContract.address,
					targetNft,
					n,
					{from: a1}
				),
				"personality is not ERC721"
			);
		});

		it("should not be able to mint with non-erc721 target nft", async function() {
			const n = 2;
			const aiPersonality = await mintRandomAiPersonality(a1, n);
			await aiPersonalityContract.transferFrom(a1, iNftContract.address, aiPersonality, {from: a1});
			await aiPersonalityContract.transferFrom(a1, iNftContract.address, aiPersonality.addn(1), {from: a1});
			const aliTokens = await mintRandomAliTokens(a1).then(t => t.muln(n));
			await aliContract.transfer(iNftContract.address, aliTokens, {from: a1});
			await iNftContract.updateRole(a1, ROLE_MINTER, {from: a0});
			const iNftId = random_bits(64);

			await expectRevert(
				iNftContract.mintBatch(
					iNftId,
					aliTokens.divn(n),
					aiPersonalityContract.address,
					aiPersonality,
					erc165DenierContract.address,
					random_bits(64), // Random ID
					n,
					{from: a1}
				),
				"target NFT is not ERC721"
			);
		});

		it("should not be able to mint iNFT with taken id", async function() {
			const n = 2;
			const targetNft = await mintRandomTargetNft(a1, n);
			const aiPersonality = await mintRandomAiPersonality(a1, n);
			await aiPersonalityContract.transferFrom(a1, iNftContract.address, aiPersonality, {from: a1});
			await aiPersonalityContract.transferFrom(a1, iNftContract.address, aiPersonality.addn(1), {from: a1});
			const aliTokens = await mintRandomAliTokens(a1).then(t => t.muln(n));
			await aliContract.transfer(iNftContract.address, aliTokens, {from: a1});
			await iNftContract.updateRole(a1, ROLE_MINTER, {from: a0});
			const iNftId = random_bits(64);

			await iNftContract.mintBatch(
				iNftId, // Use same iNftId as the first call (causes error)
				aliTokens.divn(n),
				aiPersonalityContract.address,
				aiPersonality,
				targetNftContract.address,
				targetNft,
				n,
				{from: a1}
			);

			const targetNft2 = await mintRandomTargetNft(a2);
			const aiPersonality2 = await mintRandomAiPersonality(a2);
			await aiPersonalityContract.transferFrom(a2, iNftContract.address, aiPersonality2, {from: a2});
			const aliTokens2 = await mintRandomAliTokens(a2);
			await aliContract.transfer(iNftContract.address, aliTokens, {from: a2});
			await iNftContract.updateRole(a2, ROLE_MINTER, {from: a0});

			await expectRevert(
				iNftContract.mintBatch(
					iNftId,
					aliTokens2,
					aiPersonalityContract.address,
					aiPersonality2,
					targetNftContract.address,
					targetNft2,
					n,
					{from: a2}
				),
				"iNFT already exists"
			);
		});

		it("should not be able to mint iNFT with taken ai personality", async function() {
			const n = 2
			const targetNft = await mintRandomTargetNft(a1, n);
			const aiPersonality = await mintRandomAiPersonality(a1, n);
			await aiPersonalityContract.transferFrom(a1, iNftContract.address, aiPersonality, {from: a1});
			await aiPersonalityContract.transferFrom(a1, iNftContract.address, aiPersonality.addn(1), {from: a1});
			const aliTokens = await mintRandomAliTokens(a1).then(t => t.muln(n));
			await aliContract.transfer(iNftContract.address, aliTokens, {from: a1});
			await iNftContract.updateRole(a1, ROLE_MINTER, {from: a0});
			const iNftId = random_bits(64);

			await iNftContract.mintBatch(
				iNftId,
				aliTokens.divn(n),
				aiPersonalityContract.address,
				aiPersonality,
				targetNftContract.address,
				targetNft,
				n,
				{from: a1}
			);

			const iNftId2 = random_bits(64);
			const targetNft2 = await mintRandomTargetNft(a2);
			const aliTokens2 = await mintRandomAliTokens(a2);
			await aliContract.transfer(iNftContract.address, aliTokens, {from: a2});
			await iNftContract.updateRole(a2, ROLE_MINTER, {from: a0});

			await expectRevert(
				iNftContract.mintBatch(
					iNftId2,
					aliTokens2,
					aiPersonalityContract.address,
					aiPersonality, // Use same aiPersonality as the first call (causes error)
					targetNftContract.address,
					targetNft2,
					n,
					{from: a2}
				),
				"personality already linked"
			);
		});

		it("should not be able to mint without transferring ai personality", async function() {
			const n = 2;
			const targetNft = await mintRandomTargetNft(a1, n);
			const aiPersonality = await mintRandomAiPersonality(a1, n);
			const aliTokens = await mintRandomAliTokens(a1).then(t => t.muln(n));
			await aliContract.transfer(iNftContract.address, aliTokens, {from: a1});
			await iNftContract.updateRole(a1, ROLE_MINTER, {from: a0});
			const iNftId = random_bits(64);

			await expectRevert(
				iNftContract.mintBatch(
					iNftId,
					aliTokens.divn(n),
					aiPersonalityContract.address,
					aiPersonality,
					targetNftContract.address,
					targetNft,
					n,
					{from: a1}
				),
				"personality is not yet transferred"
			);
		});

		it("should not be able to mint when not sending ali tokens promised", async function() {
			const n = 2;
			const targetNft = await mintRandomTargetNft(a1, n);
			const aiPersonality = await mintRandomAiPersonality(a1, n);
			await aiPersonalityContract.transferFrom(a1, iNftContract.address, aiPersonality, {from: a1});
			await aiPersonalityContract.transferFrom(a1, iNftContract.address, aiPersonality.addn(1), {from: a1});
			const aliTokens = await mintRandomAliTokens(a1).then(t => t.muln(n));
			await iNftContract.updateRole(a1, ROLE_MINTER, {from: a0});
			const iNftId = random_bits(64);

			await expectRevert(
				iNftContract.mintBatch(
					iNftId,
					aliTokens.divn(n),
					aiPersonalityContract.address,
					aiPersonality,
					targetNftContract.address,
					targetNft,
					n,
					{from: a1}
				),
				"ALI tokens not yet transferred"
			);
		});

		it("should be able to mint without sending ali tokens", async function() {
			const n = 2;

			const targetNft = await mintRandomTargetNft(a1, n);
			const aiPersonality = await mintRandomAiPersonality(a1, n);
			await aiPersonalityContract.transferFrom(a1, iNftContract.address, aiPersonality, {from: a1});
			await aiPersonalityContract.transferFrom(a1, iNftContract.address, aiPersonality.addn(1), {from: a1});
			await iNftContract.updateRole(a1, ROLE_MINTER, {from: a0});
			const iNftId = random_bits(64);

			expectEvent(
				await iNftContract.mintBatch(
					iNftId,
					"0",
					aiPersonalityContract.address,
					aiPersonality,
					targetNftContract.address,
					targetNft,
					n,
					{from: a1}
				),
				"Minted"
			);
		})

		it("should create correct bindings when batch minting", async function() {
			const n = 2;
			const targetNft = await mintRandomTargetNft(a1, n);
			const aiPersonality = await mintRandomAiPersonality(a1, n);
			await aiPersonalityContract.transferFrom(a1, iNftContract.address, aiPersonality, {from: a1})
			await aiPersonalityContract.transferFrom(a1, iNftContract.address, aiPersonality.addn(1), {from: a1})
			const aliTokens = await mintRandomAliTokens(a1).then(t => t.muln(n));
			await aliContract.transfer(iNftContract.address, aliTokens, {from: a1})
			await iNftContract.updateRole(a1, ROLE_MINTER, {from: a0});
			const iNftId = random_bits(64);

			await iNftContract.mintBatch(
				iNftId,
				aliTokens.divn(n),
				aiPersonalityContract.address,
				aiPersonality,
				targetNftContract.address,
				targetNft,
				n,
				{from: a1}
			);

			const binding = await iNftContract.bindings(iNftId);

			expect(binding.personalityContract).to.equal(aiPersonalityContract.address);
			expect(binding.personalityId).to.be.bignumber.that.equals(aiPersonality);
			expect(binding.aliValue).to.be.bignumber.that.equals(aliTokens.divn(n));
			expect(binding.targetContract).to.equal(targetNftContract.address);
			expect(binding.targetId).to.be.bignumber.that.equals(targetNft);

			expect(await iNftContract.personalityBindings(aiPersonalityContract.address, aiPersonality)).to.be.bignumber.that.equals(iNftId);

			const binding2 = await iNftContract.bindings(iNftId.addn(1));

			expect(binding2.personalityContract).to.equal(aiPersonalityContract.address)
			expect(binding2.personalityId).to.be.bignumber.that.equals(aiPersonality.addn(1));
			expect(binding2.aliValue).to.be.bignumber.that.equals(aliTokens.divn(n));
			expect(binding2.targetContract).to.equal(targetNftContract.address);
			expect(binding2.targetId).to.be.bignumber.that.equals(targetNft.addn(1));

			expect(await iNftContract.personalityBindings(aiPersonalityContract.address, aiPersonality)).to.be.bignumber.that.equals(iNftId);
		});

		it("should create correct bindings when batch minting", async function() {
			const n = 2;
			const targetNft = await mintRandomTargetNft(a1, n);
			const aiPersonality = await mintRandomAiPersonality(a1, n);
			await aiPersonalityContract.transferFrom(a1, iNftContract.address, aiPersonality, {from: a1})
			await aiPersonalityContract.transferFrom(a1, iNftContract.address, aiPersonality.addn(1), {from: a1})
			const aliTokens = await mintRandomAliTokens(a1).then(t => t.muln(n))
			await aliContract.transfer(iNftContract.address, aliTokens, {from: a1})
			await iNftContract.updateRole(a1, ROLE_MINTER, {from: a0});
			const iNftId = random_bits(64);

			await iNftContract.mintBatch(
				iNftId,
				aliTokens.divn(n),
				aiPersonalityContract.address,
				aiPersonality,
				targetNftContract.address,
				targetNft,
				n,
				{from: a1}
			);

			const reverseBinding = await iNftContract.reverseBindings(targetNftContract.address, targetNft);
			expect(reverseBinding).to.be.bignumber.that.equals(iNftId);

			const reverseBinding2 = await iNftContract.reverseBindings(targetNftContract.address, targetNft.addn(1));
			expect(reverseBinding2).to.be.bignumber.that.equals(iNftId.addn(1));
		});

		it("should increase total supply by n when minting", async function() {
			const n = 2;
			const initialSupply = await iNftContract.totalSupply()
			const targetNft = await mintRandomTargetNft(a1, n);
			const aiPersonality = await mintRandomAiPersonality(a1, n)
			await aiPersonalityContract.transferFrom(a1, iNftContract.address, aiPersonality, {from: a1});
			await aiPersonalityContract.transferFrom(a1, iNftContract.address, aiPersonality.addn(1), {from: a1})
			const aliTokens = await mintRandomAliTokens(a1).then(t => t.muln(n));
			await aliContract.transfer(iNftContract.address, aliTokens, {from: a1});
			await iNftContract.updateRole(a1, ROLE_MINTER, {from: a0});
			const iNftId = random_bits(64);

			await iNftContract.mintBatch(
				iNftId,
				aliTokens.divn(n),
				aiPersonalityContract.address,
				aiPersonality,
				targetNftContract.address,
				targetNft,
				n,
				{from: a1}
			);

			const newSupply = await iNftContract.totalSupply();

			expect(newSupply).to.be.bignumber.that.equals(initialSupply.addn(n));
		});

		it("should not be able to batch mint with n = 1", async function() {
			const n = 1;
			const targetNft = await mintRandomTargetNft(a1, n);
			const aiPersonality = await mintRandomAiPersonality(a1, n);
			await aiPersonalityContract.transferFrom(a1, iNftContract.address, aiPersonality, {from: a1});
			const aliTokens = await mintRandomAliTokens(a1).then(t => t.muln(n));
			await aliContract.transfer(iNftContract.address, aliTokens, {from: a1})
			await iNftContract.updateRole(a1, ROLE_MINTER, {from: a0});
			const iNftId = random_bits(64);

			await expectRevert(
				iNftContract.mintBatch(
					iNftId,
					aliTokens.divn(n),
					aiPersonalityContract.address,
					aiPersonality,
					targetNftContract.address,
					targetNft,
					n,
					{from: a1}
				),
				"n is too small"
			);
		});
	});

	describe("burn", function() {
		let iNftId, aliTokens;
		beforeEach(async function() {
			const targetNft = await mintRandomTargetNft(a1);
			const aiPersonality = await mintRandomAiPersonality(a1);
			await aiPersonalityContract.transferFrom(a1, iNftContract.address, aiPersonality, {from: a1});
			const localAliTokens = await mintRandomAliTokens(a1);
			await aliContract.transfer(iNftContract.address, localAliTokens, {from: a1});
			await iNftContract.updateRole(a1, ROLE_MINTER, {from: a0});
			const localiNftId = random_bits(64);

			await iNftContract.mint(
				localiNftId,
				localAliTokens,
				aiPersonalityContract.address,
				aiPersonality,
				targetNftContract.address,
				targetNft,
				{from: a1}
			);

			iNftId = localiNftId;
			aliTokens = localAliTokens;
		});

		it("should not be able to burn without the burner role", async function() {
			await expectRevert(iNftContract.burn(iNftId, {from: a1}), "access denied");
		});

		it("should be able to burn with the burner role", async function() {
			await iNftContract.updateRole(a1, ROLE_BURNER, {from: a0});

			expectEvent(await iNftContract.burn(iNftId, {from: a1}), "Burnt");
		});

		it("should be able to burn and then re-mint iNFT with the same id", async function() {
			await iNftContract.updateRole(a1, ROLE_BURNER, {from: a0});
			await iNftContract.burn(iNftId, {from: a1});
			const targetNft = await mintRandomTargetNft(a1);
			const aiPersonality = await mintRandomAiPersonality(a1);
			await aiPersonalityContract.transferFrom(a1, iNftContract.address, aiPersonality, {from: a1});
			const aliTokens = await mintRandomAliTokens(a1);
			await aliContract.transfer(iNftContract.address, aliTokens, {from: a1})
			await iNftContract.updateRole(a1, ROLE_MINTER, {from: a0});

			expectEvent(
				await iNftContract.mint(
					iNftId,
					aliTokens,
					aiPersonalityContract.address,
					aiPersonality,
					targetNftContract.address,
					targetNft,
					{from: a1}
				),
				"Minted"
			);
		});

		it("should return erc20 tokens when iNFT is burnt", async function() {
			const initialAliBalance = await aliContract.balanceOf(a1);

			await iNftContract.updateRole(a1, ROLE_BURNER, {from: a0});

			await iNftContract.burn(iNftId, {from: a1});

			const newAliBalance = await aliContract.balanceOf(a1);

			expect(newAliBalance).to.be.bignumber.that.equals(initialAliBalance.add(aliTokens));
		});

		it("should update total supply when iNFT is burnt", async function() {
			const initialSupply = await iNftContract.totalSupply();
			await iNftContract.updateRole(a1, ROLE_BURNER, {from: a0});
			await iNftContract.burn(iNftId, {from: a1});
			const newSupply = await iNftContract.totalSupply();

			expect(newSupply).to.be.bignumber.that.equals(initialSupply.subn(1));
		});

		it("should not be able to burn non-existent iNFT", async function() {
			await iNftContract.updateRole(a1, ROLE_BURNER, {from: a0});

			await expectRevert(
				iNftContract.burn(
					random_bits(256), // Random iNFT id that does not exist (causes error)
					{from: a1}
				),
				"not bound"
			);
		});

		it("should be able to burn without receiving ali tokens", async function() {
			const targetNft = await mintRandomTargetNft(a1);
			const aiPersonality = await mintRandomAiPersonality(a1);
			await aiPersonalityContract.transferFrom(a1, iNftContract.address, aiPersonality, {from: a1});
			await iNftContract.updateRole(a1, ROLE_MINTER, {from: a0});
			const zeroAliiNftId = random_bits(64);

			await iNftContract.mint(
				zeroAliiNftId,
				"0",
				aiPersonalityContract.address,
				aiPersonality,
				targetNftContract.address,
				targetNft,
				{from: a1}
			);

			await iNftContract.updateRole(a1, ROLE_BURNER, {from: a0});

			expectEvent(await iNftContract.burn(zeroAliiNftId, {from: a1}), "Burnt");
		});
	});

	describe("exists", function() {
		it("should return false for an iNFT that does not exist", async function() {
			expect(await iNftContract.exists(random_bits(256))).to.be.false;
		});

		it("should return true for an iNFT that exists", async function() {
			const targetNft = await mintRandomTargetNft(a1);
			const aiPersonality = await mintRandomAiPersonality(a1);
			await aiPersonalityContract.transferFrom(a1, iNftContract.address, aiPersonality, {from: a1});
			const aliTokens = await mintRandomAliTokens(a1);
			await aliContract.transfer(iNftContract.address, aliTokens, {from: a1});
			await iNftContract.updateRole(a1, ROLE_MINTER, {from: a0});
			const iNftId = random_bits(64);

			await iNftContract.mint(
				iNftId,
				aliTokens,
				aiPersonalityContract.address,
				aiPersonality,
				targetNftContract.address,
				targetNft,
				{from: a1}
			);

			expect(await iNftContract.exists(iNftId)).to.be.true;
		});
	});

	describe("set base URI", function() {
		it("should not be able to change base URI without URI manager role", async function() {
			const newVal = "lol";

			await expectRevert(iNftContract.setBaseURI(newVal, {from: a1}), "access denied");
		});

		it("should be able to change base URI with URI manager role", async function() {
			await iNftContract.updateRole(a1, ROLE_URI_MANAGER, {from: a0});
			const newVal = "lol";

			expectEvent(
				await iNftContract.setBaseURI(newVal, {from: a1}),
				"BaseURIUpdated",
				{
					_newVal: newVal
				}
			);
		});
	});

	describe("set token URI", function() {
		let iNftId;
		beforeEach(async function() {
			const targetNft = await mintRandomTargetNft(a1);
			const aiPersonality = await mintRandomAiPersonality(a1);
			await aiPersonalityContract.transferFrom(a1, iNftContract.address, aiPersonality, {from: a1});
			const aliTokens = await mintRandomAliTokens(a1);
			await aliContract.transfer(iNftContract.address, aliTokens, {from: a1});
			await iNftContract.updateRole(a1, ROLE_MINTER, {from: a0});
			const localiNftId = random_bits(64);

			await iNftContract.mint(
				localiNftId,
				aliTokens,
				aiPersonalityContract.address,
				aiPersonality,
				targetNftContract.address,
				targetNft,
				{from: a1}
			);

			iNftId = localiNftId;
		});

		it("should not be able to change token URI without URI manager role", async function() {
			const newVal = "lol";

			await expectRevert(iNftContract.setTokenURI(iNftId, newVal, {from: a1}), "access denied");
		});

		it("should be able to change token URI with URI manager role", async function() {
			await iNftContract.updateRole(a1, ROLE_URI_MANAGER, {from: a0});
			const newVal = "lol"

			expectEvent(
				await iNftContract.setTokenURI(iNftId, newVal, {from: a1}),
				"TokenURIUpdated",
				{
					_newVal: newVal
				}
			);
		});
	});

	describe("token URI", function() {
		let iNftId;
		beforeEach(async function() {
			const targetNft = await mintRandomTargetNft(a1);
			const aiPersonality = await mintRandomAiPersonality(a1);
			await aiPersonalityContract.transferFrom(a1, iNftContract.address, aiPersonality, {from: a1});
			const aliTokens = await mintRandomAliTokens(a1);
			await aliContract.transfer(iNftContract.address, aliTokens, {from: a1});
			await iNftContract.updateRole(a1, ROLE_MINTER, {from: a0});
			const localiNftId = random_bits(64);

			await iNftContract.mint(
				localiNftId,
				aliTokens,
				aiPersonalityContract.address,
				aiPersonality,
				targetNftContract.address,
				targetNft,
				{from: a1}
			);

			iNftId = localiNftId;
		});

		it("should not be able to get token URI of non-existent iNFT", async function() {
			await expectRevert(iNftContract.tokenURI(random_bits(256)), "iNFT doesn't exist");
		})

		it("should return empty string if token and base uris not set", async function() {
			expect(await iNftContract.tokenURI(iNftId)).to.equal("");
		});

		it("should return token URI if set", async function() {
			await iNftContract.updateRole(a1, ROLE_URI_MANAGER, {from: a0});
			const tokenUri = "lol";

			await iNftContract.setTokenURI(iNftId, tokenUri, {from: a1});

			expect(await iNftContract.tokenURI(iNftId)).to.equal(tokenUri);
		})

		it("should return base URI and id if base URI set", async function() {
			await iNftContract.updateRole(a1, ROLE_URI_MANAGER, {from: a0});
			const baseUri = "lol/";

			await iNftContract.setBaseURI(baseUri, {from: a1});

			expect(await iNftContract.tokenURI(iNftId)).to.equal(`${baseUri}${iNftId}`);
		});

		it("should return token URI if both base URI and token URI are set", async function() {
			await iNftContract.updateRole(a1, ROLE_URI_MANAGER, {from: a0});
			const baseUri = "lol/";
			await iNftContract.setBaseURI(baseUri, {from: a1});
			const tokenUri = "wow";
			await iNftContract.setTokenURI(iNftId, tokenUri, {from: a1});

			expect(await iNftContract.tokenURI(iNftId)).to.equal(tokenUri);
		});
	});

	describe("owner of", function() {
		it("should not be able to look up owner of non-existent iNFT", async function() {
			await expectRevert(iNftContract.ownerOf(random_bits(256)), "iNFT doesn't exist");
		});

		it("should return the correct iNFT owner", async function() {
			const targetNft = await mintRandomTargetNft(a1);
			const aiPersonality = await mintRandomAiPersonality(a1);
			await aiPersonalityContract.transferFrom(a1, iNftContract.address, aiPersonality, {from: a1});
			const aliTokens = await mintRandomAliTokens(a1);
			await aliContract.transfer(iNftContract.address, aliTokens, {from: a1});
			await iNftContract.updateRole(a1, ROLE_MINTER, {from: a0});
			const iNftId = random_bits(64);

			await iNftContract.mint(
				iNftId,
				aliTokens,
				aiPersonalityContract.address,
				aiPersonality,
				targetNftContract.address,
				targetNft,
				{from: a1}
			);

			expect(await iNftContract.ownerOf(iNftId)).to.equal(a1);
		});
	});

	after(function() {
		shouldSupportInterfaces([
			"IntelligentNFTv2",
			// "AccessControl"
		], iNftContract)
	});
});
