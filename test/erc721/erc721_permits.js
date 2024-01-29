// tests for EIP-712 permits for ERC721 tokens

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

// ERC721 EIP712 helpers
const {
	default_deadline,
	eip712_permit,
	eip712_permit_for_all,
} = require("./include/erc721_eip712");

// deployment routines in use, token name and symbol
const {
	short_erc721_deploy,
	burnable_short_erc721_deploy,
	tiny_erc721_deploy,
} = require("./include/deployment_routines");

// run ERC721 permit related tests
contract("ERC721: Permits", function(accounts) {
	// extract accounts to be used:
	// A0 – special default zero account accounts[0] used by Truffle, reserved
	// a0 – deployment account having all the permissions, reserved
	// H0 – initial token holder account
	// a1, a2,... – working accounts to perform tests on
	const [A0, a0, H0, a1, a2] = accounts;

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

	// test suite
	function permits_suite(contract_name, deployment_fn) {
		describe(contract_name, function() {
			// deploy token
			let token;
			beforeEach(async function() {
				token = await deployment_fn.call(this, a0);
			});

			// run the suite
			describe("Permit", function() {
				// mint one token for the permit/approve
				const tokenId = 1;
				beforeEach(async function() {
					await token.mint(owner, tokenId, {from: a0});
				});

				it("reverts when Permit signature is not valid", async function() {
					// override signing account, so the signature becomes invalid
					const w = web3.eth.accounts.create();
					const {v, r, s} = await eip712_permit(token.address, owner, operator, tokenId, nonce, deadline, w.privateKey);
					await expectRevert(token.permit(owner, operator, tokenId, deadline, v, r, s), "invalid signature");
				});
				it("reverts when Permit signature is expired", async function() {
					// override the deadline with incorrect (expired) value
					const deadline = 0;
					const {v, r, s} = await eip712_permit(token.address, owner, operator, tokenId, nonce, deadline, w.privateKey);
					await expectRevert(token.permit(owner, operator, tokenId, deadline, v, r, s), "signature expired");
				});
				it("reverts when Permit signature nonce is invalid", async function() {
					// override nonce with incorrect (initial value is zero) value
					const nonce = 1;
					const {v, r, s} = await eip712_permit(token.address, owner, operator, tokenId, nonce, deadline, w.privateKey);
					await expectRevert(token.permit(owner, operator, tokenId, deadline, v, r, s), "invalid signature");
				});
				it("reverts when Permit approves non-existing token", async function() {
					// override tokenId with incorrect (non-existing) value
					const tokenId = 2;
					const {v, r, s} = await eip712_permit(token.address, owner, operator, tokenId, nonce, deadline, w.privateKey);
					await expectRevert(token.permit(owner, operator, tokenId, deadline, v, r, s), "token doesn't exist");
				});
				it("reverts when Permit approves someone else's token", async function() {
					const w = web3.eth.accounts.create();
					// override the owner account, so the tokenId becomes incorrect (belongs to the wrong account)
					const owner = w.address;
					const {v, r, s} = await eip712_permit(token.address, owner, operator, tokenId, nonce, deadline, w.privateKey);
					await expectRevert(token.permit(owner, operator, tokenId, deadline, v, r, s), "access denied");
				});
				it("reverts when Permit self approves", async function() {
					// override operator with incorrect (self – owner) value
					const operator = owner;
					const {v, r, s} = await eip712_permit(token.address, owner, operator, tokenId, nonce, deadline, w.privateKey);
					await expectRevert(token.permit(owner, operator, tokenId, deadline, v, r, s), "self approval");
				});
				describe("succeeds when Permit signature is valid", function() {
					let receipt;
					beforeEach(async function() {
						const {v, r, s} = await eip712_permit(token.address, owner, operator, tokenId, nonce, deadline, w.privateKey);
						receipt = await token.permit(owner, operator, tokenId, deadline, v, r, s);
					});
					it("emits Approval event", async function() {
						expectEvent(receipt, "Approval", {
							_owner: owner,
							_approved: operator,
							_tokenId: new BN(tokenId),
						});
					});
					it("approval is created", async function() {
						expect(await token.getApproved(tokenId)).to.equal(operator);
					});
					it("permit nonce increases", async function() {
						expect(await token.permitNonces(owner)).to.be.bignumber.that.equals(nonce + 1 + "");
					});
				});
			});
			describe("PermitForAll", function() {
				const approved = true;

				it("reverts when PermitForAll signature is not valid", async function() {
					// override signing account, so the signature becomes invalid
					const w = web3.eth.accounts.create();
					const {v, r, s} = await eip712_permit_for_all(token.address, owner, operator, approved, nonce, deadline, w.privateKey);
					await expectRevert(token.permitForAll(owner, operator, approved, deadline, v, r, s), "invalid signature");
				});
				it("reverts when PermitForAll signature is expired", async function() {
					// override the deadline with incorrect (expired) value
					const deadline = 0;
					const {v, r, s} = await eip712_permit_for_all(token.address, owner, operator, approved, nonce, deadline, w.privateKey);
					await expectRevert(token.permitForAll(owner, operator, approved, deadline, v, r, s), "signature expired");
				});
				it("reverts when PermitForAll signature nonce is invalid", async function() {
					// override nonce with incorrect (initial value is zero) value
					const nonce = 1;
					const {v, r, s} = await eip712_permit_for_all(token.address, owner, operator, approved, nonce, deadline, w.privateKey);
					await expectRevert(token.permitForAll(owner, operator, approved, deadline, v, r, s), "invalid signature");
				});
				it("reverts when PermitForAll self approves", async function() {
					// override operator with incorrect (self – owner) value
					const operator = owner;
					const {v, r, s} = await eip712_permit_for_all(token.address, owner, operator, approved, nonce, deadline, w.privateKey);
					await expectRevert(token.permitForAll(owner, operator, approved, deadline, v, r, s), "self approval");
				});
				describe("succeeds when PermitForAll signature is valid", function() {
					let receipt;
					beforeEach(async function() {
						const {v, r, s} = await eip712_permit_for_all(token.address, owner, operator, approved, nonce, deadline, w.privateKey);
						receipt = await token.permitForAll(owner, operator, approved, deadline, v, r, s);
					});
					it("emits ApprovalForAll event", async function() {
						expectEvent(receipt, "ApprovalForAll", {
							_owner: owner,
							_operator: operator,
							_approved: approved,
						});
					});
					it("an approved operator is created", async function() {
						expect(await token.isApprovedForAll(owner, operator)).to.equal(approved);
					});
					it("permit nonce increases", async function() {
						expect(await token.permitNonces(owner)).to.be.bignumber.that.equals(nonce + 1 + "");
					});
				});
			});
		});
	}

	permits_suite("ShortERC721", short_erc721_deploy);
	permits_suite("BurnableShortERC721", burnable_short_erc721_deploy);
	permits_suite("TinyERC721", tiny_erc721_deploy);
});

