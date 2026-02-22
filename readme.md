# 👋 Hi, I'm Kevin Fischer!

Welcome to my portfolio monorepo.

This repository serves as a central hub for my coding journey, containing everything from full-stack web applications and Python automation scripts to the foundational coursework that started it all.

This README is designed to help you navigate my code and understand the projects I've built.

## 📂 Repository Structure

The code is organized into three main categories:

- **project/**: Real-world applications and larger systems.
- **scripts_and_automation/**: Practical Python scripts used to solve specific business problems.
- **courses/**: Academic exercises from structured courses like Harvard's CS50.
- **learning/**: **100% Self-Coded Challenges**. Small projects written entirely without AI assistance to demonstrate raw problem-solving skills.

---

## 🚀 Key Projects

### 1. Gutscheineland (TypeScript / Next.js / Payload CMS)

📍 _Location: [`projects/gutscheineland`](projects/gutscheineland)_

A modern voucher/gift card store built with Next.js and Payload CMS that prioritizes user experience by eliminating account creation.

- **Architectural Highlights**:
  - **Guest-Only "No-Login" System**: Designed a "Dual-Token" architecture where access is proven via possession (UUID) rather than passwords. This splits the "Manager Token" (buyer) from the "Spender Token" (recipient), allowing secure card forwarding without user accounts. See [`projects/gutscheineland/PROJECT_DOCS.md`](projects/gutscheineland/PROJECT_DOCS.md).
  - **Service Layer Pattern**: Implemented a strict service layer to prevent "Business Logic Leakage" into UI components or isolated webhooks. All critical operations (e.g., fulfilling orders) flow through centralized, stateless services. See [`src/services/orders.ts`](projects/gutscheineland/src/services/orders.ts).
  - **Headless CMS Integration**: Built on top of **Payload CMS** (acting as an application framework) with complex hooks for order fulfillment and Stripe payment processing.

### 2. PiSignage Automation (Python)

📍 _Location: [`projects/pisignage`](projects/pisignage)_

An automated pipeline to update digital signage displays. It processes Excel files (menus, sales data), converts them to JSON, packages web assets, and uploads them to a remote server.

- **Highlights**:
  - **Automation**: Connects disjointed systems (Excel files -> Web Displays).
  - **File Handling**: processing and compressing assets. See [`upload_to_signage.py`](projects/pisignage/upload_to_signage.py).

---

## 🛠️ Scripts & Automation

I strongly believe in using code to eliminate repetitive tasks. This folder contains tools I wrote to automate real-world administrative workflows.

📍 _Location: [`scripts_and_automation/`](scripts_and_automation/)_

- **Financial Data Processing (`kasse/`)**:
  - **[`cws.py`](scripts_and_automation/kasse/cws.py)**: Parses PDF cash reports using `pdfplumber` to extract revenue data for accounting.
  - **[`bar_re.py`](scripts_and_automation/kasse/bar_re.py)**: Processes CSV exports of invoices, mapping them to DATEV-compatible formats for tax consultants.
- **Barcode Generator**:
  - **[`barcode_generator/`](scripts_and_automation/barcode_generator/)**: Generates A4 sheets of ASN barcodes for document archiving systems like Paperless-ngx.

---

## 🧠 Independent Problem Solving (Strict "No AI")

To keep a healthy coding habbit, the projects in the `learning/` directory are written **100% by hand**, without the use of any AI assistants or Copilot.

📍 _Location: [`learning/`](learning/)_

- **TypeScript Challenges**: Algorithms and game logic implemented from scratch (e.g., `game-shop`, `word-chain`).

---

## 📚 Academic Coursework

This section contains solutions and projects from my computer science studies, primarily **Harvard's CS50**.

📍 _Location: [`courses/`](courses/)_

- **CS50x (Intro to CS)**: C, Python, SQL, Algorithms (Binary Search, Sorting), and Data Structures.
  - _Examples: [`speller`](courses/CS50X/speller_c), [`tideman`](courses/CS50X/tideman/tideman.c), [`dna`](courses/CS50X/dna/dna.py)._
- **CS50w (Web Programming)**: Django, Python, JavaScript.
  - _Examples: Commerce, Wiki, Mail._

---

## 📫 Contact

Feel free to explore the code! If you have any questions about implementation details or my tech stack, please reach out because I'd love to chat.
