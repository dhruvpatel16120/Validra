#!/usr/bin/env python3
"""Validra Backend — Interactive Setup & Environment Bootstrapper.

Features:
- Colorized, interactive terminal prompts with defaults.
- Intelligent .env configuration (backup, overwrite, or keep).
- Cross-module secret synchronization (auto-detects frontend .env values).
- Virtual environment verification & creation.
- Dependency installation with intelligent fallback mechanism.
- Non-blocking database connectivity check & table initialization with fallback.
- Support for non-interactive / automated execution via --non-interactive / -y.
"""

import argparse
import datetime
import os
from pathlib import Path
import re
import secrets
import shutil
import subprocess
import sys
from typing import Any, Dict, List, Optional, Tuple

# Enable ANSI colors on Windows 10/11 terminals
if sys.platform == "win32":
    os.system("color")

COLORS = {
    "reset": "\033[0m",
    "bold": "\033[1m",
    "dim": "\033[2m",
    "red": "\033[31m",
    "green": "\033[32m",
    "yellow": "\033[33m",
    "blue": "\033[34m",
    "magenta": "\033[35m",
    "cyan": "\033[36m",
    "white": "\033[37m",
}


def colorize(text: str, color: str) -> str:
    return f"{COLORS.get(color, '')}{text}{COLORS['reset']}"


def print_banner() -> None:
    print("\n" + colorize("=" * 64, "cyan"))
    print(colorize("  🚀 VALIDRA BACKEND - INTERACTIVE SETUP & INSTALLATION", "bold"))
    print(colorize("=" * 64, "cyan"))


def ask(prompt_text: str, default_value: str = "", non_interactive: bool = False) -> str:
    if non_interactive:
        return default_value

    if default_value:
        prompt = f"{colorize(prompt_text, 'cyan')} [{colorize(default_value, 'dim')}]: "
    else:
        prompt = f"{colorize(prompt_text, 'cyan')}: "

    try:
        ans = input(prompt).strip()
        return ans if ans else default_value
    except (KeyboardInterrupt, EOFError):
        print(colorize("\n\n❌ Setup aborted by user.", "red"))
        sys.exit(1)


def ask_options(
    prompt_text: str,
    options: List[Dict[str, str]],
    default_idx: int = 0,
    non_interactive: bool = False,
) -> str:
    if non_interactive:
        return options[default_idx]["value"]

    print(f"\n{colorize(prompt_text, 'bold')}")
    for idx, opt in enumerate(options, 1):
        marker = colorize(f"  {idx}.", "yellow")
        print(f"{marker} {opt['label']}")

    while True:
        try:
            prompt = colorize(f"\nSelect an option [1-{len(options)}] (default {default_idx + 1}): ", "blue")
            ans = input(prompt).strip()
            if not ans:
                return options[default_idx]["value"]
            num = int(ans)
            if 1 <= num <= len(options):
                return options[num - 1]["value"]
            print(colorize(f"❌ Invalid selection. Please choose 1-{len(options)}", "red"))
        except ValueError:
            print(colorize(f"❌ Please enter a number between 1 and {len(options)}", "red"))
        except (KeyboardInterrupt, EOFError):
            print(colorize("\n\n❌ Setup aborted by user.", "red"))
            sys.exit(1)


def parse_env_file(file_path: Path) -> Dict[str, str]:
    env_vars: Dict[str, str] = {}
    if not file_path.exists():
        return env_vars

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                k = k.strip()
                v = v.strip().strip("'\"")
                env_vars[k] = v
    except Exception:
        pass
    return env_vars


