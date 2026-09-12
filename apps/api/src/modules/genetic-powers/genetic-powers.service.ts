import { Injectable } from "@nestjs/common";
import { geneticPowerConfig } from "@nexora/config";
import {
  backfillGeneticPower,
  battleFusionProof,
  breedingPowerProof,
  creaturePowerProof,
  generatePowerCards,
  inheritGeneticPower,
  createSeededRandom,
  powerHash,
  seedFromParts,
  type PowerAssignment,
} from "@nexora/game-engine";
import type { CreatureRecord } from "../../common/creature-io";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class GeneticPowersService {
  constructor(private readonly prisma: PrismaService) {}

  proofs() {
    return {
      enabled: geneticPowerConfig.enabled,
      creatures: [
        creaturePowerProof("pyron"),
        creaturePowerProof("florune"),
        creaturePowerProof("terranox"),
      ],
      battle: battleFusionProof(),
      breeding: breedingPowerProof(),
    };
  }

  present(assignment: PowerAssignment, speciesKey?: string) {
    return {
      powerId: assignment.powerId,
      powerLineageId: assignment.lineageId,
      originType: assignment.originType,
      originCreatureId: assignment.originCreatureId,
      name: assignment.genome.namePt,
      nameEn: assignment.genome.name,
      element: assignment.genome.element,
      typology: assignment.genome.typology,
      key: assignment.genome.key,
      cards: generatePowerCards({ power: assignment.genome, speciesKey, seed: 1 }),
    };
  }

  async ensureForCreature(row: CreatureRecord) {
    if (!geneticPowerConfig.enabled) {
      return this.present(
        backfillGeneticPower({
          creatureId: row.id,
          speciesKey: row.species.key,
          element: row.elementPrimary,
          lociKeys: row.loci.map((locus) => locus.expressedCardKey),
          geneticHash: row.geneticHash,
        }),
        row.species.key,
      );
    }
    const existing = await this.prisma.client.creaturePower.findUnique({
      where: { creatureId: row.id },
      include: { power: true, lineage: true },
    });
    if (existing) {
      return this.present(
        {
          powerId: existing.powerId,
          lineageId: existing.lineageId,
          originType: existing.originType,
          originCreatureId: existing.originCreatureId,
          genome: existing.power.definitionJson as PowerAssignment["genome"],
        },
        row.species.key,
      );
    }
    const assigned = backfillGeneticPower({
      creatureId: row.id,
      speciesKey: row.species.key,
      element: row.elementPrimary,
      lociKeys: row.loci.map((locus) => locus.expressedCardKey),
      geneticHash: row.geneticHash,
    });
    await this.persist(assigned, row.id);
    return this.present(assigned, row.species.key);
  }

  async assignOnHatch(
    child: CreatureRecord,
    fatherId?: string | null,
    motherId?: string | null,
    planned?: PowerAssignment | null,
  ) {
    if (!geneticPowerConfig.enabled) {
      return;
    }
    if (planned?.genome) {
      await this.persist(planned, child.id);
      return;
    }
    const [father, mother] = await Promise.all([
      fatherId ? this.prisma.client.creature.findUnique({ where: { id: fatherId }, include: { species: true, loci: true, geneticPower: { include: { power: true } } } }) : null,
      motherId ? this.prisma.client.creature.findUnique({ where: { id: motherId }, include: { species: true, loci: true, geneticPower: { include: { power: true } } } }) : null,
    ]);
    if (!father || !mother) {
      await this.ensureForCreature(child);
      return;
    }
    const fatherAssigned = father.geneticPower
      ? {
          genome: father.geneticPower.power.definitionJson as PowerAssignment["genome"],
          lineageId: father.geneticPower.lineageId,
          creatureId: father.id,
        }
      : {
          ...backfillGeneticPower({
            creatureId: father.id,
            speciesKey: father.species.key,
            element: father.elementPrimary,
            geneticHash: father.geneticHash,
          }),
          creatureId: father.id,
        };
    const motherAssigned = mother.geneticPower
      ? {
          genome: mother.geneticPower.power.definitionJson as PowerAssignment["genome"],
          lineageId: mother.geneticPower.lineageId,
          creatureId: mother.id,
        }
      : {
          ...backfillGeneticPower({
            creatureId: mother.id,
            speciesKey: mother.species.key,
            element: mother.elementPrimary,
            geneticHash: mother.geneticHash,
          }),
          creatureId: mother.id,
        };
    const rng = createSeededRandom(seedFromParts([child.id, child.geneticHash, "power"]));
    const assigned = inheritGeneticPower({
      rng,
      childId: child.id,
      childElement: child.elementPrimary,
      parentA: { genome: fatherAssigned.genome, lineageId: fatherAssigned.lineageId, creatureId: fatherAssigned.creatureId },
      parentB: { genome: motherAssigned.genome, lineageId: motherAssigned.lineageId, creatureId: motherAssigned.creatureId },
    });
    await this.persist(assigned, child.id);
  }

  private async persist(assigned: PowerAssignment, creatureId: string) {
    await this.prisma.client.geneticPower.upsert({
      where: { id: assigned.powerId },
      update: {},
      create: {
        id: assigned.powerId,
        powerHash: powerHash(assigned.genome),
        key: assigned.genome.key,
        name: assigned.genome.name,
        namePt: assigned.genome.namePt,
        element: assigned.genome.element,
        typology: assigned.genome.typology,
        definitionJson: assigned.genome,
      },
    });
    await this.prisma.client.geneticPowerLineage.upsert({
      where: { id: assigned.lineageId },
      update: {},
      create: { id: assigned.lineageId, originCreatureId: assigned.originCreatureId },
    });
    await this.prisma.client.creaturePower.upsert({
      where: { creatureId },
      update: { powerId: assigned.powerId, lineageId: assigned.lineageId, originType: assigned.originType },
      create: {
        creatureId,
        powerId: assigned.powerId,
        lineageId: assigned.lineageId,
        originType: assigned.originType,
        originCreatureId: assigned.originCreatureId,
      },
    });
  }
}
