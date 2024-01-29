// Utility functions to create testing airdrop data - (address, tokenId) pairs array,
// and to work with the Merkle tree of this data array

// import Merkle tree related stuff
const {MerkleTree} = require("merkletreejs");
const keccak256 = require("keccak256");

// BN utils
const {random_address} = require("../../include/bn_utils");

// number utils
const {random_element} = require("../../include/number_utils");

/**
 * Generates the Airdrop data, and its Merkle tree related structures
 * based on the list of the addresses defined for an airdrop
 * @param offset token ID to start from
 * @param addresses array of addresses to participate in airdrop
 */
function import_drop(offset, addresses) {
	// allocate the array of the length required
	const drop = new Array(addresses.length);

	// generate the array contents
	for(let i = 0; i < addresses.length; i++) {
		drop[i] = {
			to: addresses[i],
			tokenId: offset + i,
		};
	}

	// generate an array of the leaves for a Merkle tree, the tree itself, and its root
	const leaves = drop.map(air_data => air_data_to_leaf(air_data));
	const tree = new MerkleTree(leaves, keccak256, {hashLeaves: false, sortPairs: true});
	const root = tree.getHexRoot();

	// return all the cool stuff
	return {drop, leaves, tree, root};
}

/**
 * Generates the Airdrop data, and its Merkle tree related structures
 *
 * @param offset token ID to start from
 * @param length number of tokens to generate
 * @param addr_set [optional] addresses to use for the generation
 * @return an array of (address, tokenId) pairs, their hashes (Merkle leaves), Merkle tree, and root
 */
function generate_drop(offset = 8989, length = 1012, addr_set) {
	// generate random addresses
	const addresses = new Array(length).fill("").map(_ => addr_set? random_element(addr_set): random_address());

	// and import the drops
	return import_drop(offset, addresses);
}

/**
 * Calculates keccak256(abi.encodePacked(...)) for the air data - (address, tokenId) pair
 *
 * @param air_data (address, tokenId) pair
 * @return {Buffer} keccak256 hash of tightly packed PlotData fields
 */
function air_data_to_leaf(air_data) {
	// flatten the input land plot object
	const values = Object.values(air_data);
	// feed the soliditySha3 to get a hex-encoded keccak256
	const hash = web3.utils.soliditySha3(...values);

	// return as Buffer
	return MerkleTree.bufferify(hash);
}

// export public utils API
module.exports = {
	generate_drop,
	air_data_to_leaf,
}
