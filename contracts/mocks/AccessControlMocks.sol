// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../utils/AccessControl.sol";
import "../utils/UpgradeableAccessControl.sol";

/**
 * @title Access Control Mock
 *
 * @notice Used to test the AccessControl core functionality
 *
 * @author Basil Gorin
 */
// Used in AccessControl tests to check if `isSenderInRole` works through the `restrictedTo` modifier
contract AccessControlMock is AccessControl {
	uint32 public constant RESTRICTED_ROLE = 1;
	event Restricted();
	constructor(address _owner) AccessControl(_owner){}
	function restricted() public restrictedTo(RESTRICTED_ROLE) {
		emit Restricted();
	}
}

/**
 * @title Upgradeable Access Control Mock
 *
 * @notice Used to test the UpgradeableAccessControl core functionality
 *
 * @author Basil Gorin
 */
contract UpgradeableAccessControl1 is UpgradeableAccessControl {
	// v1 identifier
	string public v1;

	/**
	 * @dev UUPS initializer, sets the contract owner to have full privileges
	 *
	 * param _owner smart contract owner having full privileges
	 */
	function postConstruct() public virtual initializer {
		// execute parent initializer
		_postConstruct(msg.sender);

		// self init
		v1 = "v1";
	}
}

/**
 * @title Upgradeable Access Control Mock 2
 *
 * @notice Used to test the UpgradeableAccessControl core functionality
 *
 * @author Basil Gorin
 */
contract UpgradeableAccessControl2 is UpgradeableAccessControl {
	// v2 identifier
	string public v2;

	/**
	 * @dev UUPS initializer, sets the contract owner to have full privileges
	 *
	 * param _owner smart contract owner having full privileges
	 */
	function postConstruct() public virtual initializer {
		// execute parent initializer
		_postConstruct(msg.sender);

		// self init
		v2 = "v2";
	}
}
