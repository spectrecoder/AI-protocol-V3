// UpgradeableAccessControl (U-RBAC) Core Tests

// Zeppelin test helpers
const {
	BN,
	constants,
	expectEvent,
	expectRevert,
} = require("@openzeppelin/test-helpers");
const {
	assert,
	expect,
} = require("chai");
const {
	ZERO_ADDRESS,
	ZERO_BYTES32,
	MAX_UINT256,
} = constants;

// RBAC core features and roles
const {
	not,
	ROLE_UPGRADE_MANAGER,
} = require("../include/features_roles");

// deployment routines in use
const {
	deploy_upgradeable_ac,
	deploy_erc1967_upgradeable_ac,
} = require("./include/deployment_routines");

// run UpgradeableAccessControl (U-RBAC) tests
contract("UpgradeableAccessControl (U-RBAC) Core tests", function(accounts) {
	// extract accounts to be used:
	// A0 – special default zero account accounts[0] used by Truffle, reserved
	// a0 – deployment account having all the permissions, reserved
	// H0 – initial token holder account
	// a1, a2,... – working accounts to perform tests on
	const [A0, a0, H0, a1, a2, a3] = accounts;

	// define the "players"
	const by = a1;
	const to = a2;

	// deploy the RBAC
	let ac, impl1;
	beforeEach(async function() {
		({proxy: ac, implementation: impl1} = await deploy_erc1967_upgradeable_ac(a0));
	});

	it("it is impossible to re-initialize", async function() {
		await expectRevert(ac.postConstruct({from: a0}), "Initializable: contract is already initialized");
	});
	describe("when there is new (v2) implementation available", function() {
		let impl2;
		beforeEach(async function() {
			impl2 = await deploy_upgradeable_ac(a0, 2);
		});
		describe("when performed by UPGRADE_MANAGER", function() {
			beforeEach(async function() {
				await ac.updateRole(by, ROLE_UPGRADE_MANAGER, {from: a0});
			});
			it("implementation upgrade with initialization fails (already initialized)", async function() {
				// prepare the initialization call bytes
				const init_data = ac.contract.methods.postConstruct().encodeABI();

				// and upgrade the implementation
				await expectRevert(
					ac.upgradeToAndCall(impl2.address, init_data, {from: by}),
					"Initializable: contract is already initialized"
				);
			});
			describe("implementation upgrade without initialization succeeds", function() {
				let receipt;
				beforeEach(async function() {
					receipt = await ac.upgradeTo(impl2.address, {from: by});
				});
				it('"Upgraded" event is emitted', async function() {
					expectEvent(receipt, "Upgraded", {implementation: impl2.address});
				});
				it("implementation address is set as expected", async function() {
					expect(await ac.getImplementation()).to.be.equal(impl2.address);
				});
			});
			it("direct initialization of the implementation (bypassing proxy) fails", async function() {
				await expectRevert(impl1.postConstruct({from: by}), "Initializable: contract is already initialized");
			});
			it("direct upgrade of the implementation (bypassing proxy) fails", async function() {
				await expectRevert(impl1.upgradeTo(impl2.address, {from: by}), "Function must be called through delegatecall");
			});
		});
		describe("otherwise (no UPGRADE_MANAGER permission)", function() {
			beforeEach(async function() {
				await ac.updateRole(by, not(ROLE_UPGRADE_MANAGER), {from: a0});
			});
			it("implementation upgrade with initialization fails (already initialized)", async function() {
				// prepare the initialization call bytes
				const init_data = ac.contract.methods.postConstruct().encodeABI();

				// and upgrade the implementation
				await expectRevert(
					ac.upgradeToAndCall(impl2.address, init_data, {from: by}),
					"access denied"
				);
			});
			it("implementation upgrade without initialization reverts", async function() {
				await expectRevert(ac.upgradeTo(impl2.address, {from: by}), "access denied");
			});
			it("direct initialization of the implementation (bypassing proxy) fails", async function() {
				await expectRevert(impl1.postConstruct({from: by}), "Initializable: contract is already initialized");
			});
			it("direct upgrade of the implementation (bypassing proxy) fails", async function() {
				await expectRevert(impl1.upgradeTo(impl2.address, {from: by}), "Function must be called through delegatecall");
			});
		});
	});
});
