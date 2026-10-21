# Refinamentos locais — criaturas e mundo

## Criaturas / Despertar
- Braços bípedes com ombros reposicionados, volumes de braço e antebraço, cotovelo e dedos.
- Baby, Young e Adult usam a mesma genética com proporções diferentes de cabeça, tronco, membros, chifres e asas. Sem novas rolagens ou alterações nos custos/requisitos do Despertar.
- Asas procedurais com nervuras, membranas curvas e movimento; apenas para o gene já associado a asas. O enquadramento considera a envergadura.
- Tela de evolução recebe chassis e plano corporal do servidor e mostra antes/depois em 3D. Corrigida condição que escondia o botão quando a próxima fase era uma prévia.
- Validação: 14 testes visuais, 7 testes de progressão/herança, TypeScript web/API e auditoria de 30 combinações bípedes em 13 estados. O fluxo autenticado de Despertar não foi executado contra uma conta real. Refinamentos são gerados pelo renderer; GLBs individuais antigos não foram reexportados.

## Mundo / mapa
- Terreno contínuo pré-calculado por região: elimina frestas da grade e separa o piso da ordenação de personagens e prédios.
- Grama com textura, praça pavimentada, trilhas e água em Haven/Verdantis. Folhagem com luz e detalhes.
- Minimap representa as trilhas reais, praça e água, com norte e região. Pontos de interesse recebem rótulos e o destino de caminhada fica marcado.
- Quadro de atlas ainda não disponível deixa de interromper a renderização.
- Prévia local: `/dev/adventure-preview`; usa o mesmo renderer do Adventure, sem autenticação ou mutações no servidor. Bloqueada em produção salvo flag de laboratório existente.
- Validação: TypeScript web, quatro testes de projeção/catálogo/mapas, inspeção visual de Haven/Verdantis, viagem e caminhada por clique. Nenhum novo erro de console após a correção de atlas.

O catálogo atual ainda não possui plates de produção READY. O terreno melhora o cenário de fallback atualmente utilizado; personagens e prédios continuam usando o kit existente. Não houve deploy nem build completo de produção nesta revisão.
