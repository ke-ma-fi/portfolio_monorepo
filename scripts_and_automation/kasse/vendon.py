"""
Vendon Cloud Transaction Export.
This script processes Excel exports from the Vendon cloud (Vending machines)
and converts them into DATEV-compatible CSV files. It handles both
vending revenue and clearing account (Sammelkasse) transactions.
"""
import os
import pandas as pd
import logging
from datetime import datetime
import json
import glob
import sys

with open("config.json", "r") as f:
    config = json.load(f)

logging.basicConfig(
        filename=config["log_file"],
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s"
    )

import_dir = config["vendon"]["import_dir"]
import_format = config["vendon"]["import_format"]
export_dir = config["export_dir"]
export_filename_vend = config["vendon"]["export_filename_vend"]
export_filename_sk = config["vendon"]["export_filename_sk"]
starts_at_row = config["vendon"]["starts_at_row"]
machines = config["vendon"]["machines"]
columns_to_keep = {
      "Nr": 0,
      "Datum": 1,
      "Maschine": 2,
      "Barumsatz": 4,
      "Kartenumsatz": 5,
      "Ausbezahlt": 15,
      "Aenderung_Wechselgeld": 22
    }


def main():
    """
    Main orchestration function for Vendon data processing.
    Identifies the latest export file, processes it, and generates CSV exports.
    """
    # Check if the directory exists
    if not os.path.exists(import_dir):
        logging.error(f"Directory {import_dir} does not exist. Please check the path.")
        raise FileNotFoundError(f"Directory {import_dir} does not exist.")
    
    #Inform user that only the latest file will be processed
    os.makedirs(import_dir, exist_ok=True)
    pattern = os.path.join(import_dir, f"*.{import_format}")
    files = sorted(glob.glob(pattern), reverse=True)
    if not files:
        logging.error(f"No {import_format} files found in {import_dir}. Please check the directory and try again.")
        raise FileNotFoundError(f"No {import_format} files found in {import_dir}.")
    latest_file = files[0]
    
    confirmation = input(f"Found {len(files)} files matching the criteria. Do you want to process the latest file: {latest_file}? (yes/no): ").strip().lower()
    if confirmation not in ["yes", "y"]:
        logging.info(f"User chose not to process {latest_file} . Exiting.")
        print("Exiting without processing files.")
        sys.exit(0)
    
    # Process the latest file    
    df = processing_input_file(latest_file)
    start = df["Datum"].min().strftime("%Y-%m-%d")
    end = df["Datum"].max().strftime("%Y-%m-%d")
    
    os.makedirs(export_dir, exist_ok=True)
    logging.info(f"Exporting data from {start} to {end} to {export_dir}, starting with Vendon data.")
    
    df_vend = datev_vend(df)
    df_vend.to_csv(f"{export_dir}/{export_filename_vend}_{start}_{end}.csv", index=False, sep=";")
    logging.info(f"Exported Grillautomat data to {export_filename_vend}_{start}_{end}.csv")
    logging.info(f"with {len(df_vend)} transactions and the following data:")
    logging.info(df_vend[["Währung", "VorzBetrag", "BelegDatum", "Belegtext"]])
    logging.info("Now exporting Sammelkasse data...")
    print(f"Exported Vendon data for Grillautomaten to {export_filename_vend}_{start}_{end}.csv")

    df_sk = datev_sk(df_vend)
    df_sk.to_csv(f"{export_dir}/{export_filename_sk}_{start}_{end}.csv", index=False, sep=";")
    logging.info(f"Exported Sammelkasse data to {export_filename_sk}_{start}_{end}.csv")
    logging.info(f"with {len(df_sk)} transactions and the following data:")
    logging.info(df_sk[["Währung", "VorzBetrag", "BelegDatum", "Belegtext"]])
    print(f"Exported Sammelkasse data to {export_filename_sk}_{start}_{end}.csv")

