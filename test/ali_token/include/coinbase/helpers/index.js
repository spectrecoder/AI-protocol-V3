// Auxiliary behavior for Coinbase EIP-3009 token test, imported from Coinbase project
// Source: https://github.com/CoinbaseStablecoin/eip-3009/blob/master/test/helpers/index.ts

const { ecsign } = require("ethereumjs-util");

// export interface Signature {
//   v: number;
//   r: string;
//   s: string;
// }

async function expectRevert(
  promise/*: Promise<unknown>*/,
  reason/*?: string | RegExp*/
)/*: Promise<void>*/ {
  let err/*: Error | undefined*/;
  try {
    await promise;
  } catch (e) {
    err = e;
  }

  if (!err) {
    assert.fail("Exception not thrown");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const errMsg/*: string*/ = (err/* as any*/).hijackedMessage ?? err.message;
  assert.match(errMsg, /revert/i);

  if (!reason) {
    return;
  } else if (reason instanceof RegExp) {
    assert.match(errMsg, reason);
  } else {
    assert.include(errMsg, reason);
  }
}

function prepend0x(v/*: string*/)/*: string*/ {
  return v.replace(/^(0x)?/, "0x");
}

function strip0x(v/*: string*/)/*: string*/ {
  return v.replace(/^0x/, "");
}

function hexStringFromBuffer(buf/*: Buffer*/)/*: string*/ {
  return "0x" + buf.toString("hex");
}

function bufferFromHexString(hex/*: string*/)/*: Buffer*/ {
  return Buffer.from(strip0x(hex), "hex");
}

function ecSign(digest/*: string*/, privateKey/*: string*/)/*: Signature*/ {
  const { v, r, s } = ecsign(
    bufferFromHexString(digest),
    bufferFromHexString(privateKey)
  );

  return { v, r: hexStringFromBuffer(r), s: hexStringFromBuffer(s) };
}

module.exports = {
  expectRevert,
  prepend0x,
  strip0x,
  hexStringFromBuffer,
  bufferFromHexString,
  ecSign,
}
