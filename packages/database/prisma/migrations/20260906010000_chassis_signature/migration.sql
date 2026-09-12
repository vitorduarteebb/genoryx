-- Assinatura do fenótipo do chassi V1. Unique: duas criaturas vivas não
-- podem ter o mesmo corpo visível. NULL = plantel legado, candidato a reseed.
ALTER TABLE "creatures" ADD COLUMN "chassis_signature" TEXT;

CREATE UNIQUE INDEX "creatures_chassis_signature_key" ON "creatures"("chassis_signature");
