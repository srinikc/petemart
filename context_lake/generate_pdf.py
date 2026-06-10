"""
Generate Context Lake Design & Implementation PDF with Mermaid diagram
"""

from fpdf import FPDF
import os, re, json, urllib.request, urllib.error

FONT = "C:/Windows/Fonts"
ARIAL = os.path.join(FONT, "arial.ttf")
ARIAL_BD = os.path.join(FONT, "arialbd.ttf")
ARIAL_I = os.path.join(FONT, "ariali.ttf")
COURIER = os.path.join(FONT, "cour.ttf")
for p in [ARIAL, ARIAL_BD, ARIAL_I, COURIER]:
    if not os.path.exists(p):
        print(f"Warning: font not found: {p}")

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))


def clean(text):
    replacements = {
        "\u2014": "--", "\u2013": "-", "\u2018": "'", "\u2019": "'",
        "\u201c": '"', "\u201d": '"', "\u2022": "-", "\u2026": "...",
        "\u2713": "v", "\u2714": "v", "\u2705": "[OK]", "\u274c": "[X]",
        "\U0001f916": "[AI]", "\U0001f468": "[User]", "\U0001f4ad": "[Thinking]",
        "\U0001f527": "[Tool]", "\U0001f6e0": "[Wrench]",
    }
    for k, v in replacements.items():
        text = text.replace(k, v)
    text = re.sub(r"[\U0001F300-\U0010FFFF]", "?", text)
    return text


MERMAID_DIAGRAM = """\
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#E8F0FE', 'secondaryColor': '#FFF3E0', 'tertiaryColor': '#E8F5E9', 'lineColor': '#555'}}}%%
flowchart TB
    subgraph TRIGGERS["Trigger Layer"]
        H["session_completed hook<br/>(close/compact)"] --> T1["capture.py --watch"]
        I["opencode.json instructions<br/>(new window)"] --> T2["latest.json loaded"]
    end

    subgraph INPUTS["Input Sources"]
        direction TB
        C["conversations/*.md<br/>Autosave Plugin"] --> P
        S["STATE_MATRIX.json<br/>AGENT_REGISTRY.json"] --> P
        G[".git/<br/>Branch, SHA, Log"] --> P
        A[".opencode/agents/<br/>Agent .md configs"] --> P
    end

    subgraph ENGINE["Capture Engine (capture.py)"]
        direction TB
        D1["1. Discover<br/>Config, git, state files"]
        D2["2. Extract<br/>Parse conversation file"]
        D3["3. Summarize<br/>Heuristic ALL exchanges"]
        D4["4. Persist<br/>Write JSON + markdown"]
        D1 --> D2 --> D3 --> D4
    end

    subgraph STORAGE["Storage & Outputs"]
        direction TB
        L1["latest.json<br/>Loaded on new window"]
        L2["lake/YYYY-MM-DD/...<br/>Permanent snapshots"]
        L3["latest.md<br/>Readable summary"]
    end

    P["capture.py<br/>capture() function"] --> D1
    D4 --> L1
    D4 --> L2
    D4 --> L3
    L1 -->|"instructions loads"| CTX["LLM Context<br/>(new window AI session)"]

    classDef trigger fill:#FFF3E0,stroke:#E65100,stroke-width:1px
    classDef input fill:#E8F5E9,stroke:#2E7D32,stroke-width:1px
    classDef engine fill:#E3F2FD,stroke:#1565C0,stroke-width:1px
    classDef storage fill:#F3E5F5,stroke:#6A1B9A,stroke-width:1px
    classDef context fill:#FFEBEE,stroke:#C62828,stroke-width:1px
    class H,I trigger
    class C,S,G,A input
    class P,D1,D2,D3,D4 engine
    class L1,L2,L3 storage
    class CTX context
"""


