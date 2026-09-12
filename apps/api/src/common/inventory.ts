import type { Prisma } from "@nexora/database";
import { Errors } from "./errors/app-error";

type Tx = Prisma.TransactionClient;

type ItemFlowMeta = {
  source: string;
  referenceId?: string;
};

export async function grantItem(
  tx: Tx,
  characterId: string,
  templateKey: string,
  quantity: number,
  flow?: ItemFlowMeta,
) {
  if (quantity <= 0) {
    return null;
  }
  const template = await tx.itemTemplate.findUnique({ where: { key: templateKey } });
  if (!template) {
    throw Errors.validation(`Item desconhecido: ${templateKey}`);
  }
  const existing = await tx.inventorySlot.findFirst({
    where: { characterId, item: { templateId: template.id } },
    include: { item: true },
  });
  const slot = existing
    ? await tx.inventorySlot.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
      })
    : await tx.inventorySlot.create({
        data: {
          characterId,
          itemId: (await tx.item.create({ data: { templateId: template.id } })).id,
          category: template.category,
          quantity,
        },
      });
  if (flow) {
    await tx.itemFlow.create({
      data: {
        characterId,
        templateKey,
        quantity,
        source: flow.source,
        referenceId: flow.referenceId,
      },
    });
  }
  return slot;
}

export async function consumeItem(
  tx: Tx,
  characterId: string,
  templateKey: string,
  quantity = 1,
  flow?: ItemFlowMeta,
) {
  if (quantity <= 0) {
    return;
  }
  const slot = await tx.inventorySlot.findFirst({
    where: { characterId, item: { template: { key: templateKey } } },
    include: { item: true },
  });
  if (!slot || slot.quantity < quantity) {
    throw Errors.insufficientItems();
  }
  if (slot.quantity === quantity) {
    await tx.inventorySlot.delete({ where: { id: slot.id } });
    await tx.item.delete({ where: { id: slot.itemId } }).catch(() => undefined);
  } else {
    await tx.inventorySlot.update({
      where: { id: slot.id },
      data: { quantity: slot.quantity - quantity },
    });
  }
  if (flow) {
    await tx.itemFlow.create({
      data: {
        characterId,
        templateKey,
        quantity: -quantity,
        source: flow.source,
        referenceId: flow.referenceId,
      },
    });
  }
}

export async function countItem(
  db: Pick<Tx, "inventorySlot">,
  characterId: string,
  templateKey: string,
) {
  const slot = await db.inventorySlot.findFirst({
    where: { characterId, item: { template: { key: templateKey } } },
  });
  return slot?.quantity ?? 0;
}
