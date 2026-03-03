import sys
import subprocess

def install(package):
    subprocess.check_call([sys.executable, "-m", "pip", "install", package])

try:
    import pypdf
except ImportError:
    install('pypdf')
    import pypdf

for file in ['Netzgrafik VBL 2025 HVZ2.pdf', 'Netzgrafik VBL 2025 NVZ So.pdf']:
    print(f'\n--- Extracting stops from {file} ---')
    try:
        reader = pypdf.PdfReader(file)
        text = ''
        for page in reader.pages:
            text += page.extract_text() + '\n'
        
        # very basic cleanup, just print the lines
        lines = [line.strip() for line in text.split('\n') if len(line.strip()) > 1]
        print('\n'.join(lines))
    except Exception as e:
        print('Error:', e)
