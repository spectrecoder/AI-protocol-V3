# Matching the Bytecode #

How to verify that what is deployed is what was audited before?

## Terms and Definitions ##

**Audit commit hash.**
External smart contract audit, provided as a PDF document by the security audit provider (agency, freelancer, etc.) has
a source code reference containing a commit hash. We call this hash an audit commit hash.

**Deployment commit hash**
corresponds to the source code commit hash which was actually deployed into mainnet.
This commit hash must be equal to the audit commit hash or be located after the audit commit hash in the git history.
In practice it is always the latter case.

## Matching the Bytecode ##

The first step of the verification process is to match the mainnet deployment with the deployment audit hash.
These are the steps:
1. Download the source code matching the deployment commit hash
2. Compile the source code, artifacts directory is created containing the compiled Solidity bytecode in json files
3. For every deployed smart contract
   1. Locate the corresponding json file in the artifacts folder,
   containing the deployed bytecode as a "bytecode” json property;
   this is a long hexadecimal string, starting with 0x with a length varying from hundreds of bytes to 24 kilobytes
   2. Open the deployed smart contract on Etherscan, go to “Contract” tab,
   make sure the “Contract” tab has the green checkbox indicator of the verified smart contract
   and the page itself has a “Contract Source Code Verified” mark or “Similar Match Source Code” mark (for proxies)
   3. In the very bottom of the Contract page in Etherscan find the “Contract Creation Code” section
   containing the deployed bytecode as a hexadecimal string without leading 0x prefix
   4. Match the deployed bytecode found in compiled json and in Etherscan;
      * for smart contracts without constructor or with empty constructors (like any upgradeable smart contract)
      you will see the exact match;
      * for smart contracts with the constructor (like non-upgradeable contracts, or the `ERC1967Proxy` itself)
      you will see the partial match: the bytecode in Etherscan begins with the bytecode from the json file
      (complete match), followed by additional data usually tens or hundreds bytes length – this data represents
      the constructor arguments – match this data with the constructor arguments from the deployment script(s);
      see the [Contract ABI Specification](https://docs.soliditylang.org/en/v0.8.18/abi-spec.html)
      to get familiar with ABI encoding of constructor params
4. The result of the process is all the deployed smart contracts byte code is matched and verified with the git code
corresponding to deployment commit hash

## Matching the Audit Commit Hash ##

The second step of the verification process is to ensure the deployment commit hash matches the audit commit hash.
These are the steps:
1. Match the deployment commit hash and audit commit hash; if these are equal, we’re done;
this is almost never the case, it is a common situation when important changes are added to the repo after the audit
happens
2. Locate the audit commit hash and deployment commit hash in the git commit history,
make sure audit commit hash is before the deployment commit hash, locate all the commits in between
3. Review every commit in between;
   1. for every commit in review, make sure the commit doesn't affect the code which is in scope of the audit;
   2. audit scope is defined in the audit document and usually contains only smart contract code,
   meaning that any changes outside the smart contracts or soldoc, comments,
   formatting in the smart contracts usually considered as safe
   3. we don’t have a process to approve trivial changes in the scope of the audit,
   these changes should be therefore rejected
4. The result of the process is that all the commits in between the audit commit hash and deployment commit hash
are reviewed and are safe
