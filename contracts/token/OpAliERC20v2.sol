// SPDX-License-Identifier: MIT
// use non-strict version pragma to simplify contract imports in other projects
pragma solidity ^0.8.4;

import "../interfaces/bedrock/IOptimismMintableERC20.sol";
import "./AliERC20v2.sol";

/**
 * @title Artificial Liquid Intelligence ERC20 Token (with OP Stack bridge support)
 *
 * @notice OP Stack extension contract functions required by the OP Stack StandardBridge
 *
 * @dev In the context of opBNB we call this implementation also an L3 since
 *      it is bridged from the L2 ChildAliERC20v2 which is deployed to BNB chain
 *
 * @notice Read more:
 *      https://community.optimism.io/docs/developers/bridge/standard-bridge/
 *      https://github.com/bnb-chain/opbnb-bridge-tokens
 */
contract OpAliERC20v2 is IOptimismMintableERC20, ILegacyMintableERC20, AliERC20v2Base {
	/**
	 * @notice Address of the StandardBridge on this network.
	 */
	address public immutable BRIDGE;

	/**
	 * @notice Address of the corresponding version of this token on the remote chain.
	 */
	address public immutable REMOTE_TOKEN;

	/**
	 * @dev Constructs/deploys ALI instance,
	 *      assigns initial token supply to the address specified
	 *
	 * @param _bridge StandardBridge address
	 * @param _remoteToken remote (L2) token address
	 */
	constructor(address _bridge, address _remoteToken) AliERC20v2Base(address(0), 0) {
		// verify the inputs
		require(_bridge != address(0) && _remoteToken != address(0), "zero address");

		// set contract's internal state
		BRIDGE = _bridge;
		REMOTE_TOKEN = _remoteToken;

		// bridge is assumed to have mint/burn permissions by default
		updateRole(_bridge, ROLE_TOKEN_CREATOR | ROLE_TOKEN_DESTROYER);
	}

	/**
	 * @custom:legacy
	 * @notice Legacy getter for the bridge. Use BRIDGE going forward.
	 */
	function l2Bridge() public view returns (address) {
		return BRIDGE;
	}

	/**
	 * @custom:legacy
	 * @notice Legacy getter for the remote token. Use REMOTE_TOKEN going forward.
	 */
	function l1Token() public view returns (address) {
		return REMOTE_TOKEN;
	}

	/**
	 * @custom:legacy
	 * @notice Legacy getter for BRIDGE.
	 */
	function bridge() public view returns (address) {
		return BRIDGE;
	}

	/**
	 * @custom:legacy
	 * @notice Legacy getter for REMOTE_TOKEN.
	 */
	function remoteToken() public view returns (address) {
		return REMOTE_TOKEN;
	}

	/**
	 * @notice Executed by StandardBridge when token is deposited on the root chain
	 *
	 * @dev Executable only by StandardBridge which should be given the minting
	 *      permission as part of the smart contract deployment process;
	 *      handles the deposit by minting the required amount for user
	 *
	 * @param _to user address for whom deposit is being done
	 * @param _amount deposit amount
	 */
	function mint(address _to, uint256 _amount) public override(AliERC20v2Base, IOptimismMintableERC20, ILegacyMintableERC20) {
		// delegate to super
		AliERC20v2Base.mint(_to, _amount);
	}

	/**
	 * @notice Executed by StandardBridge when withdrawing tokens back to the root chain
	 *
	 * @dev Executable only by StandardBridge which should be given the burning
	 *      permission as part of the smart contract deployment process;
	 *      handles the withdrawal by burning the required amount from user
	 *
	 * @param _from user address for whom withdrawal is being done
	 * @param _amount withdrawal amount
	 */
	function burn(address _from, uint256 _amount) public override(AliERC20v2Base, IOptimismMintableERC20, ILegacyMintableERC20) {
		// delegate to super
		AliERC20v2Base.burn(_from, _amount);
	}

	/**
	 * @inheritdoc ERC165
	 */
	function supportsInterface(bytes4 interfaceId) public pure override(AliERC20v2Base, ERC165) returns (bool) {
		// reconstruct from current interface(s) and super interface(s) (if any)
		return super.supportsInterface(interfaceId)
		    || interfaceId == type(ERC165).interfaceId
		    || interfaceId == type(ILegacyMintableERC20).interfaceId
		    || interfaceId == type(IOptimismMintableERC20).interfaceId;
	}
}
