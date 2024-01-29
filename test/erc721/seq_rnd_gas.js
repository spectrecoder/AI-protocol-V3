// Sequential/random array writing gas usage test

// Zeppelin test helpers (chai only)
const {
	assert,
	expect,
} = require("chai");
// enable chai-subset to allow containSubset, see https://www.chaijs.com/plugins/chai-subset/
require("chai").use(require("chai-subset"));

// block utils
const {
	default_deadline,
	extract_gas,
} = require("../include/block_utils");

// number utils
const {random_int} = require("../include/number_utils");

// run gas consumption tests for tight array packing
contract("ArrayBlock: run gas consumption tests for tight array packing", function(accounts) {
	// extract accounts to be used:
	// A0 – special default zero account accounts[0] used by Truffle, reserved
	// a0 – deployment account having all the permissions, reserved
	// H0 – initial token holder account
	// a1, a2,... – working accounts to perform tests on
	const [A0, a0, H0, a1, a2, a3, a4] = accounts;

	// deployment
	const blocks = 50;
	console.log("%o 32-bits elements will be written in 2 arrays each", blocks);
	let arr;
	beforeEach(async function() {
		const ArrayBlock = artifacts.require("ArrayBlockMock");
		arr = await ArrayBlock.new({from: a0});
	});

	// init with some data
	beforeEach(async function() {
		await arr.writeSequential(random_int(1_000_000, 1_000_000), blocks, {from: a0});
		await arr.writePacked(random_int(1_000_000, 1_000_000), blocks, {from: a0});
	});

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

	describe("run sequential test",  function() {
		beforeEach(async function() {
			receipt = await arr.writeSequential(random_int(1_000_000, 1_000_000), blocks, {from: a0});
		});
		consumes_no_more_than(391363);
	});
	describe("run randomized test", function() {
		beforeEach(async function() {
			receipt = await arr.writeRandomized(random_int(1_000_000, 1_000_000), blocks, {from: a0});
		});
		consumes_no_more_than(384563);
	});
	describe("run packed test", function() {
		beforeEach(async function() {
			receipt = await arr.writePacked(random_int(1_000_000, 1_000_000), blocks, {from: a0});
		});
		consumes_no_more_than(366313);
	});
	describe("run assembly test", function() {
		beforeEach(async function() {
			receipt = await arr.writeWithAssembly(random_int(1_000_000, 1_000_000), blocks, {from: a0});
		});
		consumes_no_more_than(318710);
	});
});
