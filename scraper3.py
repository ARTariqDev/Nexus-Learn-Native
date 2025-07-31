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
import time
import random
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import cloudscraper

# Load env vars
load_dotenv()

# ---------------------------- Configuration ----------------------------
# Choose source: "pastpapers" or "papacambridge"
SOURCE = "pastpapers"  # or "papacambridge"

# For pastpapers.co aka the GOAT
PASTPAPERS_BASE_URL = "https://pastpapers.co"
pastpapers_subject_path = "IGCSE/Computer-Science-0478/2024-May-June"

# For PapaCambridge - Updated path for Computer Science IGCSE
PAPACAMBRIDGE_BASE_URL = "https://www.papacambridge.com"
papacambridge_subject_path = "cambridge_igcse/computer-science-0478"  # Updated path

session_name = "June 2024"
drive_parent_folder_id = "1UruKt7QUu3hTerw8A1AgVhDtzpLCoqe2"
DOWNLOAD_DIR = "downloads"
SCOPES = ['https://www.googleapis.com/auth/drive.file']
# -----------------------------------------------------------------------

def create_cloudflare_scraper():
    """Create a cloudscraper instance to bypass Cloudflare protection"""
    try:
        scraper = cloudscraper.create_scraper(
            browser={
                'browser': 'chrome',
                'platform': 'darwin',  # macOS
                'desktop': True
            }
        )
        # Disable SSL verification for problematic sites
        scraper.verify = False
        return scraper
    except ImportError:
        print("⚠️ cloudscraper not found. Install with: pip install cloudscraper")
        return None

def create_robust_session():
    """Create a requests session with retry strategy and proper headers"""
    session = requests.Session()
    
    # Disable SSL verification to avoid certificate issues
    session.verify = False
    
    # Disable SSL warnings
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    
    # Define retry strategy
    retry_strategy = Retry(
        total=3,  # Reduced retries for faster fallback
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["HEAD", "GET", "OPTIONS"]
    )
    
    # Mount adapter with retry strategy
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    
    # Rotate User-Agents to appear more human-like
    user_agents = [
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ]
    
    session.headers.update({
        'User-Agent': random.choice(user_agents),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none'
    })
    
    session.timeout = 30
    return session

def safe_request(session_or_scraper, url, max_retries=3):
    """Make a safe request with different strategies"""
    for attempt in range(max_retries):
        try:
            print(f"🔄 Attempt {attempt + 1}/{max_retries} for: {url}")
            
            # Add random delay
            if attempt > 0:
                delay = random.uniform(2, 5)
                print(f"⏳ Waiting {delay:.2f} seconds before retry...")
                time.sleep(delay)
            else:
                # Small delay even on first attempt
                time.sleep(random.uniform(1, 3))
            
            # Try with cloudscraper first if available
            if hasattr(session_or_scraper, 'get') and 'cloudscraper' in str(type(session_or_scraper)):
                response = session_or_scraper.get(url, timeout=30)
            else:
                response = session_or_scraper.get(url, timeout=30)
            
            response.raise_for_status()
            return response
            
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 403:
                print(f"❌ 403 Forbidden on attempt {attempt + 1}")
                if attempt == max_retries - 1:
                    print("🚫 Site is blocking requests. Try using a VPN or different network.")
            else:
                print(f"❌ HTTP error on attempt {attempt + 1}: {str(e)}")
            if attempt == max_retries - 1:
                raise
                
        except Exception as e:
            print(f"❌ Error on attempt {attempt + 1}: {str(e)}")
            if attempt == max_retries - 1:
                raise
    
    raise Exception(f"Failed to fetch {url} after {max_retries} attempts")

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

