// Alethea ERC721: "owner" tests to support OpenSea collections

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

// ACL token features and roles
const {
	not,
	ROLE_OWNER_MANAGER,
} = require("../../include/features_roles");

// deployment routines in use, token name and symbol
const {
	royal_nft_deploy,
} = require("../include/deployment_routines");

// run OpenSea/Zeppelin Ownable tests
contract("RoyalNFT: OpenSea/Zeppelin Ownable Tests", function(accounts) {
	// extract accounts to be used:
	// A0 – special default zero account accounts[0] used by Truffle, reserved
	// a0 – deployment account having all the permissions, reserved
	// H0 – initial token holder account
	// a1, a2,... – working accounts to perform tests on
	const [A0, a0, H0, a1, a2, a3, a4, a5] = accounts;

	// token deployment
	let nft;
	beforeEach(async function() {
		nft = await royal_nft_deploy(a0);
	});

	// default operator
	const by = a1;
	// default new owner
	const to = a2;

	// "owner" tests
	it('"owner" is set to the deployer address initially', async function() {
		expect(await nft.owner(), "unexpected owner").to.equal(a0);
		expect(await nft.isOwner(a0), "isOwner(a0) returns false").to.be.true;
	});

	// a function to transfer ownership
	async function changeOwner() {
		return await nft.transferOwnership(to, {from: by});
	}

	describe("when sender doesn't have ROLE_OWNER_MANAGER permission", function() {
		beforeEach(async function() {
			await nft.updateRole(by, not(ROLE_OWNER_MANAGER), {from: a0});
		});
		it("setOwner fails", async function() {
			await expectRevert(changeOwner(), "access denied");
		});
	});
	describe("when sender has ROLE_OWNER_MANAGER permission", function() {
		beforeEach(async function() {
			await nft.updateRole(by, ROLE_OWNER_MANAGER, {from: a0});
		});
		describe("setOwner succeeds", function() {
			let receipt;
			beforeEach(async function() {
				receipt = await changeOwner();
			});
			it("owner gets set as expected", async function() {
				expect(await nft.owner(), "unexpected owner").to.equal(to);
				expect(await nft.isOwner(to), "isOwner(to) returns false").to.be.true;
			});
			it('"OwnerUpdated" event is emitted', async function() {
				expectEvent(receipt, "OwnerUpdated", {
					_by: by,
					_oldVal: a0,
					_newVal: to,
				});
			});
			it('"OwnershipTransferred" event is emitted', async function() {
				expectEvent(receipt, "OwnershipTransferred", {
					previousOwner: a0,
					newOwner: to,
				});
			});
			it('new "owner" cannot change owner due to lack of ROLE_OWNER_MANAGER permission', async function() {
				await expectRevert(nft.transferOwnership(by, {from: to}), "access denied");
			});
		});
	});
});
