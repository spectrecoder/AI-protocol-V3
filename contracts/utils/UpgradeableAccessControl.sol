// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "./InitializableAccessControl.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title Upgradeable Role-based Access Control (RBAC) // ERC1967Proxy
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
 * @dev This is an upgradeable version of the ACL, based on Zeppelin implementation for ERC1967,
 *      see https://docs.openzeppelin.com/contracts/4.x/upgradeable
 *      see https://docs.openzeppelin.com/contracts/4.x/api/proxy#UUPSUpgradeable
 *      see https://forum.openzeppelin.com/t/uups-proxies-tutorial-solidity-javascript/7786
 */
abstract contract UpgradeableAccessControl is InitializableAccessControl, UUPSUpgradeable {
	/**
	 * @dev Creates/deploys the ACL implementation to be used in a proxy
	 *
	 * @dev Note:
	 *      the implementation is already initialized and
	 *      `_postConstruct` is not executable on the implementation
	 *      `_postConstruct` is still available in the context of a proxy
	 *      and should be executed on the proxy deployment (in the same tx)
	 */
	constructor() initializer {}

	/**
	 * @notice Returns an address of the implementation smart contract,
	 *      see ERC1967Upgrade._getImplementation()
	 *
	 * @return the current implementation address
	 */
	function getImplementation() public view virtual returns (address) {
		// delegate to `ERC1967Upgrade._getImplementation()`
		return _getImplementation();
	}

	/**
	 * @inheritdoc UUPSUpgradeable
	 */
	function _authorizeUpgrade(address) internal virtual override {
		// caller must have a permission to upgrade the contract
		require(isSenderInRole(ROLE_UPGRADE_MANAGER), "access denied");
	}
}