def render_mermaid_to_png(mermaid_text, output_path, timeout=20):
    """Render a Mermaid diagram to PNG using the Kroki API (POST method)."""
    payload = json.dumps({
        "diagram_source": mermaid_text,
        "diagram_type": "mermaid",
        "output_format": "png"
    }).encode("utf-8")
    try:
        req = urllib.request.Request(
            "https://kroki.io/mermaid/png",
            data=payload,
            headers={"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"}
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = resp.read()
            with open(output_path, "wb") as f:
                f.write(data)
            return True
    except Exception as e:
        print(f"  Kroki render failed: {e}")
        return False


def generate_drawio_xml():
    """Generate a .drawio file for the diagram (editable in draw.io)."""
    return """\
<mxfile host="opencode" modified="2026-06-02T00:00:00Z">
  <diagram id="context-lake" name="Architecture">
    <mxGraphModel dx="800" dy="600" grid="1" gridSize="10">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        <mxCell id="t" value="TRIGGERS" style="swimlane;startSize=30;" vertex="1" parent="1">
          <mxGeometry x="30" y="30" width="260" height="120" as="geometry"/>
        </mxCell>
        <mxCell id="t1" value="session_completed hook&#xa;(close/compact)" style="rounded=1;fillColor=#FFF3E0;" vertex="1" parent="1">
          <mxGeometry x="50" y="70" width="100" height="40" as="geometry"/>
        </mxCell>
        <mxCell id="t2" value="instructions&#xa;(new window)" style="rounded=1;fillColor=#FFF3E0;" vertex="1" parent="1">
          <mxGeometry x="170" y="70" width="100" height="40" as="geometry"/>
        </mxCell>
        <mxCell id="i" value="INPUT SOURCES" style="swimlane;startSize=30;" vertex="1" parent="1">
          <mxGeometry x="30" y="180" width="260" height="180" as="geometry"/>
        </mxCell>
        <mxCell id="i1" value="conversations/*.md&#xa;Autosave Plugin" style="rounded=1;fillColor=#E8F5E9;" vertex="1" parent="1">
          <mxGeometry x="50" y="220" width="100" height="40" as="geometry"/>
        </mxCell>
        <mxCell id="i2" value="STATE_MATRIX.json&#xa;AGENT_REGISTRY.json" style="rounded=1;fillColor=#E8F5E9;" vertex="1" parent="1">
          <mxGeometry x="170" y="220" width="100" height="40" as="geometry"/>
        </mxCell>
        <mxCell id="i3" value=".git/&#xa;Branch, SHA, Log" style="rounded=1;fillColor=#E8F5E9;" vertex="1" parent="1">
          <mxGeometry x="50" y="275" width="100" height="40" as="geometry"/>
        </mxCell>
        <mxCell id="i4" value=".opencode/agents/&#xa;Agent .md configs" style="rounded=1;fillColor=#E8F5E9;" vertex="1" parent="1">
          <mxGeometry x="170" y="275" width="100" height="40" as="geometry"/>
        </mxCell>
        <mxCell id="e" value="CAPTURE ENGINE (capture.py)" style="swimlane;startSize=30;" vertex="1" parent="1">
          <mxGeometry x="320" y="180" width="200" height="180" as="geometry"/>
        </mxCell>
        <mxCell id="e1" value="1. Discover&#xa;Config, git, state" style="rounded=1;fillColor=#E3F2FD;" vertex="1" parent="1">
          <mxGeometry x="335" y="220" width="170" height="25" as="geometry"/>
        </mxCell>
        <mxCell id="e2" value="2. Extract&#xa;Parse conversation" style="rounded=1;fillColor=#E3F2FD;" vertex="1" parent="1">
          <mxGeometry x="335" y="253" width="170" height="25" as="geometry"/>
        </mxCell>
        <mxCell id="e3" value="3. Summarize&#xa;Heuristic all exchanges" style="rounded=1;fillColor=#E3F2FD;" vertex="1" parent="1">
          <mxGeometry x="335" y="286" width="170" height="25" as="geometry"/>
        </mxCell>
        <mxCell id="e4" value="4. Persist&#xa;Write JSON+MD" style="rounded=1;fillColor=#E3F2FD;" vertex="1" parent="1">
          <mxGeometry x="335" y="319" width="170" height="25" as="geometry"/>
        </mxCell>
        <mxCell id="s" value="STORAGE / OUTPUTS" style="swimlane;startSize=30;" vertex="1" parent="1">
          <mxGeometry x="550" y="180" width="220" height="180" as="geometry"/>
        </mxCell>
        <mxCell id="s1" value="latest.json" style="rounded=1;fillColor=#F3E5F5;" vertex="1" parent="1">
          <mxGeometry x="570" y="220" width="180" height="30" as="geometry"/>
        </mxCell>
        <mxCell id="s2" value="lake/YYYY-MM-DD/..." style="rounded=1;fillColor=#F3E5F5;" vertex="1" parent="1">
          <mxGeometry x="570" y="258" width="180" height="30" as="geometry"/>
        </mxCell>
        <mxCell id="s3" value="latest.md" style="rounded=1;fillColor=#F3E5F5;" vertex="1" parent="1">
          <mxGeometry x="570" y="296" width="180" height="30" as="geometry"/>
        </mxCell>
        <mxCell id="ctx" value="LLM Context&#xa;(new window AI session)" style="rounded=1;fillColor=#FFEBEE;" vertex="1" parent="1">
          <mxGeometry x="570" y="340" width="180" height="40" as="geometry"/>
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>"""


class PDF(FPDF):
    def __init__(self):
        super().__init__(orientation="P", unit="mm", format="A4")
        if os.path.exists(ARIAL):
            self.add_font("Arial", "", ARIAL)
            self.add_font("Arial", "B", ARIAL_BD)
            self.add_font("Arial", "I", ARIAL_I)
        if os.path.exists(COURIER):
            self.add_font("CourierCustom", "", COURIER)

    def header(self):
        if self.page_no() > 1:
            self.set_font("Arial", "I", 8)
            self.cell(0, 6, clean("Context Lake - Cross-Session Context Persistence Engine"),
                      align="C", new_x="LMARGIN", new_y="NEXT")
            self.ln(2)

    def footer(self):
        self.set_y(-15)
        self.set_font("Arial", "I", 8)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}", align="C")

    def section_title(self, title):
        self.set_font("Arial", "B", 14)
        self.set_text_color(30, 60, 120)
        self.cell(0, 10, clean(title), new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(30, 60, 120)
        self.line(self.l_margin, self.get_y(), self.w - self.r_margin, self.get_y())
        self.ln(4)
        self.set_text_color(0, 0, 0)

    def sub_title(self, title):
        self.set_font("Arial", "B", 11)
        self.set_text_color(60, 60, 60)
        self.cell(0, 8, clean(title), new_x="LMARGIN", new_y="NEXT")
        self.ln(2)
        self.set_text_color(0, 0, 0)

    def body_text(self, text):
        self.set_font("Arial", "", 10)
        self.multi_cell(0, 5, clean(text))
        self.ln(2)

    def bullet(self, text, indent=10):
        x = self.get_x()
        self.set_x(x + indent)
        self.set_font("Arial", "", 10)
        self.cell(5, 5, "-")
        self.multi_cell(0, 5, clean(text))
        self.ln(1)

    def code_block(self, text):
        font = "CourierCustom" if os.path.exists(COURIER) else "Courier"
        self.set_font(font, "", 7)
        self.set_fill_color(240, 240, 240)
        self.set_draw_color(200, 200, 200)
        for line in text.split("\n"):
            if self.get_y() > 270:
                self.add_page()
            self.cell(0, 4, "  " + clean(line), fill=True, new_x="LMARGIN", new_y="NEXT")
        self.ln(3)
        self.set_font("Arial", "", 10)


# ── RENDER DIAGRAM ──
print("Rendering Mermaid diagram via Kroki...")
diagram_png = os.path.join(SCRIPT_DIR, "_diagram.png")
diagram_ok = render_mermaid_to_png(MERMAID_DIAGRAM, diagram_png)
if diagram_ok:
    print(f"  Diagram saved: {diagram_png} ({os.path.getsize(diagram_png)} bytes)")
else:
    print("  WARNING: Diagram could not be rendered -- will be skipped in PDF")

# Also write .drawio file for editing
drawio_path = os.path.join(SCRIPT_DIR, "LAKE_ARCHITECTURE.drawio")
with open(drawio_path, "w", encoding="utf-8") as f:
    f.write(generate_drawio_xml())
print(f"  Draw.io file: {drawio_path}")


# ── BUILD PDF ──
pdf = PDF()
pdf.alias_nb_pages()
pdf.set_auto_page_break(auto=True, margin=20)
pdf.add_page()

# ── Title Page ──
pdf.ln(35)
pdf.set_font("Arial", "B", 26)
pdf.set_text_color(30, 60, 120)
pdf.cell(0, 14, clean("Context Lake"), align="C", new_x="LMARGIN", new_y="NEXT")
pdf.set_font("Arial", "", 16)
pdf.set_text_color(80, 80, 80)
pdf.cell(0, 10, clean("Cross-Session Context Persistence Engine"), align="C", new_x="LMARGIN", new_y="NEXT")
pdf.ln(4)
pdf.set_font("Arial", "", 12)
pdf.cell(0, 8, clean("Design & Implementation Document"), align="C", new_x="LMARGIN", new_y="NEXT")
pdf.ln(16)
pdf.set_font("Arial", "", 10)
pdf.set_text_color(100, 100, 100)
pdf.cell(0, 6, clean("Project: petemart-agentic-framework"), align="C", new_x="LMARGIN", new_y="NEXT")
pdf.cell(0, 6, clean("Platform: Windows  |  Runtime: Python 3.10+  |  Dependencies: Zero (stdlib)"), align="C", new_x="LMARGIN", new_y="NEXT")
pdf.cell(0, 6, clean("Date: June 2026"), align="C", new_x="LMARGIN", new_y="NEXT")

# ── Architecture Summary Page ──
pdf.add_page()
pdf.ln(4)
pdf.set_font("Arial", "B", 16)
pdf.set_text_color(30, 60, 120)
pdf.cell(0, 10, clean("Architecture Summary"), align="C", new_x="LMARGIN", new_y="NEXT")
pdf.set_draw_color(30, 60, 120)
pdf.line(pdf.l_margin, pdf.get_y(), pdf.w - pdf.r_margin, pdf.get_y())
pdf.ln(6)

# Summary overview box
pdf.set_fill_color(240, 248, 255)
pdf.set_draw_color(30, 60, 120)
box_x = pdf.l_margin
box_y = pdf.get_y()
box_w = pdf.w - 2 * pdf.l_margin
box_h = 42
pdf.rect(box_x, box_y, box_w, box_h, style="DF")
pdf.set_xy(box_x + 3, box_y + 3)
pdf.set_font("Arial", "B", 10)
pdf.cell(0, 5, clean("What is Context Lake?"), new_x="LMARGIN", new_y="NEXT")
pdf.set_x(box_x + 3)
pdf.set_font("Arial", "", 9)
pdf.multi_cell(box_w - 6, 4.5, clean(
    "A file-based, zero-dependency engine that persists AI coding session context across "
    "window closes, compaction, and reboots. Every new opencode window automatically loads "
    "the latest project state -- pipeline progress, git info, and a full conversation summary."
))
pdf.ln(box_h + 6)

# Two-column layout for key info
col_w = (pdf.w - pdf.l_margin * 2 - 6) / 2
col_x1 = pdf.l_margin
col_x2 = col_x1 + col_w + 6

def summary_box(x, y, w, title, items, color=(220, 230, 245)):
    pdf.set_fill_color(*color)
    pdf.set_draw_color(100, 100, 100)
    pdf.rect(x, y, w, 6 + len(items) * 7, style="DF")
    pdf.set_xy(x + 2, y + 1)
    pdf.set_font("Arial", "B", 9)
    pdf.cell(w - 4, 5, clean(title))
    pdf.set_font("Arial", "", 8)
    for i, item in enumerate(items):
        pdf.set_xy(x + 3, y + 6 + i * 7)
        pdf.cell(w - 6, 6, clean(f"  - {item}"))

sy = pdf.get_y()
summary_box(col_x1, sy, col_w, "Capture Triggers", [
    "session close / compaction (auto)",
    "new window open (auto-load)",
    "manual capture (on-demand)",
], color=(230, 245, 230))

summary_box(col_x2, sy, col_w, "What Is Captured", [
    "Pipeline: 69% | 8/16 agents done",
    "Git: branch, SHA, last commit",
    "Session: 279 exchanges summarized",
    "Topics, done/pending counts",
    "Last 3 raw messages for detail",
], color=(245, 235, 220))

sy2 = sy + 6 + 5 * 7 + 4
summary_box(col_x1, sy2, col_w, "Storage", [
    "latest.json (always current)",
    "lake/YYYY-MM-DD/ (history)",
    "context.json + manifest.md",
    "latest.md (readable mirror)",
], color=(235, 225, 245))

summary_box(col_x2, sy2, col_w, "Design Principles", [
    "Zero dependencies (stdlib only)",
    "File-based -- survives anything",
    "Generic -- works in any project",
    "Heuristic summary (no LLM cost)",
    "Autonomous -- no user action needed",
], color=(245, 240, 210))

# Embed the diagram
if diagram_ok:
    pdf.ln(sy2 - pdf.get_y() + 4 + 6 + 5 * 7 + 8)
    pdf.set_font("Arial", "B", 10)
    pdf.cell(0, 6, clean("Architecture Block Diagram"), new_x="LMARGIN", new_y="NEXT")
    pdf.ln(3)
    img_w = 170
    img_h = int(img_w * 446 / 700)  # maintain aspect ratio
    img_x = (pdf.w - img_w) / 2
    pdf.image(diagram_png, x=img_x, w=img_w)

# ── TABLE OF CONTENTS ──
pdf.add_page()
pdf.section_title("Table of Contents")
pdf.set_font("Arial", "", 11)
for item in [
    "1. Overview & Purpose",
    "2. Architecture Principles",
    "3. Conversation Plugin (Autosave)",
    "4. Capture Engine (capture.py)",
    "5. Storage Structure",
    "6. Two Capture Modes",
    "7. Heuristic Session Summary",
    "8. Autonomous Triggers",
    "9. Data Flow & Survivability",
    "10. Key Design Decisions",
    "11. File Inventory",
    "12. Configuration Reference",
    "Appendix A: .drawio File Format",
]:
    pdf.cell(0, 7, item, new_x="LMARGIN", new_y="NEXT")

# ── 1. Overview ──
pdf.add_page()
pdf.section_title("1. Overview & Purpose")
pdf.body_text(
    "Context Lake solves a fundamental problem in session-based AI coding assistants: "
    "every new conversation window or compacted session starts with zero context about "
    "the project's state, progress, or history. Standard AI assistants have no built-in "
    "mechanism to persist context across sessions."
)
pdf.body_text("The Lake is a file-based persistence layer that captures the following automatically:")
pdf.bullet("Pipeline progress: how many agents completed, current phase, last milestone")
pdf.bullet("Individual agent state: status, artifacts, compliance, review feedback")
pdf.bullet("Git state: branch, HEAD SHA, last commit message, remote URL")
pdf.bullet("Full conversation summary: session goal, topics discussed, done/pending counts")
pdf.bullet("Latest raw messages: last 3 user+assistant exchanges for detail")
pdf.bullet("Environment: OS, Python version, project root, capture timestamp")
pdf.bullet("Historical snapshots: permanent lake entries on every session close/compaction")
pdf.body_text(
    "The system operates silently and autonomously. No user interaction is required "
    "after initial setup. Context is available in every new window, survives compaction, "
    "reboot, and crash."
)

# ── 2. Architecture Principles ──
pdf.add_page()
pdf.section_title("2. Architecture Principles")

pdf.sub_title("2.1 File-Based, Zero Dependencies")
pdf.body_text(
    "All data is stored as JSON and Markdown files on disk. No database, no server, "
    "no cloud service. The core engine uses only Python standard library modules: "
    "os, sys, json, glob, re, datetime, subprocess, sqlite3, platform, argparse, textwrap. "
    "Zero pip installs required. This guarantees portability across any Python 3.10+ "
    "environment on any operating system."
)

pdf.sub_title("2.2 Generic by Design")
pdf.body_text(
    "Config.json uses glob patterns, not hardcoded paths. The engine auto-discovers "
    "state files, agent configs, conversation directories, and git repos. The same "
    "code works in ANY opencode project with zero configuration changes."
)

pdf.sub_title("2.3 Silent Operation")
pdf.body_text(
    "The session_completed hook in opencode.json runs capture.py automatically on "
    "every compaction or window close -- with no console popup, no user interaction, "
    "and zero visual feedback. The capture runs silently in-process."
)

pdf.sub_title("2.4 Survives Everything")
pdf.body_text(
    "Because everything is on disk, the Lake survives: conversation compaction, window "
    "close without save, IDE crash, operating system reboot, power loss. The latest.json "
    "file is overwritten atomically (write + close)."
)

# ── 3. Conversation Plugin ──
pdf.add_page()
pdf.section_title("3. Conversation Plugin (Autosave)")
pdf.body_text(
    "The conversation plugin 'opencode-autosave-conversation' is declared in "
    "opencode.json and is the primary source of conversation content for the Lake."
)
pdf.sub_title("3.1 Plugin Configuration")
pdf.code_block('"plugin": ["opencode-autosave-conversation", "@slkiser/opencode-quota"]')
pdf.sub_title("3.2 What It Saves")
pdf.bullet("All user messages and assistant responses as Markdown (.md) files")
pdf.bullet("Tool calls with status, input JSON, and output")
pdf.bullet("Assistant reasoning blocks inside <details> tags")
pdf.bullet("Sub-agent delegation conversations")
pdf.bullet("Timestamps on every message block")
pdf.bullet("Session metadata (creation time, topic)")

pdf.sub_title("3.3 File Format")
pdf.code_block(
    "# Session: New session - YYYY-MM-DDT...\n"
    "**Created:** YYYY-MM-DD HH:MM:SS\n"
    "---\n"
    "## Conversation\n"
    "\n"
    "### [AI] Assistant\n"
    "*2026-06-02 12:47:46*\n"
    "\n"
    "user question text...\n"
    "\n"
    "*[step-start part]*\n"
    "\n"
    "[Thinking] **Reasoning:**\n"
    "<details><summary>Click to expand reasoning</summary>\n"
    "...\n"
    "</details>\n"
    "\n"
    "#### [Tool] Tool: tool-name\n"
    "**Status:** completed\n"
    "**Input:** ```json ... ```\n"
    "**Output:** ``` ... ```\n"
    "\n"
    "*[step-finish part]*\n"
)

pdf.sub_title("3.4 Known Limitation")
pdf.body_text(
    "The plugin labels ALL messages as '### [AI] Assistant' regardless of role. "
    "There are zero '### [User] User' headers in any conversation file. The Context Lake "
    "compensates by inferring roles from the position relative to *[step-start* markers: "
    "text before step-start is user, after is assistant."
)
pdf.sub_title("3.5 File Naming")
pdf.body_text(
    "Files are saved to the 'conversations/' directory with format: "
    "YYYYMMDD-HH-MM-SS-Topic.md. This enables chronological sorting by filename alone."
)

# ── 4. Capture Engine ──
pdf.add_page()
pdf.section_title("4. Capture Engine (capture.py)")
pdf.body_text(
    "The core engine is a single 839-line Python file at context_lake/capture.py. "
    "It performs discovery, extraction, summary, and persistence in one pass."
)
pdf.sub_title("4.1 Entry Point")
pdf.code_block(
    "python context_lake/capture.py\n"
    "python context_lake/capture.py --window \"My Window\"\n"
    "python context_lake/capture.py --project-root /path --json"
)
pdf.sub_title("4.2 Capture Pipeline (sequential)")
pdf.body_text("The capture() function runs seven stages in order:")
pdf.bullet("1. Config loading: load and merge config.json with defaults")
pdf.bullet("2. Window detection: read terminal title, or use --window arg")
pdf.bullet("3. Project discovery: read git state, OS, Python version")
pdf.bullet("4. Session discovery: query opencode SQLite DB for recent sessions")
pdf.bullet("5. State file discovery: glob STATE_MATRIX.json and AGENT_REGISTRY.json")
pdf.bullet("6. Agent config discovery: read .opencode/agents/*.md files")
pdf.bullet("7. Conversation analysis: read latest conversation, extract summary + last messages")

pdf.sub_title("4.3 Message Extraction Algorithm")
pdf.body_text("The extract_clean_messages() function parses the raw conversation file:")
pdf.bullet("Skipping session metadata before the first '### ' header")
pdf.bullet("Tracking <details> nesting to skip reasoning blocks")
pdf.bullet("Using *[step-start* markers to distinguish user vs assistant")
pdf.bullet("Skipping tool call metadata (lines starting with ####, <, >)")
pdf.bullet("Filtering blocks shorter than 10 characters (noise)")
pdf.bullet("Capping individual blocks at 5000 characters (avoids subagent dump bloat)")

# ── 5. Storage Structure ──
pdf.add_page()
pdf.section_title("5. Storage Structure")
pdf.sub_title("5.1 Directory Layout")
pdf.code_block(
    "context_lake/\n"
    "  config.json        # Generic config (glob patterns, intervals)\n"
    "  capture.py         # Core engine (839 lines, zero deps)\n"
    "  latest.json        # Always-fresh snapshot (auto-loaded on new window)\n"
    "  latest.md          # Human-readable mirror of latest.json\n"
    "  lake/              # Permanent historical entries\n"
    "    YYYY-MM-DD/\n"
    "      HH-MM-SS_WindowName/\n"
    "        context.json  # Full structured JSON\n"
    "        manifest.md   # Human-readable summary\n"
    "  hooks/\n"
    "    capture-on-agent.bat     # Agent completion hook\n"
)
pdf.sub_title("5.2 latest.json Schema")
pdf.code_block(
    "{\n"
    '  "latest_entry": "lake/2026-06-02/14-47-03_Test-Summary-v2",\n'
    '  "window_name": "Test-Summary-v2",\n'
    '  "captured_at": "2026-06-02T10:16:57+00:00",\n'
    '  "git_branch": "develop",\n'
    '  "git_sha": "486bb6e",\n'
    '  "last_commit": "fix(qa-dashboard): ...",\n'
    '  "conversation": {\n'
    '    "file": "20260602-08-15-02-....md",\n'
    '    "exchanges": 279,\n'
    '    "goal": "what is now latest status...",\n'
    '    "last_query": "good then. i will reload...",\n'
    '    "last_response": "## Commit Report...",\n'
    '    "topics": ["admin","api","auth","ci","deploy",...],\n'
    '    "done_mentions": 94,\n'
    '    "pending_mentions": 444\n'
    '  },\n'
    '  "state_files": [...],\n'
    '  "agent_count": 19,\n'
    '  "recent_sessions": [...]\n'
    "}"
)
pdf.sub_title("5.3 Permanent Entry (context.json)")
pdf.body_text(
    "Same structure plus: full conversations array with all 6 files, complete "
    "git log (last 20 commits), opencode sessions (up to 100), full agent configs (19)."
)

# ── 6. Two Capture Modes ──
pdf.add_page()
pdf.section_title("6. Two Capture Modes")
pdf.body_text(
    "The Lake has exactly two capture modes. Neither requires user action -- both "
    "fire autonomously in normal workflows."
)
pdf.sub_title("6.1 Session Completed Hook (Primary)")
pdf.body_text("Triggered by opencode.json experimental.hook.session_completed on every compaction or window close:")
pdf.code_block(
    '"experimental": {\n'
    '  "hook": {\n'
    '    "session_completed": [\n'
    '      {"command": ["python", "context_lake/capture.py",\n'
    '                   "--window", "session-completed",\n'
    '                   "--project-root", "."]}\n'
    '    ]\n'
    '  }\n'
    "}"
)
pdf.body_text(
    "Creates a PERMANENT lake entry (lake/YYYY-MM-DD/HH-MM-SS_.../) with the full "
    "structured snapshot. Also updates latest.json and latest.md."
)
pdf.sub_title("6.2 Manual Capture (On Demand)")
pdf.body_text(
    "python context_lake/capture.py --window \"Custom Name\". Creates permanent entry. "
    "Used for manual checkpoints, agent completion callbacks, or testing."
)

# ── 7. Heuristic Session Summary ──
pdf.add_page()
pdf.section_title("7. Heuristic Session Summary")
pdf.body_text(
    "Rather than truncating conversations to the last N messages (which loses context), "
    "the Lake generates a heuristic summary of ALL exchanges in the session. No LLM is "
    "needed -- pure regex and counting."
)
pdf.sub_title("7.1 Summary Fields")
pdf.bullet("Goal: first user message in the session (captures intent)")
pdf.bullet("Last query: most recent user message (captures current task)")
pdf.bullet("Last response: last assistant response truncated to 300 chars")
pdf.bullet("Topics: extracted via regex from assistant responses (15 topic keywords)")
pdf.bullet("Done mentions: count of 'done|complete|finished|implemented|built|added|fixed'")
pdf.bullet("Pending mentions: count of 'next|pending|remaining|still|yet|todo|blocked|bug|issue'")
pdf.bullet("Exchanges: total user+assistant turns in the session")

pdf.sub_title("7.2 Example Output")
pdf.code_block(
    "Session Summary:\n"
    "  File:  20260602-08-15-02-....md\n"
    "  Goal:  'what is now latest status from session_Chcekpoint...'\n"
    "  Topics: admin, ai, api, auth, ci, cd, deploy, commit, test\n"
    "  Done:  94  |  Pending: 444\n"
    "  Last:  'good then. i will reload shortly'\n"
    "         '## Commit Report | | Result | [OK] Commit successful...'"
)
pdf.sub_title("7.3 Role Detection (Without Plugin Support)")
pdf.body_text(
    "Since the plugin labels everything as 'Assistant', the Lake infers roles using "
    "the *[step-start* marker. Text before step-start is user, after is assistant. "
    "This correctly labels all 279 exchanges in a typical session."
)

# ── 8. Autonomous Triggers ──
pdf.add_page()
pdf.section_title("8. Autonomous Triggers")
pdf.sub_title("8.1 On Session Close/Compaction")
pdf.body_text(
    "The experimental.hook.session_completed fires automatically on every session close "
    "or compaction. This is configured once in opencode.json and requires no user action. "
    "It triggers the capture engine which writes a permanent lake entry and updates latest.json."
)
pdf.sub_title("8.2 On New Window Open")
pdf.code_block('"instructions": ["context_lake/latest.json"]')
pdf.body_text(
    "Every new opencode window loads latest.json as context. The file is read once "
    "at window creation time. The LLM sees: pipeline progress, git state, conversation "
    "summary (goal, topics, done/pending counts), agent statuses, and recent sessions."
)

# ── 9. Data Flow ──
pdf.add_page()
pdf.section_title("9. Data Flow & Survivability")
pdf.body_text("The complete lifecycle of context through the Lake:")
pdf.ln(4)
pdf.set_font("CourierCustom" if os.path.exists(COURIER) else "Courier", "", 9)
flow = (
    "NEW WINDOW            SESSION CLOSE              CRASH/REBOOT\n"
    "    |                      |                          |\n"
    "    v                      v                          v\n"
    "opencode.json         experimental.hook           disk persists\n"
    "  instructions         session_completed            all files\n"
    "    |                      |\n"
    "    v                      v\n"
    "latest.json loaded    capture.py runs\n"
    "  into LLM context      |\n"
    "    |                   v\n"
    "    |              permanent entry\n"
    "    |              lake/YYYY-MM-DD/...\n"
    "    |              + updates latest.json\n"
    "    |              + updates latest.md\n"
    "    |\n"
    "    v\n"
    "New window sees:\n"
    "  - Pipeline: 69% | 8/16 agents done\n"
    "  - Git: develop | 486bb6e | \"fix(qa-dashboard)...\"\n"
    "  - Session: 279 exchanges | goal | last query\n"
    "  - Topics: api, auth, deploy, test...\n"
    "  - State: 2 state files | 19 agents"
)
pdf.multi_cell(0, 4, flow)
pdf.set_font("Arial", "", 10)
pdf.ln(4)
pdf.sub_title("Survivability Matrix")
pdf.body_text(
    "| Event              | Context Lost? | Recovery |\n"
    "|--------------------|---------------|----------|\n"
    "| Window close       | No            | Permanent lake entry + latest.json updated |\n"
    "| Compaction         | No            | Permanent lake entry + latest.json updated |\n"
    "| Crash (unsaved)    | No            | latest.json from last session_completed |\n"
    "| Reboot             | No            | Disk persists all files |\n"
    "| New window         | No            | latest.json auto-loads via instructions |"
)

# ── 10. Key Design Decisions ──
pdf.add_page()
pdf.section_title("10. Key Design Decisions")
decisions = [
    ("File-based over DB",
     "No SQLite, no server. Files survive compaction, crash, and reboot. "
     "The opencode DB was initially targeted for session tracking but was "
     "absent on this machine. The Lake degrades gracefully."),
    ("latest.json over lake directory per capture",
     "Only meaningful events (session close, manual capture) create permanent "
     "lake entries. latest.json is always the single source of truth."),
    ("Python stdlib over external packages",
     "Zero pip installs. All stdlib modules (os, sys, json, glob, re, datetime, etc). "
     "Works on any Python 3.10+ environment immediately."),
    ("Heuristic summary over LLM summary",
     "Regex + counting is instant, free, deterministic. No tokens consumed, "
     "no latency. Captures session goal, topics, done/pending indicators."),
    ("Filename sort over mtime sort",
     "Conversation files sorted by filename descending = chronologically. "
     "The naming convention (YYYYMMDD-HH-MM-SS) makes this reliable."),
    ("Session_completed hook over watch/background process",
     "OpenCode does not support on_start hooks. session_completed fires on "
     "every close/compact. Combined with instructions for on-open loading, "
     "this covers both critical moments. No background process needed."),
]
for idx, (title, desc) in enumerate(decisions, 1):
    pdf.sub_title(f"10.{idx} {title}")
    pdf.body_text(desc)

# ── 11. File Inventory ──
pdf.add_page()
pdf.section_title("11. File Inventory")
files = [
    ("context_lake/capture.py", "839 lines", "Core capture engine."),
    ("context_lake/config.json", "33 lines", "Generic configuration."),
    ("context_lake/latest.json", "~30 lines", "Always-fresh snapshot."),
    ("context_lake/latest.md", "~40 lines", "Human-readable mirror."),
    ("context_lake/lake/.../context.json", "varies", "Permanent history."),
    ("context_lake/lake/.../manifest.md", "varies", "Permanent summary."),
    ("context_lake/hooks/capture-on-agent.bat", "5 lines", "Agent completion hook."),
    ("context_lake/LAKE_ARCHITECTURE.drawio", "editable", "Architecture diagram."),
    ("opencode.json", "29 lines", "Plugin, instructions, hook config."),
    ("00_state_ledger/STATE_MATRIX.json", "1564 lines", "Pipeline state."),
    ("00_state_ledger/AGENT_REGISTRY.json", "~50 lines", "Agent definitions."),
    ("conversations/*.md", "various", "Full conversation files."),
]
for fname, size, desc in files:
    pdf.set_font("CourierCustom" if os.path.exists(COURIER) else "Courier", "", 8)
    pdf.cell(0, 5, f"{fname} ({size})", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Arial", "", 9)
    pdf.set_x(pdf.l_margin + 5)
    pdf.multi_cell(0, 4, desc)
    pdf.ln(1)

# ── 12. Configuration Reference ──
pdf.add_page()
pdf.section_title("12. Configuration Reference")
pdf.sub_title("config.json")
pdf.code_block(
    '{\n'
    '  "lake": {\n'
    '    "max_entries_per_dir": 1000,\n'
    '    "date_format": "%Y-%m-%d",\n'
    '    "datetime_format": "%Y-%m-%dT%H-%M-%S"\n'
    '  },\n'
    '  "capture": {\n'
    '    "state_file_patterns": [\n'
    '      "**/STATE_MATRIX*.json",\n'
    '      "**/*_STATE*.json",\n'
    '      "**/*_REGISTRY*.json",\n'
    '      "**/state_ledger/**/*.json",\n'
    '      "**/state/**/*.json"\n'
    '    ],\n'
    '    "conversation_dirs": ["conversations"],\n'
    '    "agent_dirs": [".opencode/agents"],\n'
    '    "git": {"enabled": true, "max_log_entries": 20}\n'
    '  },\n'
    '  "entry_name_template": "{datetime}_{window_name}"\n'
    "}"
)
pdf.sub_title("opencode.json (relevant sections)")
pdf.code_block(
    '{\n'
    '  "plugin": ["opencode-autosave-conversation"],\n'
    '  "instructions": ["context_lake/latest.json"],\n'
    '  "experimental": {\n'
    '    "hook": {\n'
    '      "session_completed": [\n'
    '        {"command": ["python", "context_lake/capture.py",\n'
    '                     "--window", "session-completed",\n'
    '                     "--project-root", "."]}\n'
    '      ]\n'
    '    }\n'
    '  }\n'
    "}"
)
pdf.sub_title("Key Configuration Points")
pdf.bullet("state_file_patterns: glob patterns for discovering pipeline state files")
pdf.bullet("conversation_dirs: where to look for autosave conversation files")
pdf.bullet("agent_dirs: directory containing opencode agent .md definitions")
pdf.bullet("git.max_log_entries: number of recent commits to capture (20 default)")
pdf.bullet("entry_name_template: format for permanent lake folder names")
pdf.bullet("All paths are relative to project root")

# ── Appendix A ──
pdf.add_page()
pdf.section_title("Appendix A: .drawio Architecture File")
pdf.body_text(
    "An editable draw.io version of the architecture block diagram is included at "
    "context_lake/LAKE_ARCHITECTURE.drawio. Open it in draw.io (app.diagrams.net) or "
    "VS Code with the Draw.io extension to view, edit, and export the diagram."
)
pdf.body_text(
    "The diagram shows the three-layer architecture: Input Sources (conversation files, "
    "state files, git, agent configs) feeding into the Capture Engine with its four "
    "internal stages (Discover, Extract, Summarize, Persist), which writes to Storage "
    "(latest.json, lake/, latest.md). The trigger layer (session_completed hook, "
    "instructions) orchestrates the flow."
)

# ── Save ──
output_path = os.path.join(SCRIPT_DIR, "LAKE_DESIGN.pdf")
try:
    pdf.output(output_path)
    print(f"\nPDF generated: {output_path}")
    print(f"Size: {os.path.getsize(output_path)} bytes")
    print(f"Pages: {pdf.page_no()}")
except Exception as e:
    print(f"ERROR: {e}")

# Cleanup
if os.path.exists(diagram_png):
    os.remove(diagram_png)
    print(f"Cleaned up: {diagram_png}")
