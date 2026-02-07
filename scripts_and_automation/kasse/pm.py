"""
Perfect Money (PM) Transaction Export.
This script automates the extraction of transaction data from the Perfect Money 
web interface using Playwright and exports it into a DATEV-compatible CSV format.
It handles two export types: PerfectMoney and Sammelkasse.
"""
from playwright.sync_api import sync_playwright, Playwright
from bs4 import BeautifulSoup
import pandas as pd
import logging
import os
from datetime import datetime
import glob
import re
import sys
import json


with open("config.json", "r") as f:
    config = json.load(f)
    
export_dir = config["export_dir"]
export_filename_pm = config["pm"]["export_filename_pm"]
export_filename_sk = config["pm"]["export_filename_sk"]


logging.basicConfig(
        filename=config["log_file"],
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s"
    )


def main():
    """
    Main entry point for the PM export script.
    Orchestrates browser automation, data extraction, and CSV generation.
    """
    logging.info(f"***** Processing Perfect Money Bestandsveränderung started at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} *****")
    
    # Get user input for place, start and end dates
    place = input("Enter place (us/markt): ").strip().lower()
    if not (place in ["us", "markt"]):
        raise ValueError("Invalid place specified. Use 'us' or 'markt'.")
    logging.info(f"Selected place: {place}")
    
    ####
    # Start Logic
    ####
    # Get the timespan for the export
    start, end = get_timespan(place)
    logging.info(f"Selected place: {place}, start: {start}, end: {end}, staring export...")
    print(f"Selected place: {place}, start: {start}, end: {end}, staring export...")
    
    # Run the Playwright script to get the HTML content
    with sync_playwright() as p:
        html = run(p, place, start, end)
    df = extract_transactions(html)
    
    # Export the data to CSV files in DATEV format for PerfectMoney
    df_pm = datev_pm(df, place)
    df_pm.to_csv(f"{export_dir}/{export_filename_pm}_{place}_{start}_{end}.csv", index=False, sep=";")
    logging.info(f"Exported PerfectMoney data to {export_filename_pm}_{place}_{start}_{end}.csv")
    logging.info(f"with {len(df_pm)} transactions and the following data:")
    logging.info(df_pm[["Währung", "VorzBetrag", "BelegDatum", "Belegtext"]])
    
    # Export the data to CSV files in DATEV format for Sammelkasse
    df_sk = datev_sk(df, place)
    df_sk.to_csv(f"{export_dir}/{export_filename_sk}_{place}_{start}_{end}.csv", index=False, sep=";")
    logging.info(f"Exported Sammelkasse data to {export_filename_sk}_{place}_{start}_{end}.csv")
    logging.info(f"with {len(df_sk)} transactions and the following data:")
    logging.info(df_sk[["Währung", "VorzBetrag", "BelegDatum", "Belegtext"]])    


def run(p: Playwright, place, start, end) -> str:
    """
    Uses Playwright to navigate the PM web interface and extract the transaction table HTML.
    Handles login and navigation to the 'Bestandsverwaltung' evaluation page.
    """
    
    
    if place == "us":
        data = config["pm"]["us"]
    elif place == "markt":
        data = config["pm"]["markt"]
    else:
        raise ValueError("Invalid place specified. Use 'us' or 'markt'.")
    
    data["from"] = start
    data["to"] = end 
    
    logging.info(f"starting browser with data: {data}")
    
    browser = p.firefox.launch(headless=False)
    context = browser.new_context()
    page = context.new_page()
    page.goto(data["url"] + "/pmwebms/index_de.php")
    page.locator("input[name=\"username\"]").click()
    page.locator("input[name=\"username\"]").fill(data["username"])
    page.locator("input[name=\"password\"]").click()
    page.locator("input[name=\"password\"]").fill(data["password"])
    page.get_by_role("button", name="Submit").click()
    page.goto(data["url"] + "/pmwebMS/web/web_main.php")
    page.get_by_role("button", name="Standort Auswertung").click()
    page.get_by_role("textbox", name="Von (Datum auswählen)").fill(data["from"])
    page.eval_on_selector('.JsDatePickBox', 'e => e.remove()')
    page.get_by_role("textbox", name="Bis (Datum auswählen)").fill(data["to"])
    page.eval_on_selector('.JsDatePickBox', 'e => e.remove()')
    page.get_by_role("radio", name="Bestandsverwaltung").check()
    page.get_by_role("button", name="Zahlungen anzeigen").click(force=True)

    # 5. Warte auf Ergebnisanzeige (z. B. ein Element, das nur im Ergebnis vorkommt)
    page.wait_for_selector("table.alle")
    page.wait_for_timeout(2000)  # Optional: Kurze Pause, um sicherzustellen, dass die Seite vollständig geladen ist

    # 6. HTML extrahieren
    html = page.content()
    
    if not html:
        logging.error("No HTML content found. Check if the page loaded correctly.")
        raise ValueError("No HTML content found. Check if the page loaded correctly.")
    logging.info("HTML content successfully extracted.")

    browser.close()
    return html


