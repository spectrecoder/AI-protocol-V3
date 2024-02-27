// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../interfaces/ERC721Spec.sol";
import "../interfaces/ERC721SpecExt.sol";
import "../lib/AddressUtils.sol";
import "../lib/StringUtils.sol";
import "../lib/ECDSA.sol";
import "../utils/AccessControl.sol";

/**
 * @title Short ERC721
 *
 * @notice Short ERC721 defines an NFT with short (up to 96 bits) ID space.
 *      ERC721 enumeration support requires additional writes to the storage:
 *      - when transferring a token in order to update the NFT collections of
 *        the previous and next owners,
 *      - when minting/burning a token in order to update global NFT collection
 *
 * @notice Reducing the NFT ID space to 96 bits allows to eliminate the need to have
 *      and to write to one of the additional storage mappings
 *
 * @notice Short NFT ID (up to 96 bits) is concatenated in storage with owner address
 *      (160 bits) resulting in a whole 256 bits slot occupied, and eliminating
 *      the need to store NFT index within owner collection in a separate storage slot.
 *
 * @notice This smart contract is designed to be inherited by concrete implementations,
 *      which are expected to define token metadata, auxiliary functions to access the metadata,
 *      and explicitly define token minting interface, which should be built on top
 *      of current smart contract internal interface
 *
 * @notice Fully ERC721-compatible with all optional interfaces implemented (metadata, enumeration),
 *      see https://eips.ethereum.org/EIPS/eip-721
 *
 * @notice Note: current implementation doesn't support token burning. Burning doesn't come for free
 *      and requires additional mapping maintenance which is written to in both `mint` and `burn` functions.
 *      See {BurnableShortERC721} for burning support
 *
 * @dev Reducing the NFT ID space to 64 bits would allow to optimize batch minting by more tight
 *      packing of the arrays storing NFT IDs (`allTokens` and owners' `collections`)
 *
 * @dev Reducing the NFT ID space to 48 bits would allow to get "free" burn support for enumerable ERC721
 *      by eliminating the need to maintain `tokenIndexes` mapping (see {BurnableShortERC721})
 *
 * @dev ERC721: contract has passed adopted OpenZeppelin ERC721 tests
 *        https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/test/token/ERC721/ERC721.behavior.js
 *        https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/test/token/ERC721/extensions/ERC721URIStorage.test.js
 *
 * @dev A note on token URI: there are major differences on how token URI behaves comparing to Zeppelin impl:
 *      1. A token URI can be set for non-existing token for pre-allocation purposes,
 *         still the URI will be deleted once token is burnt
 *      2. If token URI is set, base URI has no affect on the token URI, the two are not concatenated,
 *         base URI is used to construct the token URI only if the latter was not explicitly set
 *
 * @dev Supports EIP-712 powered permits - permit() - approve() with signature.
 *      Supports EIP-712 powered operator permits - permitForAll() - setApprovalForAll() with signature.
 *
 * @dev EIP712 Domain:
 *      name: AliERC721v1
 *      version: not in use, omitted (name already contains version)
 *      chainId: EIP-155 chain id
 *      verifyingContract: deployed contract address
 *      salt: permitNonces[owner], where owner is an address which allows operation on their tokens
 *
 * @dev Permit type:
 *      owner: address
 *      operator: address
 *      tokenId: uint256
 *      nonce: uint256
 *      deadline: uint256
 *
 * @dev Permit typeHash:
 *        keccak256("Permit(address owner,address operator,uint256 tokenId,uint256 nonce,uint256 deadline)")
 *
 * @dev PermitForAll type:
 *      owner: address
 *      operator: address
 *      approved: bool
 *      nonce: uint256
 *      deadline: uint256
 *
 * @dev PermitForAll typeHash:
 *        keccak256("PermitForAll(address owner,address operator,bool approved,uint256 nonce,uint256 deadline)")
 *
 * @dev See https://eips.ethereum.org/EIPS/eip-712
 * @dev See usage examples in tests: erc721_permits.js
 */
