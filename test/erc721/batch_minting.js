// batch minting tests

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

// number utils
const {random_int} = require("../include/number_utils");

// deployment routines in use, token name and symbol
const {
	short_erc721_deploy,
	burnable_short_erc721_deploy,
	tiny_erc721_deploy,
	erc721_receiver_deploy,
} = require("./include/deployment_routines");

// run batch minting tests
contract("ERC721: batch minting", function(accounts) {
	// extract accounts to be used:
	// A0 – special default zero account accounts[0] used by Truffle, reserved
	// a0 – deployment account having all the permissions, reserved
	// H0 – initial token holder account
	// a1, a2,... – working accounts to perform tests on
	const [A0, a0, H0, a1, a2] = accounts;

	// test suite
	function batch_minting_suite(contract_name, deployment_fn, id_space_bits) {
		describe(contract_name, function() {
			// deploy token
			let token;
			beforeEach(async function() {
				token = await deployment_fn.call(this, a0);
			});

			// setup aux constants and functions
			let to = a1;
			const firstId = 1;
			const n = random_int(2, 4);
			function mint_batch_succeeds() {
				let receipt;
				beforeEach(async function() {
					receipt = await token.mintBatch(to, firstId, n, {from: a0});
				});
				it("all the tokens in a batch get created", async function() {
					for(let i = 0; i < n; i++) {
						expect(await token.exists(firstId + i), `${i} token in a batch doesn't exist`).to.be.true;
					}
				});
				it("all the tokens in a batch belong to the expected recipient", async function() {
					for(let i = 0; i < n; i++) {
						expect(await token.ownerOf(firstId + i), `${i} token in a batch doesn't belong to the recipient`).to.be.equal(to);
					}
				});
				it("all the tokens in a batch are added to the global collection", async function() {
					for(let i = 0; i < n; i++) {
						expect(
							await token.tokenByIndex(i),
							`${i} token in a global index has unexpected ID`
						).to.be.bignumber.that.equals(firstId + i + "");
					}
				});
				it("all the tokens in a batch are added to the local collection", async function() {
					for(let i = 0; i < n; i++) {
						expect(
							await token.tokenOfOwnerByIndex(to, i),
							`${i} token in a local index has unexpected ID`
						).to.be.bignumber.that.equals(firstId + i + "");
					}
				});
				it('"Transfer" event is emitted for each token minted', async function() {
					for(let i = 0; i < n; i++) {
						expectEvent(receipt, "Transfer", {
							_from: ZERO_ADDRESS,
							_to: to,
							_tokenId: new BN(firstId + i)
						});
					}
				});
			}

			// run the suite
			describe("mintBatch", function() {
				it("fails if recipient is zero", async function() {
					await expectRevert(token.mintBatch(ZERO_ADDRESS, firstId, n, {from: a0}), "zero address");
				});
				it("fails if n = 0", async function() {
					await expectRevert(token.mintBatch(to, firstId, 0, {from: a0}), "n is too small");
				});
				it("fails if n = 1", async function() {
					await expectRevert(token.mintBatch(to, firstId, 1, {from: a0}), "n is too small");
				});
				it("fails if first token ID overflows", async function() {
					const overflowId = new BN(2).pow(new BN(id_space_bits));
					await expectRevert(token.mintBatch(to, overflowId, n, {from: a0}), "token ID overflow");
				});
				it("fails if last token ID overflows", async function() {
					const overflowId = new BN(2).pow(new BN(id_space_bits)).subn(n - 1);
					await expectRevert(token.mintBatch(to, overflowId, n, {from: a0}), "n-th token ID overflow");
				});
				it("fails if at least one of the tokens in a batch already exists", async function() {
					await token.safeMint(a2, firstId + 1, "0xfacade", {from: a0});
					await expectRevert(token.mintBatch(to, firstId, n, {from: a0}), "already minted");
				});
				describe("succeeds otherwise", function() {
					mint_batch_succeeds();
				});
			});

			describe("safeMintBatch", function() {
				it("fails if receiver is not valid", async function() {
					await expectRevert.unspecified(token.safeMintBatch(token.address, firstId, n, {from: a0}));
				});
				it("fails if receiver rejected the token", async function() {
					const receiver = await erc721_receiver_deploy(a0, "0xfacade");
					await expectRevert(token.safeMintBatch(receiver.address, firstId, n, {from: a0}), "invalid onERC721Received response");
				});
				describe("succeeds otherwise", function() {
					beforeEach(async function() {
						const receiver = await erc721_receiver_deploy(a0);
						to = receiver.address;
					});
					mint_batch_succeeds();
				});
			});
		});
	}

	batch_minting_suite("ShortERC721", short_erc721_deploy, 96);
	batch_minting_suite("BurnableShortERC721", burnable_short_erc721_deploy, 96);
	batch_minting_suite("TinyERC721", tiny_erc721_deploy, 32);
});
