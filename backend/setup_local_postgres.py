import os
import sys
import zipfile
import subprocess
import httpx
import time

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ZIP_PATH = os.path.join(BASE_DIR, "pgsql_dist.zip")
PGSQL_DIR = os.path.join(BASE_DIR, "pgsql")
DATA_DIR = os.path.join(PGSQL_DIR, "data")
BIN_DIR = os.path.join(PGSQL_DIR, "pgsql", "bin")
if not os.path.exists(BIN_DIR):
    BIN_DIR = os.path.join(PGSQL_DIR, "bin")

DOWNLOAD_URL = "https://sbp.enterprisedb.com/getfile.jsp?fileid=1260623"

def download_file(url, target_path):
    print(f"Downloading PostgreSQL binaries to {target_path}...")
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    with httpx.Client(follow_redirects=True, headers=headers, timeout=60.0) as client:
        with client.stream("GET", url) as response:
            response.raise_for_status()
            total = int(response.headers.get("content-length", 0))
            downloaded = 0
            t0 = time.time()
            with open(target_path, "wb") as f:
                for chunk in response.iter_bytes(chunk_size=1024 * 512):
                    f.write(chunk)
                    downloaded += len(chunk)
                    if total > 0 and time.time() - t0 > 2:
                        percent = (downloaded / total) * 100
                        print(f"Downloaded {downloaded // (1024*1024)}MB / {total // (1024*1024)}MB ({percent:.1f}%)")
                        t0 = time.time()
    print("Download completed successfully.")

def setup_postgres():
    os.makedirs(PGSQL_DIR, exist_ok=True)
    
    # 1. Download if zip doesn't exist
    if not os.path.exists(ZIP_PATH) and not os.path.exists(os.path.join(PGSQL_DIR, "bin", "pg_ctl.exe")):
        download_file(DOWNLOAD_URL, ZIP_PATH)

    # 2. Extract if bin doesn't exist
    bin_dir = os.path.join(PGSQL_DIR, "bin")
    if not os.path.exists(bin_dir) and not os.path.exists(os.path.join(PGSQL_DIR, "pgsql", "bin")):
        print("Extracting PostgreSQL binaries...")
        with zipfile.ZipFile(ZIP_PATH, 'r') as zip_ref:
            zip_ref.extractall(PGSQL_DIR)
        print("Extraction completed.")

    # Detect bin dir
    actual_bin = os.path.join(PGSQL_DIR, "pgsql", "bin")
    if not os.path.exists(actual_bin):
        actual_bin = os.path.join(PGSQL_DIR, "bin")

    initdb_exe = os.path.join(actual_bin, "initdb.exe")
    pg_ctl_exe = os.path.join(actual_bin, "pg_ctl.exe")
    createdb_exe = os.path.join(actual_bin, "createdb.exe")
    psql_exe = os.path.join(actual_bin, "psql.exe")

    data_dir = os.path.join(PGSQL_DIR, "data")
    log_file = os.path.join(PGSQL_DIR, "postgres.log")

    # 3. Initialize cluster if data dir doesn't exist
    if not os.path.exists(data_dir):
        print(f"Initializing PostgreSQL database in {data_dir}...")
        cmd = [initdb_exe, "-D", data_dir, "-U", "postgres", "-A", "trust", "--encoding=UTF8", "--locale=C"]
        subprocess.run(cmd, check=True)
        print("initdb finished.")

    # 4. Start postgres
    print("Starting PostgreSQL server...")
    subprocess.run([pg_ctl_exe, "-D", data_dir, "-l", log_file, "start"])
    time.sleep(2)

    # 5. Create database 'shankar' if not exists
    print("Creating database 'shankar'...")
    subprocess.run([createdb_exe, "-U", "postgres", "-h", "localhost", "-p", "5432", "shankar"], capture_output=True)

    # 6. Set password for postgres user to 'shankar'
    alter_cmd = f"ALTER USER postgres WITH PASSWORD 'shankar';"
    subprocess.run([psql_exe, "-U", "postgres", "-h", "localhost", "-p", "5432", "-c", alter_cmd], capture_output=True)

    print("PostgreSQL is setup, running, and configured with user 'postgres' and database 'shankar'!")

if __name__ == "__main__":
    setup_postgres()