def scrape_pastpapers_co():
    """Scrape papers from pastpapers.co with Cloudflare bypass"""
    # Try multiple URL formats
    url_formats = [
        f"{PASTPAPERS_BASE_URL}/cie/?dir={pastpapers_subject_path}",
        f"{PASTPAPERS_BASE_URL}/cie/igcse/computer-science-0478/2024/may-june/",
        f"{PASTPAPERS_BASE_URL}/cambridge-igcse/computer-science-0478/2024-may-june/"
    ]
    
    for full_url in url_formats:
        print(f"🔍 Trying URL: {full_url}")
        
        try:
            # Try cloudscraper first
            scraper = create_cloudflare_scraper()
            if scraper:
                try:
                    print("🛡️ Using CloudScraper to bypass protection...")
                    res = safe_request(scraper, full_url)
                except Exception as e:
                    print(f"❌ CloudScraper failed: {str(e)}")
                    print("🔄 Trying regular session...")
                    session = create_robust_session()
                    res = safe_request(session, full_url)
                    session.close()
            else:
                session = create_robust_session()
                res = safe_request(session, full_url)
                session.close()
            
            soup = BeautifulSoup(res.text, 'html.parser')
            links = soup.select("a")
            paper_dict = {}

            print(f"📊 Found {len(links)} total links on the page")

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

            if paper_dict:
                print(f"✅ Successfully found papers at: {full_url}")
                return paper_dict
            else:
                print(f"⚠️ No papers found at: {full_url}")
                
        except Exception as e:
            print(f"❌ Failed to access {full_url}: {str(e)}")
            continue
    
    print("❌ All pastpapers.co URLs failed")
    return {}

def parse_caie_filename(filename):
    """Parse CAIE filename format like 0478_w24_ms_12.pdf"""
    
    # CAIE standard patterns for Computer Science 0478
    patterns = [
        # Winter 2024: 0478_w24_qp_11.pdf, 0478_w24_ms_12.pdf, etc.
        (r'0478_w24_(qp|ms|sf)_(\d)(\d)\.(?:pdf|zip)', lambda m: (m.group(1), m.group(2), m.group(3))),
        
        # Alternative format: 0478_m24_qp_11.pdf (m24 = Oct/Nov 2024)  
        (r'0478_m24_(qp|ms|sf)_(\d)(\d)\.(?:pdf|zip)', lambda m: (m.group(1), m.group(2), m.group(3))),
        
        # Generic CAIE format: XXXX_YZZ_TYPE_PV.pdf
        (r'0478_[wsm]\d{2}_(qp|ms|sf)_(\d)(\d)\.(?:pdf|zip)', lambda m: (m.group(1), m.group(2), m.group(3))),
        
        # Simplified formats as fallback
        (r'(qp|ms|sf)[_-](\d)(\d)\.(?:pdf|zip)', lambda m: (m.group(1), m.group(2), m.group(3))),
        (r'(\d)(\d)[_-](qp|ms|sf)\.(?:pdf|zip)', lambda m: (m.group(3), m.group(1), m.group(2))),
    ]
    
    for pattern, extractor in patterns:
        match = re.search(pattern, filename, re.IGNORECASE)
        
        if match:
            paper_type, paper_num, variant_num = extractor(match)
            paper_type = paper_type.lower()
            
            # Convert CAIE paper numbering to our variant system
            # Paper 1 Variant 1 (11) -> variant 01
            # Paper 1 Variant 2 (12) -> variant 02  
            # Paper 1 Variant 3 (13) -> variant 03
            # Paper 2 Variant 1 (21) -> variant 04
            # Paper 2 Variant 2 (22) -> variant 05
            # Paper 2 Variant 3 (23) -> variant 06
            
            if paper_num == '1':
                variant = variant_num.zfill(2)
            elif paper_num == '2':
                variant = str(int(variant_num) + 3).zfill(2)
            else:
                # Fallback for unexpected paper numbers
                variant = f"{paper_num}{variant_num}".zfill(2)
            
            return variant, paper_type
    
    # If no pattern matches, try to extract any useful info
    print(f"  ⚠️ No pattern matched for: {filename}")
    return None

