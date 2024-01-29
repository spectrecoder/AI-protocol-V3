// Alethea ERC20: AccessControl (ACL) Tests

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

// ACL token features and roles
const {
	FULL_PRIVILEGES_MASK,
	not,
	FEATURE_TRANSFERS,
	FEATURE_TRANSFERS_ON_BEHALF,
	FEATURE_UNSAFE_TRANSFERS,
	FEATURE_OWN_BURNS,
	FEATURE_BURNS_ON_BEHALF,
	FEATURE_DELEGATIONS,
	FEATURE_DELEGATIONS_ON_BEHALF,
	FEATURE_ERC1363_TRANSFERS,
	FEATURE_ERC1363_APPROVALS,
	FEATURE_EIP2612_PERMITS,
	FEATURE_EIP3009_TRANSFERS,
	FEATURE_EIP3009_RECEPTIONS,
	ROLE_TOKEN_CREATOR,
	ROLE_TOKEN_DESTROYER,
	ROLE_ERC20_RECEIVER,
	ROLE_ERC20_SENDER,
	ROLE_ACCESS_MANAGER,
} = require("../include/features_roles");

// token constants
const {
	CONTRACT_NAME,
	TOTAL_SUPPLY: S0,
} = require("./include/ali_erc20_constants");

// ALI EIP712 helpers
const {
	eip712_delegate,
	eip712_permit,
	eip712_transfer,
	eip712_receive,
} = require("./include/ali_eip712");

// deployment routines in use
const {
	ali_erc20_deploy_restricted,
	erc1363_deploy_acceptor,
} = require("./include/deployment_routines");

