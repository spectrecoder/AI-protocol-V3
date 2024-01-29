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

// BN constants and utilities
const {
	random_bn255,
} = require("../../include/bn_utils");

// RBAC core features and roles
const {
	not,
	ROLE_ACCESS_MANAGER,
} = require("../../include/features_roles");

/**
 * RBAC core behaviour
 *
 * @param deployment_fn RBAC contract deployment function
 * @param a0 deployer/admin account
 * @param a1 participant 1
 * @param a2 participant 2
 */
function behavesLikeRBAC(deployment_fn, a0, a1, a2) {
	// define the "players"
	const by = a1;
	const to = a2;

	// deploy the access control
	let access_control;
	beforeEach(async function() {
		access_control = await deployment_fn.call(this, a0);
	});

	function test_suite(write_fn, read_fn, check_fn, to_fn) {
		describe("when performed by ACCESS_MANAGER", function() {
			beforeEach(async function() {
				await access_control.updateRole(by, ROLE_ACCESS_MANAGER, {from: a0});
			});
			describe("when ACCESS_MANAGER has full set of permissions", function() {
				beforeEach(async function() {
					await access_control.updateRole(by, MAX_UINT256, {from: a0});
				});
				describe("what you set", function() {
					let receipt, set;
					beforeEach(async function() {
						// do not touch the highest permission bit (ACCESS_MANAGER permission)
						set = random_bn255();
						receipt = await write_fn(by, to, set);
					});
					describe("is what you get", function() {
						it('"userRoles" value', async function() {
							expect(await read_fn(to)).to.be.bignumber.that.equals(set);
						});
						it("role check (isOperatorInRole/isFeatureEnabled)", async function() {
							expect(await check_fn(to, set)).to.be.true;
						});
						it('"RoleUpdated" event', async function() {
							expectEvent(receipt, "RoleUpdated", {
								operator: to_fn(to),
								requested: set,
								assigned: set,
							});
						});
					});
				});
				describe("what you remove", function() {
					let receipt, remove;
					beforeEach(async function() {
						// do not touch the highest permission bit (ACCESS_MANAGER permission)
						remove = random_bn255();
						receipt = await write_fn(by, to, not(remove));
					});
					describe("is what gets removed", function() {
						it('"userRoles" value', async function() {
							expect(await read_fn(to)).to.be.bignumber.that.equals(not(remove));
						});
						it("role check (isOperatorInRole/isFeatureEnabled)", async function() {
							expect(await check_fn(to, not(remove))).to.be.true;
						});
						it('"RoleUpdated" event', async function() {
							expectEvent(receipt, "RoleUpdated", {
								operator: to_fn(to),
								requested: not(remove),
								assigned: not(remove),
							});
						});
					});
				});
			});
			describe("when ACCESS_MANAGER doesn't have any permissions", function() {
				describe("what you get, independently of what you set", function() {
					let receipt, set;
					beforeEach(async function() {
						// do not touch the highest permission bit (ACCESS_MANAGER permission)
						set = random_bn255();
						receipt = await write_fn(by, to, set);
					});
					describe("is always zero", function() {
						it('"userRoles" value', async function() {
							expect(await read_fn(to)).to.be.bignumber.that.is.zero;
						});
						it("role check (isOperatorInRole/isFeatureEnabled)", async function() {
							expect(await check_fn(to, set)).to.be.false;
						});
						it('"RoleUpdated" event', async function() {
							expectEvent(receipt, "RoleUpdated", {
								operator: to_fn(to),
								requested: set,
								assigned: "0",
							});
						});
					});
				});
				describe("what you get, independently of what you remove", function() {
					let receipt, remove;
					beforeEach(async function() {
						// do not touch the highest permission bit (ACCESS_MANAGER permission)
						remove = random_bn255();
						await write_fn(a0, to, MAX_UINT256);
						receipt = await write_fn(by, to, not(remove));
					});
					describe("is always what you had", function() {
						it('"userRoles" value', async function() {
							expect(await read_fn(to)).to.be.bignumber.that.equals(MAX_UINT256);
						});
						it("role check (isOperatorInRole/isFeatureEnabled)", async function() {
							expect(await check_fn(to, MAX_UINT256)).to.be.true;
						});
						it('"RoleUpdated" event', async function() {
							expectEvent(receipt, "RoleUpdated", {
								operator: to_fn(to),
								requested: not(remove),
								assigned: MAX_UINT256,
							});
						});
					});
				});
			});
			describe("when ACCESS_MANAGER has some permissions", function() {
				let role;
				beforeEach(async function() {
					// do not touch the highest permission bit (ACCESS_MANAGER permission)
					role = random_bn255();
					await access_control.updateRole(by, ROLE_ACCESS_MANAGER.or(role), {from: a0});
				});
				describe("what you get", function() {
					let receipt, set;
					beforeEach(async function() {
						// do not touch the highest permission bit (ACCESS_MANAGER permission)
						set = random_bn255();
						receipt = await write_fn(by, to, set);
					});
					describe("is an intersection of what you set and what you have", function() {
						it('"userRoles" value', async function() {
							expect(await read_fn(to)).to.be.bignumber.that.equals(role.and(set));
						});
						it("role check (isOperatorInRole/isFeatureEnabled)", async function() {
							expect(await check_fn(to, role.and(set))).to.be.true;
						});
						it('"RoleUpdated" event', async function() {
							expectEvent(receipt, "RoleUpdated", {
								operator: to_fn(to),
								requested: set,
								assigned: role.and(set),
							});
						});
					});
				});
				describe("what you remove", function() {
					let receipt, remove;
					beforeEach(async function() {
						// do not touch the highest permission bit (ACCESS_MANAGER permission)
						remove = random_bn255();
						await write_fn(a0, to, MAX_UINT256);
						receipt = await write_fn(by, to, not(remove));
					});
					describe("is an intersection of what you tried to remove and what you have", function() {
						it('"userRoles" value', async function() {
							expect(await read_fn(to)).to.be.bignumber.that.equals(not(role.and(remove)));
						});
						it("role check (isOperatorInRole/isFeatureEnabled)", async function() {
							expect(await check_fn(to, not(role.and(remove)))).to.be.true;
						});
						it('"RoleUpdated" event', async function() {
							expectEvent(receipt, "RoleUpdated", {
								operator: to_fn(to),
								requested: not(remove),
								assigned: not(role.and(remove)),
							});
						});
					});
				});
			});
			describe("ACCESS_MANAGER updates itself", function() {
				beforeEach(async function() {
					// do not touch the highest permission bit (ACCESS_MANAGER permission)
					const role = random_bn255();
					await access_control.updateRole(by, ROLE_ACCESS_MANAGER.or(role), {from: a0});
				});
				it("and degrades to zero with the 99.99% probability in 14 runs", async function() {
					// randomly remove 255 bits of permissions
					for(let i = 0; i < 14; i++) {
						// do not touch the highest permission bit (ACCESS_MANAGER permission)
						const role = random_bn255();
						await access_control.updateRole(by, not(role), {from: by});
					}
					// this may fail with the probability 2^(-14) < 0.01%
					expect(await access_control.getRole(by)).to.be.bignumber.that.equals(ROLE_ACCESS_MANAGER);
				})
			});
			describe("when ACCESS_MANAGER grants ACCESS_MANAGER permission", function() {
				beforeEach(async function() {
					await access_control.updateRole(to, ROLE_ACCESS_MANAGER, {from: by});
				});
				it("operator becomes an ACCESS_MANAGER", async function() {
					expect(await access_control.isOperatorInRole(to, ROLE_ACCESS_MANAGER), "operator").to.be.true;
					expect(await access_control.isSenderInRole(ROLE_ACCESS_MANAGER, {from: to}), "sender").to.be.true;
				});
			});
			describe("when ACCESS_MANAGER revokes ACCESS_MANAGER permission from itself", function() {
				beforeEach(async function() {
					await access_control.updateRole(by, 0, {from: by});
				});
				it("operator ceases to be an ACCESS_MANAGER", async function() {
					expect(await access_control.isOperatorInRole(by, ROLE_ACCESS_MANAGER), "operator").to.be.false;
					expect(await access_control.isSenderInRole(ROLE_ACCESS_MANAGER, {from: by}), "sender").to.be.false;
				});
			});
		});
		describe("otherwise (no ACCESS_MANAGER permission)", function() {
			it("updateFeatures reverts", async function() {
				await expectRevert(access_control.updateFeatures(1, {from: by}), "access denied");
			});
			it("updateRole reverts", async function() {
				await expectRevert(access_control.updateRole(to, 1, {from: by}), "access denied");
			});
		});
	}

	// run two test suites to test get/set role and get/set features
	test_suite(
		async(by, to, set) => await access_control.updateRole(to, set, {from: by}),
		async(op) => await access_control.getRole(op),
		async(op, role) => await access_control.isOperatorInRole(op, role),
		(to) => to
	);
	test_suite(
		async(by, to, set) => await access_control.updateFeatures(set, {from: by}),
		async(op) => await access_control.features(),
		async(op, role) => await access_control.isFeatureEnabled(role),
		(to) => access_control.address
	);
}

// export the RBAC core behaviour
module.exports = {
	behavesLikeRBAC,
}