def scrape_papacambridge():
    """Scrape papers from PapaCambridge with improved structure detection"""
    full_url = f"{PAPACAMBRIDGE_BASE_URL}/{papacambridge_subject_path}"
    print(f"🔍 Scraping PapaCambridge: {full_url}")
    
    session = create_robust_session()
    
    try:
        res = safe_request(session, full_url)
        soup = BeautifulSoup(res.text, 'html.parser')
        
        paper_dict = {}
        
        # Debug: Print page title to confirm we're on the right page
        page_title = soup.find('title')
        if page_title:
            print(f"📄 Page title: {page_title.text.strip()}")
        
        # Method 1: Look for download_file.php links
        download_links = soup.find_all('a', href=re.compile(r'download_file\.php\?files='))
        print(f"📊 Found {len(download_links)} download_file.php links")
        
        for link in download_links:
            href = link.get('href', '')
            if 'download_file.php?files=' not in href:
                continue
            
            try:
                files_param = href.split('files=', 1)[1]
                actual_pdf_url = unquote(files_param)
                filename = os.path.basename(actual_pdf_url)
                
                print(f"📄 Processing: {filename}")
                
                result = parse_caie_filename(filename)
                if result:
                    variant, paper_type = result
                    paper_dict.setdefault(variant, {})[paper_type] = actual_pdf_url
                    print(f"  ✅ Found {paper_type.upper()} for variant {variant}")
                    
            except Exception as e:
                print(f"  ❌ Error processing link {href}: {e}")
        
        # Method 2: Look for direct PDF links
        direct_pdf_links = soup.find_all('a', href=re.compile(r'\.pdf

def download_files():
    """Download files based on selected source"""
    try:
        if SOURCE == "papacambridge":
            paper_dict = scrape_papacambridge()
        else:
            paper_dict = scrape_pastpapers_co()
    except Exception as e:
        print(f"❌ Primary source failed: {str(e)}")
        print("🔄 Trying alternative source...")
        try:
            if SOURCE == "pastpapers":
                paper_dict = scrape_papacambridge()
            else:
                paper_dict = scrape_pastpapers_co()
        except Exception as e2:
            print(f"❌ Both sources failed: {str(e2)}")
            return {}

    print(f"\n📊 Found papers for variants: {list(paper_dict.keys())}")

    if not paper_dict:
        print("⚠️ No papers found to download")
        return paper_dict

    os.makedirs(DOWNLOAD_DIR, exist_ok=True)
    
    # Create session for downloads
    session = create_robust_session()

    try:
        for variant, files in paper_dict.items():
            folder = os.path.join(DOWNLOAD_DIR, f"Paper{variant}")
            os.makedirs(folder, exist_ok=True)

            for type_ in ['qp', 'ms']:
                if type_ in files:
                    url = files[type_]
                    path = os.path.join(folder, f"{type_}{variant}.pdf")
                    try:
                        print(f"⬇️ Downloading {type_.upper()}: {url}")
                        response = safe_request(session, url, max_retries=2)
                        with open(path, 'wb') as f:
                            f.write(response.content)
                        print(f"  ✅ Downloaded {type_.upper()} for variant {variant}")
                        time.sleep(random.uniform(1, 3))
                    except Exception as e:
                        print(f"❌ Error downloading {url}: {e}")

            if 'sf' in files:
                url = files['sf']
                extension = '.zip' if url.lower().endswith('.zip') else '.pdf'
                path = os.path.join(folder, f"sf{variant}{extension}")
                try:
                    print(f"⬇️ Downloading SF: {url}")
                    response = safe_request(session, url, max_retries=2)
                    with open(path, 'wb') as f:
                        f.write(response.content)
                    print(f"  ✅ Downloaded SF for variant {variant}")
                    time.sleep(random.uniform(1, 3))
                except Exception as e:
                    print(f"❌ Error downloading SF {url}: {e}")

    finally:
        session.close()

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
            print(f"  ⚠️ SF not found")

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
    print("💡 If you get 403 errors, try: pip install cloudscraper")
    
    try:
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
    except Exception as e:
        print(f"❌ Critical error: {str(e)}")
        print("\n🔧 Troubleshooting tips:")
        print("1. Install cloudscraper: pip install cloudscraper")
        print("2. Try using a VPN")
        print("3. Check if the websites are accessible in your browser")
        print("4. Try running at a different time")
    finally:
        if os.path.exists(DOWNLOAD_DIR):
            shutil.rmtree(DOWNLOAD_DIR)
            print(f"🧹 Deleted temporary download directory: {DOWNLOAD_DIR}")))
        print(f"📊 Found {len(direct_pdf_links)} direct PDF links")
        
        for link in direct_pdf_links:
            href = link.get('href', '')
            if not href.endswith('.pdf'):
                continue
                
            # Make URL absolute
            if href.startswith('http'):
                full_pdf_url = href
            elif href.startswith('/'):
                full_pdf_url = f"{PAPACAMBRIDGE_BASE_URL}{href}"
            else:
                full_pdf_url = f"{PAPACAMBRIDGE_BASE_URL}/{papacambridge_subject_path}/{href}"
            
            filename = os.path.basename(href)
            print(f"📄 Processing direct PDF: {filename}")
            
            result = parse_caie_filename(filename)
            if result:
                variant, paper_type = result
                if variant not in paper_dict or paper_type not in paper_dict[variant]:
                    paper_dict.setdefault(variant, {})[paper_type] = full_pdf_url
                    print(f"  ✅ Found {paper_type.upper()} for variant {variant} (direct)")
        
        # Method 3: Look for text patterns in the page
        page_text = soup.get_text()
        pdf_patterns = re.findall(r'0478[^\s]*\.pdf', page_text, re.IGNORECASE)
        print(f"📊 Found {len(pdf_patterns)} PDF patterns in text")
        
        for pdf_name in pdf_patterns:
            print(f"📄 Processing text pattern: {pdf_name}")
            result = parse_caie_filename(pdf_name)
            if result:
                variant, paper_type = result
                # Construct likely URL
                pdf_url = f"{PAPACAMBRIDGE_BASE_URL}/{papacambridge_subject_path}/{pdf_name}"
                if variant not in paper_dict or paper_type not in paper_dict[variant]:
                    paper_dict.setdefault(variant, {})[paper_type] = pdf_url
                    print(f"  ✅ Found {paper_type.upper()} for variant {variant} (pattern)")
        
        # Method 4: Try different year/session combinations if nothing found
        if not paper_dict:
            print("🔍 Trying alternative URLs...")
            alternative_paths = [
                "cambridge_igcse/computer-science-0478/2024",
                "igcse/computer-science-0478",
                "Cambridge-IGCSE/Computer-Science-0478"
            ]
            
            for alt_path in alternative_paths:
                try:
                    alt_url = f"{PAPACAMBRIDGE_BASE_URL}/{alt_path}"
                    print(f"🔄 Trying: {alt_url}")
                    alt_res = safe_request(session, alt_url, max_retries=1)
                    alt_soup = BeautifulSoup(alt_res.text, 'html.parser')
                    
                    # Look for any PDF links
                    alt_links = alt_soup.find_all('a', href=re.compile(r'\.pdf

def download_files():
    """Download files based on selected source"""
    try:
        if SOURCE == "papacambridge":
            paper_dict = scrape_papacambridge()
        else:
            paper_dict = scrape_pastpapers_co()
    except Exception as e:
        print(f"❌ Primary source failed: {str(e)}")
        print("🔄 Trying alternative source...")
        try:
            if SOURCE == "pastpapers":
                paper_dict = scrape_papacambridge()
            else:
                paper_dict = scrape_pastpapers_co()
        except Exception as e2:
            print(f"❌ Both sources failed: {str(e2)}")
            return {}

    print(f"\n📊 Found papers for variants: {list(paper_dict.keys())}")

    if not paper_dict:
        print("⚠️ No papers found to download")
        return paper_dict

    os.makedirs(DOWNLOAD_DIR, exist_ok=True)
    
    # Create session for downloads
    session = create_robust_session()

    try:
        for variant, files in paper_dict.items():
            folder = os.path.join(DOWNLOAD_DIR, f"Paper{variant}")
            os.makedirs(folder, exist_ok=True)

            for type_ in ['qp', 'ms']:
                if type_ in files:
                    url = files[type_]
                    path = os.path.join(folder, f"{type_}{variant}.pdf")
                    try:
                        print(f"⬇️ Downloading {type_.upper()}: {url}")
                        response = safe_request(session, url, max_retries=2)
                        with open(path, 'wb') as f:
                            f.write(response.content)
                        print(f"  ✅ Downloaded {type_.upper()} for variant {variant}")
                        time.sleep(random.uniform(1, 3))
                    except Exception as e:
                        print(f"❌ Error downloading {url}: {e}")

            if 'sf' in files:
                url = files['sf']
                extension = '.zip' if url.lower().endswith('.zip') else '.pdf'
                path = os.path.join(folder, f"sf{variant}{extension}")
                try:
                    print(f"⬇️ Downloading SF: {url}")
                    response = safe_request(session, url, max_retries=2)
                    with open(path, 'wb') as f:
                        f.write(response.content)
                    print(f"  ✅ Downloaded SF for variant {variant}")
                    time.sleep(random.uniform(1, 3))
                except Exception as e:
                    print(f"❌ Error downloading SF {url}: {e}")

    finally:
        session.close()

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
            print(f"  ⚠️ SF not found")

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
    print("💡 If you get 403 errors, try: pip install cloudscraper")
    
    try:
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
    except Exception as e:
        print(f"❌ Critical error: {str(e)}")
        print("\n🔧 Troubleshooting tips:")
        print("1. Install cloudscraper: pip install cloudscraper")
        print("2. Try using a VPN")
        print("3. Check if the websites are accessible in your browser")
        print("4. Try running at a different time")
    finally:
        if os.path.exists(DOWNLOAD_DIR):
            shutil.rmtree(DOWNLOAD_DIR)
            print(f"🧹 Deleted temporary download directory: {DOWNLOAD_DIR}")))
                    if alt_links:
                        print(f"  📊 Found {len(alt_links)} PDFs at alternative URL")
                        for link in alt_links[:5]:  # Limit to first 5 for testing
                            href = link.get('href', '')
                            filename = os.path.basename(href)
                            result = parse_caie_filename(filename)
                            if result:
                                variant, paper_type = result
                                full_pdf_url = href if href.startswith('http') else f"{PAPACAMBRIDGE_BASE_URL}{href}"
                                paper_dict.setdefault(variant, {})[paper_type] = full_pdf_url
                                print(f"    ✅ Found {paper_type.upper()} for variant {variant}")
                        break
                except:
                    continue

        print(f"📊 Successfully found {len(paper_dict)} paper variants")
        return paper_dict
        
    except Exception as e:
        print(f"❌ Error scraping PapaCambridge: {str(e)}")
        # Try a more basic approach
        print("🔄 Trying basic fallback...")
        try:
            import requests
            basic_session = requests.Session()
            basic_session.verify = False
            basic_response = basic_session.get(full_url, timeout=10)
            print(f"📄 Basic response status: {basic_response.status_code}")
            if basic_response.status_code == 200:
                print(f"📊 Content length: {len(basic_response.text)} characters")
                # Look for any mention of PDF files
                pdf_mentions = re.findall(r'\b\w*\.pdf\b', basic_response.text, re.IGNORECASE)
                print(f"📄 Found {len(set(pdf_mentions))} unique PDF mentions")
        except Exception as e2:
            print(f"❌ Basic fallback also failed: {e2}")
        
        return {}
    finally:
        session.close()

