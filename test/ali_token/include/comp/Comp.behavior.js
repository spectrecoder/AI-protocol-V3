// Auxiliary behavior for Compound ERC20 token test, imported from Compound project
// Source: https://github.com/compound-finance/compound-protocol/blob/master/tests/Governance/CompTest.js

// Zeppelin libraries
const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { ZERO_ADDRESS, ZERO_BYTES32 } = constants;
// enable chai-subset to allow containSubset, see https://www.chaijs.com/plugins/chai-subset/
require("chai").use(require("chai-subset"));

// JSON-RPC helpers
const {
  minerStart,
  minerStop,
  mineBlock
} = require('./rpc_api');

// EIP712 helpers
const eip712 = require('./eip712');

function shouldBehaveLikeComp(name, contract_name, symbol, S0, root, a1, a2, a3, a1_pk) {
  describe('metadata', function() {
    it('has given name', async function() {
      expect(await this.comp.name()).to.equal(name);
    });

    it('has given symbol', async function() {
      expect(await this.comp.symbol()).to.equal(symbol);
    });
  });

  describe('balanceOf', function() {
    it('grants to initial account', async function() {
      expect(await this.comp.balanceOf(root)).to.be.bignumber.equal(S0);
    });
  });

  describe('delegateBySig (ALI: delegateWithAuthorization)', function() {
    let chainId;
    let Domain;
    beforeEach(async function() {
      // Chain ID opcode hardcoded at 1 in Ganache-cli, but not in Hardhat
      // See: https://github.com/trufflesuite/ganache/issues/1643
      //      https://github.com/trufflesuite/ganache-core/issues/515
      chainId = await web3.eth.net.getId();
      Domain = { name: contract_name, chainId, verifyingContract: this.comp.address };
    });
    const Types = {
      Delegation: [
        { name: 'delegate', type: 'address' },
        { name: 'nonce', type: 'uint256' },
        { name: 'expiry', type: 'uint256' }
      ]
    };

    it('reverts if the signatory is invalid', async function() {
      const delegate = root, nonce = ZERO_BYTES32, expiry = 0;
      await expectRevert(this.comp.delegateWithAuthorization(delegate, nonce, expiry, 0, '0xbad', '0xbad'), "invalid signature");
    });

    it('reverts if the nonce is bad ', async function() {
      const delegate = root, nonce = ZERO_BYTES32, expiry = 10e9;
      const { v, r, s } = eip712.sign(Domain, 'Delegation', { delegate, nonce, expiry }, Types, a1_pk);
      await this.comp.delegateWithAuthorization(delegate, nonce, expiry, v, r, s); // use the nonce
      await expectRevert(this.comp.delegateWithAuthorization(delegate, nonce, expiry, v, r, s), "invalid nonce");
    });

    it('reverts if the signature has expired', async function() {
      const delegate = root, nonce = ZERO_BYTES32, expiry = 0;
      const { v, r, s } = eip712.sign(Domain, 'Delegation', { delegate, nonce, expiry }, Types, a1_pk);
      await expectRevert(this.comp.delegateWithAuthorization(delegate, nonce, expiry, v, r, s), "signature expired");
    });

    it('delegates on behalf of the signatory', async function() {
      const delegate = root, nonce = ZERO_BYTES32, expiry = 10e9;
      const { v, r, s } = eip712.sign(Domain, 'Delegation', { delegate, nonce, expiry }, Types, a1_pk);
      expect(await this.comp.votingDelegates(a1)).to.equal(ZERO_ADDRESS);
      const tx = await this.comp.delegateWithAuthorization(delegate, nonce, expiry, v, r, s);
      expect(tx.gasUsed < 80000);
      expect(await this.comp.votingDelegates(a1)).to.equal(root);
    });
  });

  describe('numCheckpoints (ALI: votingPowerHistoryLength)', function() {
    it('returns the number of checkpoints for a delegate', async function() {
      let guy = a3;
      await this.comp.transfer(guy, 100, { from: root }); //give an account a few tokens for readability
      expect(await this.comp.votingPowerHistoryLength(a1)).to.be.bignumber.that.equals('0');

      const t1 = await this.comp.delegate(a1, { from: guy });
      expect(await this.comp.votingPowerHistoryLength(a1)).to.be.bignumber.that.equals('1');

      const t2 = await this.comp.transfer(a2, 10, { from: guy });
      expect(await this.comp.votingPowerHistoryLength(a1)).to.be.bignumber.that.equals('2');

      const t3 = await this.comp.transfer(a2, 10, { from: guy });
      expect(await this.comp.votingPowerHistoryLength(a1)).to.be.bignumber.that.equals('3');

      const t4 = await this.comp.transfer(guy, 20, { from: root });
      expect(await this.comp.votingPowerHistoryLength(a1)).to.be.bignumber.that.equals('4');

      expect(await this.comp.votingPowerHistory(a1, 0)).to.containSubset({ k: new BN(t1.receipt.blockNumber), v: new BN(100) });
      expect(await this.comp.votingPowerHistory(a1, 1)).to.containSubset({ k: new BN(t2.receipt.blockNumber), v: new BN(90) });
      expect(await this.comp.votingPowerHistory(a1, 2)).to.containSubset({ k: new BN(t3.receipt.blockNumber), v: new BN(80) });
      expect(await this.comp.votingPowerHistory(a1, 3)).to.containSubset({ k: new BN(t4.receipt.blockNumber), v: new BN(100) });
    });

    it('does not add more than one checkpoint in a block', async function() {
      let guy = a3;

      await this.comp.transfer(guy, 100, { from: root }); //give an account a few tokens for readability
      expect(await this.comp.votingPowerHistoryLength(a1)).to.be.bignumber.that.equals('0');
      /*await minerStop();

      let t1 = this.comp.delegate(a1, { from: guy });
      let t2 = this.comp.transfer(a2, 10, { from: guy });
      let t3 = this.comp.transfer(a2, 10, { from: guy });

      await minerStart();
      t1 = await t1;
      t2 = await t2;
      t3 = await t3;*/const t1 = await this.comp.__delegate_transfer_transfer(a1, a2, 10, { from: guy });

      expect(await this.comp.votingPowerHistoryLength(a1)).to.be.bignumber.that.equals('1');

      expect(await this.comp.votingPowerHistory(a1, 0)).to.containSubset({ k: new BN(t1.receipt.blockNumber), v: new BN(80) });
      await expectRevert.unspecified(this.comp.votingPowerHistory(a1, 1));
      await expectRevert.unspecified(this.comp.votingPowerHistory(a1, 2));

      const t4 = await this.comp.transfer(guy, 20, { from: root });
      expect(await this.comp.votingPowerHistoryLength(a1)).to.be.bignumber.that.equals('2');
      expect(await this.comp.votingPowerHistory(a1, 1)).to.containSubset({ k: new BN(t4.receipt.blockNumber), v: new BN(100) });
    });
  });

  describe('getPriorVotes (ALI: votingPowerAt)', function() {
    it('reverts if block number >= current block', async function() {
      await expectRevert(this.comp.votingPowerAt(a1, 5e10), "block not yet mined");
    });

    it('returns 0 if there are no checkpoints', async function() {
      expect(await this.comp.votingPowerAt(a1, 0)).to.be.bignumber.that.equals('0');
    });

    it('returns the latest block if >= last checkpoint block', async function() {
      const t1 = await this.comp.delegate(a1, { from: root });
      await mineBlock();
      await mineBlock();

      expect(await this.comp.votingPowerAt(a1, t1.receipt.blockNumber)).to.be.bignumber.that.equals(S0);
      expect(await this.comp.votingPowerAt(a1, t1.receipt.blockNumber + 1)).to.be.bignumber.that.equals(S0);
    });

    it('returns zero if < first checkpoint block', async function() {
      await mineBlock();
      const t1 = await this.comp.delegate(a1, { from: root });
      await mineBlock();
      await mineBlock();

      expect(await this.comp.votingPowerAt(a1, t1.receipt.blockNumber - 1)).to.be.bignumber.that.equals('0');
      expect(await this.comp.votingPowerAt(a1, t1.receipt.blockNumber + 1)).to.be.bignumber.that.equals(S0);
    });

    it('generally returns the voting balance at the appropriate checkpoint', async function() {
      const t1 = await this.comp.delegate(a1, { from: root });
      await mineBlock();
      await mineBlock();
      const t2 = await this.comp.transfer(a2, 10, { from: root });
      await mineBlock();
      await mineBlock();
      const t3 = await this.comp.transfer(a2, 10, { from: root });
      await mineBlock();
      await mineBlock();
      const t4 = await this.comp.transfer(root, 20, { from: a2 });
      await mineBlock();
      await mineBlock();

      expect(await this.comp.votingPowerAt(a1, t1.receipt.blockNumber - 1)).to.be.bignumber.that.equals('0');
      expect(await this.comp.votingPowerAt(a1, t1.receipt.blockNumber)).to.be.bignumber.that.equals(S0);
      expect(await this.comp.votingPowerAt(a1, t1.receipt.blockNumber + 1)).to.be.bignumber.that.equals(S0);
      expect(await this.comp.votingPowerAt(a1, t2.receipt.blockNumber)).to.be.bignumber.that.equals(S0.subn(10));
      expect(await this.comp.votingPowerAt(a1, t2.receipt.blockNumber + 1)).to.be.bignumber.that.equals(S0.subn(10));
      expect(await this.comp.votingPowerAt(a1, t3.receipt.blockNumber)).to.be.bignumber.that.equals(S0.subn(20));
      expect(await this.comp.votingPowerAt(a1, t3.receipt.blockNumber + 1)).to.be.bignumber.that.equals(S0.subn(20));
      expect(await this.comp.votingPowerAt(a1, t4.receipt.blockNumber)).to.be.bignumber.that.equals(S0);
      expect(await this.comp.votingPowerAt(a1, t4.receipt.blockNumber + 1)).to.be.bignumber.that.equals(S0);
    });
  });
}

module.exports = {
  shouldBehaveLikeComp,
};
