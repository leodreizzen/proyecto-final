import os
import subprocess
import sys

VENV_DIR = ".venv"
REQ_FILE = "requirements.txt"

def run(cmd):
    try:
        subprocess.run(cmd, shell=False, check=True)
    except subprocess.CalledProcessError as e:
        print(f"Error executing command: {e}")
        sys.exit(e.returncode)

def main():
    if not os.path.exists(REQ_FILE):
        print(f"Error: {REQ_FILE} not found.")
        sys.exit(1)

    if not os.path.exists(VENV_DIR) or not os.listdir(VENV_DIR):
        print(f"Creating virtualenv in {VENV_DIR}...")
        run([sys.executable, "-m", "venv", VENV_DIR])
    else:
        print(f"Virtualenv already exists in {VENV_DIR}.")
    if os.name == "nt":
        pip_path = os.path.join(VENV_DIR, "Scripts", "pip.exe")
    else:
        pip_path = os.path.join(VENV_DIR, "bin", "pip")

    print(f"Installing dependencies from {REQ_FILE}...")
    run([pip_path, "install", "-r", REQ_FILE])

if __name__ == "__main__":
    main()