# Personagens e contato com o terreno

- Treinador e NPCs do kit local agora são renderizados a partir de um modelo 3D estilizado com roupa, cinto, bolsa, ombreiras, braços, mãos, rosto e botas. Atlas em oito direções, caminhada de oito quadros; sombras suaves no plano dos pés. Assets externos existentes continuam tendo prioridade.
- A origem do chão da criatura 3D é projetada pela câmera e alinhada à âncora declarada do sprite. Antes, a sombra ficava em 90% da imagem enquanto o modelo permanecia centralizado acima dela.
- O renderer do mapa usa âncoras de pés distintas para criaturas e humanos, em vez de apoiar a borda transparente da imagem no chão.
- Caminhada/corrida das criaturas amostram o ciclo completo do clip. O companheiro gira conforme seu deslocamento e avança a animação pela distância percorrida, incluindo a desaceleração.
- Iluminação do atlas das criaturas ajustada para melhorar a leitura no cenário.

Verificação: TypeScript web aprovado; quatro testes de projeção, mapas e contato aprovados. O teste do treinador verifica 8 direções × 32 fases e o pé de apoio no plano y=0. Prévia local revisada com deslocamento por clique. Não houve deploy nem build de produção. Esta revisão cobre a representação no mapa; não substitui os modelos de batalha.
