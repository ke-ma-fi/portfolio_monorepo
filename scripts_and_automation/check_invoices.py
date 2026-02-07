import os
import re
import sys
from pathlib import Path

def find_missing_invoices(directory_paths, invoice_prefixes, num_digits, filter_prefix=None):
    # List to store all found invoice numbers
    all_invoice_numbers = set()
    
    # List to store prefix to number mappings
    prefix_to_number = {}
    
    # Process each directory path
    dir_paths = [p.strip() for p in directory_paths.split(',')]
    valid_dirs = []
    
    for dir_path_str in dir_paths:
        dir_path = Path(dir_path_str)
        if not dir_path.is_dir():
            print(f"Warning: Directory '{dir_path_str}' not found, skipping.")
            continue
        valid_dirs.append(dir_path_str)
        
        # Process each prefix within the current directory
        prefixes_list = [p.strip() for p in invoice_prefixes.split(',')]
        
        for invoice_prefix in prefixes_list:
            # Create regex pattern for this prefix
            pattern = fr'{re.escape(invoice_prefix)}(\d{{{num_digits}}})'
            
            # Scan all files in the directory
            for file_path in dir_path.glob('**/*'):
                if file_path.is_file():
                    match = re.search(pattern, file_path.name)
                    if match:
                        # Extract invoice number
                        invoice_number = int(match.group(1))
                        
                        # Filter only invoices starting with the specified prefix
                        if filter_prefix is None or str(invoice_number).startswith(filter_prefix):
                            # Add to the combined set
                            all_invoice_numbers.add(invoice_number)
                            
                            # Store which prefix was used for this number
                            if invoice_number not in prefix_to_number:
                                prefix_to_number[invoice_number] = []
                            prefix_to_number[invoice_number].append(invoice_prefix)
    
    if not valid_dirs:
        print("Error: No valid directories found to process.")
        sys.exit(1)
        
    if not all_invoice_numbers:
        print(f"No invoice numbers{' starting with '+filter_prefix if filter_prefix else ''} found in the specified directories.")
        return
    
    # Sort all invoice numbers
    all_invoice_numbers = sorted(all_invoice_numbers)
    
    # Find missing numbers across all prefixes
    missing_numbers = []
    for i in range(min(all_invoice_numbers), max(all_invoice_numbers) + 1):
        if i not in all_invoice_numbers and (filter_prefix is None or str(i).startswith(filter_prefix)):
            missing_numbers.append(i)
    
    # Report results
    print(f"Combined analysis across all directories: {', '.join(valid_dirs)}")
    print(f"Combined analysis across all prefixes: {', '.join(prefixes_list)}")
    print(f"Found {len(all_invoice_numbers)} invoices from {min(all_invoice_numbers):0{num_digits}d} to {max(all_invoice_numbers):0{num_digits}d}")
    if filter_prefix:
        print(f"Filtered to show only invoices starting with '{filter_prefix}'")
    
    # Print found invoice numbers with their prefixes (optional)
    if len(prefix_to_number) > 0:
        print("\nFound invoice numbers with their prefixes:")
        for number in sorted(prefix_to_number.keys()):
            prefixes = ', '.join(prefix_to_number[number])
            print(f"Invoice {number:0{num_digits}d} - Prefix(es): {prefixes}")
    
    if missing_numbers:
        print(f"\nMissing invoice numbers ({len(missing_numbers)} total):")
        for num in missing_numbers:
            print(f"{num:0{num_digits}d}")
    else:
        print("\nNo missing invoice numbers found!")

if __name__ == "__main__":
    # Prompt user for input
    print("=== Missing Invoice Number Checker ===")
    
    # Get directory paths (now supports multiple paths separated by commas)
    default_path = r'Z:\paperless-media\documents\originals\datev\Ausgangsrechnung'
    path_input = input(f"Enter directory path(s) (separate multiple with commas) [default: {default_path}]: ")
    paths = path_input if path_input.strip() else default_path
    
    # Get invoice prefix (supports multiple prefixes separated by commas)
    default_prefix = "MFR_"
    prefix_input = input(f"Enter invoice prefix(es) (separate multiple with commas) [default: {default_prefix}]: ")
    invoice_prefixes = prefix_input if prefix_input.strip() else default_prefix
    
    # Get number of digits
    default_digits = 5
    digits_input = input(f"Enter number of digits in invoice number [default: {default_digits}]: ")
    num_digits = int(digits_input) if digits_input.strip() and digits_input.isdigit() else default_digits
    
    # Get starting digits filter
    filter_input = input("Enter starting digits to filter by (leave empty for all): ")
    filter_prefix = filter_input if filter_input.strip() else None
    
    print("\nChecking for missing invoice numbers...\n")
    find_missing_invoices(paths, invoice_prefixes, num_digits, filter_prefix)
