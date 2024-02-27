// Auxiliary behavior for OpenZeppelin ERC20 voting test, imported from OpenZeppelin project
// Source: https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/test/token/ERC20/extensions/ERC20Votes.test.js
/* eslint-disable */

const { BN, constants, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { MAX_UINT256, ZERO_ADDRESS, ZERO_BYTES32 } = constants;
// enable chai-subset to allow containSubset instead of deep equals, see https://www.chaijs.com/plugins/chai-subset/
require("chai").use(require("chai-subset"));

const { fromRpcSig } = require('ethereumjs-util');
const ethSigUtil = require('eth-sig-util');
const Wallet = require('ethereumjs-wallet').default;

const { promisify } = require('util');
const queue = promisify(setImmediate);

// AI Protocol: token contract is deployed outside the behavior file
// const ERC20VotesMock = artifacts.require('ERC20VotesMock');

const { EIP712Domain, domainSeparator } = require('./eip712');

const Delegation = [
  { name: 'delegate', type: 'address' },
  { name: 'nonce', type: 'uint256' },
  { name: 'expiry', type: 'uint256' },
];

async function countPendingTransactions() {
  return parseInt(
    await network.provider.send('eth_getBlockTransactionCountByNumber', ['pending'])
  );
}

async function batchInBlock (txs) {
  try {
    // disable auto-mining
    await network.provider.send('evm_setAutomine', [false]);
    // send all transactions
    const promises = txs.map(fn => fn());
    // wait for node to have all pending transactions
    while (txs.length > await countPendingTransactions()) {
      await queue();
    }
    // mine one block
    await network.provider.send('evm_mine');
    // fetch receipts
    const receipts = await Promise.all(promises);
    // Sanity check, all tx should be in the same block
    const minedBlocks = new Set(receipts.map(({ receipt }) => receipt.blockNumber));
    expect(minedBlocks.size).to.equal(1);

    return receipts;
  } finally {
    // enable auto-mining
    await network.provider.send('evm_setAutomine', [true]);
  }
}

// AI Protocol: Truffle Contract test suite converted into behavior
// AI Protocol: remove versionId from the EIP712 DomainSeparator
function shouldBehaveLikeVoting(name, symbol, supply, holder, recipient, holderDelegate, other1, other2) {
  beforeEach(async function () {
    // AI Protocol: Chain ID opcode hardcoded at 1 in Ganache-cli, but not in Hardhat
    // See: https://github.com/trufflesuite/ganache/issues/1643
    //      https://github.com/trufflesuite/ganache-core/issues/515
    this.chainId = await web3.eth.net.getId();
  });

  it('initial nonce is 0', async function () {
    expect(await this.token.nonces(holder)).to.be.bignumber.equal('0');
  });

  it('domain separator', async function () {
    expect(
      await this.token.DOMAIN_SEPARATOR(),
    ).to.equal(
      // AI Protocol: remove versionId from the EIP712 DomainSeparator
      await domainSeparator(name, this.chainId, this.token.address),
    );
  });

  it('minting restriction', async function () {
    const amount = new BN('2').pow(new BN('192'));
    await expectRevert(
      this.token.mint(holder, amount),
      'total supply overflow (uint192)',
    );
  });

  describe('set delegation', function () {
    describe('call', function () {
      it('delegation with balance', async function () {
        await this.token.mint(holder, supply);
        expect(await this.token.votingDelegates(holder)).to.be.equal(ZERO_ADDRESS);

        const { receipt } = await this.token.delegate(holder, { from: holder });
        expectEvent(receipt, 'DelegateChanged', {
          source: holder,
          from: ZERO_ADDRESS,
          to: holder,
        });
        expectEvent(receipt, 'VotingPowerChanged', {
          by: holder,
          target: holder,
          fromVal: '0',
          toVal: supply,
        });

        expect(await this.token.votingDelegates(holder)).to.be.equal(holder);

        expect(await this.token.votingPowerOf(holder)).to.be.bignumber.equal(supply);
        expect(await this.token.votingPowerAt(holder, receipt.blockNumber - 1)).to.be.bignumber.equal('0');
        await time.advanceBlock();
        expect(await this.token.votingPowerAt(holder, receipt.blockNumber)).to.be.bignumber.equal(supply);
      });

      it('delegation without balance', async function () {
        expect(await this.token.votingDelegates(holder)).to.be.equal(ZERO_ADDRESS);

        const { receipt } = await this.token.delegate(holder, { from: holder });
        expectEvent(receipt, 'DelegateChanged', {
          source: holder,
          from: ZERO_ADDRESS,
          to: holder,
        });
        expectEvent.notEmitted(receipt, 'VotingPowerChanged');

        expect(await this.token.votingDelegates(holder)).to.be.equal(holder);
      });
    });

    describe('with signature', function () {
      const delegator = Wallet.generate();
      const delegatorAddress = web3.utils.toChecksumAddress(delegator.getAddressString());
      const nonce = ZERO_BYTES32;

      const buildData = (chainId, verifyingContract, message) => ({ data: {
        primaryType: 'Delegation',
        types: { EIP712Domain, Delegation },
        // AI Protocol: remove versionId from the EIP712 Domain
        domain: { name, chainId, verifyingContract },
        message,
      }});

      beforeEach(async function () {
        await this.token.mint(delegatorAddress, supply);
      });

      it('accept signed delegation', async function () {
        const { v, r, s } = fromRpcSig(ethSigUtil.signTypedMessage(
          delegator.getPrivateKey(),
          buildData(this.chainId, this.token.address, {
            delegate: delegatorAddress,
            nonce,
            expiry: MAX_UINT256,
          }),
        ));

        expect(await this.token.votingDelegates(delegatorAddress)).to.be.equal(ZERO_ADDRESS);

        const { receipt } = await this.token.delegateWithAuthorization(delegatorAddress, nonce, MAX_UINT256, v, r, s);
        expectEvent(receipt, 'DelegateChanged', {
          source: delegatorAddress,
          from: ZERO_ADDRESS,
          to: delegatorAddress,
        });
        expectEvent(receipt, 'VotingPowerChanged', {
          by: delegatorAddress,
          target: delegatorAddress,
          fromVal: '0',
          toVal: supply,
        });

        expect(await this.token.votingDelegates(delegatorAddress)).to.be.equal(delegatorAddress);

        expect(await this.token.votingPowerOf(delegatorAddress)).to.be.bignumber.equal(supply);
        expect(await this.token.votingPowerAt(delegatorAddress, receipt.blockNumber - 1)).to.be.bignumber.equal('0');
        await time.advanceBlock();
        expect(await this.token.votingPowerAt(delegatorAddress, receipt.blockNumber)).to.be.bignumber.equal(supply);
      });

      it('rejects reused signature', async function () {
        const { v, r, s } = fromRpcSig(ethSigUtil.signTypedMessage(
          delegator.getPrivateKey(),
          buildData(this.chainId, this.token.address, {
            delegate: delegatorAddress,
            nonce,
            expiry: MAX_UINT256,
          }),
        ));

        await this.token.delegateWithAuthorization(delegatorAddress, nonce, MAX_UINT256, v, r, s);

        await expectRevert(
          this.token.delegateWithAuthorization(delegatorAddress, nonce, MAX_UINT256, v, r, s),
          'invalid nonce',
        );
      });

      it('rejects bad delegate', async function () {
        const { v, r, s } = fromRpcSig(ethSigUtil.signTypedMessage(
          delegator.getPrivateKey(),
          buildData(this.chainId, this.token.address, {
            delegate: delegatorAddress,
            nonce,
            expiry: MAX_UINT256,
          }),
        ));

        const { logs } = await this.token.delegateWithAuthorization(holderDelegate, nonce, MAX_UINT256, v, r, s);
        const { args } = logs.find(({ event }) => event == 'DelegateChanged');
        expect(args.source).to.not.be.equal(delegatorAddress);
        expect(args.from).to.be.equal(ZERO_ADDRESS);
        expect(args.to).to.be.equal(holderDelegate);
      });

      it('rejects bad nonce', async function () {
        const { v, r, s } = fromRpcSig(ethSigUtil.signTypedMessage(
          delegator.getPrivateKey(),
          buildData(this.chainId, this.token.address, {
            delegate: delegatorAddress,
            nonce,
            expiry: MAX_UINT256,
          }),
        ));
        await this.token.delegateWithAuthorization(delegatorAddress, nonce, MAX_UINT256, v, r, s); // use nonce
        await expectRevert(
          this.token.delegateWithAuthorization(delegatorAddress, nonce, MAX_UINT256, v, r, s),
          'invalid nonce',
        );
      });

      it('rejects expired permit', async function () {
        const expiry = (await time.latest()) - time.duration.weeks(1);
        const { v, r, s } = fromRpcSig(ethSigUtil.signTypedMessage(
          delegator.getPrivateKey(),
          buildData(this.chainId, this.token.address, {
            delegate: delegatorAddress,
            nonce,
            expiry,
          }),
        ));

        await expectRevert(
          this.token.delegateWithAuthorization(delegatorAddress, nonce, expiry, v, r, s),
          'signature expired',
        );
      });
    });
  });

  describe('change delegation', function () {
    beforeEach(async function () {
      await this.token.mint(holder, supply);
      await this.token.delegate(holder, { from: holder });
    });

    it('call', async function () {
      expect(await this.token.votingDelegates(holder)).to.be.equal(holder);

      const { receipt } = await this.token.delegate(holderDelegate, { from: holder });
      expectEvent(receipt, 'DelegateChanged', {
        source: holder,
        from: holder,
        to: holderDelegate,
      });
      expectEvent(receipt, 'VotingPowerChanged', {
        by: holder,
        target: holder,
        fromVal: supply,
        toVal: '0',
      });
      expectEvent(receipt, 'VotingPowerChanged', {
        by: holder,
        target: holderDelegate,
        fromVal: '0',
        toVal: supply,
      });

      expect(await this.token.votingDelegates(holder)).to.be.equal(holderDelegate);

      expect(await this.token.votingPowerOf(holder)).to.be.bignumber.equal('0');
      expect(await this.token.votingPowerOf(holderDelegate)).to.be.bignumber.equal(supply);
      expect(await this.token.votingPowerAt(holder, receipt.blockNumber - 1)).to.be.bignumber.equal(supply);
      expect(await this.token.votingPowerAt(holderDelegate, receipt.blockNumber - 1)).to.be.bignumber.equal('0');
      await time.advanceBlock();
      expect(await this.token.votingPowerAt(holder, receipt.blockNumber)).to.be.bignumber.equal('0');
      expect(await this.token.votingPowerAt(holderDelegate, receipt.blockNumber)).to.be.bignumber.equal(supply);
    });
  });

  describe('transfers', function () {
    beforeEach(async function () {
      await this.token.mint(holder, supply);
    });

    it('no delegation', async function () {
      const { receipt } = await this.token.transfer(recipient, 1, { from: holder });
      expectEvent(receipt, 'Transfer', { from: holder, to: recipient, value: '1' });
      expectEvent.notEmitted(receipt, 'VotingPowerChanged');

      this.holderVotes = '0';
      this.recipientVotes = '0';
    });

    it('sender delegation', async function () {
      await this.token.delegate(holder, { from: holder });

      const { receipt } = await this.token.transfer(recipient, 1, { from: holder });
      expectEvent(receipt, 'Transfer', { from: holder, to: recipient, value: '1' });
      expectEvent(receipt, 'VotingPowerChanged', { by: holder, target: holder, fromVal: supply, toVal: supply.subn(1) });

      this.holderVotes = supply.subn(1);
      this.recipientVotes = '0';
    });

    it('receiver delegation', async function () {
      await this.token.delegate(recipient, { from: recipient });

      const { receipt } = await this.token.transfer(recipient, 1, { from: holder });
      expectEvent(receipt, 'Transfer', { from: holder, to: recipient, value: '1' });
      expectEvent(receipt, 'VotingPowerChanged', { by:  holder, target: recipient, fromVal: '0', toVal: '1' });

      this.holderVotes = '0';
      this.recipientVotes = '1';
    });

    it('full delegation', async function () {
      await this.token.delegate(holder, { from: holder });
      await this.token.delegate(recipient, { from: recipient });

      const { receipt } = await this.token.transfer(recipient, 1, { from: holder });
      expectEvent(receipt, 'Transfer', { from: holder, to: recipient, value: '1' });
      expectEvent(receipt, 'VotingPowerChanged', { by: holder, target: holder, fromVal: supply, toVal: supply.subn(1) });
      expectEvent(receipt, 'VotingPowerChanged', { by: holder, target: recipient, fromVal: '0', toVal: '1' });

      this.holderVotes = supply.subn(1);
      this.recipientVotes = '1';
    });

    afterEach(async function () {
      expect(await this.token.votingPowerOf(holder)).to.be.bignumber.equal(this.holderVotes);
      expect(await this.token.votingPowerOf(recipient)).to.be.bignumber.equal(this.recipientVotes);

      // need to advance 2 blocks to see the effect of a transfer on "getPriorVotes"
      const blockNumber = await time.latestBlock();
      await time.advanceBlock();
      expect(await this.token.votingPowerAt(holder, blockNumber)).to.be.bignumber.equal(this.holderVotes);
      expect(await this.token.votingPowerAt(recipient, blockNumber)).to.be.bignumber.equal(this.recipientVotes);
    });
  });

  // The following tests are an adaptation of https://github.com/compound-finance/compound-protocol/blob/master/tests/Governance/CompTest.js.
  describe('Compound test suite', function () {
    beforeEach(async function () {
      await this.token.mint(holder, supply);
    });

    describe('balanceOf', function () {
      it('grants to initial account', async function () {
        expect(await this.token.balanceOf(holder)).to.be.bignumber.equal(supply);
      });
    });

    describe('votingPowerHistory <- checkpoints', function () {
      it('returns the number of checkpoints for a delegate', async function () {
        await this.token.transfer(recipient, '100', { from: holder }); //give an account a few tokens for readability
        expect(await this.token.votingPowerHistoryLength(other1)).to.be.bignumber.equal('0');

        const t1 = await this.token.delegate(other1, { from: recipient });
        expect(await this.token.votingPowerHistoryLength(other1)).to.be.bignumber.equal('1');

        const t2 = await this.token.transfer(other2, 10, { from: recipient });
        expect(await this.token.votingPowerHistoryLength(other1)).to.be.bignumber.equal('2');

        const t3 = await this.token.transfer(other2, 10, { from: recipient });
        expect(await this.token.votingPowerHistoryLength(other1)).to.be.bignumber.equal('3');

        const t4 = await this.token.transfer(recipient, 20, { from: holder });
        expect(await this.token.votingPowerHistoryLength(other1)).to.be.bignumber.equal('4');

        expect(await this.token.votingPowerHistory(other1, 0)).to.containSubset({ k: new BN(t1.receipt.blockNumber), v: new BN(100) });
        expect(await this.token.votingPowerHistory(other1, 1)).to.containSubset({ k: new BN(t2.receipt.blockNumber), v: new BN(90) });
        expect(await this.token.votingPowerHistory(other1, 2)).to.containSubset({ k: new BN(t3.receipt.blockNumber), v: new BN(80) });
        expect(await this.token.votingPowerHistory(other1, 3)).to.containSubset({ k: new BN(t4.receipt.blockNumber), v: new BN(100) });

        await time.advanceBlock();
        expect(await this.token.votingPowerAt(other1, t1.receipt.blockNumber)).to.be.bignumber.equal('100');
        expect(await this.token.votingPowerAt(other1, t2.receipt.blockNumber)).to.be.bignumber.equal('90');
        expect(await this.token.votingPowerAt(other1, t3.receipt.blockNumber)).to.be.bignumber.equal('80');
        expect(await this.token.votingPowerAt(other1, t4.receipt.blockNumber)).to.be.bignumber.equal('100');
      });

      it('does not add more than one checkpoint in a block [ @skip-on-coverage ]', async function () {
        await this.token.transfer(recipient, '100', { from: holder });
        expect(await this.token.votingPowerHistoryLength(other1)).to.be.bignumber.equal('0');

        const [ t1, t2, t3 ] = await batchInBlock([
          () => this.token.delegate(other1, { from: recipient, gas: 120000 }),
          () => this.token.transfer(other2, 10, { from: recipient, gas: 100000 }),
          () => this.token.transfer(other2, 10, { from: recipient, gas: 100000 }),
        ]);
        expect(await this.token.votingPowerHistoryLength(other1)).to.be.bignumber.equal('1');
        expect(await this.token.votingPowerHistory(other1, 0)).to.containSubset({ k: new BN(t1.receipt.blockNumber), v: new BN(80) });
        // expectReve(await this.token.votingPowerHistory(other1, 1)).to.containSubset([ '0', '0' ]); // Reverts due to array overflow check
        // expect(await this.token.votingPowerHistory(other1, 2)).to.containSubset([ '0', '0' ]); // Reverts due to array overflow check

        const t4 = await this.token.transfer(recipient, 20, { from: holder });
        expect(await this.token.votingPowerHistoryLength(other1)).to.be.bignumber.equal('2');
        expect(await this.token.votingPowerHistory(other1, 1)).to.containSubset({ k: new BN(t4.receipt.blockNumber), v: new BN(100) });
      });
    });

    describe('votingPowerAt <- getPriorVotes', function () {
      it('reverts if block number >= current block', async function () {
        await expectRevert(
          this.token.votingPowerAt(other1, 5e10),
          'block not yet mined',
        );
      });

      it('returns 0 if there are no checkpoints', async function () {
        expect(await this.token.votingPowerAt(other1, 0)).to.be.bignumber.equal('0');
      });

      it('returns the latest block if >= last checkpoint block', async function () {
        const t1 = await this.token.delegate(other1, { from: holder });
        await time.advanceBlock();
        await time.advanceBlock();

        expect(await this.token.votingPowerAt(other1, t1.receipt.blockNumber)).to.be.bignumber.equal(supply);
        expect(await this.token.votingPowerAt(other1, t1.receipt.blockNumber + 1)).to.be.bignumber.equal(supply);
      });

      it('returns zero if < first checkpoint block', async function () {
        await time.advanceBlock();
        const t1 = await this.token.delegate(other1, { from: holder });
        await time.advanceBlock();
        await time.advanceBlock();

        expect(await this.token.votingPowerAt(other1, t1.receipt.blockNumber - 1)).to.be.bignumber.equal('0');
        expect(await this.token.votingPowerAt(other1, t1.receipt.blockNumber + 1)).to.be.bignumber.equal(supply);
      });

      it('generally returns the voting balance at the appropriate checkpoint', async function () {
        const t1 = await this.token.delegate(other1, { from: holder });
        await time.advanceBlock();
        await time.advanceBlock();
        const t2 = await this.token.transfer(other2, 10, { from: holder });
        await time.advanceBlock();
        await time.advanceBlock();
        const t3 = await this.token.transfer(other2, 10, { from: holder });
        await time.advanceBlock();
        await time.advanceBlock();
        const t4 = await this.token.transfer(holder, 20, { from: other2 });
        await time.advanceBlock();
        await time.advanceBlock();

        expect(await this.token.votingPowerAt(other1, t1.receipt.blockNumber - 1)).to.be.bignumber.equal('0');
        expect(await this.token.votingPowerAt(other1, t1.receipt.blockNumber)).to.be.bignumber.equal(supply);
        expect(await this.token.votingPowerAt(other1, t1.receipt.blockNumber + 1)).to.be.bignumber.equal(supply);
        expect(await this.token.votingPowerAt(other1, t2.receipt.blockNumber)).to.be.bignumber.equal(supply.subn(10));
        expect(await this.token.votingPowerAt(other1, t2.receipt.blockNumber + 1)).to.be.bignumber.equal(supply.subn(10));
        expect(await this.token.votingPowerAt(other1, t3.receipt.blockNumber)).to.be.bignumber.equal(supply.subn(20));
        expect(await this.token.votingPowerAt(other1, t3.receipt.blockNumber + 1)).to.be.bignumber.equal(supply.subn(20));
        expect(await this.token.votingPowerAt(other1, t4.receipt.blockNumber)).to.be.bignumber.equal(supply);
        expect(await this.token.votingPowerAt(other1, t4.receipt.blockNumber + 1)).to.be.bignumber.equal(supply);
      });
    });
  });

  describe('totalSupplyAt <- getPriorTotalSupply', function () {
    beforeEach(async function () {
      await this.token.delegate(holder, { from: holder });
    });

    it('reverts if block number >= current block', async function () {
      await expectRevert(
        this.token.totalSupplyAt(5e10),
        'block not yet mined',
      );
    });

    it('returns 0 if there are no checkpoints', async function () {
      expect(await this.token.totalSupplyAt(0)).to.be.bignumber.equal('0');
    });

    it('returns the latest block if >= last checkpoint block', async function () {
      t1 = await this.token.mint(holder, supply);

      await time.advanceBlock();
      await time.advanceBlock();

      expect(await this.token.totalSupplyAt(t1.receipt.blockNumber)).to.be.bignumber.equal(supply);
      expect(await this.token.totalSupplyAt(t1.receipt.blockNumber + 1)).to.be.bignumber.equal(supply);
    });

    it('returns zero if < first checkpoint block', async function () {
      await time.advanceBlock();
      const t1 = await this.token.mint(holder, supply);
      await time.advanceBlock();
      await time.advanceBlock();

      expect(await this.token.totalSupplyAt(t1.receipt.blockNumber - 1)).to.be.bignumber.equal('0');
      expect(await this.token.totalSupplyAt(t1.receipt.blockNumber + 1)).to.be.bignumber.equal(supply);
    });

    it('generally returns the voting balance at the appropriate checkpoint', async function () {
      const t1 = await this.token.mint(holder, supply);
      await time.advanceBlock();
      await time.advanceBlock();
      const t2 = await this.token.burn(holder, 10);
      await time.advanceBlock();
      await time.advanceBlock();
      const t3 = await this.token.burn(holder, 10);
      await time.advanceBlock();
      await time.advanceBlock();
      const t4 = await this.token.mint(holder, 20);
      await time.advanceBlock();
      await time.advanceBlock();

      expect(await this.token.totalSupplyAt(t1.receipt.blockNumber - 1)).to.be.bignumber.equal('0');
      expect(await this.token.totalSupplyAt(t1.receipt.blockNumber)).to.be.bignumber.equal(supply);
      expect(await this.token.totalSupplyAt(t1.receipt.blockNumber + 1)).to.be.bignumber.equal(supply);
      expect(await this.token.totalSupplyAt(t2.receipt.blockNumber)).to.be.bignumber.equal(supply.subn(10));
      expect(await this.token.totalSupplyAt(t2.receipt.blockNumber + 1)).to.be.bignumber.equal(supply.subn(10));
      expect(await this.token.totalSupplyAt(t3.receipt.blockNumber)).to.be.bignumber.equal(supply.subn(20));
      expect(await this.token.totalSupplyAt(t3.receipt.blockNumber + 1)).to.be.bignumber.equal(supply.subn(20));
      expect(await this.token.totalSupplyAt(t4.receipt.blockNumber)).to.be.bignumber.equal(supply);
      expect(await this.token.totalSupplyAt(t4.receipt.blockNumber + 1)).to.be.bignumber.equal(supply);
    });
  });
}

module.exports = {
  shouldBehaveLikeVoting,
};