// run AccessControl (ACL) tests
contract("AliERC20: AccessControl (ACL) tests", function(accounts) {
	// extract accounts to be used:
	// A0 – special default zero account accounts[0] used by Truffle, reserved
	// a0 – deployment account having all the permissions, reserved
	// H0 – initial token holder account
	// a1, a2,... – working accounts to perform tests on
	const [A0, a0, H0, a1, a2] = accounts;

	// define test suite
	function test_suite(suite_name, deployment_fn) {
		describe(suite_name, function() {
			// deploy token
			let token;
			beforeEach(async function() {
				token = await deployment_fn.call(this, a0, H0, S0);
			});

			describe("ACL Core", function() {
				const by = a1;
				const to = a2;
				describe("when performed by ACCESS_MANAGER", function() {
					beforeEach(async function() {
						await token.updateRole(by, ROLE_ACCESS_MANAGER, {from: a0});
					});
					describe("when ACCESS_MANAGER has full set of permissions", function() {
						beforeEach(async function() {
							await token.updateRole(by, FULL_PRIVILEGES_MASK, {from: a0});
						});
						describe("what you set", function() {
							let set;
							beforeEach(async function() {
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
								const set = random_bn255();
								await token.updateRole(to, set, {from: by});
							});
							it("is always zero", async function() {
								expect(await token.getRole(to)).to.be.bignumber.that.equals('0');
							});
						});
						describe("what you get, independently of what you remove", function() {
							beforeEach(async function() {
								const remove = random_bn255();
								await token.updateRole(to, FULL_PRIVILEGES_MASK, {from: a0});
								await token.updateRole(to, not(remove), {from: by});
							});
							it("is always what you had", async function() {
								expect(await token.getRole(to)).to.be.bignumber.that.equals(FULL_PRIVILEGES_MASK);
							});
						});
					});
					describe("when ACCESS_MANAGER has some permissions", function() {
						let role;
						beforeEach(async function() {
							role = random_bn255();
							await token.updateRole(by, ROLE_ACCESS_MANAGER.or(role), {from: a0});
						});
						describe("what you get", function() {
							let set;
							beforeEach(async function() {
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
								remove = random_bn255();
								await token.updateRole(to, FULL_PRIVILEGES_MASK, {from: a0});
								await token.updateRole(to, not(remove), {from: by});
							});
							it("is an intersection of what you tried to remove and what you have", async function() {
								expect(await token.getRole(to)).to.be.bignumber.that.equals(not(role.and(remove)));
							});
						});
					});
					describe("ACCESS_MANAGER updates itself", function() {
						beforeEach(async function() {
							const role = random_bn255();
							await token.updateRole(by, ROLE_ACCESS_MANAGER.or(role), {from: a0});
						});
						it("and degrades to zero with the 99.99% probability in 14 runs", async function() {
							// randomly remove 255 bits of permissions
							for(let i = 0; i < 14; i++) {
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
			describe("ACL Alethea Token", function() {
				// expiration, deadlines, validity defaults
				const expiry = 10e9;
				const deadline = 10e9;
				const validBefore = 10e9;
				const validAfter = 10e3;
				// create empty account with known private key
				const w = web3.eth.accounts.create();

				const by = a1;
				const from = H0;
				const to = a2;
				const value = 1;

				describe("after spender's approval", function() {
					beforeEach(async function() {
						await token.approve(by, MAX_UINT256, {from});
					});
					describe("when FEATURE_TRANSFERS_ON_BEHALF is enabled", function() {
						beforeEach(async function() {
							await token.updateFeatures(FEATURE_TRANSFERS_ON_BEHALF, {from: a0});
						});
						it("transfer on behalf succeeds", async function() {
							await token.transferFrom(from, to, value, {from: by});
						});
					});
					describe("when FEATURE_TRANSFERS_ON_BEHALF is disabled", function() {
						beforeEach(async function() {
							await token.updateFeatures(not(FEATURE_TRANSFERS_ON_BEHALF), {from: a0});
						});
						it("transfer on behalf reverts", async function() {
							await expectRevert(token.transferFrom(from, to, value, {from: by}), "transfers on behalf are disabled");
						});
					});
					describe("when FEATURE_BURNS_ON_BEHALF is enabled", function() {
						beforeEach(async function() {
							await token.updateFeatures(FEATURE_BURNS_ON_BEHALF, {from: a0});
						});
						it("burn on behalf succeeds", async function() {
							await token.burn(from, value, {from: by});
						});
					});
					describe("when FEATURE_BURNS_ON_BEHALF is disabled", function() {
						beforeEach(async function() {
							await token.updateFeatures(not(FEATURE_BURNS_ON_BEHALF), {from: a0});
						});
						it("burn on behalf reverts", async function() {
							await expectRevert(token.burn(from, value, {from: by}), "burns on behalf are disabled");
						});
					});
				});

				describe("with the non ERC20 compliant receiver deployed", function() {
					let _to;
					beforeEach(async function() {
						_to = (await deployment_fn(a0, H0)).address;
					});
					describe("when FEATURE_UNSAFE_TRANSFERS is enabled", function() {
						beforeEach(async function() {
							await token.updateFeatures(FEATURE_TRANSFERS | FEATURE_UNSAFE_TRANSFERS, {from: a0});
						});
						it("transfer to unsafe receiver succeeds", async function() {
							await token.transfer(_to, value, {from});
						});
					});
					describe("when FEATURE_UNSAFE_TRANSFERS is disabled", function() {
						beforeEach(async function() {
							await token.updateFeatures(not(FEATURE_UNSAFE_TRANSFERS), {from: a0});
						});
						it("transfer to unsafe receiver reverts", async function() {
							await expectRevert.unspecified(token.transfer(_to, value, {from}));
						});
					});
					describe("when the receiver is marked as ERC20_RECEIVER", function() {
						beforeEach(async function() {
							await token.updateFeatures(FEATURE_TRANSFERS, {from: a0});
							await token.updateRole(_to, ROLE_ERC20_RECEIVER, {from: a0});
						});
						it("transfer to unsafe receiver succeeds", async function() {
							await token.transfer(_to, value, {from});
						});
					});
					describe("when the receiver is not marked as ERC20_RECEIVER", function() {
						beforeEach(async function() {
							await token.updateFeatures(FEATURE_TRANSFERS, {from: a0});
							await token.updateRole(_to, not(ROLE_ERC20_RECEIVER), {from: a0});
						});
						it("transfer to unsafe receiver reverts", async function() {
							await expectRevert.unspecified(token.transfer(_to, value, {from}));
						});
					});
					describe("when seder is marked as ERC20_SENDER", function() {
						beforeEach(async function() {
							await token.updateFeatures(FEATURE_TRANSFERS, {from: a0});
							await token.updateRole(from, ROLE_ERC20_SENDER, {from: a0});
						});
						it("transfer to unsafe receiver succeeds", async function() {
							await token.transfer(_to, value, {from});
						});
					});
					describe("when the sender is not marked as ERC20_SENDER", function() {
						beforeEach(async function() {
							await token.updateFeatures(FEATURE_TRANSFERS, {from: a0});
							await token.updateRole(from, not(ROLE_ERC20_SENDER), {from: a0});
						});
						it("transfer to unsafe receiver reverts", async function() {
							await expectRevert.unspecified(token.transfer(_to, value, {from}));
						});
					});
				});

				describe("when EIP712 Delegation signature is prepared", function() {
					const delegate = to;
					const nonce = ZERO_BYTES32;
					let v, r, s;
					beforeEach(async function() {
						({v, r, s} = await eip712_delegate(token.address, delegate, nonce, expiry, w.privateKey));
					});

					describe("when FEATURE_DELEGATIONS_ON_BEHALF is enabled", function() {
						beforeEach(async function() {
							await token.updateFeatures(FEATURE_DELEGATIONS_ON_BEHALF, {from: a0});
						});
						it("delegation on behalf succeeds", async function() {
							await token.delegateWithAuthorization(delegate, nonce, expiry, v, r, s, {from});
						});
					});
					describe("when FEATURE_DELEGATIONS_ON_BEHALF is disabled", function() {
						beforeEach(async function() {
							await token.updateFeatures(not(FEATURE_DELEGATIONS_ON_BEHALF), {from: a0});
						});
						it("delegation on behalf reverts", async function() {
							await expectRevert(
								token.delegateWithAuthorization(delegate, nonce, expiry, v, r, s, {from}),
								"delegations on behalf are disabled"
							);
						});
					});
				});
				describe("when EIP712 Permit signature is prepared", function() {
					const owner = w.address;
					const spender = by;
					const nonce = 0;
					let v, r, s;
					beforeEach(async function() {
						({v, r, s} = await eip712_permit(token.address, owner, spender, value, nonce, deadline, w.privateKey));
					});
					describe("when FEATURE_EIP2612_PERMITS is enabled", function() {
						beforeEach(async function() {
							await token.updateFeatures(FEATURE_EIP2612_PERMITS, {from: a0});
						});
						it("EIP-2612 permit succeeds", async function() {
							await token.permit(owner, spender, value, deadline, v, r, s, {from: by});
						});
					});
					describe("when FEATURE_EIP2612_PERMITS is disabled", function() {
						beforeEach(async function() {
							await token.updateFeatures(not(FEATURE_EIP2612_PERMITS), {from: a0});
						});
						it("EIP-2612 permit reverts", async function() {
							await expectRevert(
								token.permit(owner, spender, value, deadline, v, r, s, {from: by}),
								"EIP2612 permits are disabled"
							);
						});
					});
				});
				describe("when EIP712 TransferWithAuthorization signature is prepared", function() {
					const nonce = ZERO_BYTES32;
					let v, r, s;
					beforeEach(async function() {
						await token.updateFeatures(FEATURE_TRANSFERS, {from: a0});
						await token.transfer(w.address, value, {from});
						({
							v,
							r,
							s
						} = await eip712_transfer(token.address, w.address, to, value, validAfter, validBefore, nonce, w.privateKey));
					});
					describe("when FEATURE_EIP3009_TRANSFERS is enabled", function() {
						beforeEach(async function() {
							await token.updateFeatures(FEATURE_TRANSFERS | FEATURE_EIP3009_TRANSFERS, {from: a0});
						});
						it("EIP-3009 transfer succeeds", async function() {
							await token.transferWithAuthorization(w.address, to, value, validAfter, validBefore, nonce, v, r, s, {from: by});
						});
					});
					describe("when FEATURE_EIP3009_TRANSFERS is disabled", function() {
						beforeEach(async function() {
							await token.updateFeatures(not(FEATURE_EIP3009_TRANSFERS), {from: a0});
						});
						it("EIP-3009 transfer reverts", async function() {
							await expectRevert(
								token.transferWithAuthorization(w.address, to, value, validAfter, validBefore, nonce, v, r, s, {from: by}),
								"EIP3009 transfers are disabled"
							);
						});
					});
				});
				describe("when EIP712 ReceiveWithAuthorization signature is prepared", function() {
					const nonce = ZERO_BYTES32;
					let v, r, s;
					beforeEach(async function() {
						await token.updateFeatures(FEATURE_TRANSFERS, {from: a0});
						await token.transfer(w.address, value, {from});
						({
							v,
							r,
							s
						} = await eip712_receive(token.address, w.address, to, value, validAfter, validBefore, nonce, w.privateKey));
					});
					describe("when FEATURE_EIP3009_RECEPTIONS is enabled", function() {
						beforeEach(async function() {
							await token.updateFeatures(FEATURE_TRANSFERS | FEATURE_EIP3009_RECEPTIONS, {from: a0});
						});
						it("EIP-3009 reception succeeds", async function() {
							await token.receiveWithAuthorization(w.address, to, value, validAfter, validBefore, nonce, v, r, s, {from: to});
						});
					});
					describe("when FEATURE_EIP3009_RECEPTIONS is disabled", function() {
						beforeEach(async function() {
							await token.updateFeatures(not(FEATURE_EIP3009_RECEPTIONS), {from: a0});
						});
						it("EIP-3009 reception reverts", async function() {
							await expectRevert(
								token.receiveWithAuthorization(w.address, to, value, validAfter, validBefore, nonce, v, r, s, {from: to}),
								"EIP3009 receptions are disabled"
							);
						});
					});
				});

				describe("when FEATURE_TRANSFERS is enabled", function() {
					beforeEach(async function() {
						await token.updateFeatures(FEATURE_TRANSFERS, {from: a0});
					});
					it("direct transfer succeeds", async function() {
						await token.transfer(to, value, {from});
					});
				});
				describe("when FEATURE_TRANSFERS is disabled", function() {
					beforeEach(async function() {
						await token.updateFeatures(not(FEATURE_TRANSFERS), {from: a0});
					});
					it("direct transfer reverts", async function() {
						await expectRevert(token.transfer(to, value, {from}), "transfers are disabled");
					});
				});
				describe("when FEATURE_OWN_BURNS is enabled", function() {
					beforeEach(async function() {
						await token.updateFeatures(FEATURE_OWN_BURNS, {from: a0});
					});
					it("self burn succeeds", async function() {
						await token.burn(from, value, {from});
					});
				});
				describe("when FEATURE_OWN_BURNS is disabled", function() {
					beforeEach(async function() {
						await token.updateFeatures(not(FEATURE_OWN_BURNS), {from: a0});
					});
					it("self burn reverts", async function() {
						await expectRevert(token.burn(from, value, {from}), "burns are disabled");
					});
				});
				describe("when FEATURE_DELEGATIONS is enabled", function() {
					beforeEach(async function() {
						await token.updateFeatures(FEATURE_DELEGATIONS, {from: a0});
					});
					it("delegation succeeds", async function() {
						await token.delegate(to, {from});
					});
				});
				describe("when FEATURE_DELEGATIONS is disabled", function() {
					beforeEach(async function() {
						await token.updateFeatures(not(FEATURE_DELEGATIONS), {from: a0});
					});
					it("delegation reverts", async function() {
						await expectRevert(token.delegate(to, {from}), "delegations are disabled");
					});
				});

				describe("when ERC-1363 acceptor is deployed", function() {
					let acceptor;
					beforeEach(async function() {
						acceptor = await erc1363_deploy_acceptor(a0);
					});
					describe("when FEATURE_ERC1363_TRANSFERS is enabled", function() {
						beforeEach(async function() {
							await token.updateFeatures(FEATURE_TRANSFERS | FEATURE_ERC1363_TRANSFERS, {from: a0});
						});
						it("ERC-1363 transfer and call succeeds", async function() {
							await (token.methods["transferAndCall(address,uint256)"](acceptor.address, value, {from}));
						});
					});
					describe("when FEATURE_ERC1363_TRANSFERS is disabled", function() {
						beforeEach(async function() {
							await token.updateFeatures(not(FEATURE_ERC1363_TRANSFERS), {from: a0});
						});
						it("ERC-1363 transfer and call reverts", async function() {
							await expectRevert(
								token.methods["transferAndCall(address,uint256)"](acceptor.address, value, {from}),
								"ERC1363 transfers are disabled"
							);
						});
					});
					describe("when FEATURE_ERC1363_APPROVALS is enabled", function() {
						beforeEach(async function() {
							await token.updateFeatures(FEATURE_ERC1363_APPROVALS, {from: a0});
						});
						it("ERC-1363 approve and call succeeds", async function() {
							await (token.methods["approveAndCall(address,uint256)"](acceptor.address, value, {from}));
						});
					});
					describe("when FEATURE_ERC1363_APPROVALS is disabled", function() {
						beforeEach(async function() {
							await token.updateFeatures(not(FEATURE_ERC1363_APPROVALS), {from: a0});
						});
						it("ERC-1363 approve and call reverts", async function() {
							await expectRevert(
								token.methods["approveAndCall(address,uint256)"](acceptor.address, value, {from}),
								"ERC1363 approvals are disabled"
							);
						});
					});
				});

				describe("when operator is TOKEN_CREATOR", function() {
					beforeEach(async function() {
						await token.updateRole(by, ROLE_TOKEN_CREATOR, {from: a0});
					});
					it("mint succeeds", async function() {
						await token.mint(to, value, {from: by});
					});
				});
				describe("when operator is not TOKEN_CREATOR", function() {
					beforeEach(async function() {
						await token.updateRole(by, not(ROLE_TOKEN_CREATOR), {from: a0});
					});
					it("mint reverts", async function() {
						await expectRevert(token.mint(to, value, {from: by}), "access denied");
					});
				});
				describe("when operator is TOKEN_DESTROYER", function() {
					beforeEach(async function() {
						await token.updateRole(by, ROLE_TOKEN_DESTROYER, {from: a0});
					});
					it("burn succeeds", async function() {
						await token.burn(from, value, {from: by});
					});
				});
				describe("when operator is not TOKEN_DESTROYER and FEATURE_BURNS_ON_BEHALF is enabled", function() {
					beforeEach(async function() {
						await token.updateFeatures(FEATURE_BURNS_ON_BEHALF, {from: a0});
						await token.updateRole(by, not(ROLE_TOKEN_DESTROYER), {from: a0});
					});
					it("burn reverts", async function() {
						await expectRevert(token.burn(from, value, {from: by}), "burn amount exceeds allowance");
					});
				});
			});
		});
	}

	// run test suite
	test_suite("AliERC20v2", ali_erc20_deploy_restricted);
});
