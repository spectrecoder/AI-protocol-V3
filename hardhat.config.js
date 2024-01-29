/**
 * default Hardhat configuration which uses account mnemonic to derive accounts
 * script expects following environment variables to be set:
 *   - P_KEY1 – mainnet private key, should start with 0x
 *     or
 *   - MNEMONIC1 – mainnet mnemonic, 12 words
 *
 *   - P_KEY3 – ropsten private key, should start with 0x
 *     or
 *   - MNEMONIC3 – ropsten mnemonic, 12 words
 *
 *   - P_KEY4 – rinkeby private key, should start with 0x
 *     or
 *   - MNEMONIC4 – rinkeby mnemonic, 12 words
 *
 *   - P_KEY41 – kovan private key, should start with 0x
 *     or
 *   - MNEMONIC41 – kovan mnemonic, 12 words
 *
 *   - P_KEY5 – goerli private key, should start with 0x
 *     or
 *   - MNEMONIC5 – goerli mnemonic, 12 words
 *
 *   - P_KEY137 – polygon/matic private key, should start with 0x
 *     or
 *   - MNEMONIC137 – polygon/matic mnemonic, 12 words
 *
 *   - P_KEY80001 – mumbai (polygon testnet) private key, should start with 0x
 *     or
 *   - MNEMONIC80001 – mumbai (polygon testnet) mnemonic, 12 words
 *
 *   - P_KEY56 – Binance Smart Chain (BSC) mainnet private key, should start with 0x
 *     or
 *   - MNEMONIC56 – Binance Smart Chain (BSC) mainnet mnemonic, 12 words
 *
 *   - P_KEY97 – Binance Smart Chain (BSC) testnet private key, should start with 0x
 *     or
 *   - MNEMONIC97 – Binance Smart Chain (BSC) testnet mnemonic, 12 words
 *
 *   - P_KEY204 – Binance opBNB Optimistic Rollup (L2) mainnet private key, should start with 0x
 *     or
 *   - MNEMONIC204 – Binance opBNB Optimistic Rollup (L2) mainnet mnemonic, 12 words
 *
 *   - P_KEY5611 – Binance opBNB Optimistic Rollup (L2) testnet private key, should start with 0x
 *     or
 *   - MNEMONIC5611 – Binance opBNB Optimistic Rollup (L2) testnet mnemonic, 12 words
 *
 *   - P_KEY8453 – Base Mainnet Optimistic Rollup (L2) private key, should start with 0x
 *     or
 *   - MNEMONIC8453 – Base Mainnet Optimistic Rollup (L2) mnemonic, 12 words
 *
 *   - P_KEY84531 – Base Goerli (testnet) Optimistic Rollup (L2) private key, should start with 0x
 *     or
 *   - MNEMONIC84531 – Base Goerli (testnet) Optimistic Rollup (L2) mnemonic, 12 words
 *
 *   - ALCHEMY_KEY – Alchemy API key
 *     or
 *   - INFURA_KEY – Infura API key (Project ID)
 *
 *   - ETHERSCAN_KEY – Etherscan API key
 *
 *   - POLYSCAN_KEY – polygonscan API key
 *
 *   - BSCSCAN_KEY – BscScan API key
 *
 *   - BASESCAN_KEY – BaseScan API key
 */

// Loads env variables from .env file
require('dotenv').config()

// Enable Truffle 5 plugin for tests
// https://hardhat.org/guides/truffle-testing.html
require("@nomiclabs/hardhat-truffle5");

// enable Solidity-coverage
// https://hardhat.org/plugins/solidity-coverage.html
require("solidity-coverage");

// enable hardhat-gas-reporter
// https://hardhat.org/plugins/hardhat-gas-reporter.html
require("hardhat-gas-reporter");

// compile Solidity sources directly from NPM dependencies
// https://github.com/ItsNickBarry/hardhat-dependency-compiler
require("hardhat-dependency-compiler");

// Before v2.5 we're using Ethers scripts to deploy in /scripts
// enable Ethers/Waffle for deployments
// https://hardhat.org/guides/deploying.html
// require("@nomiclabs/hardhat-waffle");

// Starting from v2.5 we're using hardhat-deploy scripts in /deploy
// adds a mechanism to deploy contracts to any network,
// keeping track of them and replicating the same environment for testing
// https://www.npmjs.com/package/hardhat-deploy
require("hardhat-deploy");

const {share_admin_role} = require("./tasks/share_admin_role");
task("share", "shares the admin role for all the contracts mentioned in config.js for the account specified")
	.addParam("account", "an account to share the admin role with")
	.setAction(share_admin_role);

