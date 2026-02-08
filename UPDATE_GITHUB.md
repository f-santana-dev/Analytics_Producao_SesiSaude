# Atualizar dados e enviar para o GitHub

Este passo a passo mostra como atualizar os dados (Excel → Parquet) e enviar as mudanças para o GitHub.

## 1) Atualize a planilha
- Coloque o arquivo **Base_Producao.xlsx** atualizado na raiz do projeto:
  - `dashboard-react/Base_Producao.xlsx`

## 2) Gere o Parquet e copie para `public/`
No terminal:

```powershell
cd "C:\Users\francisco.santana\Desktop\dados_producao - Copia\dashboard-react"
npm run update:data
```

Isso vai:
- Ler o Excel
- Gerar `dados_producao.parquet`
- Copiar para `public/dados_producao.parquet`

## 3) Verifique as alterações
```powershell
git status -sb
```

Você deve ver mudanças em:
- `public/dados_producao.parquet`

## 4) Commit das mudanças
```powershell
git add .
git commit -m "Atualiza dados de producao"
```

## 5) Enviar para o GitHub
```powershell
git push
```

## Dica
Se o site estiver conectado ao Vercel, o deploy é automático após o push.
