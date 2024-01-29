// improves Zeppelin expectEvent.inTransaction by allowing multiple events with the same name
async function expectEventInTransaction(txHash, eventName, args) {
	const receipt = await web3.eth.getTransactionReceipt(txHash);
	if(!receipt) {
		throw new Error(`Transaction ${txHash} not found`);
	}

	const eventAbi = eventName + "(" + args.map(arg => arg.type).join(",") + ")";
	const logs = receipt.logs.filter(log => log.topics[0] === web3.eth.abi.encodeEventSignature(eventAbi));
	if(!logs.length) {
		throw new Error(`No '${eventAbi}' events found`);
	}

	for(let log of logs) {
		const decodedLog = web3.eth.abi.decodeLog(args, log.data, log.topics.slice(1));

		if((() => {
			for(let arg of args) {
				if(decodedLog[arg.name] !== "" + arg.value) {
					return false;
				}
			}
			return true;
		})()) {
			return;
		}
	}

	throw new Error(`No '${eventAbi}' events with (${args.map(input => input.value).join(",")}) values found`);
}

module.exports = {
	expectEventInTransaction,
};
