// Auxiliary behavior for ERC1363 test, imported from vittominacori
// Source: https://github.com/vittominacori/erc1363-payable-token/blob/master/test/introspection/SupportsInterface.behavior.js

const { makeInterfaceId } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const INTERFACES = {
  ERC165: [
    'supportsInterface(bytes4)',
  ],
  ERC1363: [
    'transferAndCall(address,uint256)',
    'transferAndCall(address,uint256,bytes)',
    'transferFromAndCall(address,address,uint256)',
    'transferFromAndCall(address,address,uint256,bytes)',
    'approveAndCall(address,uint256)',
    'approveAndCall(address,uint256,bytes)',
  ],
  ERC1363Receiver: [
    'onTransferReceived(address,address,uint256,bytes)',
  ],
  ERC1363Spender: [
    'onApprovalReceived(address,uint256,bytes)',
  ],
  ERC721: [
    'balanceOf(address)',
    'ownerOf(uint256)',
    'safeTransferFrom(address,address,uint256,bytes)',
    'safeTransferFrom(address,address,uint256)',
    'transferFrom(address,address,uint256)',
    'approve(address,uint256)',
    'setApprovalForAll(address,bool)',
    'getApproved(uint256)',
    'isApprovedForAll(address,address)'
  ],
  IntelligentNFTv2: [
    'name()',
    'symbol()',
    'tokenURI(uint256)',
    'totalSupply()',
    'exists(uint256)',
    'ownerOf(uint256)'
  ],
  AccessExtension: [
    'removeFeature(bytes32)',
    'addFeature(bytes32)',
    'isFeatureEnabled(bytes32)',
  ],
  // AccessControl: [
  //   'hasRole(bytes32,address)',
  //   'getRoleAdmin(bytes32)',
  //   'grantRole(bytes32,address)',
  //   'revokeRole(bytes32,address)',
  //   'renounceRole(bytes32,address)'
  // ]
};

const INTERFACE_IDS = {};
const FN_SIGNATURES = {};
for (const k of Object.getOwnPropertyNames(INTERFACES)) {
  INTERFACE_IDS[k] = makeInterfaceId.ERC165(INTERFACES[k]);
  for (const fnName of INTERFACES[k]) {
    // the interface id of a single function is equivalent to its function signature
    FN_SIGNATURES[fnName] = makeInterfaceId.ERC165([fnName]);
  }
}

function shouldSupportInterfaces (interfaces = [], contractUnderTest) {
  describe('Contract interface', function () {
    beforeEach(function () {
      this.contractUnderTest = this.mock || this.token || this.holder || contractUnderTest;
    });

    for (const k of interfaces) {
      const interfaceId = INTERFACE_IDS[k];
      describe(k, function () {
        describe('ERC165\'s supportsInterface(bytes4)', function () {
          it('uses less than 30k gas [skip-on-coverage]', async function () {
            expect(await this.contractUnderTest.supportsInterface.estimateGas(interfaceId)).to.be.lte(30000);
          });

          it('claims support', async function () {
            expect(await this.contractUnderTest.supportsInterface(interfaceId)).to.equal(true);
          });
        });

        for (const fnName of INTERFACES[k]) {
          const fnSig = FN_SIGNATURES[fnName];
          describe(fnName, function () {
            it('has to be implemented', function () {
              expect(this.contractUnderTest.abi.filter(fn => fn.signature === fnSig).length).to.equal(1);
            });
          });
        }
      });
    }
  });
}

module.exports = {
  shouldSupportInterfaces,
};
