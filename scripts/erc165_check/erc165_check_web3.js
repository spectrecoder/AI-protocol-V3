// Run: npx hardhat run ./scripts/erc165_check/erc165_check_web3.js --network mainnet


// we're going to use async/await programming style, therefore we put
// all the logic into async main and execute it in the end of the file
// see https://javascript.plainenglish.io/writing-asynchronous-programs-in-javascript-9a292570b2a6
async function main() {
	// hardcode the addresses to check
	const ADDRESSES_TO_CHECK = [
		"0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
		"0x2216d47494E516d8206B70FCa8585820eD3C4946",
		"0xBd3531dA5CF5857e7CfAA92426877b022e612cf8",
		"0xF4ee95274741437636e748DdAc70818B4ED7d043",
		"0xf3E6DbBE461C6fa492CeA7Cb1f5C5eA660EB1B47",
		"0x1cBB182322Aee8ce9F4F1f98d7460173ee30Af1F",
		"0xB5C747561a185A146f83cFff25BdfD2455b31fF4",
		"0xC4a0b1E7AA137ADA8b2F911A501638088DFdD508",
		"0xCcc441ac31f02cD96C153DB6fd5Fe0a2F4e6A68d",
		"0xD4d871419714B778eBec2E22C7c53572b573706e",
	];

	// hardcode the interface ID required
	const INTERFACE_ID_TO_CHECK = "0x80ac58cd"; // ERC721

	// ERC165 interface required
	const ERC165 = artifacts.require("@openzeppelin/contracts/utils/introspection/ERC165.sol:ERC165");

	console.log("Verifying the ERC721 compliance via ERC165.supportsInterface(%o)", INTERFACE_ID_TO_CHECK);
	// do the check
	for(let address of ADDRESSES_TO_CHECK) {
		const instance = await ERC165.at(address);
		const result = await instance.supportsInterface(INTERFACE_ID_TO_CHECK);
		// https://stackoverflow.com/questions/9781218/how-to-change-node-jss-console-font-color
		console.log(`\x1b[33m${address}\x1b[0m: ${result? "\x1b[32mOK\x1b[0m": "\x1b[31mFAIL\x1b[0m"}`);
	}
}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
	.then(() => process.exit(0))
	.catch(err => {
		console.error(err);
		process.exit(1);
	});
