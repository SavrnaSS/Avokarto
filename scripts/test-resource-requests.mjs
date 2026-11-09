import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

function loadModule(filename, globals) {
  const loadedModule = { exports: {} };
  const source = readFileSync(new URL(`../${filename}`, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  runInNewContext(outputText, {
    module: loadedModule,
    exports: loadedModule.exports,
    AbortController,
    DOMException,
    setTimeout,
    clearTimeout,
    ...globals,
  });
  return loadedModule.exports;
}

function requestHarness() {
  const calls = [];
  const { requestResource } = loadModule("lib/resource-request.ts", {
    fetch(endpoint, { signal }) {
      return new Promise((resolve, reject) => {
        signal.addEventListener("abort", () => reject(signal.reason), { once: true });
        calls.push({
          endpoint,
          signal,
          finish(data) {
            resolve({ ok: true, json: async () => ({ data }) });
          },
        });
      });
    },
  });
  const read = (refreshScope, controller = new AbortController(), deduplicate = true) => ({
    controller,
    promise: requestResource("/api/products?limit=24", {
      signal: controller.signal,
      deduplicate,
      refreshScope,
    }),
  });
  return { calls, read };
}

test("components responding to one realtime event share one fresh request", async () => {
  const { calls, read } = requestHarness();
  const initial = read();
  const event = {};
  const first = read(event);
  const second = read(event);
  assert.equal(calls.length, 2);
  calls[0].finish({ stock: 10 });
  calls[1].finish({ stock: 9 });
  assert.deepEqual(await initial.promise, { stock: 10 });
  assert.deepEqual(await first.promise, { stock: 9 });
  assert.deepEqual(await second.promise, { stock: 9 });
});

test("later events and explicit refreshes cannot reuse older pending inventory", async () => {
  const { calls, read } = requestHarness();
  const previous = read({});
  const latestScope = {};
  const latest = read(latestScope);
  calls[0].finish({ stock: 10 });
  await previous.promise;
  const latestSubscriber = read(latestScope);
  assert.equal(calls.length, 2, "settling an old read must not discard the new shared read");
  const explicit = read(undefined, undefined, false);
  assert.equal(calls.length, 3);
  calls[1].finish({ stock: 8 });
  calls[2].finish({ stock: 7 });
  assert.deepEqual(await latest.promise, { stock: 8 });
  assert.deepEqual(await latestSubscriber.promise, { stock: 8 });
  assert.deepEqual(await explicit.promise, { stock: 7 });
});

test("cancelling one component preserves the remaining shared subscriber", async () => {
  const { calls, read } = requestHarness();
  const scope = {};
  const first = read(scope);
  const second = read(scope);
  const cancelled = assert.rejects(first.promise, { name: "AbortError" });
  first.controller.abort();
  await cancelled;
  assert.equal(calls[0].signal.aborted, false);
  calls[0].finish({ stock: 5 });
  assert.deepEqual(await second.promise, { stock: 5 });
});

test("abandoned reads are cancelled and successful results are not retained as stale cache", async () => {
  const { calls, read } = requestHarness();
  const scope = {};
  const first = read(scope);
  const cancelled = assert.rejects(first.promise, { name: "AbortError" });
  first.controller.abort();
  await cancelled;
  assert.equal(calls[0].signal.aborted, true);
  const replacement = read(scope);
  assert.equal(calls.length, 2);
  calls[1].finish({ stock: 4 });
  await replacement.promise;
  const later = read(scope);
  assert.equal(calls.length, 3);
  calls[2].finish({ stock: 3 });
  assert.deepEqual(await later.promise, { stock: 3 });
});

test("realtime subscribers share a scope per message and get a new scope on reconnect", () => {
  const timers = new Map();
  let timerId = 0;
  const flushTimers = (delay) => {
    for (const [id, task] of [...timers]) {
      if (task.delay <= delay) { timers.delete(id); task.callback(); }
    }
  };
  class FakeEventSource extends EventTarget {
    static instances = [];
    closed = false;
    constructor(url) {
      super();
      this.url = url;
      FakeEventSource.instances.push(this);
    }
    close() { this.closed = true; }
  }
  const { subscribeRealtime } = loadModule("lib/realtime-channel.ts", {
    EventSource: FakeEventSource,
    setTimeout(callback, delay) { const id = ++timerId; timers.set(id, { callback, delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
  });
  const received = [[], []];
  const unsubscribe = received.map((events) => subscribeRealtime("products", (scope) => events.push(scope)));
  assert.equal(FakeEventSource.instances.length, 0, "same-tick subscribers are batched");
  flushTimers(0);
  assert.equal(FakeEventSource.instances.length, 1);
  const source = FakeEventSource.instances[0];
  source.dispatchEvent(new Event("ready"));
  source.dispatchEvent(new Event("message"));
  source.dispatchEvent(new Event("ready"));
  assert.equal(received[0].length, 3);
  for (let index = 0; index < 3; index++) assert.equal(received[0][index], received[1][index]);
  assert.notEqual(received[0][0], received[0][1]);
  assert.notEqual(received[0][1], received[0][2]);
  unsubscribe[0]();
  flushTimers(0);
  assert.equal(source.closed, false);
  unsubscribe[1]();
  flushTimers(0);
  assert.equal(source.closed, false, "the route-transition grace period keeps the shared stream alive");
  flushTimers(1500);
  assert.equal(source.closed, true);
});
