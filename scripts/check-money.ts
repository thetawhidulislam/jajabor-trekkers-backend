import assert from "node:assert/strict";
import {
	computeBalances,
	fromMinor,
	splitEqual,
	suggestTransfers,
	toMinor,
	validateExactShares,
} from "../src/modules/expenses/expenses.money";

assert.equal(toMinor(1.005), 101);
assert.equal(fromMinor(800000), 8000);
assert.throws(() => splitEqual(100, []), /empty/);
assert.throws(() => splitEqual(100, ["A", "A"]), /duplicates/);

const largeShares = splitEqual(toMinor("8000.00"), ["C", "A", "B"]);
assert.deepEqual(largeShares.map(({ amountMinor }) => fromMinor(amountMinor)), [2666.67, 2666.67, 2666.66]);
assert.equal(largeShares.reduce((sum, share) => sum + share.amountMinor, 0), toMinor("8000.00"));

const smallShares = splitEqual(toMinor("100.00"), ["C", "A", "B"]);
assert.deepEqual(smallShares.map(({ amountMinor }) => fromMinor(amountMinor)), [33.34, 33.33, 33.33]);

validateExactShares(toMinor("8000.00"), [
	{ userId: "A", amountMinor: 300000 },
	{ userId: "B", amountMinor: 250000 },
	{ userId: "C", amountMinor: 250000 },
]);
assert.throws(
	() => validateExactShares(100, [
		{ userId: "A", amountMinor: 50 },
		{ userId: "A", amountMinor: 50 },
	]),
	/duplicate/,
);
assert.throws(
	() => validateExactShares(100, [{ userId: "A", amountMinor: -1 }]),
	/cannot be negative/,
);
assert.throws(
	() => validateExactShares(toMinor("8000.00"), [
		{ userId: "A", amountMinor: 300000 },
		{ userId: "B", amountMinor: 250000 },
		{ userId: "C", amountMinor: 240000 },
	]),
	/sum exactly/,
);

const equalExpenseShares = splitEqual(toMinor("8000.00"), ["A", "B", "C"]);
const balances = computeBalances(
	[{ paidById: "A", amountMinor: toMinor("8000.00") }],
	equalExpenseShares,
	[],
	["A", "B", "C", "D"],
);
assert.equal(balances.B.net, -toMinor("2666.67"));
assert.equal(balances.C.net, -toMinor("2666.66"));
assert.equal(balances.D.net, 0);

const transfers = suggestTransfers(balances);
assert.deepEqual(transfers, [
	{ fromUserId: "B", toUserId: "A", amountMinor: toMinor("2666.67") },
	{ fromUserId: "C", toUserId: "A", amountMinor: toMinor("2666.66") },
]);

const settledBalances = computeBalances(
	[{ paidById: "A", amountMinor: toMinor("8000.00") }],
	equalExpenseShares,
	[{ fromUserId: "B", toUserId: "A", amountMinor: toMinor("2666.67") }],
	["A", "B", "C"],
);
assert.equal(settledBalances.B.net, 0);

const closureTransfers = suggestTransfers(settledBalances);
const remaining = Object.fromEntries(Object.entries(settledBalances).map(([userId, balance]) => [userId, balance.net]));
for (const transfer of closureTransfers) {
	remaining[transfer.fromUserId] += transfer.amountMinor;
	remaining[transfer.toUserId] -= transfer.amountMinor;
}
assert.ok(Object.values(remaining).every((net) => net === 0));
assert.throws(
	() => suggestTransfers({ A: { paid: 1, owed: 0, settledSent: 0, settledReceived: 0, net: 1 } }),
	/sum to zero/,
);

console.log("Money logic checks passed");