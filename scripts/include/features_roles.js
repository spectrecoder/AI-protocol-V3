// copy and export all the features and roles constants from different contracts

// Auxiliary BN stuff
const {BigNumber} = require("@ethersproject/bignumber");
const TWO = BigNumber.from(2);

// Access manager is responsible for assigning the roles to users,
// enabling/disabling global features of the smart contract
const ROLE_ACCESS_MANAGER = TWO.pow(255);

// Upgrade manager is responsible for smart contract upgrades
const ROLE_UPGRADE_MANAGER = TWO.pow(254);

// Bitmask representing all the possible permissions (super admin role)
const FULL_PRIVILEGES_MASK = TWO.pow(256).sub(1);

// All 16 features enabled
const FEATURE_ALL = 0x0000_FFFF;

// Start: ===== ERC20/ERC721 =====

// [ERC20/ERC721] Enables transfers of the tokens (transfer by the token owner himself)
const FEATURE_TRANSFERS = 0x0000_0001;

// [ERC20/ERC721] Enables transfers on behalf (transfer by someone else on behalf of token owner)
const FEATURE_TRANSFERS_ON_BEHALF = 0x0000_0002;

// [ERC20] Defines if the default behavior of `transfer` and `transferFrom`
// checks if the receiver smart contract supports ERC20 tokens
const FEATURE_UNSAFE_TRANSFERS = 0x0000_0004;

// [ERC20/ERC721] Enables token owners to burn their own tokens
const FEATURE_OWN_BURNS = 0x0000_0008;

// [ERC20/ERC721] Enables approved operators to burn tokens on behalf of their owners
const FEATURE_BURNS_ON_BEHALF = 0x0000_0010;

// [ERC20] Enables delegators to elect delegates
const FEATURE_DELEGATIONS = 0x0000_0020;

// [ERC20] Enables delegators to elect delegates on behalf (via an EIP712 signature)
const FEATURE_DELEGATIONS_ON_BEHALF = 0x0000_0040;

// [ERC20] Enables ERC-1363 transfers with callback
const FEATURE_ERC1363_TRANSFERS = 0x0000_0080;

// [ERC20] Enables ERC-1363 approvals with callback
const FEATURE_ERC1363_APPROVALS = 0x0000_0100;

// [ERC20] Enables approvals on behalf (EIP2612 permits via an EIP712 signature)
const FEATURE_EIP2612_PERMITS = 0x0000_0200;

// [ERC20] Enables meta transfers on behalf (EIP3009 transfers via an EIP712 signature)
const FEATURE_EIP3009_TRANSFERS = 0x0000_0400;

// [ERC20] Enables meta transfers on behalf (EIP3009 transfers via an EIP712 signature)
const FEATURE_EIP3009_RECEPTIONS = 0x0000_0800;

// [ERC721] Enables approvals on behalf (permits via an EIP712 signature)
const FEATURE_PERMITS = 0x0000_0200;

// [ERC721] Enables operator approvals on behalf (permits for all via an EIP712 signature)
const FEATURE_OPERATOR_PERMITS = 0x0000_0400;

// [ERC20/ERC721] Token creator is responsible for creating (minting) tokens to an arbitrary address
const ROLE_TOKEN_CREATOR = 0x0001_0000;

// [ERC20/ERC721] Token destroyer is responsible for destroying (burning) tokens owned by an arbitrary address
const ROLE_TOKEN_DESTROYER = 0x0002_0000;

// [ERC20] ERC20 receivers are allowed to receive tokens without ERC20 safety checks,
// which may be useful to simplify tokens transfers into "legacy" smart contracts
const ROLE_ERC20_RECEIVER = 0x0004_0000;

// [ERC20] ERC20 senders are allowed to send tokens without ERC20 safety checks,
// which may be useful to simplify tokens transfers into "legacy" smart contracts
const ROLE_ERC20_SENDER = 0x0008_0000;

// [ERC20] Metadata editor is responsible for setting/updating name and symbol of the token
const ROLE_METADATA_EDITOR = 0x0010_0000;

// [ERC721] URI manager is responsible for managing base URI part of the token URI ERC721Metadata interface
const ROLE_URI_MANAGER = 0x0010_0000;

