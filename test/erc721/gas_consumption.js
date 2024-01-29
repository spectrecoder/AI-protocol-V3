// Alethea ERC721: Gas Consumption Tests (non-functional requirements' compliance)

// Zeppelin test helpers (chai only)
const {
	assert,
	expect,
} = require("chai");

// block utils
const {
	default_deadline,
	extract_gas,
} = require("../include/block_utils");

// ERC721 EIP712 helpers
const {
	eip712_permit,
	eip712_permit_for_all,
} = require("./include/erc721_eip712");

// deployment routines in use
const {
	short_erc721_deploy,
	burnable_short_erc721_deploy,
	tiny_erc721_deploy,
	zeppelin_erc721_deploy,
	erc721_receiver_deploy,
} = require("./include/deployment_routines");

// run gas consumption tests (non-functional requirements' compliance)
contract("ERC721: Gas Consumption (Non-functional Requirements) tests", function(accounts) {
	// extract accounts to be used:
	// A0 – special default zero account accounts[0] used by Truffle, reserved
	// a0 – deployment account having all the permissions, reserved
	// H0 – initial token holder account
	// a1, a2,... – working accounts to perform tests on
	const [A0, a0, H0, a1, a2, a3, a4] = accounts;

	// test suite
	function gas_usage_suite(
		contract_name,
		deployment_fn,
		burnable = true, // whether to run burn tests or not
		permittable = true,
		batch_mintable = false,
		g0, // deployment
		g11, g12, g13, g14, // transfers to EOA
		g15, g16, g17, // transfers to ERC721Receiver
		g21, g22, // approvals
		g31, g32, // permits
		g41, g42, // mints
		g51, g52, // batch minting
		g61, g62, g63, // burns
	) {
		describe(contract_name, function() {
			const from = a1;
			const to = a2;
			const by = a3;
			// WARNING! initial token ID layout is very important:
			// it defines how local/global collections are initially allocated
			// 1. we don't mint tokens to the receivers, willing to provoke storage allocation on transfer;
			// 2. we mint 8 tokens to the sender to prevent storage deallocation on transfer:
			//    - for 96-bits IDs they consume 4 slots, and won't free up slot when removing one
			//    - for 32-bits IDs they consume 1 full slot, and won't free up slot when removing one
			const token_ids = new Array(8).fill(0xF001_0001).map((v, i) => v + i);
			const token_id = token_ids[1];

			// deploy token and pre-mint tokens required
			let token;
			beforeEach(async function() {
				token = await deployment_fn.call(this, a0);

				// setup: mint several tokens to init local/global collections properly
				for(let tokenId of token_ids) {
					await token.mint(a1, tokenId, {from: a0});
				}
			});

			// run the suite
			let receipt;
			function consumes_no_more_than(gas, used) {
				// tests marked with @skip-on-coverage will are removed from solidity-coverage,
				// see yield-solcover.js, see https://github.com/sc-forks/solidity-coverage/blob/master/docs/advanced.md
				it(`consumes no more than ${gas} gas  [ @skip-on-coverage ]`, async function() {
					const gasUsed = used? used: extract_gas(receipt);
					expect(gasUsed).to.be.lte(gas);
					if(gas - gasUsed > gas / 20) {
						console.log("only %o gas was used while expected up to %o", gasUsed, gas);
					}
				});
			}

			function gas_usage_deployment(g1) {
				describe("deployment", function() {
					beforeEach(async function() {
						receipt = {receipt: await web3.eth.getTransactionReceipt(token.transactionHash)};
					});
					consumes_no_more_than(g1);
				});
			}

			function gas_usage_transfers(g1, g2, g3, g4, g5, g6, g7) {
				describe("average direct transfer to EOA", function() {
					beforeEach(async function() {
						let gasUsed = 0;
						for(let tokenId of token_ids) {
							const receipt = await token.safeTransferFrom(from, to, tokenId, {from});
							gasUsed += extract_gas(receipt);
						}
						gasUsed = Math.ceil(gasUsed / token_ids.length);
						receipt = {gasUsed};
					});
					consumes_no_more_than(g1);
				});
				describe("direct transfer to EOA", function() {
					beforeEach(async function() {
						receipt = await token.safeTransferFrom(from, to, token_id, {from});
					});
					consumes_no_more_than(g2);
				});
				describe("transfer on behalf to EOA", function() {
					beforeEach(async function() {
						await token.approve(by, token_id, {from});
						receipt = await token.safeTransferFrom(from, to, token_id, {from: by});
					});
					consumes_no_more_than(g3);
				});
				describe("transfer on behalf by an operator to EOA", function() {
					beforeEach(async function() {
						await token.setApprovalForAll(by, true, {from});
						receipt = await token.safeTransferFrom(from, to, token_id, {from: by});
					});
					consumes_no_more_than(g4);
				});
				{
					let receiver;
					beforeEach(async function() {
						receiver = await erc721_receiver_deploy(a0);
					});

					describe("direct transfer to ERC721Receiver", function() {
						beforeEach(async function() {
							receipt = await token.safeTransferFrom(from, receiver.address, token_id, {from})
						});
						consumes_no_more_than(g5);
					});
					describe("transfer on behalf to ERC721Receiver", function() {
						beforeEach(async function() {
							await token.approve(by, token_id, {from});
							receipt = await token.safeTransferFrom(from, receiver.address, token_id, {from: by});
						});
						consumes_no_more_than(g6);
					});
					describe("transfer on behalf by an operator to ERC721Receiver", function() {
						beforeEach(async function() {
							await token.setApprovalForAll(by, true, {from});
							receipt = await token.safeTransferFrom(from, receiver.address, token_id, {from: by});
						});
						consumes_no_more_than(g7);
					});
				}
			}

			function gas_usage_approvals(g1, g2) {
				describe("approve", function() {
					beforeEach(async function() {
						receipt = await token.approve(by, token_id, {from});
					});
					consumes_no_more_than(g1);
				});
				describe("approve for all", function() {
					beforeEach(async function() {
						receipt = await token.setApprovalForAll(by, true, {from});
					});
					consumes_no_more_than(g2);
				});
			}

			function gas_usage_permits(g1, g2) {
				// create empty account with known private key
				const w = web3.eth.accounts.create();

				// prepare some signature related defaults
				const owner = w.address;
				const operator = a3;
				let nonce = 0;
				let deadline;
				beforeEach(async function() {
					deadline = await default_deadline();
				});

				describe("first permit", function() {
					const tokenId = 0xFF00_0001;
					beforeEach(async function() {
						await token.mint(owner, tokenId, {from: a0});
					});
					beforeEach(async function() {
						const {v, r, s} = await eip712_permit(token.address, owner, operator, tokenId, nonce, deadline, w.privateKey);
						receipt = await token.permit(owner, operator, tokenId, deadline, v, r, s);
					});
					consumes_no_more_than(g1);
				});
				describe("first permit for all", function() {
					beforeEach(async function() {
						const {v, r, s} = await eip712_permit_for_all(token.address, owner, operator, true, nonce, deadline, w.privateKey);
						receipt = await token.permitForAll(owner, operator, true, deadline, v, r, s);
					});
					consumes_no_more_than(g2);
				});
			}

			function gas_usage_mints(g1, g2) {
				const token_id = 0xFF00_0001;
				describe("mint to EOA", function() {
					beforeEach(async function() {
						receipt = await token.safeMint(to, token_id, "0xfacade", {from: a0});
					});
					consumes_no_more_than(g1);
				});
				describe("mint to ERC721Receiver", function() {
					beforeEach(async function() {
						const receiver = await erc721_receiver_deploy(a0);
						receipt = await token.safeMint(receiver.address, token_id, "0xfacade", {from: a0});
					});
					consumes_no_more_than(g2);
				});
			}

			function gas_usage_batch_mints(g1, g2) {
				const token_id = 0xFF00_0001;
				const batch_size = 40;
				describe("batch mint to EOA", function() {
					beforeEach(async function() {
						receipt = await token.safeMintBatch(to, token_id, batch_size, {from: a0});
						receipt = {gasUsed: Math.ceil(extract_gas(receipt) / batch_size)};
					});
					consumes_no_more_than(g1);
				});
				describe("mint to ERC721Receiver", function() {
					beforeEach(async function() {
						const receiver = await erc721_receiver_deploy(a0);
						receipt = await token.safeMintBatch(receiver.address, token_id, batch_size, {from: a0});
						receipt = {gasUsed: Math.ceil(extract_gas(receipt) / batch_size)};
					});
					consumes_no_more_than(g2);
				});
			}

			function gas_usage_burns(g1, g2, g3) {
				describe("burn", function() {
					beforeEach(async function() {
						receipt = await token.burn(token_id, {from});
					})
					consumes_no_more_than(g1);
				});
				describe("burn on behalf", function() {
					beforeEach(async function() {
						await token.approve(by, token_id, {from});
						receipt = await token.burn(token_id, {from: by});
					});
					consumes_no_more_than(g2);
				});
				describe("burn on behalf by an operator", function() {
					beforeEach(async function() {
						await token.setApprovalForAll(by, true, {from});
						receipt = await token.burn(token_id, {from: by});
					});
					consumes_no_more_than(g3);
				});
			}

			gas_usage_deployment(g0);
			gas_usage_transfers(g11, g12, g13, g14, g15, g16, g17);
			gas_usage_approvals(g21, g22);
			if(permittable) {
				gas_usage_permits(g31, g32);
			}
			gas_usage_mints(g41, g42);
			if(batch_mintable) {
				gas_usage_batch_mints(g51, g52);
			}
			if(burnable) {
				gas_usage_burns(g61, g62, g63);
			}
		});
	}

	describe("worst case scenario (no storage deallocation)", function() {
		gas_usage_suite(
			"ShortERC721", short_erc721_deploy,
			false, true, true,
			2667222, // deployment
			74245, 106064, 104541, 108876, 110670, 109013, 113482, // transfers
			48603, 46321, // approvals
			79575, 77285, // permits
			124080, 129080, // mint
			49876, 54653, // batch minting
		);
		gas_usage_suite(
			"BurnableShortERC721", burnable_short_erc721_deploy,
			true, true, true,
			2876440, // deployment
			74285, 106082, 104581, 108894, 110684, 109053, 113496, // transfers
			48603, 46318, // approvals
			79575, 77285, // permits
			146419, 151397, // mint
			72385, 77162, // batch minting
			80947, 79446, 83759, // burn
		);
		gas_usage_suite(
			"TinyERC721", tiny_erc721_deploy,
			true, true, true,
			2911384, // deployment
			67420, 101360, 99859, 104172, 105959, 104331, 108771, // transfers
			48603, 46318, // approvals
			79575, 77292, // permits
			124122, 129122, // mint
			32412, 37190, // batch minting
			64511, 63010, 67323, // burn
		);
		gas_usage_suite(
			"ZeppelinERC721", zeppelin_erc721_deploy,
			true, false, true,
			1741686, // deployment
			83972, 99744, 98247, 102523, 104216, 102719, 106995, // transfers
			48813, 46199, // approvals
			null, null,
			146713, 151764, // mint
			115573, 120167, // batch minting
			70453, 72693, 70453, // burn
		);
	});
});
