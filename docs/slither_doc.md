# Using Slither #
to better prepare for an external audit

Most of the auditing agencies use an automatic static analyzer tool to enhance their manual analysis.
These tools usually report myriad of false-positives, but some amount of legit findings is also possible.
One of the most popular static analyzers is [slither](https://github.com/crytic/slither).

Slither is an open-source software, configurable, and extendable.

## Installation ##
Installation instructions for most of the platforms can be found in
[slither README "How to install" section](https://github.com/crytic/slither#how-to-install).

On macOS, it can be also installed with [homebrew](https://brew.sh/):
```
brew install slither-analyzer
```

## Usage ##
Slither [can be used](https://github.com/crytic/slither#usage) to scan entire project or a single file.
When scanning a single file it must be flattened first with the
[slither-flat](https://github.com/crytic/slither/wiki/Contract-Flattening).

We use entire project scanning mode to generate the report.

See also: [slither usage wiki page](https://github.com/crytic/slither/wiki/Usage)

### Known Issues ###
Slither is not compatible with the
[hardhat-dependency-compiler](https://www.npmjs.com/package/hardhat-dependency-compiler) hardhat plugin.

Since dependency compiler is not required to compile the project (but only to run tests and deploy),
as a temporary workaround the plugin needs to be disabled when using slither:

[`hardhat.config.js`](../hardhat.config.js):
```
// compile Solidity sources directly from NPM dependencies
// https://github.com/ItsNickBarry/hardhat-dependency-compiler
// require("hardhat-dependency-compiler");
```

## Generating Report ##
By default, slither usually generates a huge report with myriad irrelevant to the audit findings.
Examples of such findings are
* naming conventions
* usage of inline assembly and low level function call warnings
* solidity version warnings
* unused functions and variables
* etc.

Any findings are useful to pay additional attention and to think twice about its essence, but only few should hit
the final report.

The generated report __must__ be cleaned out of any findings, irrelevant to the audit.

Depending on the project context, some analysis rules (they are called _detectors_ in slither) can be treated irrelevant
as a whole. These rules can be disabled when generating the report to reduce number of false-positive findings to
work with.

Example of running slither with some detectors disabled:
```
slither . --exclude naming-convention,too-many-digits,pragma,solc-version,dead-code,assembly,timestamp,low-level-calls,uninitialized-state
```

Full list of detectors can be found in [slither wiki](https://github.com/crytic/slither/wiki/Detector-Documentation).

## Report Example ##
Below is an example of slither report, cleaned out of all the finding irrelevant to the audit.
For clarity, relevant findings are marked in __bold__, irrelevant are <span style="color:gray;">greyed out</span>.

Note that only 8 out of 894 findings are relevant.

<pre style="color: gray;">

INFO:Detectors:
FixedSupplySale.buyTo(address,uint32) (contracts/protocol/FixedSupplySale.sol#425-481) uses arbitrary from in transferFrom: ERC20(aliContract).transferFrom(aliSource,iNftContract,_aliValue) (contracts/protocol/FixedSupplySale.sol#448)
FixedSupplySale.buySingleTo(address) (contracts/protocol/FixedSupplySale.sol#498-534) uses arbitrary from in transferFrom: ERC20(aliContract).transferFrom(aliSource,iNftContract,aliValue) (contracts/protocol/FixedSupplySale.sol#512)
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#arbitrary-from-in-transferfrom
INFO:Detectors:
ERC1967UpgradeUpgradeable._functionDelegateCall(address,bytes) (node_modules/@openzeppelin/contracts-upgradeable/proxy/ERC1967/ERC1967UpgradeUpgradeable.sol#208-214) uses delegatecall to a input-controlled function id
	- (success,returndata) = target.delegatecall(data) (node_modules/@openzeppelin/contracts-upgradeable/proxy/ERC1967/ERC1967UpgradeUpgradeable.sol#212)
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#controlled-delegatecall
INFO:Detectors:
ERC721 is re-used:
	- ERC721 (node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol#19-424)
	- ERC721 (contracts/interfaces/ERC721Spec.sol#24-117)
ERC721Enumerable is re-used:
	- ERC721Enumerable (node_modules/@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol#14-163)
	- ERC721Enumerable (contracts/interfaces/ERC721Spec.sol#168-189)
ERC20 is re-used:
	- ERC20 (node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol#35-356)
	- ERC20 (contracts/interfaces/ERC20Spec.sol#21-160)
AliERC20v2Base is re-used:
	- AliERC20v2Base (contracts/token/AliERC20v2.sol#119-1963)
	- AliERC20v2Base (contracts/token/BinanceAliERC20v2.sol#118-1968)
ERC165 is re-used:
	- ERC165 (node_modules/@openzeppelin/contracts/utils/introspection/ERC165.sol#22-29)
	- ERC165 (contracts/interfaces/ERC165Spec.sol#15-27)
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#name-reused
INFO:Detectors:
UpgradeableAccessControl.__gap (contracts/utils/UpgradeableAccessControl.sol#77) shadows:
	- UUPSUpgradeable.__gap (node_modules/@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol#81)
	- ERC1967UpgradeUpgradeable.__gap (node_modules/@openzeppelin/contracts-upgradeable/proxy/ERC1967/ERC1967UpgradeUpgradeable.sol#215)
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#state-variable-shadowing
INFO:Detectors:
FixedSupplySale.buyTo(address,uint32) (contracts/protocol/FixedSupplySale.sol#425-481) ignores return value by ERC20(aliContract).transferFrom(aliSource,iNftContract,_aliValue) (contracts/protocol/FixedSupplySale.sol#448)
FixedSupplySale.buySingleTo(address) (contracts/protocol/FixedSupplySale.sol#498-534) ignores return value by ERC20(aliContract).transferFrom(aliSource,iNftContract,aliValue) (contracts/protocol/FixedSupplySale.sol#512)
IntelliLinker.link(uint96,address,uint256) (contracts/protocol/IntelliLinker.sol#263-292) ignores return value by ERC20(aliContract).transferFrom(msg.sender,feeDestination,linkFee) (contracts/protocol/IntelliLinker.sol#275)
IntelliLinker.link(uint96,address,uint256) (contracts/protocol/IntelliLinker.sol#263-292) ignores return value by ERC20(aliContract).transferFrom(msg.sender,iNftContract,linkPrice - linkFee) (contracts/protocol/IntelliLinker.sol#281)
IntelliLinker.deposit(uint256,uint96) (contracts/protocol/IntelliLinker.sol#361-397) ignores return value by ERC20(aliContract).transferFrom(msg.sender,feeDestination,_linkFee) (contracts/protocol/IntelliLinker.sol#386)
IntelliLinker.deposit(uint256,uint96) (contracts/protocol/IntelliLinker.sol#361-397) ignores return value by ERC20(aliContract).transferFrom(msg.sender,iNftContract,_aliValue) (contracts/protocol/IntelliLinker.sol#390)
IntelliLinkerV2.link(uint96,address,uint256) (contracts/protocol/IntelliLinkerV2.sol#282-314) ignores return value by ERC20(aliContract).transferFrom(msg.sender,feeDestination,linkFee) (contracts/protocol/IntelliLinkerV2.sol#297)
IntelliLinkerV2.link(uint96,address,uint256) (contracts/protocol/IntelliLinkerV2.sol#282-314) ignores return value by ERC20(aliContract).transferFrom(msg.sender,iNftContract,linkPrice - linkFee) (contracts/protocol/IntelliLinkerV2.sol#303)
IntelliLinkerV2.deposit(uint256,uint96) (contracts/protocol/IntelliLinkerV2.sol#397-433) ignores return value by ERC20(aliContract).transferFrom(msg.sender,feeDestination,_linkFee) (contracts/protocol/IntelliLinkerV2.sol#422)
IntelliLinkerV2.deposit(uint256,uint96) (contracts/protocol/IntelliLinkerV2.sol#397-433) ignores return value by ERC20(aliContract).transferFrom(msg.sender,iNftContract,_aliValue) (contracts/protocol/IntelliLinkerV2.sol#426)
IntelliLinkerV3.link(uint96,address,uint256) (contracts/protocol/IntelliLinkerV3.sol#276-305) ignores return value by ERC20(aliContract).transferFrom(msg.sender,feeDestination,linkFee) (contracts/protocol/IntelliLinkerV3.sol#288)
IntelliLinkerV3.link(uint96,address,uint256) (contracts/protocol/IntelliLinkerV3.sol#276-305) ignores return value by ERC20(aliContract).transferFrom(msg.sender,iNftContract,linkPrice - linkFee) (contracts/protocol/IntelliLinkerV3.sol#294)
IntelliLinkerV3.deposit(uint256,uint96) (contracts/protocol/IntelliLinkerV3.sol#382-418) ignores return value by ERC20(aliContract).transferFrom(msg.sender,feeDestination,_linkFee) (contracts/protocol/IntelliLinkerV3.sol#407)
IntelliLinkerV3.deposit(uint256,uint96) (contracts/protocol/IntelliLinkerV3.sol#382-418) ignores return value by ERC20(aliContract).transferFrom(msg.sender,iNftContract,_aliValue) (contracts/protocol/IntelliLinkerV3.sol#411)
IntelligentNFTv2.burn(uint256) (contracts/protocol/IntelligentNFTv2.sol#693-745) ignores return value by ERC20(aliContract).transfer(owner,binding.aliValue) (contracts/protocol/IntelligentNFTv2.sol#731)
IntelligentNFTv2.decreaseAli(uint256,uint96,address) (contracts/protocol/IntelligentNFTv2.sol#804-832) ignores return value by ERC20(aliContract).transfer(recipient,aliDelta) (contracts/protocol/IntelligentNFTv2.sol#828)
NFTStaking.rescueErc20(address,address,uint256) (contracts/protocol/NFTStaking.sol#294-300) ignores return value by ERC20(_contract).transfer(_to,_value) (contracts/protocol/NFTStaking.sol#299)
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#unchecked-transfer
INFO:Detectors:
ShortERC721.collections (contracts/token/ShortERC721.sol#147) is never initialized. It is used in:
	- ShortERC721.balanceOf(address) (contracts/token/ShortERC721.sol#477-484)
	- ShortERC721.tokenOfOwnerByIndex(address,uint256) (contracts/token/ShortERC721.sol#524-530)
	- ShortERC721.__addLocal(uint256,address) (contracts/token/ShortERC721.sol#1058-1067)
	- ShortERC721.__addTokens(address,uint256,uint256) (contracts/token/ShortERC721.sol#1107-1121)
	- ShortERC721.__removeLocal(uint256) (contracts/token/ShortERC721.sol#1135-1168)
TinyERC721.collections (contracts/token/TinyERC721.sol#140) is never initialized. It is used in:
	- TinyERC721.balanceOf(address) (contracts/token/TinyERC721.sol#477-484)
	- TinyERC721.tokenOfOwnerByIndex(address,uint256) (contracts/token/TinyERC721.sol#524-530)
	- TinyERC721.__addLocal(uint256,address) (contracts/token/TinyERC721.sol#1099-1111)
	- TinyERC721.__addToken(uint256,address) (contracts/token/TinyERC721.sol#1126-1138)
	- TinyERC721.__addTokens(address,uint256,uint256) (contracts/token/TinyERC721.sol#1157-1171)
	- TinyERC721.__removeLocal(uint256) (contracts/token/TinyERC721.sol#1185-1219)
IntelliLinkerV3.aliContract (contracts/protocol/IntelliLinkerV3.sol#39) is never initialized. It is used in:
	- IntelliLinkerV3.link(uint96,address,uint256) (contracts/protocol/IntelliLinkerV3.sol#276-305)
	- IntelliLinkerV3.deposit(uint256,uint96) (contracts/protocol/IntelliLinkerV3.sol#382-418)
IntelliLinkerV3.personalityContract (contracts/protocol/IntelliLinkerV3.sol#44) is never initialized. It is used in:
	- IntelliLinkerV3.link(uint96,address,uint256) (contracts/protocol/IntelliLinkerV3.sol#276-305)
IntelliLinkerV3.iNftContract (contracts/protocol/IntelliLinkerV3.sol#49) is never initialized. It is used in:
	- IntelliLinkerV3.link(uint96,address,uint256) (contracts/protocol/IntelliLinkerV3.sol#276-305)
	- IntelliLinkerV3.unlink(uint256) (contracts/protocol/IntelliLinkerV3.sol#316-336)
	- IntelliLinkerV3.unlinkNFT(address,uint256) (contracts/protocol/IntelliLinkerV3.sol#348-369)
	- IntelliLinkerV3.deposit(uint256,uint96) (contracts/protocol/IntelliLinkerV3.sol#382-418)
	- IntelliLinkerV3.withdraw(uint256,uint96) (contracts/protocol/IntelliLinkerV3.sol#430-448)
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#uninitialized-state-variables
INFO:Detectors:
AliCompMock (contracts/mocks/AliCompMock.sol#7-23) has incorrect ERC721 function interface:AliERC20v2Base.transferFrom(address,address,uint256) (contracts/token/AliERC20v2.sol#880-905)
AliCompMock (contracts/mocks/AliCompMock.sol#7-23) has incorrect ERC721 function interface:AliERC20v2Base.safeTransferFrom(address,address,uint256,bytes) (contracts/token/AliERC20v2.sol#934-945)
AliCompMock (contracts/mocks/AliCompMock.sol#7-23) has incorrect ERC721 function interface:AliERC20v2Base.approve(address,uint256) (contracts/token/AliERC20v2.sol#1083-1089)
AliCompMock (contracts/mocks/AliCompMock.sol#7-23) has incorrect ERC721 function interface:ERC20.transferFrom(address,address,uint256) (contracts/interfaces/ERC20Spec.sol#132)
AliCompMock (contracts/mocks/AliCompMock.sol#7-23) has incorrect ERC721 function interface:ERC20.approve(address,uint256) (contracts/interfaces/ERC20Spec.sol#146)
CharacterCompMock (contracts/mocks/CharacterCompMock.sol#7-23) has incorrect ERC721 function interface:CharacterERC20.transferFrom(address,address,uint256) (contracts/token/CharacterERC20.sol#898-923)
CharacterCompMock (contracts/mocks/CharacterCompMock.sol#7-23) has incorrect ERC721 function interface:CharacterERC20.safeTransferFrom(address,address,uint256,bytes) (contracts/token/CharacterERC20.sol#952-963)
CharacterCompMock (contracts/mocks/CharacterCompMock.sol#7-23) has incorrect ERC721 function interface:CharacterERC20.approve(address,uint256) (contracts/token/CharacterERC20.sol#1101-1107)
CharacterCompMock (contracts/mocks/CharacterCompMock.sol#7-23) has incorrect ERC721 function interface:ERC20.transferFrom(address,address,uint256) (contracts/interfaces/ERC20Spec.sol#132)
CharacterCompMock (contracts/mocks/CharacterCompMock.sol#7-23) has incorrect ERC721 function interface:ERC20.approve(address,uint256) (contracts/interfaces/ERC20Spec.sol#146)
BinanceAliERC20v2 (contracts/token/BinanceAliERC20v2.sol#1981-1997) has incorrect ERC721 function interface:AliERC20v2Base.transferFrom(address,address,uint256) (contracts/token/BinanceAliERC20v2.sol#879-904)
BinanceAliERC20v2 (contracts/token/BinanceAliERC20v2.sol#1981-1997) has incorrect ERC721 function interface:AliERC20v2Base.safeTransferFrom(address,address,uint256,bytes) (contracts/token/BinanceAliERC20v2.sol#933-944)
BinanceAliERC20v2 (contracts/token/BinanceAliERC20v2.sol#1981-1997) has incorrect ERC721 function interface:AliERC20v2Base.approve(address,uint256) (contracts/token/BinanceAliERC20v2.sol#1082-1088)
BinanceAliERC20v2 (contracts/token/BinanceAliERC20v2.sol#1981-1997) has incorrect ERC721 function interface:ERC20.transferFrom(address,address,uint256) (contracts/interfaces/ERC20Spec.sol#132)
BinanceAliERC20v2 (contracts/token/BinanceAliERC20v2.sol#1981-1997) has incorrect ERC721 function interface:ERC20.approve(address,uint256) (contracts/interfaces/ERC20Spec.sol#146)
PolygonAliERC20v2 (contracts/token/PolygonAliERC20v2.sol#17-55) has incorrect ERC721 function interface:AliERC20v2Base.transferFrom(address,address,uint256) (contracts/token/AliERC20v2.sol#880-905)
PolygonAliERC20v2 (contracts/token/PolygonAliERC20v2.sol#17-55) has incorrect ERC721 function interface:AliERC20v2Base.safeTransferFrom(address,address,uint256,bytes) (contracts/token/AliERC20v2.sol#934-945)
PolygonAliERC20v2 (contracts/token/PolygonAliERC20v2.sol#17-55) has incorrect ERC721 function interface:AliERC20v2Base.approve(address,uint256) (contracts/token/AliERC20v2.sol#1083-1089)
PolygonAliERC20v2 (contracts/token/PolygonAliERC20v2.sol#17-55) has incorrect ERC721 function interface:ERC20.transferFrom(address,address,uint256) (contracts/interfaces/ERC20Spec.sol#132)
PolygonAliERC20v2 (contracts/token/PolygonAliERC20v2.sol#17-55) has incorrect ERC721 function interface:ERC20.approve(address,uint256) (contracts/interfaces/ERC20Spec.sol#146)
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#incorrect-erc721-interface
INFO:Detectors:
AliERC20v2Base.__updateHistory(AliERC20v2Base.KV[],function(uint256,uint256) returns(uint256),uint256) (contracts/token/AliERC20v2.sol#1834-1854) uses a dangerous strict equality:
	- _h.length != 0 && _h[_h.length - 1].k == block.number (contracts/token/AliERC20v2.sol#1845)
CharacterERC20.__updateHistory(CharacterERC20.KV[],function(uint256,uint256) returns(uint256),uint256) (contracts/token/CharacterERC20.sol#1878-1898) uses a dangerous strict equality:
	- _h.length != 0 && _h[_h.length - 1].k == block.number (contracts/token/CharacterERC20.sol#1889)
AliERC20v2Base.__updateHistory(AliERC20v2Base.KV[],function(uint256,uint256) returns(uint256),uint256) (contracts/token/BinanceAliERC20v2.sol#1839-1859) uses a dangerous strict equality:
	- _h.length != 0 && _h[_h.length - 1].k == block.number (contracts/token/BinanceAliERC20v2.sol#1850)
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#dangerous-strict-equalities
INFO:Detectors:
Contract locking ether found:
	Contract ZeppelinERC20Mock (contracts/mocks/ZeppelinERC20Mock.sol#7-37) has payable functions:
	 - ZeppelinERC20Mock.constructor() (contracts/mocks/ZeppelinERC20Mock.sol#8)
	But does not have a function to withdraw the ether
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#contracts-that-lock-ether
INFO:Detectors:
Reentrancy in AliCompMock.__delegate_transfer_transfer(address,address,uint256) (contracts/mocks/AliCompMock.sol#11-15):
	External calls:
	- transfer(a2,val) (contracts/mocks/AliCompMock.sol#13)
		- response = ERC1363Receiver(_to).onTransferReceived(msg.sender,_from,_value,_data) (contracts/token/AliERC20v2.sol#782)
	- transfer(a2,val) (contracts/mocks/AliCompMock.sol#14)
		- response = ERC1363Receiver(_to).onTransferReceived(msg.sender,_from,_value,_data) (contracts/token/AliERC20v2.sol#782)
	State variables written after the call(s):
	- transfer(a2,val) (contracts/mocks/AliCompMock.sol#14)
		- tokenBalances[_from] -= _value (contracts/token/AliERC20v2.sol#1054)
		- tokenBalances[_to] += _value (contracts/token/AliERC20v2.sol#1057)
	AliERC20v2Base.tokenBalances (contracts/token/AliERC20v2.sol#185) can be used in cross function reentrancies:
	- AliERC20v2Base.__delegate(address,address) (contracts/token/AliERC20v2.sol#1730-1745)
	- AliERC20v2Base.__transferFrom(address,address,address,uint256) (contracts/token/AliERC20v2.sol#990-1067)
	- AliERC20v2Base.balanceOf(address) (contracts/token/AliERC20v2.sol#823-826)
	- AliERC20v2Base.burn(address,uint256) (contracts/token/AliERC20v2.sol#1271-1342)
	- AliERC20v2Base.mint(address,uint256) (contracts/token/AliERC20v2.sol#1215-1253)
	- AliERC20v2Base.mint(address,uint256) (contracts/token/AliERC20v2.sol#1215-1253)
	- transfer(a2,val) (contracts/mocks/AliCompMock.sol#14)
		- transferAllowances[_from][_by] = _allowance (contracts/token/AliERC20v2.sol#1039)
	AliERC20v2Base.transferAllowances (contracts/token/AliERC20v2.sol#275) can be used in cross function reentrancies:
	- AliERC20v2Base.__approve(address,address,uint256) (contracts/token/AliERC20v2.sol#1106-1123)
	- AliERC20v2Base.__transferFrom(address,address,address,uint256) (contracts/token/AliERC20v2.sol#990-1067)
	- AliERC20v2Base.allowance(address,address) (contracts/token/AliERC20v2.sol#1138-1141)
	- AliERC20v2Base.burn(address,uint256) (contracts/token/AliERC20v2.sol#1271-1342)
	- AliERC20v2Base.decreaseAllowance(address,uint256) (contracts/token/AliERC20v2.sol#1185-1197)
	- AliERC20v2Base.increaseAllowance(address,uint256) (contracts/token/AliERC20v2.sol#1159-1171)
Reentrancy in CharacterCompMock.__delegate_transfer_transfer(address,address,uint256) (contracts/mocks/CharacterCompMock.sol#11-15):
	External calls:
	- transfer(a2,val) (contracts/mocks/CharacterCompMock.sol#13)
		- response = ERC1363Receiver(_to).onTransferReceived(msg.sender,_from,_value,_data) (contracts/token/CharacterERC20.sol#800)
	- transfer(a2,val) (contracts/mocks/CharacterCompMock.sol#14)
		- response = ERC1363Receiver(_to).onTransferReceived(msg.sender,_from,_value,_data) (contracts/token/CharacterERC20.sol#800)
	State variables written after the call(s):
	- transfer(a2,val) (contracts/mocks/CharacterCompMock.sol#14)
		- tokenBalances[_from] -= _value (contracts/token/CharacterERC20.sol#1072)
		- tokenBalances[_to] += _value (contracts/token/CharacterERC20.sol#1075)
	CharacterERC20.tokenBalances (contracts/token/CharacterERC20.sol#174) can be used in cross function reentrancies:
	- CharacterERC20.__delegate(address,address) (contracts/token/CharacterERC20.sol#1774-1789)
	- CharacterERC20.__transferFrom(address,address,address,uint256) (contracts/token/CharacterERC20.sol#1008-1085)
	- CharacterERC20.balanceOf(address) (contracts/token/CharacterERC20.sol#841-844)
	- CharacterERC20.burn(address,uint256) (contracts/token/CharacterERC20.sol#1289-1360)
	- CharacterERC20.mint(address,uint256) (contracts/token/CharacterERC20.sol#1233-1271)
	- transfer(a2,val) (contracts/mocks/CharacterCompMock.sol#14)
		- transferAllowances[_from][_by] = _allowance (contracts/token/CharacterERC20.sol#1057)
	CharacterERC20.transferAllowances (contracts/token/CharacterERC20.sol#264) can be used in cross function reentrancies:
	- CharacterERC20.__approve(address,address,uint256) (contracts/token/CharacterERC20.sol#1124-1141)
	- CharacterERC20.__transferFrom(address,address,address,uint256) (contracts/token/CharacterERC20.sol#1008-1085)
	- CharacterERC20.allowance(address,address) (contracts/token/CharacterERC20.sol#1156-1159)
	- CharacterERC20.burn(address,uint256) (contracts/token/CharacterERC20.sol#1289-1360)
	- CharacterERC20.decreaseAllowance(address,uint256) (contracts/token/CharacterERC20.sol#1203-1215)
	- CharacterERC20.increaseAllowance(address,uint256) (contracts/token/CharacterERC20.sol#1177-1189)
Reentrancy in FixedSupplySale.buySingleTo(address) (contracts/protocol/FixedSupplySale.sol#498-534):
	External calls:
	- ERC20(aliContract).transferFrom(aliSource,iNftContract,aliValue) (contracts/protocol/FixedSupplySale.sol#512)
	- MintableERC721(nftContract).safeMint(_to,nextId) (contracts/protocol/FixedSupplySale.sol#515)
	- MintableERC721(personalityContract).mint(iNftContract,nextId) (contracts/protocol/FixedSupplySale.sol#517)
	- IntelligentNFTv2(iNftContract).mint(nextId,aliValue,personalityContract,nextId,nftContract,nextId) (contracts/protocol/FixedSupplySale.sol#519)
	State variables written after the call(s):
	- nextId ++ (contracts/protocol/FixedSupplySale.sol#522)
	FixedSupplySale.nextId (contracts/protocol/FixedSupplySale.sol#56) can be used in cross function reentrancies:
	- FixedSupplySale.buySingleTo(address) (contracts/protocol/FixedSupplySale.sol#498-534)
	- FixedSupplySale.buyTo(address,uint32) (contracts/protocol/FixedSupplySale.sol#425-481)
	- FixedSupplySale.initialize(uint64,uint32,uint32,uint32,uint32,uint32,address,uint96) (contracts/protocol/FixedSupplySale.sol#338-403)
	- FixedSupplySale.isActive() (contracts/protocol/FixedSupplySale.sol#292-295)
	- FixedSupplySale.itemsOnSale() (contracts/protocol/FixedSupplySale.sol#259-263)
	- FixedSupplySale.nextId (contracts/protocol/FixedSupplySale.sol#56)
Reentrancy in MintableSale.buySingleTo(address) (contracts/protocol/MintableSale.sol#362-386):
	External calls:
	- MintableERC721(tokenContract).mint(_to,nextId) (contracts/protocol/MintableSale.sol#371)
	State variables written after the call(s):
	- nextId ++ (contracts/protocol/MintableSale.sol#374)
	MintableSale.nextId (contracts/protocol/MintableSale.sol#47) can be used in cross function reentrancies:
	- MintableSale.buySingleTo(address) (contracts/protocol/MintableSale.sol#362-386)
	- MintableSale.buyTo(address,uint32) (contracts/protocol/MintableSale.sol#316-345)
	- MintableSale.initialize(uint64,uint32,uint32,uint32,uint32,uint32) (contracts/protocol/MintableSale.sol#243-296)
	- MintableSale.isActive() (contracts/protocol/MintableSale.sol#203-206)
	- MintableSale.itemsOnSale() (contracts/protocol/MintableSale.sol#171-175)
	- MintableSale.nextId (contracts/protocol/MintableSale.sol#47)
Reentrancy in FixedSupplySale.buyTo(address,uint32) (contracts/protocol/FixedSupplySale.sol#425-481):
	External calls:
	- ERC20(aliContract).transferFrom(aliSource,iNftContract,_aliValue) (contracts/protocol/FixedSupplySale.sol#448)
	- MintableERC721(nftContract).safeMintBatch(_to,nextId,_amount) (contracts/protocol/FixedSupplySale.sol#452)
	- MintableERC721(personalityContract).mintBatch(iNftContract,nextId,_amount) (contracts/protocol/FixedSupplySale.sol#455)
	- IntelligentNFTv2(iNftContract).mintBatch(nextId,aliValue,personalityContract,nextId,nftContract,nextId,_amount) (contracts/protocol/FixedSupplySale.sol#458-466)
	State variables written after the call(s):
	- nextId += _amount (contracts/protocol/FixedSupplySale.sol#469)
	FixedSupplySale.nextId (contracts/protocol/FixedSupplySale.sol#56) can be used in cross function reentrancies:
	- FixedSupplySale.buySingleTo(address) (contracts/protocol/FixedSupplySale.sol#498-534)
	- FixedSupplySale.buyTo(address,uint32) (contracts/protocol/FixedSupplySale.sol#425-481)
	- FixedSupplySale.initialize(uint64,uint32,uint32,uint32,uint32,uint32,address,uint96) (contracts/protocol/FixedSupplySale.sol#338-403)
	- FixedSupplySale.isActive() (contracts/protocol/FixedSupplySale.sol#292-295)
	- FixedSupplySale.itemsOnSale() (contracts/protocol/FixedSupplySale.sol#259-263)
	- FixedSupplySale.nextId (contracts/protocol/FixedSupplySale.sol#56)
Reentrancy in MintableSale.buyTo(address,uint32) (contracts/protocol/MintableSale.sol#316-345):
	External calls:
	- MintableERC721(tokenContract).mintBatch(_to,nextId,_amount) (contracts/protocol/MintableSale.sol#330)
	State variables written after the call(s):
	- nextId += _amount (contracts/protocol/MintableSale.sol#333)
	MintableSale.nextId (contracts/protocol/MintableSale.sol#47) can be used in cross function reentrancies:
	- MintableSale.buySingleTo(address) (contracts/protocol/MintableSale.sol#362-386)
	- MintableSale.buyTo(address,uint32) (contracts/protocol/MintableSale.sol#316-345)
	- MintableSale.initialize(uint64,uint32,uint32,uint32,uint32,uint32) (contracts/protocol/MintableSale.sol#243-296)
	- MintableSale.isActive() (contracts/protocol/MintableSale.sol#203-206)
	- MintableSale.itemsOnSale() (contracts/protocol/MintableSale.sol#171-175)
	- MintableSale.nextId (contracts/protocol/MintableSale.sol#47)
Reentrancy in OpenSeaFactoryImpl.mint(uint256,address) (contracts/protocol/OpenSeaFactory.sol#330-345):
	External calls:
	- MintableERC721(nftContract).mint(_toAddress,currentTokenId[_optionId]) (contracts/protocol/OpenSeaFactory.sol#338)
	State variables written after the call(s):
	- currentTokenId[_optionId] ++ (contracts/protocol/OpenSeaFactory.sol#344)
	OpenSeaFactoryImpl.currentTokenId (contracts/protocol/OpenSeaFactory.sol#143) can be used in cross function reentrancies:
	- OpenSeaFactoryImpl.canMint(uint256) (contracts/protocol/OpenSeaFactory.sol#306-309)
	- OpenSeaFactoryImpl.constructor(address,address,uint32[]) (contracts/protocol/OpenSeaFactory.sol#214-253)
	- OpenSeaFactoryImpl.currentTokenId (contracts/protocol/OpenSeaFactory.sol#143)
	- OpenSeaFactoryImpl.mint(uint256,address) (contracts/protocol/OpenSeaFactory.sol#330-345)
Reentrancy in NFTStaking.stake(uint32) (contracts/protocol/NFTStaking.sol#185-219):
	External calls:
	- ERC721(targetContract).transferFrom(msg.sender,address(this),tokenId) (contracts/protocol/NFTStaking.sol#199)
	State variables written after the call(s):
	- tokenStakes[tokenId].push(StakeData(msg.sender,stakedOn,0)) (contracts/protocol/NFTStaking.sol#205-209)
	NFTStaking.tokenStakes (contracts/protocol/NFTStaking.sol#71) can be used in cross function reentrancies:
	- NFTStaking.isStaked(uint32) (contracts/protocol/NFTStaking.sol#171-177)
	- NFTStaking.numStakes(uint32) (contracts/protocol/NFTStaking.sol#147-150)
	- NFTStaking.stake(uint32) (contracts/protocol/NFTStaking.sol#185-219)
	- NFTStaking.tokenStakes (contracts/protocol/NFTStaking.sol#71)
	- NFTStaking.unstake(uint32) (contracts/protocol/NFTStaking.sol#241-266)
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#reentrancy-vulnerabilities-1
INFO:Detectors:
CharacterERC20.__moveVotingPower(address,address,address,uint256)._toVal_scope_2 (contracts/token/CharacterERC20.sol#1862) is a local variable never initialized
CharacterERC20Deployer.constructor(address).reason (contracts/token/CharacterERC20.sol#2080) is a local variable never initialized
CharacterERC20.__moveVotingPower(address,address,address,uint256)._fromVal_scope_1 (contracts/token/CharacterERC20.sol#1862) is a local variable never initialized
AliERC20v2Base.__moveVotingPower(address,address,address,uint256)._fromVal_scope_1 (contracts/token/AliERC20v2.sol#1818) is a local variable never initialized
AliERC20v2Base.__moveVotingPower(address,address,address,uint256)._toVal_scope_2 (contracts/token/AliERC20v2.sol#1818) is a local variable never initialized
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#uninitialized-local-variables
INFO:Detectors:
ERC721._checkOnERC721Received(address,address,uint256,bytes) (node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol#382-403) ignores return value by IERC721Receiver(to).onERC721Received(_msgSender(),from,tokenId,_data) (node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol#389-399)
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#unused-return
INFO:Detectors:
ZeppelinERC721Mock.constructor(string,string)._name (contracts/mocks/ZeppelinERC721Mock.sol#23) shadows:
	- ERC721._name (node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol#24) (state variable)
ZeppelinERC721Mock.constructor(string,string)._symbol (contracts/mocks/ZeppelinERC721Mock.sol#23) shadows:
	- ERC721._symbol (node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol#27) (state variable)
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#local-variable-shadowing
INFO:Detectors:
ProxyRegistryMock.setOwner(address)._owner (contracts/mocks/ProxyRegistryMock.sol#16) lacks a zero-check on :
		- owner = _owner (contracts/mocks/ProxyRegistryMock.sol#17)
RoyalERC721.transferOwnership(address)._owner (contracts/token/RoyalERC721.sol#189) lacks a zero-check on :
		- owner = _owner (contracts/token/RoyalERC721.sol#200)
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#missing-zero-address-validation
INFO:Detectors:
ShortERC721.safeMintBatch(address,uint256,uint256,bytes) (contracts/token/ShortERC721.sol#914-932) has external calls inside a loop: response = ERC721TokenReceiver(_to).onERC721Received(msg.sender,address(0),_tokenId + i,_data) (contracts/token/ShortERC721.sol#925)
TinyERC721.safeMintBatch(address,uint256,uint256,bytes) (contracts/token/TinyERC721.sol#914-932) has external calls inside a loop: response = ERC721TokenReceiver(_to).onERC721Received(msg.sender,address(0),_tokenId + i,_data) (contracts/token/TinyERC721.sol#925)
NFTStaking.stake(uint32) (contracts/protocol/NFTStaking.sol#185-219) has external calls inside a loop: require(bool,string)(ERC721(targetContract).ownerOf(tokenId) == msg.sender,access denied) (contracts/protocol/NFTStaking.sol#196)
NFTStaking.stake(uint32) (contracts/protocol/NFTStaking.sol#185-219) has external calls inside a loop: ERC721(targetContract).transferFrom(msg.sender,address(this),tokenId) (contracts/protocol/NFTStaking.sol#199)
NFTStaking.unstake(uint32) (contracts/protocol/NFTStaking.sol#241-266) has external calls inside a loop: ERC721(targetContract).transferFrom(address(this),msg.sender,tokenId) (contracts/protocol/NFTStaking.sol#262)
ERC721._checkOnERC721Received(address,address,uint256,bytes) (node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol#382-403) has external calls inside a loop: IERC721Receiver(to).onERC721Received(_msgSender(),from,tokenId,_data) (node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol#389-399)
IntelligentNFTv2.mintBatch(uint256,uint96,address,uint96,address,uint256,uint96) (contracts/protocol/IntelligentNFTv2.sol#590-673) has external calls inside a loop: require(bool,string)(ERC721(personalityContract).ownerOf(personalityId + i) == address(this),personality is not yet transferred) (contracts/protocol/IntelligentNFTv2.sol#620)
IntelligentNFTv2.mintBatch(uint256,uint96,address,uint96,address,uint256,uint96) (contracts/protocol/IntelligentNFTv2.sol#590-673) has external calls inside a loop: owner = ERC721(targetContract).ownerOf(targetId + i) (contracts/protocol/IntelligentNFTv2.sol#623)
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation/#calls-inside-a-loop
INFO:Detectors:
Reentrancy in IntelligentNFTv2.burn(uint256) (contracts/protocol/IntelligentNFTv2.sol#693-745):
	External calls:
	- ERC721(binding.personalityContract).safeTransferFrom(address(this),owner,binding.personalityId) (contracts/protocol/IntelligentNFTv2.sol#723)
	State variables written after the call(s):
	- aliBalance -= binding.aliValue (contracts/protocol/IntelligentNFTv2.sol#728)
Reentrancy in FixedSupplySale.buySingleTo(address) (contracts/protocol/FixedSupplySale.sol#498-534):
	External calls:
	- ERC20(aliContract).transferFrom(aliSource,iNftContract,aliValue) (contracts/protocol/FixedSupplySale.sol#512)
	- MintableERC721(nftContract).safeMint(_to,nextId) (contracts/protocol/FixedSupplySale.sol#515)
	- MintableERC721(personalityContract).mint(iNftContract,nextId) (contracts/protocol/FixedSupplySale.sol#517)
	- IntelligentNFTv2(iNftContract).mint(nextId,aliValue,personalityContract,nextId,nftContract,nextId) (contracts/protocol/FixedSupplySale.sol#519)
	State variables written after the call(s):
	- soldCounter ++ (contracts/protocol/FixedSupplySale.sol#524)
Reentrancy in MintableSale.buySingleTo(address) (contracts/protocol/MintableSale.sol#362-386):
	External calls:
	- MintableERC721(tokenContract).mint(_to,nextId) (contracts/protocol/MintableSale.sol#371)
	State variables written after the call(s):
	- soldCounter ++ (contracts/protocol/MintableSale.sol#376)
Reentrancy in FixedSupplySale.buyTo(address,uint32) (contracts/protocol/FixedSupplySale.sol#425-481):
	External calls:
	- ERC20(aliContract).transferFrom(aliSource,iNftContract,_aliValue) (contracts/protocol/FixedSupplySale.sol#448)
	- MintableERC721(nftContract).safeMintBatch(_to,nextId,_amount) (contracts/protocol/FixedSupplySale.sol#452)
	- MintableERC721(personalityContract).mintBatch(iNftContract,nextId,_amount) (contracts/protocol/FixedSupplySale.sol#455)
	- IntelligentNFTv2(iNftContract).mintBatch(nextId,aliValue,personalityContract,nextId,nftContract,nextId,_amount) (contracts/protocol/FixedSupplySale.sol#458-466)
	State variables written after the call(s):
	- soldCounter += _amount (contracts/protocol/FixedSupplySale.sol#471)
Reentrancy in MintableSale.buyTo(address,uint32) (contracts/protocol/MintableSale.sol#316-345):
	External calls:
	- MintableERC721(tokenContract).mintBatch(_to,nextId,_amount) (contracts/protocol/MintableSale.sol#330)
	State variables written after the call(s):
	- soldCounter += _amount (contracts/protocol/MintableSale.sol#335)
Reentrancy in NFTStaking.stake(uint32) (contracts/protocol/NFTStaking.sol#185-219):
	External calls:
	- ERC721(targetContract).transferFrom(msg.sender,address(this),tokenId) (contracts/protocol/NFTStaking.sol#199)
	State variables written after the call(s):
	- userStakes[msg.sender].push(StakeIndex(tokenId,uint32(n))) (contracts/protocol/NFTStaking.sol#212-215)
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#reentrancy-vulnerabilities-2
INFO:Detectors:
Reentrancy in AliCompMock.__delegate_transfer_transfer(address,address,uint256) (contracts/mocks/AliCompMock.sol#11-15):
	External calls:
	- transfer(a2,val) (contracts/mocks/AliCompMock.sol#13)
		- response = ERC1363Receiver(_to).onTransferReceived(msg.sender,_from,_value,_data) (contracts/token/AliERC20v2.sol#782)
	- transfer(a2,val) (contracts/mocks/AliCompMock.sol#14)
		- response = ERC1363Receiver(_to).onTransferReceived(msg.sender,_from,_value,_data) (contracts/token/AliERC20v2.sol#782)
	Event emitted after the call(s):
	- Approval(_from,_by,_allowance + _value,_allowance) (contracts/token/AliERC20v2.sol#1042)
		- transfer(a2,val) (contracts/mocks/AliCompMock.sol#14)
	- Approval(_from,_by,_allowance) (contracts/token/AliERC20v2.sol#1045)
		- transfer(a2,val) (contracts/mocks/AliCompMock.sol#14)
	- Transfer(_from,_to,_value) (contracts/token/AliERC20v2.sol#1016)
		- transfer(a2,val) (contracts/mocks/AliCompMock.sol#14)
	- Transfer(_by,_from,_to,_value) (contracts/token/AliERC20v2.sol#1063)
		- transfer(a2,val) (contracts/mocks/AliCompMock.sol#14)
	- Transfer(_from,_to,_value) (contracts/token/AliERC20v2.sol#1066)
		- transfer(a2,val) (contracts/mocks/AliCompMock.sol#14)
	- VotingPowerChanged(_by,_from,_fromVal,_toVal) (contracts/token/AliERC20v2.sol#1809)
		- transfer(a2,val) (contracts/mocks/AliCompMock.sol#14)
	- VotingPowerChanged(_by,_to,_fromVal_scope_1,_toVal_scope_2) (contracts/token/AliERC20v2.sol#1821)
		- transfer(a2,val) (contracts/mocks/AliCompMock.sol#14)
Reentrancy in CharacterCompMock.__delegate_transfer_transfer(address,address,uint256) (contracts/mocks/CharacterCompMock.sol#11-15):
	External calls:
	- transfer(a2,val) (contracts/mocks/CharacterCompMock.sol#13)
		- response = ERC1363Receiver(_to).onTransferReceived(msg.sender,_from,_value,_data) (contracts/token/CharacterERC20.sol#800)
	- transfer(a2,val) (contracts/mocks/CharacterCompMock.sol#14)
		- response = ERC1363Receiver(_to).onTransferReceived(msg.sender,_from,_value,_data) (contracts/token/CharacterERC20.sol#800)
	Event emitted after the call(s):
	- Approval(_from,_by,_allowance + _value,_allowance) (contracts/token/CharacterERC20.sol#1060)
		- transfer(a2,val) (contracts/mocks/CharacterCompMock.sol#14)
	- Approval(_from,_by,_allowance) (contracts/token/CharacterERC20.sol#1063)
		- transfer(a2,val) (contracts/mocks/CharacterCompMock.sol#14)
	- Transfer(_from,_to,_value) (contracts/token/CharacterERC20.sol#1034)
		- transfer(a2,val) (contracts/mocks/CharacterCompMock.sol#14)
	- Transfer(_by,_from,_to,_value) (contracts/token/CharacterERC20.sol#1081)
		- transfer(a2,val) (contracts/mocks/CharacterCompMock.sol#14)
	- Transfer(_from,_to,_value) (contracts/token/CharacterERC20.sol#1084)
		- transfer(a2,val) (contracts/mocks/CharacterCompMock.sol#14)
	- VotingPowerChanged(_by,_from,_fromVal,_toVal) (contracts/token/CharacterERC20.sol#1853)
		- transfer(a2,val) (contracts/mocks/CharacterCompMock.sol#14)
	- VotingPowerChanged(_by,_to,_fromVal_scope_1,_toVal_scope_2) (contracts/token/CharacterERC20.sol#1865)
		- transfer(a2,val) (contracts/mocks/CharacterCompMock.sol#14)
Reentrancy in NFTFactory.__mint(address,address,address,uint256) (contracts/protocol/NFTFactory.sol#161-175):
	External calls:
	- MintableERC721(_mintableErc721).safeMint(_to,_tokenId) (contracts/protocol/NFTFactory.sol#171)
	Event emitted after the call(s):
	- Minted(_mintableErc721,_to,_tokenId) (contracts/protocol/NFTFactory.sol#174)
Reentrancy in NFTFactoryV2.__mint(address,address,address,uint256) (contracts/protocol/NFTFactoryV2.sol#183-200):
	External calls:
	- MintableERC721(_targetErc721).safeMint(_to,_tokenId) (contracts/protocol/NFTFactoryV2.sol#196)
	Event emitted after the call(s):
	- Minted(_targetErc721,_to,_tokenId) (contracts/protocol/NFTFactoryV2.sol#199)
Reentrancy in NFTFactoryV3.__mint(address,address,address,uint256) (contracts/protocol/NFTFactoryV3.sol#222-242):
	External calls:
	- MintableERC721(_targetErc721).safeMint(_to,_tokenId) (contracts/protocol/NFTFactoryV3.sol#238)
	Event emitted after the call(s):
	- Minted(_targetErc721,_to,_tokenId) (contracts/protocol/NFTFactoryV3.sol#241)
Reentrancy in ERC1967UpgradeUpgradeable._upgradeToAndCallSecure(address,bytes,bool) (node_modules/@openzeppelin/contracts-upgradeable/proxy/ERC1967/ERC1967UpgradeUpgradeable.sol#87-115):
	External calls:
	- _functionDelegateCall(newImplementation,data) (node_modules/@openzeppelin/contracts-upgradeable/proxy/ERC1967/ERC1967UpgradeUpgradeable.sol#97)
		- (success,returndata) = target.delegatecall(data) (node_modules/@openzeppelin/contracts-upgradeable/proxy/ERC1967/ERC1967UpgradeUpgradeable.sol#212)
	- _functionDelegateCall(newImplementation,abi.encodeWithSignature(upgradeTo(address),oldImplementation)) (node_modules/@openzeppelin/contracts-upgradeable/proxy/ERC1967/ERC1967UpgradeUpgradeable.sol#105-108)
		- (success,returndata) = target.delegatecall(data) (node_modules/@openzeppelin/contracts-upgradeable/proxy/ERC1967/ERC1967UpgradeUpgradeable.sol#212)
	Event emitted after the call(s):
	- Upgraded(newImplementation) (node_modules/@openzeppelin/contracts-upgradeable/proxy/ERC1967/ERC1967UpgradeUpgradeable.sol#63)
		- _upgradeTo(newImplementation) (node_modules/@openzeppelin/contracts-upgradeable/proxy/ERC1967/ERC1967UpgradeUpgradeable.sol#113)
Reentrancy in IntelligentNFTv2.burn(uint256) (contracts/protocol/IntelligentNFTv2.sol#693-745):
	External calls:
	- ERC721(binding.personalityContract).safeTransferFrom(address(this),owner,binding.personalityId) (contracts/protocol/IntelligentNFTv2.sol#723)
	- ERC20(aliContract).transfer(owner,binding.aliValue) (contracts/protocol/IntelligentNFTv2.sol#731)
	Event emitted after the call(s):
	- Burnt(msg.sender,recordId,owner,binding.aliValue,binding.personalityContract,binding.personalityId,binding.targetContract,binding.targetId) (contracts/protocol/IntelligentNFTv2.sol#735-744)
Reentrancy in FixedSupplySale.buySingleTo(address) (contracts/protocol/FixedSupplySale.sol#498-534):
	External calls:
	- ERC20(aliContract).transferFrom(aliSource,iNftContract,aliValue) (contracts/protocol/FixedSupplySale.sol#512)
	- MintableERC721(nftContract).safeMint(_to,nextId) (contracts/protocol/FixedSupplySale.sol#515)
	- MintableERC721(personalityContract).mint(iNftContract,nextId) (contracts/protocol/FixedSupplySale.sol#517)
	- IntelligentNFTv2(iNftContract).mint(nextId,aliValue,personalityContract,nextId,nftContract,nextId) (contracts/protocol/FixedSupplySale.sol#519)
	External calls sending eth:
	- address(msg.sender).transfer(msg.value - itemPrice) (contracts/protocol/FixedSupplySale.sol#529)
	Event emitted after the call(s):
	- Bought(msg.sender,_to,1,aliValue,itemPrice) (contracts/protocol/FixedSupplySale.sol#533)
Reentrancy in MintableSale.buySingleTo(address) (contracts/protocol/MintableSale.sol#362-386):
	External calls:
	- MintableERC721(tokenContract).mint(_to,nextId) (contracts/protocol/MintableSale.sol#371)
	External calls sending eth:
	- address(msg.sender).transfer(msg.value - itemPrice) (contracts/protocol/MintableSale.sol#381)
	Event emitted after the call(s):
	- Bought(msg.sender,_to,1,itemPrice) (contracts/protocol/MintableSale.sol#385)
Reentrancy in FixedSupplySale.buyTo(address,uint32) (contracts/protocol/FixedSupplySale.sol#425-481):
	External calls:
	- ERC20(aliContract).transferFrom(aliSource,iNftContract,_aliValue) (contracts/protocol/FixedSupplySale.sol#448)
	- MintableERC721(nftContract).safeMintBatch(_to,nextId,_amount) (contracts/protocol/FixedSupplySale.sol#452)
	- MintableERC721(personalityContract).mintBatch(iNftContract,nextId,_amount) (contracts/protocol/FixedSupplySale.sol#455)
	- IntelligentNFTv2(iNftContract).mintBatch(nextId,aliValue,personalityContract,nextId,nftContract,nextId,_amount) (contracts/protocol/FixedSupplySale.sol#458-466)
	External calls sending eth:
	- address(msg.sender).transfer(msg.value - totalPrice) (contracts/protocol/FixedSupplySale.sol#476)
	Event emitted after the call(s):
	- Bought(msg.sender,_to,_amount,_aliValue,totalPrice) (contracts/protocol/FixedSupplySale.sol#480)
Reentrancy in MintableSale.buyTo(address,uint32) (contracts/protocol/MintableSale.sol#316-345):
	External calls:
	- MintableERC721(tokenContract).mintBatch(_to,nextId,_amount) (contracts/protocol/MintableSale.sol#330)
	External calls sending eth:
	- address(msg.sender).transfer(msg.value - totalPrice) (contracts/protocol/MintableSale.sol#340)
	Event emitted after the call(s):
	- Bought(msg.sender,_to,_amount,totalPrice) (contracts/protocol/MintableSale.sol#344)
Reentrancy in IntelligentNFTv2.decreaseAli(uint256,uint96,address) (contracts/protocol/IntelligentNFTv2.sol#804-832):
	External calls:
	- ERC20(aliContract).transfer(recipient,aliDelta) (contracts/protocol/IntelligentNFTv2.sol#828)
	Event emitted after the call(s):
	- Updated(msg.sender,owner,recordId,aliValue,aliValue - aliDelta) (contracts/protocol/IntelligentNFTv2.sol#831)
Reentrancy in CharacterERC20Deployer.deployCharacterERC20(address,uint256,string,string) (contracts/token/CharacterERC20.sol#2097-2125):
	External calls:
	- CharacterERC20(characterErc20ProxyAddress).postConstruct(_initialHolder,_initialSupply,_name,_symbol) (contracts/token/CharacterERC20.sol#2108)
	- AccessControl(characterErc20ProxyAddress).updateRole(msg.sender,type()(uint256).max) (contracts/token/CharacterERC20.sol#2112)
	- AccessControl(characterErc20ProxyAddress).updateRole(address(this),0) (contracts/token/CharacterERC20.sol#2114)
	Event emitted after the call(s):
	- ProxyDeployed(characterErc20ProxyAddress,characterErc20ImplAddress,_initialHolder,_initialSupply,_name,_symbol) (contracts/token/CharacterERC20.sol#2117-2124)
Reentrancy in IntelliLinker.deposit(uint256,uint96) (contracts/protocol/IntelliLinker.sol#361-397):
	External calls:
	- ERC20(aliContract).transferFrom(msg.sender,feeDestination,_linkFee) (contracts/protocol/IntelliLinker.sol#386)
	- ERC20(aliContract).transferFrom(msg.sender,iNftContract,_aliValue) (contracts/protocol/IntelliLinker.sol#390)
	- iNFT.increaseAli(iNftId,_aliValue) (contracts/protocol/IntelliLinker.sol#393)
	Event emitted after the call(s):
	- LinkUpdated(msg.sender,iNftId,int128(uint128(_aliValue)),_linkFee) (contracts/protocol/IntelliLinker.sol#396)
Reentrancy in IntelliLinkerV2.deposit(uint256,uint96) (contracts/protocol/IntelliLinkerV2.sol#397-433):
	External calls:
	- ERC20(aliContract).transferFrom(msg.sender,feeDestination,_linkFee) (contracts/protocol/IntelliLinkerV2.sol#422)
	- ERC20(aliContract).transferFrom(msg.sender,iNftContract,_aliValue) (contracts/protocol/IntelliLinkerV2.sol#426)
	- iNFT.increaseAli(iNftId,_aliValue) (contracts/protocol/IntelliLinkerV2.sol#429)
	Event emitted after the call(s):
	- LinkUpdated(msg.sender,iNftId,int128(uint128(_aliValue)),_linkFee) (contracts/protocol/IntelliLinkerV2.sol#432)
Reentrancy in IntelliLinkerV3.deposit(uint256,uint96) (contracts/protocol/IntelliLinkerV3.sol#382-418):
	External calls:
	- ERC20(aliContract).transferFrom(msg.sender,feeDestination,_linkFee) (contracts/protocol/IntelliLinkerV3.sol#407)
	- ERC20(aliContract).transferFrom(msg.sender,iNftContract,_aliValue) (contracts/protocol/IntelliLinkerV3.sol#411)
	- iNFT.increaseAli(iNftId,_aliValue) (contracts/protocol/IntelliLinkerV3.sol#414)
	Event emitted after the call(s):
	- LinkUpdated(msg.sender,iNftId,int128(uint128(_aliValue)),_linkFee) (contracts/protocol/IntelliLinkerV3.sol#417)
Reentrancy in IntelliLinker.link(uint96,address,uint256) (contracts/protocol/IntelliLinker.sol#263-292):
	External calls:
	- ERC20(aliContract).transferFrom(msg.sender,feeDestination,linkFee) (contracts/protocol/IntelliLinker.sol#275)
	- ERC20(aliContract).transferFrom(msg.sender,iNftContract,linkPrice - linkFee) (contracts/protocol/IntelliLinker.sol#281)
	- ERC721(personalityContract).transferFrom(msg.sender,iNftContract,personalityId) (contracts/protocol/IntelliLinker.sol#285)
	- IntelligentNFTv2(iNftContract).mint(nextId ++,linkPrice - linkFee,personalityContract,personalityId,targetContract,targetId) (contracts/protocol/IntelliLinker.sol#288)
	Event emitted after the call(s):
	- Linked(msg.sender,nextId - 1,linkPrice,linkFee,personalityContract,personalityId,targetContract,targetId) (contracts/protocol/IntelliLinker.sol#291)
Reentrancy in IntelliLinkerV2.link(uint96,address,uint256) (contracts/protocol/IntelliLinkerV2.sol#282-314):
	External calls:
	- ERC20(aliContract).transferFrom(msg.sender,feeDestination,linkFee) (contracts/protocol/IntelliLinkerV2.sol#297)
	- ERC20(aliContract).transferFrom(msg.sender,iNftContract,linkPrice - linkFee) (contracts/protocol/IntelliLinkerV2.sol#303)
	- ERC721(personalityContract).transferFrom(msg.sender,iNftContract,personalityId) (contracts/protocol/IntelliLinkerV2.sol#307)
	- IntelligentNFTv2(iNftContract).mint(nextId ++,linkPrice - linkFee,personalityContract,personalityId,targetContract,targetId) (contracts/protocol/IntelliLinkerV2.sol#310)
	Event emitted after the call(s):
	- Linked(msg.sender,nextId - 1,linkPrice,linkFee,personalityContract,personalityId,targetContract,targetId) (contracts/protocol/IntelliLinkerV2.sol#313)
Reentrancy in IntelliLinkerV3.link(uint96,address,uint256) (contracts/protocol/IntelliLinkerV3.sol#276-305):
	External calls:
	- ERC20(aliContract).transferFrom(msg.sender,feeDestination,linkFee) (contracts/protocol/IntelliLinkerV3.sol#288)
	- ERC20(aliContract).transferFrom(msg.sender,iNftContract,linkPrice - linkFee) (contracts/protocol/IntelliLinkerV3.sol#294)
	- ERC721(personalityContract).transferFrom(msg.sender,iNftContract,personalityId) (contracts/protocol/IntelliLinkerV3.sol#298)
	- IntelligentNFTv2(iNftContract).mint(nextId ++,linkPrice - linkFee,personalityContract,personalityId,targetContract,targetId) (contracts/protocol/IntelliLinkerV3.sol#301)
	Event emitted after the call(s):
	- Linked(msg.sender,nextId - 1,linkPrice,linkFee,personalityContract,personalityId,targetContract,targetId) (contracts/protocol/IntelliLinkerV3.sol#304)
Reentrancy in OpenSeaFactoryImpl.mint(uint256,address) (contracts/protocol/OpenSeaFactory.sol#330-345):
	External calls:
	- MintableERC721(nftContract).mint(_toAddress,currentTokenId[_optionId]) (contracts/protocol/OpenSeaFactory.sol#338)
	Event emitted after the call(s):
	- Minted(msg.sender,currentTokenId[_optionId],_toAddress) (contracts/protocol/OpenSeaFactory.sol#341)
Reentrancy in ERC721Drop.redeem(address,uint256,bytes32[]) (contracts/protocol/ERC721Drop.sol#167-179):
	External calls:
	- MintableERC721(targetContract).safeMint(_to,_tokenId) (contracts/protocol/ERC721Drop.sol#175)
	Event emitted after the call(s):
	- Redeemed(msg.sender,_to,_tokenId,_proof) (contracts/protocol/ERC721Drop.sol#178)
Reentrancy in NFTStaking.stake(uint32) (contracts/protocol/NFTStaking.sol#185-219):
	External calls:
	- ERC721(targetContract).transferFrom(msg.sender,address(this),tokenId) (contracts/protocol/NFTStaking.sol#199)
	Event emitted after the call(s):
	- Staked(msg.sender,tokenId,stakedOn) (contracts/protocol/NFTStaking.sol#218)
Reentrancy in IntelliLinker.unlink(uint256) (contracts/protocol/IntelliLinker.sol#303-318):
	External calls:
	- iNFT.burn(iNftId) (contracts/protocol/IntelliLinker.sol#314)
	Event emitted after the call(s):
	- Unlinked(msg.sender,iNftId) (contracts/protocol/IntelliLinker.sol#317)
Reentrancy in IntelliLinkerV2.unlink(uint256) (contracts/protocol/IntelliLinkerV2.sol#325-348):
	External calls:
	- iNFT.burn(iNftId) (contracts/protocol/IntelliLinkerV2.sol#344)
	Event emitted after the call(s):
	- Unlinked(msg.sender,iNftId) (contracts/protocol/IntelliLinkerV2.sol#347)
Reentrancy in IntelliLinkerV3.unlink(uint256) (contracts/protocol/IntelliLinkerV3.sol#316-336):
	External calls:
	- iNFT.burn(iNftId) (contracts/protocol/IntelliLinkerV3.sol#332)
	Event emitted after the call(s):
	- Unlinked(msg.sender,iNftId) (contracts/protocol/IntelliLinkerV3.sol#335)
Reentrancy in IntelliLinker.unlinkNFT(address,uint256) (contracts/protocol/IntelliLinker.sol#330-348):
	External calls:
	- iNFT.burn(iNftId) (contracts/protocol/IntelliLinker.sol#344)
	Event emitted after the call(s):
	- Unlinked(msg.sender,iNftId) (contracts/protocol/IntelliLinker.sol#347)
Reentrancy in IntelliLinkerV2.unlinkNFT(address,uint256) (contracts/protocol/IntelliLinkerV2.sol#360-384):
	External calls:
	- iNFT.burn(iNftId) (contracts/protocol/IntelliLinkerV2.sol#380)
	Event emitted after the call(s):
	- Unlinked(msg.sender,iNftId) (contracts/protocol/IntelliLinkerV2.sol#383)
Reentrancy in IntelliLinkerV3.unlinkNFT(address,uint256) (contracts/protocol/IntelliLinkerV3.sol#348-369):
	External calls:
	- iNFT.burn(iNftId) (contracts/protocol/IntelliLinkerV3.sol#365)
	Event emitted after the call(s):
	- Unlinked(msg.sender,iNftId) (contracts/protocol/IntelliLinkerV3.sol#368)
Reentrancy in NFTStaking.unstake(uint32) (contracts/protocol/NFTStaking.sol#241-266):
	External calls:
	- ERC721(targetContract).transferFrom(address(this),msg.sender,tokenId) (contracts/protocol/NFTStaking.sol#262)
	Event emitted after the call(s):
	- Unstaked(msg.sender,tokenId,unstakedOn) (contracts/protocol/NFTStaking.sol#265)
Reentrancy in IntelliLinker.withdraw(uint256,uint96) (contracts/protocol/IntelliLinker.sol#409-427):
	External calls:
	- iNFT.decreaseAli(iNftId,aliValue,msg.sender) (contracts/protocol/IntelliLinker.sol#423)
	Event emitted after the call(s):
	- LinkUpdated(msg.sender,iNftId,- int128(uint128(aliValue)),0) (contracts/protocol/IntelliLinker.sol#426)
Reentrancy in IntelliLinkerV2.withdraw(uint256,uint96) (contracts/protocol/IntelliLinkerV2.sol#445-463):
	External calls:
	- iNFT.decreaseAli(iNftId,aliValue,msg.sender) (contracts/protocol/IntelliLinkerV2.sol#459)
	Event emitted after the call(s):
	- LinkUpdated(msg.sender,iNftId,- int128(uint128(aliValue)),0) (contracts/protocol/IntelliLinkerV2.sol#462)
Reentrancy in IntelliLinkerV3.withdraw(uint256,uint96) (contracts/protocol/IntelliLinkerV3.sol#430-448):
	External calls:
	- iNFT.decreaseAli(iNftId,aliValue,msg.sender) (contracts/protocol/IntelliLinkerV3.sol#444)
	Event emitted after the call(s):
	- LinkUpdated(msg.sender,iNftId,- int128(uint128(aliValue)),0) (contracts/protocol/IntelliLinkerV3.sol#447)
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#reentrancy-vulnerabilities-3
INFO:Detectors:
FixedSupplySale.isActive() (contracts/protocol/FixedSupplySale.sol#292-295) uses timestamp for comparisons
	Dangerous comparisons:
	- itemPrice > 0 && nextId <= finalId && saleStart <= now256() && saleEnd > now256() (contracts/protocol/FixedSupplySale.sol#294)
MintableSale.isActive() (contracts/protocol/MintableSale.sol#203-206) uses timestamp for comparisons
	Dangerous comparisons:
	- itemPrice > 0 && nextId <= finalId && saleStart <= now256() && saleEnd > now256() (contracts/protocol/MintableSale.sol#205)
NFTFactory.mintWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32) (contracts/protocol/NFTFactory.sol#191-222) uses timestamp for comparisons
	Dangerous comparisons:
	- require(bool,string)(block.timestamp > _validAfter,signature not yet valid) (contracts/protocol/NFTFactory.sol#214)
	- require(bool,string)(block.timestamp < _validBefore,signature expired) (contracts/protocol/NFTFactory.sol#215)
NFTFactoryV2.mintWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32) (contracts/protocol/NFTFactoryV2.sol#216-247) uses timestamp for comparisons
	Dangerous comparisons:
	- require(bool,string)(block.timestamp > _validAfter,signature not yet valid) (contracts/protocol/NFTFactoryV2.sol#239)
	- require(bool,string)(block.timestamp < _validBefore,signature expired) (contracts/protocol/NFTFactoryV2.sol#240)
NFTFactoryV3.mintWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32) (contracts/protocol/NFTFactoryV3.sol#258-289) uses timestamp for comparisons
	Dangerous comparisons:
	- require(bool,string)(block.timestamp > _validAfter,signature not yet valid) (contracts/protocol/NFTFactoryV3.sol#281)
	- require(bool,string)(block.timestamp < _validBefore,signature expired) (contracts/protocol/NFTFactoryV3.sol#282)
AliERC20v2Base.permit(address,address,uint256,uint256,uint8,bytes32,bytes32) (contracts/token/AliERC20v2.sol#1385-1399) uses timestamp for comparisons
	Dangerous comparisons:
	- require(bool,string)(block.timestamp < _exp,signature expired) (contracts/token/AliERC20v2.sol#1395)
AliERC20v2Base.transferWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32) (contracts/token/AliERC20v2.sol#1439-1466) uses timestamp for comparisons
	Dangerous comparisons:
	- require(bool,string)(block.timestamp > _validAfter,signature not yet valid) (contracts/token/AliERC20v2.sol#1458)
	- require(bool,string)(block.timestamp < _validBefore,signature expired) (contracts/token/AliERC20v2.sol#1459)
AliERC20v2Base.receiveWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32) (contracts/token/AliERC20v2.sol#1486-1514) uses timestamp for comparisons
	Dangerous comparisons:
	- require(bool,string)(block.timestamp > _validAfter,signature not yet valid) (contracts/token/AliERC20v2.sol#1505)
	- require(bool,string)(block.timestamp < _validBefore,signature expired) (contracts/token/AliERC20v2.sol#1506)
AliERC20v2Base.delegateWithAuthorization(address,bytes32,uint256,uint8,bytes32,bytes32) (contracts/token/AliERC20v2.sol#1764-1779) uses timestamp for comparisons
	Dangerous comparisons:
	- require(bool,string)(block.timestamp < _exp,signature expired) (contracts/token/AliERC20v2.sol#1772)
AliERC20v2Base.permit(address,address,uint256,uint256,uint8,bytes32,bytes32) (contracts/token/BinanceAliERC20v2.sol#1390-1404) uses timestamp for comparisons
	Dangerous comparisons:
	- require(bool,string)(block.timestamp < _exp,signature expired) (contracts/token/BinanceAliERC20v2.sol#1400)
AliERC20v2Base.transferWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32) (contracts/token/BinanceAliERC20v2.sol#1444-1471) uses timestamp for comparisons
	Dangerous comparisons:
	- require(bool,string)(block.timestamp > _validAfter,signature not yet valid) (contracts/token/BinanceAliERC20v2.sol#1463)
	- require(bool,string)(block.timestamp < _validBefore,signature expired) (contracts/token/BinanceAliERC20v2.sol#1464)
AliERC20v2Base.receiveWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32) (contracts/token/BinanceAliERC20v2.sol#1491-1519) uses timestamp for comparisons
	Dangerous comparisons:
	- require(bool,string)(block.timestamp > _validAfter,signature not yet valid) (contracts/token/BinanceAliERC20v2.sol#1510)
	- require(bool,string)(block.timestamp < _validBefore,signature expired) (contracts/token/BinanceAliERC20v2.sol#1511)
AliERC20v2Base.delegateWithAuthorization(address,bytes32,uint256,uint8,bytes32,bytes32) (contracts/token/BinanceAliERC20v2.sol#1769-1784) uses timestamp for comparisons
	Dangerous comparisons:
	- require(bool,string)(block.timestamp < _exp,signature expired) (contracts/token/BinanceAliERC20v2.sol#1777)
CharacterERC20.permit(address,address,uint256,uint256,uint8,bytes32,bytes32) (contracts/token/CharacterERC20.sol#1429-1443) uses timestamp for comparisons
	Dangerous comparisons:
	- require(bool,string)(block.timestamp < _exp,signature expired) (contracts/token/CharacterERC20.sol#1439)
CharacterERC20.transferWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32) (contracts/token/CharacterERC20.sol#1483-1510) uses timestamp for comparisons
	Dangerous comparisons:
	- require(bool,string)(block.timestamp > _validAfter,signature not yet valid) (contracts/token/CharacterERC20.sol#1502)
	- require(bool,string)(block.timestamp < _validBefore,signature expired) (contracts/token/CharacterERC20.sol#1503)
CharacterERC20.receiveWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32) (contracts/token/CharacterERC20.sol#1530-1558) uses timestamp for comparisons
	Dangerous comparisons:
	- require(bool,string)(block.timestamp > _validAfter,signature not yet valid) (contracts/token/CharacterERC20.sol#1549)
	- require(bool,string)(block.timestamp < _validBefore,signature expired) (contracts/token/CharacterERC20.sol#1550)
CharacterERC20.delegateWithAuthorization(address,bytes32,uint256,uint8,bytes32,bytes32) (contracts/token/CharacterERC20.sol#1808-1823) uses timestamp for comparisons
	Dangerous comparisons:
	- require(bool,string)(block.timestamp < _exp,signature expired) (contracts/token/CharacterERC20.sol#1816)
ShortERC721.permit(address,address,uint256,uint256,uint8,bytes32,bytes32) (contracts/token/ShortERC721.sol#756-770) uses timestamp for comparisons
	Dangerous comparisons:
	- require(bool,string)(block.timestamp < _exp,signature expired) (contracts/token/ShortERC721.sol#766)
ShortERC721.permitForAll(address,address,bool,uint256,uint8,bytes32,bytes32) (contracts/token/ShortERC721.sol#804-818) uses timestamp for comparisons
	Dangerous comparisons:
	- require(bool,string)(block.timestamp < _exp,signature expired) (contracts/token/ShortERC721.sol#814)
TinyERC721.permit(address,address,uint256,uint256,uint8,bytes32,bytes32) (contracts/token/TinyERC721.sol#756-770) uses timestamp for comparisons
	Dangerous comparisons:
	- require(bool,string)(block.timestamp < _exp,signature expired) (contracts/token/TinyERC721.sol#766)
TinyERC721.permitForAll(address,address,bool,uint256,uint8,bytes32,bytes32) (contracts/token/TinyERC721.sol#804-818) uses timestamp for comparisons
	Dangerous comparisons:
	- require(bool,string)(block.timestamp < _exp,signature expired) (contracts/token/TinyERC721.sol#814)
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#block-timestamp
INFO:Detectors:
AddressUpgradeable.isContract(address) (node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#27-37) uses assembly
	- INLINE ASM (node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#33-35)
AddressUpgradeable.verifyCallResult(bool,bytes,string) (node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#169-189) uses assembly
	- INLINE ASM (node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#181-184)
StorageSlotUpgradeable.getAddressSlot(bytes32) (node_modules/@openzeppelin/contracts-upgradeable/utils/StorageSlotUpgradeable.sol#52-56) uses assembly
	- INLINE ASM (node_modules/@openzeppelin/contracts-upgradeable/utils/StorageSlotUpgradeable.sol#53-55)
StorageSlotUpgradeable.getBooleanSlot(bytes32) (node_modules/@openzeppelin/contracts-upgradeable/utils/StorageSlotUpgradeable.sol#61-65) uses assembly
	- INLINE ASM (node_modules/@openzeppelin/contracts-upgradeable/utils/StorageSlotUpgradeable.sol#62-64)
StorageSlotUpgradeable.getBytes32Slot(bytes32) (node_modules/@openzeppelin/contracts-upgradeable/utils/StorageSlotUpgradeable.sol#70-74) uses assembly
	- INLINE ASM (node_modules/@openzeppelin/contracts-upgradeable/utils/StorageSlotUpgradeable.sol#71-73)
StorageSlotUpgradeable.getUint256Slot(bytes32) (node_modules/@openzeppelin/contracts-upgradeable/utils/StorageSlotUpgradeable.sol#79-83) uses assembly
	- INLINE ASM (node_modules/@openzeppelin/contracts-upgradeable/utils/StorageSlotUpgradeable.sol#80-82)
Clones.clone(address) (node_modules/@openzeppelin/contracts/proxy/Clones.sol#25-34) uses assembly
	- INLINE ASM (node_modules/@openzeppelin/contracts/proxy/Clones.sol#26-32)
Clones.cloneDeterministic(address,bytes32) (node_modules/@openzeppelin/contracts/proxy/Clones.sol#43-52) uses assembly
	- INLINE ASM (node_modules/@openzeppelin/contracts/proxy/Clones.sol#44-50)
Clones.predictDeterministicAddress(address,bytes32,address) (node_modules/@openzeppelin/contracts/proxy/Clones.sol#57-72) uses assembly
	- INLINE ASM (node_modules/@openzeppelin/contracts/proxy/Clones.sol#62-71)
ERC721._checkOnERC721Received(address,address,uint256,bytes) (node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol#382-403) uses assembly
	- INLINE ASM (node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol#395-397)
Address.isContract(address) (node_modules/@openzeppelin/contracts/utils/Address.sol#27-37) uses assembly
	- INLINE ASM (node_modules/@openzeppelin/contracts/utils/Address.sol#33-35)
Address.verifyCallResult(bool,bytes,string) (node_modules/@openzeppelin/contracts/utils/Address.sol#196-216) uses assembly
	- INLINE ASM (node_modules/@openzeppelin/contracts/utils/Address.sol#208-211)
AddressUtils.isContract(address) (contracts/lib/AddressUtils.sol#30-46) uses assembly
	- INLINE ASM (contracts/lib/AddressUtils.sol#39-42)
ArrayUtils.push32(uint32[],uint32,uint32) (contracts/lib/ArrayUtils.sol#32-98) uses assembly
	- INLINE ASM (contracts/lib/ArrayUtils.sol#35-97)
ECDSA.recover(bytes32,bytes) (contracts/lib/ECDSA.sol#32-65) uses assembly
	- INLINE ASM (contracts/lib/ECDSA.sol#44-48)
	- INLINE ASM (contracts/lib/ECDSA.sol#53-58)
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#assembly-usage
INFO:Detectors:
Different versions of Solidity are used:
	- Version used: ['^0.8.0', '^0.8.2', '^0.8.4']
	- ^0.8.0 (node_modules/@openzeppelin/contracts-upgradeable/proxy/beacon/IBeaconUpgradeable.sol#4)
	- ^0.8.0 (node_modules/@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol#4)
	- ^0.8.0 (node_modules/@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol#4)
	- ^0.8.0 (node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#4)
	- ^0.8.0 (node_modules/@openzeppelin/contracts-upgradeable/utils/StorageSlotUpgradeable.sol#4)
	- ^0.8.0 (node_modules/@openzeppelin/contracts/proxy/Clones.sol#4)
	- ^0.8.0 (node_modules/@openzeppelin/contracts/token/ERC1155/IERC1155.sol#4)
	- ^0.8.0 (node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol#4)
	- ^0.8.0 (node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol#4)
	- ^0.8.0 (node_modules/@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol#4)
	- ^0.8.0 (node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol#4)
	- ^0.8.0 (node_modules/@openzeppelin/contracts/token/ERC721/IERC721.sol#4)
	- ^0.8.0 (node_modules/@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol#4)
	- ^0.8.0 (node_modules/@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol#4)
	- ^0.8.0 (node_modules/@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol#4)
	- ^0.8.0 (node_modules/@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol#4)
	- ^0.8.0 (node_modules/@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol#4)
	- ^0.8.0 (node_modules/@openzeppelin/contracts/utils/Address.sol#4)
	- ^0.8.0 (node_modules/@openzeppelin/contracts/utils/Context.sol#4)
	- ^0.8.0 (node_modules/@openzeppelin/contracts/utils/Strings.sol#4)
	- ^0.8.0 (node_modules/@openzeppelin/contracts/utils/cryptography/MerkleProof.sol#4)
	- ^0.8.0 (node_modules/@openzeppelin/contracts/utils/introspection/ERC165.sol#4)
	- ^0.8.0 (node_modules/@openzeppelin/contracts/utils/introspection/IERC165.sol#4)
	- ^0.8.2 (node_modules/@openzeppelin/contracts-upgradeable/proxy/ERC1967/ERC1967UpgradeUpgradeable.sol#4)
	- ^0.8.4 (contracts/interfaces/EIP2612.sol#2)
	- ^0.8.4 (contracts/interfaces/EIP2981Spec.sol#2)
	- ^0.8.4 (contracts/interfaces/EIP3009.sol#2)
	- ^0.8.4 (contracts/interfaces/ERC1363Spec.sol#2)
	- ^0.8.4 (contracts/interfaces/ERC165Spec.sol#2)
	- ^0.8.4 (contracts/interfaces/ERC20Spec.sol#2)
	- ^0.8.4 (contracts/interfaces/ERC721Spec.sol#2)
	- ^0.8.4 (contracts/interfaces/ERC721SpecExt.sol#2)
	- ^0.8.4 (contracts/interfaces/ImmutableSpec.sol#2)
	- ^0.8.4 (contracts/interfaces/MaticSpec.sol#2)
	- ^0.8.4 (contracts/lib/AddressUtils.sol#2)
	- ^0.8.4 (contracts/lib/ArrayUtils.sol#2)
	- ^0.8.4 (contracts/lib/ECDSA.sol#2)
	- ^0.8.4 (contracts/lib/StringUtils.sol#2)
	- ^0.8.4 (contracts/mocks/AccessControlMocks.sol#2)
	- ^0.8.4 (contracts/mocks/AliCompMock.sol#2)
	- ^0.8.4 (contracts/mocks/ArrayBlockMock.sol#2)
	- ^0.8.4 (contracts/mocks/BurnableShortERC721Mock.sol#2)
	- ^0.8.4 (contracts/mocks/CharacterCompMock.sol#2)
	- ^0.8.4 (contracts/mocks/ERC1363Mock.sol#2)
	- ^0.8.4 (contracts/mocks/ERC165DenierMock.sol#2)
	- ^0.8.4 (contracts/mocks/ERC20InterfaceIdMock.sol#2)
	- ^0.8.4 (contracts/mocks/FixedSupplySaleMock.sol#2)
	- ^0.8.4 (contracts/mocks/LockableShortERC721Mock.sol#2)
	- ^0.8.4 (contracts/mocks/LockableTinyERC721Mock.sol#2)
	- ^0.8.4 (contracts/mocks/MintableSaleMock.sol#2)
	- ^0.8.4 (contracts/mocks/NFTStakingMock.sol#2)
	- ^0.8.4 (contracts/mocks/ProxyRegistryMock.sol#2)
	- ^0.8.4 (contracts/mocks/RoyalERC721Mock.sol#2)
	- ^0.8.4 (contracts/mocks/ShortERC721Mock.sol#2)
	- ^0.8.4 (contracts/mocks/TinyERC721Mock.sol#2)
	- ^0.8.4 (contracts/mocks/ZeppelinERC20Mock.sol#2)
	- ^0.8.4 (contracts/mocks/ZeppelinERC721Mock.sol#2)
	- ^0.8.4 (contracts/mocks/ZeppelinERC721ReceiverMock.sol#2)
	- ^0.8.4 (contracts/protocol/ERC721Drop.sol#2)
	- ^0.8.4 (contracts/protocol/FixedSupplySale.sol#2)
	- ^0.8.4 (contracts/protocol/IntelliLinker.sol#2)
	- ^0.8.4 (contracts/protocol/IntelliLinkerV2.sol#2)
	- ^0.8.4 (contracts/protocol/IntelliLinkerV3.sol#2)
	- ^0.8.4 (contracts/protocol/IntelligentNFTv2.sol#2)
	- ^0.8.4 (contracts/protocol/MintableSale.sol#2)
	- ^0.8.4 (contracts/protocol/NFTFactory.sol#2)
	- ^0.8.4 (contracts/protocol/NFTFactoryV2.sol#2)
	- ^0.8.4 (contracts/protocol/NFTFactoryV3.sol#2)
	- ^0.8.4 (contracts/protocol/NFTStaking.sol#2)
	- ^0.8.4 (contracts/protocol/OpenSeaFactory.sol#2)
	- ^0.8.4 (contracts/token/AletheaNFT.sol#2)
	- ^0.8.4 (contracts/token/AliERC20v2.sol#2)
	- ^0.8.4 (contracts/token/BinanceAliERC20v2.sol#2)
	- ^0.8.4 (contracts/token/BurnableShortERC721.sol#2)
	- ^0.8.4 (contracts/token/CharacterERC20.sol#2)
	- ^0.8.4 (contracts/token/PersonalityPodERC721.sol#2)
	- ^0.8.4 (contracts/token/PolygonAliERC20v2.sol#2)
	- ^0.8.4 (contracts/token/RoyalERC721.sol#2)
	- ^0.8.4 (contracts/token/ShortERC721.sol#2)
	- ^0.8.4 (contracts/token/TinyERC721.sol#2)
	- ^0.8.4 (contracts/token/WhitelabelNFT.sol#2)
	- ^0.8.4 (contracts/utils/AccessControl.sol#2)
	- ^0.8.4 (contracts/utils/UpgradeableAccessControl.sol#2)
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#different-pragma-directives-are-used
INFO:Detectors:
ERC721Enumerable._removeTokenFromAllTokensEnumeration(uint256) (node_modules/@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol#144-162) has costly operations inside a loop:
	- delete _allTokensIndex[tokenId] (node_modules/@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol#160)
ERC721Enumerable._removeTokenFromAllTokensEnumeration(uint256) (node_modules/@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol#144-162) has costly operations inside a loop:
	- _allTokens.pop() (node_modules/@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol#161)
ERC721Enumerable._removeTokenFromOwnerEnumeration(address,uint256) (node_modules/@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol#119-137) has costly operations inside a loop:
	- delete _ownedTokensIndex[tokenId] (node_modules/@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol#135)
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#costly-operations-inside-a-loop
INFO:Detectors:
AliERC20v2Base.add(uint256,uint256) (contracts/token/AliERC20v2.sol#1942-1945) is never used and should be removed
AliERC20v2Base.sub(uint256,uint256) (contracts/token/BinanceAliERC20v2.sol#1962-1965) is never used and should be removed
CharacterERC20.add(uint256,uint256) (contracts/token/CharacterERC20.sol#1986-1989) is never used and should be removed
CharacterERC20.sub(uint256,uint256) (contracts/token/CharacterERC20.sol#2001-2004) is never used and should be removed
ECDSA.recover(bytes32,bytes) (contracts/lib/ECDSA.sol#32-65) is never used and should be removed
ECDSA.toEthSignedMessageHash(bytes32) (contracts/lib/ECDSA.sol#107-111) is never used and should be removed
ECDSA.toTypedDataHash(bytes32,bytes32) (contracts/lib/ECDSA.sol#122-124) is never used and should be removed
StringUtils.atoi(string,uint8) (contracts/lib/StringUtils.sol#22-53) is never used and should be removed
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#dead-code
INFO:Detectors:
Pragma version^0.8.2 (node_modules/@openzeppelin/contracts-upgradeable/proxy/ERC1967/ERC1967UpgradeUpgradeable.sol#4) allows old versions
Pragma version^0.8.0 (node_modules/@openzeppelin/contracts-upgradeable/proxy/beacon/IBeaconUpgradeable.sol#4) allows old versions
Pragma version^0.8.0 (node_modules/@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol#4) allows old versions
Pragma version^0.8.0 (node_modules/@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol#4) allows old versions
Pragma version^0.8.0 (node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#4) allows old versions
Pragma version^0.8.0 (node_modules/@openzeppelin/contracts-upgradeable/utils/StorageSlotUpgradeable.sol#4) allows old versions
Pragma version^0.8.0 (node_modules/@openzeppelin/contracts/proxy/Clones.sol#4) allows old versions
Pragma version^0.8.0 (node_modules/@openzeppelin/contracts/token/ERC1155/IERC1155.sol#4) allows old versions
Pragma version^0.8.0 (node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol#4) allows old versions
Pragma version^0.8.0 (node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol#4) allows old versions
Pragma version^0.8.0 (node_modules/@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol#4) allows old versions
Pragma version^0.8.0 (node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol#4) allows old versions
Pragma version^0.8.0 (node_modules/@openzeppelin/contracts/token/ERC721/IERC721.sol#4) allows old versions
Pragma version^0.8.0 (node_modules/@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol#4) allows old versions
Pragma version^0.8.0 (node_modules/@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol#4) allows old versions
Pragma version^0.8.0 (node_modules/@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol#4) allows old versions
Pragma version^0.8.0 (node_modules/@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol#4) allows old versions
Pragma version^0.8.0 (node_modules/@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol#4) allows old versions
Pragma version^0.8.0 (node_modules/@openzeppelin/contracts/utils/Address.sol#4) allows old versions
Pragma version^0.8.0 (node_modules/@openzeppelin/contracts/utils/Context.sol#4) allows old versions
Pragma version^0.8.0 (node_modules/@openzeppelin/contracts/utils/Strings.sol#4) allows old versions
Pragma version^0.8.0 (node_modules/@openzeppelin/contracts/utils/cryptography/MerkleProof.sol#4) allows old versions
Pragma version^0.8.0 (node_modules/@openzeppelin/contracts/utils/introspection/ERC165.sol#4) allows old versions
Pragma version^0.8.0 (node_modules/@openzeppelin/contracts/utils/introspection/IERC165.sol#4) allows old versions
Pragma version^0.8.4 (contracts/interfaces/EIP2612.sol#2) allows old versions
Pragma version^0.8.4 (contracts/interfaces/EIP2981Spec.sol#2) allows old versions
Pragma version^0.8.4 (contracts/interfaces/EIP3009.sol#2) allows old versions
Pragma version^0.8.4 (contracts/interfaces/ERC1363Spec.sol#2) allows old versions
Pragma version^0.8.4 (contracts/interfaces/ERC165Spec.sol#2) allows old versions
Pragma version^0.8.4 (contracts/interfaces/ERC20Spec.sol#2) allows old versions
Pragma version^0.8.4 (contracts/interfaces/ERC721Spec.sol#2) allows old versions
Pragma version^0.8.4 (contracts/interfaces/ERC721SpecExt.sol#2) allows old versions
Pragma version^0.8.4 (contracts/interfaces/ImmutableSpec.sol#2) allows old versions
Pragma version^0.8.4 (contracts/interfaces/MaticSpec.sol#2) allows old versions
Pragma version^0.8.4 (contracts/lib/AddressUtils.sol#2) allows old versions
Pragma version^0.8.4 (contracts/lib/ArrayUtils.sol#2) allows old versions
Pragma version^0.8.4 (contracts/lib/ECDSA.sol#2) allows old versions
Pragma version^0.8.4 (contracts/lib/StringUtils.sol#2) allows old versions
Pragma version^0.8.4 (contracts/mocks/AccessControlMocks.sol#2) allows old versions
Pragma version^0.8.4 (contracts/mocks/AliCompMock.sol#2) allows old versions
Pragma version^0.8.4 (contracts/mocks/ArrayBlockMock.sol#2) allows old versions
Pragma version^0.8.4 (contracts/mocks/BurnableShortERC721Mock.sol#2) allows old versions
Pragma version^0.8.4 (contracts/mocks/CharacterCompMock.sol#2) allows old versions
Pragma version^0.8.4 (contracts/mocks/ERC1363Mock.sol#2) allows old versions
Pragma version^0.8.4 (contracts/mocks/ERC165DenierMock.sol#2) allows old versions
Pragma version^0.8.4 (contracts/mocks/ERC20InterfaceIdMock.sol#2) allows old versions
Pragma version^0.8.4 (contracts/mocks/FixedSupplySaleMock.sol#2) allows old versions
Pragma version^0.8.4 (contracts/mocks/LockableShortERC721Mock.sol#2) allows old versions
Pragma version^0.8.4 (contracts/mocks/LockableTinyERC721Mock.sol#2) allows old versions
Pragma version^0.8.4 (contracts/mocks/MintableSaleMock.sol#2) allows old versions
Pragma version^0.8.4 (contracts/mocks/NFTStakingMock.sol#2) allows old versions
Pragma version^0.8.4 (contracts/mocks/ProxyRegistryMock.sol#2) allows old versions
Pragma version^0.8.4 (contracts/mocks/RoyalERC721Mock.sol#2) allows old versions
Pragma version^0.8.4 (contracts/mocks/ShortERC721Mock.sol#2) allows old versions
Pragma version^0.8.4 (contracts/mocks/TinyERC721Mock.sol#2) allows old versions
Pragma version^0.8.4 (contracts/mocks/ZeppelinERC20Mock.sol#2) allows old versions
Pragma version^0.8.4 (contracts/mocks/ZeppelinERC721Mock.sol#2) allows old versions
Pragma version^0.8.4 (contracts/mocks/ZeppelinERC721ReceiverMock.sol#2) allows old versions
Pragma version^0.8.4 (contracts/protocol/ERC721Drop.sol#2) allows old versions
Pragma version^0.8.4 (contracts/protocol/FixedSupplySale.sol#2) allows old versions
Pragma version^0.8.4 (contracts/protocol/IntelliLinker.sol#2) allows old versions
Pragma version^0.8.4 (contracts/protocol/IntelliLinkerV2.sol#2) allows old versions
Pragma version^0.8.4 (contracts/protocol/IntelliLinkerV3.sol#2) allows old versions
Pragma version^0.8.4 (contracts/protocol/IntelligentNFTv2.sol#2) allows old versions
Pragma version^0.8.4 (contracts/protocol/MintableSale.sol#2) allows old versions
Pragma version^0.8.4 (contracts/protocol/NFTFactory.sol#2) allows old versions
Pragma version^0.8.4 (contracts/protocol/NFTFactoryV2.sol#2) allows old versions
Pragma version^0.8.4 (contracts/protocol/NFTFactoryV3.sol#2) allows old versions
Pragma version^0.8.4 (contracts/protocol/NFTStaking.sol#2) allows old versions
Pragma version^0.8.4 (contracts/protocol/OpenSeaFactory.sol#2) allows old versions
Pragma version^0.8.4 (contracts/token/AletheaNFT.sol#2) allows old versions
Pragma version^0.8.4 (contracts/token/AliERC20v2.sol#2) allows old versions
Pragma version^0.8.4 (contracts/token/BinanceAliERC20v2.sol#2) allows old versions
Pragma version^0.8.4 (contracts/token/BurnableShortERC721.sol#2) allows old versions
Pragma version^0.8.4 (contracts/token/CharacterERC20.sol#2) allows old versions
Pragma version^0.8.4 (contracts/token/PersonalityPodERC721.sol#2) allows old versions
Pragma version^0.8.4 (contracts/token/PolygonAliERC20v2.sol#2) allows old versions
Pragma version^0.8.4 (contracts/token/RoyalERC721.sol#2) allows old versions
Pragma version^0.8.4 (contracts/token/ShortERC721.sol#2) allows old versions
Pragma version^0.8.4 (contracts/token/TinyERC721.sol#2) allows old versions
Pragma version^0.8.4 (contracts/token/WhitelabelNFT.sol#2) allows old versions
Pragma version^0.8.4 (contracts/utils/AccessControl.sol#2) allows old versions
Pragma version^0.8.4 (contracts/utils/UpgradeableAccessControl.sol#2) allows old versions
solc-0.8.15 is not recommended for deployment
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#incorrect-versions-of-solidity
INFO:Detectors:
Low level call in ERC1967UpgradeUpgradeable._functionDelegateCall(address,bytes) (node_modules/@openzeppelin/contracts-upgradeable/proxy/ERC1967/ERC1967UpgradeUpgradeable.sol#208-214):
	- (success,returndata) = target.delegatecall(data) (node_modules/@openzeppelin/contracts-upgradeable/proxy/ERC1967/ERC1967UpgradeUpgradeable.sol#212)
Low level call in AddressUpgradeable.sendValue(address,uint256) (node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#55-60):
	- (success) = recipient.call{value: amount}() (node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#58)
Low level call in AddressUpgradeable.functionCallWithValue(address,bytes,uint256,string) (node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#123-134):
	- (success,returndata) = target.call{value: value}(data) (node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#132)
Low level call in AddressUpgradeable.functionStaticCall(address,bytes,string) (node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#152-161):
	- (success,returndata) = target.staticcall(data) (node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#159)
Low level call in Address.sendValue(address,uint256) (node_modules/@openzeppelin/contracts/utils/Address.sol#55-60):
	- (success) = recipient.call{value: amount}() (node_modules/@openzeppelin/contracts/utils/Address.sol#58)
Low level call in Address.functionCallWithValue(address,bytes,uint256,string) (node_modules/@openzeppelin/contracts/utils/Address.sol#123-134):
	- (success,returndata) = target.call{value: value}(data) (node_modules/@openzeppelin/contracts/utils/Address.sol#132)
Low level call in Address.functionStaticCall(address,bytes,string) (node_modules/@openzeppelin/contracts/utils/Address.sol#152-161):
	- (success,returndata) = target.staticcall(data) (node_modules/@openzeppelin/contracts/utils/Address.sol#159)
Low level call in Address.functionDelegateCall(address,bytes,string) (node_modules/@openzeppelin/contracts/utils/Address.sol#179-188):
	- (success,returndata) = target.delegatecall(data) (node_modules/@openzeppelin/contracts/utils/Address.sol#186)
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#low-level-calls
INFO:Detectors:
ERC165DenierMock (contracts/mocks/ERC165DenierMock.sol#11-18) should inherit from IERC165 (node_modules/@openzeppelin/contracts/utils/introspection/IERC165.sol#15-25)
ZeppelinERC20Mock (contracts/mocks/ZeppelinERC20Mock.sol#7-37) should inherit from IERC165 (node_modules/@openzeppelin/contracts/utils/introspection/IERC165.sol#15-25)
ZeppelinERC20Mock (contracts/mocks/ZeppelinERC20Mock.sol#7-37) should inherit from MaticMintableERC20 (contracts/interfaces/MaticSpec.sol#25-34)
ZeppelinERC721Mock (contracts/mocks/ZeppelinERC721Mock.sol#16-124) should inherit from IntelligentNFTv2Spec (contracts/protocol/IntelligentNFTv2.sol#22-64)
IntelligentNFTv2 (contracts/protocol/IntelligentNFTv2.sol#94-850) should inherit from BurnableERC721 (contracts/interfaces/ERC721SpecExt.sol#138-148)
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#missing-inheritance
INFO:Detectors:
Function ERC1967UpgradeUpgradeable.__ERC1967Upgrade_init() (node_modules/@openzeppelin/contracts-upgradeable/proxy/ERC1967/ERC1967UpgradeUpgradeable.sol#20-22) is not in mixedCase
Function ERC1967UpgradeUpgradeable.__ERC1967Upgrade_init_unchained() (node_modules/@openzeppelin/contracts-upgradeable/proxy/ERC1967/ERC1967UpgradeUpgradeable.sol#24-25) is not in mixedCase
Variable ERC1967UpgradeUpgradeable.__gap (node_modules/@openzeppelin/contracts-upgradeable/proxy/ERC1967/ERC1967UpgradeUpgradeable.sol#215) is not in mixedCase
Function UUPSUpgradeable.__UUPSUpgradeable_init() (node_modules/@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol#22-25) is not in mixedCase
Function UUPSUpgradeable.__UUPSUpgradeable_init_unchained() (node_modules/@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol#27-28) is not in mixedCase
Variable UUPSUpgradeable.__self (node_modules/@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol#30) is not in mixedCase
Variable UUPSUpgradeable.__gap (node_modules/@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol#81) is not in mixedCase
Parameter ERC721.safeTransferFrom(address,address,uint256,bytes)._data (node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol#179) is not in mixedCase
Function EIP2612.DOMAIN_SEPARATOR() (contracts/interfaces/EIP2612.sol#21) is not in mixedCase
Function AliCompMock.__delegate_transfer_transfer(address,address,uint256) (contracts/mocks/AliCompMock.sol#11-15) is not in mixedCase
Function CharacterCompMock.__delegate_transfer_transfer(address,address,uint256) (contracts/mocks/CharacterCompMock.sol#11-15) is not in mixedCase
Parameter FixedSupplySaleMock.setStateOverride(bool)._value (contracts/mocks/FixedSupplySaleMock.sol#34) is not in mixedCase
Parameter FixedSupplySaleMock.setNow256(uint256)._value (contracts/mocks/FixedSupplySaleMock.sol#45) is not in mixedCase
Parameter LockableShortERC721Mock.setTransferable(uint256,bool)._tokenId (contracts/mocks/LockableShortERC721Mock.sol#18) is not in mixedCase
Parameter LockableShortERC721Mock.setTransferable(uint256,bool)._value (contracts/mocks/LockableShortERC721Mock.sol#18) is not in mixedCase
Parameter LockableShortERC721Mock.isTransferable(uint256)._tokenId (contracts/mocks/LockableShortERC721Mock.sol#25) is not in mixedCase
Parameter LockableTinyERC721Mock.setTransferable(uint256,bool)._tokenId (contracts/mocks/LockableTinyERC721Mock.sol#18) is not in mixedCase
Parameter LockableTinyERC721Mock.setTransferable(uint256,bool)._value (contracts/mocks/LockableTinyERC721Mock.sol#18) is not in mixedCase
Parameter LockableTinyERC721Mock.isTransferable(uint256)._tokenId (contracts/mocks/LockableTinyERC721Mock.sol#25) is not in mixedCase
Parameter MintableSaleMock.setStateOverride(bool)._value (contracts/mocks/MintableSaleMock.sol#33) is not in mixedCase
Parameter MintableSaleMock.setNow256(uint256)._value (contracts/mocks/MintableSaleMock.sol#44) is not in mixedCase
Parameter NFTStakingMock.setNow32(uint32)._value (contracts/mocks/NFTStakingMock.sol#21) is not in mixedCase
Parameter ProxyRegistryMock.setOwner(address)._owner (contracts/mocks/ProxyRegistryMock.sol#16) is not in mixedCase
Parameter ZeppelinERC721Mock.exists(uint256)._tokenId (contracts/mocks/ZeppelinERC721Mock.sol#28) is not in mixedCase
Parameter ZeppelinERC721Mock.mint(address,uint256)._to (contracts/mocks/ZeppelinERC721Mock.sol#36) is not in mixedCase
Parameter ZeppelinERC721Mock.mint(address,uint256)._tokenId (contracts/mocks/ZeppelinERC721Mock.sol#36) is not in mixedCase
Parameter ZeppelinERC721Mock.safeMint(address,uint256)._to (contracts/mocks/ZeppelinERC721Mock.sol#44) is not in mixedCase
Parameter ZeppelinERC721Mock.safeMint(address,uint256)._tokenId (contracts/mocks/ZeppelinERC721Mock.sol#44) is not in mixedCase
Parameter ZeppelinERC721Mock.safeMint(address,uint256,bytes)._to (contracts/mocks/ZeppelinERC721Mock.sol#52) is not in mixedCase
Parameter ZeppelinERC721Mock.safeMint(address,uint256,bytes)._tokenId (contracts/mocks/ZeppelinERC721Mock.sol#52) is not in mixedCase
Parameter ZeppelinERC721Mock.safeMint(address,uint256,bytes)._data (contracts/mocks/ZeppelinERC721Mock.sol#52) is not in mixedCase
Parameter ZeppelinERC721Mock.burn(uint256)._tokenId (contracts/mocks/ZeppelinERC721Mock.sol#60) is not in mixedCase
Parameter ZeppelinERC721Mock.mintBatch(address,uint256,uint256)._to (contracts/mocks/ZeppelinERC721Mock.sol#98) is not in mixedCase
Parameter ZeppelinERC721Mock.mintBatch(address,uint256,uint256)._tokenId (contracts/mocks/ZeppelinERC721Mock.sol#98) is not in mixedCase
Parameter ZeppelinERC721Mock.safeMintBatch(address,uint256,uint256)._to (contracts/mocks/ZeppelinERC721Mock.sol#109) is not in mixedCase
Parameter ZeppelinERC721Mock.safeMintBatch(address,uint256,uint256)._tokenId (contracts/mocks/ZeppelinERC721Mock.sol#109) is not in mixedCase
Parameter ZeppelinERC721Mock.safeMintBatch(address,uint256,uint256,bytes)._to (contracts/mocks/ZeppelinERC721Mock.sol#117) is not in mixedCase
Parameter ZeppelinERC721Mock.safeMintBatch(address,uint256,uint256,bytes)._tokenId (contracts/mocks/ZeppelinERC721Mock.sol#117) is not in mixedCase
Parameter ZeppelinERC721Mock.safeMintBatch(address,uint256,uint256,bytes)._data (contracts/mocks/ZeppelinERC721Mock.sol#117) is not in mixedCase
Parameter ERC721Drop.setInputDataRoot(bytes32)._root (contracts/protocol/ERC721Drop.sol#106) is not in mixedCase
Parameter ERC721Drop.isTokenValid(address,uint256,bytes32[])._to (contracts/protocol/ERC721Drop.sol#138) is not in mixedCase
Parameter ERC721Drop.isTokenValid(address,uint256,bytes32[])._tokenId (contracts/protocol/ERC721Drop.sol#138) is not in mixedCase
Parameter ERC721Drop.isTokenValid(address,uint256,bytes32[])._proof (contracts/protocol/ERC721Drop.sol#138) is not in mixedCase
Parameter ERC721Drop.redeem(address,uint256,bytes32[])._to (contracts/protocol/ERC721Drop.sol#167) is not in mixedCase
Parameter ERC721Drop.redeem(address,uint256,bytes32[])._tokenId (contracts/protocol/ERC721Drop.sol#167) is not in mixedCase
Parameter ERC721Drop.redeem(address,uint256,bytes32[])._proof (contracts/protocol/ERC721Drop.sol#167) is not in mixedCase
Parameter FixedSupplySale.initialize(uint64,uint32,uint32,uint32,uint32,uint32,address,uint96)._itemPrice (contracts/protocol/FixedSupplySale.sol#339) is not in mixedCase
Parameter FixedSupplySale.initialize(uint64,uint32,uint32,uint32,uint32,uint32,address,uint96)._nextId (contracts/protocol/FixedSupplySale.sol#340) is not in mixedCase
Parameter FixedSupplySale.initialize(uint64,uint32,uint32,uint32,uint32,uint32,address,uint96)._finalId (contracts/protocol/FixedSupplySale.sol#341) is not in mixedCase
Parameter FixedSupplySale.initialize(uint64,uint32,uint32,uint32,uint32,uint32,address,uint96)._saleStart (contracts/protocol/FixedSupplySale.sol#342) is not in mixedCase
Parameter FixedSupplySale.initialize(uint64,uint32,uint32,uint32,uint32,uint32,address,uint96)._saleEnd (contracts/protocol/FixedSupplySale.sol#343) is not in mixedCase
Parameter FixedSupplySale.initialize(uint64,uint32,uint32,uint32,uint32,uint32,address,uint96)._batchLimit (contracts/protocol/FixedSupplySale.sol#344) is not in mixedCase
Parameter FixedSupplySale.initialize(uint64,uint32,uint32,uint32,uint32,uint32,address,uint96)._aliSource (contracts/protocol/FixedSupplySale.sol#345) is not in mixedCase
Parameter FixedSupplySale.initialize(uint64,uint32,uint32,uint32,uint32,uint32,address,uint96)._aliValue (contracts/protocol/FixedSupplySale.sol#346) is not in mixedCase
Parameter FixedSupplySale.buy(uint32)._amount (contracts/protocol/FixedSupplySale.sol#412) is not in mixedCase
Parameter FixedSupplySale.buyTo(address,uint32)._to (contracts/protocol/FixedSupplySale.sol#425) is not in mixedCase
Parameter FixedSupplySale.buyTo(address,uint32)._amount (contracts/protocol/FixedSupplySale.sol#425) is not in mixedCase
Parameter FixedSupplySale.buySingleTo(address)._to (contracts/protocol/FixedSupplySale.sol#498) is not in mixedCase
Parameter FixedSupplySale.withdrawTo(address)._to (contracts/protocol/FixedSupplySale.sol#551) is not in mixedCase
Parameter IntelliLinker.updateLinkPrice(uint96,uint96,address)._linkPrice (contracts/protocol/IntelliLinker.sol#445) is not in mixedCase
Parameter IntelliLinker.updateLinkPrice(uint96,uint96,address)._linkFee (contracts/protocol/IntelliLinker.sol#445) is not in mixedCase
Parameter IntelliLinker.updateLinkPrice(uint96,uint96,address)._feeDestination (contracts/protocol/IntelliLinker.sol#445) is not in mixedCase
Parameter IntelliLinker.updateNextId(uint256)._nextId (contracts/protocol/IntelliLinker.sol#472) is not in mixedCase
Parameter IntelliLinkerV2.postConstruct(address,address,address)._ali (contracts/protocol/IntelliLinkerV2.sol#242) is not in mixedCase
Parameter IntelliLinkerV2.postConstruct(address,address,address)._personality (contracts/protocol/IntelliLinkerV2.sol#242) is not in mixedCase
Parameter IntelliLinkerV2.postConstruct(address,address,address)._iNft (contracts/protocol/IntelliLinkerV2.sol#242) is not in mixedCase
Parameter IntelliLinkerV2.updateLinkPrice(uint96,uint96,address)._linkPrice (contracts/protocol/IntelliLinkerV2.sol#481) is not in mixedCase
Parameter IntelliLinkerV2.updateLinkPrice(uint96,uint96,address)._linkFee (contracts/protocol/IntelliLinkerV2.sol#481) is not in mixedCase
Parameter IntelliLinkerV2.updateLinkPrice(uint96,uint96,address)._feeDestination (contracts/protocol/IntelliLinkerV2.sol#481) is not in mixedCase
Parameter IntelliLinkerV2.updateNextId(uint256)._nextId (contracts/protocol/IntelliLinkerV2.sol#508) is not in mixedCase
Parameter IntelliLinkerV3.updateLinkPrice(uint96,uint96,address)._linkPrice (contracts/protocol/IntelliLinkerV3.sol#466) is not in mixedCase
Parameter IntelliLinkerV3.updateLinkPrice(uint96,uint96,address)._linkFee (contracts/protocol/IntelliLinkerV3.sol#466) is not in mixedCase
Parameter IntelliLinkerV3.updateLinkPrice(uint96,uint96,address)._feeDestination (contracts/protocol/IntelliLinkerV3.sol#466) is not in mixedCase
Parameter IntelliLinkerV3.updateNextId(uint256)._nextId (contracts/protocol/IntelliLinkerV3.sol#493) is not in mixedCase
Parameter IntelligentNFTv2.setBaseURI(string)._baseURI (contracts/protocol/IntelligentNFTv2.sol#356) is not in mixedCase
Parameter IntelligentNFTv2.tokenURI(uint256)._recordId (contracts/protocol/IntelligentNFTv2.sol#374) is not in mixedCase
Parameter IntelligentNFTv2.setTokenURI(uint256,string)._tokenId (contracts/protocol/IntelligentNFTv2.sol#403) is not in mixedCase
Parameter IntelligentNFTv2.setTokenURI(uint256,string)._tokenURI (contracts/protocol/IntelligentNFTv2.sol#403) is not in mixedCase
Variable IntelligentNFTv2._tokenURIs (contracts/protocol/IntelligentNFTv2.sol#211) is not in mixedCase
Parameter MintableSale.initialize(uint64,uint32,uint32,uint32,uint32,uint32)._itemPrice (contracts/protocol/MintableSale.sol#244) is not in mixedCase
Parameter MintableSale.initialize(uint64,uint32,uint32,uint32,uint32,uint32)._nextId (contracts/protocol/MintableSale.sol#245) is not in mixedCase
Parameter MintableSale.initialize(uint64,uint32,uint32,uint32,uint32,uint32)._finalId (contracts/protocol/MintableSale.sol#246) is not in mixedCase
Parameter MintableSale.initialize(uint64,uint32,uint32,uint32,uint32,uint32)._saleStart (contracts/protocol/MintableSale.sol#247) is not in mixedCase
Parameter MintableSale.initialize(uint64,uint32,uint32,uint32,uint32,uint32)._saleEnd (contracts/protocol/MintableSale.sol#248) is not in mixedCase
Parameter MintableSale.initialize(uint64,uint32,uint32,uint32,uint32,uint32)._batchLimit (contracts/protocol/MintableSale.sol#249) is not in mixedCase
Parameter MintableSale.buy(uint32)._amount (contracts/protocol/MintableSale.sol#304) is not in mixedCase
Parameter MintableSale.buyTo(address,uint32)._to (contracts/protocol/MintableSale.sol#316) is not in mixedCase
Parameter MintableSale.buyTo(address,uint32)._amount (contracts/protocol/MintableSale.sol#316) is not in mixedCase
Parameter MintableSale.buySingleTo(address)._to (contracts/protocol/MintableSale.sol#362) is not in mixedCase
Parameter MintableSale.withdrawTo(address)._to (contracts/protocol/MintableSale.sol#403) is not in mixedCase
Parameter NFTFactory.mint(address,address,uint256)._mintableErc721 (contracts/protocol/NFTFactory.sol#137) is not in mixedCase
Parameter NFTFactory.mint(address,address,uint256)._to (contracts/protocol/NFTFactory.sol#137) is not in mixedCase
Parameter NFTFactory.mint(address,address,uint256)._tokenId (contracts/protocol/NFTFactory.sol#137) is not in mixedCase
Function NFTFactory.__mint(address,address,address,uint256) (contracts/protocol/NFTFactory.sol#161-175) is not in mixedCase
Parameter NFTFactory.__mint(address,address,address,uint256)._executor (contracts/protocol/NFTFactory.sol#161) is not in mixedCase
Parameter NFTFactory.__mint(address,address,address,uint256)._mintableErc721 (contracts/protocol/NFTFactory.sol#161) is not in mixedCase
Parameter NFTFactory.__mint(address,address,address,uint256)._to (contracts/protocol/NFTFactory.sol#161) is not in mixedCase
Parameter NFTFactory.__mint(address,address,address,uint256)._tokenId (contracts/protocol/NFTFactory.sol#161) is not in mixedCase
Parameter NFTFactory.mintWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)._mintableErc721 (contracts/protocol/NFTFactory.sol#192) is not in mixedCase
Parameter NFTFactory.mintWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)._to (contracts/protocol/NFTFactory.sol#193) is not in mixedCase
Parameter NFTFactory.mintWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)._tokenId (contracts/protocol/NFTFactory.sol#194) is not in mixedCase
Parameter NFTFactory.mintWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)._validAfter (contracts/protocol/NFTFactory.sol#195) is not in mixedCase
Parameter NFTFactory.mintWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)._validBefore (contracts/protocol/NFTFactory.sol#196) is not in mixedCase
Parameter NFTFactory.mintWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)._nonce (contracts/protocol/NFTFactory.sol#197) is not in mixedCase
Parameter NFTFactory.authorizationState(address,bytes32)._authorizer (contracts/protocol/NFTFactory.sol#236) is not in mixedCase
Parameter NFTFactory.authorizationState(address,bytes32)._nonce (contracts/protocol/NFTFactory.sol#237) is not in mixedCase
Parameter NFTFactory.cancelAuthorization(address,bytes32,uint8,bytes32,bytes32)._authorizer (contracts/protocol/NFTFactory.sol#253) is not in mixedCase
Parameter NFTFactory.cancelAuthorization(address,bytes32,uint8,bytes32,bytes32)._nonce (contracts/protocol/NFTFactory.sol#254) is not in mixedCase
Parameter NFTFactory.cancelAuthorization(bytes32)._nonce (contracts/protocol/NFTFactory.sol#274) is not in mixedCase
Function NFTFactory.__deriveSigner(bytes,uint8,bytes32,bytes32) (contracts/protocol/NFTFactory.sol#287-299) is not in mixedCase
Function NFTFactory.__useNonce(address,bytes32,bool) (contracts/protocol/NFTFactory.sol#317-333) is not in mixedCase
Parameter NFTFactory.__useNonce(address,bytes32,bool)._authorizer (contracts/protocol/NFTFactory.sol#317) is not in mixedCase
Parameter NFTFactory.__useNonce(address,bytes32,bool)._nonce (contracts/protocol/NFTFactory.sol#317) is not in mixedCase
Parameter NFTFactory.__useNonce(address,bytes32,bool)._cancellation (contracts/protocol/NFTFactory.sol#317) is not in mixedCase
Variable NFTFactory.DOMAIN_SEPARATOR (contracts/protocol/NFTFactory.sol#44) is not in mixedCase
Parameter NFTFactoryV2.mint(address,address,uint256)._targetErc721 (contracts/protocol/NFTFactoryV2.sol#159) is not in mixedCase
Parameter NFTFactoryV2.mint(address,address,uint256)._to (contracts/protocol/NFTFactoryV2.sol#159) is not in mixedCase
Parameter NFTFactoryV2.mint(address,address,uint256)._tokenId (contracts/protocol/NFTFactoryV2.sol#159) is not in mixedCase
Function NFTFactoryV2.__mint(address,address,address,uint256) (contracts/protocol/NFTFactoryV2.sol#183-200) is not in mixedCase
Parameter NFTFactoryV2.__mint(address,address,address,uint256)._executor (contracts/protocol/NFTFactoryV2.sol#183) is not in mixedCase
Parameter NFTFactoryV2.__mint(address,address,address,uint256)._targetErc721 (contracts/protocol/NFTFactoryV2.sol#183) is not in mixedCase
Parameter NFTFactoryV2.__mint(address,address,address,uint256)._to (contracts/protocol/NFTFactoryV2.sol#183) is not in mixedCase
Parameter NFTFactoryV2.__mint(address,address,address,uint256)._tokenId (contracts/protocol/NFTFactoryV2.sol#183) is not in mixedCase
Parameter NFTFactoryV2.mintWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)._targetErc721 (contracts/protocol/NFTFactoryV2.sol#217) is not in mixedCase
Parameter NFTFactoryV2.mintWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)._to (contracts/protocol/NFTFactoryV2.sol#218) is not in mixedCase
Parameter NFTFactoryV2.mintWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)._tokenId (contracts/protocol/NFTFactoryV2.sol#219) is not in mixedCase
Parameter NFTFactoryV2.mintWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)._validAfter (contracts/protocol/NFTFactoryV2.sol#220) is not in mixedCase
Parameter NFTFactoryV2.mintWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)._validBefore (contracts/protocol/NFTFactoryV2.sol#221) is not in mixedCase
Parameter NFTFactoryV2.mintWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)._nonce (contracts/protocol/NFTFactoryV2.sol#222) is not in mixedCase
Parameter NFTFactoryV2.authorizationState(address,bytes32)._authorizer (contracts/protocol/NFTFactoryV2.sol#261) is not in mixedCase
Parameter NFTFactoryV2.authorizationState(address,bytes32)._nonce (contracts/protocol/NFTFactoryV2.sol#262) is not in mixedCase
Parameter NFTFactoryV2.cancelAuthorization(address,bytes32,uint8,bytes32,bytes32)._authorizer (contracts/protocol/NFTFactoryV2.sol#278) is not in mixedCase
Parameter NFTFactoryV2.cancelAuthorization(address,bytes32,uint8,bytes32,bytes32)._nonce (contracts/protocol/NFTFactoryV2.sol#279) is not in mixedCase
Parameter NFTFactoryV2.cancelAuthorization(bytes32)._nonce (contracts/protocol/NFTFactoryV2.sol#299) is not in mixedCase
Function NFTFactoryV2.__deriveSigner(bytes,uint8,bytes32,bytes32) (contracts/protocol/NFTFactoryV2.sol#312-324) is not in mixedCase
Function NFTFactoryV2.__useNonce(address,bytes32,bool) (contracts/protocol/NFTFactoryV2.sol#342-358) is not in mixedCase
Parameter NFTFactoryV2.__useNonce(address,bytes32,bool)._authorizer (contracts/protocol/NFTFactoryV2.sol#342) is not in mixedCase
Parameter NFTFactoryV2.__useNonce(address,bytes32,bool)._nonce (contracts/protocol/NFTFactoryV2.sol#342) is not in mixedCase
Parameter NFTFactoryV2.__useNonce(address,bytes32,bool)._cancellation (contracts/protocol/NFTFactoryV2.sol#342) is not in mixedCase
Variable NFTFactoryV2.DOMAIN_SEPARATOR (contracts/protocol/NFTFactoryV2.sol#57) is not in mixedCase
Parameter NFTFactoryV3.updateTotalMintHardcap(uint256)._totalMintHardcap (contracts/protocol/NFTFactoryV3.sol#174) is not in mixedCase
Parameter NFTFactoryV3.mint(address,address,uint256)._targetErc721 (contracts/protocol/NFTFactoryV3.sol#198) is not in mixedCase
Parameter NFTFactoryV3.mint(address,address,uint256)._to (contracts/protocol/NFTFactoryV3.sol#198) is not in mixedCase
Parameter NFTFactoryV3.mint(address,address,uint256)._tokenId (contracts/protocol/NFTFactoryV3.sol#198) is not in mixedCase
Function NFTFactoryV3.__mint(address,address,address,uint256) (contracts/protocol/NFTFactoryV3.sol#222-242) is not in mixedCase
Parameter NFTFactoryV3.__mint(address,address,address,uint256)._executor (contracts/protocol/NFTFactoryV3.sol#222) is not in mixedCase
Parameter NFTFactoryV3.__mint(address,address,address,uint256)._targetErc721 (contracts/protocol/NFTFactoryV3.sol#222) is not in mixedCase
Parameter NFTFactoryV3.__mint(address,address,address,uint256)._to (contracts/protocol/NFTFactoryV3.sol#222) is not in mixedCase
Parameter NFTFactoryV3.__mint(address,address,address,uint256)._tokenId (contracts/protocol/NFTFactoryV3.sol#222) is not in mixedCase
Parameter NFTFactoryV3.mintWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)._targetErc721 (contracts/protocol/NFTFactoryV3.sol#259) is not in mixedCase
Parameter NFTFactoryV3.mintWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)._to (contracts/protocol/NFTFactoryV3.sol#260) is not in mixedCase
Parameter NFTFactoryV3.mintWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)._tokenId (contracts/protocol/NFTFactoryV3.sol#261) is not in mixedCase
Parameter NFTFactoryV3.mintWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)._validAfter (contracts/protocol/NFTFactoryV3.sol#262) is not in mixedCase
Parameter NFTFactoryV3.mintWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)._validBefore (contracts/protocol/NFTFactoryV3.sol#263) is not in mixedCase
Parameter NFTFactoryV3.mintWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)._nonce (contracts/protocol/NFTFactoryV3.sol#264) is not in mixedCase
Parameter NFTFactoryV3.authorizationState(address,bytes32)._authorizer (contracts/protocol/NFTFactoryV3.sol#303) is not in mixedCase
Parameter NFTFactoryV3.authorizationState(address,bytes32)._nonce (contracts/protocol/NFTFactoryV3.sol#304) is not in mixedCase
Parameter NFTFactoryV3.cancelAuthorization(address,bytes32,uint8,bytes32,bytes32)._authorizer (contracts/protocol/NFTFactoryV3.sol#320) is not in mixedCase
Parameter NFTFactoryV3.cancelAuthorization(address,bytes32,uint8,bytes32,bytes32)._nonce (contracts/protocol/NFTFactoryV3.sol#321) is not in mixedCase
Parameter NFTFactoryV3.cancelAuthorization(bytes32)._nonce (contracts/protocol/NFTFactoryV3.sol#341) is not in mixedCase
Function NFTFactoryV3.__deriveSigner(bytes,uint8,bytes32,bytes32) (contracts/protocol/NFTFactoryV3.sol#354-366) is not in mixedCase
Function NFTFactoryV3.__useNonce(address,bytes32,bool) (contracts/protocol/NFTFactoryV3.sol#384-400) is not in mixedCase
Parameter NFTFactoryV3.__useNonce(address,bytes32,bool)._authorizer (contracts/protocol/NFTFactoryV3.sol#384) is not in mixedCase
Parameter NFTFactoryV3.__useNonce(address,bytes32,bool)._nonce (contracts/protocol/NFTFactoryV3.sol#384) is not in mixedCase
Parameter NFTFactoryV3.__useNonce(address,bytes32,bool)._cancellation (contracts/protocol/NFTFactoryV3.sol#384) is not in mixedCase
Variable NFTFactoryV3.DOMAIN_SEPARATOR (contracts/protocol/NFTFactoryV3.sol#60) is not in mixedCase
Parameter NFTStaking.rescueErc20(address,address,uint256)._contract (contracts/protocol/NFTStaking.sol#294) is not in mixedCase
Parameter NFTStaking.rescueErc20(address,address,uint256)._to (contracts/protocol/NFTStaking.sol#294) is not in mixedCase
Parameter NFTStaking.rescueErc20(address,address,uint256)._value (contracts/protocol/NFTStaking.sol#294) is not in mixedCase
Parameter NFTStaking.rescueErc721(address,address,uint256)._contract (contracts/protocol/NFTStaking.sol#314) is not in mixedCase
Parameter NFTStaking.rescueErc721(address,address,uint256)._to (contracts/protocol/NFTStaking.sol#314) is not in mixedCase
Parameter NFTStaking.rescueErc721(address,address,uint256)._tokenId (contracts/protocol/NFTStaking.sol#314) is not in mixedCase
Parameter OpenSeaFactoryImpl.setBaseURI(string)._baseURI (contracts/protocol/OpenSeaFactory.sol#260) is not in mixedCase
Parameter OpenSeaFactoryImpl.canMint(uint256)._optionId (contracts/protocol/OpenSeaFactory.sol#306) is not in mixedCase
Parameter OpenSeaFactoryImpl.tokenURI(uint256)._optionId (contracts/protocol/OpenSeaFactory.sol#314) is not in mixedCase
Parameter OpenSeaFactoryImpl.mint(uint256,address)._optionId (contracts/protocol/OpenSeaFactory.sol#330) is not in mixedCase
Parameter OpenSeaFactoryImpl.mint(uint256,address)._toAddress (contracts/protocol/OpenSeaFactory.sol#330) is not in mixedCase
Parameter OpenSeaFactoryImpl.fireTransferEvents(address,address)._from (contracts/protocol/OpenSeaFactory.sol#355) is not in mixedCase
Parameter OpenSeaFactoryImpl.fireTransferEvents(address,address)._to (contracts/protocol/OpenSeaFactory.sol#355) is not in mixedCase
Parameter OpenSeaFactoryImpl.transferFrom(address,address,uint256)._to (contracts/protocol/OpenSeaFactory.sol#369) is not in mixedCase
Parameter OpenSeaFactoryImpl.transferFrom(address,address,uint256)._tokenId (contracts/protocol/OpenSeaFactory.sol#369) is not in mixedCase
Parameter OpenSeaFactoryImpl.isApprovedForAll(address,address)._owner (contracts/protocol/OpenSeaFactory.sol#378) is not in mixedCase
Parameter OpenSeaFactoryImpl.isApprovedForAll(address,address)._operator (contracts/protocol/OpenSeaFactory.sol#378) is not in mixedCase
Parameter AliERC20v2Base.transferAndCall(address,uint256)._to (contracts/token/AliERC20v2.sol#599) is not in mixedCase
Parameter AliERC20v2Base.transferAndCall(address,uint256)._value (contracts/token/AliERC20v2.sol#599) is not in mixedCase
Parameter AliERC20v2Base.transferAndCall(address,uint256,bytes)._to (contracts/token/AliERC20v2.sol#627) is not in mixedCase
Parameter AliERC20v2Base.transferAndCall(address,uint256,bytes)._value (contracts/token/AliERC20v2.sol#627) is not in mixedCase
Parameter AliERC20v2Base.transferAndCall(address,uint256,bytes)._data (contracts/token/AliERC20v2.sol#627) is not in mixedCase
Parameter AliERC20v2Base.transferFromAndCall(address,address,uint256)._from (contracts/token/AliERC20v2.sol#657) is not in mixedCase
Parameter AliERC20v2Base.transferFromAndCall(address,address,uint256)._to (contracts/token/AliERC20v2.sol#657) is not in mixedCase
Parameter AliERC20v2Base.transferFromAndCall(address,address,uint256)._value (contracts/token/AliERC20v2.sol#657) is not in mixedCase
Parameter AliERC20v2Base.transferFromAndCall(address,address,uint256,bytes)._from (contracts/token/AliERC20v2.sol#689) is not in mixedCase
Parameter AliERC20v2Base.transferFromAndCall(address,address,uint256,bytes)._to (contracts/token/AliERC20v2.sol#689) is not in mixedCase
Parameter AliERC20v2Base.transferFromAndCall(address,address,uint256,bytes)._value (contracts/token/AliERC20v2.sol#689) is not in mixedCase
Parameter AliERC20v2Base.transferFromAndCall(address,address,uint256,bytes)._data (contracts/token/AliERC20v2.sol#689) is not in mixedCase
Parameter AliERC20v2Base.approveAndCall(address,uint256)._spender (contracts/token/AliERC20v2.sol#721) is not in mixedCase
Parameter AliERC20v2Base.approveAndCall(address,uint256)._value (contracts/token/AliERC20v2.sol#721) is not in mixedCase
Parameter AliERC20v2Base.approveAndCall(address,uint256,bytes)._spender (contracts/token/AliERC20v2.sol#742) is not in mixedCase
Parameter AliERC20v2Base.approveAndCall(address,uint256,bytes)._value (contracts/token/AliERC20v2.sol#742) is not in mixedCase
Parameter AliERC20v2Base.approveAndCall(address,uint256,bytes)._data (contracts/token/AliERC20v2.sol#742) is not in mixedCase
Parameter AliERC20v2Base.balanceOf(address)._owner (contracts/token/AliERC20v2.sol#823) is not in mixedCase
Parameter AliERC20v2Base.transfer(address,uint256)._to (contracts/token/AliERC20v2.sol#849) is not in mixedCase
Parameter AliERC20v2Base.transfer(address,uint256)._value (contracts/token/AliERC20v2.sol#849) is not in mixedCase
Parameter AliERC20v2Base.transferFrom(address,address,uint256)._from (contracts/token/AliERC20v2.sol#880) is not in mixedCase
Parameter AliERC20v2Base.transferFrom(address,address,uint256)._to (contracts/token/AliERC20v2.sol#880) is not in mixedCase
Parameter AliERC20v2Base.transferFrom(address,address,uint256)._value (contracts/token/AliERC20v2.sol#880) is not in mixedCase
Parameter AliERC20v2Base.safeTransferFrom(address,address,uint256,bytes)._from (contracts/token/AliERC20v2.sol#934) is not in mixedCase
Parameter AliERC20v2Base.safeTransferFrom(address,address,uint256,bytes)._to (contracts/token/AliERC20v2.sol#934) is not in mixedCase
Parameter AliERC20v2Base.safeTransferFrom(address,address,uint256,bytes)._value (contracts/token/AliERC20v2.sol#934) is not in mixedCase
Parameter AliERC20v2Base.safeTransferFrom(address,address,uint256,bytes)._data (contracts/token/AliERC20v2.sol#934) is not in mixedCase
Parameter AliERC20v2Base.unsafeTransferFrom(address,address,uint256)._from (contracts/token/AliERC20v2.sol#971) is not in mixedCase
Parameter AliERC20v2Base.unsafeTransferFrom(address,address,uint256)._to (contracts/token/AliERC20v2.sol#971) is not in mixedCase
Parameter AliERC20v2Base.unsafeTransferFrom(address,address,uint256)._value (contracts/token/AliERC20v2.sol#971) is not in mixedCase
Function AliERC20v2Base.__transferFrom(address,address,address,uint256) (contracts/token/AliERC20v2.sol#990-1067) is not in mixedCase
Parameter AliERC20v2Base.__transferFrom(address,address,address,uint256)._by (contracts/token/AliERC20v2.sol#990) is not in mixedCase
Parameter AliERC20v2Base.__transferFrom(address,address,address,uint256)._from (contracts/token/AliERC20v2.sol#990) is not in mixedCase
Parameter AliERC20v2Base.__transferFrom(address,address,address,uint256)._to (contracts/token/AliERC20v2.sol#990) is not in mixedCase
Parameter AliERC20v2Base.__transferFrom(address,address,address,uint256)._value (contracts/token/AliERC20v2.sol#990) is not in mixedCase
Parameter AliERC20v2Base.approve(address,uint256)._spender (contracts/token/AliERC20v2.sol#1083) is not in mixedCase
Parameter AliERC20v2Base.approve(address,uint256)._value (contracts/token/AliERC20v2.sol#1083) is not in mixedCase
Function AliERC20v2Base.__approve(address,address,uint256) (contracts/token/AliERC20v2.sol#1106-1123) is not in mixedCase
Parameter AliERC20v2Base.__approve(address,address,uint256)._owner (contracts/token/AliERC20v2.sol#1106) is not in mixedCase
Parameter AliERC20v2Base.__approve(address,address,uint256)._spender (contracts/token/AliERC20v2.sol#1106) is not in mixedCase
Parameter AliERC20v2Base.__approve(address,address,uint256)._value (contracts/token/AliERC20v2.sol#1106) is not in mixedCase
Parameter AliERC20v2Base.allowance(address,address)._owner (contracts/token/AliERC20v2.sol#1138) is not in mixedCase
Parameter AliERC20v2Base.allowance(address,address)._spender (contracts/token/AliERC20v2.sol#1138) is not in mixedCase
Parameter AliERC20v2Base.increaseAllowance(address,uint256)._spender (contracts/token/AliERC20v2.sol#1159) is not in mixedCase
Parameter AliERC20v2Base.increaseAllowance(address,uint256)._value (contracts/token/AliERC20v2.sol#1159) is not in mixedCase
Parameter AliERC20v2Base.decreaseAllowance(address,uint256)._spender (contracts/token/AliERC20v2.sol#1185) is not in mixedCase
Parameter AliERC20v2Base.decreaseAllowance(address,uint256)._value (contracts/token/AliERC20v2.sol#1185) is not in mixedCase
Parameter AliERC20v2Base.mint(address,uint256)._to (contracts/token/AliERC20v2.sol#1215) is not in mixedCase
Parameter AliERC20v2Base.mint(address,uint256)._value (contracts/token/AliERC20v2.sol#1215) is not in mixedCase
Parameter AliERC20v2Base.burn(address,uint256)._from (contracts/token/AliERC20v2.sol#1271) is not in mixedCase
Parameter AliERC20v2Base.burn(address,uint256)._value (contracts/token/AliERC20v2.sol#1271) is not in mixedCase
Parameter AliERC20v2Base.permit(address,address,uint256,uint256,uint8,bytes32,bytes32)._owner (contracts/token/AliERC20v2.sol#1385) is not in mixedCase
Parameter AliERC20v2Base.permit(address,address,uint256,uint256,uint8,bytes32,bytes32)._spender (contracts/token/AliERC20v2.sol#1385) is not in mixedCase
Parameter AliERC20v2Base.permit(address,address,uint256,uint256,uint8,bytes32,bytes32)._value (contracts/token/AliERC20v2.sol#1385) is not in mixedCase
Parameter AliERC20v2Base.permit(address,address,uint256,uint256,uint8,bytes32,bytes32)._exp (contracts/token/AliERC20v2.sol#1385) is not in mixedCase
Parameter AliERC20v2Base.authorizationState(address,bytes32)._authorizer (contracts/token/AliERC20v2.sol#1419) is not in mixedCase
Parameter AliERC20v2Base.authorizationState(address,bytes32)._nonce (contracts/token/AliERC20v2.sol#1419) is not in mixedCase
Parameter AliERC20v2Base.transferWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)._from (contracts/token/AliERC20v2.sol#1440) is not in mixedCase
Parameter AliERC20v2Base.transferWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)._to (contracts/token/AliERC20v2.sol#1441) is not in mixedCase
Parameter AliERC20v2Base.transferWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)._value (contracts/token/AliERC20v2.sol#1442) is not in mixedCase
Parameter AliERC20v2Base.transferWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)._validAfter (contracts/token/AliERC20v2.sol#1443) is not in mixedCase
Parameter AliERC20v2Base.transferWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)._validBefore (contracts/token/AliERC20v2.sol#1444) is not in mixedCase
Parameter AliERC20v2Base.transferWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)._nonce (contracts/token/AliERC20v2.sol#1445) is not in mixedCase
Parameter AliERC20v2Base.receiveWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)._from (contracts/token/AliERC20v2.sol#1487) is not in mixedCase
Parameter AliERC20v2Base.receiveWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)._to (contracts/token/AliERC20v2.sol#1488) is not in mixedCase
Parameter AliERC20v2Base.receiveWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)._value (contracts/token/AliERC20v2.sol#1489) is not in mixedCase
Parameter AliERC20v2Base.receiveWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)._validAfter (contracts/token/AliERC20v2.sol#1490) is not in mixedCase
Parameter AliERC20v2Base.receiveWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)._validBefore (contracts/token/AliERC20v2.sol#1491) is not in mixedCase
Parameter AliERC20v2Base.receiveWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)._nonce (contracts/token/AliERC20v2.sol#1492) is not in mixedCase
Parameter AliERC20v2Base.cancelAuthorization(address,bytes32,uint8,bytes32,bytes32)._authorizer (contracts/token/AliERC20v2.sol#1528) is not in mixedCase
Parameter AliERC20v2Base.cancelAuthorization(address,bytes32,uint8,bytes32,bytes32)._nonce (contracts/token/AliERC20v2.sol#1529) is not in mixedCase
Function AliERC20v2Base.__deriveSigner(bytes,uint8,bytes32,bytes32) (contracts/token/AliERC20v2.sol#1552-1564) is not in mixedCase
Function AliERC20v2Base.__useNonce(address,bytes32,bool) (contracts/token/AliERC20v2.sol#1582-1598) is not in mixedCase
Parameter AliERC20v2Base.__useNonce(address,bytes32,bool)._authorizer (contracts/token/AliERC20v2.sol#1582) is not in mixedCase
Parameter AliERC20v2Base.__useNonce(address,bytes32,bool)._nonce (contracts/token/AliERC20v2.sol#1582) is not in mixedCase
Parameter AliERC20v2Base.__useNonce(address,bytes32,bool)._cancellation (contracts/token/AliERC20v2.sol#1582) is not in mixedCase
Parameter AliERC20v2Base.votingPowerOf(address)._of (contracts/token/AliERC20v2.sol#1611) is not in mixedCase
Parameter AliERC20v2Base.votingPowerAt(address,uint256)._of (contracts/token/AliERC20v2.sol#1629) is not in mixedCase
Parameter AliERC20v2Base.votingPowerAt(address,uint256)._blockNum (contracts/token/AliERC20v2.sol#1629) is not in mixedCase
Parameter AliERC20v2Base.votingPowerHistoryOf(address)._of (contracts/token/AliERC20v2.sol#1647) is not in mixedCase
Parameter AliERC20v2Base.votingPowerHistoryLength(address)._of (contracts/token/AliERC20v2.sol#1659) is not in mixedCase
Parameter AliERC20v2Base.totalSupplyAt(uint256)._blockNum (contracts/token/AliERC20v2.sol#1672) is not in mixedCase
Parameter AliERC20v2Base.delegate(address)._to (contracts/token/AliERC20v2.sol#1714) is not in mixedCase
Function AliERC20v2Base.__delegate(address,address) (contracts/token/AliERC20v2.sol#1730-1745) is not in mixedCase
Parameter AliERC20v2Base.__delegate(address,address)._from (contracts/token/AliERC20v2.sol#1730) is not in mixedCase
Parameter AliERC20v2Base.__delegate(address,address)._to (contracts/token/AliERC20v2.sol#1730) is not in mixedCase
Parameter AliERC20v2Base.delegateWithAuthorization(address,bytes32,uint256,uint8,bytes32,bytes32)._to (contracts/token/AliERC20v2.sol#1764) is not in mixedCase
Parameter AliERC20v2Base.delegateWithAuthorization(address,bytes32,uint256,uint8,bytes32,bytes32)._nonce (contracts/token/AliERC20v2.sol#1764) is not in mixedCase
Parameter AliERC20v2Base.delegateWithAuthorization(address,bytes32,uint256,uint8,bytes32,bytes32)._exp (contracts/token/AliERC20v2.sol#1764) is not in mixedCase
Function AliERC20v2Base.__moveVotingPower(address,address,address,uint256) (contracts/token/AliERC20v2.sol#1793-1823) is not in mixedCase
Parameter AliERC20v2Base.__moveVotingPower(address,address,address,uint256)._by (contracts/token/AliERC20v2.sol#1793) is not in mixedCase
Parameter AliERC20v2Base.__moveVotingPower(address,address,address,uint256)._from (contracts/token/AliERC20v2.sol#1793) is not in mixedCase
Parameter AliERC20v2Base.__moveVotingPower(address,address,address,uint256)._to (contracts/token/AliERC20v2.sol#1793) is not in mixedCase
Parameter AliERC20v2Base.__moveVotingPower(address,address,address,uint256)._value (contracts/token/AliERC20v2.sol#1793) is not in mixedCase
Function AliERC20v2Base.__updateHistory(AliERC20v2Base.KV[],function(uint256,uint256) returns(uint256),uint256) (contracts/token/AliERC20v2.sol#1834-1854) is not in mixedCase
Parameter AliERC20v2Base.__updateHistory(AliERC20v2Base.KV[],function(uint256,uint256) returns(uint256),uint256)._h (contracts/token/AliERC20v2.sol#1835) is not in mixedCase
Parameter AliERC20v2Base.__updateHistory(AliERC20v2Base.KV[],function(uint256,uint256) returns(uint256),uint256)._delta (contracts/token/AliERC20v2.sol#1837) is not in mixedCase
Function AliERC20v2Base.__binaryLookup(AliERC20v2Base.KV[],uint256) (contracts/token/AliERC20v2.sol#1874-1932) is not in mixedCase
Parameter AliERC20v2Base.__binaryLookup(AliERC20v2Base.KV[],uint256)._h (contracts/token/AliERC20v2.sol#1874) is not in mixedCase
Parameter AliERC20v2Base.__binaryLookup(AliERC20v2Base.KV[],uint256)._k (contracts/token/AliERC20v2.sol#1874) is not in mixedCase
Variable AliERC20v2Base.DOMAIN_SEPARATOR (contracts/token/AliERC20v2.sol#434) is not in mixedCase
Parameter BurnableShortERC721.burn(uint256)._tokenId (contracts/token/BurnableShortERC721.sol#55) is not in mixedCase
Function BurnableShortERC721.__addToken(uint256,address) (contracts/token/BurnableShortERC721.sol#93-99) is not in mixedCase
Parameter BurnableShortERC721.__addToken(uint256,address)._tokenId (contracts/token/BurnableShortERC721.sol#93) is not in mixedCase
Parameter BurnableShortERC721.__addToken(uint256,address)._to (contracts/token/BurnableShortERC721.sol#93) is not in mixedCase
Function BurnableShortERC721.__addTokens(address,uint256,uint256) (contracts/token/BurnableShortERC721.sol#106-115) is not in mixedCase
Parameter BurnableShortERC721.__addTokens(address,uint256,uint256)._to (contracts/token/BurnableShortERC721.sol#106) is not in mixedCase
Parameter BurnableShortERC721.__addTokens(address,uint256,uint256)._tokenId (contracts/token/BurnableShortERC721.sol#106) is not in mixedCase
Function BurnableShortERC721.__removeToken(uint256) (contracts/token/BurnableShortERC721.sol#129-156) is not in mixedCase
Parameter BurnableShortERC721.__removeToken(uint256)._tokenId (contracts/token/BurnableShortERC721.sol#129) is not in mixedCase
Parameter CharacterERC20.postConstruct(address,uint256,string,string)._initialHolder (contracts/token/CharacterERC20.sol#558) is not in mixedCase
Parameter CharacterERC20.postConstruct(address,uint256,string,string)._initialSupply (contracts/token/CharacterERC20.sol#558) is not in mixedCase
Parameter CharacterERC20.postConstruct(address,uint256,string,string)._name (contracts/token/CharacterERC20.sol#558) is not in mixedCase
Parameter CharacterERC20.postConstruct(address,uint256,string,string)._symbol (contracts/token/CharacterERC20.sol#558) is not in mixedCase
Parameter CharacterERC20.transferAndCall(address,uint256)._to (contracts/token/CharacterERC20.sol#617) is not in mixedCase
Parameter CharacterERC20.transferAndCall(address,uint256)._value (contracts/token/CharacterERC20.sol#617) is not in mixedCase
Parameter CharacterERC20.transferAndCall(address,uint256,bytes)._to (contracts/token/CharacterERC20.sol#645) is not in mixedCase
Parameter CharacterERC20.transferAndCall(address,uint256,bytes)._value (contracts/token/CharacterERC20.sol#645) is not in mixedCase
Parameter CharacterERC20.transferAndCall(address,uint256,bytes)._data (contracts/token/CharacterERC20.sol#645) is not in mixedCase
Parameter CharacterERC20.transferFromAndCall(address,address,uint256)._from (contracts/token/CharacterERC20.sol#675) is not in mixedCase
Parameter CharacterERC20.transferFromAndCall(address,address,uint256)._to (contracts/token/CharacterERC20.sol#675) is not in mixedCase
Parameter CharacterERC20.transferFromAndCall(address,address,uint256)._value (contracts/token/CharacterERC20.sol#675) is not in mixedCase
Parameter CharacterERC20.transferFromAndCall(address,address,uint256,bytes)._from (contracts/token/CharacterERC20.sol#707) is not in mixedCase
Parameter CharacterERC20.transferFromAndCall(address,address,uint256,bytes)._to (contracts/token/CharacterERC20.sol#707) is not in mixedCase
Parameter CharacterERC20.transferFromAndCall(address,address,uint256,bytes)._value (contracts/token/CharacterERC20.sol#707) is not in mixedCase
Parameter CharacterERC20.transferFromAndCall(address,address,uint256,bytes)._data (contracts/token/CharacterERC20.sol#707) is not in mixedCase
Parameter CharacterERC20.approveAndCall(address,uint256)._spender (contracts/token/CharacterERC20.sol#739) is not in mixedCase
Parameter CharacterERC20.approveAndCall(address,uint256)._value (contracts/token/CharacterERC20.sol#739) is not in mixedCase
Parameter CharacterERC20.approveAndCall(address,uint256,bytes)._spender (contracts/token/CharacterERC20.sol#760) is not in mixedCase
Parameter CharacterERC20.approveAndCall(address,uint256,bytes)._value (contracts/token/CharacterERC20.sol#760) is not in mixedCase
Parameter CharacterERC20.approveAndCall(address,uint256,bytes)._data (contracts/token/CharacterERC20.sol#760) is not in mixedCase
Parameter CharacterERC20.balanceOf(address)._owner (contracts/token/CharacterERC20.sol#841) is not in mixedCase
Parameter CharacterERC20.transfer(address,uint256)._to (contracts/token/CharacterERC20.sol#867) is not in mixedCase
Parameter CharacterERC20.transfer(address,uint256)._value (contracts/token/CharacterERC20.sol#867) is not in mixedCase
Parameter CharacterERC20.transferFrom(address,address,uint256)._from (contracts/token/CharacterERC20.sol#898) is not in mixedCase
Parameter CharacterERC20.transferFrom(address,address,uint256)._to (contracts/token/CharacterERC20.sol#898) is not in mixedCase
Parameter CharacterERC20.transferFrom(address,address,uint256)._value (contracts/token/CharacterERC20.sol#898) is not in mixedCase
Parameter CharacterERC20.safeTransferFrom(address,address,uint256,bytes)._from (contracts/token/CharacterERC20.sol#952) is not in mixedCase
Parameter CharacterERC20.safeTransferFrom(address,address,uint256,bytes)._to (contracts/token/CharacterERC20.sol#952) is not in mixedCase
Parameter CharacterERC20.safeTransferFrom(address,address,uint256,bytes)._value (contracts/token/CharacterERC20.sol#952) is not in mixedCase
Parameter CharacterERC20.safeTransferFrom(address,address,uint256,bytes)._data (contracts/token/CharacterERC20.sol#952) is not in mixedCase
Parameter CharacterERC20.unsafeTransferFrom(address,address,uint256)._from (contracts/token/CharacterERC20.sol#989) is not in mixedCase
Parameter CharacterERC20.unsafeTransferFrom(address,address,uint256)._to (contracts/token/CharacterERC20.sol#989) is not in mixedCase
Parameter CharacterERC20.unsafeTransferFrom(address,address,uint256)._value (contracts/token/CharacterERC20.sol#989) is not in mixedCase
Function CharacterERC20.__transferFrom(address,address,address,uint256) (contracts/token/CharacterERC20.sol#1008-1085) is not in mixedCase
Parameter CharacterERC20.__transferFrom(address,address,address,uint256)._by (contracts/token/CharacterERC20.sol#1008) is not in mixedCase
Parameter CharacterERC20.__transferFrom(address,address,address,uint256)._from (contracts/token/CharacterERC20.sol#1008) is not in mixedCase
Parameter CharacterERC20.__transferFrom(address,address,address,uint256)._to (contracts/token/CharacterERC20.sol#1008) is not in mixedCase
Parameter CharacterERC20.__transferFrom(address,address,address,uint256)._value (contracts/token/CharacterERC20.sol#1008) is not in mixedCase
Parameter CharacterERC20.approve(address,uint256)._spender (contracts/token/CharacterERC20.sol#1101) is not in mixedCase
Parameter CharacterERC20.approve(address,uint256)._value (contracts/token/CharacterERC20.sol#1101) is not in mixedCase
Function CharacterERC20.__approve(address,address,uint256) (contracts/token/CharacterERC20.sol#1124-1141) is not in mixedCase
Parameter CharacterERC20.__approve(address,address,uint256)._owner (contracts/token/CharacterERC20.sol#1124) is not in mixedCase
Parameter CharacterERC20.__approve(address,address,uint256)._spender (contracts/token/CharacterERC20.sol#1124) is not in mixedCase
Parameter CharacterERC20.__approve(address,address,uint256)._value (contracts/token/CharacterERC20.sol#1124) is not in mixedCase
Parameter CharacterERC20.allowance(address,address)._owner (contracts/token/CharacterERC20.sol#1156) is not in mixedCase
Parameter CharacterERC20.allowance(address,address)._spender (contracts/token/CharacterERC20.sol#1156) is not in mixedCase
Parameter CharacterERC20.increaseAllowance(address,uint256)._spender (contracts/token/CharacterERC20.sol#1177) is not in mixedCase
Parameter CharacterERC20.increaseAllowance(address,uint256)._value (contracts/token/CharacterERC20.sol#1177) is not in mixedCase
Parameter CharacterERC20.decreaseAllowance(address,uint256)._spender (contracts/token/CharacterERC20.sol#1203) is not in mixedCase
Parameter CharacterERC20.decreaseAllowance(address,uint256)._value (contracts/token/CharacterERC20.sol#1203) is not in mixedCase
Parameter CharacterERC20.mint(address,uint256)._to (contracts/token/CharacterERC20.sol#1233) is not in mixedCase
Parameter CharacterERC20.mint(address,uint256)._value (contracts/token/CharacterERC20.sol#1233) is not in mixedCase
Parameter CharacterERC20.burn(address,uint256)._from (contracts/token/CharacterERC20.sol#1289) is not in mixedCase
Parameter CharacterERC20.burn(address,uint256)._value (contracts/token/CharacterERC20.sol#1289) is not in mixedCase
Parameter CharacterERC20.updateTokenMetadata(string,string)._name (contracts/token/CharacterERC20.sol#1374) is not in mixedCase
Parameter CharacterERC20.updateTokenMetadata(string,string)._symbol (contracts/token/CharacterERC20.sol#1374) is not in mixedCase
Parameter CharacterERC20.permit(address,address,uint256,uint256,uint8,bytes32,bytes32)._owner (contracts/token/CharacterERC20.sol#1429) is not in mixedCase
Parameter CharacterERC20.permit(address,address,uint256,uint256,uint8,bytes32,bytes32)._spender (contracts/token/CharacterERC20.sol#1429) is not in mixedCase
Parameter CharacterERC20.permit(address,address,uint256,uint256,uint8,bytes32,bytes32)._value (contracts/token/CharacterERC20.sol#1429) is not in mixedCase
Parameter CharacterERC20.permit(address,address,uint256,uint256,uint8,bytes32,bytes32)._exp (contracts/token/CharacterERC20.sol#1429) is not in mixedCase
Parameter CharacterERC20.authorizationState(address,bytes32)._authorizer (contracts/token/CharacterERC20.sol#1463) is not in mixedCase
Parameter CharacterERC20.authorizationState(address,bytes32)._nonce (contracts/token/CharacterERC20.sol#1463) is not in mixedCase
Parameter CharacterERC20.transferWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)._from (contracts/token/CharacterERC20.sol#1484) is not in mixedCase
Parameter CharacterERC20.transferWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)._to (contracts/token/CharacterERC20.sol#1485) is not in mixedCase
Parameter CharacterERC20.transferWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)._value (contracts/token/CharacterERC20.sol#1486) is not in mixedCase
Parameter CharacterERC20.transferWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)._validAfter (contracts/token/CharacterERC20.sol#1487) is not in mixedCase
Parameter CharacterERC20.transferWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)._validBefore (contracts/token/CharacterERC20.sol#1488) is not in mixedCase
Parameter CharacterERC20.transferWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)._nonce (contracts/token/CharacterERC20.sol#1489) is not in mixedCase
Parameter CharacterERC20.receiveWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)._from (contracts/token/CharacterERC20.sol#1531) is not in mixedCase
Parameter CharacterERC20.receiveWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)._to (contracts/token/CharacterERC20.sol#1532) is not in mixedCase
Parameter CharacterERC20.receiveWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)._value (contracts/token/CharacterERC20.sol#1533) is not in mixedCase
Parameter CharacterERC20.receiveWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)._validAfter (contracts/token/CharacterERC20.sol#1534) is not in mixedCase
Parameter CharacterERC20.receiveWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)._validBefore (contracts/token/CharacterERC20.sol#1535) is not in mixedCase
Parameter CharacterERC20.receiveWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)._nonce (contracts/token/CharacterERC20.sol#1536) is not in mixedCase
Parameter CharacterERC20.cancelAuthorization(address,bytes32,uint8,bytes32,bytes32)._authorizer (contracts/token/CharacterERC20.sol#1572) is not in mixedCase
Parameter CharacterERC20.cancelAuthorization(address,bytes32,uint8,bytes32,bytes32)._nonce (contracts/token/CharacterERC20.sol#1573) is not in mixedCase
Function CharacterERC20.__deriveSigner(bytes,uint8,bytes32,bytes32) (contracts/token/CharacterERC20.sol#1596-1608) is not in mixedCase
Function CharacterERC20.__useNonce(address,bytes32,bool) (contracts/token/CharacterERC20.sol#1626-1642) is not in mixedCase
Parameter CharacterERC20.__useNonce(address,bytes32,bool)._authorizer (contracts/token/CharacterERC20.sol#1626) is not in mixedCase
Parameter CharacterERC20.__useNonce(address,bytes32,bool)._nonce (contracts/token/CharacterERC20.sol#1626) is not in mixedCase
Parameter CharacterERC20.__useNonce(address,bytes32,bool)._cancellation (contracts/token/CharacterERC20.sol#1626) is not in mixedCase
Parameter CharacterERC20.votingPowerOf(address)._of (contracts/token/CharacterERC20.sol#1655) is not in mixedCase
Parameter CharacterERC20.votingPowerAt(address,uint256)._of (contracts/token/CharacterERC20.sol#1673) is not in mixedCase
Parameter CharacterERC20.votingPowerAt(address,uint256)._blockNum (contracts/token/CharacterERC20.sol#1673) is not in mixedCase
Parameter CharacterERC20.votingPowerHistoryOf(address)._of (contracts/token/CharacterERC20.sol#1691) is not in mixedCase
Parameter CharacterERC20.votingPowerHistoryLength(address)._of (contracts/token/CharacterERC20.sol#1703) is not in mixedCase
Parameter CharacterERC20.totalSupplyAt(uint256)._blockNum (contracts/token/CharacterERC20.sol#1716) is not in mixedCase
Parameter CharacterERC20.delegate(address)._to (contracts/token/CharacterERC20.sol#1758) is not in mixedCase
Function CharacterERC20.__delegate(address,address) (contracts/token/CharacterERC20.sol#1774-1789) is not in mixedCase
Parameter CharacterERC20.__delegate(address,address)._from (contracts/token/CharacterERC20.sol#1774) is not in mixedCase
Parameter CharacterERC20.__delegate(address,address)._to (contracts/token/CharacterERC20.sol#1774) is not in mixedCase
Parameter CharacterERC20.delegateWithAuthorization(address,bytes32,uint256,uint8,bytes32,bytes32)._to (contracts/token/CharacterERC20.sol#1808) is not in mixedCase
Parameter CharacterERC20.delegateWithAuthorization(address,bytes32,uint256,uint8,bytes32,bytes32)._nonce (contracts/token/CharacterERC20.sol#1808) is not in mixedCase
Parameter CharacterERC20.delegateWithAuthorization(address,bytes32,uint256,uint8,bytes32,bytes32)._exp (contracts/token/CharacterERC20.sol#1808) is not in mixedCase
Function CharacterERC20.__moveVotingPower(address,address,address,uint256) (contracts/token/CharacterERC20.sol#1837-1867) is not in mixedCase
Parameter CharacterERC20.__moveVotingPower(address,address,address,uint256)._by (contracts/token/CharacterERC20.sol#1837) is not in mixedCase
Parameter CharacterERC20.__moveVotingPower(address,address,address,uint256)._from (contracts/token/CharacterERC20.sol#1837) is not in mixedCase
Parameter CharacterERC20.__moveVotingPower(address,address,address,uint256)._to (contracts/token/CharacterERC20.sol#1837) is not in mixedCase
Parameter CharacterERC20.__moveVotingPower(address,address,address,uint256)._value (contracts/token/CharacterERC20.sol#1837) is not in mixedCase
Function CharacterERC20.__updateHistory(CharacterERC20.KV[],function(uint256,uint256) returns(uint256),uint256) (contracts/token/CharacterERC20.sol#1878-1898) is not in mixedCase
Parameter CharacterERC20.__updateHistory(CharacterERC20.KV[],function(uint256,uint256) returns(uint256),uint256)._h (contracts/token/CharacterERC20.sol#1879) is not in mixedCase
Parameter CharacterERC20.__updateHistory(CharacterERC20.KV[],function(uint256,uint256) returns(uint256),uint256)._delta (contracts/token/CharacterERC20.sol#1881) is not in mixedCase
Function CharacterERC20.__binaryLookup(CharacterERC20.KV[],uint256) (contracts/token/CharacterERC20.sol#1918-1976) is not in mixedCase
Parameter CharacterERC20.__binaryLookup(CharacterERC20.KV[],uint256)._h (contracts/token/CharacterERC20.sol#1918) is not in mixedCase
Parameter CharacterERC20.__binaryLookup(CharacterERC20.KV[],uint256)._k (contracts/token/CharacterERC20.sol#1918) is not in mixedCase
Variable CharacterERC20.DOMAIN_SEPARATOR (contracts/token/CharacterERC20.sol#431) is not in mixedCase
Parameter CharacterERC20Deployer.deployCharacterERC20(address,uint256,string,string)._initialHolder (contracts/token/CharacterERC20.sol#2098) is not in mixedCase
Parameter CharacterERC20Deployer.deployCharacterERC20(address,uint256,string,string)._initialSupply (contracts/token/CharacterERC20.sol#2099) is not in mixedCase
Parameter CharacterERC20Deployer.deployCharacterERC20(address,uint256,string,string)._name (contracts/token/CharacterERC20.sol#2100) is not in mixedCase
Parameter CharacterERC20Deployer.deployCharacterERC20(address,uint256,string,string)._symbol (contracts/token/CharacterERC20.sol#2101) is not in mixedCase
Parameter RoyalERC721.setContractURI(string)._contractURI (contracts/token/RoyalERC721.sol#117) is not in mixedCase
Parameter RoyalERC721.royaltyInfo(uint256,uint256)._salePrice (contracts/token/RoyalERC721.sol#136) is not in mixedCase
Parameter RoyalERC721.setRoyaltyInfo(address,uint16)._royaltyReceiver (contracts/token/RoyalERC721.sol#153) is not in mixedCase
Parameter RoyalERC721.setRoyaltyInfo(address,uint16)._royaltyPercentage (contracts/token/RoyalERC721.sol#153) is not in mixedCase
Parameter RoyalERC721.isOwner(address)._addr (contracts/token/RoyalERC721.sol#176) is not in mixedCase
Parameter RoyalERC721.transferOwnership(address)._owner (contracts/token/RoyalERC721.sol#189) is not in mixedCase
Function ShortERC721.TOKEN_UID() (contracts/token/ShortERC721.sol#100) is not in mixedCase
Parameter ShortERC721.isTransferable(uint256)._tokenId (contracts/token/ShortERC721.sol#364) is not in mixedCase
Parameter ShortERC721.exists(uint256)._tokenId (contracts/token/ShortERC721.sol#383) is not in mixedCase
Parameter ShortERC721.setBaseURI(string)._baseURI (contracts/token/ShortERC721.sol#410) is not in mixedCase
Parameter ShortERC721.tokenURI(uint256)._tokenId (contracts/token/ShortERC721.sol#427) is not in mixedCase
Parameter ShortERC721.setTokenURI(uint256,string)._tokenId (contracts/token/ShortERC721.sol#456) is not in mixedCase
Parameter ShortERC721.setTokenURI(uint256,string)._tokenURI (contracts/token/ShortERC721.sol#456) is not in mixedCase
Parameter ShortERC721.balanceOf(address)._owner (contracts/token/ShortERC721.sol#477) is not in mixedCase
Parameter ShortERC721.ownerOf(uint256)._tokenId (contracts/token/ShortERC721.sol#489) is not in mixedCase
Parameter ShortERC721.tokenByIndex(uint256)._index (contracts/token/ShortERC721.sol#513) is not in mixedCase
Parameter ShortERC721.tokenOfOwnerByIndex(address,uint256)._owner (contracts/token/ShortERC721.sol#524) is not in mixedCase
Parameter ShortERC721.tokenOfOwnerByIndex(address,uint256)._index (contracts/token/ShortERC721.sol#524) is not in mixedCase
Parameter ShortERC721.getApproved(uint256)._tokenId (contracts/token/ShortERC721.sol#535) is not in mixedCase
Parameter ShortERC721.isApprovedForAll(address,address)._owner (contracts/token/ShortERC721.sol#546) is not in mixedCase
Parameter ShortERC721.isApprovedForAll(address,address)._operator (contracts/token/ShortERC721.sol#546) is not in mixedCase
Parameter ShortERC721.safeTransferFrom(address,address,uint256,bytes)._from (contracts/token/ShortERC721.sol#558) is not in mixedCase
Parameter ShortERC721.safeTransferFrom(address,address,uint256,bytes)._to (contracts/token/ShortERC721.sol#558) is not in mixedCase
Parameter ShortERC721.safeTransferFrom(address,address,uint256,bytes)._tokenId (contracts/token/ShortERC721.sol#558) is not in mixedCase
Parameter ShortERC721.safeTransferFrom(address,address,uint256,bytes)._data (contracts/token/ShortERC721.sol#558) is not in mixedCase
Parameter ShortERC721.safeTransferFrom(address,address,uint256)._from (contracts/token/ShortERC721.sol#576) is not in mixedCase
Parameter ShortERC721.safeTransferFrom(address,address,uint256)._to (contracts/token/ShortERC721.sol#576) is not in mixedCase
Parameter ShortERC721.safeTransferFrom(address,address,uint256)._tokenId (contracts/token/ShortERC721.sol#576) is not in mixedCase
Parameter ShortERC721.transferFrom(address,address,uint256)._from (contracts/token/ShortERC721.sol#584) is not in mixedCase
Parameter ShortERC721.transferFrom(address,address,uint256)._to (contracts/token/ShortERC721.sol#584) is not in mixedCase
Parameter ShortERC721.transferFrom(address,address,uint256)._tokenId (contracts/token/ShortERC721.sol#584) is not in mixedCase
Parameter ShortERC721.approve(address,uint256)._approved (contracts/token/ShortERC721.sol#627) is not in mixedCase
Parameter ShortERC721.approve(address,uint256)._tokenId (contracts/token/ShortERC721.sol#627) is not in mixedCase
Function ShortERC721.__approve(address,address,uint256) (contracts/token/ShortERC721.sol#651-666) is not in mixedCase
Parameter ShortERC721.__approve(address,address,uint256)._owner (contracts/token/ShortERC721.sol#651) is not in mixedCase
Parameter ShortERC721.__approve(address,address,uint256)._operator (contracts/token/ShortERC721.sol#651) is not in mixedCase
Parameter ShortERC721.__approve(address,address,uint256)._tokenId (contracts/token/ShortERC721.sol#651) is not in mixedCase
Parameter ShortERC721.setApprovalForAll(address,bool)._operator (contracts/token/ShortERC721.sol#671) is not in mixedCase
Parameter ShortERC721.setApprovalForAll(address,bool)._approved (contracts/token/ShortERC721.sol#671) is not in mixedCase
Function ShortERC721.__approveForAll(address,address,bool) (contracts/token/ShortERC721.sol#690-699) is not in mixedCase
Parameter ShortERC721.__approveForAll(address,address,bool)._owner (contracts/token/ShortERC721.sol#690) is not in mixedCase
Parameter ShortERC721.__approveForAll(address,address,bool)._operator (contracts/token/ShortERC721.sol#690) is not in mixedCase
Parameter ShortERC721.__approveForAll(address,address,bool)._approved (contracts/token/ShortERC721.sol#690) is not in mixedCase
Function ShortERC721.__clearApproval(address,uint256) (contracts/token/ShortERC721.sol#713-720) is not in mixedCase
Parameter ShortERC721.__clearApproval(address,uint256)._owner (contracts/token/ShortERC721.sol#713) is not in mixedCase
Parameter ShortERC721.__clearApproval(address,uint256)._tokenId (contracts/token/ShortERC721.sol#713) is not in mixedCase
Parameter ShortERC721.permit(address,address,uint256,uint256,uint8,bytes32,bytes32)._owner (contracts/token/ShortERC721.sol#756) is not in mixedCase
Parameter ShortERC721.permit(address,address,uint256,uint256,uint8,bytes32,bytes32)._operator (contracts/token/ShortERC721.sol#756) is not in mixedCase
Parameter ShortERC721.permit(address,address,uint256,uint256,uint8,bytes32,bytes32)._tokenId (contracts/token/ShortERC721.sol#756) is not in mixedCase
Parameter ShortERC721.permit(address,address,uint256,uint256,uint8,bytes32,bytes32)._exp (contracts/token/ShortERC721.sol#756) is not in mixedCase
Parameter ShortERC721.permitForAll(address,address,bool,uint256,uint8,bytes32,bytes32)._owner (contracts/token/ShortERC721.sol#804) is not in mixedCase
Parameter ShortERC721.permitForAll(address,address,bool,uint256,uint8,bytes32,bytes32)._operator (contracts/token/ShortERC721.sol#804) is not in mixedCase
Parameter ShortERC721.permitForAll(address,address,bool,uint256,uint8,bytes32,bytes32)._approved (contracts/token/ShortERC721.sol#804) is not in mixedCase
Parameter ShortERC721.permitForAll(address,address,bool,uint256,uint8,bytes32,bytes32)._exp (contracts/token/ShortERC721.sol#804) is not in mixedCase
Function ShortERC721.__deriveSigner(bytes,uint8,bytes32,bytes32) (contracts/token/ShortERC721.sol#828-840) is not in mixedCase
Parameter ShortERC721.safeMint(address,uint256,bytes)._to (contracts/token/ShortERC721.sol#860) is not in mixedCase
Parameter ShortERC721.safeMint(address,uint256,bytes)._tokenId (contracts/token/ShortERC721.sol#860) is not in mixedCase
Parameter ShortERC721.safeMint(address,uint256,bytes)._data (contracts/token/ShortERC721.sol#860) is not in mixedCase
Parameter ShortERC721.safeMint(address,uint256)._to (contracts/token/ShortERC721.sol#890) is not in mixedCase
Parameter ShortERC721.safeMint(address,uint256)._tokenId (contracts/token/ShortERC721.sol#890) is not in mixedCase
Parameter ShortERC721.safeMintBatch(address,uint256,uint256,bytes)._to (contracts/token/ShortERC721.sol#914) is not in mixedCase
Parameter ShortERC721.safeMintBatch(address,uint256,uint256,bytes)._tokenId (contracts/token/ShortERC721.sol#914) is not in mixedCase
Parameter ShortERC721.safeMintBatch(address,uint256,uint256,bytes)._data (contracts/token/ShortERC721.sol#914) is not in mixedCase
Parameter ShortERC721.safeMintBatch(address,uint256,uint256)._to (contracts/token/ShortERC721.sol#952) is not in mixedCase
Parameter ShortERC721.safeMintBatch(address,uint256,uint256)._tokenId (contracts/token/ShortERC721.sol#952) is not in mixedCase
Parameter ShortERC721.mint(address,uint256)._to (contracts/token/ShortERC721.sol#969) is not in mixedCase
Parameter ShortERC721.mint(address,uint256)._tokenId (contracts/token/ShortERC721.sol#969) is not in mixedCase
Parameter ShortERC721.mintBatch(address,uint256,uint256)._to (contracts/token/ShortERC721.sol#1009) is not in mixedCase
Parameter ShortERC721.mintBatch(address,uint256,uint256)._tokenId (contracts/token/ShortERC721.sol#1009) is not in mixedCase
Function ShortERC721.__addLocal(uint256,address) (contracts/token/ShortERC721.sol#1058-1067) is not in mixedCase
Parameter ShortERC721.__addLocal(uint256,address)._tokenId (contracts/token/ShortERC721.sol#1058) is not in mixedCase
Parameter ShortERC721.__addLocal(uint256,address)._to (contracts/token/ShortERC721.sol#1058) is not in mixedCase
Function ShortERC721.__addToken(uint256,address) (contracts/token/ShortERC721.sol#1082-1088) is not in mixedCase
Parameter ShortERC721.__addToken(uint256,address)._tokenId (contracts/token/ShortERC721.sol#1082) is not in mixedCase
Parameter ShortERC721.__addToken(uint256,address)._to (contracts/token/ShortERC721.sol#1082) is not in mixedCase
Function ShortERC721.__addTokens(address,uint256,uint256) (contracts/token/ShortERC721.sol#1107-1121) is not in mixedCase
Parameter ShortERC721.__addTokens(address,uint256,uint256)._to (contracts/token/ShortERC721.sol#1107) is not in mixedCase
Parameter ShortERC721.__addTokens(address,uint256,uint256)._tokenId (contracts/token/ShortERC721.sol#1107) is not in mixedCase
Function ShortERC721.__removeLocal(uint256) (contracts/token/ShortERC721.sol#1135-1168) is not in mixedCase
Parameter ShortERC721.__removeLocal(uint256)._tokenId (contracts/token/ShortERC721.sol#1135) is not in mixedCase
Variable ShortERC721._tokenURIs (contracts/token/ShortERC721.sol#210) is not in mixedCase
Variable ShortERC721.DOMAIN_SEPARATOR (contracts/token/ShortERC721.sol#299) is not in mixedCase
Function TinyERC721.TOKEN_UID() (contracts/token/TinyERC721.sol#93) is not in mixedCase
Parameter TinyERC721.isTransferable(uint256)._tokenId (contracts/token/TinyERC721.sol#363) is not in mixedCase
Parameter TinyERC721.exists(uint256)._tokenId (contracts/token/TinyERC721.sol#382) is not in mixedCase
Parameter TinyERC721.setBaseURI(string)._baseURI (contracts/token/TinyERC721.sol#410) is not in mixedCase
Parameter TinyERC721.tokenURI(uint256)._tokenId (contracts/token/TinyERC721.sol#427) is not in mixedCase
Parameter TinyERC721.setTokenURI(uint256,string)._tokenId (contracts/token/TinyERC721.sol#456) is not in mixedCase
Parameter TinyERC721.setTokenURI(uint256,string)._tokenURI (contracts/token/TinyERC721.sol#456) is not in mixedCase
Parameter TinyERC721.balanceOf(address)._owner (contracts/token/TinyERC721.sol#477) is not in mixedCase
Parameter TinyERC721.ownerOf(uint256)._tokenId (contracts/token/TinyERC721.sol#489) is not in mixedCase
Parameter TinyERC721.tokenByIndex(uint256)._index (contracts/token/TinyERC721.sol#513) is not in mixedCase
Parameter TinyERC721.tokenOfOwnerByIndex(address,uint256)._owner (contracts/token/TinyERC721.sol#524) is not in mixedCase
Parameter TinyERC721.tokenOfOwnerByIndex(address,uint256)._index (contracts/token/TinyERC721.sol#524) is not in mixedCase
Parameter TinyERC721.getApproved(uint256)._tokenId (contracts/token/TinyERC721.sol#535) is not in mixedCase
Parameter TinyERC721.isApprovedForAll(address,address)._owner (contracts/token/TinyERC721.sol#546) is not in mixedCase
Parameter TinyERC721.isApprovedForAll(address,address)._operator (contracts/token/TinyERC721.sol#546) is not in mixedCase
Parameter TinyERC721.safeTransferFrom(address,address,uint256,bytes)._from (contracts/token/TinyERC721.sol#558) is not in mixedCase
Parameter TinyERC721.safeTransferFrom(address,address,uint256,bytes)._to (contracts/token/TinyERC721.sol#558) is not in mixedCase
Parameter TinyERC721.safeTransferFrom(address,address,uint256,bytes)._tokenId (contracts/token/TinyERC721.sol#558) is not in mixedCase
Parameter TinyERC721.safeTransferFrom(address,address,uint256,bytes)._data (contracts/token/TinyERC721.sol#558) is not in mixedCase
Parameter TinyERC721.safeTransferFrom(address,address,uint256)._from (contracts/token/TinyERC721.sol#576) is not in mixedCase
Parameter TinyERC721.safeTransferFrom(address,address,uint256)._to (contracts/token/TinyERC721.sol#576) is not in mixedCase
Parameter TinyERC721.safeTransferFrom(address,address,uint256)._tokenId (contracts/token/TinyERC721.sol#576) is not in mixedCase
Parameter TinyERC721.transferFrom(address,address,uint256)._from (contracts/token/TinyERC721.sol#584) is not in mixedCase
Parameter TinyERC721.transferFrom(address,address,uint256)._to (contracts/token/TinyERC721.sol#584) is not in mixedCase
Parameter TinyERC721.transferFrom(address,address,uint256)._tokenId (contracts/token/TinyERC721.sol#584) is not in mixedCase
Parameter TinyERC721.approve(address,uint256)._approved (contracts/token/TinyERC721.sol#627) is not in mixedCase
Parameter TinyERC721.approve(address,uint256)._tokenId (contracts/token/TinyERC721.sol#627) is not in mixedCase
Function TinyERC721.__approve(address,address,uint256) (contracts/token/TinyERC721.sol#651-666) is not in mixedCase
Parameter TinyERC721.__approve(address,address,uint256)._owner (contracts/token/TinyERC721.sol#651) is not in mixedCase
Parameter TinyERC721.__approve(address,address,uint256)._operator (contracts/token/TinyERC721.sol#651) is not in mixedCase
Parameter TinyERC721.__approve(address,address,uint256)._tokenId (contracts/token/TinyERC721.sol#651) is not in mixedCase
Parameter TinyERC721.setApprovalForAll(address,bool)._operator (contracts/token/TinyERC721.sol#671) is not in mixedCase
Parameter TinyERC721.setApprovalForAll(address,bool)._approved (contracts/token/TinyERC721.sol#671) is not in mixedCase
Function TinyERC721.__approveForAll(address,address,bool) (contracts/token/TinyERC721.sol#690-699) is not in mixedCase
Parameter TinyERC721.__approveForAll(address,address,bool)._owner (contracts/token/TinyERC721.sol#690) is not in mixedCase
Parameter TinyERC721.__approveForAll(address,address,bool)._operator (contracts/token/TinyERC721.sol#690) is not in mixedCase
Parameter TinyERC721.__approveForAll(address,address,bool)._approved (contracts/token/TinyERC721.sol#690) is not in mixedCase
Function TinyERC721.__clearApproval(address,uint256) (contracts/token/TinyERC721.sol#713-720) is not in mixedCase
Parameter TinyERC721.__clearApproval(address,uint256)._owner (contracts/token/TinyERC721.sol#713) is not in mixedCase
Parameter TinyERC721.__clearApproval(address,uint256)._tokenId (contracts/token/TinyERC721.sol#713) is not in mixedCase
Parameter TinyERC721.permit(address,address,uint256,uint256,uint8,bytes32,bytes32)._owner (contracts/token/TinyERC721.sol#756) is not in mixedCase
Parameter TinyERC721.permit(address,address,uint256,uint256,uint8,bytes32,bytes32)._operator (contracts/token/TinyERC721.sol#756) is not in mixedCase
Parameter TinyERC721.permit(address,address,uint256,uint256,uint8,bytes32,bytes32)._tokenId (contracts/token/TinyERC721.sol#756) is not in mixedCase
Parameter TinyERC721.permit(address,address,uint256,uint256,uint8,bytes32,bytes32)._exp (contracts/token/TinyERC721.sol#756) is not in mixedCase
Parameter TinyERC721.permitForAll(address,address,bool,uint256,uint8,bytes32,bytes32)._owner (contracts/token/TinyERC721.sol#804) is not in mixedCase
Parameter TinyERC721.permitForAll(address,address,bool,uint256,uint8,bytes32,bytes32)._operator (contracts/token/TinyERC721.sol#804) is not in mixedCase
Parameter TinyERC721.permitForAll(address,address,bool,uint256,uint8,bytes32,bytes32)._approved (contracts/token/TinyERC721.sol#804) is not in mixedCase
Parameter TinyERC721.permitForAll(address,address,bool,uint256,uint8,bytes32,bytes32)._exp (contracts/token/TinyERC721.sol#804) is not in mixedCase
Function TinyERC721.__deriveSigner(bytes,uint8,bytes32,bytes32) (contracts/token/TinyERC721.sol#828-840) is not in mixedCase
Parameter TinyERC721.safeMint(address,uint256,bytes)._to (contracts/token/TinyERC721.sol#860) is not in mixedCase
Parameter TinyERC721.safeMint(address,uint256,bytes)._tokenId (contracts/token/TinyERC721.sol#860) is not in mixedCase
Parameter TinyERC721.safeMint(address,uint256,bytes)._data (contracts/token/TinyERC721.sol#860) is not in mixedCase
Parameter TinyERC721.safeMint(address,uint256)._to (contracts/token/TinyERC721.sol#890) is not in mixedCase
Parameter TinyERC721.safeMint(address,uint256)._tokenId (contracts/token/TinyERC721.sol#890) is not in mixedCase
Parameter TinyERC721.safeMintBatch(address,uint256,uint256,bytes)._to (contracts/token/TinyERC721.sol#914) is not in mixedCase
Parameter TinyERC721.safeMintBatch(address,uint256,uint256,bytes)._tokenId (contracts/token/TinyERC721.sol#914) is not in mixedCase
Parameter TinyERC721.safeMintBatch(address,uint256,uint256,bytes)._data (contracts/token/TinyERC721.sol#914) is not in mixedCase
Parameter TinyERC721.safeMintBatch(address,uint256,uint256)._to (contracts/token/TinyERC721.sol#952) is not in mixedCase
Parameter TinyERC721.safeMintBatch(address,uint256,uint256)._tokenId (contracts/token/TinyERC721.sol#952) is not in mixedCase
Parameter TinyERC721.mint(address,uint256)._to (contracts/token/TinyERC721.sol#969) is not in mixedCase
Parameter TinyERC721.mint(address,uint256)._tokenId (contracts/token/TinyERC721.sol#969) is not in mixedCase
Parameter TinyERC721.mintBatch(address,uint256,uint256)._to (contracts/token/TinyERC721.sol#1009) is not in mixedCase
Parameter TinyERC721.mintBatch(address,uint256,uint256)._tokenId (contracts/token/TinyERC721.sol#1009) is not in mixedCase
Parameter TinyERC721.burn(uint256)._tokenId (contracts/token/TinyERC721.sol#1053) is not in mixedCase
Function TinyERC721.__addLocal(uint256,address) (contracts/token/TinyERC721.sol#1099-1111) is not in mixedCase
Parameter TinyERC721.__addLocal(uint256,address)._tokenId (contracts/token/TinyERC721.sol#1099) is not in mixedCase
Parameter TinyERC721.__addLocal(uint256,address)._to (contracts/token/TinyERC721.sol#1099) is not in mixedCase
Function TinyERC721.__addToken(uint256,address) (contracts/token/TinyERC721.sol#1126-1138) is not in mixedCase
Parameter TinyERC721.__addToken(uint256,address)._tokenId (contracts/token/TinyERC721.sol#1126) is not in mixedCase
Parameter TinyERC721.__addToken(uint256,address)._to (contracts/token/TinyERC721.sol#1126) is not in mixedCase
Function TinyERC721.__addTokens(address,uint256,uint256) (contracts/token/TinyERC721.sol#1157-1171) is not in mixedCase
Parameter TinyERC721.__addTokens(address,uint256,uint256)._to (contracts/token/TinyERC721.sol#1157) is not in mixedCase
Parameter TinyERC721.__addTokens(address,uint256,uint256)._tokenId (contracts/token/TinyERC721.sol#1157) is not in mixedCase
Function TinyERC721.__removeLocal(uint256) (contracts/token/TinyERC721.sol#1185-1219) is not in mixedCase
Parameter TinyERC721.__removeLocal(uint256)._tokenId (contracts/token/TinyERC721.sol#1185) is not in mixedCase
Function TinyERC721.__removeToken(uint256) (contracts/token/TinyERC721.sol#1233-1264) is not in mixedCase
Parameter TinyERC721.__removeToken(uint256)._tokenId (contracts/token/TinyERC721.sol#1233) is not in mixedCase
Variable TinyERC721._tokenURIs (contracts/token/TinyERC721.sol#203) is not in mixedCase
Variable TinyERC721.DOMAIN_SEPARATOR (contracts/token/TinyERC721.sol#298) is not in mixedCase
Parameter AccessControl.updateFeatures(uint256)._mask (contracts/utils/AccessControl.sol#121) is not in mixedCase
Function AccessControl.__hasRole(uint256,uint256) (contracts/utils/AccessControl.sol#239-242) is not in mixedCase
Parameter UpgradeableAccessControl.updateFeatures(uint256)._mask (contracts/utils/UpgradeableAccessControl.sol#172) is not in mixedCase
Function UpgradeableAccessControl.__hasRole(uint256,uint256) (contracts/utils/UpgradeableAccessControl.sol#290-293) is not in mixedCase
Variable UpgradeableAccessControl.__gap (contracts/utils/UpgradeableAccessControl.sol#77) is not in mixedCase
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#conformance-to-solidity-naming-conventions
INFO:Detectors:
Redundant expression "a (contracts/mocks/ZeppelinERC721ReceiverMock.sol#36)" inZeppelinERC721ReceiverMock (contracts/mocks/ZeppelinERC721ReceiverMock.sol#6-41)
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#redundant-statements
INFO:Detectors:
Reentrancy in FixedSupplySale.buySingleTo(address) (contracts/protocol/FixedSupplySale.sol#498-534):
	External calls:
	- address(msg.sender).transfer(msg.value - itemPrice) (contracts/protocol/FixedSupplySale.sol#529)
	Event emitted after the call(s):
	- Bought(msg.sender,_to,1,aliValue,itemPrice) (contracts/protocol/FixedSupplySale.sol#533)
Reentrancy in MintableSale.buySingleTo(address) (contracts/protocol/MintableSale.sol#362-386):
	External calls:
	- address(msg.sender).transfer(msg.value - itemPrice) (contracts/protocol/MintableSale.sol#381)
	Event emitted after the call(s):
	- Bought(msg.sender,_to,1,itemPrice) (contracts/protocol/MintableSale.sol#385)
Reentrancy in FixedSupplySale.buyTo(address,uint32) (contracts/protocol/FixedSupplySale.sol#425-481):
	External calls:
	- address(msg.sender).transfer(msg.value - totalPrice) (contracts/protocol/FixedSupplySale.sol#476)
	Event emitted after the call(s):
	- Bought(msg.sender,_to,_amount,_aliValue,totalPrice) (contracts/protocol/FixedSupplySale.sol#480)
Reentrancy in MintableSale.buyTo(address,uint32) (contracts/protocol/MintableSale.sol#316-345):
	External calls:
	- address(msg.sender).transfer(msg.value - totalPrice) (contracts/protocol/MintableSale.sol#340)
	Event emitted after the call(s):
	- Bought(msg.sender,_to,_amount,totalPrice) (contracts/protocol/MintableSale.sol#344)
Reentrancy in FixedSupplySale.withdrawTo(address) (contracts/protocol/FixedSupplySale.sol#551-569):
	External calls:
	- address(_to).transfer(_value) (contracts/protocol/FixedSupplySale.sol#565)
	Event emitted after the call(s):
	- Withdrawn(msg.sender,_to,_value) (contracts/protocol/FixedSupplySale.sol#568)
Reentrancy in MintableSale.withdrawTo(address) (contracts/protocol/MintableSale.sol#403-421):
	External calls:
	- address(_to).transfer(_value) (contracts/protocol/MintableSale.sol#417)
	Event emitted after the call(s):
	- Withdrawn(msg.sender,_to,_value) (contracts/protocol/MintableSale.sol#420)
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#reentrancy-vulnerabilities-4
INFO:Detectors:
Clones.clone(address) (node_modules/@openzeppelin/contracts/proxy/Clones.sol#25-34) uses literals with too many digits:
	- mstore(uint256,uint256)(ptr_clone_asm_0,0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000) (node_modules/@openzeppelin/contracts/proxy/Clones.sol#28)
Clones.clone(address) (node_modules/@openzeppelin/contracts/proxy/Clones.sol#25-34) uses literals with too many digits:
	- mstore(uint256,uint256)(ptr_clone_asm_0 + 0x28,0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000) (node_modules/@openzeppelin/contracts/proxy/Clones.sol#30)
Clones.cloneDeterministic(address,bytes32) (node_modules/@openzeppelin/contracts/proxy/Clones.sol#43-52) uses literals with too many digits:
	- mstore(uint256,uint256)(ptr_cloneDeterministic_asm_0,0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000) (node_modules/@openzeppelin/contracts/proxy/Clones.sol#46)
Clones.cloneDeterministic(address,bytes32) (node_modules/@openzeppelin/contracts/proxy/Clones.sol#43-52) uses literals with too many digits:
	- mstore(uint256,uint256)(ptr_cloneDeterministic_asm_0 + 0x28,0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000) (node_modules/@openzeppelin/contracts/proxy/Clones.sol#48)
Clones.predictDeterministicAddress(address,bytes32,address) (node_modules/@openzeppelin/contracts/proxy/Clones.sol#57-72) uses literals with too many digits:
	- mstore(uint256,uint256)(ptr_predictDeterministicAddress_asm_0,0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000) (node_modules/@openzeppelin/contracts/proxy/Clones.sol#64)
Clones.predictDeterministicAddress(address,bytes32,address) (node_modules/@openzeppelin/contracts/proxy/Clones.sol#57-72) uses literals with too many digits:
	- mstore(uint256,uint256)(ptr_predictDeterministicAddress_asm_0 + 0x28,0x5af43d82803e903d91602b57fd5bf3ff00000000000000000000000000000000) (node_modules/@openzeppelin/contracts/proxy/Clones.sol#66)
AccessControlMock.slitherConstructorConstantVariables() (contracts/mocks/AccessControlMocks.sol#14-17) uses literals with too many digits:
	- ROLE_ACCESS_MANAGER = 0x8000000000000000000000000000000000000000000000000000000000000000 (contracts/utils/AccessControl.sol#60)
UpgradeableAccessControlMock.slitherConstructorConstantVariables() (contracts/mocks/AccessControlMocks.sol#26-42) uses literals with too many digits:
	- ROLE_ACCESS_MANAGER = 0x8000000000000000000000000000000000000000000000000000000000000000 (contracts/utils/UpgradeableAccessControl.sol#88)
UpgradeableAccessControlMock.slitherConstructorConstantVariables() (contracts/mocks/AccessControlMocks.sol#26-42) uses literals with too many digits:
	- ROLE_UPGRADE_MANAGER = 0x4000000000000000000000000000000000000000000000000000000000000000 (contracts/utils/UpgradeableAccessControl.sol#98)
UpgradeableAccessControlMock2.slitherConstructorConstantVariables() (contracts/mocks/AccessControlMocks.sol#51-67) uses literals with too many digits:
	- ROLE_ACCESS_MANAGER = 0x8000000000000000000000000000000000000000000000000000000000000000 (contracts/utils/UpgradeableAccessControl.sol#88)
UpgradeableAccessControlMock2.slitherConstructorConstantVariables() (contracts/mocks/AccessControlMocks.sol#51-67) uses literals with too many digits:
	- ROLE_UPGRADE_MANAGER = 0x4000000000000000000000000000000000000000000000000000000000000000 (contracts/utils/UpgradeableAccessControl.sol#98)
AliCompMock.slitherConstructorConstantVariables() (contracts/mocks/AliCompMock.sol#7-23) uses literals with too many digits:
	- ROLE_ACCESS_MANAGER = 0x8000000000000000000000000000000000000000000000000000000000000000 (contracts/utils/AccessControl.sol#60)
ShortERC721.__removeLocal(uint256) (contracts/token/ShortERC721.sol#1135-1168) uses literals with too many digits:
	- tokens[sourceId] = tokens[sourceId] & 0x000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF | i << 160 (contracts/token/ShortERC721.sol#1154-1157)
BurnableShortERC721Mock.slitherConstructorConstantVariables() (contracts/mocks/BurnableShortERC721Mock.sol#7-14) uses literals with too many digits:
	- ROLE_ACCESS_MANAGER = 0x8000000000000000000000000000000000000000000000000000000000000000 (contracts/utils/AccessControl.sol#60)
CharacterCompMock.slitherConstructorConstantVariables() (contracts/mocks/CharacterCompMock.sol#7-23) uses literals with too many digits:
	- ROLE_ACCESS_MANAGER = 0x8000000000000000000000000000000000000000000000000000000000000000 (contracts/utils/AccessControl.sol#60)
FixedSupplySaleMock.slitherConstructorConstantVariables() (contracts/mocks/FixedSupplySaleMock.sol#7-49) uses literals with too many digits:
	- ROLE_ACCESS_MANAGER = 0x8000000000000000000000000000000000000000000000000000000000000000 (contracts/utils/AccessControl.sol#60)
LockableShortERC721Mock.slitherConstructorConstantVariables() (contracts/mocks/LockableShortERC721Mock.sol#6-28) uses literals with too many digits:
	- ROLE_ACCESS_MANAGER = 0x8000000000000000000000000000000000000000000000000000000000000000 (contracts/utils/AccessControl.sol#60)
TinyERC721.__addLocal(uint256,address) (contracts/token/TinyERC721.sol#1099-1111) uses literals with too many digits:
	- tokens[_tokenId] = tokens[_tokenId] & 0x00000000FFFFFFFF000000000000000000000000000000000000000000000000 | uint192(destination.length) << 160 | uint160(_to) (contracts/token/TinyERC721.sol#1104-1107)
TinyERC721.__removeLocal(uint256) (contracts/token/TinyERC721.sol#1185-1219) uses literals with too many digits:
	- tokens[sourceId] = tokens[sourceId] & 0x00000000FFFFFFFF00000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF | uint192(i) << 160 (contracts/token/TinyERC721.sol#1205-1208)
TinyERC721.__removeToken(uint256) (contracts/token/TinyERC721.sol#1233-1264) uses literals with too many digits:
	- tokens[lastId] = tokens[lastId] & 0x0000000000000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF | uint224(i) << 192 (contracts/token/TinyERC721.sol#1253-1256)
LockableTinyERC721Mock.slitherConstructorConstantVariables() (contracts/mocks/LockableTinyERC721Mock.sol#6-28) uses literals with too many digits:
	- ROLE_ACCESS_MANAGER = 0x8000000000000000000000000000000000000000000000000000000000000000 (contracts/utils/AccessControl.sol#60)
MintableSaleMock.slitherConstructorConstantVariables() (contracts/mocks/MintableSaleMock.sol#7-48) uses literals with too many digits:
	- ROLE_ACCESS_MANAGER = 0x8000000000000000000000000000000000000000000000000000000000000000 (contracts/utils/AccessControl.sol#60)
NFTStakingMock.slitherConstructorConstantVariables() (contracts/mocks/NFTStakingMock.sol#7-24) uses literals with too many digits:
	- ROLE_ACCESS_MANAGER = 0x8000000000000000000000000000000000000000000000000000000000000000 (contracts/utils/AccessControl.sol#60)
RoyalERC721Mock.slitherConstructorConstantVariables() (contracts/mocks/RoyalERC721Mock.sol#7-14) uses literals with too many digits:
	- ROLE_ACCESS_MANAGER = 0x8000000000000000000000000000000000000000000000000000000000000000 (contracts/utils/AccessControl.sol#60)
ShortERC721Mock.slitherConstructorConstantVariables() (contracts/mocks/ShortERC721Mock.sol#7-14) uses literals with too many digits:
	- ROLE_ACCESS_MANAGER = 0x8000000000000000000000000000000000000000000000000000000000000000 (contracts/utils/AccessControl.sol#60)
TinyERC721Mock.slitherConstructorConstantVariables() (contracts/mocks/TinyERC721Mock.sol#7-14) uses literals with too many digits:
	- ROLE_ACCESS_MANAGER = 0x8000000000000000000000000000000000000000000000000000000000000000 (contracts/utils/AccessControl.sol#60)
ERC721Drop.slitherConstructorConstantVariables() (contracts/protocol/ERC721Drop.sol#25-180) uses literals with too many digits:
	- ROLE_ACCESS_MANAGER = 0x8000000000000000000000000000000000000000000000000000000000000000 (contracts/utils/AccessControl.sol#60)
IntelliLinker.slitherConstructorConstantVariables() (contracts/protocol/IntelliLinker.sol#22-513) uses literals with too many digits:
	- ROLE_ACCESS_MANAGER = 0x8000000000000000000000000000000000000000000000000000000000000000 (contracts/utils/AccessControl.sol#60)
IntelliLinkerV2.slitherConstructorConstantVariables() (contracts/protocol/IntelliLinkerV2.sol#27-589) uses literals with too many digits:
	- ROLE_ACCESS_MANAGER = 0x8000000000000000000000000000000000000000000000000000000000000000 (contracts/utils/UpgradeableAccessControl.sol#88)
IntelliLinkerV2.slitherConstructorConstantVariables() (contracts/protocol/IntelliLinkerV2.sol#27-589) uses literals with too many digits:
	- ROLE_UPGRADE_MANAGER = 0x4000000000000000000000000000000000000000000000000000000000000000 (contracts/utils/UpgradeableAccessControl.sol#98)
IntelliLinkerV3.slitherConstructorConstantVariables() (contracts/protocol/IntelliLinkerV3.sol#35-618) uses literals with too many digits:
	- ROLE_ACCESS_MANAGER = 0x8000000000000000000000000000000000000000000000000000000000000000 (contracts/utils/UpgradeableAccessControl.sol#88)
IntelliLinkerV3.slitherConstructorConstantVariables() (contracts/protocol/IntelliLinkerV3.sol#35-618) uses literals with too many digits:
	- ROLE_UPGRADE_MANAGER = 0x4000000000000000000000000000000000000000000000000000000000000000 (contracts/utils/UpgradeableAccessControl.sol#98)
IntelligentNFTv2.slitherConstructorConstantVariables() (contracts/protocol/IntelligentNFTv2.sol#94-850) uses literals with too many digits:
	- ROLE_ACCESS_MANAGER = 0x8000000000000000000000000000000000000000000000000000000000000000 (contracts/utils/AccessControl.sol#60)
NFTFactory.slitherConstructorConstantVariables() (contracts/protocol/NFTFactory.sol#29-334) uses literals with too many digits:
	- ROLE_ACCESS_MANAGER = 0x8000000000000000000000000000000000000000000000000000000000000000 (contracts/utils/AccessControl.sol#60)
NFTFactoryV2.slitherConstructorConstantVariables() (contracts/protocol/NFTFactoryV2.sol#33-359) uses literals with too many digits:
	- ROLE_ACCESS_MANAGER = 0x8000000000000000000000000000000000000000000000000000000000000000 (contracts/utils/AccessControl.sol#60)
NFTFactoryV3.slitherConstructorConstantVariables() (contracts/protocol/NFTFactoryV3.sol#31-401) uses literals with too many digits:
	- ROLE_ACCESS_MANAGER = 0x8000000000000000000000000000000000000000000000000000000000000000 (contracts/utils/AccessControl.sol#60)
OpenSeaFactoryImpl.slitherConstructorConstantVariables() (contracts/protocol/OpenSeaFactory.sol#100-396) uses literals with too many digits:
	- ROLE_ACCESS_MANAGER = 0x8000000000000000000000000000000000000000000000000000000000000000 (contracts/utils/AccessControl.sol#60)
AletheaNFT.slitherConstructorConstantVariables() (contracts/token/AletheaNFT.sol#16-27) uses literals with too many digits:
	- ROLE_ACCESS_MANAGER = 0x8000000000000000000000000000000000000000000000000000000000000000 (contracts/utils/AccessControl.sol#60)
BinanceAliERC20v2.slitherConstructorConstantVariables() (contracts/token/BinanceAliERC20v2.sol#1981-1997) uses literals with too many digits:
	- ROLE_ACCESS_MANAGER = 0x8000000000000000000000000000000000000000000000000000000000000000 (contracts/utils/AccessControl.sol#60)
PersonalityPodERC721.slitherConstructorConstantVariables() (contracts/token/PersonalityPodERC721.sol#21-32) uses literals with too many digits:
	- ROLE_ACCESS_MANAGER = 0x8000000000000000000000000000000000000000000000000000000000000000 (contracts/utils/AccessControl.sol#60)
PolygonAliERC20v2.slitherConstructorConstantVariables() (contracts/token/PolygonAliERC20v2.sol#17-55) uses literals with too many digits:
	- ROLE_ACCESS_MANAGER = 0x8000000000000000000000000000000000000000000000000000000000000000 (contracts/utils/AccessControl.sol#60)
WhitelabelNFT.slitherConstructorConstantVariables() (contracts/token/WhitelabelNFT.sol#19-30) uses literals with too many digits:
	- ROLE_ACCESS_MANAGER = 0x8000000000000000000000000000000000000000000000000000000000000000 (contracts/utils/AccessControl.sol#60)
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#too-many-digits
INFO:Detectors:
IntelliLinkerV3.aliContract (contracts/protocol/IntelliLinkerV3.sol#39) should be constant
IntelliLinkerV3.iNftContract (contracts/protocol/IntelliLinkerV3.sol#49) should be constant
IntelliLinkerV3.personalityContract (contracts/protocol/IntelliLinkerV3.sol#44) should be constant
<b style="color: black;">IntelligentNFTv2.name (contracts/protocol/IntelligentNFTv2.sol#98) should be constant
IntelligentNFTv2.symbol (contracts/protocol/IntelligentNFTv2.sol#103) should be constant</b>
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#state-variables-that-could-be-declared-constant
<b style="color: black;">INFO:Detectors:
ERC1363ReceiverMock._retval (contracts/mocks/ERC1363Mock.sol#34) should be immutable
ERC1363ReceiverMock._reverts (contracts/mocks/ERC1363Mock.sol#35) should be immutable
ERC1363SpenderMock._retval (contracts/mocks/ERC1363Mock.sol#59) should be immutable
ERC1363SpenderMock._reverts (contracts/mocks/ERC1363Mock.sol#60) should be immutable
OpenSeaFactoryImpl.options (contracts/protocol/OpenSeaFactory.sol#123) should be immutable
OpenSeaFactoryImpl.owner (contracts/protocol/OpenSeaFactory.sol#105) should be immutable
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#state-variables-that-could-be-declared-immutable</b>
INFO:Slither:. analyzed (104 contracts with 85 detectors), 894 result(s) found

</pre>
