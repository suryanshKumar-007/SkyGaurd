from pathlib import Path
import pandas as pd


DATASET_DIR = Path("../dataset/raw")


def inspect_file(file_path):
    print("\n" + "=" * 80)
    print(f"FILE: {file_path.name}")
    print("=" * 80)

    df = pd.read_csv(file_path, sep="|")

    print(f"Rows: {len(df):,}")
    print(f"Columns: {len(df.columns)}")

    print("\nCOLUMN NAMES:")
    for column in df.columns:
        print(f"  - {column}")

    print("\nDATA TYPES:")
    print(df.dtypes)

    print("\nFIRST 5 ROWS:")
    print(df.head())

    print("\nMISSING VALUES:")
    print(df.isna().sum())


def main():
    files = sorted(DATASET_DIR.glob("*.psv"))

    if not files:
        print("No .psv files found.")
        return

    print(f"Found {len(files)} dataset files.")

    for file_path in files:
        inspect_file(file_path)


if __name__ == "__main__":
    main()