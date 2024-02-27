// Auxiliary behavior for Coinbase EIP-3009 token test, imported from Coinbase project
// Source: https://github.com/CoinbaseStablecoin/eip-3009/blob/master/test/EIP3009.test.ts

const { expect } = require("chai");
// import { TokenInstance } from "../@types/generated";
// import { AuthorizationUsed, Transfer } from "../@types/generated/Token";
const { ecSign, expectRevert/*, Signature*/, strip0x } = require("./helpers/index");
const { ACCOUNTS_AND_KEYS, MAX_UINT256 } = require("./helpers/constants");
// we don't use Zeppelin helpers, just enable chai-bn under the hood
require('@openzeppelin/test-helpers');

const TRANSFER_WITH_AUTHORIZATION_TYPEHASH = web3.utils.keccak256(
  "TransferWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)"
);

const RECEIVE_WITH_AUTHORIZATION_TYPEHASH = web3.utils.keccak256(
  "ReceiveWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)"
);

const CANCEL_AUTHORIZATION_TYPEHASH = web3.utils.keccak256(
  "CancelAuthorization(address authorizer,bytes32 nonce)"
);

function shouldBehaveLikeEIP3009(initialBalance, initialHolder, charlie) {
  let domainSeparator/*: string*/;
  // const [deployer] = accounts;
  const [alice, bob] = ACCOUNTS_AND_KEYS;
  // const charlie = accounts[1];
  let nonce/*: string*/;

  // const initialBalance = 10e6;

  beforeEach(async function() {
    // token = await Token.new("Token", "1", "TOK", 4, initialBalance, {
    //   from: deployer,
    // });
    domainSeparator = await this.token.DOMAIN_SEPARATOR();
    nonce = web3.utils.randomHex(32);

    await this.token.transfer(alice.address, initialBalance, { from: initialHolder });
  });

  it("has the expected type hashes", async function() {
    expect(await this.token.TRANSFER_WITH_AUTHORIZATION_TYPEHASH()).to.equal(
      TRANSFER_WITH_AUTHORIZATION_TYPEHASH
    );

    expect(await this.token.RECEIVE_WITH_AUTHORIZATION_TYPEHASH()).to.equal(
      RECEIVE_WITH_AUTHORIZATION_TYPEHASH
    );

    expect(await this.token.CANCEL_AUTHORIZATION_TYPEHASH()).to.equal(
      CANCEL_AUTHORIZATION_TYPEHASH
    );
  });

  describe("transferWithAuthorization", () => {
    const transferParams = {
      from: alice.address,
      to: bob.address,
      value: 7e6,
      validAfter: 0,
      validBefore: MAX_UINT256,
    };

    it("executes a transfer when a valid authorization is given", async function() {
      const { from, to, value, validAfter, validBefore } = transferParams;
      // create an authorization to transfer money from Alice to Bob and sign
      // with Alice's key
      const { v, r, s } = signTransferAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // check initial balance
      expect(await this.token.balanceOf(from)).to.be.bignumber.that.equals(initialBalance);
      expect(await this.token.balanceOf(to)).to.be.bignumber.that.equals('0');

      expect(await this.token.authorizationState(from, nonce)).to.be.false;

      // a third-party, Charlie (not Alice) submits the signed authorization
      const result = await this.token.transferWithAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        v,
        r,
        s,
        { from: charlie }
      );

      // check that balance is updated
      expect(await this.token.balanceOf(from)).to.be.bignumber.that.equals(
        initialBalance.subn(value)
      );
      expect(await this.token.balanceOf(to)).to.be.bignumber.that.equals("" + value);

      // check that AuthorizationUsed event is emitted
      const log0 = result.logs[0]/* as Truffle.TransactionLog<AuthorizationUsed>*/;
      expect(log0.event).to.equal("AuthorizationUsed");
      expect(log0.args[0]).to.equal(from);
      expect(log0.args[1]).to.equal(nonce);

      // check that Transfer event is emitted
      const log1 = result.logs[2]/* as Truffle.TransactionLog<Transfer>*/;
      expect(log1.event).to.equal("Transfer");
      expect(log1.args[0]).to.equal(from);
      expect(log1.args[1]).to.equal(to);
      expect(log1.args[2]).to.be.bignumber.that.equals("" + value);

      // check that the authorization is now used
      expect(await this.token.authorizationState(from, nonce)).to.be.true;
    });

    it("reverts if the signature does not match given parameters", async function() {
      const { from, to, value, validAfter, validBefore } = transferParams;
      // create a signed authorization
      const { v, r, s } = signTransferAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // try to cheat by claiming the transfer amount is double
      await expectRevert(
        this.token.transferWithAuthorization(
          from,
          to,
          value * 2, // pass incorrect value
          validAfter,
          validBefore,
          nonce,
          v,
          r,
          s,
          { from: charlie }
        ),
        "invalid signature"
      );
    });

    it("reverts if the signature is not signed with the right key", async function() {
      const { from, to, value, validAfter, validBefore } = transferParams;
      // create an authorization to transfer money from Alice to Bob, but
      // sign with Bob's key instead of Alice's
      const { v, r, s } = signTransferAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        bob.key
      );

      // try to cheat by submitting the signed authorization that is signed by
      // a wrong person
      await expectRevert(
        this.token.transferWithAuthorization(
          from,
          to,
          value,
          validAfter,
          validBefore,
          nonce,
          v,
          r,
          s,
          { from: charlie }
        ),
        "invalid signature"
      );
    });

    it("reverts if the authorization is not yet valid", async function() {
      const { from, to, value, validBefore } = transferParams;
      // create a signed authorization that won't be valid until 10 seconds
      // later
      const validAfter = await now() + 10;
      const { v, r, s } = signTransferAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // try to submit the authorization early
      await expectRevert(
        this.token.transferWithAuthorization(
          from,
          to,
          value,
          validAfter,
          validBefore,
          nonce,
          v,
          r,
          s,
          { from: charlie }
        ),
        "signature not yet valid"
      );
    });

    it("reverts if the authorization is expired", async function() {
      // create a signed authorization that expires immediately
      const { from, to, value, validAfter } = transferParams;
      const validBefore = Math.floor(Date.now() / 1000);
      const { v, r, s } = signTransferAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // try to submit the authorization that is expired
      await expectRevert(
        this.token.transferWithAuthorization(
          from,
          to,
          value,
          validAfter,
          validBefore,
          nonce,
          v,
          r,
          s,
          { from: charlie }
        ),
        "signature expired"
      );
    });

    it("reverts if the authorization has already been used", async function() {
      const { from, to, validAfter, validBefore } = transferParams;
      // create a signed authorization
      const value = 1e6;
      const { v, r, s } = signTransferAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // submit the authorization
      await this.token.transferWithAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        v,
        r,
        s,
        { from: charlie }
      );

      // try to submit the authorization again
      await expectRevert(
        this.token.transferWithAuthorization(
          from,
          to,
          value,
          validAfter,
          validBefore,
          nonce,
          v,
          r,
          s,
          { from: charlie }
        ),
        "invalid nonce"
      );
    });

    it("reverts if the authorization has a nonce that has already been used by the signer", async function() {
      const { from, to, value, validAfter, validBefore } = transferParams;
      // create a signed authorization
      const authorization = signTransferAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // submit the authorization
      await this.token.transferWithAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        authorization.v,
        authorization.r,
        authorization.s,
        { from: charlie }
      );

      // create another authorization with the same nonce, but with different
      // parameters
      const authorization2 = signTransferAuthorization(
        from,
        to,
        1e6,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // try to submit the authorization again
      await expectRevert(
        this.token.transferWithAuthorization(
          from,
          to,
          1e6,
          validAfter,
          validBefore,
          nonce,
          authorization2.v,
          authorization2.r,
          authorization2.s,
          { from: charlie }
        ),
        "invalid nonce"
      );
    });

    it("reverts if the authorization includes invalid transfer parameters", async function() {
      const { from, to, validAfter, validBefore } = transferParams;
      // create a signed authorization that attempts to transfer an amount
      // that exceeds the sender's balance
      const value = initialBalance + 1;
      const { v, r, s } = signTransferAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // try to submit the authorization with invalid transfer parameters
      await expectRevert(
        this.token.transferWithAuthorization(
          from,
          to,
          value,
          validAfter,
          validBefore,
          nonce,
          v,
          r,
          s,
          { from: charlie }
        ),
        "transfer amount exceeds balance"
      );
    });

    it("reverts if the authorization is not for transferWithAuthorization", async function() {
      const {
        from: owner,
        to: spender,
        value,
        validAfter,
        validBefore,
      } = transferParams;
      // create a signed authorization for an approval (granting allowance)
      const { v, r, s } = signReceiveAuthorization(
        owner,
        spender,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // try to submit the approval authorization
      await expectRevert(
        this.token.transferWithAuthorization(
          owner,
          spender,
          value,
          validAfter,
          validBefore,
          nonce,
          v,
          r,
          s,
          { from: charlie }
        ),
        "invalid signature"
      );
    });
  });

  describe("receiveWithAuthorization", () => {
    const receiveParams = {
      from: alice.address,
      to: charlie,
      value: 7e6,
      validAfter: 0,
      validBefore: MAX_UINT256,
    };

    it("executes a transfer when a valid authorization is submitted by the payee", async function() {
      const { from, to, value, validAfter, validBefore } = receiveParams;
      // create a receive authorization to transfer money from Alice to Charlie
      // and sign with Alice's key
      const { v, r, s } = signReceiveAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // check initial balance
      expect(await this.token.balanceOf(from)).to.be.bignumber.that.equals(initialBalance);
      expect(await this.token.balanceOf(to)).to.be.bignumber.that.equals('0');

      expect(await this.token.authorizationState(from, nonce)).to.be.false;

      // The payee submits the signed authorization
      const result = await this.token.receiveWithAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        v,
        r,
        s,
        { from: charlie }
      );

      // check that balance is updated
      expect(await this.token.balanceOf(from)).to.be.bignumber.that.equals(
        initialBalance.subn(value)
      );
      expect(await this.token.balanceOf(to)).to.be.bignumber.that.equals("" + value);

      // check that AuthorizationUsed event is emitted
      const log0 = result.logs[0]/* as Truffle.TransactionLog<AuthorizationUsed>*/;
      expect(log0.event).to.equal("AuthorizationUsed");
      expect(log0.args[0]).to.equal(from);
      expect(log0.args[1]).to.equal(nonce);

      // check that Transfer event is emitted
      const log1 = result.logs[2]/* as Truffle.TransactionLog<Transfer>*/;
      expect(log1.event).to.equal("Transfer");
      expect(log1.args[0]).to.equal(from);
      expect(log1.args[1]).to.equal(to);
      expect(log1.args[2]).to.be.bignumber.that.equals("" + value);

      // check that the authorization is now used
      expect(await this.token.authorizationState(from, nonce)).to.be.true;
    });

    it("reverts if the caller is not the payee", async function() {
      const { from, to, value, validAfter, validBefore } = receiveParams;
      // create a signed authorization
      const { v, r, s } = signReceiveAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // check initial balance
      expect(await this.token.balanceOf(from)).to.be.bignumber.that.equals(initialBalance);
      expect(await this.token.balanceOf(to)).to.be.bignumber.that.equals('0');

      expect(await this.token.authorizationState(from, nonce)).to.be.false;

      // The payee submits the signed authorization
      await expectRevert(
        this.token.receiveWithAuthorization(
          from,
          to,
          value,
          validAfter,
          validBefore,
          nonce,
          v,
          r,
          s,
          { from: initialHolder }
        ),
        "access denied"
      );
    });

    it("reverts if the signature does not match given parameters", async function() {
      const { from, to, value, validAfter, validBefore } = receiveParams;
      // create a signed authorization
      const { v, r, s } = signReceiveAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // try to cheat by claiming the transfer amount is double
      await expectRevert(
        this.token.receiveWithAuthorization(
          from,
          to,
          value * 2, // pass incorrect value
          validAfter,
          validBefore,
          nonce,
          v,
          r,
          s,
          { from: charlie }
        ),
        "invalid signature"
      );
    });

    it("reverts if the signature is not signed with the right key", async function() {
      const { from, to, value, validAfter, validBefore } = receiveParams;
      // create an authorization to transfer money from Alice to Bob, but
      // sign with Bob's key instead of Alice's
      const { v, r, s } = signReceiveAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        bob.key
      );

      // try to cheat by submitting the signed authorization that is signed by
      // a wrong person
      await expectRevert(
        this.token.receiveWithAuthorization(
          from,
          to,
          value,
          validAfter,
          validBefore,
          nonce,
          v,
          r,
          s,
          { from: charlie }
        ),
        "invalid signature"
      );
    });

    it("reverts if the authorization is not yet valid", async function() {
      const { from, to, value, validBefore } = receiveParams;
      // create a signed authorization that won't be valid until 10 seconds
      // later
      const validAfter = await now() + 10;
      const { v, r, s } = signReceiveAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // try to submit the authorization early
      await expectRevert(
        this.token.receiveWithAuthorization(
          from,
          to,
          value,
          validAfter,
          validBefore,
          nonce,
          v,
          r,
          s,
          { from: charlie }
        ),
        "signature not yet valid"
      );
    });

    it("reverts if the authorization is expired", async function() {
      // create a signed authorization that expires immediately
      const { from, to, value, validAfter } = receiveParams;
      const validBefore = Math.floor(Date.now() / 1000);
      const { v, r, s } = signReceiveAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // try to submit the authorization that is expired
      await expectRevert(
        this.token.receiveWithAuthorization(
          from,
          to,
          value,
          validAfter,
          validBefore,
          nonce,
          v,
          r,
          s,
          { from: charlie }
        ),
        "signature expired"
      );
    });

    it("reverts if the authorization has already been used", async function() {
      const { from, to, validAfter, validBefore } = receiveParams;
      // create a signed authorization
      const value = 1e6;
      const { v, r, s } = signReceiveAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // submit the authorization
      await this.token.receiveWithAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        v,
        r,
        s,
        { from: charlie }
      );

      // try to submit the authorization again
      await expectRevert(
        this.token.receiveWithAuthorization(
          from,
          to,
          value,
          validAfter,
          validBefore,
          nonce,
          v,
          r,
          s,
          { from: charlie }
        ),
        "invalid nonce"
      );
    });

    it("reverts if the authorization has a nonce that has already been used by the signer", async function() {
      const { from, to, value, validAfter, validBefore } = receiveParams;
      // create a signed authorization
      const authorization = signReceiveAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // submit the authorization
      await this.token.receiveWithAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        authorization.v,
        authorization.r,
        authorization.s,
        { from: charlie }
      );

      // create another authorization with the same nonce, but with different
      // parameters
      const authorization2 = signReceiveAuthorization(
        from,
        to,
        1e6,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // try to submit the authorization again
      await expectRevert(
        this.token.receiveWithAuthorization(
          from,
          to,
          1e6,
          validAfter,
          validBefore,
          nonce,
          authorization2.v,
          authorization2.r,
          authorization2.s,
          { from: charlie }
        ),
        "invalid nonce"
      );
    });

    it("reverts if the authorization includes invalid transfer parameters", async function() {
      const { from, to, validAfter, validBefore } = receiveParams;
      // create a signed authorization that attempts to transfer an amount
      // that exceeds the sender's balance
      const value = initialBalance + 1;
      const { v, r, s } = signReceiveAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // try to submit the authorization with invalid transfer parameters
      await expectRevert(
        this.token.receiveWithAuthorization(
          from,
          to,
          value,
          validAfter,
          validBefore,
          nonce,
          v,
          r,
          s,
          { from: charlie }
        ),
        "transfer amount exceeds balance"
      );
    });

    it("reverts if the authorization is not for receiveWithAuthorization", async function() {
      const {
        from: owner,
        to: spender,
        value,
        validAfter,
        validBefore,
      } = receiveParams;
      // create a signed authorization for an approval (granting allowance)
      const { v, r, s } = signTransferAuthorization(
        owner,
        spender,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // try to submit the approval authorization
      await expectRevert(
        this.token.receiveWithAuthorization(
          owner,
          spender,
          value,
          validAfter,
          validBefore,
          nonce,
          v,
          r,
          s,
          { from: charlie }
        ),
        "invalid signature"
      );
    });
  });

  describe("cancelAuthorization", () => {
    it("cancels an unused transfer authorization if the signature is valid", async function() {
      const from = alice.address;
      const to = bob.address;
      const value = 7e6;
      const validAfter = 0;
      const validBefore = MAX_UINT256;

      // create a signed authorization
      const authorization = signTransferAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // create cancellation
      const cancellation = signCancelAuthorization(
        from,
        nonce,
        domainSeparator,
        alice.key
      );

      // check that the authorization is ununsed
      expect(await this.token.authorizationState(from, nonce)).to.be.false;

      // cancel the authorization
      await this.token.cancelAuthorization(
        from,
        nonce,
        cancellation.v,
        cancellation.r,
        cancellation.s,
        { from: charlie }
      );

      // check that the authorization is now used
      expect(await this.token.authorizationState(from, nonce)).to.be.true;

      // attempt to use the canceled authorization
      await expectRevert(
        this.token.transferWithAuthorization(
          from,
          to,
          value,
          validAfter,
          validBefore,
          nonce,
          authorization.v,
          authorization.r,
          authorization.s,
          { from: charlie }
        ),
        "invalid nonce"
      );
    });

    it("cancels an unused receive authorization if the signature is valid", async function() {
      const from = alice.address;
      const to = charlie;
      const value = 7e6;
      const validAfter = 0;
      const validBefore = MAX_UINT256;

      // create a signed authorization
      const authorization = signReceiveAuthorization(
        from,
        to,
        value,
        validAfter,
        validBefore,
        nonce,
        domainSeparator,
        alice.key
      );

      // create cancellation
      const cancellation = signCancelAuthorization(
        from,
        nonce,
        domainSeparator,
        alice.key
      );

      // check that the authorization is ununsed
      expect(await this.token.authorizationState(from, nonce)).to.be.false;

      // cancel the authorization
      await this.token.cancelAuthorization(
        from,
        nonce,
        cancellation.v,
        cancellation.r,
        cancellation.s,
        { from: charlie }
      );

      // check that the authorization is now used
      expect(await this.token.authorizationState(from, nonce)).to.be.true;

      // attempt to use the canceled authorization
      await expectRevert(
        this.token.receiveWithAuthorization(
          from,
          to,
          value,
          validAfter,
          validBefore,
          nonce,
          authorization.v,
          authorization.r,
          authorization.s,
          { from: charlie }
        ),
        "invalid nonce"
      );
    });

    it("reverts if the authorization is already canceled", async function() {
      // create cancellation
      const cancellation = signCancelAuthorization(
        alice.address,
        nonce,
        domainSeparator,
        alice.key
      );

      // submit the cancellation
      await this.token.cancelAuthorization(
        alice.address,
        nonce,
        cancellation.v,
        cancellation.r,
        cancellation.s,
        { from: charlie }
      );

      // try to submit the same cancellation again
      await expectRevert(
        this.token.cancelAuthorization(
          alice.address,
          nonce,
          cancellation.v,
          cancellation.r,
          cancellation.s,
          { from: charlie }
        ),
        "invalid nonce"
      );
    });
  });
}