def download_files():
    """Download files based on selected source"""
    try:
        if SOURCE == "papacambridge":
            paper_dict = scrape_papacambridge()
        else:
            paper_dict = scrape_pastpapers_co()
    except Exception as e:
        print(f"❌ Primary source failed: {str(e)}")
        print("🔄 Trying alternative source...")
        try:
            if SOURCE == "pastpapers":
                paper_dict = scrape_papacambridge()
            else:
                paper_dict = scrape_pastpapers_co()
        except Exception as e2:
            print(f"❌ Both sources failed: {str(e2)}")
            return {}

    print(f"\n📊 Found papers for variants: {list(paper_dict.keys())}")

    if not paper_dict:
        print("⚠️ No papers found to download")
        return paper_dict

    os.makedirs(DOWNLOAD_DIR, exist_ok=True)
    
    # Create session for downloads
    session = create_robust_session()

    try:
        for variant, files in paper_dict.items():
            folder = os.path.join(DOWNLOAD_DIR, f"Paper{variant}")
            os.makedirs(folder, exist_ok=True)

            for type_ in ['qp', 'ms']:
                if type_ in files:
                    url = files[type_]
                    path = os.path.join(folder, f"{type_}{variant}.pdf")
                    try:
                        print(f"⬇️ Downloading {type_.upper()}: {url}")
                        response = safe_request(session, url, max_retries=2)
                        with open(path, 'wb') as f:
                            f.write(response.content)
                        print(f"  ✅ Downloaded {type_.upper()} for variant {variant}")
                        time.sleep(random.uniform(1, 3))
                    except Exception as e:
                        print(f"❌ Error downloading {url}: {e}")

            if 'sf' in files:
                url = files['sf']
                extension = '.zip' if url.lower().endswith('.zip') else '.pdf'
                path = os.path.join(folder, f"sf{variant}{extension}")
                try:
                    print(f"⬇️ Downloading SF: {url}")
                    response = safe_request(session, url, max_retries=2)
                    with open(path, 'wb') as f:
                        f.write(response.content)
                    print(f"  ✅ Downloaded SF for variant {variant}")
                    time.sleep(random.uniform(1, 3))
                except Exception as e:
                    print(f"❌ Error downloading SF {url}: {e}")

    finally:
        session.close()

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
            print(f"  ⚠️ SF not found")

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
    print("💡 If you get 403 errors, try: pip install cloudscraper")
    
    try:
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
    except Exception as e:
        print(f"❌ Critical error: {str(e)}")
        print("\n🔧 Troubleshooting tips:")
        print("1. Install cloudscraper: pip install cloudscraper")
        print("2. Try using a VPN")
        print("3. Check if the websites are accessible in your browser")
        print("4. Try running at a different time")
    finally:
        if os.path.exists(DOWNLOAD_DIR):
            shutil.rmtree(DOWNLOAD_DIR)
            print(f"🧹 Deleted temporary download directory: {DOWNLOAD_DIR}")))

