// tests for 96-bits (short) and 32-bits (tiny) token ID spaces

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

// deployment routines in use, token name and symbol
const {
	short_erc721_deploy,
	burnable_short_erc721_deploy,
	tiny_erc721_deploy,
	erc721_receiver_deploy,
} = require("./include/deployment_routines");

// run ERC721 permit related tests
contract("ERC721: ID Space Tests (32/96 bits)", function(accounts) {
	// extract accounts to be used:
	// A0 – special default zero account accounts[0] used by Truffle, reserved
	// a0 – deployment account having all the permissions, reserved
	// H0 – initial token holder account
	// a1, a2,... – working accounts to perform tests on
	const [A0, a0, H0, a1, a2] = accounts;

	// test suite
	function id_space_suite(contract_name, deployment_fn, bits) {
		describe(contract_name, function() {
			// deploy token
			let token;
			beforeEach(async function() {
				token = await deployment_fn.call(this, a0);
			});

			// run the suite
			const longId = new BN(2).pow(new BN(bits));
			const shortId = longId.subn(1);
			it(`minting token ID = 2^${bits} fails`, async function() {
				await expectRevert(token.mint(a1, longId, {from: a0}), "token ID overflow");
			});
			it(`safeMint token ID = 2^${bits} fails`, async function() {
				await expectRevert(token.safeMint(a1, longId, "0xfacade", {from: a0}), "token ID overflow");
			});
			describe(`minting token ID = 2^${bits} - 1 succeeds`, function() {
				let receipt;
				beforeEach(async function() {
					receipt = await token.mint(a1, shortId, {from: a0});
				});
				it("Transfer event is emitted", async function() {
					expectEvent(receipt, "Transfer", {
						_from: ZERO_ADDRESS,
						_to: a1,
						_tokenId: shortId,
					});
				});
				it("token is created", async function() {
					expect(await token.exists(shortId)).to.be.true;
				});
				it("token is transferable", async function() {
					expect(await token.isTransferable(shortId)).to.be.true;
				});
			});
			describe(`safeMinting token ID = 2^${bits} - 1 succeeds`, function() {
				let recipient, receipt;
				beforeEach(async function() {
					recipient = await erc721_receiver_deploy(a0);
					receipt = await token.safeMint(recipient.address, shortId, "0xfacade", {from: a0});
				});
				it('"Received" event is emitted', async function() {
					await expectEvent.inTransaction(receipt.tx, recipient, "Received", {
						operator: a0,
						from: ZERO_ADDRESS,
						tokenId: shortId,
						data: "0xfacade",
					});
				});
				it("Transfer event is emitted", async function() {
					expectEvent(receipt, "Transfer", {
						_from: ZERO_ADDRESS,
						_to: recipient.address,
						_tokenId: shortId,
					});
				});
				it("token is created", async function() {
					expect(await token.exists(shortId)).to.be.true;
				});
				it("token is transferable", async function() {
					expect(await token.isTransferable(shortId)).to.be.true;
				});
			});
		});
	}

	id_space_suite("ShortERC721", short_erc721_deploy, 96);
	id_space_suite("BurnableShortERC721", burnable_short_erc721_deploy, 96);
	id_space_suite("TinyERC721", tiny_erc721_deploy, 32);
});
