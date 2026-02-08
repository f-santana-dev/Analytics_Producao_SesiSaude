import argparse
import shutil
from pathlib import Path

import pandas as pd


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Atualiza o arquivo Parquet a partir da planilha Excel."
    )
    parser.add_argument(
        "--excel",
        default="Base_Producao.xlsx",
        help="Caminho para o arquivo Excel (default: Base_Producao.xlsx)",
    )
    parser.add_argument(
        "--output",
        default="dados_producao.parquet",
        help="Nome do Parquet gerado (default: dados_producao.parquet)",
    )
    parser.add_argument(
        "--public-dir",
        default="public",
        help="Pasta public para copiar o Parquet (default: public)",
    )
    args = parser.parse_args()

    excel_path = Path(args.excel)
    output_name = args.output
    public_dir = Path(args.public_dir)

    if not excel_path.exists():
        raise SystemExit(f"Arquivo Excel não encontrado: {excel_path}")

    print(f"Lendo Excel: {excel_path}")
    df = pd.read_excel(excel_path, engine="openpyxl")

    # Otimizar tipos: converter colunas object com baixa cardinalidade em categoria
    for col in df.select_dtypes(include=["object"]).columns:
        if df[col].nunique(dropna=False) / max(len(df), 1) < 0.5:
            df[col] = df[col].astype("category")

    parquet_path = Path(output_name)
    print(f"Gerando Parquet: {parquet_path}")
    df.to_parquet(parquet_path, engine="pyarrow")

    public_dir.mkdir(parents=True, exist_ok=True)
    dest = public_dir / parquet_path.name
    shutil.copy2(parquet_path, dest)
    print(f"Copiado para: {dest}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
