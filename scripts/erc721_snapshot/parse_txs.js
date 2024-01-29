/**
 * Parses raw transaction Etherscan data and constructs ERC721 snapshot – up to block 14374789
 *
 * Run: node ./parse_txs.js 14374789 ./data/export-token-nft-0xcE69a87C02bAA8C5F17Ed7eB8B1C2657aFC2E1aF.csv ./data/0xcE69a87C02bAA8C5F17Ed7eB8B1C2657aFC2E1aF_snapshot_14374789.csv
 * Inputs:
 * 	14374789 (final block)
 * 	./data/export-token-nft-0xcE69a87C02bAA8C5F17Ed7eB8B1C2657aFC2E1aF.csv
 * Output: ./data/0xcE69a87C02bAA8C5F17Ed7eB8B1C2657aFC2E1aF_snapshot_14374789.csv
 */

// we use assert to fail fast in case of any errors
const assert = require("assert");
// we use fs to read/write CSV
const fs = require("fs");

// rounds floating point numbers to some given precision after the dot
function float_round(n, decimals = 6) {
	n = parseFloat(isNaN(n)? n.replaceAll(/"/ig, "").replaceAll(/,/ig, ""): n);
	const dm = Math.pow(10, decimals);
	return Math.round(n * dm) / dm;
}

// 1. read the input: Etherscan transactions data file
// node[0] ./parse_txs.js[1] 14374789[2] ./data/export-token-0xcE69a87C02bAA8C5F17Ed7eB8B1C2657aFC2E1aF.csv[3] ./data/0xcE69a87C02bAA8C5F17Ed7eB8B1C2657aFC2E1aF_snapshot_14374789.csv[4]
const module_path = process.argv[1];
// check input parameters are as we expect them to be
assert(
	(module_path.startsWith("/") || module_path.startsWith("./")) && module_path.endsWith(".js"),
	module_path + ": wrong module path, use ./parse_txs.js for example"
);

// extract the final block number or use the default one
const final_block = process.argv && process.argv.length > 2? parseInt(process.argv[2]): 14374789;

// extract module dir (this is a js file name and path we run)
const module_dir = module_path.substring(0, module_path.lastIndexOf("/") + 1);
// derive the data file(s) path(s)
const txs_input_file = process.argv && process.argv.length > 3? process.argv[3]: module_dir + "data/export-token-nft-0xcE69a87C02bAA8C5F17Ed7eB8B1C2657aFC2E1aF.csv";
const snapshot_output_file = process.argv && process.argv.length > 4? process.argv[4]: module_dir + "data/0xcE69a87C02bAA8C5F17Ed7eB8B1C2657aFC2E1aF_snapshot_14374789.csv";

// read the CSV, validate its integrity/format
const tx_csv_data = fs.readFileSync(txs_input_file, {encoding: "utf8"});
const tx_csv_rows = tx_csv_data.replaceAll("\"", "").split(/[\r\n]+/);
const tx_csv_header = tx_csv_rows[0].split(",");
const block_idx = tx_csv_header.indexOf("Blockno");
const from_idx = tx_csv_header.indexOf("From");
const to_idx = tx_csv_header.indexOf("To");
const id_idx = tx_csv_header.indexOf("Token_ID");
assert(block_idx >= 0, "malformed CSV data (header \"Blockno\" not found)");
assert(from_idx >= 0, "malformed CSV data (header \"From\" not found)");
assert(to_idx >= 0, "malformed CSV data (header \"To\") not found");
assert(id_idx >= 0, "malformed CSV data (header \"Token_ID\") not found");

const tx_csv_body = tx_csv_rows.slice(1).filter(row => row.length).map(row => row.split(","));
assert(tx_csv_body.length !== 0, "no CSV data read");
console.log("%o data rows read (up to block %o) from %o", tx_csv_body.length, final_block, txs_input_file);

// 2. construct the snapshot by parsing the transactions data
const ids = {};
tx_csv_body
	.filter(tx => tx[block_idx] <= final_block)
	.forEach(tx => {
		assert(
			tx[from_idx] === "0x0000000000000000000000000000000000000000" || ids[tx[id_idx]] === tx[from_idx],
			"parse error"
		);
		ids[tx[id_idx]] = tx[to_idx];
	});

// 3. convert into CSV and write output
const snapshot_csv_header = ["Token_ID,Address"];
const snapshot_csv_body = [];
for(const [k, v] of Object.entries(ids)) {
	snapshot_csv_body.push(`${k},${v}`);
}
// CSV formatted data ready to be written
const snapshot_csv = snapshot_csv_header.concat(...snapshot_csv_body).join("\n");

// write
fs.writeFileSync(snapshot_output_file, snapshot_csv);
console.log("%o token IDs saved into %o", snapshot_csv_body.length, snapshot_output_file);
