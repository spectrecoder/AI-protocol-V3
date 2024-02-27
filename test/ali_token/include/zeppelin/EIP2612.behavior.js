// Auxiliary behavior for OpenZeppelin EIP2612 permit tests, imported from OpenZeppelin project
// Source: https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/test/token/ERC20/extensions/draft-ERC20Permit.test.js

const { BN, constants, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { MAX_UINT256, ZERO_ADDRESS, ZERO_BYTES32 } = constants;

const { fromRpcSig } = require('ethereumjs-util');
const ethSigUtil = require('eth-sig-util');
const Wallet = require('ethereumjs-wallet').default;

const { EIP712Domain, domainSeparator } = require('./eip712');

const Permit = [
  { name: 'owner', type: 'address' },
  { name: 'spender', type: 'address' },
  { name: 'value', type: 'uint256' },
  { name: 'nonce', type: 'uint256' },
  { name: 'deadline', type: 'uint256' },
];

// AI Protocol: Truffle Contract test suite converted into behavior
// AI Protocol: remove versionId from the EIP712 DomainSeparator
function shouldBehaveLikeEIP2612(name, symbol, initialSupply, initialHolder, spender) {
  beforeEach(async function () {
    // AI Protocol: Chain ID opcode hardcoded at 1 in Ganache-cli, but not in Hardhat
    // See: https://github.com/trufflesuite/ganache/issues/1643
    //      https://github.com/trufflesuite/ganache-core/issues/515
    this.chainId = await web3.eth.net.getId();
  });

  it('initial nonce is 0', async function () {
    expect(await this.token.nonces(initialHolder)).to.be.bignumber.equal('0');
  });

  it('domain separator', async function () {
    expect(
      await this.token.DOMAIN_SEPARATOR(),
    ).to.equal(
      await domainSeparator(name, this.chainId, this.token.address),
    );
  });

  describe('permit', function () {
    const wallet = Wallet.generate();

    const owner = wallet.getAddressString();
    const value = new BN(42);
    const nonce = 0;
    const maxDeadline = MAX_UINT256;

    const buildData = (chainId, verifyingContract, deadline = maxDeadline) => ({
      primaryType: 'Permit',
      types: { EIP712Domain, Permit },
      domain: { name, chainId, verifyingContract },
      message: { owner, spender, value, nonce, deadline },
    });

    it('accepts owner signature', async function () {
      const data = buildData(this.chainId, this.token.address);
      const signature = ethSigUtil.signTypedMessage(wallet.getPrivateKey(), { data });
      const { v, r, s } = fromRpcSig(signature);

      const receipt = await this.token.permit(owner, spender, value, maxDeadline, v, r, s);

      expect(await this.token.nonces(owner)).to.be.bignumber.equal('1');
      expect(await this.token.allowance(owner, spender)).to.be.bignumber.equal(value);
    });

    it('rejects reused signature', async function () {
      const data = buildData(this.chainId, this.token.address);
      const signature = ethSigUtil.signTypedMessage(wallet.getPrivateKey(), { data });
      const { v, r, s } = fromRpcSig(signature);

      await this.token.permit(owner, spender, value, maxDeadline, v, r, s);

      await expectRevert(
        this.token.permit(owner, spender, value, maxDeadline, v, r, s),
        'invalid signature',
      );
    });

    it('rejects other signature', async function () {
      const otherWallet = Wallet.generate();
      const data = buildData(this.chainId, this.token.address);
      const signature = ethSigUtil.signTypedMessage(otherWallet.getPrivateKey(), { data });
      const { v, r, s } = fromRpcSig(signature);

      await expectRevert(
        this.token.permit(owner, spender, value, maxDeadline, v, r, s),
        'invalid signature',
      );
    });

    it('rejects expired permit', async function () {
      const deadline = (await time.latest()) - time.duration.weeks(1);

      const data = buildData(this.chainId, this.token.address, deadline);
      const signature = ethSigUtil.signTypedMessage(wallet.getPrivateKey(), { data });
      const { v, r, s } = fromRpcSig(signature);

      await expectRevert(
        this.token.permit(owner, spender, value, deadline, v, r, s),
        'signature expired',
      );
    });
  });
}

module.exports = {
  shouldBehaveLikeEIP2612,
}