// verify environment setup, display warning if required, replace missing values with fakes
const FAKE_MNEMONIC = "test test test test test test test test test test test junk";
if(!process.env.MNEMONIC1 && !process.env.P_KEY1) {
	console.warn("neither MNEMONIC1 nor P_KEY1 is not set. Mainnet deployments won't be available");
	process.env.MNEMONIC1 = FAKE_MNEMONIC;
}
else if(process.env.P_KEY1 && !process.env.P_KEY1.startsWith("0x")) {
	console.warn("P_KEY1 doesn't start with 0x. Appended 0x");
	process.env.P_KEY1 = "0x" + process.env.P_KEY1;
}
if(!process.env.MNEMONIC3 && !process.env.P_KEY3) {
	console.warn("neither MNEMONIC3 nor P_KEY3 is not set. Ropsten deployments won't be available");
	process.env.MNEMONIC3 = FAKE_MNEMONIC;
}
else if(process.env.P_KEY3 && !process.env.P_KEY3.startsWith("0x")) {
	console.warn("P_KEY3 doesn't start with 0x. Appended 0x");
	process.env.P_KEY3 = "0x" + process.env.P_KEY3;
}
if(!process.env.MNEMONIC4 && !process.env.P_KEY4) {
	console.warn("neither MNEMONIC4 nor P_KEY4 is not set. Rinkeby deployments won't be available");
	process.env.MNEMONIC4 = FAKE_MNEMONIC;
}
else if(process.env.P_KEY4 && !process.env.P_KEY4.startsWith("0x")) {
	console.warn("P_KEY4 doesn't start with 0x. Appended 0x");
	process.env.P_KEY4 = "0x" + process.env.P_KEY4;
}
if(!process.env.MNEMONIC42 && !process.env.P_KEY42) {
	console.warn("neither MNEMONIC42 nor P_KEY42 is not set. Kovan deployments won't be available");
	process.env.MNEMONIC42 = FAKE_MNEMONIC;
}
else if(process.env.P_KEY42 && !process.env.P_KEY42.startsWith("0x")) {
	console.warn("P_KEY42 doesn't start with 0x. Appended 0x");
	process.env.P_KEY42 = "0x" + process.env.P_KEY42;
}
if(!process.env.MNEMONIC5 && !process.env.P_KEY5) {
	console.warn("neither MNEMONIC5 nor P_KEY5 is not set. Goerli deployments won't be available");
	process.env.MNEMONIC5 = FAKE_MNEMONIC;
}
else if(process.env.P_KEY5 && !process.env.P_KEY5.startsWith("0x")) {
	console.warn("P_KEY5 doesn't start with 0x. Appended 0x");
	process.env.P_KEY5 = "0x" + process.env.P_KEY5;
}
if(!process.env.MNEMONIC137 && !process.env.P_KEY137) {
	console.warn("neither MNEMONIC137 nor P_KEY137 is not set. Polygon mainnet deployments won't be available");
	process.env.MNEMONIC137 = FAKE_MNEMONIC;
}
else if(process.env.P_KEY137 && !process.env.P_KEY137.startsWith("0x")) {
	console.warn("P_KEY137 doesn't start with 0x. Appended 0x");
	process.env.P_KEY137 = "0x" + process.env.P_KEY137;
}
if(!process.env.MNEMONIC80001 && !process.env.P_KEY80001) {
	console.warn("neither MNEMONIC80001 nor P_KEY80001 is not set. Mumbai (matic/polygon L2 testnet) deployments won't be available");
	process.env.MNEMONIC80001 = FAKE_MNEMONIC;
}
else if(process.env.P_KEY80001 && !process.env.P_KEY80001.startsWith("0x")) {
	console.warn("P_KEY80001 doesn't start with 0x. Appended 0x");
	process.env.P_KEY80001 = "0x" + process.env.P_KEY80001;
}
if(!process.env.MNEMONIC56 && !process.env.P_KEY56) {
	console.warn("neither MNEMONIC56 nor P_KEY56 is not set. Binance Smart Chain (BSC) mainnet deployments won't be available");
	process.env.MNEMONIC56 = FAKE_MNEMONIC;
}
else if(process.env.P_KEY56 && !process.env.P_KEY56.startsWith("0x")) {
	console.warn("P_KEY56 doesn't start with 0x. Appended 0x");
	process.env.P_KEY56 = "0x" + process.env.P_KEY56;
}
if(!process.env.MNEMONIC97 && !process.env.P_KEY97) {
	console.warn("neither MNEMONIC97 nor P_KEY97 is not set. Binance Smart Chain (BSC) testnet deployments won't be available");
	process.env.MNEMONIC97 = FAKE_MNEMONIC;
}
else if(process.env.P_KEY97 && !process.env.P_KEY97.startsWith("0x")) {
	console.warn("P_KEY97 doesn't start with 0x. Appended 0x");
	process.env.P_KEY97 = "0x" + process.env.P_KEY97;
}
if(!process.env.MNEMONIC204 && !process.env.P_KEY204) {
	console.warn("neither MNEMONIC204 nor P_KEY204 is not set. Binance opBNB deployments won't be available");
	process.env.MNEMONIC204 = FAKE_MNEMONIC;
}
else if(process.env.P_KEY204 && !process.env.P_KEY204.startsWith("0x")) {
	console.warn("P_KEY204 doesn't start with 0x. Appended 0x");
	process.env.P_KEY204 = "0x" + process.env.P_KEY204;
}
if(!process.env.MNEMONIC5611 && !process.env.P_KEY5611) {
	console.warn("neither MNEMONIC5611 nor P_KEY5611 is not set. Binance opBNB testnet deployments won't be available");
	process.env.MNEMONIC5611 = FAKE_MNEMONIC;
}
else if(process.env.P_KEY5611 && !process.env.P_KEY5611.startsWith("0x")) {
	console.warn("P_KEY5611 doesn't start with 0x. Appended 0x");
	process.env.P_KEY5611 = "0x" + process.env.P_KEY5611;
}
if(!process.env.MNEMONIC8453 && !process.env.P_KEY8453) {
	console.warn("neither MNEMONIC8453 nor P_KEY8453 is not set. Base Mainnet deployments won't be available");
	process.env.MNEMONIC8453 = FAKE_MNEMONIC;
}
else if(process.env.P_KEY8453 && !process.env.P_KEY8453.startsWith("0x")) {
	console.warn("P_KEY8453 doesn't start with 0x. Appended 0x");
	process.env.P_KEY8453 = "0x" + process.env.P_KEY8453;
}
if(!process.env.MNEMONIC84531 && !process.env.P_KEY84531) {
	console.warn("neither MNEMONIC84531 nor P_KEY84531 is not set. Base Goerli (testnet) deployments won't be available");
	process.env.MNEMONIC84531 = FAKE_MNEMONIC;
}
else if(process.env.P_KEY84531 && !process.env.P_KEY84531.startsWith("0x")) {
	console.warn("P_KEY84531 doesn't start with 0x. Appended 0x");
	process.env.P_KEY84531 = "0x" + process.env.P_KEY84531;
}
if(!process.env.INFURA_KEY && !process.env.ALCHEMY_KEY) {
	console.warn("neither INFURA_KEY nor ALCHEMY_KEY is not set. Deployments may not be available");
	process.env.INFURA_KEY = "";
	process.env.ALCHEMY_KEY = "";
}
if(!process.env.ETHERSCAN_KEY) {
	console.warn("ETHERSCAN_KEY is not set. Deployed smart contract code verification won't be available");
}
if(!process.env.POLYSCAN_KEY) {
	console.warn("POLYSCAN_KEY is not set. Deployed smart contract code verification won't be available on polyscan");
}
if(!process.env.BSCSCAN_KEY) {
	console.warn("BSCSCAN_KEY is not set. Deployed smart contract code verification won't be available on BscScan");
}
if(!process.env.BASESCAN_KEY) {
	console.warn("BASESCAN_KEY is not set. Deployed smart contract code verification won't be available on BaseScan");
}

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
	defaultNetwork: "hardhat",
	networks: {
		// https://hardhat.org/hardhat-network/
		hardhat: {
			// set networkId to 0xeeeb04de as for all local networks
			chainId: 0xeeeb04de,
			// set the gas price to one for convenient tx costs calculations in tests
			// gasPrice: 1,
			// London hard fork fix: impossible to set gas price lower than baseFeePerGas (875,000,000)
			initialBaseFeePerGas: 0,
			accounts: {
				count: 35,
			},
/*
			forking: {
				url: "https://mainnet.infura.io/v3/" + process.env.INFURA_KEY, // create a key: https://infura.io/
				enabled: !!(process.env.HARDHAT_FORK),
			},
*/
		},

		localhost: {
			url: "http://127.0.0.1:8545/",
			accounts: {mnemonic: FAKE_MNEMONIC},
		},

		// https://etherscan.io/
		mainnet: {
			url: get_endpoint_url("mainnet"),
			accounts: get_accounts(process.env.P_KEY1, process.env.MNEMONIC1),
		},
		// https://ropsten.etherscan.io/
		ropsten: {
			url: get_endpoint_url("ropsten"),
			accounts: get_accounts(process.env.P_KEY3, process.env.MNEMONIC3),
		},
		// https://rinkeby.etherscan.io/
		rinkeby: {
			url: get_endpoint_url("rinkeby"),
			accounts: get_accounts(process.env.P_KEY4, process.env.MNEMONIC4),
		},
		// https://kovan.etherscan.io/
		kovan: {
			url: get_endpoint_url("kovan"),
			accounts: get_accounts(process.env.P_KEY42, process.env.MNEMONIC42),
		},
		// https://goerli.etherscan.io/
		goerli: {
			url: get_endpoint_url("goerli"),
			accounts: get_accounts(process.env.P_KEY5, process.env.MNEMONIC5),
		},
		// matic/polygon L2 mainnet
		// https://polygonscan.com/
		polygon: {
			url: get_endpoint_url("polygon"),
			accounts: get_accounts(process.env.P_KEY137, process.env.MNEMONIC137),
		},
		// matic/polygon L1 testnet – Mumbai
		// https://mumbai.polygonscan.com/
		mumbai: {
			url: get_endpoint_url("mumbai"),
			accounts: get_accounts(process.env.P_KEY80001, process.env.MNEMONIC80001),
		},
		// Binance Smart Chain (BSC) L2 mainnet
		binance: {
			url: get_endpoint_url("binance"),
			accounts: get_accounts(process.env.P_KEY56, process.env.MNEMONIC56),
		},
		// Binance Smart Chain (BSC) L2 testnet
		binance_testnet: {
			url: get_endpoint_url("binance_testnet"),
			accounts: get_accounts(process.env.P_KEY97, process.env.MNEMONIC97),
		},
		// Binance opBNB Optimistic Rollup (L2) mainnet
		opBnb: {
			url: get_endpoint_url("opBnb"),
			accounts: get_accounts(process.env.P_KEY204, process.env.MNEMONIC204),
		},
		// Binance opBNB Optimistic Rollup (L2) testnet
		opBnb_testnet: {
			url: get_endpoint_url("opBnb_testnet"),
			accounts: get_accounts(process.env.P_KEY5611, process.env.MNEMONIC5611),
		},
		// Base Mainnet Optimistic Rollup (L2)
		base_mainnet: {
			url: get_endpoint_url("base_mainnet"),
			accounts: get_accounts(process.env.P_KEY8453, process.env.MNEMONIC8453),
		},
		// Base Testnet Optimistic Rollup (L2)
		base_goerli: {
			url: get_endpoint_url("base_goerli"),
			accounts: get_accounts(process.env.P_KEY84531, process.env.MNEMONIC84531),
			gasPrice: 1_000_000_000,
		},
	},

	// Configure Solidity compiler
	solidity: {
		// https://hardhat.org/guides/compile-contracts.html
		compilers: [
			{
				// Release v2.5
				version: "0.8.15",
				settings: {
					optimizer: {
						enabled: true,
						runs: 200
					}
				}
			},
		]
	},

	// Set default mocha options here, use special reporters etc.
	mocha: {
		// timeout: 100000,

		// disable mocha timeouts:
		// https://mochajs.org/api/mocha#enableTimeouts
		enableTimeouts: false,
		// https://github.com/mochajs/mocha/issues/3813
		timeout: false,
	},

	// hardhat-gas-reporter will be disabled by default, use REPORT_GAS environment variable to enable it
	// https://hardhat.org/plugins/hardhat-gas-reporter.html
	gasReporter: {
		enabled: !!(process.env.REPORT_GAS)
	},

	// compile Solidity sources directly from NPM dependencies
	// https://github.com/ItsNickBarry/hardhat-dependency-compiler
	dependencyCompiler: {
		paths: [
			// ERC1967 is used to deploy upgradeable contracts
			"@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol",
		],
	},

	// namedAccounts allows you to associate names to addresses and have them configured per chain
	// https://github.com/wighawag/hardhat-deploy#1-namedaccounts-ability-to-name-addresses
	namedAccounts: {
		// deployer account is always the account #0 derived from the mnemonic/private key
		deployer: {
			default: 0,
		},
		polygonChildChainManagerProxy: {
			"mumbai":  "0xb5505a6d998549090530911180f38aC5130101c6",
			"polygon": "0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa",
		},
		lzEndpoint: {
			"mainnet": "0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675",
			"goerli": "0xbfD2135BFfbb0B5378b56643c2Df8a87552Bfa23",
			"polygon": "0x3c2269811836af69497E5F486A85D7316753cf62",
			"mumbai": "0xf69186dfBa60DdB133E91E9A4B5673624293d8F8",
			"binance": "0x3c2269811836af69497E5F486A85D7316753cf62",
			"binance_testnet": "0x6Fcb97553D41516Cb228ac03FdC8B9a0a9df04A1",
			"base_mainnet": "0xb6319cC6c8c27A8F5dAF0dD3DF91EA35C4720dd7",
			"base_goerli": "0x6aB5Ae6822647046626e83ee6dB8187151E1d5ab",
		},
		opStandardBridge: {
			"opBnb": "0x4200000000000000000000000000000000000010",
			"opBnb_testnet": "0x4200000000000000000000000000000000000010",
			"base_mainnet": "0x4200000000000000000000000000000000000010",
			"base_goerli": "0x4200000000000000000000000000000000000010",
			"localhost": "0x4200000000000000000000000000000000000010",
			"hardhat": "0x4200000000000000000000000000000000000010",
		},
		IntelliLinkerERC1967Proxy: {
			"mainnet": "0xB9F02FC926b2ab66CAdd6eA1Ee90FB0D8698790b",
			"goerli":  "0xbF3Df254b65e527b20c255947E627f6856ff743B",
		},
		AliERC20v2: {
			"mainnet": "0x6B0b3a982b4634aC68dD83a4DBF02311cE324181",
			"goerli": "0x3ACd26F0b5080C30c066a2055A4254A5BB05F22a",
		},
		RemoteAliERC20v2: {
			"base_mainnet": "0x6B0b3a982b4634aC68dD83a4DBF02311cE324181", // AliERC20v2 mainnet
			"base_goerli": "0x3ACd26F0b5080C30c066a2055A4254A5BB05F22a", // AliERC20v2 goerli
			"localhost": "0x000000000000000000000000000000000000dEaD", // dead address
			"hardhat": "0x000000000000000000000000000000000000dEaD", // dead address
		},
		TheRevenantsERC721: {
			"mainnet": "0xc2D6B32E533e7A8dA404aBb13790a5a2F606aD75",
			"goerli":  "0x8920Df4215934E5f6c8935F0049E9b9d8dDF3656",
		},
		SophiaBeingERC721: {
			"mainnet": "0x75c804fFb01b16B7592a0B9644835244E2140728",
			"goerli":  "0xC6729C6cFc6B872acF641EB3EA628C9F038e5ABb",
		},
	},
}