// [ERC721] ERC2981 royalty manager is responsible for managing the EIP2981 royalty info
const ROLE_ROYALTY_MANAGER = 0x0020_0000;

// [ERC721] Owner manager is responsible for setting/updating an "owner" field
const ROLE_OWNER_MANAGER = 0x0040_0000;

// [ERC721] Owner manager is responsible for setting/updating the opensea factory "owner"
const ROLE_OS_MANAGER = 0x0040_0000;

// End: ===== ERC20/ERC721 =====

// Start: ===== Protocol (iNFT/Linker/Sale) =====

// iNFT
// Minter is responsible for creating (minting) iNFTs
const ROLE_MINTER = 0x0001_0000;

// Burner is responsible for destroying (burning) iNFTs
const ROLE_BURNER = 0x0002_0000;

// Editor is responsible for editing (updating) iNFT records
const ROLE_EDITOR = 0x0004_0000;

// iNFT Escrow Extension
// Economy creator is responsible for creating economies
const ROLE_ECONOMY_CREATOR = 0x0001_0000;

// Linker
// Enables iNFT linking (creation)
const FEATURE_LINKING = 0x0000_0001;

// Enables iNFT unlinking (destruction)
const FEATURE_UNLINKING = 0x0000_0002;

// Allows linker to link (mint) / unlink (burn) iNFT to / from any target NFT contract,
// independently whether it was previously whitelisted or not
// Before v3 exclusive
const FEATURE_ALLOW_ANY_NFT_CONTRACT = 0x0000_0004;

// Allows linker to link (mint) iNFT to any target NFT contract,
// independently whether it was previously whitelisted or not
// After v3 inclusive
const FEATURE_ALLOW_ANY_NFT_CONTRACT_FOR_LINKING = 0x0000_0004;

// Allows linker to unlink (burn) iNFT bound to any target NFT contract,
// independently whether it was previously whitelisted or not
// After v3 inclusive
const FEATURE_ALLOW_ANY_NFT_CONTRACT_FOR_UNLINKING = 0x0000_0040;

// Allows linker to link (mint) iNFT bound to any target NFT,
// independently whether it was previously whitelisted/blacklisted or not
// After v4 inclusive
const FEATURE_ALLOW_ANY_TARGET_NFT = 0x0000_0020;

// Enables depositing more ALI to already existing iNFTs
const FEATURE_DEPOSITS = 0x0000_0008;

// Enables ALI withdrawals from the iNFT (without destroying them)
const FEATURE_WITHDRAWALS = 0x0000_0010;

// Link price manager is responsible for updating link price
const ROLE_LINK_PRICE_MANAGER = 0x0001_0000;

// Next ID manager is responsible for updating `nextId` variable, pointing to the next iNFT ID free slot
const ROLE_NEXT_ID_MANAGER = 0x0002_0000;

// Whitelist manager is responsible for managing the target NFT contracts whitelist,
// which are the contracts iNFT is allowed to be bound to
const ROLE_WHITELIST_MANAGER = 0x0004_0000;

// Sale
// Allows buying the items publicly, effectively ignoring the buyer permission
const FEATURE_PUBLIC_SALE = 0x0000_0001;

// Sale manager is responsible for managing properties of the sale,
// such as sale price, amount, start/end dates, etc.
const ROLE_SALE_MANAGER = 0x0001_0000;

// Withdrawal manager is responsible for withdrawing ETH obtained in sale from the sale smart contract
const ROLE_WITHDRAWAL_MANAGER = 0x0002_0000;

// Buyer can buy items via the restricted sale
const ROLE_BUYER = 0x0004_0000;

// End: ===== Protocol (iNFT/Linker/Sale) =====

// Start: ===== Personality Pod Airdrop =====

// Enables the airdrop, redeeming the tokens
const FEATURE_REDEEM_ACTIVE = 0x0000_0001;

// Data manager is responsible for supplying the valid input data array
const ROLE_DATA_MANAGER = 0x0001_0000;

// End: ===== Personality Pod Airdrop =====

// Start: ===== NFT Staking =====

// Enables staking, stake(), stakeBatch()
const FEATURE_STAKING = 0x0000_0001;

