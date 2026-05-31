import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Run architecture PPT
with open('generate_architecture_ppt.py') as f:
    code = f.read()
code = code.replace(
    "os.path.expanduser('~/Desktop/PeteMart_Architecture_Design_Review.pptx')",
    "os.path.join(os.getcwd(), 'agents', '03_architect_agent', '03_architect_agent_FULL_PRESENTATION.pptx')"
)
exec(code)
print("Architecture PPT done")

# Run ideation PPT
with open('generate_ppt.py') as f:
    code = f.read()
code = code.replace(
    "os.path.expanduser('~/Desktop/PeteMart_Ideation_Requirements_Review.pptx')",
    "os.path.join(os.getcwd(), '01_front_office', '01_ideation_agent', '01_ideation_agent_FULL_PRESENTATION.pptx')"
)
exec(code)
print("Ideation PPT done")

# Program Mgmt PPT was already done - copy it
import shutil
src = os.path.expanduser('~/Desktop/PeteMart_Program_Management_Review.pptx')
dst = os.path.join(os.getcwd(), 'agents', '05_program_mgmt_agent', '05_program_mgmt_agent_FULL_PRESENTATION.pptx')
if os.path.exists(src):
    shutil.copy2(src, dst)
    print(f"Copied Program Mgmt PPT to {dst}")
else:
    # Regenerate
    with open('generate_program_mgmt_ppt.py') as f:
        code = f.read()
    code = code.replace(
        "os.path.expanduser('~/Desktop/PeteMart_Program_Management_Review.pptx')",
        "os.path.join(os.getcwd(), 'agents', '05_program_mgmt_agent', '05_program_mgmt_agent_FULL_PRESENTATION.pptx')"
    )
    exec(code)
    print("Program Mgmt PPT regenerated")
