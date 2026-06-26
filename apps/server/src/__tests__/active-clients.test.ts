import { describe, expect, it } from "vitest";

import { ActiveClientManager } from "../session/active-clients";

describe("ActiveClientManager", () => {
  it("registers a client with auto-generated id", () => {
    const mgr = new ActiveClientManager();
    const id = mgr.register();
    expect(id).toBeTruthy();
    expect(typeof id).toBe("string");
  });

  it("registers a client with provided id", () => {
    const mgr = new ActiveClientManager();
    const id = mgr.register("my-client");
    expect(id).toBe("my-client");
  });

  it("unregisters an existing client", () => {
    const mgr = new ActiveClientManager();
    mgr.register("c1");
    const result = mgr.unregister("c1");
    expect(result.existed).toBe(true);
    expect(result.count).toBe(0);
  });

  it("unregister returns existed=false for unknown client", () => {
    const mgr = new ActiveClientManager();
    const result = mgr.unregister("unknown");
    expect(result.existed).toBe(false);
    expect(result.count).toBe(0);
  });

  it("returns client count", () => {
    const mgr = new ActiveClientManager();
    expect(mgr.getCount()).toBe(0);
    mgr.register("c1");
    expect(mgr.getCount()).toBe(1);
    mgr.register("c2");
    expect(mgr.getCount()).toBe(2);
  });

  it("lists all clients", () => {
    const mgr = new ActiveClientManager();
    mgr.register("c1");
    mgr.register("c2");
    const clients = mgr.getClients();
    expect(clients).toHaveLength(2);
    expect(clients.map((c) => c.id).sort()).toEqual(["c1", "c2"]);
  });
});
