// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./ShortERC721.sol";

/**
 * @title Burnable Short ERC721
 *
 * @notice Short ERC721 extension to support token burning,
 *      See {ShortERC721}
 *
 * @author Basil Gorin
 */
abstract contract BurnableShortERC721 is ShortERC721, BurnableERC721 {
	/**
	 * @dev To support burning for enumerable ERC721 we have to be able
	 *      to quickly remove tokens from `allTokens` array (without iterating it)
	 *
	 * @dev Following mapping stores token indexes within `allTokens` array
	 *
	 * @dev Maps `Token ID => Token ID Index`
	 */
	mapping(uint256 => uint256) private tokenIndexes;

	/**
	 * @dev Constructs/deploys burnable ERC721 instance with the name and symbol specified
	 *
	 * @param _name name of the token to be accessible as `name()`
	 * @param _symbol token symbol to be accessible as `symbol()`
	 */
	constructor(string memory _name, string memory _symbol) ShortERC721(_name, _symbol) {}

	/**
	 * @inheritdoc ERC165
	 */
	function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
		// construct the interface from current and super implementations
		return interfaceId == type(MintableERC721).interfaceId || super.supportsInterface(interfaceId);
	}

	// ===== Start: burn support =====

	/**
	 * @dev Destroys the token with token ID specified
	 *
	 * @dev Requires executor to have `ROLE_TOKEN_DESTROYER` permission
	 *      or FEATURE_OWN_BURNS/FEATURE_BURNS_ON_BEHALF features to be enabled
	 *
	 * @dev Can be disabled by the contract creator forever by disabling
	 *      FEATURE_OWN_BURNS/FEATURE_BURNS_ON_BEHALF features and then revoking
	 *      its own roles to burn tokens and to enable burning features
	 *
	 * @param _tokenId ID of the token to burn
	 */
	function burn(uint256 _tokenId) public override {
		// read token owner data
		// verifies token exists under the hood
		address _from = ownerOf(_tokenId);

		// check if caller has sufficient permissions to burn tokens
		// and if not - check for possibility to burn own tokens or to burn on behalf
		if(!isSenderInRole(ROLE_TOKEN_DESTROYER)) {
			// if `_from` is equal to sender, require own burns feature to be enabled
			// otherwise require burns on behalf feature to be enabled
			require(_from == msg.sender && isFeatureEnabled(FEATURE_OWN_BURNS)
			     || _from != msg.sender && isFeatureEnabled(FEATURE_BURNS_ON_BEHALF),
			        _from == msg.sender? "burns are disabled": "burns on behalf are disabled");

			// verify sender is either token owner, or approved by the token owner to burn tokens
			require(_from == msg.sender || msg.sender == getApproved(_tokenId) || isApprovedForAll(_from, msg.sender), "access denied");
		}

		// remove token ownership record (also clears approval),
		// remove token from both local and global collections
		__removeToken(_tokenId);

		// delete token URI mapping
		delete _tokenURIs[_tokenId];

		// fire ERC721 transfer event
		emit Transfer(_from, address(0), _tokenId);
	}

	// ===== End: burn support =====

	// ----- Start: auxiliary internal/private functions -----

	/**
	 * @inheritdoc ShortERC721
	 *
	 * @dev Adds a code to initialize `tokenIndexes` mapping required for burn support
	 */
	function __addToken(uint256 _tokenId, address _to) internal virtual override {
		// write global token index data
		tokenIndexes[_tokenId] = allTokens.length;

		// execute default parent code
		super.__addToken(_tokenId, _to);
	}

	/**
	 * @inheritdoc ShortERC721
	 *
	 * @dev Adds a code to initialize `tokenIndexes` mapping required for burn support
	 */
	function __addTokens(address _to, uint256 _tokenId, uint256 n) internal virtual override {
		// for each token to be added
		for(uint256 i = 0; i < n; i++) {
			// write global token index data
			tokenIndexes[_tokenId + i] = allTokens.length;
		}

		// execute default parent code
		super.__addTokens(_to, _tokenId, n);
	}

	/**
	 * @dev Removes token from both local and global collections (enumerations),
	 *      used internally to burn existing tokens
	 *
	 * @dev Unsafe: doesn't check for data structures consistency
	 *      (token existence, token ownership, etc.)
	 *
	 * @dev Must be kept private at all times. Inheriting smart contracts
	 *      may be interested in overriding this function.
	 *
	 * @param _tokenId token ID to remove
	 */
	function __removeToken(uint256 _tokenId) internal virtual {
		// remove token from owner's (local) collection first
		__removeLocal(_tokenId);

		// token index within the global collection
		uint256 i = tokenIndexes[_tokenId];

		// delete the token
		delete tokens[_tokenId];

		// get an ID of the last token in the collection
		uint96 lastId = allTokens[allTokens.length - 1];

		// if the token we're to remove from the collection is not the last one,
		// we need to move last token in the collection into index `i`
		if(i != allTokens.length - 1) {
			// we put the last token in the collection to the position released

			// update last token index to point to proper place in the collection
			tokenIndexes[lastId] = i;

			// put it into the position `i` within the collection
			allTokens[i] = lastId;
		}

		// trim the collection by removing last element
		allTokens.pop();
	}

	// ----- End: auxiliary internal/private functions -----
}
