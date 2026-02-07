"""
CWS Cash Report Parser.
This script extracts revenue data from CWS (Bakery System) PDF cash reports
and converts them into a DATEV-compatible CSV format for accounting.
"""
import pdfplumber
import sys
import os
import pandas as pd
import logging
from datetime import datetime
import json


with open("config.json", "r") as f:
        config = json.load(f)

logging.basicConfig(
            filename=config["log_file"],
            level=logging.INFO,
            format="%(asctime)s [%(levelname)s] %(message)s"
        )


def main():
    """
    Orchestrates the PDF parsing process: searches for files, extracts table data
    from CWS reports, and generates a formatted CSV export.
    """
    data = []
    import_dir = config["cws"]["import_dir"]
    import_format = config["cws"]["import_format"]
    export_dir = config["export_dir"]
    export_filename = config["cws"]["export_filename"]
    file_matching_string = config["cws"]["file_matching_string"]

    # Check if the directory exists
    if not os.path.exists(import_dir):
        logging.error(f"Directory {import_dir} does not exist. Please check the path.")
        raise FileNotFoundError(f"Directory {import_dir} does not exist.")

    #Inform user about each of the imported files and ask for confirmation
    files = []
    for file in os.listdir(import_dir):
        if file.endswith(f".{import_format}") and file_matching_string in file:
            files.append(file)  
    if not files:
        logging.error(f"No {import_format} files matching {file_matching_string} found in {import_dir}. Please check the directory and try again.")
        raise FileNotFoundError(f"No {import_format} files found in {import_dir}.")
    
    logging.info(f"Found {len(files)} files matching the criteria: {files}")
    print(f"Found {len(files)} files matching the criteria:")
    for file in files:
        print(f"- {file}")
        
    confirm = input(f"Do you want to process all these files? (yes/no): ").strip().lower()
    if confirm not in ["yes", "y"]:
        logging.info("User chose not to process the files. Exiting.")
        print("Exiting without processing files.")
        sys.exit(0)

    # List all PDF files in the directory and process those that match the criteria
    for file in os.listdir(import_dir):
        if file.endswith(f".{import_format}") and file_matching_string in file:
            print(f"Processing {file}")

            # Open the PDF file and extract the table
            with pdfplumber.open(os.path.join(import_dir, file)) as pdf:
                page = pdf.pages[0]
                table = page.extract_table()
                current_filiale = None
                for row in table:
                    for i, value in enumerate(row):
                        if value is not None and "€" in value:
                            row[i] = value.replace('.', '').replace('€', '').strip()
                            
                    if row[0] and 'HAUPTGESCHÄFT' in row[0] or 'NIDDA' in row[0]:
                        current_filiale = row[0]
                    elif row[0] and 'Datum' in row[0] and row[1]:  # Summenzeile der Filiale
                        data.append({
                            "Datum": row[0].strip('Datum: '),
                            "Filiale": current_filiale,
                            "Bereinigter Umsatz": row[1],
                            "Einnahmen 19%": row[5],
                            "Einnahmen 7%": row[6],
                            "Gutsheine": row[7],
                        })
                logging.info(f"Processed {len(data)} rows from {file}")
                    # elif row[0] and 'Gesamtsumme' in row[0]:
                    #     data.append({
                    #         "Datum": data[-1]["Datum"],  # Use the last date
                    #         "Filiale": "GESAMT",
                    #         "Bereinigter Umsatz": row[1],
                    #         "Einnahmen 19%": row[5],
                    #         "Einnahmen 7%": row[6],
                    #         "Gutsheine": row[7],
                    #     })
                
    df = pd.DataFrame(data)
    if df.empty:
        logging.error("No data found. Please check the files and try again.")
        raise ValueError("No data found.")
    df["Datum"] = pd.to_datetime(df["Datum"], dayfirst=True)

    columns = [
        "Währung", "VorzBetrag", "RechNr", "BelegDatum", "Belegtext",
        "UStSatz", "BU", "Gegenkonto", "Kost1", "Kost2", "Kostmenge",
        "Skonto", "Nachricht"
        ]

    df_exp = pd.DataFrame(columns=columns)

    for _, row in df.iterrows():
        datum = row["Datum"].strftime("%d%m")
        for ust, satz in [("Einnahmen 19%", "19"), ("Einnahmen 7%", "7"), ("Gutsheine", "0")]:
            betrag = float(row[ust].replace(",", ".")) 
            if betrag == 0:
                logging.info(f"Skipping zero amount for {ust} on {datum} in {row['Filiale']}")
                continue
            df_exp.loc[len(df_exp)] = {
                "Währung": "EUR",
                "VorzBetrag": f"{'+' if betrag >= 0 else '-'}{abs(betrag):.2f}".replace(".", ","),
                "RechNr": "",
                "BelegDatum": datum,
                "Belegtext": f"T.E. {row['Filiale']} {ust}",
                "UStSatz": satz,
                # "BU": "",
                # "Gegenkonto": "",
                # "Kost1": "",
                # "Kost2": "",
                # "Kostmenge": "",
                # "Skonto": "",
                "Nachricht": "Automatischer Import aus CWS-Kassenbericht"
            }

    if df_exp.empty:
        logging.error("No export data found. Please check the input data.")
        raise ValueError("No export data found. Input might be empty or not formatted correctly.")

    start = df["Datum"].min()
    end = df["Datum"].max()
    start = pd.to_datetime(start, dayfirst=True).strftime("%Y-%m-%d")
    end = pd.to_datetime(end, dayfirst=True).strftime("%Y-%m-%d")
            
    df_exp.to_csv(f"{export_dir}/{export_filename}_{start}_{end}.csv", index=False, sep=";")
    print(f"Exported CWS data to {export_filename}_{start}_{end}.csv")
    logging.info(f"Exported CWS data to {export_filename}_{start}_{end}.csv")
    logging.info(f"with {len(df_exp)} transactions and the following data:")
    logging.info(df_exp[["Währung", "VorzBetrag", "BelegDatum", "Belegtext"]])
    
    
if __name__ == "__main__":
    try:
        logging.info(f"*****Started Processing CWS Umsätze at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} *****")
        main()
        logging.info(f"*****Finished processing CWS Umsätze at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} *****")
    except Exception as e:
        logging.error(f"An error occurred: {e}")
        print(f"An error occurred: {e}")    