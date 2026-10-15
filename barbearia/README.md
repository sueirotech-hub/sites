# Barbearia Premium

Landing page responsiva, feita com HTML, CSS e JavaScript puro. Todo o conteúdo é em português, com máquina em levitação suave, tipografia de texto mais robusta, descrições diretas e galeria de inspirações no lugar do blog. Não precisa de npm, compilação ou dependências de frontend.

## Arquivos

- `index.html`: conteúdo, navegação, serviços, horários, contato e rodapé.
- `styles.css`: layout desktop/mobile, cores e tipografia.
- `script.js`: menu acessível, navegação ativa, busca e janelas de equipe e inspirações de estilo.
- `motion.js`: fade-in, entradas em cascata, palavras reveladas, inclinação suave e abertura dos diálogos a partir do elemento clicado.
- `fonts.css`: fontes locais, com fallback e `font-display: swap`.
- `assets/`: fotografias em WebP, máquina com transparência, fontes e favicon.

Abra `index.html` diretamente ou publique os arquivos da pasta `barbearia/` em qualquer hospedagem estática. Para um servidor local opcional: `python3 -m http.server 8000 --directory barbearia`.

## Personalizar

Edite as variáveis no começo de `styles.css` para cores e largura. Altere nome, telefone, endereço, horários e links no HTML. Os textos da equipe e da galeria estão em `script.js`.

Todos os nomes, contatos e dados de estabelecimento são fictícios para demonstração. Os ícones sociais apontam às páginas iniciais das redes e devem ser substituídos pelos perfis reais. O botão principal leva ao contato; o telefone e o e-mail usam `tel:` e `mailto:`.

A newsletter apenas valida o formato do e-mail e informa que a inscrição está indisponível. Não transmite nem armazena dados. Integre um provedor antes de ativá-la em produção.

## Imagens e tipografia

Fotografias e máquina criadas pela ferramenta de geração de imagens a partir da referência fornecida, para reproduzir a composição, iluminação quente e identidade escura. Os arquivos locais de Big Shoulders Display, Alegreya Sans e Berkshire Swash foram obtidos pelo Google Fonts. As licenças correspondentes estão em `assets/fonts/`.

## Acessibilidade e desempenho

Sem scripts ou fontes externos em tempo de execução. Imagens WebP com dimensões explícitas; máquina com prioridade de carregamento; fotos das seções seguintes com carregamento sob demanda. Links de salto, foco visível, menu com `aria-expanded`, formulários rotulados, janelas nativas com fechamento por Escape e redução de movimento em dispositivos móveis.

Validação: sintaxe JavaScript e integridade dos arquivos/imagens/âncoras. A inspeção visual em navegador não estava disponível neste ambiente; não foi realizada medição de Lighthouse.

## Movimento e nova direção visual

Paleta de tinta preta, verde profundo, vinho, tabaco, latão e papel quente. Títulos altos e compactos com Big Shoulders Display 700/800, textos humanistas com Alegreya Sans 500/700 e assinatura caligráfica com Berkshire Swash. A escala dos títulos, os botões, as legendas e os campos foram redesenhados, com corpo principal de 20 px e hierarquia própria em cada seção. As fontes anteriores foram removidas. Os pesos, tamanhos e regras de quebra de linha estão centralizados em `styles.css`.

Animações implementadas em código próprio a partir dos padrões apresentados nos catálogos https://naocodei.com/free-code-css/ e https://naocodei.com/free-code/: fade-in, subir e aparecer, cascata, cortina, sublinhado, flutuação, brilho no botão, revelação por palavras, inclinação e janela que nasce do elemento acionado.

O conteúdo continua visível sem JavaScript. No computador, o movimento fica sempre ativo: telas a partir de 761 px ou dispositivos com ponteiro fino e hover ativam as entradas, a levitação e as transições automaticamente. Em dispositivos móveis sem esses recursos, a preferência do sistema por movimento reduzido é respeitada. A rolagem permanece nativa, e as entradas podem se repetir ao revisitar as seções. Elementos focados pelo teclado são revelados imediatamente. A levitação pausa quando o hero sai da tela.


## Vitrine de cortes

A antiga galeria de três imagens foi substituída por uma vitrine de seis cortes em `#cortes`, mantendo o endereço `#estilos` como atalho compatível. A seção segue as fontes, cores e animações da página e tem seis espaços reservados sem imagens nem requisições quebradas. Cada corte mostra nome, descrição, laterais, topo, acabamento e link para o contato.

A grade usa três colunas no desktop, duas no tablet e uma no celular. Os cartões entram em cascata, seguindo a política de movimento da página. As fotos podem ser inseridas depois seguindo `assets/cortes/LEIA-ME.md`; cada bloco do HTML já contém o elemento img de exemplo em um comentário.

## Agendamento e animações no desktop

- `booking.js`: datas em America/Sao_Paulo, opções de horário em intervalos de 30 minutos, duração do serviço e limite de 60 dias. O horário escolhido é uma preferência, não uma disponibilidade confirmada. Aos domingos e sábados, o fim do expediente é respeitado. Para o dia atual, há antecedência mínima de 15 minutos.
- O formulário prepara uma solicitação copiável. Não cria reserva, não bloqueia horários e não armazena os dados pessoais.
- Para encaminhar pelo WhatsApp, preencha `data-whatsapp` na seção `#agendar` com o número **real** no formato DDI + DDD + número. O número fictício da demonstração é rejeitado. O envio acontece somente quando o visitante clica no link de WhatsApp, após revisar o pedido.
- A máquina mantém a levitação e as entradas agora usam Web Animations API, com dois quadros de preparação e compatibilidade por transição CSS. Entradas voltam a acontecer ao revisitar as seções.
- Não há botão de ativação nem preferência de animação salva no navegador. No computador, a animação fica sempre ativa, inclusive se havia uma configuração antiga para reduzi-la. Mudanças de dispositivo/tamanho e retornos pelo histórico reinicializam o mecanismo; a aba oculta e o hero fora da tela pausam apenas a levitação para evitar trabalho desnecessário.
- Os arquivos CSS e JS recebem um identificador de versão para evitar que o navegador combine estilos e scripts antigos.

## Agendamento aberto e centralizado

O agendamento usa a largura da seção, com título centralizado e sem cartão, borda externa, sombra ou fundo próprio no formulário. Serviço, dia e período ocupam uma primeira faixa; os horários ficam centralizados em uma faixa mais larga; nome, telefone e observação se distribuem abaixo, seguidos pela ação central. As informações da barbearia fecham a seção em uma linha discreta. No celular, os campos se reorganizam sem alterar a ordem de leitura ou a lógica de solicitação.