def extract_transactions(html: str) -> pd.DataFrame:
    """
    Parses the HTML content using BeautifulSoup and extracts transactions into a Pandas DataFrame.
    """
    soup = BeautifulSoup(html, "html.parser")
    rows = []

    logging.info("Extracting transactions from HTML content...")
    for tr in soup.select('table#trans tr')[1:]:
        tds = tr.find_all("td")
        if len(tds) == 5:
            nummer = tds[1].get_text(strip=True)
            datum = tds[2].get_text(strip=True)
            betrag = tds[3].get_text(strip=True).replace(".", "").replace(",", ".")
            art = tds[4].get_text(strip=True)
            rows.append({
                "Nr": nummer,
                "Datum": datum,
                "Betrag": float(betrag),
                "Zahlart": art
            })
            
    df = pd.DataFrame(rows)
    if df.empty:
        logging.error("No transactions found in the selected period. Exiting.")
        sys.exit("No transactions found in the selected period.")
    logging.info(f"Extracted {len(df)} transactions.")
    return df


def datev_pm(df: pd.DataFrame, place) -> pd.DataFrame:
    """
    Maps the extracted transactions to the DATEV format for the PerfectMoney account.
    Groups transactions and formats amounts with German comma decimal separators.
    """
    # Filter out rows where Zahlart is "Auszahlung in die Geldkassette"
    df = df[df["Zahlart"] != "Auszahlung in die Geldkassette"]
    
    columns = [
    "Währung", "VorzBetrag", "RechNr", "BelegDatum", "Belegtext",
    "UStSatz", "BU", "Gegenkonto", "Kost1", "Kost2", "Kostmenge",
    "Skonto", "Nachricht"
    ]
    
    df_exp = pd.DataFrame(columns = columns) 
    
    #caculated values
    df_exp["VorzBetrag"] = df.apply(
    lambda row: f"{'+' if row['Zahlart'] == 'Einzahlung' else '-'}{abs(row['Betrag']):.2f}".replace(".", ","),
    axis=1
    )
    df_exp["BelegDatum"] = pd.to_datetime(df["Datum"], dayfirst=True).dt.strftime("%d%m")
    df_exp["Belegtext"] = df["Zahlart"].astype(str).str.slice(0, 60) + f" ({place}) von/zu Sammelkasse"
    
    #default values
    df_exp["Währung"] = "EUR"
    df_exp["Nachricht"] = "Automatischer Import aus PM-WebMS"
    df_exp["RechNr"] = ""
    df_exp["Gegenkonto"] = "1095" 
    
    return df_exp


def datev_sk(df: pd.DataFrame, place) -> pd.DataFrame:
    """
    Maps the extracted transactions to the DATEV format for the Sammelkasse (Clearing) account.
    """
    
    df = df[df["Zahlart"] != "Auszahlung in die Geldkassette"]
    
    columns = [
    "Währung", "VorzBetrag", "RechNr", "BelegDatum", "Belegtext",
    "UStSatz", "BU", "Gegenkonto", "Kost1", "Kost2", "Kostmenge",
    "Skonto", "Nachricht"
    ]
    
    df_exp = pd.DataFrame(columns = columns) 
    
    #caculated values
    df_exp["VorzBetrag"] = df.apply(
    lambda row: f"{'-' if row['Zahlart'] == 'Einzahlung' else '+'}{abs(row['Betrag']):.2f}".replace(".", ","),
    axis=1
    )
    df_exp["BelegDatum"] = pd.to_datetime(df["Datum"], dayfirst=True).dt.strftime("%d%m")
    df_exp["Belegtext"] = df["Zahlart"].astype(str).str.slice(0, 60) + f" in/von PM-Kassenautomaten-{place}"
    
    #default values
    df_exp["Währung"] = "EUR"
    df_exp["Nachricht"] = "Automatischer Import aus PM-WebMS"
    df_exp["RechNr"] = ""
    df_exp["Gegenkonto"] = "1001" 
    
    return df_exp


def get_timespan(place: str):
    """
    Determines the time period for the export.
    Checks existing exports to resume from the last date, or prompts for a start date.
    """
    # Find latest export file for this place
    os.makedirs(export_dir, exist_ok=True)
    pattern = os.path.join(export_dir, f"{export_filename_pm}_{place}_*.csv")
    files = sorted(glob.glob(pattern), reverse=True)
    
    # Initialize start and end dates
    last_end = None
    start_dt = None
    
    if files:
        # Extract end date from filename: datev_pm_{place}_{start}_{end}.csv
        m = re.match(rf".*{export_filename_pm}_{place}_(\d{{4}}-\d{{2}}-\d{{2}})_(\d{{4}}-\d{{2}}-\d{{2}})\.csv", files[0])
        if m:
            last_end = m.group(2)
    if last_end:
        start_dt = datetime.strptime(last_end, "%Y-%m-%d") + pd.Timedelta(days=1)
    
    end_dt = datetime.now() - pd.Timedelta(days=1)
    
    if not start_dt:
        start_dt = input("Enter start date (YYYY-MM-DD): ").strip()
        try:
            start_dt = datetime.strptime(start_dt, "%Y-%m-%d")
        except ValueError:
            logging.error("Invalid start date format. Please use YYYY-MM-DD.")
            print("Invalid start date format. Please use YYYY-MM-DD.")
            sys.exit(1)
        
    # Ensure start is not after end
    if start_dt > end_dt:
        logging.info("No new days to export. Exiting.")
        print("No new days to export.")
        sys.exit(0)
    
    start = start_dt.strftime("%Y-%m-%d")
    end = end_dt.strftime("%Y-%m-%d")   
    return start, end
    

if __name__ == "__main__":
    try:
        main()
        logging.info(f"Program finished successfully at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("Export completed successfully.")
    except Exception as e:
        logging.exception(f"Fatal error: {e}")
        print(f"Fatal error: {e}")
    
