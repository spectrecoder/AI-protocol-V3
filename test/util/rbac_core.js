// AccessControl (RBAC) Core Tests

// import the core RBAC behaviour to use
const {
	behavesLikeRBAC,
} = require("./include/rbac.behaviour");

// deployment routines in use
const {
	deploy_access_control,
} = require("./include/deployment_routines");

// run AccessControl (RBAC) tests
contract("AccessControl (RBAC) Core tests", function(accounts) {
	// extract accounts to be used:
	// A0 – special default zero account accounts[0] used by Truffle, reserved
	// a0 – deployment account having all the permissions, reserved
	// H0 – initial token holder account
	// a1, a2,... – working accounts to perform tests on
	const [A0, a0, H0, a1, a2, a3] = accounts;

	// run the core RBACs behaviour test
	behavesLikeRBAC(deploy_access_control, a0, a1, a2);
});
