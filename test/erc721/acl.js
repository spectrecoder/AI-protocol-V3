// Alethea ERC721: AccessControl (ACL) Tests

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
const {random_bn255} = require("../include/bn_utils");

// ALI EIP712 helpers
const {
	eip712_permit,
	eip712_permit_for_all,
	default_deadline,
} = require("./include/erc721_eip712");

// ACL token features and roles
const {
	not,
	FEATURE_TRANSFERS,
	FEATURE_TRANSFERS_ON_BEHALF,
	FEATURE_OWN_BURNS,
	FEATURE_BURNS_ON_BEHALF,
	FEATURE_PERMITS,
	FEATURE_OPERATOR_PERMITS,
	ROLE_TOKEN_CREATOR,
	ROLE_TOKEN_DESTROYER,
	ROLE_URI_MANAGER,
	ROLE_ACCESS_MANAGER,
} = require("../include/features_roles");

// deployment routines in use
const {
	short_erc721_deploy_restricted,
	burnable_short_erc721_deploy_restricted,
	tiny_erc721_deploy_restricted,
} = require("./include/deployment_routines");

// run AccessControl (ACL) tests
contract("ERC721: AccessControl (ACL) tests", function(accounts) {
	// extract accounts to be used:
	// A0 – special default zero account accounts[0] used by Truffle, reserved
	// a0 – deployment account having all the permissions, reserved
	// H0 – initial token holder account
	// a1, a2,... – working accounts to perform tests on
	const [A0, a0, H0, a1, a2, a3] = accounts;

	function acl_suite(contract_name, deployment_fn, burnable) {
		describe(contract_name, function() {
			// deploy token
			let token;
			beforeEach(async function() {
				token = await deployment_fn.call(this, a0);
			});

			// run the suite
			describe("ACL Core", function() {
				const by = a1;
				const to = a2;
				describe("when performed by ACCESS_MANAGER", function() {
					beforeEach(async function() {
						await token.updateRole(by, ROLE_ACCESS_MANAGER, {from: a0});
					});
					describe("when ACCESS_MANAGER has full set of permissions", function() {
						beforeEach(async function() {
							await token.updateRole(by, MAX_UINT256, {from: a0});
						});
						describe("what you set", function() {
							let set;
							beforeEach(async function() {
								// do not touch the highest permission bit (ACCESS_MANAGER permission)
								set = random_bn255();
								await token.updateRole(to, set, {from: by});
							});
							it("is what you get", async function() {
								expect(await token.getRole(to)).to.be.bignumber.that.equals(set);
							});
						});
						describe("what you remove", function() {
							let remove;
							beforeEach(async function() {
								// do not touch the highest permission bit (ACCESS_MANAGER permission)
								remove = random_bn255();
								await token.updateRole(to, not(remove), {from: by});
							});
							it("is what gets removed", async function() {
								expect(await token.getRole(to)).to.be.bignumber.that.equals(not(remove));
							});
						});
					});
					describe("when ACCESS_MANAGER doesn't have any permissions", function() {
						describe("what you get, independently of what you set", function() {
							beforeEach(async function() {
								// do not touch the highest permission bit (ACCESS_MANAGER permission)
								const set = random_bn255();
								await token.updateRole(to, set, {from: by});
							});
							it("is always zero", async function() {
								expect(await token.getRole(to)).to.be.bignumber.that.equals('0');
							});
						});
						describe("what you get, independently of what you remove", function() {
							beforeEach(async function() {
								// do not touch the highest permission bit (ACCESS_MANAGER permission)
								const remove = random_bn255();
								await token.updateRole(to, MAX_UINT256, {from: a0});
								await token.updateRole(to, not(remove), {from: by});
							});
							it("is always what you had", async function() {
								expect(await token.getRole(to)).to.be.bignumber.that.equals(MAX_UINT256);
							});
						});
					});
					describe("when ACCESS_MANAGER has some permissions", function() {
						let role;
						beforeEach(async function() {
							// do not touch the highest permission bit (ACCESS_MANAGER permission)
							role = random_bn255();
							await token.updateRole(by, ROLE_ACCESS_MANAGER.or(role), {from: a0});
						});
						describe("what you get", function() {
							let set;
							beforeEach(async function() {
								// do not touch the highest permission bit (ACCESS_MANAGER permission)
								set = random_bn255();
								await token.updateRole(to, set, {from: by});
							});
							it("is an intersection of what you set and what you have", async function() {
								expect(await token.getRole(to)).to.be.bignumber.that.equals(role.and(set));
							});
						});
						describe("what you remove", function() {
							let remove;
							beforeEach(async function() {
								// do not touch the highest permission bit (ACCESS_MANAGER permission)
								remove = random_bn255();
								await token.updateRole(to, MAX_UINT256, {from: a0});
								await token.updateRole(to, not(remove), {from: by});
							});
							it("is an intersection of what you tried to remove and what you have", async function() {
								expect(await token.getRole(to)).to.be.bignumber.that.equals(not(role.and(remove)));
							});
						});
					});
					describe("ACCESS_MANAGER updates itself", function() {
						beforeEach(async function() {
							// do not touch the highest permission bit (ACCESS_MANAGER permission)
							const role = random_bn255();
							await token.updateRole(by, ROLE_ACCESS_MANAGER.or(role), {from: a0});
						});
						it("and degrades to zero with the 99.99% probability in 14 runs", async function() {
							// randomly remove 255 bits of permissions
							for(let i = 0; i < 14; i++) {
								// do not touch the highest permission bit (ACCESS_MANAGER permission)
								const role = random_bn255();
								await token.updateRole(by, not(role), {from: by});
							}
							// this may fail with the probability 2^(-14) < 0.01%
							expect(await token.getRole(by)).to.be.bignumber.that.equals(ROLE_ACCESS_MANAGER);
						})
					});
					describe("when ACCESS_MANAGER grants ACCESS_MANAGER permission", function() {
						beforeEach(async function() {
							await token.updateRole(to, ROLE_ACCESS_MANAGER, {from: by});
						});
						it("operator becomes an ACCESS_MANAGER", async function() {
							expect(await token.isOperatorInRole(to, ROLE_ACCESS_MANAGER), "operator").to.be.true;
							expect(await token.isSenderInRole(ROLE_ACCESS_MANAGER, {from: to}), "sender").to.be.true;
						});
					});
					describe("when ACCESS_MANAGER revokes ACCESS_MANAGER permission from itself", function() {
						beforeEach(async function() {
							await token.updateRole(by, 0, {from: by});
						});
						it("operator becomes an ACCESS_MANAGER", async function() {
							expect(await token.isOperatorInRole(by, ROLE_ACCESS_MANAGER), "operator").to.be.false;
							expect(await token.isSenderInRole(ROLE_ACCESS_MANAGER, {from: by}), "sender").to.be.false;
						});
					});
				});
				describe("otherwise (no ACCESS_MANAGER permission)", function() {
					it("updateFeatures reverts", async function() {
						await expectRevert(token.updateFeatures(1, {from: by}), "access denied");
					});
					it("updateRole reverts", async function() {
						await expectRevert(token.updateRole(to, 1, {from: by}), "access denied");
					});
				});
			});
			describe("ACL ERC721 Token", function() {
				const from = a1;
				const to = a2;
				const by = a3;
				const tokenId = 0xF001_0001;
				const nonExistentId = 0xF001_0002;
				beforeEach(async function() {
					await token.mint(from, tokenId, {from: a0})
				});
				// transfers
				describe("when FEATURE_TRANSFERS is enabled", function() {
					beforeEach(async function() {
						await token.updateFeatures(FEATURE_TRANSFERS, {from: a0});
					});
					it("direct transfer succeeds", async function() {
						await token.transferFrom(from, to, tokenId, {from});
					});
					it("safe direct transfer succeeds", async function() {
						await token.safeTransferFrom(from, to, tokenId, {from});
					});
				});
				describe("when FEATURE_TRANSFERS is disabled", function() {
					beforeEach(async function() {
						await token.updateFeatures(not(FEATURE_TRANSFERS), {from: a0});
					});
					it("direct transfer reverts", async function() {
						await expectRevert(token.transferFrom(from, to, tokenId, {from}), "transfers are disabled");
					});
					it("safe direct transfer reverts", async function() {
						await expectRevert(token.safeTransferFrom(from, to, tokenId, {from}), "transfers are disabled");
					});
				});
				// transfers on behalf
				describe("when token transfer is approved", function() {
					beforeEach(async function() {
						await token.approve(by, tokenId, {from});
					});
					describe("when FEATURE_TRANSFERS_ON_BEHALF is enabled", function() {
						beforeEach(async function() {
							await token.updateFeatures(FEATURE_TRANSFERS_ON_BEHALF, {from: a0});
						});
						it("transfer on behalf succeeds", async function() {
							await token.transferFrom(from, to, tokenId, {from: by});
						});
						it("safe transfer on behalf succeeds", async function() {
							await token.safeTransferFrom(from, to, tokenId, {from: by});
						});
					});
					describe("when FEATURE_TRANSFERS_ON_BEHALF is disabled", function() {
						beforeEach(async function() {
							await token.updateFeatures(not(FEATURE_TRANSFERS_ON_BEHALF), {from: a0});
						});
						it("transfer on behalf reverts", async function() {
							await expectRevert(token.transferFrom(from, to, tokenId, {from: by}), "transfers on behalf are disabled");
						});
						it("safe transfer on behalf reverts", async function() {
							await expectRevert(token.safeTransferFrom(from, to, tokenId, {from: by}), "transfers on behalf are disabled");
						});
					});
				});
				// transfers on behalf by operator
				describe("when transfer operator is set", function() {
					beforeEach(async function() {
						await token.setApprovalForAll(by, true, {from});
					});
					describe("when FEATURE_TRANSFERS_ON_BEHALF is enabled", function() {
						beforeEach(async function() {
							await token.updateFeatures(FEATURE_TRANSFERS_ON_BEHALF, {from: a0});
						});
						it("transfer on behalf by operator succeeds", async function() {
							await token.transferFrom(from, to, tokenId, {from: by});
						});
						it("safe transfer on behalf by operator succeeds", async function() {
							await token.safeTransferFrom(from, to, tokenId, {from: by});
						});
					});
					describe("when FEATURE_TRANSFERS_ON_BEHALF is disabled", function() {
						beforeEach(async function() {
							await token.updateFeatures(not(FEATURE_TRANSFERS_ON_BEHALF), {from: a0});
						});
						it("transfer on behalf by operator reverts", async function() {
							await expectRevert(token.transferFrom(from, to, tokenId, {from: by}), "transfers on behalf are disabled");
						});
						it("safe transfer on behalf by operator reverts", async function() {
							await expectRevert(token.safeTransferFrom(from, to, tokenId, {from: by}), "transfers on behalf are disabled");
						});
					});
				});
				if(burnable) {
					// burns
					describe("when FEATURE_OWN_BURNS is enabled", function() {
						beforeEach(async function() {
							await token.updateFeatures(FEATURE_OWN_BURNS, {from: a0});
						});
						it("burn succeeds", async function() {
							await token.burn(tokenId, {from});
						});
					});
					describe("when FEATURE_OWN_BURNS is disabled", function() {
						beforeEach(async function() {
							await token.updateFeatures(not(FEATURE_OWN_BURNS), {from: a0});
						});
						it("burn reverts", async function() {
							await expectRevert(token.burn(tokenId, {from}), "burns are disabled");
						});
					});
					// burns on behalf
					describe("when token transfer is approved", function() {
						beforeEach(async function() {
							await token.approve(by, tokenId, {from});
						});
						describe("when FEATURE_BURNS_ON_BEHALF is enabled", function() {
							beforeEach(async function() {
								await token.updateFeatures(FEATURE_BURNS_ON_BEHALF, {from: a0});
							});
							it("burn on behalf succeeds", async function() {
								await token.burn(tokenId, {from: by});
							});
						});
						describe("when FEATURE_BURNS_ON_BEHALF is disabled", function() {
							beforeEach(async function() {
								await token.updateFeatures(not(FEATURE_BURNS_ON_BEHALF), {from: a0});
							});
							it("burn on behalf reverts", async function() {
								await expectRevert(token.burn(tokenId, {from: by}), "burns on behalf are disabled");
							});
						});
					});
					// burns on behalf by operator
					describe("when transfer operator is set", function() {
						beforeEach(async function() {
							await token.setApprovalForAll(by, true, {from});
						});
						describe("when FEATURE_BURNS_ON_BEHALF is enabled", function() {
							beforeEach(async function() {
								await token.updateFeatures(FEATURE_BURNS_ON_BEHALF, {from: a0});
							});
							it("burn on behalf by operator succeeds", async function() {
								await token.burn(tokenId, {from: by});
							});
						});
						describe("when FEATURE_BURNS_ON_BEHALF is disabled", function() {
							beforeEach(async function() {
								await token.updateFeatures(not(FEATURE_BURNS_ON_BEHALF), {from: a0});
							});
							it("burn on behalf by operator reverts", async function() {
								await expectRevert(token.burn(tokenId, {from: by}), "burns on behalf are disabled");
							});
						});
					});
				}
				// permits
				describe("when permit signature is prepared", function() {
					// create empty account with known private key
					const w = web3.eth.accounts.create();

					// prepare some signature related defaults
					const owner = w.address;
					const operator = a2;
					const nonce = 0;
					let deadline;
					beforeEach(async function() {
						deadline = await default_deadline();
					});

					// mint one token for the permit/approve
					const tokenId = nonExistentId;
					beforeEach(async function() {
						await token.mint(owner, tokenId, {from: a0});
					});

					// prepare the signature
					let v, r, s;
					beforeEach(async function() {
						({v, r, s} = await eip712_permit(token.address, owner, operator, tokenId, nonce, deadline, w.privateKey));
					});

					describe("when FEATURE_PERMITS is enabled", function() {
						beforeEach(async function() {
							await token.updateFeatures(FEATURE_PERMITS, {from: a0});
						});
						it("permit succeeds", async function() {
							await token.permit(owner, operator, tokenId, deadline, v, r, s);
						});
					});
					describe("when FEATURE_PERMITS is disabled", function() {
						beforeEach(async function() {
							await token.updateFeatures(not(FEATURE_PERMITS), {from: a0});
						});
						it("permit reverts", async function() {
							await expectRevert(token.permit(owner, operator, tokenId, deadline, v, r, s), "permits are disabled");
						});
					});
				});
				// permits for all
				describe("when permit for all signature is prepared", function() {
					// create empty account with known private key
					const w = web3.eth.accounts.create();

					// prepare some signature related defaults
					const owner = w.address;
					const operator = a2;
					const nonce = 0;
					let deadline;
					beforeEach(async function() {
						deadline = await default_deadline();
					});

					const approved = true;

					// prepare the signature
					let v, r, s;
					beforeEach(async function() {
						({v, r, s} = await eip712_permit_for_all(token.address, owner, operator, approved, nonce, deadline, w.privateKey));
					});

					describe("when FEATURE_OPERATOR_PERMITS is enabled", function() {
						beforeEach(async function() {
							await token.updateFeatures(FEATURE_OPERATOR_PERMITS, {from: a0});
						});
						it("permit for all succeeds", async function() {
							await token.permitForAll(owner, operator, approved, deadline, v, r, s);
						});
					});
					describe("when FEATURE_OPERATOR_PERMITS is disabled", function() {
						beforeEach(async function() {
							await token.updateFeatures(not(FEATURE_OPERATOR_PERMITS), {from: a0});
						});
						it("permit for all reverts", async function() {
							await expectRevert(token.permitForAll(owner, operator, approved, deadline, v, r, s), "operator permits are disabled");
						});
					});
				});

				// mints
				describe("when sender has ROLE_TOKEN_CREATOR permission", function() {
					beforeEach(async function() {
						await token.updateRole(from, ROLE_TOKEN_CREATOR, {from: a0});
					});
					it("sender can mint a token", async function() {
						await token.mint(to, nonExistentId, {from});
					});
					it("sender can batch mint tokens", async function() {
						await token.mintBatch(to, nonExistentId, 2, {from});
					});
				});
				describe("when sender doesn't have ROLE_TOKEN_CREATOR permission", function() {
					beforeEach(async function() {
						await token.updateRole(from, not(ROLE_TOKEN_CREATOR), {from: a0});
					});
					it("sender can't mint a token", async function() {
						await expectRevert(token.mint(to, nonExistentId, {from}), "access denied");
					});
					it("sender can't batch mint tokens", async function() {
						await expectRevert(token.mintBatch(to, nonExistentId, 2, {from}), "access denied");
					});
				});
				// burns by destroyer
				if(burnable) {
					describe("when sender has ROLE_TOKEN_DESTROYER permission and FEATURE_OWN_BURNS/FEATURE_BURNS_ON_BEHALF are disabled", function() {
						beforeEach(async function() {
							await token.updateRole(from, ROLE_TOKEN_DESTROYER, {from: a0});
							await token.updateFeatures(not(FEATURE_OWN_BURNS, FEATURE_BURNS_ON_BEHALF), {from: a0});
						});
						it("sender can burn own token", async function() {
							await token.burn(tokenId, {from});
						});
						const anotherTokenId = nonExistentId;
						beforeEach(async function() {
							await token.mint(to, anotherTokenId, {from: a0});
						});
						it("sender can burn someone else's token", async function() {
							await token.burn(anotherTokenId, {from});
						});
					});
					describe("when sender doesn't have ROLE_TOKEN_DESTROYER permission and FEATURE_OWN_BURNS/FEATURE_BURNS_ON_BEHALF are enabled", function() {
						beforeEach(async function() {
							await token.updateRole(from, not(ROLE_TOKEN_DESTROYER), {from: a0});
							await token.updateFeatures(FEATURE_OWN_BURNS | FEATURE_BURNS_ON_BEHALF, {from: a0});
						});
						const anotherTokenId = nonExistentId;
						beforeEach(async function() {
							await token.mint(to, anotherTokenId, {from: a0});
						});
						it("sender can't burn someone else's token", async function() {
							await expectRevert(token.burn(anotherTokenId, {from}), "access denied");
						});
					});
				}
				// URI setup
				describe("when sender has ROLE_URI_MANAGER permission", function() {
					beforeEach(async function() {
						await token.updateRole(from, ROLE_URI_MANAGER, {from: a0});
					});
					it("sender can set baseURI", async function() {
						await token.setBaseURI("abc", {from});
					});
					it("sender can set tokenURI", async function() {
						await token.setTokenURI(tokenId, "abc", {from});
					});
				});
				describe("when sender doesn't have ROLE_URI_MANAGER permission", function() {
					beforeEach(async function() {
						await token.updateRole(from, not(ROLE_URI_MANAGER), {from: a0});
					});
					it("sender can't set baseURI", async function() {
						await expectRevert(token.setBaseURI("abc", {from}), "access denied");
					});
					it("sender can't set tokenURI", async function() {
						await expectRevert(token.setTokenURI(tokenId, "abc", {from}), "access denied");
					});
				});
			});
		});
	}

	acl_suite("ShortERC721", short_erc721_deploy_restricted, false);
	acl_suite("BurnableShortERC721",burnable_short_erc721_deploy_restricted, true);
	acl_suite("TinyERC721", tiny_erc721_deploy_restricted, true);
});
