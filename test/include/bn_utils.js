// Both Truffle and Hardhat with Truffle make an instance of web3 available in the global scope
// BN constants, functions to work with BN
const {BN, toBN, isBN} = web3.utils;

// 2^256
const TWO256 = (new BN(2)).pow(new BN(256));

// 1 ether
const ETH = web3.utils.toWei(new BN(1), "ether");

// crypto is used to get enough randomness for the random BN generation
const {randomBytes} = require('crypto');

// generates random BN in a [0, 2^256) range: r ∈ [0, 2^256)
function random_bn256() {
	// use crypto.randomBytes to generate 256 bits of randomness and wrap it into BN
	return new BN(randomBytes(32));
}

// generates random BN in a [0, 2^255) range: r ∈ [0, 2^256)
function random_bn255() {
	// use crypto.randomBytes to generate 256 bits of randomness, wrap it into BN, reduce to 255 bits
	return new BN(randomBytes(32)).divn(2);
}

// generates random BN of length `bits`
function random_bits(bits) {
	return new BN(randomBytes(bits >> 3 /* convert bits to bytes */));
}

// generates random Ethereum address
function random_address() {
	return web3.eth.accounts.create().address;
}

// generates random BN in a [from, from + range) range: r ∈ [from, from + range)
function random_bn(from, range) {
	// convert inputs to BNs if they are not BNs
	from = new BN(from);
	range = new BN(range);

	// generate 256 bits of randomness, a random number R ∈ [0, 2^256)
	// TODO: we could generate less (or more) bits taking into account range.bitLength()
	const rnd256 = new BN(randomBytes(32));

	// map the random number in a [0, 2^256) space onto [from, from + range) space:
	return from.add(range.mul(rnd256).div(TWO256)); // r = R * range / 2^256 + from
}

// sums up an array of BNs, returns BN
function sum_bn(array) {
	return array.reduce((accumulator, currentVal) => accumulator.add(new BN(currentVal)), new BN(0));
}

// user friendly big number printer
function print_amt(amt, dm = new BN(10).pow(new BN(18))) {
	// convert inputs to BNs if they are not BNs
	amt = new BN(amt);
	dm = new BN(dm);

	if(amt.isZero()) {
		return '0';
	}
	const THOUSAND = new BN(1_000);
	const MILLION = THOUSAND.mul(THOUSAND);
	const BILLION = MILLION.mul(THOUSAND);
	if(amt.div(dm).lt(THOUSAND)) {
		return amt.div(MILLION).toNumber() / dm.div(MILLION).toNumber() + '';
	}
	if(amt.div(dm).lt(MILLION)) {
		return amt.div(dm).toNumber() / 1_000 + 'k';
	}
	if(amt.div(dm).lt(BILLION)) {
		return amt.div(dm).div(THOUSAND).toNumber() / 1_000 + 'M';
	}
	return amt.div(dm).div(MILLION).toNumber() / 1_000 + 'G';
}

// graphically draw amounts array as a string to be printed in the consoles
// example: [..|.........|................|..........|...||...............|...........................|...|......]
function draw_amounts(amounts) {
	const total_amount = sum_bn(amounts);
	if(total_amount.isZero()) {
		return "[" + ".".repeat(100) + "]";
	}

	let s = "[";
	let remainder = new BN(0);
	for(let amount of amounts) {
		amount = new BN(amount);
		const skip = amount.add(remainder).muln(100).div(total_amount);
		remainder = amount.add(remainder).sub(skip.mul(total_amount).divn(100));
		if(!skip.isZero()) {
			for(let i = 0; i < skip.toNumber() - 1; i++) {
				s += ".";
			}
			s += "|";
		}
	}
	s += "]";
	return s;
}

// prints a value using "*" (asterisk) if its defined and is not zero, or using " " (whitespace) otherwise
function print_bool(bool) {
	return bool? "*": " ";
}
// prints values one by one, placing "*" (asterisk) instead of defined non-zero values
// and " " (whitespace) instead of undefined or zero values
function print_booleans(arr) {
	return arr.map(s => print_bool(s)).join("");
}

// prints a value using one of the following symbols:
// " " (zero),
// "^" (non-zero),
// "." (more than 10% of max),
// "+" (more than 50% of max),
// "*" (max),
// "!" (bigger than max)
function print_symbol(amt, max = amt) {
	// convert inputs to BNs if they are not BNs
	amt = new BN(amt);
	max = new BN(max);

	if(amt.isZero()) {
		return " ";
	}
	if(amt.eq(max)) {
		return "*";
	}
	if(amt.gt(max)) {
		return "!";
	}
	if(amt.lte(max.divn(10))) {
		return ".";
	}
	if(amt.lte(max.divn(2))) {
		return "+";
	}
	return "^";
}

// prints values one by one, placing " ", ".", "+", "*", or "!" instead of the values
function print_symbols(
	arr,
	arr_max = arr.reduce((a, v) => a.gte(new BN(v))? a: new BN(v), new BN(0))
) {
	return arr.map((r, i) => print_symbol(r, arr_max[i] || arr_max)).join("");
}

// export the constants
module.exports = {
	BN,
	toBN,
	isBN,
	TWO256,
	ETH,
	random_bn256,
	random_bn255,
	random_bits,
	random_address,
	random_bn,
	sum_bn,
	print_amt,
	draw_amounts,
	print_booleans,
	print_symbols,
};
