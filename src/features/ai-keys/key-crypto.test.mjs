import assert from "node:assert/strict";
import test from "node:test";

import { decryptAiKey, encryptAiKey } from "./key-crypto.ts";

process.env.AI_KEY_ENCRYPTION_SECRET = "test-secret-".padEnd(44, "x");

const alice = "11111111-1111-4111-8111-111111111111";
const bob = "22222222-2222-4222-8222-222222222222";
const apiKey = "AIzaSyTestKey-0123456789abcdefghij";

test("暗号化したキーを、同じユーザーで元に戻せる", () => {
  const stored = encryptAiKey(alice, apiKey);
  assert.ok(stored.startsWith("v1."));
  assert.ok(!stored.includes(apiKey));
  assert.equal(decryptAiKey(alice, stored), apiKey);
});

test("同じキーでも、毎回ちがう暗号文になる", () => {
  assert.notEqual(encryptAiKey(alice, apiKey), encryptAiKey(alice, apiKey));
});

test("別のユーザーの行に写した暗号文は、復号できない", () => {
  assert.equal(decryptAiKey(bob, encryptAiKey(alice, apiKey)), null);
});

test("書き換えた暗号文や、形のちがう値は復号できない", () => {
  const [v, iv, tag, body] = encryptAiKey(alice, apiKey).split(".");
  const flipped = body[0] === "A" ? `B${body.slice(1)}` : `A${body.slice(1)}`;
  assert.equal(decryptAiKey(alice, [v, iv, tag, flipped].join(".")), null);
  assert.equal(decryptAiKey(alice, "plain-text-key"), null);
});

test("暗号化の秘密が変わると、復号できない", () => {
  const stored = encryptAiKey(alice, apiKey);
  const original = process.env.AI_KEY_ENCRYPTION_SECRET;
  process.env.AI_KEY_ENCRYPTION_SECRET = "another-secret-".padEnd(44, "y");
  try {
    assert.equal(decryptAiKey(alice, stored), null);
  } finally {
    process.env.AI_KEY_ENCRYPTION_SECRET = original;
  }
});

test("秘密が無い・短いときは、暗号化しない", () => {
  const original = process.env.AI_KEY_ENCRYPTION_SECRET;
  process.env.AI_KEY_ENCRYPTION_SECRET = "short";
  try {
    assert.throws(() => encryptAiKey(alice, apiKey));
  } finally {
    process.env.AI_KEY_ENCRYPTION_SECRET = original;
  }
});
