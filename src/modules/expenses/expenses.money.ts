export interface Share {
	userId: string;
	amountMinor: number;
}

export interface ExpenseMoney {
	paidById: string;
	amountMinor: number;
}

export type SplitMoney = Share;

export interface SettlementMoney {
	fromUserId: string;
	toUserId: string;
	amountMinor: number;
}

export interface UserBalance {
	paid: number;
	owed: number;
	settledSent: number;
	settledReceived: number;
	net: number;
}

export type Balances = Record<string, UserBalance>;

export interface Transfer {
	fromUserId: string;
	toUserId: string;
	amountMinor: number;
}

const assertMinor = (value: number, field: string, nonnegative = false): void => {
	if (!Number.isSafeInteger(value)) {
		throw new Error(`${field} must be a safe integer number of minor units`);
	}
	if (nonnegative && value < 0) {
		throw new Error(`${field} cannot be negative`);
	}
};

const addMinor = (left: number, right: number, field: string): number => {
	const sum = left + right;
	assertMinor(sum, field);
	return sum;
};

export const sumMinor = (amountsMinor: number[]): number =>
	amountsMinor.reduce((sum, amountMinor) => {
		assertMinor(amountMinor, "amountMinor");
		return addMinor(sum, amountMinor, "minor-unit sum");
	}, 0);

const compareIds = (left: string, right: string): number =>
	left < right ? -1 : left > right ? 1 : 0;

export const toMinor = (amount: number | string): number => {
	if (typeof amount === "string" && amount.trim() === "") {
		throw new Error("amount must be a finite number");
	}
	const value = typeof amount === "number" ? amount : Number(amount);
	if (!Number.isFinite(value)) {
		throw new Error("amount must be a finite number");
	}
	const minor = Math.sign(value) * Math.round((Math.abs(value) + Number.EPSILON) * 100);
	assertMinor(minor, "amount");
	return minor;
};

export const fromMinor = (amountMinor: number): number => {
	assertMinor(amountMinor, "amountMinor");
	return Number((amountMinor / 100).toFixed(2));
};

export const splitEqual = (totalMinor: number, participantIds: string[]): Share[] => {
	assertMinor(totalMinor, "totalMinor", true);
	if (participantIds.length === 0) {
		throw new Error("participants cannot be empty");
	}
	if (new Set(participantIds).size !== participantIds.length) {
		throw new Error("participantIds must not contain duplicates");
	}

	const orderedIds = [...participantIds].sort(compareIds);
	const baseAmount = Math.floor(totalMinor / orderedIds.length);
	const remainder = totalMinor % orderedIds.length;
	return orderedIds.map((userId, index) => ({
		userId,
		amountMinor: baseAmount + (index < remainder ? 1 : 0),
	}));
};

export const validateExactShares = (totalMinor: number, shares: Share[]): void => {
	assertMinor(totalMinor, "totalMinor", true);
	const seenIds = new Set<string>();
	let sum = 0;
	for (const share of shares) {
		if (seenIds.has(share.userId)) {
			throw new Error(`duplicate share for userId "${share.userId}"`);
		}
		seenIds.add(share.userId);
		assertMinor(share.amountMinor, `share amount for userId "${share.userId}"`, true);
		sum += share.amountMinor;
		assertMinor(sum, "share total", true);
	}
	if (sum !== totalMinor) {
		throw new Error(`share amounts must sum exactly to ${totalMinor}; received ${sum}`);
	}
};

export const computeBalances = (
	expenses: ExpenseMoney[],
	splits: SplitMoney[],
	settlements: SettlementMoney[],
	memberIds: string[],
): Balances => {
	const balances: Balances = {};
	const ensureBalance = (userId: string): UserBalance => {
		if (!Object.hasOwn(balances, userId)) {
			Object.defineProperty(balances, userId, {
				configurable: true,
				enumerable: true,
				writable: true,
				value: { paid: 0, owed: 0, settledSent: 0, settledReceived: 0, net: 0 },
			});
		}
		return balances[userId];
	};

	for (const memberId of memberIds) {
		ensureBalance(memberId);
	}
	for (const expense of expenses) {
		assertMinor(expense.amountMinor, "expense amount", true);
		const balance = ensureBalance(expense.paidById);
		balance.paid = addMinor(balance.paid, expense.amountMinor, "paid total");
	}
	for (const split of splits) {
		assertMinor(split.amountMinor, "split amount", true);
		const balance = ensureBalance(split.userId);
		balance.owed = addMinor(balance.owed, split.amountMinor, "owed total");
	}
	for (const settlement of settlements) {
		assertMinor(settlement.amountMinor, "settlement amount", true);
		const sender = ensureBalance(settlement.fromUserId);
		sender.settledSent = addMinor(sender.settledSent, settlement.amountMinor, "settledSent total");
		const receiver = ensureBalance(settlement.toUserId);
		receiver.settledReceived = addMinor(receiver.settledReceived, settlement.amountMinor, "settledReceived total");
	}

	for (const balance of Object.values(balances)) {
		const assets = addMinor(balance.paid, balance.settledSent, "balance assets");
		const obligations = addMinor(balance.owed, balance.settledReceived, "balance obligations");
		balance.net = assets - obligations;
		assertMinor(balance.net, "net balance");
	}
	return balances;
};

export const suggestTransfers = (balances: Balances): Transfer[] => {
	let netTotal = 0;
	const creditors: Array<{ userId: string; remaining: number }> = [];
	const debtors: Array<{ userId: string; remaining: number }> = [];

	for (const [userId, balance] of Object.entries(balances)) {
		assertMinor(balance.net, `net balance for userId "${userId}"`);
		netTotal += balance.net;
		assertMinor(netTotal, "sum of net balances");
		if (balance.net > 0) creditors.push({ userId, remaining: balance.net });
		if (balance.net < 0) debtors.push({ userId, remaining: -balance.net });
	}
	if (netTotal !== 0) {
		throw new Error(`net balances must sum to zero; received ${netTotal}`);
	}

	const transfers: Transfer[] = [];
	while (creditors.length > 0 && debtors.length > 0) {
		creditors.sort((left, right) => right.remaining - left.remaining || compareIds(left.userId, right.userId));
		debtors.sort((left, right) => right.remaining - left.remaining || compareIds(left.userId, right.userId));
		const creditor = creditors[0];
		const debtor = debtors[0];
		const amountMinor = Math.min(creditor.remaining, debtor.remaining);
		transfers.push({ fromUserId: debtor.userId, toUserId: creditor.userId, amountMinor });
		creditor.remaining -= amountMinor;
		debtor.remaining -= amountMinor;
		if (creditor.remaining === 0) creditors.shift();
		if (debtor.remaining === 0) debtors.shift();
	}
	return transfers;
};