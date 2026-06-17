const fs = require('fs');
const path = require('path');
const { SupervisorAgent } = require('./SupervisorAgent');
const { AgentRuntime } = require('./AgentRuntime');
const vlog = require('./VerboseLogger');

const ROOT = process.cwd();
const STATE_PATH = path.join(ROOT, '00_state_ledger/STATE_MATRIX.json');
const PID_PATH = path.join(ROOT, '00_state_ledger/SUPERVISOR_DAEMON.pid');

class SupervisorSingleton {
  constructor() {
    this._pid = null;
    this._lastCycle = 0;
  }

  isRunning() {
    if (!fs.existsSync(PID_PATH)) return false;
    try {
      const pid = parseInt(fs.readFileSync(PID_PATH, 'utf-8').trim(), 10);
      if (!pid || pid <= 0) return false;
      // Check if process exists (Windows)
      try {
        process.kill(pid, 0);
        return true;
      } catch {
        return false;
      }
    } catch {
      return false;
    }
  }

  claim() {
    if (this.isRunning()) {
      vlog.write('SINGLETON', '00_supervisor_agent', 'Another supervisor instance is running');
      return false;
    }
    try {
      fs.writeFileSync(PID_PATH, String(process.pid), 'utf-8');
      this._pid = process.pid;
      vlog.write('SINGLETON', '00_supervisor_agent', `PID ${process.pid} claimed`);
      return true;
    } catch (err) {
      vlog.write('SINGLETON', '00_supervisor_agent', `PID claim failed: ${err.message}`);
      return false;
    }
  }

  release() {
    try {
      if (fs.existsSync(PID_PATH)) fs.unlinkSync(PID_PATH);
      this._pid = null;
    } catch {}
  }

  async runOnce() {
    if (!this.claim()) return { skipped: true, reason: 'Another instance running' };
    try {
      const supervisor = new SupervisorAgent();
      const state = supervisor.readState();
      if (!state) return { skipped: true, reason: 'No state' };

      const audit = supervisor.runComplianceAudit(state);
      const supCtrl = state.supervisor_control?.agent_00_supervisor || {};
      const cycleCount = (supCtrl.cycle_count || 0) + 1;

      // Find and run eligible agents
      const eligible = this._findEligible(state);
      let launched = 0;

      for (const agent of eligible.slice(0, 1)) {
        vlog.write('SINGLETON', agent.id, `Dispatching agent`);
        state.agent_states[agent.id].status = 'in_progress';
        supervisor.saveState(state);

        const runtime = new AgentRuntime();
        const result = await runtime.runAgent(agent.id);

        vlog.write('SINGLETON', agent.id, `Result: ${result.status}`);
        launched++;
      }

      state.supervisor_control = state.supervisor_control || {};
      state.supervisor_control.agent_00_supervisor = {
        ...state.supervisor_control.agent_00_supervisor,
        cycle_count: cycleCount,
        last_cycle_timestamp: new Date().toISOString(),
      };

      supervisor.updateDashboard(state);
      supervisor.saveState(state);

      return { launched, cycle_count: cycleCount };
    } finally {
      this.release();
    }
  }

  _findEligible(state) {
    const eligible = [];
    for (const [id, agent] of Object.entries(state.agent_states || {})) {
      if (id === '00_supervisor_agent' || agent.disabled) continue;
      if (agent.status === 'approved' || agent.status === 'completed' || agent.status === 'failed') continue;
      if (agent.status === 'in_progress' || agent.status === 'active') continue;
      if (agent.requires_human_approval) continue;
      eligible.push({ id, ...agent });
    }
    return eligible;
  }
}

module.exports = { SupervisorSingleton };
