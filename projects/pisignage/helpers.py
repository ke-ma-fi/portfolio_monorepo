"""
PiSignage Utility Helpers.
Provides file system operations (searching, zipping, moving) and
data conversion (Excel to JSON) for the PiSignage uploader.
"""
import glob
import os
import zipfile
import pandas as pd

def get_latest_file(folder_path):
    """
    Returns the most recently created .xlsx file in the specified folder.
    """
    try:
        # Get a list of all files in the folder
        files = glob.glob(os.path.join(folder_path, '*'))
        if not files:
            return "No files found in the specified folder."

        # Sort files by creation time (most recent first)
        sorted_files = sorted(files, key=os.path.getctime, reverse=True)

        xlsx_files = []

        for file in sorted_files:
            if file.endswith('.xlsx'):
                xlsx_files.append(file)

        # Return the path to the latest file
        return xlsx_files[0]
    except Exception as e:
        return f"Error: {str(e)}"


def get_all_files(folder_path):
    """
    Returns a list of all files in the specified folder.
    """
    try:
        # Get a list of all files in the folder
        files = glob.glob(os.path.join(folder_path, '*'))

        if not files:
            return None

        return files
    except Exception as e:
        print(f"Error: {str(e)}")
        return None


def move_to(path_old, path_new):
    """
    Moves a file from path_old to path_new.
    """
    filename = os.path.basename(path_old)
    os.rename(path_old, path_new + '/' + filename)
    

def compress_files(path, input_files, output_name):
    """
    Zips a list of files into a single archive for PiSignage upload.
    """
    # name of the new Zip file
    zip_file_name = f"{path}/{output_name}"

    # names of the source files
    file_names = []
    for file in input_files:
        file_names.append(f"{path}/{file}")

    # Create a ZipFile Object
    zip_object = zipfile.ZipFile(zip_file_name, 'w')

    # Add multiple files to the zip file
    for file_name in file_names:
        zip_object.write(file_name, compress_type=zipfile.ZIP_DEFLATED)

    # Close the Zip File
    zip_object.close()
    print(f"compressing of {zip_file_name} successful.")
    return zip_file_name
    # ---- 

def xlsx_to_json(path, sheet):
    """
    Reads a specific sheet from an Excel file and returns its content as a JSON string.
    """
    # Read the Excel file into a pandas dataframe
    df = pd.read_excel(path, sheet_name=sheet)

    # Convert the dataframe to a json string
    json_data = df.to_json(orient="records")

    return json_data