// Alethea ERC20: Voting Simulation
// Following simulation executes a significant amount of token transfers and voting delegation operations,
// tracking the expected token contract state and verifying it then against real state

const log = require("loglevel");
log.setLevel(process.env.LOG_LEVEL? process.env.LOG_LEVEL: "info");

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
const {
	random_bn,
	sum_bn,
	print_amt,
	draw_amounts,
	print_booleans,
	print_symbols,
} = require("../include/bn_utils");

// token constants
const {
	DM,
	TOTAL_SUPPLY: ALI_S0,
} = require("./include/ali_erc20_constants");

// deployment routines in use
const {
	ali_erc20_deploy
} = require("./include/deployment_routines");

// auxiliary classes for voting delegation simulation
const {History} = require("./include/history");

// run voting delegation simulation
contract("ERC20: Voting Delegation Simulation", function(accounts) {
	// extract accounts to be used:
	// A0 – special default zero account accounts[0] used by Truffle, reserved
	// a0 – deployment account having all the permissions, reserved
	// H0 – initial token holder account
	// a1, a2,... – working accounts to perform tests on
	const [A0, a0, H0, a1, a2] = accounts;
	// participants – rest of the accounts
	const participants = accounts.slice(3);

	function voting_sim_suite(suite_name, deployment_fn, initial_supply) {
		describe(suite_name, function() {
			let ali;
			beforeEach(async function() {
				ali = await deployment_fn(a0, H0);
			});

			// simulation executor
			async function voting_sim_test(cycles = 1000, p1 = 0.015, p2 = 0.015) {
				// for this simulation we will be working with all the available accounts
				const n = participants.length;
				// split initial_supply randomly between the accounts. generate n random numbers [0, initial_supply]
				const p = new Array(n);
				for(let i = 0; i < n; i++) {
					p[i] = random_bn(0, initial_supply);
				}
				// and sort them: now each number represents cumulative balance of the accounts up to account `i`,
				// last account balance is assumed to be initial_supply
				p.sort((a, b) => a.cmp(b));
				// derive the initial balances array:
				const ali_amounts = p.map((v, i, p) => i === p.length - 1? initial_supply.sub(v): p[i + 1].sub(v));
				const total_amount = sum_bn(ali_amounts);

				// transfer the balances from H0 to the target accounts
				for(let i = 0; i < n; i++) {
					await ali.transfer(participants[i], ali_amounts[i], {from: H0});
				}
				log.info("prepared %o accounts with %o ALI total", n, print_amt(total_amount, DM));
				log.info("%o", draw_amounts(ali_amounts));


				// define a history object to track account balances, voting power, and delegations
				const history = new History(await web3.eth.getBlockNumber(), ali_amounts);

				// generates random integer in [from, from + range) range
				function random_int(from, range) {
					return Math.floor(from + Math.random() * range);
				}

				// delegates voting power from account at index from_idx to an account at index to_idx
				// out of range index to_idx ≥ n is treated as a request to revoke delegation (delegation to zero address)
				async function delegate(from_idx, to_idx) {
					// Truffle result: https://www.trufflesuite.com/docs/truffle/getting-started/interacting-with-your-contracts#processing-transaction-results
					const result = await ali.delegate(to_idx < n? participants[to_idx]: ZERO_ADDRESS, {from: participants[from_idx]});
					history.delegate(result.receipt.blockNumber, from_idx, to_idx < n? to_idx: -1);
					log.debug("delegate %o => %o", from_idx + 1, to_idx < n? to_idx + 1: "0x00");
				}

				// transfers value from account at index from_idx to an account at index from_idx
				async function transfer(from_idx, to_idx, value) {
					// Truffle result: https://www.trufflesuite.com/docs/truffle/getting-started/interacting-with-your-contracts#processing-transaction-results
					const result = await ali.transfer(participants[to_idx], value, {from: participants[from_idx]});
					history.transfer(result.receipt.blockNumber, from_idx, to_idx, value);
					log.debug("transfer %o -> %o (%o)", from_idx + 1, to_idx + 1, print_amt(value, DM));
				}

				async function prob_delegate(p = p1) {
					// for each account in the list
					for(let i = 0; i < n; i++) {
						// with the probability p
						if(Math.random() >= p) {
							continue;
						}

						// get some random account index and delegate voting power to it
						// (self delegation, delegation to a zero account are ok)
						const idx = random_int(0, n + 1);
						await delegate(i, idx);
					}
				}
				async function prob_transfer(p = p2) {
					// for each account in the list
					for(let i = 0; i < n; i++) {
						// with the probability p
						if(Math.random() >= p) {
							continue;
						}

						const balance = await ali.balanceOf(participants[i]);
						if(balance.isZero()) {
							// nothing to transfer
							continue;
						}

						// get some random account index and transfer tokens into it
						// (self transfer is not ok)
						let idx = random_int(0, n - 1);
						// stretch idx onto [0, n) excluding i
						if(idx >= i) {
							idx++;
						}
						const amount = random_bn(0, balance);
						if(amount.gt(balance)) {
							log.warn("%o > %o", amount.toString(10), balance.toString(10));
						}
						expect(amount).to.be.bignumber.that.is.at.most(balance, "transfer amount exceeds balance");
						await transfer(i, idx, amount);
					}
				}
				async function verify_state(round, state) {
					const balances = state.balances;
					const voting_powers = state.voting_powers;
					const delegations = state.delegations;

					for(let i = 0; i < n; i++) {
						const balance = await ali.balanceOf(participants[i]);
						const voting_power = await ali.votingPowerOf(participants[i]);
						const delegate = await ali.votingDelegates(participants[i]);

						expect(balances[i]).to.be.bignumber.that.equals(
							balance,
							"unexpected balance for account " + (i + 1) + " at round " + round
						);
						expect(voting_powers[i]).to.be.bignumber.that.equals(
							voting_power,
							"unexpected voting power for account " + (i + 1) + " at round " + round
						);
						expect(delegations[i] < 0? ZERO_ADDRESS: participants[delegations[i]]).to.equal(
							delegate,
							"unexpected delegate for delegator " + (i + 1) + " at round " + round
						);
					}
				}

				for(let i = 0; i < cycles; i++) {
					await prob_delegate();
					await prob_transfer();

					const round = i + 1;
					const state = history.latest_state;
					log.info(
						"round %o; block %o:\nbalances  %o\nvoting    %o\ndelegates %o",
						round,
						history.latest_block,
						print_symbols(state.balances),
						print_symbols(state.voting_powers),
						print_booleans(state.delegations.map(d => d >= 0))
					);

					await verify_state(round, state);
				}
			}

			// low complexity test executes in coverage
			it("execute random transfers and delegations (low complexity)", async function() {
				await voting_sim_test(10, 0.35, 0.35);
			});
			// tests marked with @skip-on-coverage will are removed from solidity-coverage,
			// see yield-solcover.js, see https://github.com/sc-forks/solidity-coverage/blob/master/docs/advanced.md
			it("execute random transfers and delegations [ @skip-on-coverage ]", async function() {
				await voting_sim_test(100, 0.15, 0.15);
			});
		});
	}

	voting_sim_suite("ALIERC20", ali_erc20_deploy, ALI_S0);
});
