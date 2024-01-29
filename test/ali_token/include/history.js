/**
 * Classes and auxiliary functions to simulate voting delegation, token transfers
 */

// BN constants and utilities
const ZERO = new web3.utils.BN(0);

// checks if the value supplied is a JS primitive
function assert_primitive(value, required = true) {
	assert(!value && !required || value !== Object(value), "primitive expected");
}

// checks if the value supplied is an array
function assert_array(array, required = true) {
	assert(!array && !required || Array.isArray(array), "array expected");
}

// checks if the value supplied is an array of primitives
function assert_array_of_primitives(array, required = true) {
	assert_array(array, required);
	if(array) {
		array.forEach(value => assert_primitive(value));
	}
}

// simulates the transaction containing arbitrary data (see tx_data)
class Transaction {
	#block_num;
	#tx_type;
	#tx_data;

	constructor(block_num, tx_type, tx_data) {
		assert_primitive(block_num);
		assert_primitive(tx_type);
		this.#block_num = block_num;
		this.#tx_type = tx_type;
		this.#tx_data = Object.assign({}, tx_data);
	}

	get block_num() {
		return this.#block_num;
	}

	get tx_type() {
		return this.#tx_type;
	}

	get tx_data() {
		return Object.assign({}, this.#tx_data);
	}
}

// simulates the delegation transaction containing delegation data
class DelegationTransaction extends Transaction {
	constructor(block_num, from_idx, to_idx) {
		super(block_num, "delegate", {from_idx, to_idx});
	}
}

// simulates the transfer transaction containing token transfer data
class TransferTransaction extends Transaction {
	constructor(block_num, from_idx, to_idx, value) {
		super(block_num, "transfer", {from_idx, to_idx, value});
	}
}

// Represents a snapshot of balances, voting powers, delegations, etc, at a given block
class State {
	#block_num;
	#balances;
	#voting_powers;
	// array of delegate indexes
	// delegator defined by its index "i" points to its delegate defined by its index "delegations[i]"
	#delegations;

	constructor(block_num, balances, voting_powers, delegations) {
		// ensure the inputs are of correct types
		assert_primitive(block_num);
		assert_array(balances);
		assert_array(voting_powers, false);
		assert_array_of_primitives(delegations, false);

		const n = balances.length;

		// block num is a primitive, no need to copy
		this.#block_num = block_num;
		// deep copy the input array of BNs
		this.#balances = balances.slice().map(b => b.clone());
		// initialize the rest of the fields with "empty" values or deep copy the inputs if defined
		this.#voting_powers = voting_powers? voting_powers.slice().map(b => b.clone()): new Array(n).fill(ZERO);
		this.#delegations = delegations? delegations.slice(): new Array(n).fill(-1);

		// verify all the array lengths are correct
		assert(this.#voting_powers.length === n, "array length mismatch (voting_powers)");
		assert(this.#delegations.length === n,  "array length mismatch (delegations)");
	}

	clone() {
		return new State(this.#block_num, this.#balances, this.#voting_powers, this.#delegations);
	}

	get block_num() {
		return this.#block_num;
	}

	get balances() {
		return this.#balances.slice().map(b => b.clone());
	}

	get voting_powers() {
		return this.#voting_powers.slice().map(b => b.clone());
	}

	get delegations() {
		return this.#delegations.slice();
	}

	// modifies the state by applying a transaction to it
	apply_tx(tx) {
		const data = tx.tx_data;
		switch(tx.tx_type) {
			case "delegate": {
				// handle the voting power change
				if(this.#delegations[data.from_idx] >= 0) {
					this.#voting_powers[this.#delegations[data.from_idx]].isub(this.#balances[data.from_idx]);
				}
				if(data.to_idx >= 0) {
					this.#voting_powers[data.to_idx].iadd(this.#balances[data.from_idx]);
				}
				// handle the delegation change
				this.#delegations[data.from_idx] = data.to_idx;
				break;
			}
			case "transfer": {
				// handle the transfer
				this.#balances[data.from_idx].isub(data.value);
				this.#balances[data.to_idx].iadd(data.value);
				// handle the voting power change
				if(this.#delegations[data.from_idx] >= 0) {
					this.#voting_powers[this.#delegations[data.from_idx]].isub(data.value);
				}
				if(this.#delegations[data.to_idx] >= 0) {
					this.#voting_powers[this.#delegations[data.to_idx]].iadd(data.value);
				}
				break;
			}
			default: {
				log.warn("unknown transaction type %o at block %o: %o", tx.tx_type, tx.block_num, tx.tx_data);
				break;
			}
		}
	}
}

// Represents an entire history of snapshots
class History {
	#initial_state;
	#latest_state;
	#latest_block;
	#transactions = [];
	constructor(block_num, balances) {
		this.#initial_state = new State(block_num, balances);
		this.#latest_state = this.#initial_state.clone();
		this.#latest_block = block_num;
	}

	get initial_state() {
		return this.#initial_state.clone();
	}

	get latest_state() {
		return this.#latest_state.clone();
	}

	get latest_block() {
		return this.#latest_block;
	}

	// adds a generic transaction to the transaction history
	#add_tx(tx) {
		// get a shortcut
		const txs = this.#transactions;
		// verify we're not adding a transaction in the past
		assert(this.#latest_block <= tx.block_num, "cannot insert transaction into the past");

		// apply the transaction to the current (latest) state
		this.#latest_state.apply_tx(tx);
		this.#latest_block = tx.block_num;

		// save the transaction
		txs.push(tx);
	}
	// adds a delegate transaction to the transaction history
	// value -1 for to_idx means revoke a delegate transaction
	delegate(block_num, from_idx, to_idx) {
		return this.#add_tx(new DelegationTransaction(block_num, from_idx, to_idx));
	}
	// adds a transfer transaction to the transaction history
	transfer(block_num, from_idx, to_idx, value) {
		return this.#add_tx(new TransferTransaction(block_num, from_idx, to_idx, value));
	}

	// reconstructs the state based on initial state, and the transaction history up to the block specified
	state_at(block_num) {
		// if block number is not specified or if it's the latest one just return the latest state
		if(!block_num || block_num >= this.#latest_state.block_num) {
			return this.latest_state;
		}

		// get the deep copy the initial state
		const state = this.initial_state;
		// apply all the transactions one by one to the state and return the result
		this.#transactions.filter(tx => tx.block_num <= block_num).forEach(state.apply_tx);
		return state;
	}
}

module.exports = {
	History
}