def processing_input_file(file):
    """
    Reads the Vendon Excel file, cleans the data, maps machine names,
    and ensures correct numeric formatting for amounts.
    """
    logging.info(f"Processing the latest file: {file}")
    col_indices = list(columns_to_keep.values())
    col_names = list(columns_to_keep.keys())
    df = pd.read_excel(file, engine='openpyxl', skiprows=starts_at_row, usecols=col_indices)
    df.columns = col_names
    # Find the first NaN in the 'nr' column and truncate the DataFrame
    first_nan_idx = df[col_names[0]].isna().idxmax() if df[col_names[0]].isna().any() else len(df)
    df = df.iloc[:first_nan_idx]
    df['Maschine'] = (
    df['Maschine']
    .astype(str)
    .str.strip('*')
    .apply(lambda x: machines[x] if x in machines else x)
    )
    df['Barumsatz'] = df['Barumsatz'].astype(float).fillna(0)
    df['Kartenumsatz'] = df['Kartenumsatz'].astype(float).fillna(0)
    df['Ausbezahlt'] = df['Ausbezahlt'].astype(float).fillna(0)
    df['Aenderung_Wechselgeld'] = df['Aenderung_Wechselgeld'].astype(float).fillna(0)
    pd.set_option('display.float_format', '{:.2f}'.format)
    logging.info(f"DataFrame after processing: {df}")
    return (df)


def datev_vend(df):
    """
    Maps Vendon transactions (Sales, Payouts, Deposits) to the DATEV format.
    Handles currency formatting and Belegtext generation.
    """

    columns = [
    "Währung", "VorzBetrag", "RechNr", "BelegDatum", "Belegtext",
    "UStSatz", "BU", "Gegenkonto", "Kost1", "Kost2", "Kostmenge",
    "Skonto", "Nachricht"
    ]
    
    df_rev = pd.DataFrame(columns = columns) 
    df_out = pd.DataFrame(columns = columns)
    df_in = pd.DataFrame(columns = columns)
    
    #Umsätze
    df_rev["VorzBetrag"] = df.apply(
    lambda row: f"{'-' if row['Barumsatz'] < 0 else '+'}{abs(row['Barumsatz']):.2f}".replace(".", ","),
    axis=1
    )
    df_rev["BelegDatum"] = pd.to_datetime(df["Datum"], dayfirst=True).dt.strftime("%d%m")
    df_rev["Belegtext"] = df.apply(lambda row: f"Automat {row['Maschine']} Barumsatz", axis=1)

    #Auszahlungen
    df_out["VorzBetrag"] = df.apply(
    lambda row: f"-{abs(row['Ausbezahlt']):.2f}".replace(".", ","),
    axis=1
    )
    df_out["BelegDatum"] = pd.to_datetime(df["Datum"], dayfirst=True).dt.strftime("%d%m")
    df_out["Belegtext"] = df.apply(lambda row: f"Automat {row['Maschine']} Auszahlung", axis=1)
    df_out["Gegenkonto"] = "1095"

    #Einzahlungen
    df_in["VorzBetrag"] = df.apply(
    lambda row: f"+{abs(row['Aenderung_Wechselgeld']):.2f}".replace(".", ","),
    axis=1
    )
    df_in["BelegDatum"] = pd.to_datetime(df["Datum"], dayfirst=True).dt.strftime("%d%m")
    df_in["Belegtext"] = df.apply(lambda row: f"Automat {row['Maschine']} Einzahlung", axis=1)
    df_in["Gegenkonto"] = "1095" 

    df_exp = pd.concat([df_rev, df_out, df_in], ignore_index=True)

    #default values
    df_exp["Währung"] = "EUR"
    df_exp["Nachricht"] = "Automatischer Import aus vendon cloud"
    df_exp["RechNr"] = ""
    df_exp = df_exp[df_exp["VorzBetrag"].replace({',': '.'}, regex=True).astype(float) != 0]
    
    return df_exp

def datev_sk(df):
    """
    Generates the corresponding 'Sammelkasse' (Clearing) entries for 
    payouts and deposits from the vending machines.
    """
    columns = [
    "Währung", "VorzBetrag", "RechNr", "BelegDatum", "Belegtext",
    "UStSatz", "BU", "Gegenkonto", "Kost1", "Kost2", "Kostmenge",
    "Skonto", "Nachricht"
    ]
    
    df_exp = pd.DataFrame(columns = columns) 
    df_exp = df[df["Gegenkonto"] == "1095"].copy()

# Convert VorzBetrag to float, multiply by -1, and format back
    df_exp["VorzBetrag"] = (
        df_exp["VorzBetrag"]
        .replace({',': '.'}, regex=True)
        .astype(float)
        .mul(-1)
        .apply(lambda x: f"{x:+.2f}".replace(".", ","))
    )   
    df_exp["Gegenkonto"] = "1002"
    
    return df_exp


if __name__ == "__main__":
    try:
        logging.info(f"*****Started Processing Vendon Umsätze at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} *****")
        main()
        logging.info(f"*****Finished processing Vendon Umsätze at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} *****")
    except Exception as e:
        logging.error(f"An error occurred: {e}")
        print(f"An error occurred: {e}") 


