import { worldConfig } from "@nexora/config";
import { prisma } from "@nexora/database";

type Pending = {
  characterId: string;
  mapKey: string;
  x: number;
  y: number;
  lastWrite: number;
};

export class PositionStore {
  private readonly pending = new Map<string, Pending>();

  mark(characterId: string, mapKey: string, x: number, y: number) {
    const current = this.pending.get(characterId);
    this.pending.set(characterId, {
      characterId,
      mapKey,
      x,
      y,
      lastWrite: current?.lastWrite ?? 0,
    });
  }

  async flushDue(now = Date.now()) {
    const due = [...this.pending.values()].filter(
      (row) => now - row.lastWrite >= worldConfig.persistThrottleMs,
    );
    await Promise.all(due.map((row) => this.write(row, now)));
  }

  async flushOne(characterId: string) {
    const row = this.pending.get(characterId);
    if (!row) {
      return;
    }
    await this.write(row, Date.now());
  }

  private async write(row: Pending, now: number) {
    await prisma.character.update({
      where: { id: row.characterId },
      data: { mapKey: row.mapKey, posX: row.x, posY: row.y },
    });
    this.pending.set(row.characterId, { ...row, lastWrite: now });
  }
}