function signTransferAuthorization(
  from/*: string*/,
  to/*: string*/,
  value/*: number | string*/,
  validAfter/*: number | string*/,
  validBefore/*: number | string*/,
  nonce/*: string*/,
  domainSeparator/*: string*/,
  privateKey/*: string*/
)/*: Signature*/ {
  return signEIP712(
    domainSeparator,
    TRANSFER_WITH_AUTHORIZATION_TYPEHASH,
    ["address", "address", "uint256", "uint256", "uint256", "bytes32"],
    [from, to, value, validAfter, validBefore, nonce],
    privateKey
  );
}

function signReceiveAuthorization(
  from/*: string*/,
  to/*: string*/,
  value/*: number | string*/,
  validAfter/*: number | string*/,
  validBefore/*: number | string*/,
  nonce/*: string*/,
  domainSeparator/*: string*/,
  privateKey/*: string*/
)/*: Signature*/ {
  return signEIP712(
    domainSeparator,
    RECEIVE_WITH_AUTHORIZATION_TYPEHASH,
    ["address", "address", "uint256", "uint256", "uint256", "bytes32"],
    [from, to, value, validAfter, validBefore, nonce],
    privateKey
  );
}

function signCancelAuthorization(
  signer/*: string*/,
  nonce/*: string*/,
  domainSeparator/*: string*/,
  privateKey/*: string*/
)/*: Signature*/ {
  return signEIP712(
    domainSeparator,
    CANCEL_AUTHORIZATION_TYPEHASH,
    ["address", "bytes32"],
    [signer, nonce],
    privateKey
  );
}

function signEIP712(
  domainSeparator/*: string*/,
  typeHash/*: string*/,
  types/*: string[]*/,
  parameters/*: (string | number)[]*/,
  privateKey/*: string*/
)/*: Signature*/ {
  const digest = web3.utils.keccak256(
    "0x1901" +
      strip0x(domainSeparator) +
      strip0x(
        web3.utils.keccak256(
          web3.eth.abi.encodeParameters(
            ["bytes32", ...types],
            [typeHash, ...parameters]
          )
        )
      )
  );

  return ecSign(digest, privateKey);
}

// AI Protocol: Hardhat time differs from Date.now(), use this function to obtain it
async function now() {
  const latestBlock = await web3.eth.getBlock("latest");
  return latestBlock.timestamp;
}

module.exports = {
  shouldBehaveLikeEIP3009,
}
