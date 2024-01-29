// Alethea iNFT Linker v2: Tests

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
const {assert, expect} = require("chai");

// web3 utils
const toWei = web3.utils.toWei;

// BN utils
const {random_bn} = require("../include/bn_utils");

// helper functions in use
const {
	expectEventInTransaction
} = require("../include/helper");

// deployment routines in use
const {
	ali_erc20_deploy,
	persona_deploy,
	revenants_erc721_deploy,
	intelligent_nft_deploy,
	LINKER_PARAMS,
	LINKER_PARAMS_V2,
	linker_v2_deploy,
	linker_v2_deploy_pure,
} = require("./include/deployment_routines");

// run iNFT Linker v2 tests
contract("iNFT Linker v2: tests", function(accounts) {
	// extract accounts to be used:
	// A0 – special default zero account accounts[0] used by Web3, reserved
	// a0 – deployment account having all the permissions, reserved
	// H0 – initial token holder account
	// a1, a2,... – working accounts to perform tests on
	const [A0, a0, H0, a1, a2, a3] = accounts;

	let nft;
	beforeEach(async function() {
		nft = await revenants_erc721_deploy(a0);
	});

	const NEXT_ID = new BN(LINKER_PARAMS_V2.NEXT_ID);

	describe("iNFT Linker v2 deployment", function() {
		let ali, persona, iNft;
		let ali_addr, persona_addr, iNft_addr;
		beforeEach(async function() {
			ali = await ali_erc20_deploy(a0, H0);
			persona = await persona_deploy(a0);
			({iNft} = await intelligent_nft_deploy(a0));

			ali_addr = ali.address;
			persona_addr = persona.address;
			iNft_addr = iNft.address;
		});
		it("fails if ALI address is not set", async function() {
			ali_addr = ZERO_ADDRESS; // unset the address
			await expectRevert(
				linker_v2_deploy_pure(a0, ali_addr, persona_addr, iNft_addr),
				"ALI Token addr is not set"
			);
		});
		it("fails if AI Personality address is not set", async function() {
			persona_addr = ZERO_ADDRESS; // unset the address
			await expectRevert(
				linker_v2_deploy_pure(a0, ali_addr, persona_addr, iNft_addr),
				"AI Personality addr is not set"
			);
		});
		it("fails if iNFT address is not set", async function() {
			iNft_addr = ZERO_ADDRESS; // unset the address
			await expectRevert(
				linker_v2_deploy_pure(a0, ali_addr, persona_addr, iNft_addr),
				"iNFT addr is not set"
			);
		});
		it("fails if ALI is not valid ERC20", async function() {
			ali_addr = iNft_addr; // mess up the address
			await expectRevert(
				linker_v2_deploy_pure(a0, ali_addr, persona_addr, iNft_addr),
				"unexpected ALI Token type"
			);
		});
		it("fails if AI Personality is not valid ERC721", async function() {
			persona_addr = iNft_addr; // mess up the address
			await expectRevert(
				linker_v2_deploy_pure(a0, ali_addr, persona_addr, iNft_addr),
				"unexpected AI Personality type"
			);
		});
		it("fails if iNFT is not valid iNFT (IntelligentNFTv2Spec)", async function() {
			iNft_addr = ali_addr; // mess up the address
			await expectRevert(
				linker_v2_deploy_pure(a0, ali_addr, persona_addr, iNft_addr),
				"unexpected iNFT type"
			);
		});
		describe("succeeds with valid ALI, AI Personality, and iNFT", function() {
			let linker;
			beforeEach(async function() {
				linker = await linker_v2_deploy_pure(a0, ali_addr, persona_addr, iNft_addr);
			});
			it("ALI address is set as expected", async function() {
				expect(await linker.aliContract()).to.be.equal(ali_addr);
			});
			it("AI Personality address is set as expected", async function() {
				expect(await linker.personalityContract()).to.be.equal(persona_addr);
			});
			it("iNFT address is set as expected", async function() {
				expect(await linker.iNftContract()).to.be.equal(iNft_addr);
			});
			it("linking price is as expected", async function() {
				expect(await linker.linkPrice()).to.be.bignumber.that.equals(LINKER_PARAMS_V2.LINK_PRICE);
			});
			it("linking fee is as expected", async function() {
				expect(await linker.linkFee()).to.be.bignumber.that.equals(LINKER_PARAMS_V2.LINK_FEE);
			});
			it("fee destination is as expected", async function() {
				expect(await linker.feeDestination()).to.equal(ZERO_ADDRESS);
			});
			it("nextId is as expected", async function() {
				expect(await linker.nextId()).to.be.bignumber.that.equals(NEXT_ID);
			});
			it("no whitelisted contract exists", async function() {
				expect(await linker.whitelistedTargetContracts(nft.address)).to.be.bignumber.that.equals("0");
			});
			it("no whitelisted for linking contract exists", async function() {
				expect(await linker.isAllowedForLinking(nft.address)).to.be.false;
			});
			it("no whitelisted for unlinking contract exists", async function() {
				expect(await linker.isAllowedForUnlinking(nft.address)).to.be.false;
			});
		});
	});
	describe("after iNFT Linker is deployed", function() {
		const nft_owner = a1;
		const persona_owner = a2;
		const persona_id = random_bn(1_000_000, 1_000_000_000);
		const target_id = random_bn(1_000_000, 1_000_000_000);
		const recordId = NEXT_ID;
		const link_price = LINKER_PARAMS.LINK_PRICE;
		const link_fee = LINKER_PARAMS.LINK_FEE;
		const fee_destination = a3;
		const link_deposit = link_price.sub(link_fee);
		let ali, persona, iNft, linker, receipt;
		beforeEach(async function() {
			({ali, persona, iNft, linker} = await linker_v2_deploy(a0));
			await linker.updateLinkPrice(link_price, link_fee, fee_destination, {from: a0});
			await persona.mint(persona_owner, persona_id, {from: a0});
			await nft.mint(nft_owner, target_id, {from: a0});
		});

		function check_burn_succeeds() {
			it("iNFT is destroyed", async function() {
				expect(await iNft.exists(recordId)).to.be.false;
			});
			describe("binding gets erased", function() {
				let binding;
				before(async function() {
					binding = await iNft.bindings(recordId);
				});
				it("personalityId", async function() {
					expect(binding.personalityId).to.be.bignumber.that.equals("0");
				});
				it("aliValue", async function() {
					expect(binding.aliValue).to.be.bignumber.that.equals("0");
				});
				it("targetId", async function() {
					expect(binding.targetId).to.be.bignumber.that.equals("0");
				});
				it("personalityContract", async function() {
					expect(binding.personalityContract).to.equal(ZERO_ADDRESS);
				});
				it("targetContract", async function() {
					expect(binding.targetContract).to.equal(ZERO_ADDRESS);
				});
			});
			it("reverse binding gets erased", async function() {
				expect(await iNft.reverseBindings(nft.address, target_id)).to.be.bignumber.that.equals("0");
			});
			it("personality binding gets erased", async function() {
				expect(await iNft.personalityBindings(persona.address, persona_id)).to.be.bignumber.that.equals("0");
			});
			it("ALI balance of NFT owner increases as expected", async function() {
				expect(await ali.balanceOf(nft_owner)).to.be.bignumber.that.equals(link_deposit);
			});
			it("AI Personality gets returned to NFT owner", async function() {
				expect(await persona.ownerOf(persona_id)).to.equal(nft_owner);
			});
			it('"Unlinked" event is emitted', async function() {
				await expectEvent(receipt, "Unlinked", {
					_by: nft_owner,
					_iNftId: recordId,
				});
			});
		}

		describe("whitelisting the target NFT smart contract", function() {
			it("fails if address to whitelist is zero", async function() {
				await expectRevert(linker.whitelistTargetContract(ZERO_ADDRESS, true, true, {from: a0}), "zero address");
			});
			it("fails if address to whitelist is not a ERC721", async function() {
				await expectRevert(linker.whitelistTargetContract(ali.address, true, true, {from: a0}), "target NFT is not ERC721");
			});
			describe("succeeds otherwise", function() {
				let receipt;
				beforeEach(async function() {
					receipt = await linker.whitelistTargetContract(nft.address, true, true, {from: a0});
				});
				it("specified address gets whitelisted", async function() {
					expect(await linker.whitelistedTargetContracts(nft.address)).to.be.bignumber.that.equals("3");
				});
				it("specified address gets whitelisted for linking", async function() {
					expect(await linker.isAllowedForLinking(nft.address)).to.be.true;
				});
				it("specified address gets whitelisted for unlinking", async function() {
					expect(await linker.isAllowedForUnlinking(nft.address)).to.be.true;
				});
				it('"TargetContractWhitelisted" event is emitted', async function() {
					expectEvent(receipt, "TargetContractWhitelisted", {
						_by: a0,
						_targetContract: nft.address,
						_oldVal: "0",
						_newVal: "3",
					});
				});
			});
		});
		describe("removing target NFT smart contract from the whitelist", function() {
			beforeEach(async function() {
				await linker.whitelistTargetContract(nft.address, true, true, {from: a0});
			});
			it("fails if address to remove is zero", async function() {
				await expectRevert(linker.whitelistTargetContract(ZERO_ADDRESS, false, false, {from: a0}), "zero address");
			});
			it("succeeds if address to remove is ERC721", async function() {
				const receipt = await linker.whitelistTargetContract(persona.address, false, false, {from: a0});
				expectEvent(receipt, "TargetContractWhitelisted", {
					_by: a0,
					_targetContract: persona.address,
					_oldVal: "0",
					_newVal: "0",
				});
			});
			it("succeeds if address to remove is not ERC721", async function() {
				const receipt = await linker.whitelistTargetContract(ali.address, false, false, {from: a0});
				expectEvent(receipt, "TargetContractWhitelisted", {
					_by: a0,
					_targetContract: ali.address,
					_oldVal: "0",
					_newVal: "0",
				});
			});
			describe("succeeds if address to remove is ERC721 whitelisted previously", function() {
				let receipt;
				beforeEach(async function() {
					receipt = await linker.whitelistTargetContract(nft.address, false, false, {from: a0});
				});
				it("specified address stops being whitelisted", async function() {
					expect(await linker.whitelistedTargetContracts(nft.address)).to.be.bignumber.that.equals("0");
				});
				it("specified address stops being whitelisted for linking", async function() {
					expect(await linker.isAllowedForLinking(nft.address)).to.be.false;
				});
				it("specified address stops being whitelisted for unlinking", async function() {
					expect(await linker.isAllowedForUnlinking(nft.address)).to.be.false;
				});
				it('"TargetContractWhitelisted" event is emitted', async function() {
					expectEvent(receipt, "TargetContractWhitelisted", {
						_by: a0,
						_targetContract: nft.address,
						_oldVal: "3",
						_newVal: "0",
					});
				});
				it("link fails if delisted NFT contract is used", async function() {
					await expectRevert(
						linker.link(persona_id, nft.address, target_id, {from: persona_owner}),
						"not a whitelisted NFT contract"
					);
				});
			});
			describe("iNFT minted with removed NFT contract can still be unlinked", function() {
				beforeEach(async function() {
					await ali.transfer(persona_owner, link_price, {from: a0});
					await ali.approve(linker.address, link_price, {from: persona_owner});
					await persona.approve(linker.address, persona_id, {from: persona_owner});
					await linker.link(persona_id, nft.address, target_id, {from: persona_owner});
					await linker.whitelistTargetContract(nft.address, false, true, {from: a0});
				});
				describe("unlink iNFT", function() {
					beforeEach(async function() {
						receipt = await linker.unlink(recordId, {from: nft_owner});
					});
					check_burn_succeeds();
				});
				describe("unlink NFT", function() {
					beforeEach(async function() {
						receipt = await linker.unlinkNFT(nft.address, target_id, {from: nft_owner});
					});
					check_burn_succeeds();
				});
			});
		});
		describe("updating nextId", function() {
			it("fails if nextId is 0xFFFF_FFFF", async function() {
				await expectRevert(linker.updateNextId(0xFFFF_FFFF, {from: a0}), "value too low");
			});
			it("fails if nextId is less than 0xFFFF_FFFF", async function() {
				await expectRevert(linker.updateNextId(0xFFFF_FFFE, {from: a0}), "value too low");
			});
			describe("succeeds if nextId is greater than 0xFFFF_FFFF", function() {
				let receipt;
				const next_id = LINKER_PARAMS_V2.NEXT_ID;
				const new_next_id = next_id * 2;
				beforeEach(async function() {
					receipt = await linker.updateNextId(new_next_id, {from: a0});
				});
				it("nextId gets set as expected", async function() {
					expect(await linker.nextId()).to.be.bignumber.that.equals(new_next_id + "");
				});
				it('"NextIdChanged" event is emitted', async function() {
					expectEvent(receipt, "NextIdChanged", {
						_by: a0,
						_oldVal: new BN(next_id),
						_newVal: new BN(new_next_id),
					});
				});
				describe("nextId is indeed used when linking", function() {
					const link_price = LINKER_PARAMS.LINK_PRICE;
					beforeEach(async function() {
						await linker.whitelistTargetContract(nft.address, true, false, {from: a0});
						await ali.transfer(persona_owner, link_price, {from: a0});
						await ali.approve(linker.address, link_price, {from: persona_owner});
						await persona.approve(linker.address, persona_id, {from: persona_owner});
						await linker.link(persona_id, nft.address, target_id, {from: persona_owner});
					});
					it("nextId is used as expected", async function() {
						expect(await iNft.reverseBindings(nft.address, target_id)).to.be.bignumber.that.equals(new_next_id + "");
					});
				});
			});
		});
		describe("updating linking price and fee", function() {
			const link_fee = new BN(LINKER_PARAMS.LINK_FEE);
			const low_value = 1e12 - 1;
			it("fails if linking price is too low", async function() {
				await expectRevert(
					linker.updateLinkPrice(low_value, link_fee, fee_destination, {from: a0}),
					"invalid price"
				);
				it("fails if linking fee is too low", async function() {
					await expectRevert(
						linker.updateLinkPrice(link_price, low_value, fee_destination, {from: a0}),
						"invalid linking fee/treasury"
					);
				});
				it("fails if fee is set while treasury is not set", async function() {
					await expectRevert(
						linker.updateLinkPrice(link_price, link_fee, ZERO_ADDRESS, {from: a0}),
						"invalid linking fee/treasury"
					);
				});
				it("fails if fee is not set while treasury is set", async function() {
					await expectRevert(
						linker.updateLinkPrice(link_price, ZERO_BYTES32, fee_destination, {from: a0}),
						"invalid linking fee/treasury"
					);
				});
				it("fails if linking fee exceeds linking price", async function() {
					await expectRevert(
						linker.updateLinkPrice(link_fee, link_price, fee_destination, {from: a0}),
						"linking fee exceeds linking price"
					);
				});
			});

			function succeeds_for(set_price, set_fee) {
				assert(set_price || !set_fee, "invalid set price/fee combination");
				const price = set_price? link_price: new BN(0);
				const fee = set_price && set_fee? link_fee: new BN(0);
				const fee_dest = fee.isZero()? ZERO_ADDRESS: fee_destination;
				let receipt;
				beforeEach(async function() {
					receipt = await linker.updateLinkPrice(price, fee, fee_dest, {from: a0});
				})
				it("linking price is set as expected", async function() {
					expect(await linker.linkPrice()).to.be.bignumber.that.equals(price);
				});
				it("linking fee is set as expected", async function() {
					expect(await linker.linkFee()).to.be.bignumber.that.equals(fee);
				});
				it("treasury is set as expected", async function() {
					expect(await linker.feeDestination()).to.equal(fee_dest);
				});
				it('"LinkPriceChanged" event is emitted', async function() {
					await expectEvent(receipt, "LinkPriceChanged", {
						_by: a0,
						_linkPrice: price,
						_linkFee: fee,
						_feeDestination: fee_dest,
					});
				});
			}

			describe("succeeds if price and fee are set", function() {
				succeeds_for(true, true);
			});
			describe("succeeds if price is set and fee is not set", function() {
				succeeds_for(true, false);
			});
			describe("succeeds if price and fee are not set", function() {
				succeeds_for(false, false);
			});
		});
		describe("linking the iNFT", function() {
			it("fails when executed by an account which doesn't own AI Personality", async function() {
				await expectRevert(linker.link(persona_id, nft.address, target_id, {from: nft_owner}), "access denied");
			});
			describe("when executed by an account which owns AI Personality", function() {
				it("fails if NFT contract is not whitelisted", async function() {
					await expectRevert(
						linker.link(persona_id, nft.address, target_id, {from: persona_owner}),
						"not a whitelisted NFT contract"
					);
				});
				describe("when NFT contract is whitelisted", function() {
					beforeEach(async function() {
						await linker.whitelistTargetContract(nft.address, true, false, {from: a0});
						await ali.transfer(persona_owner, link_price, {from: a0});
						await ali.approve(linker.address, link_price, {from: persona_owner});
					})
					it("fails if AI Personality is not supplied", async function() {
						await expectRevert(
							linker.link(persona_id, nft.address, target_id, {from: persona_owner}),
							"access denied"
						);
					});
					describe("when AI Personality is supplied", function() {
						beforeEach(async function() {
							await persona.approve(linker.address, persona_id, {from: persona_owner});
						});
						describe("when linking price is set", function() {
							describe("when linking fee is not set", function() {
								beforeEach(async function() {
									await linker.updateLinkPrice(link_price, 0, ZERO_ADDRESS, {from: a0});
								});
								check_link_fee_cases(link_price, 0);
							});
							describe("when linking fee is set", function() {
								beforeEach(async function() {
									await linker.updateLinkPrice(link_price, link_fee, fee_destination, {from: a0});
								});
								check_link_fee_cases(link_price, link_fee);
							});

							function check_link_fee_cases(link_price, link_fee) {
								link_price = new BN(link_price);
								link_fee = new BN(link_fee);
								const link_deposit = link_price.sub(link_fee);
								it("linking fails if linking price is not paid", async function() {
									await ali.approve(linker.address, 0, {from: persona_owner});
									await expectRevert(
										linker.link(persona_id, nft.address, target_id, {from: persona_owner}),
										"transfer amount exceeds allowance"
									);
								});
								describe("linking succeeds if linking price is paid", function() {
									let receipt;
									beforeEach(async function() {
										await ali.approve(linker.address, link_price, {from: persona_owner});
										receipt = await linker.link(persona_id, nft.address, target_id, {from: persona_owner});
									});
									it("totalSupply increases by one", async function() {
										expect(await iNft.totalSupply()).to.be.bignumber.that.equals(1 + "");
									});
									it("nextId is increased by one", async function() {
										expect(await linker.nextId()).to.be.bignumber.that.equals(NEXT_ID.addn(1));
									});
									describe("ALI tokens get transferred", function() {
										it("owner balance decreases as expected", async function() {
											expect(await ali.balanceOf(persona_owner)).to.be.bignumber.that.equals("0");
										});
										it("iNFT balance increases as expected", async function() {
											expect(await ali.balanceOf(iNft.address)).to.be.bignumber.that.equals(link_deposit);
										});
										it("emits improved Transfer event (arXiv:1907.00903)", async function() {
											await expectEventInTransaction(receipt.tx, "Transfer", [{
												type: "address",
												name: "by",
												indexed: true,
												value: linker.address,
											}, {
												type: "address",
												name: "from",
												indexed: true,
												value: persona_owner,
											}, {
												type: "address",
												name: "to",
												indexed: true,
												value: iNft.address,
											}, {
												type: "uint256",
												name: "value",
												value: link_deposit,
											}]);
										});
										it("emits ERC20 Transfer event", async function() {
											await expectEventInTransaction(receipt.tx, "Transfer", [{
												type: "address",
												name: "from",
												indexed: true,
												value: persona_owner,
											}, {
												type: "address",
												name: "to",
												indexed: true,
												value: iNft.address,
											}, {
												type: "uint256",
												name: "value",
												value: link_deposit,
											}]);
										});
										if(!link_fee.isZero()) {
											it("emits improved Transfer event (arXiv:1907.00903)", async function() {
												await expectEventInTransaction(receipt.tx, "Transfer", [{
													type: "address",
													name: "by",
													indexed: true,
													value: linker.address,
												}, {
													type: "address",
													name: "from",
													indexed: true,
													value: persona_owner,
												}, {
													type: "address",
													name: "to",
													indexed: true,
													value: fee_destination,
												}, {
													type: "uint256",
													name: "value",
													value: link_fee,
												}]);
											});
											it("emits ERC20 Transfer event", async function() {
												await expectEventInTransaction(receipt.tx, "Transfer", [{
													type: "address",
													name: "from",
													indexed: true,
													value: persona_owner,
												}, {
													type: "address",
													name: "to",
													indexed: true,
													value: fee_destination,
												}, {
													type: "uint256",
													name: "value",
													value: link_fee,
												}]);
											});
											it("treasury balance increases as expected", async function() {
												expect(await ali.balanceOf(fee_destination)).to.be.bignumber.that.equals(link_fee);
											});
										}
									});
									it("AI Personality gets transferred", async function() {
										expect(await persona.ownerOf(persona_id)).to.be.equals(iNft.address);
									});
									it("NFT doesn't get transferred", async function() {
										expect(await nft.ownerOf(target_id)).to.be.equals(nft_owner);
									});
									it('"Linked" event is emitted', async function() {
										await expectEvent(receipt, "Linked", {
											_by: persona_owner,
											_iNftId: NEXT_ID,
											_linkPrice: link_price,
											_linkFee: link_fee,
											_personalityContract: persona.address,
											_personalityId: persona_id,
											_targetContract: nft.address,
											_targetId: target_id,
										});
									});
								});
							}
						});
						describe("linking succeeds if linking price is not set", function() {
							beforeEach(async function() {
								await linker.updateLinkPrice(0, 0, ZERO_ADDRESS, {from: a0});
							});

							let receipt;
							beforeEach(async function() {
								receipt = await linker.link(persona_id, nft.address, target_id, {from: persona_owner});
							});
							it("totalSupply increases by one", async function() {
								expect(await iNft.totalSupply()).to.be.bignumber.that.equals(1 + "");
							});
							it("nextId is increased by one", async function() {
								expect(await linker.nextId()).to.be.bignumber.that.equals(NEXT_ID.addn(1));
							});
							it("ALI tokens don't get transferred", async function() {
								expect(await ali.balanceOf(persona_owner)).to.be.bignumber.that.equals(link_price);
							});
							it("AI Personality gets transferred", async function() {
								expect(await persona.ownerOf(persona_id)).to.be.equals(iNft.address);
							});
							it("NFT doesn't get transferred", async function() {
								expect(await nft.ownerOf(target_id)).to.be.equals(nft_owner);
							});
							it('"Linked" event is emitted', async function() {
								await expectEvent(receipt, "Linked", {
									_by: persona_owner,
									_iNftId: NEXT_ID,
									_linkPrice: '0',
									_linkFee: '0',
									_personalityContract: persona.address,
									_personalityId: persona_id,
									_targetContract: nft.address,
									_targetId: target_id,
								});
							});
						});
					});
				});
			});
		});
		describe("when iNFT was previously created", function() {
			beforeEach(async function() {
				await linker.whitelistTargetContract(nft.address, true, false, {from: a0});
				await ali.transfer(persona_owner, link_price, {from: a0});
				await ali.approve(linker.address, link_price, {from: persona_owner});
				await persona.approve(linker.address, persona_id, {from: persona_owner});
				await linker.link(persona_id, nft.address, target_id, {from: persona_owner});
			});

			describe("unlinking the iNFT", function() {
				it("fails if NFT contract is not whitelisted", async function() {
					await expectRevert(
						linker.unlink(recordId, {from: persona_owner}),
						"not a whitelisted NFT contract"
					);
				});
				describe("when NFT contract is whitelisted", function() {
					beforeEach(async function() {
						await linker.whitelistTargetContract(nft.address, false, true, {from: a0});
					});
					it("fails when executed not by the owner of iNFT", async function() {
						await expectRevert(linker.unlink(recordId, {from: persona_owner}), "not an iNFT owner");
					});
					describe("succeeds otherwise (when executed by the owner of iNFT)", function() {
						beforeEach(async function() {
							receipt = await linker.unlink(recordId, {from: nft_owner});
						});
						check_burn_succeeds();
					});
				});
			});
			describe("unlinking the NFT", function() {
				it("fails when executed not by the owner of NFT", async function() {
					await linker.whitelistTargetContract(nft.address, false, true, {from: a0});
					await expectRevert(linker.unlinkNFT(nft.address, target_id, {from: persona_owner}), "not an NFT owner");
				});
				describe("when executed by the owner of iNFT", function() {
					it("fails if NFT contract is not whitelisted", async function() {
						await expectRevert(
							linker.unlinkNFT(nft.address, target_id, {from: nft_owner}),
							"not a whitelisted NFT contract"
						);
					});
					describe("succeeds otherwise (when NFT contract is whitelisted)", function() {
						beforeEach(async function() {
							await linker.whitelistTargetContract(nft.address, false, true, {from: a0});
							receipt = await linker.unlinkNFT(nft.address, target_id, {from: nft_owner});
						});
						check_burn_succeeds();
					});
				});
			});
			describe("depositing additional ALI", function() {
				it("fails if executed not by iNFT owner", async function() {
					await ali.approve(linker.address, link_price, {from: a0});
					await expectRevert(linker.deposit(recordId, link_price, {from: a0}), "not an iNFT owner");
				});
				it("fails if deposit amount is zero", async function() {
					await expectRevert(linker.deposit(recordId, 0, {from: nft_owner}), "zero value");
				});
				it("fails if owner doesn't have enough ALI", async function() {
					await ali.approve(linker.address, link_price, {from: nft_owner});
					await expectRevert(linker.deposit(recordId, link_price, {from: nft_owner}), "transfer amount exceeds balance");
				});
				it("fails if deposit amount is not approved to be transferred", async function() {
					await ali.transfer(nft_owner, link_price, {from: a0});
					await expectRevert(linker.deposit(recordId, link_price, {from: nft_owner}), "transfer amount exceeds allowance");
				});
				describe("succeeds otherwise", function() {
					function deposit_succeeds(value = link_price) {
						const deposit_fee = value.mul(link_fee).div(link_price);
						const deposit_value = value.sub(deposit_fee);

						let receipt;
						beforeEach(async function() {
							await ali.transfer(nft_owner, value, {from: a0});
							await ali.approve(linker.address, value, {from: nft_owner});
							receipt = await linker.deposit(recordId, value, {from: nft_owner});
						});
						it("cumulative ALI obligation increases as expected", async function() {
							expect(await iNft.aliBalance()).to.be.bignumber.that.equals(link_deposit.add(deposit_value));
						});
						it("locked ALI value increases as expected", async function() {
							expect(await iNft.lockedValue(recordId)).to.be.bignumber.that.equals(link_deposit.add(deposit_value));
						});
						it("iNFT balance increases as expected", async function() {
							expect(await ali.balanceOf(iNft.address)).to.be.bignumber.that.equals(link_deposit.add(deposit_value));
						});
						it("treasury balance increases as expected", async function() {
							expect(await ali.balanceOf(fee_destination)).to.be.bignumber.that.equals(link_fee.add(deposit_fee));
						});
						it('"LinkUpdated" event is emitted', async function() {
							expectEvent(receipt, "LinkUpdated", {
								_by: nft_owner,
								_iNftId: recordId,
								_aliDelta: deposit_value,
								_feeValue: deposit_fee,
							});
						});
					}

					describe("without rounding", function() {
						deposit_succeeds(link_price);
					});
					describe("with rounding", function() {
						deposit_succeeds(link_price.subn(1));
					});
				});
			});
			describe("withdrawing ALI from existing iNFT", function() {
				const withdraw_value = link_deposit.muln(2).sub(link_price);
				beforeEach(async function() {
					await ali.transfer(nft_owner, link_price, {from: a0});
					await ali.approve(linker.address, link_price, {from: nft_owner});
					await linker.deposit(recordId, link_price, {from: nft_owner});
				});
				it("fails if executed not by iNFT owner", async function() {
					await expectRevert(linker.withdraw(recordId, withdraw_value, {from: a0}), "not an iNFT owner");
				});
				it("fails if withdraw amount is zero", async function() {
					await expectRevert(linker.withdraw(recordId, 0, {from: nft_owner}), "zero value");
				});
				it("fails if remaining deposit is too low", async function() {
					await expectRevert(linker.withdraw(recordId, withdraw_value.addn(1), {from: nft_owner}), "deposit too low");
				});
				it("fails if there is not enough ALI locked", async function() {
					await linker.updateLinkPrice(0, 0, ZERO_ADDRESS, {from: a0});
					await expectRevert(linker.withdraw(recordId, link_price.add(withdraw_value).addn(1), {from: nft_owner}), "deposit too low");
				});
				describe("succeeds otherwise", function() {
					let receipt;
					beforeEach(async function() {
						receipt = await linker.withdraw(recordId, withdraw_value, {from: nft_owner});
					});
					it("cumulative ALI obligation decreases as expected", async function() {
						expect(await iNft.aliBalance()).to.be.bignumber.that.equals(link_price);
					});
					it("locked ALI value decreases as expected", async function() {
						expect(await iNft.lockedValue(recordId)).to.be.bignumber.that.equals(link_price);
					});
					it("iNFT balance decreases as expected", async function() {
						expect(await ali.balanceOf(iNft.address)).to.be.bignumber.that.equals(link_price);
					});
					it("treasury balance remains the same", async function() {
						expect(await ali.balanceOf(fee_destination)).to.be.bignumber.that.equals(link_fee.add(link_fee));
					});
					it("NFT owner balance increases as expected", async function() {
						expect(await ali.balanceOf(nft_owner)).to.be.bignumber.that.equals(withdraw_value);
					});
					it('"LinkUpdated" event is emitted', async function() {
						expectEvent(receipt, "LinkUpdated", {
							_by: nft_owner,
							_iNftId: recordId,
							_aliDelta: withdraw_value.neg(),
							_feeValue: '0',
						});
					});
				});
			});
		});
	});
});
