import { randomUUID } from "node:crypto";

export interface ActiveClient {
  id: string;
  connectedAt: number;
  cwd?: string;
}

export class ActiveClientManager {
  private clients = new Map<string, ActiveClient>();

  register(clientId?: string, cwd?: string): string {
    const id = clientId || randomUUID();
    this.clients.set(id, { id, connectedAt: Date.now(), cwd });
    return id;
  }

  getCwd(clientId: string): string | undefined {
    return this.clients.get(clientId)?.cwd;
  }

  unregister(clientId: string): { existed: boolean; count: number } {
    const existed = this.clients.delete(clientId);
    return { existed, count: this.clients.size };
  }

  getCount(): number {
    return this.clients.size;
  }

  getClients(): ActiveClient[] {
    return Array.from(this.clients.values());
  }
}
