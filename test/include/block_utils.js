const {expect} = require("chai");

// deadline (unix timestamp) which is always 5 seconds in the future (overridable)
async function default_deadline(offset = 5) {
	const block = await web3.eth.getBlock("latest");
	return block.timestamp + offset;
}

// extracts gas used from truffle/web3 transaction receipt
function extract_gas(receipt) {
	return receipt.gasUsed || receipt.receipt.gasUsed;
}

// extracts gas cost used from truffle/web3 transaction receipt
async function extract_gas_cost(receipt) {
	const tx = await web3.eth.getTransaction(receipt.tx || receipt.transactionHash || receipt.receipt.transactionHash);
	const gasPrice = tx.gasPrice;
	const gasUsed = extract_gas(receipt);
	return new web3.utils.BN(gasPrice).muln(gasUsed);
}

// expect gas used in tx to be no greater than
function expect_gas(receipt, gas) {
	const gasUsed = extract_gas(receipt);
	expect(gasUsed, gas).to.be.lte(2300 + gas);
	if(gas - gasUsed > gas / 20) {
		console.warn("only %o gas was used while expected up to %o", gasUsed, gas);
	}
}

// export public module API
module.exports = {
	default_deadline,
	extract_gas,
	extract_gas_cost,
	expect_gas,
}
