// batch minting tests

// Zeppelin test helpers
const {
	expectRevert,
	expectEvent
} = require("@openzeppelin/test-helpers");

const {
	expect,
} = require("chai");

// ACL token features and roles
const {
	ROLE_URI_MANAGER,
} = require("../../include/features_roles");

// deployment routines in use, token name and symbol
const {
	royal_nft_deploy
} = require("../include/deployment_routines");

// run contract metadata tests
contract("ERC721: contract metadata", function(accounts) {
	// extract accounts to be used:
	// A0 – special default zero account accounts[0] used by Truffle, reserved
	// a0 – deployment account having all the permissions, reserved
	// H0 – initial token holder account
	// a1, a2,... – working accounts to perform tests on
	const [A0, a0, H0, a1, a2] = accounts;

	// test suite
	function contract_metadata_suite(contract_name, deployment_fn) {
		describe(contract_name, function() {
			// deploy token
			let token, defaultContractUri = "https://gateway.pinata.cloud/ipfs/QmU92w8iKpcaabCoyHtMg7iivWGqW2gW1hgARDtqCmJUWv";
			beforeEach(async function() {
				token = await deployment_fn.call(this, a0);
				await token.updateRole(A0, ROLE_URI_MANAGER, { from: a0 });
			});

			describe("contract metadata", () => {
				it("should initialize with the correct default contract metadata", async () => {
					expect(await token.contractURI()).to.equal(defaultContractUri);
				});

				it("should be able to change contract uri if role uri changer", async () => {
					const newContractUri = "https://google.com";

					await token.setContractURI(newContractUri, { from: A0 });

					expect(await token.contractURI()).to.equal(newContractUri);
				});

				it("should emit an event when contract uri is changed", async () => {
					const newContractUri = "https://google.com";

					expectEvent(
						await token.setContractURI(newContractUri, { from: A0 }),
						"ContractURIUpdated",
						{
							_by: A0,
							_value: newContractUri
						}
					);
				});

				it("should not be able to change contract uri if not role uri changer", async () => {
					await expectRevert(
						token.setContractURI("https://google.com", { from: a1 }),
						"access denied"
					);
				});
			});
		});
	}

	// batch_minting_suite("ShortERC721", short_erc721_deploy);
	// batch_minting_suite("BurnableShortERC721", burnable_short_erc721_deploy);
	contract_metadata_suite("RoyalNFT", royal_nft_deploy);
});
