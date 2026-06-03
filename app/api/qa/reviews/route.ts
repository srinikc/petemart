import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const AGENT_DIRS: Record<string, string> = {
  '01_ideation_agent': 'agents/01_front_office/01_ideation_agent',
  '02_requirement_agent': 'agents/01_front_office/02_requirement_agent',
  '03_architect_agent': 'agents/02_engineering_specs/03_architect_agent',
  '04_prototype_agent': 'agents/02_engineering_specs/04_prototype_agent',
  '05_program_mgmt_agent': 'agents/02_engineering_specs/05_program_mgmt_agent',
  '06_infra_devops_agent': 'agents/03_execution_workspace/06_infra_devops_agent',
  '07a_ui_agent': 'agents/03_execution_workspace/07a_ui_agent',
  '07b_api_agent': 'agents/03_execution_workspace/07b_api_agent',
  '07c_backend_db_agent': 'agents/03_execution_workspace/07c_backend_db_agent',
  '07d_integration_agent': 'agents/03_execution_workspace/07d_integration_agent',
  '08_qa_agent': 'agents/03_execution_workspace/08_qa_agent',
  '09_production_agent': 'agents/03_execution_workspace/09_production_agent',
  '10_tech_pub_agent': 'agents/03_execution_workspace/10_tech_pub_agent',
  '11_customer_onboarding_agent': 'agents/03_execution_workspace/11_customer_onboarding_agent',
  '12_marketing_agent': 'agents/03_execution_workspace/12_marketing_agent',
  '13_maintenance_agent': 'agents/03_execution_workspace/13_maintenance_agent',
  '14_finops_agent': 'agents/03_execution_workspace/14_finops_agent',
  '15_secrets_compliance_agent': 'agents/03_execution_workspace/15_secrets_compliance_agent',
};

const ROLE_MAP: Record<string, string> = {
  '01_ideation_agent': 'Senior Product Marketing Manager',
  '02_requirement_agent': 'Senior Product Manager / VP of Product',
  '03_architect_agent': 'Senior Solution Architect / CTO',
  '04_prototype_agent': 'Senior Prototyping Engineer / Tech Lead',
  '05_program_mgmt_agent': 'Senior Program Manager / Delivery Head',
  '06_infra_devops_agent': 'Senior DevOps Architect / Platform Engineer',
  '07a_ui_agent': 'Senior Frontend Engineer / UI Architect',
  '07b_api_agent': 'Senior Backend Engineer / API Architect',
  '07c_backend_db_agent': 'Senior Database Engineer / DBA',
  '07d_integration_agent': 'Senior Integration Engineer / Systems Architect',
  '08_qa_agent': 'Senior QA Architect / Test Manager',
  '09_production_agent': 'Senior Release Manager / DevOps Lead',
  '10_tech_pub_agent': 'Senior Technical Writer / Documentation Lead',
  '11_customer_onboarding_agent': 'Senior Customer Success Manager / Operations Lead',
  '12_marketing_agent': 'Senior Marketing Manager / Growth Lead',
  '13_maintenance_agent': 'Senior SRE / Support Lead',
  '14_finops_agent': 'Senior FinOps Analyst / Cloud Cost Lead',
  '15_secrets_compliance_agent': 'Senior Security Engineer / Compliance Officer',
};

export async function GET() {
  const root = process.cwd();
  const reviews: any[] = [];

  for (const [agentId, relPath] of Object.entries(AGENT_DIRS)) {
    const logPath = path.join(root, relPath, 'CODE_REVIEW_LOG.json');
    try {
      if (!fs.existsSync(logPath)) {
        reviews.push({
          agent_id: agentId,
          reviewer_role: ROLE_MAP[agentId] || 'Unknown',
          status: 'missing',
          review_gate_passed: false,
          fix_gate_passed: false,
          last_review_status: null,
          findings_count: 0,
          fixes_count: 0,
          pr_number: null,
          findings: [],
          notes: 'CODE_REVIEW_LOG.json not found',
        });
        continue;
      }

      const raw = fs.readFileSync(logPath, 'utf-8');
      const data = JSON.parse(raw);

      const allFindings: any[] = [];
      const allFixes: any[] = [];
      let lastStatus: string | null = null;
      let prNumber: string | null = null;

      for (const entry of data.review_log || []) {
        lastStatus = entry.status;
        if (entry.pr_number) prNumber = entry.pr_number;
        for (const f of entry.findings || []) {
          const matchingFix = (entry.fixes || []).find((fx: any) => fx.finding_id === f.finding_id);
          allFindings.push({
            ...f,
            fix_description: matchingFix?.fix_description || null,
            fix_commit: matchingFix?.fix_commit || null,
            fix_status: matchingFix?.fix_status || 'pending',
          });
        }
        for (const fx of entry.fixes || []) {
          allFixes.push(fx);
        }
      }

      reviews.push({
        agent_id: agentId,
        reviewer_role: ROLE_MAP[agentId] || 'Unknown',
        status: data.agent_0_verification?.review_gate_passed ? 'approved' : 'pending',
        review_gate_passed: data.agent_0_verification?.review_gate_passed || false,
        fix_gate_passed: data.agent_0_verification?.fix_gate_passed || false,
        last_review_status: lastStatus,
        findings_count: allFindings.length,
        fixes_count: allFixes.length,
        pr_number: prNumber,
        findings: allFindings,
        notes: data.agent_0_verification?.notes || null,
      });
    } catch (err: any) {
      reviews.push({
        agent_id: agentId,
        reviewer_role: ROLE_MAP[agentId] || 'Unknown',
        status: 'error',
        review_gate_passed: false,
        fix_gate_passed: false,
        last_review_status: null,
        findings_count: 0,
        fixes_count: 0,
        pr_number: null,
        findings: [],
        notes: `Error reading CODE_REVIEW_LOG.json: ${err.message}`,
      });
    }
  }

  return NextResponse.json({ reviews });
}
