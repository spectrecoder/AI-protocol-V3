# Release 3.0 #
Deployment Flow

1.  Prepare the deployment according to the [general release flow routine](release_flow.md)
2.  Clone the [contracts repo](https://github.com/AletheaAI/ai-protocol-contracts)
3.  Checkout branch `release/3.0-b_curves`: `git checkout release/3.0-b_curves`
4.  Install NPM dependencies: `npm i`
5.  Set the environment variable `P_KEY8453` (deployment account private key)
6.  Execute the deployment scripts for the release 3.0:
    ```
    npx hardhat deploy --network base_mainnet --tags v3_0
    ```
7.  Execute the deployment scripts for the release 3.0.1 (leaderboard):
    ```
    npx hardhat deploy --network base_mainnet --tags v3_0_1
    ```
8.  Pack and share the `deployments/base_mainnet` folder
9.  Commit the `deployments/base_mainnet`
10. Verify smart contracts source code
11. Grant `ROLE_SHARES_REGISTRAR 0x00080000` role on the deployed `SharesFactory_Proxy` to the backend address
    responsible for deploying the curves or/and signing deployment meta-transactions
12. Update the `sharesOwnerAddress` on the `SharesFactory_Proxy`
13. Verify the deployment
    1.  protocol fee percent (4%)
        *  `SharesFactory_Proxy.getProtocolFeePercent() = 40000000000000000`
    2.  holders fee percent (3%)
        *  `SharesFactory_Proxy.getHoldersFeePercent() = 30000000000000000`
    3.  subject fee percent (3%)
        *  `SharesFactory_Proxy.getSubjectFeePercent() = 30000000000000000`
    4.  protocol fee destination: deployed `ProtocolFeeDistributor_Proxy`
    5.  implementation addresses
        *  `getSharesImplAddress(1)`: deployed `ERC20Shares` impl
        *  `getDistributorImplAddress(1)`: deployed `HoldersRewardsDistributor` impl
    6.  `sharesOwnerAddress` on the deployed `SharesFactory_Proxy`
    7.  bonding curve function: `getPrice()` on the deployed `ERC20Shares` impl
    8.  NFT contract minting permission `ROLE_CREATOR 0x00010000` granted to the deployed `SharesFactory_Proxy`
        *   `NFT_contract.getRole(SharesFactory_Proxy address) = 0x00010000`
    9.  Factory permission `ROLE_SHARES_REGISTRAR 0x00080000` granted to the backend address
        *   `SharesFactory_Proxy.getRole(backend_addr) = 0x00080000` 
14. Update factory features to set it live
    *   `SharesFactory_Proxy.updateFeatures(0x00000005)`
        *   YES: `FEATURE_SHARES_DEPLOYMENT_ENABLED = 0x0000_0001`
        *   NO:  `FEATURE_ALLOW_PAUSED_DEPLOYMENTS = 0x0000_0002`
        *   YES: `FEATURE_ALLOW_EXCLUSIVE_BUY = 0x0000_0004`
