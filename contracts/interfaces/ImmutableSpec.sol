// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

/**
 * @title Immutable X Mintable Specification
 *
 * @notice Interfaces supporting IMX integration:
 *      - ImmutableMintableERC20: @imtbl/imx-contracts/contracts/IMintable.sol
 *      - ImmutableMintableERC721: @imtbl/imx-contracts/contracts/IMintable.sol
 *
 * @dev See https://docs.x.immutable.com/docs/minting-assets-1
 * @dev See https://docs.x.immutable.com/docs/partner-nft-minting-setup
 *
 * @author Basil Gorin
 */

/**
 * @dev IMX Mintable interface, enables Layer 2 minting in IMX,
 *      see https://docs.x.immutable.com/docs/minting-assets-1
 *
 * @dev See @imtbl/imx-contracts/contracts/IMintable.sol
 */
interface ImmutableMintableERC20 {
	/**
	 * @dev Mints ERC20 tokens
	 *
	 * @param to address to mint tokens to
	 * @param amount amount of tokens to mint
	 * @param mintingBlob [optional] data structure supplied
	 */
	function mintFor(address to, uint256 amount, bytes memory mintingBlob) external;
}

/**
 * @dev IMX Mintable interface, enables Layer 2 minting in IMX,
 *      see https://docs.x.immutable.com/docs/minting-assets-1
 *
 * @dev See @imtbl/imx-contracts/contracts/IMintable.sol
 */
interface ImmutableMintableERC721 {
	/**
	 * @dev Mints an NFT
	 *
	 * @param to address to mint NFT to
	 * @param id ID of the NFT to mint
	 * @param mintingBlob [optional] data structure stored alongside with NFT
	 */
	function mintFor(address to, uint256 id, bytes memory mintingBlob) external;
}
