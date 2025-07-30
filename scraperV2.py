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
from urllib.parse import urljoin, unquote

# Load env vars
load_dotenv()

# ---------------------------- Configuration ----------------------------
BASE_URL = "https://pastpapers.co"
SUBJECT_PATH = "A-Level/Physics-9702"
DRIVE_PARENT_FOLDER_ID = "1K-p2q4Fr0deK-HsUtvbIyS1_Q8SgL-R_"  # Updated folder ID
DOWNLOAD_DIR = "downloads"
SCOPES = ['https://www.googleapis.com/auth/drive.file']
# -----------------------------------------------------------------------

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
    service._http.timeout = 300
    return service

def get_all_sessions():
    """Get all available sessions for Physics 9702"""
    full_url = f"{BASE_URL}/cie/?dir={SUBJECT_PATH}"
    print(f"🔍 Finding all sessions at: {full_url}")
    
    try:
        res = requests.get(full_url, timeout=30)
        res.raise_for_status()
        soup = BeautifulSoup(res.text, 'html.parser')
        
        sessions = []
        links = soup.select("a")
        
        for link in links:
            href = link.get("href")
            if not href:
                continue
                
            # Look for session directories (e.g., "2025-March", "2024-November")
            if href.startswith("?dir=") and SUBJECT_PATH in href:
                # Extract session name from the URL
                session_part = href.split(SUBJECT_PATH + "/")
                if len(session_part) > 1:
                    session_name = unquote(session_part[1])
                    if session_name and session_name not in sessions:
                        sessions.append(session_name)
                        print(f"  📅 Found session: {session_name}")
        
        print(f"📊 Total sessions found: {len(sessions)}")
        return sorted(sessions, reverse=True)  # Sort by year descending
    
    except Exception as e:
        print(f"❌ Error getting sessions: {e}")
        return []

def download_session_files(session):
    """Download all files for a specific session"""
    session_url = f"{BASE_URL}/cie/?dir={SUBJECT_PATH}/{session}"
    print(f"\n🔍 Scraping session: {session_url}")
    
    try:
        res = requests.get(session_url, timeout=30)
        res.raise_for_status()
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
                full_link = f"{BASE_URL}{href}"
            elif href.startswith("http"):
                full_link = href
            else:
                full_link = urljoin(session_url, href)
                
            filename = os.path.basename(href)
            print(f"📄 Processing: {filename}")
            
            # Enhanced regex patterns for Physics papers
            qp_match = re.search(r"qp[_-]?(\d{1,2})\.pdf", filename, re.IGNORECASE)
            ms_match = re.search(r"ms[_-]?(\d{1,2})\.pdf", filename, re.IGNORECASE)
            sf_match = re.search(r"sf[_-]?(\d{1,2})\.(zip|pdf)", filename, re.IGNORECASE)
            
            if qp_match:
                variant = qp_match.group(1).zfill(2)
                paper_dict.setdefault(variant, {})["qp"] = full_link
                print(f"  ✅ Found QP for paper {variant}")
            elif ms_match:
                variant = ms_match.group(1).zfill(2)
                paper_dict.setdefault(variant, {})["ms"] = full_link
                print(f"  ✅ Found MS for paper {variant}")
            elif sf_match:
                variant = sf_match.group(1).zfill(2)
                paper_dict.setdefault(variant, {})["sf"] = full_link
                print(f"  ✅ Found SF for paper {variant}")
        
        print(f"📊 Found papers: {list(paper_dict.keys())}")
        
        # Create session directory
        session_dir = os.path.join(DOWNLOAD_DIR, session)
        os.makedirs(session_dir, exist_ok=True)
        
        # Download files for each paper
        for paper_num, files in paper_dict.items():
            paper_folder = os.path.join(session_dir, f"Paper {paper_num}")
            os.makedirs(paper_folder, exist_ok=True)
            
            for file_type, url in files.items():
                if file_type == 'sf':
                    filename = f"{file_type}{paper_num}.zip"
                else:
                    filename = f"{file_type}{paper_num}.pdf"
                    
                file_path = os.path.join(paper_folder, filename)
                
                try:
                    print(f"⬇️ Downloading: {filename}")
                    response = requests.get(url, timeout=60)
                    response.raise_for_status()
                    with open(file_path, 'wb') as f:
                        f.write(response.content)
                    print(f"  ✅ Downloaded: {filename}")
                except Exception as e:
                    print(f"  ❌ Error downloading {filename}: {e}")
        
        return paper_dict
    
    except Exception as e:
        print(f"❌ Error processing session {session}: {e}")
        return {}