def detect_frontend_config(backend_dir: Path) -> Dict[str, str]:
    """Inspect frontend/.env if present to help synchronize shared keys."""
    frontend_env = backend_dir.parent / "frontend" / ".env"
    detected: Dict[str, str] = {}
    if frontend_env.exists():
        f_vars = parse_env_file(frontend_env)
        if "AUTH_SECRET" in f_vars:
            detected["AUTH_SECRET"] = f_vars["AUTH_SECRET"]
        if "DATABASE_URL" in f_vars:
            db_url = f_vars["DATABASE_URL"]
            # Convert prisma standard postgresql:// to asyncpg postgresql+asyncpg://
            if db_url.startswith("postgresql://") and not db_url.startswith("postgresql+asyncpg://"):
                detected["DATABASE_URL"] = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
            else:
                detected["DATABASE_URL"] = db_url
        if "EMAIL_FROM" in f_vars:
            detected["EMAIL_FROM"] = f_vars["EMAIL_FROM"]
        if "EMAIL_PASSWORD" in f_vars:
            detected["SMTP_PASSWORD"] = f_vars["EMAIL_PASSWORD"]
            detected["SMTP_USER"] = f_vars.get("EMAIL_FROM", "")
        if "EMAIL_HOST" in f_vars:
            detected["SMTP_HOST"] = f_vars["EMAIL_HOST"]
        if "EMAIL_PORT" in f_vars:
            detected["SMTP_PORT"] = f_vars["EMAIL_PORT"]
    return detected


