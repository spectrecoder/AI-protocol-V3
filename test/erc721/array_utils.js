// ArrayUtils library tests

// Zeppelin test helpers (chai only)
const {
	assert,
	expect,
} = require("chai");
// enable chai-subset to allow containSubset, see https://www.chaijs.com/plugins/chai-subset/
require("chai").use(require("chai-subset"));

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
	let arr;
	beforeEach(async function() {
		const ArrayBlock = artifacts.require("ArrayBlockMock");
		arr = await ArrayBlock.new({from: a0});
	});

	function verify_assembly() {
		it("verify assembly array.push() – one block", async function() {
			const size = 100;

			await arr.writeWithAssembly('0', size, {from: a0});

			expect(
				(await arr.getArray321()).map(e => e.toNumber()),
				"unexpected array321"
			).to.containSubset(new Array(size).fill(0).map((e, i) => i));
			expect(
				(await arr.getArray322()).map(e => e.toNumber()),
				"unexpected array322"
			).to.containSubset(new Array(size).fill(0).map((e, i) => i));
		});
		it("verify assembly array.push() – small blocks", async function() {
			const size = 100;
			for(let i = 0; i < size; ) {
				const n = random_int(0, Math.min(size + 1 - i, 8));
				await arr.writeWithAssembly(i, n, {from: a0});
				i += n;
			}
			expect(
				(await arr.getArray321()).map(e => e.toNumber()),
				"unexpected array321"
			).to.containSubset(new Array(size).fill(0).map((e, i) => i));
			expect(
				(await arr.getArray322()).map(e => e.toNumber()),
				"unexpected array322"
			).to.containSubset(new Array(size).fill(0).map((e, i) => i));
		});
		it("verify assembly array.push() – big blocks", async function() {
			const size = 1000;
			for(let i = 0; i < size; ) {
				const n = random_int(0, Math.min(size + 1 - i, 200));
				await arr.writeWithAssembly(i, n, {from: a0});
				i += n;
			}
			expect(
				(await arr.getArray321()).map(e => e.toNumber()),
				"unexpected array321"
			).to.containSubset(new Array(size).fill(0).map((e, i) => i));
			expect(
				(await arr.getArray322()).map(e => e.toNumber()),
				"unexpected array322"
			).to.containSubset(new Array(size).fill(0).map((e, i) => i));
		});
	}

	describe("when array is empty initially", function() {
		verify_assembly();
	});
	describe("when array contains some data initially", function() {
		// init with some data
		beforeEach(async function() {
			await arr.writeSequential(random_int(1_000_000, 1_000_000), blocks, {from: a0});
		});
		verify_assembly();
	});
});
