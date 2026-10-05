# FastFood landing page

Landing page responsiva baseada na imagem de referência. Inclui navegação, detalhes do hambúrguer, horários e uma prévia do formulário de reserva. O formulário é demonstrativo e não envia reservas.

## GitHub Pages

O site está pronto para publicação a partir da raiz da branch `main`, com `index.html` como página inicial. Em **Settings → Pages**, escolha **Deploy from a branch**, selecione **main** e **/(root)**, e salve. Não há etapa de build.

O arquivo [fastfood.html](fastfood.html) contém a mesma página com imagem, fontes, CSS e JavaScript incorporados para abrir ou baixar separadamente.

## Executar localmente

Na raiz do repositório, execute:

```sh
python3 -m http.server 8765
```

Abra `http://localhost:8765` no navegador. Não é necessário instalar dependências. A imagem e as fontes estão em `assets/`.
