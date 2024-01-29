# Release Flow #
This document describes how the smart contracts release is prepared and deployed.

## High-level Steps Overview ##
* [Development](#development)
* [Testnet deployment](#testnet-deployment)
* [Internal review / audit](#internal-review--audit)
* [Internal testing / Testnet deployment integration](#internal-testing--testnet-deployment-integration)
* [External audit](#external-audit)
* [Release branch and tag preparation](#release-branch-and-tag-preparation)
* [Mainnet deployment](#mainnet-deployment)
* [Post-deployment setup and verification](#post-deployment-setup-and-verification)
* [Mainnet testing / Mainnet deployment integration](#mainnet-testing--mainnet-deployment-integration)

## Development ##
Development phase includes
1) smart contracts technical design (technical writing, flow charting),
2) smart contracts development (Solidity coding),
3) automatic smart contracts tests implementation (JavaScript coding)
4) deployment scripts implementation (JavaScript coding)

Development phase is executed in a new "feature" branch, which is eventually merged into master.
We name it `ft/short_description` where `short_description` stands for a 1-3 words description of the feature or
new functionality developed in a branch. Example: `ft/doc_release_flow`.

Every commit in the feature branch should ideally represent a complete and functional chunk of work, with no broken
or not working tests, with no Solidity code which doesn't compile. This is a must if several developers are working
on the feature.

_If you need to commit some temporary, not fully functional work into a feature branch developed by several people
 – create an additional temporary branch and merge it into the feature branch once the work chunk is complete._

When the development is complete (all the features are designed, implemented and covered with tests), a PR is raised.

## Internal Review / Audit ##
The PR raised as a result of the development phase is reviewed by at least one other developer.
The reviewer must review all the changes in the feature branch compared to the master branch and evaluate if the
minimalism principle is followed, i.e. the changes are minimal to reach the functionality / goals required.

The reviewer must run the tests and make sure new Solidity code and functionality are covered with tests.

The reviewer should consult with [Security Best Practices](https://consensys.github.io/smart-contract-best-practices/).

The audit report should be shared in free form, it can be as simple as a nicely formatted message in Slack.

## Testnet Deployment ##
The testnet deployment is usually executed during the development phase to test the deployment scripts.
Its final  version is shared with the Full Stack team which does the integration work and may do some testing.
The deployments should be committed into GitHub (see [deployments](../deployments) folder).

The testnets currently in use are: Goerli, Mumbai, and BSC Testnet. 

## Internal Testing / Testnet Deployment Integration ##
Blockchain team supports Full Stack team work on integration by providing code samples, scripts, helping
troubleshooting issues.

During the testnet integration phase blockchain team may do some small modifications to the smart
contracts based on the Full Stack team feedback. Additional view functions may be added, additional events emitted,
signatures of the existing events and functions may get changed for better convenience and performance.

_Ideally we should foresee the needs of the Full Stack team during the tech design phase so that nothing comes up
from them during the integration phase._

## External Audit ##
The external audit is executed after the feature PR has passed the internal review and merged into master. If there
is a reasonable doubt about feature release date, reasonable suspicion that some other feature may be released first,
the audit may be executed in the feature branch without merging into master. In any case internal audit goes first.

An external audit is done by at least two unrelated unbiased parties. Blockchain
team supports the external audit by supplying all the required information to auditors and responding to their questions
in a timely manner.

Blockchain team may additionally prepare the code for external audit [using slither](./slither_doc.md).

Audit report is obligatory. Blockchain team reviews and addresses the audit findings ideally within 1–3 days.

## Release Branch and Tag Preparation ##
The release code is frozen before the mainnet deployment. We do this by creating a "release" branch named
`release/version` where `version` is a very short version identifier, consisting of version number and, optionally,
1–2 words version description. Example: `release/2.5.1-digital_twin`.

The latest commit in the release branch is tagged with the same name using `v` prefix instead of `release/`.
Example: `v2.5.1`.

## Mainnet Deployment ##
Mainnet deployment is executed from the release branch. The deployment is then committed into the same branch
(see [deployments](../deployments) folder).
The deployment commit is cherry-picked from the release branch into the master branch.

The mainnets currently in use are: Ethereum, Polygon, and BNB Smart Chain. 

## Post-deployment Setup and Verification ##
For convenience mainnet deployment is executed using an externally owned account (EOA). This account inherits
the admin permissions after the deployment is complete. These permissions are transferred to a MultiSig
manually.

Blockchain team verifies the deployed infrastructure, permissions between internal components of the protocol,
permissions with the MultiSig.

## Mainnet Testing / Mainnet Deployment Integration ##
The final step after mainnet deployment is mainnet integration and mainnet integration.
Blockchain team supports Full Stack team work on integration by helping troubleshooting issues, and testing.
Final sanity check may be performed not only by Full Stack and Blockchain teams, but by a wider range of
contributors.
