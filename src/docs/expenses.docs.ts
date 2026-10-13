import {
	createExpenseSchema,
	createSettlementSchema,
	expenseParamsSchema,
	listExpensesQuerySchema,
	settlementListQuerySchema,
	settlementParamsSchema,
	tripExpenseParamsSchema,
	updateExpenseSchema,
} from "../modules/expenses/expenses.validation";
import { authenticationDetails, errorResponses, registry, successResponse } from "./registry";

const equalSplitExample = {
	title: "Group dinner",
	amount: 8000,
	category: "FOOD",
	paidById: "clx_owner_user_id",
	expenseDate: "2026-11-12T18:30:00.000Z",
	split: {
		type: "EQUAL",
		participantIds: ["clx_owner_user_id", "clx_member_one_id", "clx_member_two_id"],
	},
};

const exactSplitExample = {
	title: "Cab fare",
	amount: 8000,
	category: "TRANSPORT",
	paidById: "clx_owner_user_id",
	split: {
		type: "EXACT",
		shares: [
			{ userId: "clx_owner_user_id", amount: 3000 },
			{ userId: "clx_member_one_id", amount: 2500 },
			{ userId: "clx_member_two_id", amount: 2500 },
		],
	},
};

registry.registerPath({
	method: "get",
	path: "/api/v1/trips/{tripId}/expenses/balances",
	tags: ["Expenses"],
	summary: "Get trip balances and suggested transfers",
	...authenticationDetails("user"),
	request: { params: tripExpenseParamsSchema },
	responses: { 200: successResponse("Member balances and suggested transfers."), ...errorResponses(401, 404) },
});

registry.registerPath({
	method: "get",
	path: "/api/v1/trips/{tripId}/expenses/settlements",
	tags: ["Expenses"],
	summary: "List trip settlements newest first",
	...authenticationDetails("user"),
	request: { params: tripExpenseParamsSchema, query: settlementListQuerySchema },
	responses: { 200: successResponse("Paginated settlements."), ...errorResponses(400, 401, 404) },
});

registry.registerPath({
	method: "post",
	path: "/api/v1/trips/{tripId}/expenses/settlements",
	tags: ["Expenses"],
	summary: "Record a settlement between trip members",
	...authenticationDetails("user"),
	request: {
		params: tripExpenseParamsSchema,
		body: {
			content: {
				"application/json": {
					schema: createSettlementSchema.openapi({ example: {
						fromUserId: "clx_member_one_id",
						toUserId: "clx_owner_user_id",
						amount: 2666.67,
						note: "Paid back my share of dinner.",
						settledAt: "2026-11-13T09:00:00.000Z",
					} }),
				},
			},
		},
	},
	responses: { 201: successResponse("Settlement recorded."), ...errorResponses(400, 401, 403, 404, 409) },
});

registry.registerPath({
	method: "delete",
	path: "/api/v1/trips/{tripId}/expenses/settlements/{settlementId}",
	tags: ["Expenses"],
	summary: "Delete a settlement as its participant or trip owner",
	...authenticationDetails("user"),
	request: { params: settlementParamsSchema },
	responses: { 200: successResponse("Settlement deleted."), ...errorResponses(401, 403, 404, 409) },
});

registry.registerPath({
	method: "post",
	path: "/api/v1/trips/{tripId}/expenses",
	tags: ["Expenses"],
	summary: "Create an expense with equal or exact shares",
	...authenticationDetails("user"),
	request: {
		params: tripExpenseParamsSchema,
		body: {
			content: {
				"application/json": {
					schema: createExpenseSchema,
					examples: {
						equalSplit: { summary: "Equal split", value: equalSplitExample },
						exactSplit: { summary: "Exact split", value: exactSplitExample },
					},
				},
			},
		},
	},
	responses: { 201: successResponse("Expense and splits created."), ...errorResponses(400, 401, 404, 409) },
});

registry.registerPath({
	method: "get",
	path: "/api/v1/trips/{tripId}/expenses",
	tags: ["Expenses"],
	summary: "List expenses with trip-wide total summary",
	...authenticationDetails("user"),
	request: { params: tripExpenseParamsSchema, query: listExpensesQuerySchema },
	responses: { 200: successResponse("Paginated expenses and whole-trip summary."), ...errorResponses(400, 401, 404) },
});

registry.registerPath({
	method: "get",
	path: "/api/v1/trips/{tripId}/expenses/{expenseId}",
	tags: ["Expenses"],
	summary: "Get an expense and its splits",
	...authenticationDetails("user"),
	request: { params: expenseParamsSchema },
	responses: { 200: successResponse("Expense detail."), ...errorResponses(401, 404) },
});

registry.registerPath({
	method: "patch",
	path: "/api/v1/trips/{tripId}/expenses/{expenseId}",
	tags: ["Expenses"],
	summary: "Update an expense and optionally replace its splits",
	...authenticationDetails("user"),
	request: {
		params: expenseParamsSchema,
		body: { content: { "application/json": { schema: updateExpenseSchema } } },
	},
	responses: { 200: successResponse("Expense updated."), ...errorResponses(400, 401, 403, 404, 409) },
});

registry.registerPath({
	method: "delete",
	path: "/api/v1/trips/{tripId}/expenses/{expenseId}",
	tags: ["Expenses"],
	summary: "Delete an expense",
	...authenticationDetails("user"),
	request: { params: expenseParamsSchema },
	responses: { 200: successResponse("Expense deleted."), ...errorResponses(401, 403, 404, 409) },
});