// Enables unstaking, unstake(), unstakeBatch()
const FEATURE_UNSTAKING = 0x0000_0002;

// Rescue manager is responsible for "rescuing" ERC20/ERC721 tokens
const ROLE_RESCUE_MANAGER = 0x0001_0000;

// End: ===== NFT Staking =====

// Start: ===== NFT Factory =====

// Enables meta transaction minting (minting with an authorization via an EIP712 signature)
const FEATURE_MINTING_WITH_AUTH = 0x0000_0001;

// Minter is responsible for creating (minting) tokens to an arbitrary address
const ROLE_FACTORY_MINTER = 0x0001_0000;

// End: ===== NFT Factory =====

// Start: ===== CharacterTokenFactory =====

// Enables config manager to edit configurable parameters
const ROLE_CONFIG_MANAGER = 0x0001_0000;

// Enables character token manager to update role for character token
const ROLE_CHAR_TOKEN_MANAGER = 0x0002_0000;

// End: ===== CharacterTokenFactory =====

// Start: ===== L0 ERC20 Tunnels =====

/**
 * Enables deposits on the tunnel (tunnel entrance)
 *      note: withdrawals are always enabled and cannot be disabled
 */
const FEATURE_ENTRANCE_OPEN = 0x0000_0001;

// End: ===== L0 ERC20 Tunnels =====

// export all the copied constants
module.exports = {
	ROLE_ACCESS_MANAGER,
	ROLE_UPGRADE_MANAGER,
	FULL_PRIVILEGES_MASK,
	FEATURE_ALL,
	FEATURE_TRANSFERS,
	FEATURE_TRANSFERS_ON_BEHALF,
	FEATURE_UNSAFE_TRANSFERS,
	FEATURE_OWN_BURNS,
	FEATURE_BURNS_ON_BEHALF,
	FEATURE_DELEGATIONS,
	FEATURE_DELEGATIONS_ON_BEHALF,
	FEATURE_ERC1363_TRANSFERS,
	FEATURE_ERC1363_APPROVALS,
	FEATURE_EIP2612_PERMITS,
	FEATURE_EIP3009_TRANSFERS,
	FEATURE_EIP3009_RECEPTIONS,
	FEATURE_PERMITS,
	FEATURE_OPERATOR_PERMITS,
	FEATURE_LINKING,
	FEATURE_UNLINKING,
	FEATURE_DEPOSITS,
	FEATURE_WITHDRAWALS,
	FEATURE_ALLOW_ANY_NFT_CONTRACT,
	FEATURE_ALLOW_ANY_NFT_CONTRACT_FOR_LINKING,
	FEATURE_ALLOW_ANY_NFT_CONTRACT_FOR_UNLINKING,
	FEATURE_ALLOW_ANY_TARGET_NFT,
	FEATURE_PUBLIC_SALE,
	FEATURE_REDEEM_ACTIVE,
	FEATURE_STAKING,
	FEATURE_UNSTAKING,
	FEATURE_MINTING_WITH_AUTH,
	FEATURE_ENTRANCE_OPEN,
	ROLE_TOKEN_CREATOR,
	ROLE_TOKEN_DESTROYER,
	ROLE_ERC20_RECEIVER,
	ROLE_ERC20_SENDER,
	ROLE_METADATA_EDITOR,
	ROLE_URI_MANAGER,
	ROLE_MINTER,
	ROLE_BURNER,
	ROLE_EDITOR,
	ROLE_ECONOMY_CREATOR,
	ROLE_LINK_PRICE_MANAGER,
	ROLE_NEXT_ID_MANAGER,
	ROLE_WHITELIST_MANAGER,
	ROLE_SALE_MANAGER,
	ROLE_WITHDRAWAL_MANAGER,
	ROLE_BUYER,
	ROLE_ROYALTY_MANAGER,
	ROLE_OWNER_MANAGER,
	ROLE_OS_MANAGER,
	ROLE_DATA_MANAGER,
	ROLE_RESCUE_MANAGER,
	ROLE_FACTORY_MINTER,
	ROLE_CONFIG_MANAGER,
	ROLE_CHAR_TOKEN_MANAGER,
};