def download_files():
    """Download files based on selected source"""
    try:
        if SOURCE == "papacambridge":
            paper_dict = scrape_papacambridge()
        else:
            paper_dict = scrape_pastpapers_co()
    except Exception as e:
        print(f"❌ Primary source failed: {str(e)}")
        print("🔄 Trying alternative source...")
        try:
            if SOURCE == "pastpapers":
                paper_dict = scrape_papacambridge()
            else:
                paper_dict = scrape_pastpapers_co()
        except Exception as e2:
            print(f"❌ Both sources failed: {str(e2)}")
            return {}

    print(f"\n📊 Found papers for variants: {list(paper_dict.keys())}")

    if not paper_dict:
        print("⚠️ No papers found to download")
        return paper_dict

    os.makedirs(DOWNLOAD_DIR, exist_ok=True)
    
    # Create session for downloads
    session = create_robust_session()

    try:
        for variant, files in paper_dict.items():
            folder = os.path.join(DOWNLOAD_DIR, f"Paper{variant}")
            os.makedirs(folder, exist_ok=True)

            for type_ in ['qp', 'ms']:
                if type_ in files:
                    url = files[type_]
                    path = os.path.join(folder, f"{type_}{variant}.pdf")
                    try:
                        print(f"⬇️ Downloading {type_.upper()}: {url}")
                        response = safe_request(session, url, max_retries=2)
                        with open(path, 'wb') as f:
                            f.write(response.content)
                        print(f"  ✅ Downloaded {type_.upper()} for variant {variant}")
                        time.sleep(random.uniform(1, 3))
                    except Exception as e:
                        print(f"❌ Error downloading {url}: {e}")

            if 'sf' in files:
                url = files['sf']
                extension = '.zip' if url.lower().endswith('.zip') else '.pdf'
                path = os.path.join(folder, f"sf{variant}{extension}")
                try:
                    print(f"⬇️ Downloading SF: {url}")
                    response = safe_request(session, url, max_retries=2)
                    with open(path, 'wb') as f:
                        f.write(response.content)
                    print(f"  ✅ Downloaded SF for variant {variant}")
                    time.sleep(random.uniform(1, 3))
                except Exception as e:
                    print(f"❌ Error downloading SF {url}: {e}")

    finally:
        session.close()

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
            print(f"  ⚠️ SF not found")

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
    print("💡 If you get 403 errors, try: pip install cloudscraper")
    
    try:
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
    except Exception as e:
        print(f"❌ Critical error: {str(e)}")
        print("\n🔧 Troubleshooting tips:")
        print("1. Install cloudscraper: pip install cloudscraper")
        print("2. Try using a VPN")
        print("3. Check if the websites are accessible in your browser")
        print("4. Try running at a different time")
    finally:
        if os.path.exists(DOWNLOAD_DIR):
            shutil.rmtree(DOWNLOAD_DIR)
            print(f"🧹 Deleted temporary download directory: {DOWNLOAD_DIR}")))
        print(f"📊 Found {len(direct_pdf_links)} direct PDF links")
        
        for link in direct_pdf_links:
            href = link.get('href', '')
            if not href.endswith('.pdf'):
                continue
                
            # Make URL absolute
            if href.startswith('http'):
                full_pdf_url = href
            elif href.startswith('/'):
                full_pdf_url = f"{PAPACAMBRIDGE_BASE_URL}{href}"
            else:
                full_pdf_url = f"{PAPACAMBRIDGE_BASE_URL}/{papacambridge_subject_path}/{href}"
            
            filename = os.path.basename(href)
            print(f"📄 Processing direct PDF: {filename}")
            
            result = parse_caie_filename(filename)
            if result:
                variant, paper_type = result
                if variant not in paper_dict or paper_type not in paper_dict[variant]:
                    paper_dict.setdefault(variant, {})[paper_type] = full_pdf_url
                    print(f"  ✅ Found {paper_type.upper()} for variant {variant} (direct)")
        
        # Method 3: Look for text patterns in the page
        page_text = soup.get_text()
        pdf_patterns = re.findall(r'0478[^\s]*\.pdf', page_text, re.IGNORECASE)
        print(f"📊 Found {len(pdf_patterns)} PDF patterns in text")
        
        for pdf_name in pdf_patterns:
            print(f"📄 Processing text pattern: {pdf_name}")
            result = parse_caie_filename(pdf_name)
            if result:
                variant, paper_type = result
                # Construct likely URL
                pdf_url = f"{PAPACAMBRIDGE_BASE_URL}/{papacambridge_subject_path}/{pdf_name}"
                if variant not in paper_dict or paper_type not in paper_dict[variant]:
                    paper_dict.setdefault(variant, {})[paper_type] = pdf_url
                    print(f"  ✅ Found {paper_type.upper()} for variant {variant} (pattern)")
        
        # Method 4: Try different year/session combinations if nothing found
        if not paper_dict:
            print("🔍 Trying alternative URLs...")
            alternative_paths = [
                "cambridge_igcse/computer-science-0478/2024",
                "igcse/computer-science-0478",
                "Cambridge-IGCSE/Computer-Science-0478"
            ]
            
            for alt_path in alternative_paths:
                try:
                    alt_url = f"{PAPACAMBRIDGE_BASE_URL}/{alt_path}"
                    print(f"🔄 Trying: {alt_url}")
                    alt_res = safe_request(session, alt_url, max_retries=1)
                    alt_soup = BeautifulSoup(alt_res.text, 'html.parser')
                    
                    # Look for any PDF links
                    alt_links = alt_soup.find_all('a', href=re.compile(r'\.pdf

def download_files():
    """Download files based on selected source"""
    try:
        if SOURCE == "papacambridge":
            paper_dict = scrape_papacambridge()
        else:
            paper_dict = scrape_pastpapers_co()
    except Exception as e:
        print(f"❌ Primary source failed: {str(e)}")
        print("🔄 Trying alternative source...")
        try:
            if SOURCE == "pastpapers":
                paper_dict = scrape_papacambridge()
            else:
                paper_dict = scrape_pastpapers_co()
        except Exception as e2:
            print(f"❌ Both sources failed: {str(e2)}")
            return {}

    print(f"\n📊 Found papers for variants: {list(paper_dict.keys())}")

    if not paper_dict:
        print("⚠️ No papers found to download")
        return paper_dict

    os.makedirs(DOWNLOAD_DIR, exist_ok=True)
    
    # Create session for downloads
    session = create_robust_session()

    try:
        for variant, files in paper_dict.items():
            folder = os.path.join(DOWNLOAD_DIR, f"Paper{variant}")
            os.makedirs(folder, exist_ok=True)

            for type_ in ['qp', 'ms']:
                if type_ in files:
                    url = files[type_]
                    path = os.path.join(folder, f"{type_}{variant}.pdf")
                    try:
                        print(f"⬇️ Downloading {type_.upper()}: {url}")
                        response = safe_request(session, url, max_retries=2)
                        with open(path, 'wb') as f:
                            f.write(response.content)
                        print(f"  ✅ Downloaded {type_.upper()} for variant {variant}")
                        time.sleep(random.uniform(1, 3))
                    except Exception as e:
                        print(f"❌ Error downloading {url}: {e}")

            if 'sf' in files:
                url = files['sf']
                extension = '.zip' if url.lower().endswith('.zip') else '.pdf'
                path = os.path.join(folder, f"sf{variant}{extension}")
                try:
                    print(f"⬇️ Downloading SF: {url}")
                    response = safe_request(session, url, max_retries=2)
                    with open(path, 'wb') as f:
                        f.write(response.content)
                    print(f"  ✅ Downloaded SF for variant {variant}")
                    time.sleep(random.uniform(1, 3))
                except Exception as e:
                    print(f"❌ Error downloading SF {url}: {e}")

    finally:
        session.close()

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
            print(f"  ⚠️ SF not found")

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
    print("💡 If you get 403 errors, try: pip install cloudscraper")
    
    try:
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
    except Exception as e:
        print(f"❌ Critical error: {str(e)}")
        print("\n🔧 Troubleshooting tips:")
        print("1. Install cloudscraper: pip install cloudscraper")
        print("2. Try using a VPN")
        print("3. Check if the websites are accessible in your browser")
        print("4. Try running at a different time")
    finally:
        if os.path.exists(DOWNLOAD_DIR):
            shutil.rmtree(DOWNLOAD_DIR)
            print(f"🧹 Deleted temporary download directory: {DOWNLOAD_DIR}")))
                    if alt_links:
                        print(f"  📊 Found {len(alt_links)} PDFs at alternative URL")
                        for link in alt_links[:5]:  # Limit to first 5 for testing
                            href = link.get('href', '')
                            filename = os.path.basename(href)
                            result = parse_caie_filename(filename)
                            if result:
                                variant, paper_type = result
                                full_pdf_url = href if href.startswith('http') else f"{PAPACAMBRIDGE_BASE_URL}{href}"
                                paper_dict.setdefault(variant, {})[paper_type] = full_pdf_url
                                print(f"    ✅ Found {paper_type.upper()} for variant {variant}")
                        break
                except:
                    continue

        print(f"📊 Successfully found {len(paper_dict)} paper variants")
        return paper_dict
        
    except Exception as e:
        print(f"❌ Error scraping PapaCambridge: {str(e)}")
        # Try a more basic approach
        print("🔄 Trying basic fallback...")
        try:
            import requests
            basic_session = requests.Session()
            basic_session.verify = False
            basic_response = basic_session.get(full_url, timeout=10)
            print(f"📄 Basic response status: {basic_response.status_code}")
            if basic_response.status_code == 200:
                print(f"📊 Content length: {len(basic_response.text)} characters")
                # Look for any mention of PDF files
                pdf_mentions = re.findall(r'\b\w*\.pdf\b', basic_response.text, re.IGNORECASE)
                print(f"📄 Found {len(set(pdf_mentions))} unique PDF mentions")
        except Exception as e2:
            print(f"❌ Basic fallback also failed: {e2}")
        
        return {}
    finally:
        session.close()

