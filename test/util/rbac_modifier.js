// AccessControl (RBAC) restrictedTo modifier tests

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

// deployment routines in use
const {
	deploy_access_control,
} = require("./include/deployment_routines");

// run AccessControl (RBAC) tests
contract('AccessControl (RBAC) "restrictedTo" Modifier tests', function(accounts) {
	// extract accounts to be used:
	// A0 – special default zero account accounts[0] used by Truffle, reserved
	// a0 – deployment account having all the permissions, reserved
	// H0 – initial token holder account
	// a1, a2,... – working accounts to perform tests on
	const [A0, a0, H0, a1, a2, a3] = accounts;

	// `restrictedTo` modifier check
	describe("restrictedTo modifier check", function() {
		let access_control;
		beforeEach(async function() {
			access_control = await deploy_access_control(a0);
		});
		it("function protected with restrictedTo modifier fails when run not by an admin", async function() {
			await expectRevert(access_control.restricted({from: a1}), "access denied");
		});
		describe("function protected with restrictedTo modifier succeeds when run by admin", async function() {
			let receipt;
			beforeEach(async function() {
				receipt = await access_control.restricted({from: a0});
			});
			it('"Restricted" event is emitted', async function() {
				expectEvent(receipt, "Restricted");
			});
		});
	});
});
