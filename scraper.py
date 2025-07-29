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

# Load env vars
load_dotenv()
# ---------- Configuration ----------
BASE_URL = "https://pastpapers.co"
subject_path = "A-Level/Mathematics-Further-9231/2023-May-June"
session_name = "June 2023"
drive_parent_folder_id = "1jDbw5OAnmtXS8oSsgqbAnaT2Mmr1UFoL"
DOWNLOAD_DIR = "downloads"
SCOPES = ['https://www.googleapis.com/auth/drive.file']
# -----------------------------------

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
    return build('drive', 'v3', credentials=creds)

def download_files():
    full_url = f"{BASE_URL}/cie/?dir={subject_path}"
    print(f"🔍 Scraping: {full_url}")
    res = requests.get(full_url)
    soup = BeautifulSoup(res.text, 'html.parser')

    links = soup.select("a")
    paper_dict = {}

    for link in links:
        href = link.get("href")
        if not href or ".pdf" not in href:
            continue

        if "view.php?id=" in href:
            raw_path = href.split("view.php?id=")[-1]
            full_link = f"{BASE_URL}/{raw_path}"
            filename = os.path.basename(raw_path)
        else:
            full_link = f"{BASE_URL}{href}"
            filename = os.path.basename(href)

        qp_match = re.search(r"(qp)[^0-9]*([0-9]{2})", filename, re.IGNORECASE)
        ms_match = re.search(r"(ms)[^0-9]*([0-9]{2})", filename, re.IGNORECASE)

        if qp_match:
            variant = qp_match.group(2)
            paper_dict.setdefault(variant, {})["qp"] = full_link
        elif ms_match:
            variant = ms_match.group(2)
            paper_dict.setdefault(variant, {})["ms"] = full_link

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
                    response = requests.get(url)
                    with open(path, 'wb') as f:
                        f.write(response.content)
                except Exception as e:
                    print(f"❌ Error downloading {url}: {e}")

    return paper_dict

def upload_file(service, file_path, drive_folder_id):
    file_metadata = {
        'name': os.path.basename(file_path),
        'parents': [drive_folder_id]
    }
    media = MediaFileUpload(file_path, mimetype='application/pdf')
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
        folder_name = f"Paper{variant}"
        folder_path = os.path.join(DOWNLOAD_DIR, folder_name)
        if not os.path.exists(folder_path):
            continue

        drive_subfolder_id = create_drive_folder(service, folder_name, drive_parent_folder_id)
        qp_path = os.path.join(folder_path, f"qp{variant}.pdf")
        ms_path = os.path.join(folder_path, f"ms{variant}.pdf")

        print(f"📤 Uploading Paper {variant}...")

        data = {
            "name": f"{session_name}-{variant}",
            "size": "3",
            "qp": upload_file(service, qp_path, drive_subfolder_id) if os.path.exists(qp_path) else "",
            "ms": upload_file(service, ms_path, drive_subfolder_id) if os.path.exists(ms_path) else "",
            "text1": "QP" if int(variant) >= 30 else "View Question Paper",
            "text2": "MS" if int(variant) >= 30 else "View Mark Scheme",
            "id": f"{session_name.lower().replace(' ', '_')}_{variant}"
        }
        metadata.append(data)

    with open("metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    print("✅ JSON saved as metadata.json")

if __name__ == "__main__":
    paper_dict = download_files()
    if paper_dict:
        drive_service = get_drive_service()
        build_metadata(drive_service, paper_dict)
    else:
        print("⚠️ No papers found.")
