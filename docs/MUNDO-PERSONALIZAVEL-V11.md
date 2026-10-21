# Mundo ampliado, construções e treinador

- Haven: área caminhável passou de 150,08 para 400 unidades² (2,67×). Mercado, vila residencial, jardim, caminhos conectados e novos moradores.
- Verdantis: área caminhável passou de 126 para 496,8 unidades² (3,94×). Acampamento, ruínas, clareira e novos NPCs. Saídas e coordenadas antigas preservadas.
- Casas com telhados inclinados e telhas, chaminés apoiadas, caixilhos, portas de tábuas, floreiras, juntas de pedra e letreiros.
- Treinador com detalhes de mãos, punhos, botões, cabelo, roupa e animação de repouso. NPCs usam cabelos, equipamentos e acessórios por função, incluindo sentinela, mercador, pesquisador, cuidador e explorador.
- `/game/appearance` contém o editor com prévia. Salva usando `PATCH /characters/me/appearance`; atualiza a sessão e retorna ao mundo ou à escolha inicial de criatura. A opção Aparência está no menu do mapa. O mundo recebe a aparência persistida; atlas genérico não substitui a escolha do jogador.
- Prévias locais protegidas pelo modo de desenvolvimento: `/dev/adventure-preview` (seletor de lugares) e `/dev/tamer-preview` (sem gravação de conta).

Validação: TypeScript web aprovado; seis testes de expansão, acesso aos novos locais, variações de NPCs, projeção e contato com o piso aprovados. Revisão visual do bairro e do editor com troca de pele/cabelo/roupa, sem erros de console. O salvamento em conta autenticada não foi executado nesta validação. Sem deploy ou build completo de produção.

As regiões continuam usando o renderizador isométrico existente. As mudanças de construção atuam no kit atualmente utilizado quando os assets de produção não estão disponíveis.
