const util = require('util');
const web3Send = util.promisify(web3.currentProvider.send);

async function minerStart() {
	await web3Send({
		jsonrpc: "2.0",
		method: "miner_start",
		params: [],
		id: new Date().getTime()
	});
}

async function minerStop() {
	await web3Send({
		jsonrpc: "2.0",
		method: "miner_stop",
		params: [],
		id: new Date().getTime()
	});
}

async function mineBlock() {
	await web3Send({
		jsonrpc: "2.0",
		method: "evm_mine",
		params: [],
		id: new Date().getTime()
	});
}

module.exports = {
	minerStart,
	minerStop,
	mineBlock,
}
