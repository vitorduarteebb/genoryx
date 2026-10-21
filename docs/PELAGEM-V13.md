# Pelagem genética V13

Três alelos adicionados ao slot pattern: PATTERN_FUR_SHORT, PATTERN_FUR_SHAGGY e PATTERN_FUR_MANE. O slot existente permite gerar e herdar pelagens sem migração; nesta versão, pelagem substitui o padrão de escamas/listras, não é um gene independente. As cores e peças continuam combináveis.

Cabeças HEAD_05_URSINE e HEAD_06_VULPINE usam deformações próprias dos doadores existentes, mantendo o encaixe, olhos e mandíbula. Não são dois novos GLBs esculpidos à mão.

Tufos 3D determinísticos gerados na superfície, até 6.500 por criatura. Copiam pesos do esqueleto e deslocamentos dos morphs, com material fosco e máscara de cores herdada. Olhos/focinho ficam livres. A pelagem acompanha a animação; não há simulação física individual de fios. Implementação no renderer web compartilhado, sem export Unity neste lote.

Validação: teste de deformação por osso, limite de geometria, repetibilidade, geração dos três alelos e herança; regressões de anatomia, respiração, olhos, ovos e mandíbula; revisão visual no laboratório local. Nenhum deploy.
