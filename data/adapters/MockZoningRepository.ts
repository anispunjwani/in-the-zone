import type { ZoningRepository } from "@/data/repositories/interfaces";
export class MockZoningRepository implements ZoningRepository {
  async getZoningForParcel() { return "Illustrative zoning — not a determination"; }
}

