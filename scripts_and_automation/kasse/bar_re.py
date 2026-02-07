"""
Cash Invoice (Bar-Rechnung) Processor.
This script processes CSV exports of invoices paid in cash or by card,
mapping them to the DATEV format. It groups transactions by month
and generates separate export files for each period.
"""
import logging
import json
from datetime import datetime
import os
import glob
import sys
import pandas as pd

with open("config.json", "r") as f:
        config = json.load(f)

logging.basicConfig(
            filename=config["log_file"],
            level=logging.INFO,
            format="%(asctime)s [%(levelname)s] %(message)s"
        )

def main():
    """
    Main orchestration function for cash invoice processing.
    Reads input CSVs, filters for valid unpaid/non-processed rows,
    maps fields to DATEV standards, and exports grouped by month.
    """
    import_dir = config["bar_re"]["import_dir"]
    import_format = config["bar_re"]["import_format"]
    import_new_filename = config["bar_re"]["import_new_filename"]
    export_dir = config["export_dir"]
    export_filename = config["bar_re"]["export_filename"]
    file_matching_string = config["bar_re"]["file_matching_string"]
    
    # Check if the directory exists
    if not os.path.exists(import_dir):
        logging.error(f"Directory {import_dir} does not exist. Please check the path.")
        raise FileNotFoundError(f"Directory {import_dir} does not exist.")
    
    #Inform user about each of the imported files and ask for confirmation
    files = []
    os.makedirs(import_dir, exist_ok=True)
    pattern = os.path.join(import_dir, f"*{file_matching_string}*.{import_format}")
    files = glob.glob(pattern)
    if not files:
        raise FileNotFoundError(f"No {import_format} files matching {file_matching_string} found in {import_dir}. Please check the directory and try again.")
    
    logging.info(f"Found {len(files)} files matching the criteria: {files}")
    print(f"Found {len(files)} files matching the criteria:")
    for file in files:
        print(f"- {file}")
        
    confirm = input(f"Do you want to process all these files? (yes/no): ").strip().lower()
    if confirm not in ["yes", "y"]:
        logging.info("User chose not to process the files. Exiting.")
        print("Exiting without processing files.")
        sys.exit(0)
        
    # Leerer DataFrame zum Sammeln der gemappten Daten
    combined_df = pd.DataFrame()

    for file in files:
        logging.info(f"Processing file: {file}")
        print(f"Processing file: {file}")
        df = pd.read_csv(file, delimiter=';')
        df = df.dropna(how='all')

        # Gültige und ungültige Zeilen trennen
        valid = df[df["Status"].isna() & df["Bezahlt am"].isna()]
        invalid = df[~(df["Status"].isna() & df["Bezahlt am"].isna())]

        # Ungültige Zeilen ausgeben
        if not invalid.empty:
            print(f"Übersprungene Zeilen aus Datei '{file}':")
            print(invalid[["Status", "Bezahlt am", "Rechnungs-Nr.", "Rechnungsdatum", "Rechnungsbetrag"]])

        # Mapping
        mapped = pd.DataFrame({
            "Währung": "EUR",
            "VorzBetrag": valid["Rechnungsbetrag"],
            "RechNr": valid["Rechnungs-Nr."],
            "BelegDatum": pd.to_datetime(valid["Rechnungsdatum"], dayfirst=True).dt.strftime("%d%m"),
            "Belegtext": "Kundenrechnung Zahulung Bar oder Karte",
            "UStSatz": valid["Steuer in %"],
            "BU": "",
            "Gegenkonto": "",
            "Kost1": valid["KOST 1"],
            "Kost2": valid["KOST 2"],
            "Kostmenge": valid["KOST-Menge"],
            "Skonto": valid["Skonto-Betrag"],
            "Nachricht": "Automatischer Import Bar bezahlter Rechnungen"
        })

        # Anhängen
        combined_df = pd.concat([combined_df, mapped], ignore_index=True)

    # Convert VorzBetrag to numeric, handle German number format (1.614,70)
    # First remove thousand separators (.) then replace decimal separator (,) with (.)
    combined_df["VorzBetrag"] = (combined_df["VorzBetrag"]
                                .astype(str)
                                .str.replace(".", "", regex=False)  # Remove thousand separators
                                .str.replace(",", ".", regex=False))  # Replace decimal separator
    combined_df["VorzBetrag"] = pd.to_numeric(combined_df["VorzBetrag"], errors='coerce')
    # add + if >= 0 else - to VorzBetrag, always two decimals, and use comma as decimal separator
    combined_df["VorzBetrag"] = combined_df["VorzBetrag"].apply(lambda x: f"+{x:.2f}" if x >= 0 else f"-{abs(x):.2f}")
    combined_df["VorzBetrag"] = combined_df["VorzBetrag"].str.replace(".", ",")
    
    # Add a month column for grouping (extract month from BelegDatum)
    combined_df["Monat"] = combined_df["BelegDatum"].str[2:4]  # Extract month from DDMM format
    
    logging.info(f"Processed {len(combined_df)} valid rows from all files.")
    print(f"Processed {len(combined_df)} valid rows from all files.")
    date = datetime.now().strftime("%Y-%m-%d")
    time = datetime.now().strftime("%H-%M-%S")
    
    for file in files:
        #change the file name to the processed one
        new_file_name = os.path.join(import_dir, f"{import_new_filename}_{date}_{time}.csv")
        os.rename(file, new_file_name)

    # Create export directory if it doesn't exist
    os.makedirs(export_dir, exist_ok=True)
    
    # Group by month and export separate files
    months = combined_df["Monat"].unique()
    print(f"Creating separate export files for {len(months)} months: {', '.join(sorted(months))}")
    
    for month in sorted(months):
        month_df = combined_df[combined_df["Monat"] == month].copy()
        # Remove the temporary month column before export
        month_df = month_df.drop(columns=["Monat"])
        
        month_filename = f"{export_filename}_Monat-{month}_{date}_{time}.csv"
        month_df.to_csv(f"{export_dir}/{month_filename}", index=False, sep=';')
        
        print(f"Exported {len(month_df)} transactions for month {month} to {month_filename}")
        logging.info(f"Exported {len(month_df)} transactions for month {month} to {month_filename}")
        logging.info(f"Month {month} data: {month_df[['Währung', 'VorzBetrag', 'BelegDatum', 'RechNr']].to_string()}")
    
    print(f"Please check these Invoices as paid:")
    print(combined_df[["VorzBetrag", "RechNr", "Monat"]])
    
    # Clean up the temporary month column
    combined_df = combined_df.drop(columns=["Monat"])

if __name__ == "__main__":
    try:
        logging.info(f"*****Started Processing BarRe Umsätze at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} *****")
        main()
        logging.info(f"*****Finished processing BarRe Umsätze at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} *****")
    except Exception as e:
        logging.error(f"An error occurred: {e}")
        print(f"An error occurred: {e}")    