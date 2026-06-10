import os
import json
import tkinter as tk
from tkinter import ttk, messagebox
import threading
import subprocess

class PeteMartCockpit:
    def __init__(self, root):
        self.root = root
        self.root.title("🛸 ANTIGRAVITY 2.0 // OPENCODE CENTRAL SDLC COCKPIT")
        self.root.geometry("900x600")
        self.root.configure(bg="#1e1e1e")
        
        # Paths
        self.root_dir = "C:/SaaS-Engineering-Factory"
        self.matrix_path = os.path.join(self.root_dir, "00_state_ledger/STATE_MATRIX.json")
        
        # Apply Dark Mode Styles
        self.style = ttk.Style()
        self.style.theme_use('clam')
        self.style.configure(".", background="#1e1e1e", foreground="#ffffff", fieldbackground="#2d2d2d")
        self.style.configure("Treeview", background="#2d2d2d", foreground="#ffffff", fieldbackground="#2d2d2d", rowheight=25)
        self.style.map("Treeview", background=[('selected', '#007acc')])
        
        self.setup_ui()
        self.refresh_data()

    def setup_ui(self):
        # Top Telemetry Bar
        top_frame = tk.Frame(self.root, bg="#2d2d2d", height=60)
        top_frame.pack(fill=tk.X, side=tk.TOP, padx=5, pady=5)
        
        title_label = tk.Label(top_frame, text="PeteMart SDLC Mesh Controller", font=("Courier New", 14, "bold"), fg="#00ff00", bg="#2d2d2d")
        title_label.pack(side=tk.LEFT, padx=15, pady=15)
        
        # FIXED: Changed fg="#cyan" to fg="cyan"
        self.status_label = tk.Label(top_frame, text="SYSTEM STATUS: ONLINE", font=("Courier New", 10, "bold"), fg="cyan", bg="#2d2d2d")
        self.status_label.pack(side=tk.RIGHT, padx=15, pady=15)

        # Main Workspace Split
        main_frame = tk.Frame(self.root, bg="#1e1e1e")
        main_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # Left Side: Agent Registry Grid
        left_frame = tk.LabelFrame(main_frame, text=" 🤖 AGENT MESH MATRIX ", font=("Courier New", 10, "bold"), fg="#00ff00", bg="#1e1e1e", padx=10, pady=10)
        left_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        columns = ("agent_id", "pool", "status", "gate")
        self.tree = ttk.Treeview(left_frame, columns=columns, show="headings")
        self.tree.heading("agent_id", text="Agent Identity")
        self.tree.heading("pool", text="Execution Pool")
        self.tree.heading("status", text="Status")
        self.tree.heading("gate", text="Human Gate")
        
        self.tree.column("agent_id", width=220)
        self.tree.column("pool", width=100)
        self.tree.column("status", width=90)
        self.tree.column("gate", width=90)
        self.tree.pack(fill=tk.BOTH, expand=True)

        # Right Side: Control Actions Panel
        right_frame = tk.LabelFrame(main_frame, text=" 🎮 FACTORY OPERATIONS ", font=("Courier New", 10, "bold"), fg="#00ff00", bg="#1e1e1e", padx=10, pady=10)
        right_frame.pack(side=tk.RIGHT, fill=tk.Y, padx=5, pady=5)
        
        # Telemetry Text Display
        self.telemetry_box = tk.Text(right_frame, width=35, height=12, bg="#000000", fg="#00ff00", font=("Courier New", 9))
        self.telemetry_box.pack(fill=tk.X, pady=5)
        self.telemetry_box.insert(tk.END, "Initializing telemetry stream...\n")
        self.telemetry_box.config(state=tk.DISABLED)

        # Interaction Buttons
        btn_run_cloud = tk.Button(right_frame, text="⚡ Execute Agent 01 (Cloud)", bg="#007acc", fg="white", font=("Arial", 10, "bold"), height=2, command=lambda: self.trigger_opencode("cloud"))
        btn_run_cloud.pack(fill=tk.X, pady=8)
        
        btn_run_local = tk.Button(right_frame, text="🏠 Execute Agent 01 (Ollama Fallback)", bg="#d97706", fg="white", font=("Arial", 10, "bold"), height=2, command=lambda: self.trigger_opencode("local"))
        btn_run_local.pack(fill=tk.X, pady=8)
        
        btn_refresh = tk.Button(right_frame, text="🔄 Manual Ledger Sync", bg="#4b5563", fg="white", font=("Arial", 10), height=1, command=self.refresh_data)
        btn_refresh.pack(fill=tk.X, pady=8)

    def log_telemetry(self, message):
        self.telemetry_box.config(state=tk.NORMAL)
        self.telemetry_box.insert(tk.END, f"> {message}\n")
        self.telemetry_box.see(tk.END)
        self.telemetry_box.config(state=tk.DISABLED)

    def refresh_data(self):
        """Reads the actual STATE_MATRIX.json and updates the UI grid dynamically."""
        if not os.path.exists(self.matrix_path):
            self.log_telemetry("Error: STATE_MATRIX.json not found.")
            return

        try:
            with open(self.matrix_path, "r") as f:
                data = json.load(f)
            
            # Clear old rows
            for item in self.tree.get_children():
                self.tree.delete(item)
                
            # Populate updated metrics
            agents = data.get("agent_states", {})
            for agent, meta in agents.items():
                self.tree.insert("", tk.END, values=(agent, meta["pool"], meta["status"], meta["requires_human_approval"]))
                
            phase = data.get("pipeline_control", {}).get("current_phase", "unknown")
            self.status_label.config(text=f"ACTIVE PHASE: {phase.upper()}")
            self.log_telemetry("Ledger status synchronized successfully.")
        except Exception as e:
            self.log_telemetry(f"Read error: {str(e)}")

    def trigger_opencode(self, mode):
        """Spins up a background thread to call the real OpenCode CLI engine."""
        target_dir = os.path.join(self.root_dir, "01_front_office/01_ideation_agent")
        
        if mode == "cloud":
            cmd = ["opencode", "run", "--model", "google/gemini-2.5-pro"]
            self.log_telemetry("Routing prompt pass to cloud layer...")
        else:
            cmd = ["opencode", "run", "--model", "ollama/qwen3-coder:8b"]
            self.log_telemetry("Engaging local hardware failover...")

        def run_binary():
            try:
                # Runs command directly inside the Ideation Agent workspace
                process = subprocess.Popen(cmd, cwd=target_dir, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, shell=True)
                stdout, stderr = process.communicate()
                
                if process.returncode == 0:
                    self.root.after(0, lambda: self.log_telemetry("Execution complete. Artifact emitted."))
                else:
                    self.root.after(0, lambda: self.log_telemetry(f"CLI Error code {process.returncode}"))
                self.root.after(0, self.refresh_data)
            except Exception as e:
                self.root.after(0, lambda: self.log_telemetry(f"Failed to start: {str(e)}"))

        # FIXED: Changed run_routine to run_binary
        threading.Thread(target=run_binary, daemon=True).start()

if __name__ == "__main__":
    root = tk.Tk()
    app = PeteMartCockpit(root)
    root.mainloop()