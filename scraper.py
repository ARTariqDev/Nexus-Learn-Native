import os
import re
import json
import pickle
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
import shutil
from urllib.parse import urlparse, urljoin, unquote

# Load env vars
load_dotenv()


# Choose source: "pastpapers" or "papacambridge"
SOURCE = "papacambridge"  # or "pastpapers"

# For pastpapers.co aka the GOAT
PASTPAPERS_BASE_URL = "https://pastpapers.co"
pastpapers_subject_path = "IGCSE/Computer-Science-0478/2024-March"

# For bum ass PapaCambridge....I hate it never works ....but I have to keep it as a backup in case pastpapers.co doesnt work ,-_-,
PAPACAMBRIDGE_BASE_URL = "https://pastpapers.papacambridge.com"

papacambridge_subject_path = "papers/caie/o-level-islamiyat-2058-2018-may-june"

session_name = "June 2018"
drive_parent_folder_id = "1VqzI__D7sAWVKfNjW2Zmo27vqGPp5MDt"
DOWNLOAD_DIR = "downloads"
SCOPES = ['https://www.googleapis.com/auth/drive.file']


def get_drive_service():
    creds = None
    if os.path.exists('token.pickle'):
        with open('token.pickle', 'rb') as token:
            creds = pickle.load(token)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_config({
                "installed": {
                    "client_id": os.getenv("GOOGLE_CLIENT_ID"),
                    "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                    "redirect_uris": [os.getenv("GOOGLE_REDIRECT_URI")]
                }
            }, SCOPES)
            creds = flow.run_local_server(port=0)
        with open('token.pickle', 'wb') as token:
            pickle.dump(creds, token)
    service = build('drive', 'v3', credentials=creds, cache_discovery=False)
    service._http.timeout = 300  # Set longer timeout for large file uploads, not repeating that time my entire upload failed because of timeout
    return service

def scrape_pastpapers_co():
    """Scrape papers from pastpapers.co"""
    full_url = f"{PASTPAPERS_BASE_URL}/cie/?dir={pastpapers_subject_path}"
    print(f"🔍 Scraping pastpapers.co: {full_url}")
    res = requests.get(full_url)
    soup = BeautifulSoup(res.text, 'html.parser')

    links = soup.select("a")
    paper_dict = {}

    for link in links:
        href = link.get("href")
        if not href:
            continue

        if "view.php" in href:
            continue

        if not (href.endswith(".pdf") or href.endswith(".zip")):
            continue

        if href.startswith("/"):
            full_link = f"{PASTPAPERS_BASE_URL}{href}"
        elif href.startswith("http"):
            full_link = href
        else:
            full_link = f"{PASTPAPERS_BASE_URL}/cie/{href}"

        filename = os.path.basename(href)
        print(f"📄 Processing: {filename}")

        qp_match = re.search(r"qp[_-](\d{1,2})\.pdf", filename, re.IGNORECASE)
        ms_match = re.search(r"ms[_-](\d{1,2})\.pdf", filename, re.IGNORECASE)
        sf_match = re.search(r"sf[_-](\d{1,2})\.(zip|pdf)", filename, re.IGNORECASE)

        if qp_match:
            variant = qp_match.group(1).zfill(2)
            paper_dict.setdefault(variant, {})["qp"] = full_link
            print(f"  ✅ Found QP for variant {variant}")
        elif ms_match:
            variant = ms_match.group(1).zfill(2)
            paper_dict.setdefault(variant, {})["ms"] = full_link
            print(f"  ✅ Found MS for variant {variant}")
        elif sf_match:
            variant = sf_match.group(1).zfill(2)
            paper_dict.setdefault(variant, {})["sf"] = full_link
            print(f"  ✅ Found SF for variant {variant}")

    return paper_dict

