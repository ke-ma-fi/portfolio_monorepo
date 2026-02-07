"""
Barcode Generator for ASN (Advanced Shipping Notice) Labels.
This script generates a PDF with Code128 barcodes for a range of numbers,
formatted for A4 sticker sheets.
"""
import math
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.graphics.barcode import code128
from reportlab.lib import colors

def get_user_input():
    """
    Prompts the user for starting/ending numbers and grid layout (columns/rows).
    Returns configuration for the PDF generation.
    """
    while True:
        try:
            start = int(input("Starting Number: "))
            end = int(input("Ending Number: "))
            if start > end:
                print("Starting number must be smaller than ending number. Please try again!")
                continue
            cols = int(input("Number of columns on A4 Paper: "))
            rows = int(input("Number of rows on A4 Paper: "))
            if cols <= 0 or rows <= 0:
                print("Number of columns and rows must be greater than 0. Please try again!")
                continue
            output_filename=f"ASNLabels_{start}to{end}_{cols}x{rows}_barcodes.pdf"
            return start, end, cols, rows, output_filename
        except ValueError:
            print("Please enter valid integers.")

def calculate_sheets(total_labels, labels_per_sheet):
    """
    Calculates the number of A4 sheets required based on label count and grid layout.
    """
    return math.ceil(total_labels / labels_per_sheet)

def create_labels_pdf(start, end, cols, rows, output_filename):
    """
    Generates a PDF file with barcodes based on the specified range and layout.
    Centering and scaling are handled automatically to fit the label cells.
    """
    # Page and label dimensions
    page_width, page_height = A4
    labels_per_sheet = cols * rows
    label_width = page_width / cols
    label_height = page_height / rows

    total_labels = end - start + 1
    total_sheets = calculate_sheets(total_labels, labels_per_sheet)
    print(f"Sheets of labels needed: {total_sheets}")

    c = canvas.Canvas(output_filename, pagesize=A4)

    for i in range(start, end + 1):
        label_index = i - start
        position_in_sheet = label_index % labels_per_sheet
        col = position_in_sheet % cols
        row = position_in_sheet // cols

        # Position (from top-left)
        x = col * label_width
        y = page_height - (row + 1) * label_height

        # Inner label frame (3mm margin)
        inner_margin = 3 * mm
        inner_x = x + inner_margin
        inner_y = y + inner_margin
        inner_width = label_width - 2 * inner_margin
        inner_height = label_height - 2 * inner_margin

        # Barcode and text dimensions
        desired_barcode_width = inner_width
        desired_barcode_height = inner_height * 0.6  # 60% of inner height

        # Formatted number with leading zeros
        barcode_value = f"ASN{i:06d}"
        text = barcode_value

        # Create barcode with initial barWidth
        initial_barWidth = 0.5  # mm
        barcode = code128.Code128(barcode_value, barHeight=desired_barcode_height, barWidth=initial_barWidth)

        # Scale barcode to fit desired width
        scaling_factor = desired_barcode_width / barcode.width

        # Limit scaling to avoid oversized bars
        max_scaling = 5
        if scaling_factor > max_scaling:
            scaling_factor = max_scaling

        final_barWidth = initial_barWidth * scaling_factor
        barcode = code128.Code128(barcode_value, barHeight=desired_barcode_height, barWidth=final_barWidth)

        # Centering logic
        barcode_width = barcode.width
        barcode_x = inner_x + (inner_width - barcode_width) / 2
        barcode_y = inner_y + (inner_height - desired_barcode_height)

        try:
            barcode.drawOn(c, barcode_x, barcode_y)
        except Exception as e:
            print(f"Issue rendering barcode {barcode_value}: {e}")

        # Text positioning
        c.setFont("Helvetica", 10)
        text_width = c.stringWidth(text, "Helvetica", 10)
        text_x = inner_x + (inner_width - text_width) / 2
        text_y = inner_y + 3 * mm

        c.setFillColor(colors.black)
        c.drawString(text_x, text_y, text)

        # Label border (for alignment during cutting/printing)
        c.setStrokeColor(colors.lightgrey)
        c.rect(inner_x, inner_y, inner_width, inner_height, stroke=1, fill=0)

        if (i - start + 1) % labels_per_sheet == 0 and (i - start + 1) != total_labels:
            c.showPage()

    c.save()
    print(f"PDF '{output_filename}' was generated successfully!")

def main():
    start, end, cols, rows, output_filename = get_user_input()
    create_labels_pdf(start, end, cols, rows, output_filename)

if __name__ == "__main__":
    main()
