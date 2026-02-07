"""
PiSignage Content Uploader.
This script automates the process of:
1. Converting Excel menu/sales data to JSON.
2. Zipping HTML/CSS/JS assets for various display types (lunch, sales, etc.).
3. Authenticating with the PiSignage API.
4. Uploading assets and updating group schedules on the signage server.
"""
# Import the required modules
import requests
import os
import json
from helpers import get_latest_file, compress_files, xlsx_to_json, get_all_files, move_to

server_url = os.getenv("SERVER_URL")
cwd = os.getcwd()

# ---- convert to json
# Define the file name and the server url
file_path= get_latest_file(cwd)
print(file_path)

#read json
json_lunch = xlsx_to_json(file_path, 'JSON_MENU')
json_sales = xlsx_to_json(file_path, 'JSON_SALES')

# Save the json string to a file
with open("lunch_daily/Menuplan.json", "w") as f:
    f.write(json_lunch)

with open("lunch_weekly/Menuplan.json", "w") as f:
    f.write(json_lunch)

with open("sales_all/Sales.json", "w") as f:
    f.write(json_sales)

with open("sales_hsm/Sales.json", "w") as f:
    f.write(json_sales)

with open("sales_bbq/Sales.json", "w") as f:
    f.write(json_sales)

with open("breakfast/Sales.json", "w") as f:
    f.write(json_sales)
# ----
    

# ---- Zip required files ---- lunch_daily
zip_file_names = [] 
zip_file_names.append(compress_files('lunch_daily', ['Menuplan.json', 'display.html', 'scripts.js', 'styles.css', 'Mittagstisch1.png', 'Mittagstisch2.png'], 'lunch_daily.zip'))
zip_file_names.append(compress_files('lunch_weekly', ['Menuplan.json', 'display.html', 'scripts.js', 'styles.css', 'lunch_weekly.png'], 'lunch_weekly.zip'))
zip_file_names.append(compress_files('sales_all', ['Sales.json', 'display.html', 'scripts.js', 'styles.css', 'sales_all.png'], 'sales_all.zip'))
zip_file_names.append(compress_files('sales_hsm', ['Sales.json', 'display.html', 'scripts.js', 'styles.css', 'sales_hsm.png'], 'sales_hsm.zip'))
zip_file_names.append(compress_files('sales_bbq', ['Sales.json', 'display.html', 'scripts.js', 'styles.css', 'sales_bbq.png'], 'sales_bbq.zip'))
zip_file_names.append(compress_files('breakfast', ['Sales.json', 'display.html', 'scripts.js', 'styles.css', 'breakfast.png'], 'breakfast.zip'))


# Get the authentication token from the server
payload = {"email": os.getenv("PISIGNAGE_EMAIL"), "password": os.getenv("PISIGNAGE_PASSWORD"), "getToken": True}
response = requests.post(server_url + "/session", json=payload)
token = response.json()["token"]

for zip_file in zip_file_names:
    # Upload the json file to the server
    files = {"file": open(zip_file, "rb")}
    response = requests.post(server_url + "/files", files=files, params={"token": token})
    print(response.json())

    # Call the postupload api to store the file details
    payload = {"files": response.json()['data'], "categories": ["html"]}
    response = requests.post(server_url + "/postupload", json=payload, params={"token": token})
    print(response.json())

# get all files from upload_static folder, upload and move them into archive
allFiles = get_all_files(f'{cwd}/upload_static')
if not allFiles == None:
    for file in allFiles:
        # Upload the json file to the server
        files = {"file": open(file, "rb")}
        response = requests.post(server_url + "/files", files=files, params={"token": token})
        print(response.json())

        # Call the postupload api to store the file details
        payload = {"files": response.json()['data'], "categories": ["static"]}
        response = requests.post(server_url + "/postupload", json=payload, params={"token": token})
        print(response.json())
        move_to(file, f'{cwd}/archive')


# Set sales playlist with timeperiod of sales as schedule
json_sales_data = json.loads(json_sales)
payload = {'deploy': 'true', 'playlistToSchedule': 'sales', 'playlists': [{'name': 'default'}, 
                                                                          {'name': 'sales', 'settings': {'durationEnable': 'true', "startdate": f"{json_sales_data[0]['Start']}T00:00:00.000Z", "enddate": f"{json_sales_data[0]['Ende']}T00:00:00.000Z"}},
                                                                          {'name': 'default', 'settings': {'durationEnable': 'false'}},
                                                                          {'name': 'lunch', 'settings': {'durationEnable': 'false', 'timeEnable': 'true', 'starttime': '11:00', 'endtime': '13:30'}}]}
response = requests.post(server_url + f"/groups/{os.getenv('PISIGNAGE_GROUP_ID')}", json=payload, params={"token": token})
print(response.json())

