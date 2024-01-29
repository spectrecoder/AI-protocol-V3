// OpenZeppelin ERC721 Tests Runner
// See https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/test/token/ERC721/

// ACL token features and roles
const {
	ROLE_TOKEN_CREATOR,
	ROLE_TOKEN_DESTROYER,
	ROLE_URI_MANAGER,
} = require("../include/features_roles");

// Zeppelin unit tests – delivered as behaviours
// basic ERC721 behaviours
const {
	shouldBehaveLikeERC721,
	shouldBehaveLikeERC721Enumerable,
	shouldBehaveLikeERC721Metadata,
} = require("./include/zeppelin/ERC721.behavior");
// ERC721URIStorage behaviour
const {
	shouldBehaveLikeERC721URIStorage,
} = require("./include/zeppelin/ERC721URIStorage.behaviour");

// deployment routines in use, token name and symbol
const {
	short_erc721_deploy,
	burnable_short_erc721_deploy,
	tiny_erc721_deploy,
	NAME,
	SYMBOL,
} = require("./include/deployment_routines");

// run OpenZeppelin ERC721 tests
contract("ERC721: OpenZeppelin ERC721 Tests", function(accounts) {
	// extract accounts to be used:
	// A0 – special default zero account accounts[0] used by Truffle, reserved
	// a0 – deployment account having all the permissions, reserved
	// H0 – initial token holder account
	// a1, a2,... – working accounts to perform tests on
	const [A0, a0, H0, a1, a2, a3, a4, a5] = accounts;

	describe("ShortERC721 shouldBehaveLikeERC721 +Enumerable +Metadata -Burnable", function() {
		// Zeppelin token setup
		beforeEach(async function() {
			// Zeppelin uses this.token shortcut to access token instance
			this.token = await short_erc721_deploy(a0);
		});

		// Zeppelin setup for transfers: not required, full set of features already on deployment

		// Zeppelin setup for token minting, URI setup
		beforeEach(async function() {
			// Zeppelin uses default zero account A0 (accounts[0]) to mint tokens,
			// set the token URI and base URI,
			// grant this address a permission to mint
			await this.token.updateRole(A0, ROLE_TOKEN_CREATOR | ROLE_URI_MANAGER, {from: a0});
		});

		// run Zeppelin tests delivered as behaviours
		shouldBehaveLikeERC721("", H0, a1, a2, a3, a4, a5, false);
		shouldBehaveLikeERC721Enumerable("", H0, a1, a2, a3, a4, a5, false);
		shouldBehaveLikeERC721Metadata("", NAME, SYMBOL, H0);
		shouldBehaveLikeERC721URIStorage(H0, false);
	});

	describe("BurnableShortERC721 shouldBehaveLikeERC721 +Enumerable +Metadata", function() {
		// Zeppelin token setup
		beforeEach(async function() {
			// Zeppelin uses this.token shortcut to access token instance
			this.token = await burnable_short_erc721_deploy(a0);
		});

		// Zeppelin setup for transfers: not required, full set of features already on deployment

		// Zeppelin setup for token minting/burning, URI setup
		beforeEach(async function() {
			// Zeppelin uses default zero account A0 (accounts[0]) to mint/burn tokens,
			// set the token URI and base URI,
			// grant this address a permission to mint
			await this.token.updateRole(A0, ROLE_TOKEN_CREATOR | ROLE_TOKEN_DESTROYER | ROLE_URI_MANAGER, {from: a0});
		});

		// run Zeppelin tests delivered as behaviours
		shouldBehaveLikeERC721("", H0, a1, a2, a3, a4, a5);
		shouldBehaveLikeERC721Enumerable("", H0, a1, a2, a3, a4, a5);
		shouldBehaveLikeERC721Metadata("", NAME, SYMBOL, H0);
		shouldBehaveLikeERC721URIStorage(H0);
	});

	describe("TinyERC721 shouldBehaveLikeERC721 +Enumerable +Metadata", function() {
		// Zeppelin token setup
		beforeEach(async function() {
			// Zeppelin uses this.token shortcut to access token instance
			this.token = await tiny_erc721_deploy(a0);
		});

		// Zeppelin setup for transfers: not required, full set of features already on deployment

		// Zeppelin setup for token minting/burning, URI setup
		beforeEach(async function() {
			// Zeppelin uses default zero account A0 (accounts[0]) to mint/burn tokens,
			// set the token URI and base URI,
			// grant this address a permission to mint
			await this.token.updateRole(A0, ROLE_TOKEN_CREATOR | ROLE_TOKEN_DESTROYER | ROLE_URI_MANAGER, {from: a0});
		});

		// run Zeppelin tests delivered as behaviours
		shouldBehaveLikeERC721("", H0, a1, a2, a3, a4, a5);
		shouldBehaveLikeERC721Enumerable("", H0, a1, a2, a3, a4, a5);
		shouldBehaveLikeERC721Metadata("", NAME, SYMBOL, H0);
		shouldBehaveLikeERC721URIStorage(H0);
	});
});
