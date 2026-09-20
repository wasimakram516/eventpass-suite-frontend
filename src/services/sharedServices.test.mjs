// node --experimental-vm-modules --test src/services/sharedServices.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { SourceTextModule, SyntheticModule } from "node:vm";

// Load the real module services and response handler with an isolated HTTP
// adapter. These tests never contact the API or a database.
async function loadService(path) {
  const calls = [], messages = [], modules = new Map();
  let result = { success: true, message: "Saved", data: { id: "record" } };
  let failure;
  const api = Object.fromEntries(["get", "post", "put", "patch", "delete"].map(method => [method, async (...args) => {
    calls.push({ method, args });
    if (failure) throw failure;
    return { data: result };
  }]));
  modules.set("@/services/api", new SyntheticModule(["default"], function () { this.setExport("default", api); }));
  modules.set("@/contexts/MessageContext", new SyntheticModule(["showGlobalMessage"], function () {
    this.setExport("showGlobalMessage", (...args) => messages.push(args));
  }));
  async function getModule(specifier) {
    if (!modules.has(specifier)) {
      const url = new URL(`../${specifier.slice(2)}.js`, import.meta.url);
      modules.set(specifier, new SourceTextModule(await readFile(url, "utf8"), { identifier: specifier }));
    }
    return modules.get(specifier);
  }
  const module = await getModule(`@/services/${path}`);
  await module.link(getModule);
  await module.evaluate();
  return { service: module.namespace, calls, messages, respond: value => { result = value; }, reject: value => { failure = value; } };
}

for (const moduleName of ["eventreg", "checkout"]) {
  test(`${moduleName}: shared event operations preserve namespace, payload and response`, async () => {
    const { service, calls, messages } = await loadService(`${moduleName}/eventService`);
    const prefix = moduleName === "eventreg" ? "Public" : "Checkout";
    const payload = { name: "Event", formFields: [{ inputName: "Name" }] };
    assert.deepEqual(await service[`create${prefix}Event`](payload), { id: "record" });
    await service[`update${prefix}Event`]("event-id", payload);
    await service[`clone${prefix}Event`]("event-id", { cloneRegistrations: false });
    await service[`get${prefix}EventBySlug`]("event-slug");
    assert.deepEqual(calls.map(c => [c.method, c.args[0]]), [
      ["post", `/${moduleName}/events`], ["put", `/${moduleName}/events/event-id`],
      ["post", `/${moduleName}/events/event-id/clone`], ["get", `/${moduleName}/events/slug/event-slug`],
    ]);
    assert.deepEqual(calls[0].args[1], payload);
    assert.equal(messages.length, 3);
  });

  test(`${moduleName}: list and export keep filters, sort, and blob responses`, async () => {
    const { service, calls, respond } = await loadService(`${moduleName}/registrationService`);
    await service.getRegistrationsByEvent("event", undefined, undefined, 1, { search: "A & B", status: "pending", empty: "", omitted: null });
    const url = new URL(calls[0].args[0], "https://example.test");
    assert.equal(url.pathname, `/${moduleName}/registrations/event/event`);
    assert.equal(url.searchParams.get("limit"), moduleName === "checkout" ? "20" : "10");
    assert.equal(url.searchParams.get("sort"), "1");
    assert.equal(url.searchParams.get("search"), "A & B");
    assert.equal(url.searchParams.has("omitted"), false);
    const csv = new Blob(["Name\nAttendee"]);
    respond(csv);
    assert.equal(await service.exportRegistrations("event", { search: "A & B", page: 0 }), csv);
    assert.equal(calls[1].args[1].responseType, "blob");
    assert.equal(new URL(calls[1].args[0], "https://example.test").searchParams.get("page"), "0");
  });

  test(`${moduleName}: notifications and imports preserve multipart payloads`, async () => {
    const { service, calls } = await loadService(`${moduleName}/registrationService`);
    const file = new Blob(["attachment"], { type: "text/plain" });
    await service.sendBulkWhatsApp("event", { approved: false, count: 0, empty: null, file: "ignore" }, file);
    const form = calls[0].args[1];
    assert.equal(form.get("approved"), "false");
    assert.equal(form.get("count"), "0");
    assert.equal(form.has("empty"), false);
    assert.equal(await form.get("file").text(), "attachment");
    await service.uploadRegistrations("event", file);
    assert.equal(calls[1].args[0], `/${moduleName}/registrations/event/event/upload`);
    assert.equal(await calls[1].args[1].get("file").text(), "attachment");
  });
}

test("Checkout edits use the external route for conversion in either direction, with one success notification", async () => {
  const { service, calls, messages } = await loadService("checkout/registrationService");
  await service.updateRegistration("registration", { fullName: "Name" });
  await service.updateRegistration("registration", { markAsExternalPayment: true });
  await service.updateRegistration("registration", { markAsExternalPayment: false });
  assert.deepEqual(calls.map(c => c.args[0]), [
    "/checkout/registrations/registration", "/checkout/registrations/registration/external-payment",
    "/checkout/registrations/registration/external-payment",
  ]);
  assert.equal(messages.length, 3);
  assert.deepEqual(calls[2].args[1], { fields: { markAsExternalPayment: false } });
});

test("EventReg exposes free registration operations without removed payment endpoints", async () => {
  const { service, calls, reject, messages } = await loadService("eventreg/registrationService");
  for (const name of ["createExternalRegistration", "checkExternalRegistrationDuplicate", "getRegistrationInvoice"]) {
    assert.equal(service[name], undefined);
  }
  reject({ response: { data: { message: "Rejected" } } });
  assert.deepEqual(await service.updateRegistration("id", { fullName: "Name" }), { error: true, message: "Rejected" });
  assert.equal(calls[0].args[0], "/eventreg/registrations/id");
  assert.deepEqual(messages, [["Rejected", "error"]]);
});
