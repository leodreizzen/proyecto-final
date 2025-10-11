import pdfplumber
import sys
sys.stdout.reconfigure(encoding='utf-8')

def clean_cell_text(cell):
    if cell is None:
        return ""

    text = str(cell).strip()
    text = text.replace('\n', '<br>')
    text = text.replace('|', '\\|')

    return text


def table_to_markdown(table):
    if not table or len(table) == 0:
        return ""

    md = ""

    # Header
    md += "| " + " | ".join(clean_cell_text(cell) for cell in table[0]) + " |\n"
    md += "| " + " | ".join("---" for _ in table[0]) + " |\n"

    # Rows
    for row in table[1:]:
        md += "| " + " | ".join(clean_cell_text(cell) for cell in row) + " |\n"

    return md + "\n"


def pdf_to_markdown(pdf_path: str, output_path: str = None):
    markdown_content = ""

    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages, 1):
            tables_data = page.find_tables()
            tables = page.extract_tables()

            elements = []

            for i, (table_obj, table_data) in enumerate(zip(tables_data, tables)):
                elements.append({
                    'type': 'table',
                    'y': table_obj.bbox[1],  # top position
                    'content': table_data
                })

            words = page.extract_words()

            # Group words into lines
            lines = {}
            for word in words:
                # Check if the word is inside a table
                in_table = False
                for table_obj in tables_data:
                    bbox = table_obj.bbox
                    if (bbox[0] <= word['x0'] <= bbox[2] and
                        bbox[1] <= word['top'] <= bbox[3]):
                        in_table = True
                        break

                if not in_table:
                    y = round(word['top'], 1)
                    if y not in lines:
                        lines[y] = []
                    lines[y].append(word)

            # Convert lines into text
            for y, words_in_line in lines.items():
                words_in_line.sort(key=lambda w: w['x0'])
                text = ' '.join(w['text'] for w in words_in_line)
                elements.append({
                    'type': 'text',
                    'y': y,
                    'content': text
                })

            elements.sort(key=lambda e: e['y'])

            # Group consecutive text
            current_text = []
            for element in elements:
                if element['type'] == 'text':
                    current_text.append(element['content'])
                else:
                    # Add accummulated text
                    if current_text:
                        markdown_content += '  \n'.join(current_text) + "  \n"
                        current_text = []
                    # Add table
                    markdown_content += table_to_markdown(element['content'])

            # Add final text
            if current_text:
                markdown_content += '  \n'.join(current_text) + "  \n"

            # Page separator
            if page_num < len(pdf.pages):
                markdown_content += "  \n---  \n"

    if output_path:
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(markdown_content)

    return markdown_content


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(f"Use: python {sys.argv[0]} <file.pdf> [output.md]")
        sys.exit(1)

    pdf_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else None

    markdown = pdf_to_markdown(pdf_path, output_path)
    if not output_path:
        print(markdown)