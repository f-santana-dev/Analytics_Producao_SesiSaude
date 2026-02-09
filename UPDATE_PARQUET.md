# Atualizar o Parquet

Este projeto gera o arquivo `public/dados_producao.parquet` a partir da planilha de origem via o script local.

## Comando
```bash
npm run update:data
```

## O que o comando faz
1. Lê a planilha de dados (arquivo de origem definido no script).
2. Gera o `dados_producao.parquet`.
3. Copia o parquet para `public/`.

Se quiser alterar o arquivo de origem, ajuste o script em `scripts/update_parquet.py`.
