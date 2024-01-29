// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../interfaces/EIP2981Spec.sol";
import "./TinyERC721.sol";

/**
 * @title Royal ER721
 *
 * @dev Supports EIP-2981 royalties on NFT secondary sales
 *      Supports OpenSea contract metadata royalties
 *      Introduces fake "owner" to support OpenSea collections
 *
 * @author Basil Gorin
 */
abstract contract RoyalERC721 is EIP2981, TinyERC721 {
	/**
	 * @dev OpenSea expects NFTs to be "Ownable", that is having an "owner",
	 *      we introduce a fake "owner" here with no authority
	 */
	address public owner;

	/**
	 * @notice Address to receive EIP-2981 royalties from secondary sales
	 *         see https://eips.ethereum.org/EIPS/eip-2981
	 */
	address public royaltyReceiver = address(0x379e2119f6e0D6088537da82968e2a7ea178dDcF);

	/**
	 * @notice Percentage of token sale price to be used for EIP-2981 royalties from secondary sales
	 *         see https://eips.ethereum.org/EIPS/eip-2981
	 *
	 * @dev Has 2 decimal precision. E.g. a value of 500 would result in a 5% royalty fee
	 */
	uint16 public royaltyPercentage = 750; // default OpenSea value

	/**
	 * @notice Contract level metadata to define collection name, description, and royalty fees.
	 *         see https://docs.opensea.io/docs/contract-level-metadata
	 *
	 * @dev Should be set by URI manager. By default only includes royalty information
	 */
	string public contractURI = "https://gateway.pinata.cloud/ipfs/QmU92w8iKpcaabCoyHtMg7iivWGqW2gW1hgARDtqCmJUWv";

	/**
	 * @notice Royalty manager is responsible for managing the EIP2981 royalty info
	 *
	 * @dev Role ROLE_ROYALTY_MANAGER allows updating the royalty information
	 *      (executing `setRoyaltyInfo` function)
	 */
	uint32 public constant ROLE_ROYALTY_MANAGER = 0x0020_0000;

	/**
	 * @notice Owner manager is responsible for setting/updating an "owner" field
	 *
	 * @dev Role ROLE_OWNER_MANAGER allows updating the "owner" field
	 *      (executing `transferOwnership` function)
	 */
	uint32 public constant ROLE_OWNER_MANAGER = 0x0040_0000;

	/**
	 * @dev Fired in setContractURI()
	 *
	 * @param _by an address which executed update
	 * @param _value new contractURI value
	 */
	event ContractURIUpdated(address indexed _by, string _value);

	/**
	 * @dev Fired in setRoyaltyInfo()
	 *
	 * @param _by an address which executed update
	 * @param _receiver new royaltyReceiver value
	 * @param _percentage new royaltyPercentage value
	 */
	event RoyaltyInfoUpdated(
		address indexed _by,
		address indexed _receiver,
		uint16 _percentage
	);

	/**
	 * @dev Fired in transferOwnership()
	 *
	 * @param _by an address which set the new "owner"
	 * @param _oldVal previous "owner" address
	 * @param _newVal new "owner" address
	 */
	event OwnerUpdated(address indexed _by, address indexed _oldVal, address indexed _newVal);

	/**
	 * @dev Fired in transferOwnership() - OpenZeppelin Ownable compliant event
	 *
	 * @param previousOwner previous "owner" address
	 * @param newOwner new "owner" address
	 */
	event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

	/**
	 * @dev Constructs/deploys ERC721 with EIP-2981 instance with the name and symbol specified
	 *
	 * @param _name token name (ERC721Metadata)
	 * @param _symbol token symbol (ERC721Metadata)
	 */
	constructor(string memory _name, string memory _symbol) TinyERC721(_name, _symbol) {
		// initialize the "owner" as a deployer account
		owner = msg.sender;
	}

	/**
	 * @dev Restricted access function which updates the contract URI
	 *
	 * @dev Requires executor to have ROLE_URI_MANAGER permission
	 *
	 * @param _contractURI new contract URI to set
	 */
	function setContractURI(string memory _contractURI) public {
		// verify the access permission
		require(isSenderInRole(ROLE_URI_MANAGER), "access denied");

		// update the contract URI
		contractURI = _contractURI;

		// emit an event
		emit ContractURIUpdated(msg.sender, _contractURI);
	}

	/**
	 * @notice EIP-2981 function to calculate royalties for sales in secondary marketplaces.
	 *         see https://eips.ethereum.org/EIPS/eip-2981
	 *
	 * @inheritdoc EIP2981
	 */
	function royaltyInfo(
		uint256,
		uint256 _salePrice
	) public view override returns (
		address receiver,
		uint256 royaltyAmount
	) {
		// simply calculate the values and return the result
		return (royaltyReceiver, _salePrice * royaltyPercentage / 100_00);
	}

	/**
	 * @dev Restricted access function which updates the royalty info
	 *
	 * @dev Requires executor to have ROLE_ROYALTY_MANAGER permission
	 *
	 * @param _royaltyReceiver new royalty receiver to set
	 * @param _royaltyPercentage new royalty percentage to set
	 */
	function setRoyaltyInfo(address _royaltyReceiver, uint16 _royaltyPercentage) public {
		// verify the access permission
		require(isSenderInRole(ROLE_ROYALTY_MANAGER), "access denied");

		// verify royalty percentage is zero if receiver is also zero
		require(_royaltyReceiver != address(0) || _royaltyPercentage == 0, "invalid receiver");
		// verify royalty percentage doesn't exceed 100%
		require(_royaltyPercentage <= 100_00, "royalty percentage exceeds 100%");

		// update the values
		royaltyReceiver = _royaltyReceiver;
		royaltyPercentage = _royaltyPercentage;

		// emit an event
		emit RoyaltyInfoUpdated(msg.sender, _royaltyReceiver, _royaltyPercentage);
	}

	/**
	 * @notice Checks if the address supplied is an "owner" of the smart contract
	 *      Note: an "owner" doesn't have any authority on the smart contract and is "nominal"
	 *
	 * @return true if the caller is the current owner.
	 */
	function isOwner(address _addr) public view returns(bool) {
		// just evaluate and return the result
		return _addr == owner;
	}

	/**
	 * @dev Restricted access function to set smart contract "owner"
	 *      Note: an "owner" set doesn't have any authority, and cannot even update "owner"
	 *
	 * @dev Requires executor to have ROLE_OWNER_MANAGER permission
	 *
	 * @param _owner new "owner" of the smart contract
	 */
	function transferOwnership(address _owner) public {
		// verify the access permission
		require(isSenderInRole(ROLE_OWNER_MANAGER), "access denied");

		// emit an event first - to log both old and new values
		emit OwnerUpdated(msg.sender, owner, _owner);

		// emit zeppelin ownable-compliant ownership transfer event
		emit OwnershipTransferred(owner, _owner);

		// update "owner"
		owner = _owner;
	}

	/**
	 * @inheritdoc ERC165
	 */
	function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165, TinyERC721) returns (bool) {
		// construct the interface support from EIP-2981 and super interfaces
		return interfaceId == type(EIP2981).interfaceId || super.supportsInterface(interfaceId);
	}
}
