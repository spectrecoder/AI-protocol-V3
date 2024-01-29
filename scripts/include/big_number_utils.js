// Both Truffle anf Hardhat with Truffle make an instance of web3 available in the global scope
// BigNumber constants, functions to work with BigNumber
const {BigNumber} = require("@ethersproject/bignumber");

// user friendly big number printer
function print_amt(amt, dm = BigNumber.from(10).pow(18)) {
	// convert inputs to BNs if they are not BNs
	amt = BigNumber.from(amt);
	dm = BigNumber.from(dm);

	if(amt.isZero()) {
		return '0';
	}
	const THOUSAND = BigNumber.from(1_000);
	const MILLION = BigNumber.from(1_000_000);
	if(amt.div(dm).lt(THOUSAND)) {
		return amt.div(MILLION).toNumber() / dm.div(MILLION).toNumber() + '';
	}
	const k = amt.div(dm).toNumber() / 1000;
	return k + "k";
}

// coverts n to Number or to String if it's too big
function to_number(n) {
	return BigNumber.isBigNumber(n)? n.lte(BigNumber.from(10).pow(15))? n.toNumber(): n.toString(): parseInt(n);
}

// export the constants
module.exports = {
	print_amt,
	to_number,
};
