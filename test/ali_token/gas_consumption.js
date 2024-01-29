// Alethea ERC20: Gas Consumption Tests (non-functional requirements' compliance)

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
const {random_bn} = require("../include/bn_utils");

// block utils
const {extract_gas} = require("../include/block_utils");

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

// ACL token features and roles
const {ROLE_TOKEN_CREATOR} = require("../include/features_roles");

// deployment routines in use
const {
	ali_erc20_deploy,
	erc1363_deploy_acceptor,
} = require("./include/deployment_routines");

// run gas consumption tests (non-functional requirements' compliance)
contract("AliERC20: Gas Consumption (Non-functional Requirements) tests", function(accounts) {
	// extract accounts to be used:
	// A0 – special default zero account accounts[0] used by Truffle, reserved
	// a0 – deployment account having all the permissions, reserved
	// H0 – initial token holder account
	// a1, a2,... – working accounts to perform tests on
	const [A0, a0, H0, a1, a2] = accounts;

	let ali;
	beforeEach(async function() {
		ali = await ali_erc20_deploy(a0, H0);
	});

	describe("Non-functional Requirements compliance", function() {
		// expiration, deadlines, validity defaults
		const expiry = 10e9;
		const deadline = 10e9;
		const validBefore = 10e9;
		const validAfter = 10e3;
		// create empty account with known private key
		const w = web3.eth.accounts.create();
		// builds EIP712 domain
		async function eip712_domain() {
			// Alethea: Chain ID opcode hardcoded at 1 in Ganache-cli, but not in Hardhat
			// See: https://github.com/trufflesuite/ganache/issues/1643
			//      https://github.com/trufflesuite/ganache-core/issues/515
			const chainId = await web3.eth.net.getId();
			// build the domain
			return {name: CONTRACT_NAME, chainId, verifyingContract: ali.address};
		}

		describe("Gas Consumption", function() {
			const by = a1;
			const from = H0;
			const to = a2;
			let value; // using randomized value for every test
			beforeEach(async function() {
				value = random_bn(1, S0.divn(2));
			});

			// delegate with auth is used in many places and therefore is extracted here
			async function delegate_with_auth(delegate, nonce) {
				const {v, r, s} = await eip712_delegate(ali.address,  delegate, nonce, expiry, w.privateKey);
				return await ali.delegateWithAuthorization(delegate, nonce, expiry, v, r, s, {from: by});
			}

			function consumes_no_more_than(gas) {
				// tests marked with @skip-on-coverage are removed from solidity-coverage,
				// see yield-solcover.js, see https://github.com/sc-forks/solidity-coverage/blob/master/docs/advanced.md
				it(`consumes no more than ${gas} gas  [ @skip-on-coverage ]`, async function() {
					const gasUsed = extract_gas(this.receipt);
					expect(gasUsed).to.be.lte(gas);
					if(gas - gasUsed > gas / 20) {
						console.log("only %o gas was used while expected up to %o", gasUsed, gas);
					}
				});
			}
			function gas_usage_transfers(g1, g2, g3, g4, g5, g6, g7, g8) {
				describe("direct transfer", function() {
					beforeEach(async function() {
						this.receipt = await ali.transfer(to, value, {from});
					});
					consumes_no_more_than(g1);
				});
				describe("transfer on behalf", function() {
					beforeEach(async function() {
						await ali.approve(by, value.muln(2), {from});
						this.receipt = await ali.transferFrom(from, to, value, {from: by});
					});
					consumes_no_more_than(g2);
				});
				describe("transfer on behalf with unlimited allowance", function() {
					beforeEach(async function() {
						await ali.approve(by, MAX_UINT256, {from});
						this.receipt = await ali.transferFrom(from, to, value, {from: by});
					});
					consumes_no_more_than(g3);
				});
				describe("ERC-1363 transfer and call", function() {
					beforeEach(async function() {
						const acceptor = await erc1363_deploy_acceptor(a0);
						this.receipt = await (ali.methods["transferAndCall(address,uint256)"](acceptor.address, value, {from}));
					});
					consumes_no_more_than(g4);
				});
				describe("ERC-1363 transfer from and call", function() {
					beforeEach(async function() {
						const acceptor = await erc1363_deploy_acceptor(a0);
						await ali.approve(by, value.muln(2), {from});
						this.receipt = await (ali.methods["transferFromAndCall(address,address,uint256)"](from, acceptor.address, value, {from: by}));
					});
					consumes_no_more_than(g5);
				});
				describe("ERC-1363 transfer from and call with unlimited allowance", function() {
					beforeEach(async function() {
						const acceptor = await erc1363_deploy_acceptor(a0);
						await ali.approve(by, MAX_UINT256, {from});
						this.receipt = await (ali.methods["transferFromAndCall(address,address,uint256)"](from, acceptor.address, value, {from: by}));
					});
					consumes_no_more_than(g6);
				});
				describe("EIP-3009 transfer with auth", function() {
					let nonce = ZERO_BYTES32;
					beforeEach(async function() {
						await ali.transfer(w.address, value, {from});
						if(await ali.votingDelegates(from) !== ZERO_ADDRESS) {
							await delegate_with_auth(w.address, ZERO_BYTES32);
							nonce = ZERO_BYTES32.slice(0, -1).concat('1');
						}
						const {v, r, s} = await eip712_transfer(ali.address, w.address, to, value, validAfter, validBefore, nonce, w.privateKey);
						this.receipt = await ali.transferWithAuthorization(w.address, to, value, validAfter, validBefore, nonce, v, r, s, {from: by});
					});
					consumes_no_more_than(g7);
				});
				describe("EIP-3009 receive with auth", function() {
					let nonce = ZERO_BYTES32;
					beforeEach(async function() {
						await ali.transfer(w.address, value, {from});
						if(await ali.votingDelegates(from) !== ZERO_ADDRESS) {
							await delegate_with_auth(w.address, ZERO_BYTES32);
							nonce = ZERO_BYTES32.slice(0, -1).concat('1');
						}
						const {v, r, s} = await eip712_receive(ali.address, w.address, to, value, validAfter, validBefore, nonce, w.privateKey);
						this.receipt = await ali.receiveWithAuthorization(w.address, to, value, validAfter, validBefore, nonce, v, r, s, {from: to});
					});
					consumes_no_more_than(g8);
				});
			}
			function gas_usage_mint_burn(g0, g1, g2, g3) {
				describe("mint", function() {
					beforeEach(async function() {
						await ali.updateRole(by, ROLE_TOKEN_CREATOR, {from: a0});
						this.receipt = await ali.mint(to, value, {from: by});
					});
					consumes_no_more_than(g0);
				});
				describe("burn", function() {
					beforeEach(async function() {
						this.receipt = await ali.burn(from, value, {from});
					});
					consumes_no_more_than(g1);
				});
				describe("burn on behalf", function() {
					beforeEach(async function() {
						await ali.approve(by, value.muln(2), {from});
						this.receipt = await ali.burn(from, value, {from: by});
					});
					consumes_no_more_than(g2);
				});
				describe("burn on behalf with unlimited allowance", function() {
					beforeEach(async function() {
						await ali.approve(by, MAX_UINT256, {from});
						this.receipt = await ali.burn(from, value, {from: by});
					});
					consumes_no_more_than(g3);
				});
			}
			function gas_usage_deployment(g1) {
				describe("deployment", function() {
					beforeEach(async function() {
						const txHash = ali.transactionHash;
						this.receipt = {receipt: await web3.eth.getTransactionReceipt(txHash)};
					});
					consumes_no_more_than(g1);
				});
			}
			function gas_usage_approvals(g1, g2, g3, g4, g5) {
				describe("approve", function() {
					beforeEach(async function() {
						this.receipt = await ali.approve(by, value, {from});
					});
					consumes_no_more_than(g1);
				});
				describe("atomic approve (increase)", function() {
					beforeEach(async function() {
						this.receipt = await ali.increaseAllowance(by, value, {from});
					});
					consumes_no_more_than(g2);
				});
				describe("atomic approve (decrease)", function() {
					beforeEach(async function() {
						await ali.increaseAllowance(by, value.muln(2), {from});
						this.receipt = await ali.decreaseAllowance(by, value, {from});
					});
					consumes_no_more_than(g3);
				});
				describe("ERC-1363 approve and call", function() {
					beforeEach(async function() {
						const acceptor = await erc1363_deploy_acceptor(a0);
						this.receipt = await (ali.methods["approveAndCall(address,uint256)"](acceptor.address, value, {from}));
					});
					consumes_no_more_than(g4);
				});
				describe("EIP-2612 permit", function() {
					const owner = w.address;
					const spender = by;
					const nonce = 0;
					beforeEach(async function() {
						const {v, r, s} = await eip712_permit(ali.address, owner, spender, value, nonce, deadline, w.privateKey);
						this.receipt = await ali.permit(owner, spender, value, deadline, v, r, s, {from: by});
					});
					consumes_no_more_than(g5);
				});
			}
			function gas_usage_delegation(g1, g2) {
				describe("delegate", function() {
					beforeEach(async function() {
						this.receipt = await ali.delegate(to, {from: by});
					});
					consumes_no_more_than(g1);
				});
				describe("delegate on behalf (with authorization)", function() {
					beforeEach(async function() {
						const b = await ali.balanceOf(by);
						if(!b.isZero()) {
							await ali.transfer(w.address, b.divn(2), {from: by});
						}
						let nonce = ZERO_BYTES32;
						if(await ali.votingDelegates(by) !== ZERO_ADDRESS) {
							await delegate_with_auth(w.address, nonce);
							nonce = ZERO_BYTES32.slice(0, -1).concat('1');
						}
						this.receipt = await delegate_with_auth(to, nonce);
					});
					consumes_no_more_than(g2);
				});
			}

			function gas_usage_suite() {
				gas_usage_deployment(3353525);
				gas_usage_approvals(48520, 48876, 31830, 57390, 79408);
				describe("when delegation is not involved", function() {
					gas_usage_transfers(61696, 71647, 64483, 68785, 78729, 71426, 87684, 87723);
					gas_usage_mint_burn(91384, 76620, 86112, 78992);
				});
				describe("when first address is a delegate", function() {
					beforeEach(async function() {
						await ali.delegate(from, {from});
					});
					gas_usage_transfers(94834, 104782, 97621, 101920, 111864, 104571, 120841, 120880);
				});
				describe("when second address is a delegate", function() {
					beforeEach(async function() {
						await ali.delegate(to, {from: to});
					});
					gas_usage_transfers(108943, 118891, 111730, 68785, 78729, 71426, 134938, 134977);
				});
				describe("when delegation is fully involved", function() {
					beforeEach(async function() {
						await ali.delegate(from, {from});
						await ali.delegate(to, {from: to});
					});
					gas_usage_transfers(142005, 151953, 144792, 101920, 111864, 104571, 168013, 168052);
					gas_usage_mint_burn(138640, 109768, 119260, 112140);
				});
				describe("when there is nothing on the balances", function() {
					gas_usage_delegation(50706, 80891);
				});
				describe("when one of the balances is non-zero", function() {
					beforeEach(async function() {
						await ali.transfer(by, value.muln(2), {from});
					});
					gas_usage_delegation(97960, 128131);
				});
				describe("when both balances are non-zero", function() {
					beforeEach(async function() {
						await ali.transfer(by, value.muln(2), {from});
						await ali.delegate(by, {from: by});
					});
					gas_usage_delegation(113922, 144105);
				});
			}

			gas_usage_suite();
		});
	});
});
