# SDT ANALYZER

<img width="1709" height="989" alt="SDT-ANALSIS TOOL" src="https://github.com/user-attachments/assets/0b89d8c6-e55f-4c11-966a-673469b93542" />


A simple web tool to learn **Syntax Directed Translation (SDT)**, especially **S-attributed SDT**.

You can type an arithmetic expression (like `3+4*5`) and it will:
- Show a context-free grammar (CFG) for the expression
- Draw a simple parse tree
- List semantic rules
- Evaluate the expression step-by-step

This is made for students learning compiler design and parsing.

---

## How to Use

### Online
Open the live version here: [https://sdt-analyzer.vercel.app](https://sdt-analyzer.vercel.app)  
Type an expression and see the output instantly.

### Local
1. Clone this repo:
   ```bash
   git clone https://github.com/kimicloud/CD-SDT.git
   cd CD-SDT
2. Open `index.html` in your browser.
3. Enter any arithmetic expression.

---

## Files

- `index.html` – main page
- `script.js` – logic for parsing, CFG, parse tree, and evaluation
- `styles.css` – styles for the page

---

## Features

- Works in any browser (no server needed)
- Supports `+ - * / ** ^ ()`
- Generates a valid CFG for your expression
- Displays a simple parse tree
- Lists semantic rules used for evaluation
- Shows the final result of the expression