abstract contract ShortERC721 is ERC721Enumerable, ERC721Metadata, WithBaseURI, MintableERC721, AccessControl {
	/**
	 * @dev Smart contract unique identifier, a random number
	 *
	 * @dev Should be regenerated each time smart contact source code is changed
	 *      and changes smart contract itself is to be redeployed
	 *
	 * @dev Generated using https://www.random.org/bytes/
	 * @dev Example value: 0xdbdd2b4ff38a8516da0b8e7ae93288b5e2fed0c92fb051cee90ccf4e4ec9736e
	 */
	function TOKEN_UID() external view virtual returns(uint256);

	/**
	 * @notice ERC-20 compatible descriptive name for a collection of NFTs in this contract
	 *
	 * @inheritdoc ERC721Metadata
	 */
	string public override name;

	/**
	 * @notice ERC-20 compatible abbreviated name for a collection of NFTs in this contract
	 *
	 * @inheritdoc ERC721Metadata
	 */
	string public override symbol;

	/**
	 * @notice Current implementation includes a function `decimals` that returns uint8(0)
	 *      to be more compatible with ERC-20
	 *
	 * @dev ERC20 compliant token decimals is equal to zero since ERC721 token is non-fungible
	 *      and therefore non-divisible
	 */
	uint8 public constant decimals = 0;

	/**
	 * @notice Ownership information for all the tokens in existence
	 *
	 * @dev Maps `Token ID => Token ID Index | Token Owner Address`, where
	 *      - Token ID Index denotes Token ID index in the array of all the tokens owned by the owner,
	 *      - Token ID Index is 96 bits long and is stored in high 96 bits of the mapping value,
	 *      - `|` denotes bitwise concatenation of the
	 *        96 bits long Token ID Index and 160 bits long Token Owner Address
	 * @dev Token Owner Address for a given Token ID is lower 160 bits of the mapping value
	 */
	mapping(uint256 => uint256) internal tokens;

	/**
	 * @notice Enumerated collections of the tokens owned by particular owners
	 *
	 * @dev We call these collections "Local" token collections
	 *
	 * @dev Maps `Token Owner Address => Owned Token IDs Array`
	 *
	 * @dev Token owner balance is the length of their token collection:
	 *      `balanceOf(owner) = collections[owner].length`
	 */
	mapping(address => uint96[]) internal collections;

	/**
	 * @notice An array of all the tokens in existence
	 *
	 * @dev We call this collection "Global" token collection
	 *
	 * @dev Array with all Token IDs, used for enumeration
	 *
	 * @dev Total token supply `tokenSupply` is the length of this collection:
	 *      `totalSupply() = allTokens.length`
	 */
	uint96[] internal allTokens;

	/**
	 * @notice Addresses approved by token owners to transfer their tokens
	 *
	 * @dev `Maps Token ID => Approved Address`, where
	 *      Approved Address is an address allowed transfer ownership for the token
	 *      defined by Token ID
	 */
	mapping(uint256 => address) internal approvals;

	/**
	 * @notice Addresses approved by token owners to transfer all their tokens
	 *
	 * @dev Maps `Token Owner Address => Operator Address => Approval State` - true/false (approved/not), where
	 *      - Token Owner Address is any address which may own tokens or not,
	 *      - Operator Address is any other address which may own tokens or not,
	 *      - Approval State is a flag indicating if Operator Address is allowed to
	 *        transfer tokens owned by Token Owner Address o their behalf
	 */
	mapping(address => mapping(address => bool)) internal approvedOperators;

	/**
	 * @dev A record of nonces for signing/validating signatures in EIP-712 based
	 *      `permit` and `permitForAll` functions
	 *
	 * @dev Each time the nonce is used, it is increased by one, meaning reordering
	 *      of the EIP-712 transactions is not possible
	 *
	 * @dev Inspired by EIP-2612 extension for ERC20 token standard
	 *
	 * @dev Maps token owner address => token owner nonce
	 */
	mapping(address => uint256) public permitNonces;

	/**
	 * @dev Base URI is used to construct ERC721Metadata.tokenURI as
	 *      `base URI + token ID` if token URI is not set (not present in `_tokenURIs` mapping)
	 *
	 * @dev For example, if base URI is https://api.com/token/, then token #1
	 *      will have an URI https://api.com/token/1
	 *
	 * @dev If token URI is set with `setTokenURI()` it will be returned as is via `tokenURI()`
	 */
	string public override baseURI = "";

	/**
	 * @dev Optional mapping for token URIs to be returned as is when `tokenURI()`
	 *      is called; if mapping doesn't exist for token, the URI is constructed
	 *      as `base URI + token ID`, where plus (+) denotes string concatenation
	 */
	mapping(uint256 => string) internal _tokenURIs;

	/**
	 * @notice Enables ERC721 transfers of the tokens
	 *      (transfer by the token owner himself)
	 * @dev Feature FEATURE_TRANSFERS must be enabled in order for
	 *      `transferFrom()` function to succeed when executed by token owner
	 */
	uint32 public constant FEATURE_TRANSFERS = 0x0000_0001;

	/**
	 * @notice Enables ERC721 transfers on behalf
	 *      (transfer by someone else on behalf of token owner)
	 * @dev Feature FEATURE_TRANSFERS_ON_BEHALF must be enabled in order for
	 *      `transferFrom()` function to succeed whe executed by approved operator
	 * @dev Token owner must call `approve()` or `setApprovalForAll()`
	 *      first to authorize the transfer on behalf
	 */
	uint32 public constant FEATURE_TRANSFERS_ON_BEHALF = 0x0000_0002;

	/**
	 * @notice Enables token owners to burn their own tokens
	 *
	 * @dev Feature FEATURE_OWN_BURNS must be enabled in order for
	 *      `burn()` function to succeed when called by token owner
	 */
	uint32 public constant FEATURE_OWN_BURNS = 0x0000_0008;

	/**
	 * @notice Enables approved operators to burn tokens on behalf of their owners
	 *
	 * @dev Feature FEATURE_BURNS_ON_BEHALF must be enabled in order for
	 *      `burn()` function to succeed when called by approved operator
	 */
	uint32 public constant FEATURE_BURNS_ON_BEHALF = 0x0000_0010;

	/**
	 * @notice Enables approvals on behalf (permits via an EIP712 signature)
	 * @dev Feature FEATURE_PERMITS must be enabled in order for
	 *      `permit()` function to succeed
	 */
	uint32 public constant FEATURE_PERMITS = 0x0000_0200;

	/**
	 * @notice Enables operator approvals on behalf (permits for all via an EIP712 signature)
	 * @dev Feature FEATURE_OPERATOR_PERMITS must be enabled in order for
	 *      `permitForAll()` function to succeed
	 */
	uint32 public constant FEATURE_OPERATOR_PERMITS = 0x0000_0400;

	/**
	 * @notice Token creator is responsible for creating (minting)
	 *      tokens to an arbitrary address
	 * @dev Role ROLE_TOKEN_CREATOR allows minting tokens
	 *      (calling `mint` function)
	 */
	uint32 public constant ROLE_TOKEN_CREATOR = 0x0001_0000;

	/**
	 * @notice Token destroyer is responsible for destroying (burning)
	 *      tokens owned by an arbitrary address
	 * @dev Role ROLE_TOKEN_DESTROYER allows burning tokens
	 *      (calling `burn` function)
	 */
	uint32 public constant ROLE_TOKEN_DESTROYER = 0x0002_0000;

	/**
	 * @notice URI manager is responsible for managing base URI
	 *      part of the token URI ERC721Metadata interface
	 *
	 * @dev Role ROLE_URI_MANAGER allows updating the base URI
	 *      (executing `setBaseURI` function)
	 */
	uint32 public constant ROLE_URI_MANAGER = 0x0010_0000;

	/**
	 * @notice EIP-712 contract's domain typeHash,
	 *      see https://eips.ethereum.org/EIPS/eip-712#rationale-for-typehash
	 *
	 * @dev Note: we do not include version into the domain typehash/separator,
	 *      it is implied version is concatenated to the name field, like "AliERC721v1"
	 */
	// keccak256("EIP712Domain(string name,uint256 chainId,address verifyingContract)")
	bytes32 public constant DOMAIN_TYPEHASH = 0x8cad95687ba82c2ce50e74f7b754645e5117c3a5bec8151c0726d5857980a866;

	/**
	 * @notice EIP-712 contract's domain separator,
	 *      see https://eips.ethereum.org/EIPS/eip-712#definition-of-domainseparator
	 *      note: we specify contract version in its name
	 */
	function DOMAIN_SEPARATOR() public view returns(bytes32) {
		// build the EIP-712 contract domain separator, see https://eips.ethereum.org/EIPS/eip-712#definition-of-domainseparator
		// note: we specify contract version in its name
		return keccak256(abi.encode(DOMAIN_TYPEHASH, keccak256(bytes("AliERC721v1")), block.chainid, address(this)));
	}

	/**
	 * @notice EIP-712 permit (EIP-2612) struct typeHash,
	 *      see https://eips.ethereum.org/EIPS/eip-712#rationale-for-typehash
	 */
	// keccak256("Permit(address owner,address operator,uint256 tokenId,uint256 nonce,uint256 deadline)")
	bytes32 public constant PERMIT_TYPEHASH = 0xee2282d7affd5a432b221a559e429129347b0c19a3f102179a5fb1859eef3d29;

	/**
	 * @notice EIP-712 permitForAll (EIP-2612) struct typeHash,
	 *      see https://eips.ethereum.org/EIPS/eip-712#rationale-for-typehash
	 */
	// keccak256("PermitForAll(address owner,address operator,bool approved,uint256 nonce,uint256 deadline)")
	bytes32 public constant PERMIT_FOR_ALL_TYPEHASH = 0x47ab88482c90e4bb94b82a947ae78fa91fb25de1469ab491f4c15b9a0a2677ee;

	/**
	 * @dev Fired in setBaseURI()
	 *
	 * @param _by an address which executed update
	 * @param _oldVal old _baseURI value
	 * @param _newVal new _baseURI value
	 */
	event BaseURIUpdated(address indexed _by, string _oldVal, string _newVal);

	/**
	 * @dev Fired in setTokenURI()
	 *
	 * @param _by an address which executed update
	 * @param _tokenId token ID which URI was updated
	 * @param _oldVal old _baseURI value
	 * @param _newVal new _baseURI value
	 */
	event TokenURIUpdated(address indexed _by, uint256 _tokenId, string _oldVal, string _newVal);

	/**
	 * @dev Constructs/deploys ERC721 instance with the name and symbol specified
	 *
	 * @param _name name of the token to be accessible as `name()`,
	 *      ERC-20 compatible descriptive name for a collection of NFTs in this contract
	 * @param _symbol token symbol to be accessible as `symbol()`,
	 *      ERC-20 compatible descriptive name for a collection of NFTs in this contract
	 */
	constructor(string memory _name, string memory _symbol) {
		// set the name
		name = _name;

		// set the symbol
		symbol = _symbol;
	}

	/**
	 * @dev Verifies if token is transferable (i.e. can change ownership, allowed to be transferred);
	 *      The default behaviour is to always allow transfer if token exists
	 *
	 * @dev Implementations may modify the default behaviour based on token metadata
	 *      if required
	 *
	 * @param _tokenId ID of the token to check if it's transferable
	 * @return true if token is transferable, false otherwise
	 */
	function isTransferable(uint256 _tokenId) public view virtual returns(bool) {
		// validate token existence
		require(exists(_tokenId), "token doesn't exist");

		// generic implementation returns true if token exists
		return true;
	}

	/**
	 * @notice Checks if specified token exists
	 *
	 * @dev Returns whether the specified token ID has an ownership
	 *      information associated with it
	 *
	 * @inheritdoc MintableERC721
	 *
	 * @param _tokenId ID of the token to query existence for
	 * @return whether the token exists (true - exists, false - doesn't exist)
	 */
	function exists(uint256 _tokenId) public override view returns(bool) {
		// read ownership information and return a check if it's not zero (set)
		return tokens[_tokenId] != 0;
	}

	/**
	 * @inheritdoc ERC165
	 */
	function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
		// construct the interface support from required and optional ERC721 interfaces
		return interfaceId == type(ERC165).interfaceId
			|| interfaceId == type(ERC721).interfaceId
			|| interfaceId == type(ERC721Metadata).interfaceId
			|| interfaceId == type(ERC721Enumerable).interfaceId
			|| interfaceId == type(MintableERC721).interfaceId;
	}

	// ===== Start: ERC721 Metadata =====

	/**
	 * @dev Restricted access function which updates base URI used to construct
	 *      ERC721Metadata.tokenURI
	 *
	 * @dev Requires executor to have ROLE_URI_MANAGER permission
	 *
	 * @param _baseURI new base URI to set
	 */
	function setBaseURI(string memory _baseURI) public virtual {
		// verify the access permission
		require(isSenderInRole(ROLE_URI_MANAGER), "access denied");

		// emit an event first - to log both old and new values
		emit BaseURIUpdated(msg.sender, baseURI, _baseURI);

		// and update base URI
		baseURI = _baseURI;
	}

	/**
	 * @dev Returns token URI if it was previously set with `setTokenURI`,
	 *      otherwise constructs it as base URI + token ID
	 *
	 * @inheritdoc ERC721Metadata
	 */
	function tokenURI(uint256 _tokenId) public view override returns (string memory) {
		// verify token exists
		require(exists(_tokenId), "token doesn't exist");

		// read the token URI for the token specified
		string memory _tokenURI = _tokenURIs[_tokenId];

		// if token URI is set
		if(bytes(_tokenURI).length > 0) {
			// just return it
			return _tokenURI;
		}

		// if base URI is not set
		if(bytes(baseURI).length == 0) {
			// return an empty string
			return "";
		}

		// otherwise concatenate base URI + token ID
		return StringUtils.concat(baseURI, StringUtils.itoa(_tokenId, 10));
	}

	/**
	 * @dev Sets the token URI for the token defined by its ID
	 *
	 * @param _tokenId an ID of the token to set URI for
	 * @param _tokenURI token URI to set
	 */
	function setTokenURI(uint256 _tokenId, string memory _tokenURI) public virtual {
		// verify the access permission
		require(isSenderInRole(ROLE_URI_MANAGER), "access denied");

		// we do not verify token existence: we want to be able to
		// preallocate token URIs before tokens are actually minted

		// emit an event first - to log both old and new values
		emit TokenURIUpdated(msg.sender, _tokenId, _tokenURIs[_tokenId], _tokenURI);

		// and update token URI
		_tokenURIs[_tokenId] = _tokenURI;
	}

	// ===== End: ERC721 Metadata =====

	// ===== Start: ERC721, ERC721Enumerable Getters (view functions) =====

	/**
	 * @inheritdoc ERC721
	 */
	function balanceOf(address _owner) public view override returns (uint256) {
		// check `_owner` address is set
		require(_owner != address(0), "zero address");

		// derive owner balance for the their owned tokens collection
		// as the length of that collection
		return collections[_owner].length;
	}

	/**
	 * @inheritdoc ERC721
	 */
	function ownerOf(uint256 _tokenId) public view override returns (address) {
		// derive ownership information of the token from the ownership mapping
		// by extracting lower 160 bits of the mapping value as an address
		address owner = address(uint160(tokens[_tokenId]));

		// verify owner/token exists
		require(owner != address(0), "token doesn't exist");

		// return owner address
		return owner;
	}

	/**
	 * @inheritdoc ERC721Enumerable
	 */
	function totalSupply() public view override returns (uint256) {
		// derive total supply value from the array of all existing tokens
		// as the length of this array
		return allTokens.length;
	}

	/**
	 * @inheritdoc ERC721Enumerable
	 */
	function tokenByIndex(uint256 _index) public view override returns (uint256) {
		// index out of bounds check
		require(_index < totalSupply(), "index out of bounds");

		// find the token ID requested and return
		return allTokens[_index];
	}

	/**
	 * @inheritdoc ERC721Enumerable
	 */
	function tokenOfOwnerByIndex(address _owner, uint256 _index) public view override returns (uint256) {
		// index out of bounds check
		require(_index < balanceOf(_owner), "index out of bounds");

		// find the token ID requested and return
		return collections[_owner][_index];
	}

	/**
	 * @inheritdoc ERC721
	 */
	function getApproved(uint256 _tokenId) public view override returns (address) {
		// verify token specified exists
		require(exists(_tokenId), "token doesn't exist");

		// read the approval value and return
		return approvals[_tokenId];
	}

	/**
	 * @inheritdoc ERC721
	 */
	function isApprovedForAll(address _owner, address _operator) public view override returns (bool) {
		// read the approval state value and return
		return approvedOperators[_owner][_operator];
	}

	// ===== End: ERC721, ERC721Enumerable Getters (view functions) =====

	// ===== Start: ERC721 mutative functions (transfers, approvals) =====

	/**
	 * @inheritdoc ERC721
	 */
	function safeTransferFrom(address _from, address _to, uint256 _tokenId, bytes memory _data) public override {
		// delegate call to unsafe transfer on behalf `transferFrom()`
		transferFrom(_from, _to, _tokenId);

		// if receiver `_to` is a smart contract
		if(AddressUtils.isContract(_to)) {
			// check it supports ERC721 interface - execute onERC721Received()
			bytes4 response = ERC721TokenReceiver(_to).onERC721Received(msg.sender, _from, _tokenId, _data);

			// expected response is ERC721TokenReceiver(_to).onERC721Received.selector
			// bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))
			require(response == ERC721TokenReceiver(_to).onERC721Received.selector, "invalid onERC721Received response");
		}
	}

	/**
	 * @inheritdoc ERC721
	 */
	function safeTransferFrom(address _from, address _to, uint256 _tokenId) public override {
		// delegate call to overloaded `safeTransferFrom()`, set data to ""
		safeTransferFrom(_from, _to, _tokenId, "");
	}

	/**
	 * @inheritdoc ERC721
	 */
	function transferFrom(address _from, address _to, uint256 _tokenId) public override {
		// if `_from` is equal to sender, require transfers feature to be enabled
		// otherwise require transfers on behalf feature to be enabled
		require(_from == msg.sender && isFeatureEnabled(FEATURE_TRANSFERS)
		     || _from != msg.sender && isFeatureEnabled(FEATURE_TRANSFERS_ON_BEHALF),
		        _from == msg.sender? "transfers are disabled": "transfers on behalf are disabled");

		// validate destination address is set
		require(_to != address(0), "zero address");

		// validate token ownership, which also
		// validates token existence under the hood
		require(_from == ownerOf(_tokenId), "access denied");

		// verify operator (transaction sender) is either token owner,
		// or is approved by the token owner to transfer this particular token,
		// or is approved by the token owner to transfer any of his tokens
		require(_from == msg.sender || msg.sender == getApproved(_tokenId) || isApprovedForAll(_from, msg.sender), "access denied");

		// transfer is not allowed for a locked token
		require(isTransferable(_tokenId), "locked token");

		// if required, move token ownership,
		// update old and new owner's token collections accordingly:
		if(_from != _to) {
			// remove token from old owner's collection (also clears approval)
			__removeLocal(_tokenId);
			// add token to the new owner's collection
			__addLocal(_tokenId, _to);
		}
		// even if no real changes are required, approval needs to be erased
		else {
			// clear token approval (also emits an Approval event)
			__clearApproval(_from, _tokenId);
		}

		// fire ERC721 transfer event
		emit Transfer(_from, _to, _tokenId);
	}

	/**
	 * @inheritdoc ERC721
	 */
	function approve(address _approved, uint256 _tokenId) public override {
		// make an internal approve - delegate to `__approve`
		__approve(msg.sender, _approved, _tokenId);
	}

	/**
	 * @dev Powers the meta transaction for `approve` - EIP-712 signed `permit`
	 *
	 * @dev Approves address called `_operator` to transfer token `_tokenId`
	 *      on behalf of the `_owner`
	 *
	 * @dev Zero `_operator` address indicates there is no approved address,
	 *      and effectively removes an approval for the token specified
	 *
	 * @dev `_owner` must own token `_tokenId` to grant the permission
	 * @dev Throws if `_operator` is a self address (`_owner`),
	 *      or if `_tokenId` doesn't exist
	 *
	 * @param _owner owner of the token `_tokenId` to set approval on behalf of
	 * @param _operator an address approved by the token owner
	 *      to spend token `_tokenId` on its behalf
	 * @param _tokenId token ID operator `_approved` is allowed to
	 *      transfer on behalf of the token owner
	 */
	function __approve(address _owner, address _operator, uint256 _tokenId) private {
		// get token owner address
		address owner = ownerOf(_tokenId);

		// approving owner address itself doesn't make sense and is not allowed
		require(_operator != owner, "self approval");

		// only token owner or/and approved operator can set the approval
		require(_owner == owner || isApprovedForAll(owner, _owner), "access denied");

		// update the approval
		approvals[_tokenId] = _operator;

		// emit an event
		emit Approval(owner, _operator, _tokenId);
	}

	/**
	 * @inheritdoc ERC721
	 */
	function setApprovalForAll(address _operator, bool _approved) public override {
		// make an internal approve - delegate to `__approveForAll`
		__approveForAll(msg.sender, _operator, _approved);
	}

	/**
	 * @dev Powers the meta transaction for `setApprovalForAll` - EIP-712 signed `permitForAll`
	 *
	 * @dev Approves address called `_operator` to transfer any tokens
	 *      on behalf of the `_owner`
	 *
	 * @dev `_owner` must not necessarily own any tokens to grant the permission
	 * @dev Throws if `_operator` is a self address (`_owner`)
	 *
	 * @param _owner owner of the tokens to set approval on behalf of
	 * @param _operator an address to add to the set of authorized operators, i.e.
	 *      an address approved by the token owner to spend tokens on its behalf
	 * @param _approved true if the operator is approved, false to revoke approval
	 */
	function __approveForAll(address _owner, address _operator, bool _approved) private {
		// approving tx sender address itself doesn't make sense and is not allowed
		require(_operator != _owner, "self approval");

		// update the approval
		approvedOperators[_owner][_operator] = _approved;

		// emit an event
		emit ApprovalForAll(_owner, _operator, _approved);
	}

	/**
	 * @dev Clears approval for a given token owned by a given owner,
	 *      emits an Approval event
	 *
	 * @dev Unsafe: doesn't check the validity of inputs (must be kept private),
	 *      assuming the check is done by the caller
	 *      - token existence
	 *      - token ownership
	 *
	 * @param _owner token owner to be logged into Approved event as is
	 * @param _tokenId token ID to erase approval for and to log into Approved event as is
	 */
	function __clearApproval(address _owner, uint256 _tokenId) internal {
		// clear token approval
		delete approvals[_tokenId];
		// emit an ERC721 Approval event:
		// "When a Transfer event emits, this also indicates that the approved
		// address for that NFT (if any) is reset to none."
		emit Approval(_owner, address(0), _tokenId);
	}

	// ===== End: ERC721 mutative functions (transfers, approvals) =====

	// ===== Start: Meta-transactions Support =====

	/**
	 * @notice Change or reaffirm the approved address for an NFT on behalf
	 *
	 * @dev Executes approve(_operator, _tokenId) on behalf of the token owner
	 *      who EIP-712 signed the transaction, i.e. as if transaction sender is the EIP712 signer
	 *
	 * @dev Sets the `_tokenId` as the allowance of `_operator` over `_owner` token,
	 *      given `_owner` EIP-712 signed approval
	 *
	 * @dev Emits `Approval` event in the same way as `approve` does
	 *
	 * @dev Requires:
	 *     - `_operator` to be non-zero address
	 *     - `_exp` to be a timestamp in the future
	 *     - `v`, `r` and `s` to be a valid `secp256k1` signature from `_owner`
	 *        over the EIP712-formatted function arguments.
	 *     - the signature to use `_owner` current nonce (see `permitNonces`).
	 *
	 * @dev For more information on the signature format, see the
	 *      https://eips.ethereum.org/EIPS/eip-2612#specification
	 *
	 * @param _owner owner of the token to set approval on behalf of,
	 *      an address which signed the EIP-712 message
	 * @param _operator new approved NFT controller
	 * @param _tokenId token ID to approve
	 * @param _exp signature expiration time (unix timestamp)
	 * @param v the recovery byte of the signature
	 * @param r half of the ECDSA signature pair
	 * @param s half of the ECDSA signature pair
	 */
	function permit(address _owner, address _operator, uint256 _tokenId, uint256 _exp, uint8 v, bytes32 r, bytes32 s) public {
		// verify permits are enabled
		require(isFeatureEnabled(FEATURE_PERMITS), "permits are disabled");

		// derive signer of the EIP712 Permit message, and
		// update the nonce for that particular signer to avoid replay attack!!! ----------->>> ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
		address signer = __deriveSigner(abi.encode(PERMIT_TYPEHASH, _owner, _operator, _tokenId, permitNonces[_owner]++, _exp), v, r, s);

		// perform message integrity and security validations
		require(signer == _owner, "invalid signature");
		require(block.timestamp < _exp, "signature expired");

		// delegate call to `__approve` - execute the logic required
		__approve(_owner, _operator, _tokenId);
	}

	/**
	 * @notice Enable or disable approval for a third party ("operator") to manage
	 *      all of owner's assets - on behalf
	 *
	 * @dev Executes setApprovalForAll(_operator, _approved) on behalf of the owner
	 *      who EIP-712 signed the transaction, i.e. as if transaction sender is the EIP712 signer
	 *
	 * @dev Sets the `_operator` as the token operator for `_owner` tokens,
	 *      given `_owner` EIP-712 signed approval
	 *
	 * @dev Emits `ApprovalForAll` event in the same way as `setApprovalForAll` does
	 *
	 * @dev Requires:
	 *     - `_operator` to be non-zero address
	 *     - `_exp` to be a timestamp in the future
	 *     - `v`, `r` and `s` to be a valid `secp256k1` signature from `_owner`
	 *        over the EIP712-formatted function arguments.
	 *     - the signature to use `_owner` current nonce (see `permitNonces`).
	 *
	 * @dev For more information on the signature format, see the
	 *      https://eips.ethereum.org/EIPS/eip-2612#specification
	 *
	 * @param _owner owner of the tokens to set approval on behalf of,
	 *      an address which signed the EIP-712 message
	 * @param _operator an address to add to the set of authorized operators, i.e.
	 *      an address approved by the token owner to spend tokens on its behalf
	 * @param _approved true if the operator is approved, false to revoke approval
	 * @param _exp signature expiration time (unix timestamp)
	 * @param v the recovery byte of the signature
	 * @param r half of the ECDSA signature pair
	 * @param s half of the ECDSA signature pair
	 */
	function permitForAll(address _owner, address _operator, bool _approved, uint256 _exp, uint8 v, bytes32 r, bytes32 s) public {
		// verify permits are enabled
		require(isFeatureEnabled(FEATURE_OPERATOR_PERMITS), "operator permits are disabled");

		// derive signer of the EIP712 PermitForAll message, and
		// update the nonce for that particular signer to avoid replay attack!!! --------------------->>> ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
		address signer = __deriveSigner(abi.encode(PERMIT_FOR_ALL_TYPEHASH, _owner, _operator, _approved, permitNonces[_owner]++, _exp), v, r, s);

		// perform message integrity and security validations
		require(signer == _owner, "invalid signature");
		require(block.timestamp < _exp, "signature expired");

		// delegate call to `__approve` - execute the logic required
		__approveForAll(_owner, _operator, _approved);
	}

	/**
	 * @dev Auxiliary function to verify structured EIP712 message signature and derive its signer
	 *
	 * @param abiEncodedTypehash abi.encode of the message typehash together with all its parameters
	 * @param v the recovery byte of the signature
	 * @param r half of the ECDSA signature pair
	 * @param s half of the ECDSA signature pair
	 */
	function __deriveSigner(bytes memory abiEncodedTypehash, uint8 v, bytes32 r, bytes32 s) private view returns(address) {
		// build the EIP-712 hashStruct of the message
		bytes32 hashStruct = keccak256(abiEncodedTypehash);

		// calculate the EIP-712 digest "\x19\x01" ‖ domainSeparator ‖ hashStruct(message)
		bytes32 digest = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR(), hashStruct));

		// recover the address which signed the message with v, r, s
		address signer = ECDSA.recover(digest, v, r, s);

		// check if the signer address isn't invalid
		// according to EIP3009 spec, zero address must be rejected when using ecrecover
		require(signer != address(0), "invalid signature");

		// return the signer address derived from the signature
		return signer;
	}

	// ===== End: Meta-transactions Support =====

	// ===== Start: mint support =====

	/**
	 * @dev Creates new token with token ID specified
	 *      and assigns an ownership `_to` for this token
	 *
	 * @dev Checks if `_to` is a smart contract (code size > 0). If so, it calls
	 *      `onERC721Received` on `_to` and throws if the return value is not
	 *      `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`.
	 *
	 * @dev Requires executor to have `ROLE_TOKEN_CREATOR` permission
	 *
	 * @param _to an address to mint token to
	 * @param _tokenId ID of the token to mint
	 * @param _data additional data with no specified format, sent in call to `_to`
	 */
	function safeMint(address _to, uint256 _tokenId, bytes memory _data) public override {
		// delegate to unsafe mint
		mint(_to, _tokenId);

		// make it safe: execute `onERC721Received`

		// if receiver `_to` is a smart contract
		if(AddressUtils.isContract(_to)) {
			// check it supports ERC721 interface - execute onERC721Received()
			bytes4 response = ERC721TokenReceiver(_to).onERC721Received(msg.sender, address(0), _tokenId, _data);

			// expected response is ERC721TokenReceiver(_to).onERC721Received.selector
			// bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))
			require(response == ERC721TokenReceiver(_to).onERC721Received.selector, "invalid onERC721Received response");
		}
	}

	/**
	 * @dev Creates new token with token ID specified
	 *      and assigns an ownership `_to` for this token
	 *
	 * @dev Checks if `_to` is a smart contract (code size > 0). If so, it calls
	 *      `onERC721Received` on `_to` and throws if the return value is not
	 *      `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`.
	 *
	 * @dev Requires executor to have `ROLE_TOKEN_CREATOR` permission
	 *
	 * @param _to an address to mint token to
	 * @param _tokenId ID of the token to mint
	 */
	function safeMint(address _to, uint256 _tokenId) public override {
		// delegate to `safeMint` with empty data
		safeMint(_to, _tokenId, "");
	}

	/**
	 * @dev Creates new tokens starting with token ID specified
	 *      and assigns an ownership `_to` for these tokens
	 *
	 * @dev Token IDs to be minted: [_tokenId, _tokenId + n)
	 *
	 * @dev n must be greater or equal 2: `n > 1`
	 *
	 * @dev Checks if `_to` is a smart contract (code size > 0). If so, it calls
	 *      `onERC721Received` on `_to` and throws if the return value is not
	 *      `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`.
	 *
	 * @dev Requires executor to have `ROLE_TOKEN_CREATOR` permission
	 *
	 * @param _to an address to mint token to
	 * @param _tokenId ID of the token to mint
	 * @param n how many tokens to mint, sequentially increasing the _tokenId
	 * @param _data additional data with no specified format, sent in call to `_to`
	 */
	function safeMintBatch(address _to, uint256 _tokenId, uint256 n, bytes memory _data) public override {
		// delegate to unsafe mint
		mintBatch(_to, _tokenId, n);

		// make it safe: execute `onERC721Received`

		// if receiver `_to` is a smart contract
		if(AddressUtils.isContract(_to)) {
			// onERC721Received: for each token minted
			for(uint256 i = 0; i < n; i++) {
				// check it supports ERC721 interface - execute onERC721Received()
				bytes4 response = ERC721TokenReceiver(_to).onERC721Received(msg.sender, address(0), _tokenId + i, _data);

				// expected response is ERC721TokenReceiver(_to).onERC721Received.selector
				// bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))
				require(response == ERC721TokenReceiver(_to).onERC721Received.selector, "invalid onERC721Received response");
			}
		}
	}

	/**
	 * @dev Creates new tokens starting with token ID specified
	 *      and assigns an ownership `_to` for these tokens
	 *
	 * @dev Token IDs to be minted: [_tokenId, _tokenId + n)
	 *
	 * @dev n must be greater or equal 2: `n > 1`
	 *
	 * @dev Checks if `_to` is a smart contract (code size > 0). If so, it calls
	 *      `onERC721Received` on `_to` and throws if the return value is not
	 *      `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`.
	 *
	 * @dev Requires executor to have `ROLE_TOKEN_CREATOR` permission
	 *
	 * @param _to an address to mint token to
	 * @param _tokenId ID of the token to mint
	 * @param n how many tokens to mint, sequentially increasing the _tokenId
	 */
	function safeMintBatch(address _to, uint256 _tokenId, uint256 n) public override {
		// delegate to `safeMint` with empty data
		safeMintBatch(_to, _tokenId, n, "");
	}

	/**
	 * @dev Creates new token with token ID specified
	 *      and assigns an ownership `_to` for this token
	 *
	 * @dev Unsafe: doesn't execute `onERC721Received` on the receiver.
	 *      Prefer the use of `saveMint` instead of `mint`.
	 *
	 * @dev Requires executor to have `ROLE_TOKEN_CREATOR` permission
	 *
	 * @param _to an address to mint token to
	 * @param _tokenId ID of the token to mint
	 */
	function mint(address _to, uint256 _tokenId) public override {
		// check if caller has sufficient permissions to mint tokens
		require(isSenderInRole(ROLE_TOKEN_CREATOR), "access denied");

		// verify the inputs

		// verify the token ID is "short" (96 bits long at most)
		require(uint96(_tokenId) == _tokenId, "token ID overflow");
		// verify destination address is set
		require(_to != address(0), "zero address");

		// verify token doesn't yet exist
		require(!exists(_tokenId), "already minted");

		// create token ownership record,
		// add token to `allTokens` and new owner's collections
		// add token to both local and global collections (enumerations)
		__addToken(_tokenId, _to);

		// fire ERC721 transfer event
		emit Transfer(address(0), _to, _tokenId);
	}

	/**
	 * @dev Creates new tokens starting with token ID specified
	 *      and assigns an ownership `_to` for these tokens
	 *
	 * @dev Token IDs to be minted: [_tokenId, _tokenId + n)
	 *
	 * @dev n must be greater or equal 2: `n > 1`
	 *
	 * @dev Unsafe: doesn't execute `onERC721Received` on the receiver.
	 *      Prefer the use of `saveMintBatch` instead of `mintBatch`.
	 *
	 * @dev Requires executor to have `ROLE_TOKEN_CREATOR` permission
	 *
	 * @param _to an address to mint tokens to
	 * @param _tokenId ID of the first token to mint
	 * @param n how many tokens to mint, sequentially increasing the _tokenId
	 */
	function mintBatch(address _to, uint256 _tokenId, uint256 n) public override {
		// check if caller has sufficient permissions to mint tokens
		require(isSenderInRole(ROLE_TOKEN_CREATOR), "access denied");

		// verify the inputs

		// verify destination address is set
		require(_to != address(0), "zero address");
		// verify n is set properly
		require(n > 1, "n is too small");
		// verify the token ID is "small" (96 bits long at most)
		require(uint96(_tokenId) == _tokenId, "token ID overflow");
		require(uint96(_tokenId + n - 1) == _tokenId + n - 1, "n-th token ID overflow");

		// verification: for each token to be minted
		for(uint256 i = 0; i < n; i++) {
			// verify token doesn't yet exist
			require(!exists(_tokenId + i), "already minted");
		}

		// create token ownership records,
		// add tokens to `allTokens` and new owner's collections
		// add tokens to both local and global collections (enumerations)
		__addTokens(_to, _tokenId, n);

		// events: for each token minted
		for(uint256 i = 0; i < n; i++) {
			// fire ERC721 transfer event
			emit Transfer(address(0), _to, _tokenId + i);
		}
	}

	// ===== End: mint support =====

	// ----- Start: auxiliary internal/private functions -----

	/**
	 * @dev Adds token to the new owner's collection (local),
	 *      used internally to transfer existing tokens, to mint new
	 *
	 * @dev Unsafe: doesn't check for data structures consistency
	 *      (token existence, token ownership, etc.)
	 *
	 * @dev Must be kept private at all times. Inheriting smart contracts
	 *      may be interested in overriding this function.
	 *
	 * @param _tokenId token ID to add
	 * @param _to new owner address to add token to
	 */
	function __addLocal(uint256 _tokenId, address _to) internal virtual {
		// get a reference to the collection where token goes to
		uint96[] storage destination = collections[_to];

		// update local index and ownership, do not change global index
		tokens[_tokenId] = destination.length << 160 | uint160(_to);

		// push token into the collection
		destination.push(uint96(_tokenId));
	}

	/**
	 * @dev Add token to both local and global collections (enumerations),
	 *      used internally to mint new tokens
	 *
	 * @dev Unsafe: doesn't check for data structures consistency
	 *      (token existence, token ownership, etc.)
	 *
	 * @dev Must be kept private at all times. Inheriting smart contracts
	 *      may be interested in overriding this function.
	 *
	 * @param _tokenId token ID to add
	 * @param _to new owner address to add token to
	 */
	function __addToken(uint256 _tokenId, address _to) internal virtual {
		// add token to a local collection first
		__addLocal(_tokenId, _to);

		// push it into the global `allTokens` collection (enumeration)
		allTokens.push(uint96(_tokenId));
	}

	/**
 * @dev Add tokens to both local and global collections (enumerations),
 *      used internally to mint new tokens in batches
 *
 * @dev Token IDs to be added: [_tokenId, _tokenId + n)
 *      n is expected to be greater or equal 2, but this is not checked
 *
 * @dev Unsafe: doesn't check for data structures consistency
 *      (token existence, token ownership, etc.)
 *
 * @dev Must be kept private at all times. Inheriting smart contracts
 *      may be interested in overriding this function.
 *
 * @param _to new owner address to add token to
 * @param _tokenId first token ID to add
 * @param n how many tokens to add, sequentially increasing the _tokenId
 */
	function __addTokens(address _to, uint256 _tokenId, uint256 n) internal virtual {
		// get a reference to the collection where tokens go to
		uint96[] storage destination = collections[_to];

		// for each token to be added
		for(uint256 i = 0; i < n; i++) {
			// Note: splitting one loop with three doesn't optimize writing into array
			// update token global and local indexes, ownership
			tokens[_tokenId + i] = destination.length + i << 160 | uint160(_to);
			// push token into the local collection
			destination.push(uint96(_tokenId + i));
			// push it into the global `allTokens` collection (enumeration)
			allTokens.push(uint96(_tokenId + i));
		}
	}

	/**
	 * @dev Removes token from owner's local collection,
	 *      used internally to transfer or burn existing tokens
	 *
	 * @dev Unsafe: doesn't check for data structures consistency
	 *      (token existence, token ownership, etc.)
	 *
	 * @dev Must be kept private at all times. Inheriting smart contracts
	 *      may be interested in overriding this function.
	 *
	 * @param _tokenId token ID to remove
	 */
	function __removeLocal(uint256 _tokenId) internal virtual {
		// read token data, containing local index, and owner address
		uint256 token = tokens[_tokenId];

		// get a reference to the token's owner collection (local)
		uint96[] storage source = collections[address(uint160(token))];

		// token index within the collection
		uint256 i = token >> 160;

		// get an ID of the last token in the collection
		uint96 sourceId = source[source.length - 1];

		// if the token we're to remove from the collection is not the last one,
		// we need to move last token in the collection into index `i`
		if(i != source.length - 1) {
			// we put the last token in the collection to the position released

			// update last token index to point to proper place in the collection
			tokens[sourceId] = tokens[sourceId]
				// | local idx              | ownership information (address)      |
				& 0x000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF
				| i << 160;

			// put it into the position `i` within the collection
			source[i] = sourceId;
		}

		// trim the collection by removing last element
		source.pop();

		// clear token approval (also emits an Approval event)
		__clearApproval(address(uint160(token)), _tokenId);
	}

	// ----- End: auxiliary internal/private functions -----
}