def scrape_papacambridge():
    """Scrape papers from PapaCambridge papers page"""
    full_url = f"{PAPACAMBRIDGE_BASE_URL}/{papacambridge_subject_path}"
    print(f"🔍 Scraping PapaCambridge papers page: {full_url}")
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    res = requests.get(full_url, headers=headers)
    soup = BeautifulSoup(res.text, 'html.parser')


    links = soup.select("a[href*='download_file.php']")
    paper_dict = {}

    print(f"📊 Found {len(links)} download links on the page")

    for link in links:
        href = link.get("href")
        if not href:
            continue


        if "files=" in href:
            files_param = href.split("files=")[-1]
            actual_pdf_url = unquote(files_param)
            filename = os.path.basename(actual_pdf_url)
        else:
            continue

        print(f"📄 Processing: {filename}")


        if href.startswith("http"):
            full_link = href
        else:
            full_link = urljoin(PAPACAMBRIDGE_BASE_URL, href)


        qp_match = re.search(r"(\d{4})_[wsm]\d{2}_qp_(\d{1,2})\.pdf", filename, re.IGNORECASE)
        ms_match = re.search(r"(\d{4})_[wsm]\d{2}_ms_(\d{1,2})\.pdf", filename, re.IGNORECASE)
        sf_match = re.search(r"(\d{4})_[wsm]\d{2}_sf_(\d{1,2})\.(zip|pdf)", filename, re.IGNORECASE)

        if qp_match:
            variant = qp_match.group(2).zfill(2)
            paper_dict.setdefault(variant, {})["qp"] = full_link
            print(f"  ✅ Found QP for variant {variant}")
        elif ms_match:
            variant = ms_match.group(2).zfill(2)
            paper_dict.setdefault(variant, {})["ms"] = full_link
            print(f"  ✅ Found MS for variant {variant}")
        elif sf_match:
            variant = sf_match.group(2).zfill(2)
            paper_dict.setdefault(variant, {})["sf"] = full_link
            print(f"  ✅ Found SF for variant {variant}")
        else:

            if not any(x in filename.lower() for x in ['_gt.', '_er_', '_ci_']):
                print(f"  ⚠️ Unrecognized file pattern: {filename}")

    return paper_dict