def download_files():
    """Download files based on selected source"""
    try:
        if SOURCE == "papacambridge":
            paper_dict = scrape_papacambridge()
        else:
            paper_dict = scrape_pastpapers_co()
    except Exception as e:
        print(f"❌ Primary source failed: {str(e)}")
        print("🔄 Trying alternative source...")
        try:
            if SOURCE == "pastpapers":
                paper_dict = scrape_papacambridge()
            else:
                paper_dict = scrape_pastpapers_co()
        except Exception as e2:
            print(f"❌ Both sources failed: {str(e2)}")
            return {}

    print(f"\n📊 Found papers for variants: {list(paper_dict.keys())}")

    if not paper_dict:
        print("⚠️ No papers found to download")
        return paper_dict

    os.makedirs(DOWNLOAD_DIR, exist_ok=True)
    
    # Create session for downloads
    session = create_robust_session()

    try:
        for variant, files in paper_dict.items():
            folder = os.path.join(DOWNLOAD_DIR, f"Paper{variant}")
            os.makedirs(folder, exist_ok=True)

            for type_ in ['qp', 'ms']:
                if type_ in files:
                    url = files[type_]
                    path = os.path.join(folder, f"{type_}{variant}.pdf")
                    try:
                        print(f"⬇️ Downloading {type_.upper()}: {url}")
                        response = safe_request(session, url, max_retries=2)
                        with open(path, 'wb') as f:
                            f.write(response.content)
                        print(f"  ✅ Downloaded {type_.upper()} for variant {variant}")
                        time.sleep(random.uniform(1, 3))
                    except Exception as e:
                        print(f"❌ Error downloading {url}: {e}")

            if 'sf' in files:
                url = files['sf']
                extension = '.zip' if url.lower().endswith('.zip') else '.pdf'
                path = os.path.join(folder, f"sf{variant}{extension}")
                try:
                    print(f"⬇️ Downloading SF: {url}")
                    response = safe_request(session, url, max_retries=2)
                    with open(path, 'wb') as f:
                        f.write(response.content)
                    print(f"  ✅ Downloaded SF for variant {variant}")
                    time.sleep(random.uniform(1, 3))
                except Exception as e:
                    print(f"❌ Error downloading SF {url}: {e}")

    finally:
        session.close()

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
            print(f"  ⚠️ SF not found")

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
    print("💡 If you get 403 errors, try: pip install cloudscraper")
    
    try:
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
    except Exception as e:
        print(f"❌ Critical error: {str(e)}")
        print("\n🔧 Troubleshooting tips:")
        print("1. Install cloudscraper: pip install cloudscraper")
        print("2. Try using a VPN")
        print("3. Check if the websites are accessible in your browser")
        print("4. Try running at a different time")
    finally:
        if os.path.exists(DOWNLOAD_DIR):
            shutil.rmtree(DOWNLOAD_DIR)
            print(f"🧹 Deleted temporary download directory: {DOWNLOAD_DIR}")