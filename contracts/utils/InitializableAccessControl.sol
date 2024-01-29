// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title Initializable Role-based Access Control (RBAC) // ERC1967Proxy
 *
 * @notice Access control smart contract provides an API to check
 *      if a specific operation is permitted globally and/or
 *      if a particular user has a permission to execute it.
 *
 * @notice This contract is inherited by other contracts requiring the role-based access control (RBAC)
 *      protection for the restricted access functions
 *
 * @notice It deals with two main entities: features and roles.
 *
 * @notice Features are designed to be used to enable/disable public functions
 *      of the smart contract (used by a wide audience).
 * @notice User roles are designed to control the access to restricted functions
 *      of the smart contract (used by a limited set of maintainers).
 *
 * @notice Terms "role", "permissions" and "set of permissions" have equal meaning
 *      in the documentation text and may be used interchangeably.
 * @notice Terms "permission", "single permission" implies only one permission bit set.
 *
 * @notice Access manager is a special role which allows to grant/revoke other roles.
 *      Access managers can only grant/revoke permissions which they have themselves.
 *      As an example, access manager with no other roles set can only grant/revoke its own
 *      access manager permission and nothing else.
 *
 * @notice Access manager permission should be treated carefully, as a super admin permission:
 *      Access manager with even no other permission can interfere with another account by
 *      granting own access manager permission to it and effectively creating more powerful
 *      permission set than its own.
 *
 * @dev Both current and OpenZeppelin AccessControl implementations feature a similar API
 *      to check/know "who is allowed to do this thing".
 * @dev Zeppelin implementation is more flexible:
 *      - it allows setting unlimited number of roles, while current is limited to 256 different roles
 *      - it allows setting an admin for each role, while current allows having only one global admin
 * @dev Current implementation is more lightweight:
 *      - it uses only 1 bit per role, while Zeppelin uses 256 bits
 *      - it allows setting up to 256 roles at once, in a single transaction, while Zeppelin allows
 *        setting only one role in a single transaction
 *
 * @dev This smart contract is designed to be inherited by other
 *      smart contracts which require access control management capabilities.
 *
 * @dev Access manager permission has a bit 255 set.
 *      This bit must not be used by inheriting contracts for any other permissions/features.
 *
 * @dev This is an initializable version of the RBAC, based on Zeppelin implementation,
 *      it can be used for ERC1967 proxies, as well as for EIP-1167 minimal proxies
 *      see https://docs.openzeppelin.com/contracts/4.x/upgradeable
 *      see https://docs.openzeppelin.com/contracts/4.x/api/proxy#UUPSUpgradeable
 *      see https://forum.openzeppelin.com/t/uups-proxies-tutorial-solidity-javascript/7786
 *      see https://eips.ethereum.org/EIPS/eip-1167
 *      see https://docs.openzeppelin.com/contracts/4.x/api/proxy#Clones
 *
 * @author Basil Gorin
 */
