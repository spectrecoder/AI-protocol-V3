// Alethea/Zeppelin ERC20 interfaceId mismatch test

// Zeppelin test helpers (chai only)
const {
	assert,
	expect,
} = require("chai");

// run Alethea/Zeppelin ERC20 interfaceId mismatch test
contract("InterfaceId: Alethea/Zeppelin ERC20 interfaceId match test", function(accounts) {
	// extract accounts to be used:
	// A0 – special default zero account accounts[0] used by Truffle, reserved
	// a0 – deployment account having all the permissions, reserved
	// H0 – initial token holder account
	// a1, a2,... – working accounts to perform tests on
	const [A0, a0, H0, a1, a2, a3, a4] = accounts;

	// deployment
	let iid;
	beforeEach(async function() {
		const InterfaceId = artifacts.require("ERC20InterfaceIdMock");
		iid = await InterfaceId.new({from: a0});
	});

	it("Alethea ERC20 interfaceId should match Zeppelin IERC20 InterfaceId", async function() {
		const aletheaId = await iid.aletheaId();
		const zeppelinId = await iid.zeppelinId();
		expect(aletheaId).to.equal(zeppelinId);
	});
});
