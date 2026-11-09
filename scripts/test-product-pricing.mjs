// The admin form's live price preview and the server's product save share
// lib/productPricing.ts; these pin down what a discount actually stores.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const source = readFileSync(new URL("../lib/productPricing.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
	compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
});
const loaded = { exports: {} };
runInNewContext(outputText, { exports: loaded.exports, module: loaded });
const { computePricing, inferDiscount } = loaded.exports;
const plain = (value) => JSON.parse(JSON.stringify(value));

test("no discount stores the regular price with no struck-through price", () => {
	assert.deepEqual(plain(computePricing(49.99, "none", 30)), { error: null, oldPrice: null, price: 49.99 });
});

test("a percentage discount lowers what customers pay", () => {
	assert.deepEqual(plain(computePricing(100, "percentage", 10)), { error: null, oldPrice: 100, price: 90 });
	assert.deepEqual(plain(computePricing(19.99, "percentage", 15)), { error: null, oldPrice: 19.99, price: 16.99 });
});

test("a fixed discount subtracts an amount", () => {
	assert.deepEqual(plain(computePricing(100, "fixed", 25.5)), { error: null, oldPrice: 100, price: 74.5 });
});

test("invalid prices and discounts are rejected", () => {
	assert.ok(computePricing(Number.NaN, "none", 0).error);
	assert.ok(computePricing(-1, "none", 0).error);
	assert.ok(computePricing(100, "percentage", 0).error);
	assert.ok(computePricing(100, "percentage", 96).error);
	assert.ok(computePricing(100, "fixed", 100).error);
	assert.ok(computePricing(0.01, "percentage", 1).error, "a discount that rounds to no change");
});

test("inferDiscount round-trips stored prices back to the form", () => {
	for (const [regular, type, value] of [
		[100, "percentage", 10],
		[19.99, "percentage", 15],
		[100, "fixed", 25.5],
		[49.99, "none", 0],
	]) {
		const stored = computePricing(regular, type, value);
		assert.deepEqual(plain(inferDiscount(stored.price, stored.oldPrice)), {
			discountType: type,
			discountValue: value,
			regularPrice: regular,
		});
	}
});

test("legacy rows whose old price isn't above the price have no discount", () => {
	assert.deepEqual(plain(inferDiscount(50, 40)), { discountType: "none", discountValue: 0, regularPrice: 50 });
});