abstract contract InitializableAccessControl is Initializable {
	/**
	 * @dev Privileged addresses with defined roles/permissions
	 * @dev In the context of ERC20/ERC721 tokens these can be permissions to
	 *      allow minting or burning tokens, transferring on behalf and so on
	 *
	 * @dev Maps user address to the permissions bitmask (role), where each bit
	 *      represents a permission
	 * @dev Bitmask 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF
	 *      represents all possible permissions
	 * @dev 'This' address mapping represents global features of the smart contract
	 *
	 * @dev We keep the mapping private to prevent direct writes to it from the inheriting
	 *      contracts, `getRole()` and `updateRole()` functions should be used instead
	 */
	mapping(address => uint256) private userRoles;

	/**
	 * @dev Empty reserved space in storage. The size of the __gap array is calculated so that
	 *      the amount of storage used by a contract always adds up to the 50.
	 *      See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
	 */
	uint256[49] private __gap;

	/**
	 * @notice Access manager is responsible for assigning the roles to users,
	 *      enabling/disabling global features of the smart contract
	 * @notice Access manager can add, remove and update user roles,
	 *      remove and update global features
	 *
	 * @dev Role ROLE_ACCESS_MANAGER allows modifying user roles and global features
	 * @dev Role ROLE_ACCESS_MANAGER has single bit at position 255 enabled
	 */
	uint256 public constant ROLE_ACCESS_MANAGER = 0x8000000000000000000000000000000000000000000000000000000000000000;

	/**
	 * @notice Upgrade manager is responsible for smart contract upgrades,
	 *      see https://docs.openzeppelin.com/contracts/4.x/api/proxy#UUPSUpgradeable
	 *      see https://docs.openzeppelin.com/contracts/4.x/upgradeable
	 *
	 * @dev Role ROLE_UPGRADE_MANAGER allows passing the _authorizeUpgrade() check
	 * @dev Role ROLE_UPGRADE_MANAGER has single bit at position 254 enabled
	 */
	uint256 public constant ROLE_UPGRADE_MANAGER = 0x4000000000000000000000000000000000000000000000000000000000000000;

	/**
	 * @dev Bitmask representing all the possible permissions (super admin role)
	 * @dev Has all the bits are enabled (2^256 - 1 value)
	 */
	uint256 private constant FULL_PRIVILEGES_MASK = type(uint256).max; // before 0.8.0: uint256(-1) overflows to 0xFFFF...

	/**
	 * @dev Fired in updateRole() and updateFeatures()
	 *
	 * @param operator address which was granted/revoked permissions
	 * @param requested permissions requested
	 * @param assigned permissions effectively set
	 */
	event RoleUpdated(address indexed operator, uint256 requested, uint256 assigned);

	/**
	 * @notice Function modifier making a function defined as public behave as restricted
	 *      (so that only a pre-configured set of accounts can execute it)
	 *
	 * @param role the role transaction executor is required to have;
	 *      the function throws an "access denied" exception if this condition is not met
	 */
	modifier restrictedTo(uint256 role) {
		// verify the access permission
		require(isSenderInRole(role), "access denied");

		// execute the rest of the function
		_;
	}

	/**
	 * @dev Creates/deploys the ACL implementation to be used in a proxy
	 *
	 * @dev Note:
	 *      the implementation is already initialized and
	 *      `_postConstruct` is not executable on the implementation
	 *      `_postConstruct` is still available in the context of a proxy
	 *      and should be executed on the proxy deployment (in the same tx)
	 */
	 // constructor() initializer {}

	/**
	 * @dev Contract initializer, sets the contract owner to have full privileges
	 *
	 * @dev Can be executed only once, reverts when executed second time
	 *
	 * @dev IMPORTANT:
	 *      this function SHOULD be executed during proxy deployment (in the same transaction)
	 *
	 * @param _owner smart contract owner having full privileges
	 */
	function _postConstruct(address _owner) internal virtual onlyInitializing {
		// grant owner full privileges
		__setRole(_owner, FULL_PRIVILEGES_MASK, FULL_PRIVILEGES_MASK);
	}

	/**
	 * @dev Highest version that has been initialized.
	 *      Non-zero value means contract was already initialized.
	 * @dev see {Initializable}, {reinitializer}.
	 *
	 * @return highest version that has been initialized
	 */
/*
	function getInitializedVersion() public view returns(uint64) {
		// delegate to `_getInitializedVersion`
		return _getInitializedVersion();
	}
*/

	/**
	 * @notice Retrieves globally set of features enabled
	 *
	 * @dev Effectively reads userRoles role for the contract itself
	 *
	 * @return 256-bit bitmask of the features enabled
	 */
	function features() public view returns (uint256) {
		// features are stored in 'this' address mapping of `userRoles`
		return getRole(address(this));
	}

	/**
	 * @notice Updates set of the globally enabled features (`features`),
	 *      taking into account sender's permissions
	 *
	 * @dev Requires transaction sender to have `ROLE_ACCESS_MANAGER` permission
	 * @dev Function is left for backward compatibility with older versions
	 *
	 * @param _mask bitmask representing a set of features to enable/disable
	 */
	function updateFeatures(uint256 _mask) public {
		// delegate call to `updateRole`
		updateRole(address(this), _mask);
	}

	/**
	 * @notice Reads the permissions (role) for a given user from the `userRoles` mapping
	 *      (privileged addresses with defined roles/permissions)
	 * @notice In the context of ERC20/ERC721 tokens these can be permissions to
	 *      allow minting or burning tokens, transferring on behalf and so on
	 *
	 * @dev Having a simple getter instead of making the mapping public
	 *      allows enforcing the encapsulation of the mapping and protects from
	 *      writing to it directly in the inheriting smart contracts
	 *
	 * @param operator address of a user to read permissions for,
	 *      or self address to read global features of the smart contract
	 */
	function getRole(address operator) public view returns(uint256) {
		// read the value from `userRoles` and return
		return userRoles[operator];
	}

	/**
	 * @notice Updates set of permissions (role) for a given user,
	 *      taking into account sender's permissions.
	 *
	 * @dev Setting role to zero is equivalent to removing an all permissions
	 * @dev Setting role to `FULL_PRIVILEGES_MASK` is equivalent to
	 *      copying senders' permissions (role) to the user
	 * @dev Requires transaction sender to have `ROLE_ACCESS_MANAGER` permission
	 *
	 * @param operator address of a user to alter permissions for,
	 *       or self address to alter global features of the smart contract
	 * @param role bitmask representing a set of permissions to
	 *      enable/disable for a user specified
	 */
	function updateRole(address operator, uint256 role) public {
		// caller must have a permission to update user roles
		require(isSenderInRole(ROLE_ACCESS_MANAGER), "access denied");

		// evaluate the role and reassign it
		__setRole(operator, role, _evaluateBy(msg.sender, getRole(operator), role));
	}

	/**
	 * @notice Determines the permission bitmask an operator can set on the
	 *      target permission set
	 * @notice Used to calculate the permission bitmask to be set when requested
	 *     in `updateRole` and `updateFeatures` functions
	 *
	 * @dev Calculated based on:
	 *      1) operator's own permission set read from userRoles[operator]
	 *      2) target permission set - what is already set on the target
	 *      3) desired permission set - what do we want set target to
	 *
	 * @dev Corner cases:
	 *      1) Operator is super admin and its permission set is `FULL_PRIVILEGES_MASK`:
	 *        `desired` bitset is returned regardless of the `target` permission set value
	 *        (what operator sets is what they get)
	 *      2) Operator with no permissions (zero bitset):
	 *        `target` bitset is returned regardless of the `desired` value
	 *        (operator has no authority and cannot modify anything)
	 *
	 * @dev Example:
	 *      Consider an operator with the permissions bitmask     00001111
	 *      is about to modify the target permission set          01010101
	 *      Operator wants to set that permission set to          00110011
	 *      Based on their role, an operator has the permissions
	 *      to update only lowest 4 bits on the target, meaning that
	 *      high 4 bits of the target set in this example is left
	 *      unchanged and low 4 bits get changed as desired:      01010011
	 *
	 * @param operator address of the contract operator which is about to set the permissions
	 * @param target input set of permissions to operator is going to modify
	 * @param desired desired set of permissions operator would like to set
	 * @return resulting set of permissions given operator will set
	 */
	function _evaluateBy(address operator, uint256 target, uint256 desired) internal view returns (uint256) {
		// read operator's permissions
		uint256 p = getRole(operator);

		// taking into account operator's permissions,
		// 1) enable the permissions desired on the `target`
		target |= p & desired;
		// 2) disable the permissions desired on the `target`
		target &= FULL_PRIVILEGES_MASK ^ (p & (FULL_PRIVILEGES_MASK ^ desired));

		// return calculated result
		return target;
	}

	/**
	 * @notice Checks if requested set of features is enabled globally on the contract
	 *
	 * @param required set of features to check against
	 * @return true if all the features requested are enabled, false otherwise
	 */
	function isFeatureEnabled(uint256 required) public view returns (bool) {
		// delegate call to `__hasRole`, passing `features` property
		return __hasRole(features(), required);
	}

	/**
	 * @notice Checks if transaction sender `msg.sender` has all the permissions required
	 *
	 * @dev Used in smart contracts only. Off-chain clients should use `isOperatorInRole`.
	 *
	 * @param required set of permissions (role) to check against
	 * @return true if all the permissions requested are enabled, false otherwise
	 */
	function isSenderInRole(uint256 required) public view returns (bool) {
		// delegate call to `isOperatorInRole`, passing transaction sender
		return isOperatorInRole(msg.sender, required);
	}

	/**
	 * @notice Checks if operator has all the permissions (role) required
	 *
	 * @param operator address of the user to check role for
	 * @param required set of permissions (role) to check
	 * @return true if all the permissions requested are enabled, false otherwise
	 */
	function isOperatorInRole(address operator, uint256 required) public view returns (bool) {
		// delegate call to `__hasRole`, passing operator's permissions (role)
		return __hasRole(getRole(operator), required);
	}

	/**
	 * @dev Sets the `assignedRole` role to the operator, logs both `requestedRole` and `actualRole`
	 *
	 * @dev Unsafe:
	 *      provides direct write access to `userRoles` mapping without any security checks,
	 *      doesn't verify the executor (msg.sender) permissions,
	 *      must be kept private at all times
	 *
	 * @param operator address of a user to alter permissions for,
	 *       or self address to alter global features of the smart contract
	 * @param requestedRole bitmask representing a set of permissions requested
	 *      to be enabled/disabled for a user specified, used only to be logged into event
	 * @param assignedRole bitmask representing a set of permissions to
	 *      enable/disable for a user specified, used to update the mapping and to be logged into event
	 */
	function __setRole(address operator, uint256 requestedRole, uint256 assignedRole) private {
		// assign the role to the operator
		userRoles[operator] = assignedRole;

		// fire an event
		emit RoleUpdated(operator, requestedRole, assignedRole);
	}

	/**
	 * @dev Checks if role `actual` contains all the permissions required `required`
	 *
	 * @param actual existent role
	 * @param required required role
	 * @return true if actual has required role (all permissions), false otherwise
	 */
	function __hasRole(uint256 actual, uint256 required) private pure returns (bool) {
		// check the bitmask for the role required and return the result
		return actual & required == required;
	}
}