/**
 * Determines a JSON-RPC endpoint to use to connect to the node
 * based on the requested network name and environment variables set
 *
 * Tries to use custom RPC URL first (MAINNET_RPC_URL/ROPSTEN_RPC_URL/RINKEBY_RPC_URL/KOVAN_RPC_URL)
 * Tries to use alchemy RPC URL next (if ALCHEMY_KEY is set)
 * Fallbacks to infura RPC URL
 *
 * @param network_name one of mainnet/ropsten/rinkeby/kovan
 * @return JSON-RPC endpoint URL
 */
function get_endpoint_url(network_name) {
	// try custom RPC endpoint first (private node, quicknode, etc.)
	// create a quicknode key: https://www.quicknode.com/
	if(process.env.MAINNET_RPC_URL && network_name === "mainnet") {
		return process.env.MAINNET_RPC_URL;
	}
	if(process.env.ROPSTEN_RPC_URL && network_name === "ropsten") {
		return process.env.ROPSTEN_RPC_URL;
	}
	if(process.env.RINKEBY_RPC_URL && network_name === "rinkeby") {
		return process.env.RINKEBY_RPC_URL;
	}
	if(process.env.KOVAN_RPC_URL && network_name === "kovan") {
		return process.env.KOVAN_RPC_URL;
	}
	if(process.env.GOERLI_RPC_URL && network_name === "goerli") {
		return process.env.GOERLI_RPC_URL;
	}
	if(process.env.POLYGON_RPC_URL && network_name === "polygon") {
		return process.env.POLYGON_RPC_URL;
	}
	if(process.env.MUMBAI_RPC_URL && network_name === "mumbai") {
		return process.env.MUMBAI_RPC_URL;
	}
	if(process.env.BSC_RPC_URL && network_name === "binance") {
		return process.env.BSC_RPC_URL;
	}
	if(process.env.BSC_TESTNET_RPC_URL && network_name === "binance_testnet") {
		return process.env.BSC_TESTNET_RPC_URL;
	}
	if(process.env.OP_BNB_RPC_URL && network_name === "opBnb") {
		return process.env.OP_BNB_RPC_URL;
	}
	if(process.env.OP_BNB_TESTNET_RPC_URL && network_name === "opBnb_testnet") {
		return process.env.OP_BNB_TESTNET_RPC_URL;
	}
	if(process.env.BASE_RPC_URL && network_name === "base_mainnet") {
		return process.env.BASE_RPC_URL;
	}
	if(process.env.BASE_GOERLI_RPC_URL && network_name === "base_goerli") {
		return process.env.BASE_GOERLI_RPC_URL;
	}

	// try the alchemy next
	// create a key: https://www.alchemy.com/
	if(process.env.ALCHEMY_KEY) {
		switch(network_name) {
			case "mainnet": return "https://eth-mainnet.alchemyapi.io/v2/" + process.env.ALCHEMY_KEY;
			case "ropsten": return "https://eth-ropsten.alchemyapi.io/v2/" + process.env.ALCHEMY_KEY;
			case "rinkeby": return "https://eth-rinkeby.alchemyapi.io/v2/" + process.env.ALCHEMY_KEY;
			case "kovan": return "https://eth-kovan.alchemyapi.io/v2/" + process.env.ALCHEMY_KEY;
			case "goerli": return "https://eth-goerli.alchemyapi.io/v2/" + process.env.ALCHEMY_KEY;
			case "polygon": return "https://polygon-mainnet.g.alchemy.com/v2/" + process.env.ALCHEMY_KEY;
			case "mumbai": return "https://polygon-mumbai.g.alchemy.com/v2/" + process.env.ALCHEMY_KEY;
			case "base_mainnet": return "https://base-mainnet.g.alchemy.com/v2/" + process.env.ALCHEMY_KEY;
			case "base_goerli": return "https://base-goerli.g.alchemy.com/v2/" + process.env.ALCHEMY_KEY;
		}
	}

	// try the infura next
	// create a key: https://infura.io/
	if(process.env.INFURA_KEY) {
		switch(network_name) {
			case "mainnet": return "https://mainnet.infura.io/v3/" + process.env.INFURA_KEY;
			case "ropsten": return "https://ropsten.infura.io/v3/" + process.env.INFURA_KEY;
			case "rinkeby": return "https://rinkeby.infura.io/v3/" + process.env.INFURA_KEY;
			case "kovan": return "https://kovan.infura.io/v3/" + process.env.INFURA_KEY;
			case "goerli": return "https://goerli.infura.io/v3/" + process.env.INFURA_KEY;
			case "polygon": return "https://polygon-mainnet.infura.io/v3/" + process.env.INFURA_KEY;
			case "mumbai": return "https://polygon-mumbai.infura.io/v3/" + process.env.INFURA_KEY;
		}
	}

	// some networks don't require API key
	switch(network_name) {
		case "polygon": return "https://polygon-rpc.com/";
		case "mumbai": return "https://rpc-mumbai.maticvigil.com";
		case "binance": return "https://bsc-dataseed1.binance.org/";
		case "binance_testnet":  return "https://data-seed-prebsc-1-s3.binance.org:8545/";
		case "opBnb": return "https://opbnb-mainnet.nodereal.io/v1/64a9df0874fb4a93b9d0a3849de012d3";
		case "opBnb_testnet": return "https://opbnb-testnet.nodereal.io/v1/9989d39cb7484ee9abcec2132a242315";
		case "base_mainnet": return "https://mainnet.base.org";
		case "base_goerli": return "https://goerli.base.org";
	}

	// fallback to default JSON_RPC_URL (if set)
	return process.env.JSON_RPC_URL || "";
}

/**
 * Depending on which of the inputs are available (private key or mnemonic),
 * constructs an account object for use in the hardhat config
 *
 * @param p_key account private key, export private key from mnemonic: https://metamask.io/
 * @param mnemonic 12 words mnemonic, create 12 words: https://metamask.io/
 * @return either [p_key] if p_key is defined, or {mnemonic} if mnemonic is defined
 */
function get_accounts(p_key, mnemonic) {
	return p_key? [p_key]: mnemonic? {mnemonic, initialIndex: 0}: undefined;
}
