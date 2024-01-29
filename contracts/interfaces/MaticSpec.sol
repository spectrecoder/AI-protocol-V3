// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {ERC20} from "./ERC20Spec.sol";
import {ERC721} from "./ERC721Spec.sol";
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

/**
 * @title Matic Mintable Specification
 *
 * @notice Interfaces supporting Matic integration:
 *      - MaticMintableERC20: https://github.com/maticnetwork/pos-portal/blob/master/contracts/root/RootToken/IMintableERC20.sol
 *      - MaticMintableERC721: https://github.com/maticnetwork/pos-portal/blob/master/contracts/root/RootToken/IMintableERC721.sol
 *      - MaticMintableERC1155: https://github.com/maticnetwork/pos-portal/blob/master/contracts/root/RootToken/IMintableERC1155.sol
 *
 * @dev See https://docs.matic.network/docs/develop/ethereum-matic/mintable-assets
 *
 * @author Basil Gorin
 */

/**
 * @dev Matic Mintable ERC20 interface, enables Layer 2 minting in Matic,
 *      see https://docs.matic.network/docs/develop/ethereum-matic/mintable-assets
 */
interface MaticMintableERC20 is ERC20 {
	/**
	 * @notice called by predicate contract to mint tokens while withdrawing
	 * @dev Should be callable only by MintableERC20Predicate
	 * Make sure minting is done only by this function
	 * @param user user address for whom token is being minted
	 * @param amount amount of token being minted
	 */
	function mint(address user, uint256 amount) external;
}

/**
 * @dev Matic Mintable ERC721 interface, enables Layer 2 minting in Matic,
 *      see https://docs.matic.network/docs/develop/ethereum-matic/mintable-assets
 */
interface MaticMintableERC721 is ERC721 {
	/**
	 * @notice called by predicate contract to mint tokens while withdrawing
	 * @dev Should be callable only by MintableERC721Predicate
	 * Make sure minting is done only by this function
	 * @param user user address for whom token is being minted
	 * @param tokenId tokenId being minted
	 */
	function mint(address user, uint256 tokenId) external;

	/**
	 * @notice called by predicate contract to mint tokens while withdrawing with metadata from L2
	 * @dev Should be callable only by MintableERC721Predicate
	 * Make sure minting is only done either by this function/ 👆
	 * @param user user address for whom token is being minted
	 * @param tokenId tokenId being minted
	 * @param metaData Associated token metadata, to be decoded & set using `setTokenMetadata`
	 *
	 * Note : If you're interested in taking token metadata from L2 to L1 during exit, you must
	 * implement this method
	 */
	function mint(address user, uint256 tokenId, bytes calldata metaData) external;

	/**
	 * @notice check if token already exists, return true if it does exist
	 * @dev this check will be used by the predicate to determine if the token needs to be minted or transfered
	 * @param tokenId tokenId being checked
	 */
	function exists(uint256 tokenId) external view returns (bool);
}

/**
 * @dev Matic Mintable ERC1155 interface, enables Layer 2 minting in Matic,
 *      see https://docs.matic.network/docs/develop/ethereum-matic/mintable-assets
 */
interface MaticMintableERC1155 is IERC1155 {
	/**
	 * @notice Creates `amount` tokens of token type `id`, and assigns them to `account`.
	 * @dev Should be callable only by MintableERC1155Predicate
	 * Make sure minting is done only by this function
	 * @param account user address for whom token is being minted
	 * @param id token which is being minted
	 * @param amount amount of token being minted
	 * @param data extra byte data to be accompanied with minted tokens
	 */
	function mint(address account, uint256 id, uint256 amount, bytes calldata data) external;

	/**
	 * @notice Batched version of singular token minting, where
	 * for each token in `ids` respective amount to be minted from `amounts`
	 * array, for address `to`.
	 * @dev Should be callable only by MintableERC1155Predicate
	 * Make sure minting is done only by this function
	 * @param to user address for whom token is being minted
	 * @param ids tokens which are being minted
	 * @param amounts amount of each token being minted
	 * @param data extra byte data to be accompanied with minted tokens
	 */
	function mintBatch(address to, uint256[] calldata ids, uint256[] calldata amounts, bytes calldata data) external;
}