def setup_env(backend_dir: Path, non_interactive: bool = False) -> None:
    env_path = backend_dir / ".env"
    env_example_path = backend_dir / ".env.example"

    print(colorize("\n⚙️  Environment Configuration (.env)", "cyan"))
    print(colorize("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "cyan"))

    existing_env: Dict[str, str] = {}
    if env_path.exists():
        existing_env = parse_env_file(env_path)
        if not non_interactive:
            print(colorize("⚠️  An existing .env file was detected in backend/.", "yellow"))
            choice = ask_options(
                "How would you like to proceed with .env?",
                [
                    {"label": "Keep current .env (skip environment prompts)", "value": "keep"},
                    {"label": "Backup current .env and configure new values", "value": "backup"},
                    {"label": "Overwrite current .env directly", "value": "overwrite"},
                ],
                default_idx=0,
                non_interactive=non_interactive,
            )

            if choice == "keep":
                print(colorize("✅ Kept existing .env file.", "green"))
                return

            if choice == "backup":
                timestamp = datetime.datetime.now().strftime("%Y-%m-%dT%H-%M-%S")
                backup_path = backend_dir / f".env.backup.{timestamp}"
                shutil.copy2(env_path, backup_path)
                print(colorize(f"📦 Existing .env backed up to: {backup_path.name}", "green"))
    elif env_example_path.exists():
        existing_env = parse_env_file(env_example_path)

    # Detect shared values from frontend/.env for seamless cross-module sync
    frontend_detected = detect_frontend_config(backend_dir)
    if frontend_detected:
        print(colorize("💡 Auto-detected matching settings from frontend/.env for cross-module sync.", "dim"))

    print(colorize("\nPlease configure backend settings (press Enter to accept defaults):", "dim"))

    # 1. Project & Network Settings
    project_name = ask("Project Name", existing_env.get("PROJECT_NAME", "Validra Base API"), non_interactive)
    api_str = ask("API Route Prefix", existing_env.get("API_STR", "/api"), non_interactive)
    env_mode = ask("Environment Mode (development|production|test)", existing_env.get("ENV", "development"), non_interactive)
    host = ask("Server Host", existing_env.get("HOST", "0.0.0.0"), non_interactive)
    port = ask("Server Port", existing_env.get("PORT", "8000"), non_interactive)

    # 2. Database Connection
    default_db = (
        existing_env.get("DATABASE_URL")
        or frontend_detected.get("DATABASE_URL")
        or "postgresql+asyncpg://postgres:root@localhost:5432/validra"
    )
    db_url = ask("PostgreSQL Database URL (asyncpg format)", default_db, non_interactive)

    # 3. Auth & Shared Secret
    default_secret = (
        existing_env.get("AUTH_SECRET")
        or frontend_detected.get("AUTH_SECRET")
        or "validra-default-jwt-secret-key-change-in-production"
    )

    auth_secret = default_secret
    if not non_interactive:
        print(colorize("\n🔐 Auth Secret (Shared JWT key with NextAuth / Next.js):", "dim"))
        secret_choice = ask_options(
            "Select Auth Secret method:",
            [
                {"label": f"Use standard / detected secret (\"{default_secret[:16]}...\")", "value": "default"},
                {"label": "Auto-generate a secure 32-byte hex secret", "value": "generate"},
                {"label": "Enter a custom secret key manually", "value": "custom"},
            ],
            default_idx=0,
            non_interactive=non_interactive,
        )

        if secret_choice == "generate":
            auth_secret = secrets.token_hex(32)
            print(colorize(f"   Generated Secret: {auth_secret}", "green"))
        elif secret_choice == "custom":
            auth_secret = ask("Enter custom AUTH_SECRET", default_secret, non_interactive)

    # 4. AI & OCR Keys
    groq_key = ask(
        "Groq Cloud API Key (for LLM statutory declaration extraction)",
        existing_env.get("GROQ_API_KEY", ""),
        non_interactive,
    )
    groq_model = ask(
        "Groq LLM Model",
        existing_env.get("GROQ_MODEL", "openai/gpt-oss-120b"),
        non_interactive,
    )
    ocr_space_key = ask(
        "OCR.space API Key (optional fallback)",
        existing_env.get("OCR_SPACE_API_KEY", ""),
        non_interactive,
    )

    # 5. Email & SMTP Notifications
    default_smtp_user = existing_env.get("SMTP_USER") or frontend_detected.get("SMTP_USER") or "validra.metrology@gmail.com"
    default_smtp_pwd = existing_env.get("SMTP_PASSWORD") or frontend_detected.get("SMTP_PASSWORD") or "edjmfmqkgrualfzn"
    default_email_from = existing_env.get("EMAIL_FROM") or frontend_detected.get("EMAIL_FROM") or "validra.metrology@gmail.com"

    smtp_host = ask("SMTP Host", existing_env.get("SMTP_HOST", "smtp.gmail.com"), non_interactive)
    smtp_port = ask("SMTP Port", existing_env.get("SMTP_PORT", "587"), non_interactive)
    smtp_user = ask("SMTP Username / Email", default_smtp_user, non_interactive)
    smtp_pwd = ask("SMTP App Password", default_smtp_pwd, non_interactive)
    email_from = ask("Sender Email (EMAIL_FROM)", default_email_from, non_interactive)
    report_recipient = ask("Report Recipient Email", existing_env.get("REPORT_RECIPIENT_EMAIL", "complaints.metrology@gov.in"), non_interactive)

    # Construct clean .env
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    env_content = f"""# Validra Backend Environment Variables
# Generated interactively via setup.py on {now_iso}

PROJECT_NAME={project_name}
API_STR={api_str}
ENV={env_mode}
HOST={host}
PORT={port}

# ─── Database (PostgreSQL via SQLAlchemy asyncpg) ───
DATABASE_URL={db_url}

# ─── Storage & File Constraints ───
UPLOAD_DIR=uploads
MAX_UPLOAD_SIZE_BYTES=5242880
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp,image/bmp

# ─── Auth & Security (Shared with NextAuth v5) ───
AUTH_SECRET={auth_secret}
NEXTAUTH_SECRET={auth_secret}
JWT_ALGORITHM=HS256

# ─── OCR & Extraction (Groq LLM + OCR.space) ───
OCR_SPACE_API_KEY={ocr_space_key}
GROQ_API_KEY={groq_key}
GROQ_MODEL={groq_model}

# ─── Notifications & Email (SMTP / Nodemailer Compatible) ───
SMTP_HOST={smtp_host}
SMTP_PORT={smtp_port}
SMTP_USER={smtp_user}
SMTP_PASSWORD={smtp_pwd}
EMAIL_FROM={email_from}
REPORT_RECIPIENT_EMAIL={report_recipient}
"""

    with open(env_path, "w", encoding="utf-8") as f:
        f.write(env_content)
    print(colorize("\n✅ Successfully created/updated backend/.env file!", "green"))


def get_venv_python(backend_dir: Path) -> Path:
    if sys.platform == "win32":
        return backend_dir / ".venv" / "Scripts" / "python.exe"
    return backend_dir / ".venv" / "bin" / "python"


def get_venv_pip(backend_dir: Path) -> Path:
    if sys.platform == "win32":
        return backend_dir / ".venv" / "Scripts" / "pip.exe"
    return backend_dir / ".venv" / "bin" / "pip"


def ensure_venv(backend_dir: Path, non_interactive: bool = False) -> Path:
    venv_dir = backend_dir / ".venv"
    venv_python = get_venv_python(backend_dir)

    print(colorize("\n🐍 Python Virtual Environment (.venv)", "cyan"))
    print(colorize("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "cyan"))

    if not venv_python.exists():
        print(colorize("[+] Creating Python virtual environment (.venv)...", "yellow"))
        try:
            subprocess.run([sys.executable, "-m", "venv", str(venv_dir)], check=True)
            print(colorize("✅ Virtual environment (.venv) created successfully.", "green"))
        except subprocess.CalledProcessError as exc:
            print(colorize(f"❌ Failed to create virtual environment: {exc}", "red"))
            print(colorize("    Attempting to continue using current Python interpreter...", "yellow"))
            return Path(sys.executable)
    else:
        print(colorize("✅ Existing virtual environment (.venv) detected.", "green"))

    return venv_python if venv_python.exists() else Path(sys.executable)


def install_dependencies(backend_dir: Path, python_bin: Path, non_interactive: bool = False) -> bool:
    req_file = backend_dir / "requirements.txt"
    if not req_file.exists():
        print(colorize("⚠️  requirements.txt not found in backend directory.", "yellow"))
        return False

    print(colorize("\n📦 Installing Backend Dependencies", "cyan"))
    print(colorize("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "cyan"))

    # Upgrade pip first
    print(colorize("[+] Upgrading pip...", "yellow"))
    try:
        subprocess.run([str(python_bin), "-m", "pip", "install", "--upgrade", "pip"], check=False)
    except Exception:
        pass

    # Attempt primary install
    print(colorize("[+] Installing requirements from requirements.txt...", "yellow"))
    proc = subprocess.run(
        [str(python_bin), "-m", "pip", "install", "-r", str(req_file)],
        cwd=str(backend_dir),
    )

    if proc.returncode == 0:
        print(colorize("✅ All dependencies installed successfully.", "green"))
        return True

    # ─── Fallback Mechanism ───
    print(colorize("\n⚠️  Primary dependency installation encountered errors.", "yellow"))
    print(colorize("Initiating dependency fallback recovery...", "yellow"))

    if not non_interactive:
        choice = ask_options(
            "How would you like to handle dependency installation?",
            [
                {"label": "Install core API essentials only (FastAPI, SQLAlchemy, asyncpg, Auth, ReportLab, Groq)", "value": "core"},
                {"label": "Retry full requirements install without cache (--no-cache-dir)", "value": "nocache"},
                {"label": "Continue setup anyway (resolve dependencies manually later)", "value": "skip"},
            ],
            default_idx=0,
            non_interactive=non_interactive,
        )
    else:
        choice = "core"

    if choice == "nocache":
        print(colorize("[+] Retrying pip install --no-cache-dir...", "yellow"))
        proc2 = subprocess.run(
            [str(python_bin), "-m", "pip", "install", "--no-cache-dir", "-r", str(req_file)],
            cwd=str(backend_dir),
        )
        if proc2.returncode == 0:
            print(colorize("✅ Dependencies installed successfully on retry.", "green"))
            return True
        choice = "core"  # Fallback to core if nocache fails

    if choice == "core":
        core_packages = [
            "fastapi>=0.100.0",
            "uvicorn[standard]>=0.22.0",
            "pydantic>=2.0.0",
            "pydantic-settings>=2.0.0",
            "python-dotenv>=1.0.0",
            "sqlalchemy>=2.0.0",
            "asyncpg>=0.29.0",
            "python-multipart>=0.0.9",
            "pillow>=10.0.0",
            "python-jose[cryptography]>=3.3.0",
            "passlib[bcrypt]>=1.7.4",
            "reportlab>=5.0.0",
            "aiosmtplib>=3.0.0",
            "groq>=0.9.0",
            "requests>=2.31.0",
            "pytest>=7.4.0",
            "httpx>=0.24.0",
        ]
        print(colorize("[+] Installing core web and API dependencies...", "yellow"))
        proc_core = subprocess.run(
            [str(python_bin), "-m", "pip", "install"] + core_packages,
            cwd=str(backend_dir),
        )
        if proc_core.returncode == 0:
            print(colorize("✅ Core API dependencies successfully installed!", "green"))
            print(colorize("💡 Note: Heavy OCR packages (easyocr/opencv) can be installed later via: pip install easyocr opencv-python-headless", "dim"))
            return True
        else:
            print(colorize("❌ Core dependency install failed. Check Python and C++ build tools.", "red"))

    print(colorize("⚠️  Continuing setup. Note that some backend modules may require manual pip installs.", "yellow"))
    return False


def ensure_uploads_dir(backend_dir: Path) -> None:
    uploads_dir = backend_dir / "uploads"
    uploads_dir.mkdir(parents=True, exist_ok=True)
    print(colorize("✅ Verified static evidence uploads directory (`uploads/`).", "green"))


def check_and_init_db(backend_dir: Path, python_bin: Path) -> None:
    print(colorize("\n🗄️  PostgreSQL Database & Rules Initialization", "cyan"))
    print(colorize("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "cyan"))

    code = """
import asyncio
import sys

async def test_init():
    try:
        from app.db.session import init_db, AsyncSessionLocal
        from app.services.seed_rules import seed_default_rules
        await init_db()
        async with AsyncSessionLocal() as session:
            await seed_default_rules(session)
        print("DB_OK")
    except Exception as exc:
        print(f"DB_ERROR: {exc}", file=sys.stderr)
        sys.exit(2)

asyncio.run(test_init())
"""
    try:
        proc = subprocess.run(
            [str(python_bin), "-c", code],
            cwd=str(backend_dir),
            capture_output=True,
            text=True,
            timeout=15,
        )

        if proc.returncode == 0 and "DB_OK" in proc.stdout:
            print(colorize("✅ Database tables initialized and default Legal Metrology rules seeded.", "green"))
        else:
            err = proc.stderr.strip()
            print(colorize("⚠️  PostgreSQL connection could not be established.", "yellow"))
            if err:
                # Truncate error to first line for clean output
                first_line = err.split("\n")[0]
                print(colorize(f"   Notice: {first_line}", "dim"))
            print(colorize("   Ensure PostgreSQL is running with DATABASE_URL credentials from .env.", "yellow"))
            print(colorize("   (FastAPI lifespan will automatically create tables on first startup).", "dim"))
    except subprocess.TimeoutExpired:
        print(colorize("⚠️  Database connection check timed out.", "yellow"))
        print(colorize("   FastAPI lifespan will automatically connect when PostgreSQL is active.", "dim"))
    except Exception as exc:
        print(colorize(f"⚠️  Notice: Database check skipped ({exc}).", "yellow"))


def main() -> None:
    parser = argparse.ArgumentParser(description="Validra Backend Interactive Setup")
    parser.add_argument(
        "-y",
        "--non-interactive",
        action="store_true",
        help="Run non-interactively using existing or default values",
    )
    args = parser.parse_args()

    backend_dir = Path(__file__).resolve().parent.parent

    print_banner()

    try:
        # 1. Setup .env
        setup_env(backend_dir, non_interactive=args.non_interactive)

        # 2. Setup / Verify virtual environment
        python_bin = ensure_venv(backend_dir, non_interactive=args.non_interactive)

        # 3. Ensure uploads folder
        ensure_uploads_dir(backend_dir)

        # 4. Install dependencies with fallback
        install_dependencies(backend_dir, python_bin, non_interactive=args.non_interactive)

        # 5. Database connectivity & rule seed check
        check_and_init_db(backend_dir, python_bin)

        # 6. Success & Quickstart summary
        print("\n" + colorize("=" * 64, "green"))
        print(colorize("  🎉 BACKEND SETUP COMPLETED SUCCESSFULLY!", "bold"))
        print(colorize("=" * 64, "green"))
        print(colorize("\nNext steps to run the backend:", "bold"))
        if sys.platform == "win32":
            print(f"  ▶️  Start Dev Server:  {colorize('.\\.venv\\Scripts\\python.exe -m uvicorn app.main:app --reload', 'cyan')}")
            print(f"  ▶️  Run Tests:         {colorize('.\\.venv\\Scripts\\python.exe -m pytest tests/test_main.py -v', 'cyan')}")
        else:
            print(f"  ▶️  Start Dev Server:  {colorize('source .venv/bin/activate && uvicorn app.main:app --reload', 'cyan')}")
            print(f"  ▶️  Run Tests:         {colorize('source .venv/bin/activate && pytest', 'cyan')}")
        print(f"  ▶️  Interactive API:   {colorize('http://127.0.0.1:8000/docs', 'cyan')}\n")

    except KeyboardInterrupt:
        print(colorize("\n\n❌ Setup cancelled.", "red"))
        sys.exit(1)


if __name__ == "__main__":
    main()