def upload_file(service, file_path, drive_folder_id, mime_type=None):
    """Upload file to Google Drive"""
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
    
    # Make file publicly accessible
    service.permissions().create(
        fileId=uploaded['id'],
        body={'type': 'anyone', 'role': 'reader'}
    ).execute()
    
    return f"https://drive.google.com/file/d/{uploaded['id']}/view?usp=sharing"

def create_drive_folder(service, name, parent_id):
    """Create folder in Google Drive"""
    folder_metadata = {
        'name': name,
        'mimeType': 'application/vnd.google-apps.folder',
        'parents': [parent_id]
    }
    folder = service.files().create(body=folder_metadata, fields='id').execute()
    return folder['id']

def build_metadata(service, all_session_data):
    """Build metadata JSON and upload files to Drive"""
    metadata = []
    
    for session, paper_dict in all_session_data.items():
        if not paper_dict:
            continue
            
        print(f"\n📤 Processing session: {session}")
        
        # Create session folder in Drive
        session_drive_folder_id = create_drive_folder(service, session, DRIVE_PARENT_FOLDER_ID)
        
        for paper_num in sorted(paper_dict.keys()):
            paper_folder_name = f"Paper {paper_num}"
            local_paper_folder = os.path.join(DOWNLOAD_DIR, session, paper_folder_name)
            
            if not os.path.exists(local_paper_folder):
                continue
            
            print(f"📤 Uploading {session} - Paper {paper_num}...")
            
            # Create paper folder in Drive
            paper_drive_folder_id = create_drive_folder(service, paper_folder_name, session_drive_folder_id)
            
            # Upload files and collect links
            file_links = {}
            file_types = ['qp', 'ms', 'sf']
            
            for file_type in file_types:
                if file_type == 'sf':
                    file_path = os.path.join(local_paper_folder, f"{file_type}{paper_num}.zip")
                else:
                    file_path = os.path.join(local_paper_folder, f"{file_type}{paper_num}.pdf")
                
                if os.path.exists(file_path):
                    try:
                        link = upload_file(service, file_path, paper_drive_folder_id)
                        file_links[file_type] = link
                        print(f"  ✅ Uploaded {file_type.upper()}")
                    except Exception as e:
                        print(f"  ❌ Error uploading {file_type}: {e}")
                        file_links[file_type] = ""
                else:
                    file_links[file_type] = ""
            
            # Determine session format for ID
            session_parts = session.split('-')
            if len(session_parts) == 2:
                year, month = session_parts
                if month.lower() in ['march', 'may', 'june']:
                    session_key = 'june' if month.lower() in ['may', 'june'] else 'march'
                else:
                    session_key = 'november'
            else:
                print(f"⚠️ Unexpected session format: {session}")
                session_key = session.lower()
                year = "unknown"
            
            # Create metadata entry
            metadata_entry = {
                "name": f"{session} - Paper {paper_num}",
                "size": "3",
                "qp": file_links.get('qp', ''),
                "ms": file_links.get('ms', ''),
                "sf": file_links.get('sf', ''),
                "text1": "QP",
                "text2": "MS", 
                "text3": "SF" if file_links.get('sf') else "",
                "id": f"{session_key}_{year}_{paper_num}"
            }
            
            metadata.append(metadata_entry)
    
    # Save metadata
    with open("metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)
    print("✅ Metadata saved as metadata.json")
    
    return metadata


def main():
    """Main function"""
    print("🚀 Starting Physics 9702 scraper...")
    
    # Create downloads directory
    os.makedirs(DOWNLOAD_DIR, exist_ok=True)
    
    # Get all available sessions
    sessions = get_all_sessions()
    if not sessions:
        print("❌ No sessions found!")
        return
    
    # Download files for all sessions
    all_session_data = {}
    for session in sessions:
        paper_dict = download_session_files(session)
        if paper_dict:
            all_session_data[session] = paper_dict
    
    if not all_session_data:
        print("❌ No papers downloaded!")
        return
    
    print(f"\n📋 Summary:")
    total_papers = 0
    for session, papers in all_session_data.items():
        paper_count = len(papers)
        total_papers += paper_count
        print(f"  {session}: {paper_count} papers")
    
    print(f"📊 Total papers found: {total_papers}")
    
    # Upload to Drive and build metadata
    drive_service = get_drive_service()
    metadata = build_metadata(drive_service, all_session_data)
    print(f"✅ Generated metadata for {len(metadata)} papers")
    
    # Cleanup
    if os.path.exists(DOWNLOAD_DIR):
        shutil.rmtree(DOWNLOAD_DIR)
        print(f"🧹 Deleted temporary download directory: {DOWNLOAD_DIR}")
    
    print("🎉 Scraping completed successfully!")

if __name__ == "__main__":
    main()