def download_files():
    """Download files based on selected source"""
    if SOURCE == "papacambridge":
        paper_dict = scrape_papacambridge()
    else:
        paper_dict = scrape_pastpapers_co()

    print(f"\n📊 Found papers for variants: {list(paper_dict.keys())}")

    os.makedirs(DOWNLOAD_DIR, exist_ok=True)

    for variant, files in paper_dict.items():
        folder = os.path.join(DOWNLOAD_DIR, f"Paper{variant}")
        os.makedirs(folder, exist_ok=True)

        for type_ in ['qp', 'ms']:
            if type_ in files:
                url = files[type_]
                path = os.path.join(folder, f"{type_}{variant}.pdf")
                try:
                    print(f"⬇️ Downloading: {url}")
                    headers = {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                    response = requests.get(url, headers=headers)
                    response.raise_for_status()
                    with open(path, 'wb') as f:
                        f.write(response.content)
                    print(f"  ✅ Downloaded {type_.upper()} for variant {variant}")
                except Exception as e:
                    print(f"❌ Error downloading {url}: {e}")

        if 'sf' in files:
            url = files['sf']
            extension = '.zip' if url.lower().endswith('.zip') else '.pdf'
            path = os.path.join(folder, f"sf{variant}{extension}")
            try:
                print(f"⬇️ Downloading SF: {url}")
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
                response = requests.get(url, headers=headers)
                response.raise_for_status()
                with open(path, 'wb') as f:
                    f.write(response.content)
                print(f"  ✅ Downloaded SF for variant {variant}")
            except Exception as e:
                print(f"❌ Error downloading SF {url}: {e}")

    return paper_dict

def upload_file(service, file_path, drive_folder_id, mime_type=None):
    if mime_type is None:
        if file_path.endswith('.pdf'):
            mime_type = 'application/pdf'
        elif file_path.endswith('.zip'):
            mime_type = 'application/zip'
        else:
            mime_type = 'application/octet-stream'

    file_metadata = {
        'name': os.path.basename(file_path),
        'parents': [drive_folder_id]
    }
    media = MediaFileUpload(file_path, mimetype=mime_type, resumable=True)
    uploaded = service.files().create(body=file_metadata, media_body=media, fields='id').execute()

    service.permissions().create(
        fileId=uploaded['id'],
        body={'type': 'anyone', 'role': 'reader'}
    ).execute()

    return f"https://drive.google.com/file/d/{uploaded['id']}/view?usp=sharing"

def create_drive_folder(service, name, parent_id):
    folder_metadata = {
        'name': name,
        'mimeType': 'application/vnd.google-apps.folder',
        'parents': [parent_id]
    }
    folder = service.files().create(body=folder_metadata, fields='id').execute()
    return folder['id']

def build_metadata(service, paper_dict):
    metadata = []
    for variant in sorted(paper_dict.keys()):

        if not variant.isdigit():
            continue
            
        folder_name = f"Paper{variant}"
        folder_path = os.path.join(DOWNLOAD_DIR, folder_name)
        if not os.path.exists(folder_path):
            continue

        drive_subfolder_id = create_drive_folder(service, folder_name, drive_parent_folder_id)
        qp_path = os.path.join(folder_path, f"qp{variant}.pdf")
        ms_path = os.path.join(folder_path, f"ms{variant}.pdf")
        

        sf_path_zip = os.path.join(folder_path, f"sf{variant}.zip")
        sf_path_pdf = os.path.join(folder_path, f"sf{variant}.pdf")
        sf_path = sf_path_zip if os.path.exists(sf_path_zip) else sf_path_pdf

        print(f"📤 Uploading Paper {variant}...")

        qp_link = ms_link = sf_link = ""

        if os.path.exists(qp_path):
            qp_link = upload_file(service, qp_path, drive_subfolder_id)
            print(f"  ✅ Uploaded QP")
        else:
            print(f"  ⚠️ QP not found: {qp_path}")

        if os.path.exists(ms_path):
            ms_link = upload_file(service, ms_path, drive_subfolder_id)
            print(f"  ✅ Uploaded MS")
        else:
            print(f"  ⚠️ MS not found: {ms_path}")

        if os.path.exists(sf_path):
            sf_link = upload_file(service, sf_path, drive_subfolder_id)
            print(f"  ✅ Uploaded SF")
        else:
            print(f"  ⚠️ SF not found: {sf_path_zip} or {sf_path_pdf}")


        metadata.append({
            "name": f"{session_name}-{variant}",
            "size": "3",
            "qp": qp_link,
            "ms": ms_link,
            "sf": sf_link,
            "text1": "QP",
            "text2": "MS",
            "text3": "SF" if sf_link else "",
            "id": f"{session_name.lower().replace(' ', '_')}_{variant}"
        })

    output_filename = f"metadata_{SOURCE}.json"
    with open(output_filename, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"✅ JSON saved as {output_filename}")
    return metadata

if __name__ == "__main__":
    print(f"🚀 Starting scraper for source: {SOURCE}")
    
    paper_dict = download_files()
    if paper_dict:
        print(f"\n📋 Summary of found files:")
        for variant, files in paper_dict.items():
            print(f"  Paper {variant}: {list(files.keys())}")
        drive_service = get_drive_service()
        metadata = build_metadata(drive_service, paper_dict)
        print(f"\n📊 Generated metadata for {len(metadata)} papers")
    else:
        print("⚠️ No papers found.")

    if os.path.exists(DOWNLOAD_DIR):
        shutil.rmtree(DOWNLOAD_DIR)
        print(f"🧹 Deleted temporary download directory: {DOWNLOAD_DIR}")