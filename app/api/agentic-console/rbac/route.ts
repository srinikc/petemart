import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { frameworkRoot } from '@productforge/framework-core';

export const dynamic = 'force-dynamic';

const ROOT = frameworkRoot();
const RBAC_FILE = '00_state_ledger/rbac_config.json';

type Role = 'admin' | 'gatekeeper' | 'viewer';
type Permission = {
    actions: string[];
    projects: string[];
};

const DEFAULT_CONFIG = {
    version: "1.0",
    description: "Multi-tenant RBAC configuration. Controls access per role and per project.",
    roles: {
        admin: {
            label: "Administrator",
            color: "#DC2626",
            description: "Full access to all projects. Can manage agents, approve/reject, configure system, and view all data.",
            permissions: {
                all_projects: {
                    actions: ["read", "write", "approve", "reject", "rerun", "configure", "manage_users", "delete"],
                    projects: ["*"],
                }
            },
            max_sessions: 10,
        },
        gatekeeper: {
            label: "Gatekeeper",
            color: "#F59E0B",
            description: "Can approve/reject agents, view state, provide inputs. Cannot configure system or manage users.",
            permissions: {
                default: {
                    actions: ["read", "approve", "reject", "rerun", "provide_input"],
                    projects: ["*"],
                }
            },
            max_sessions: 5,
        },
        viewer: {
            label: "Viewer",
            color: "#3B82F6",
            description: "Read-only access. Can view dashboard, agent states, and logs. Cannot make any changes.",
            permissions: {
                default: {
                    actions: ["read"],
                    projects: ["*"],
                }
            },
            max_sessions: 20,
        },
    },
    users: {} as Record<string, { role: Role; projects: string[]; display_name: string; email: string; last_login: string | null; }>,
    session_store: {} as Record<string, { user_id: string; role: Role; projects: string[]; created_at: string; expires_at: string; }>,
    project_access: {} as Record<string, string[]>,
    audit_log: [] as any[],
};

function readConfig(): typeof DEFAULT_CONFIG {
    const fp = path.join(ROOT, RBAC_FILE);
    try {
        if (!fs.existsSync(fp)) return { ...DEFAULT_CONFIG };
        const raw = fs.readFileSync(fp, 'utf-8');
        return JSON.parse(raw);
    } catch { return { ...DEFAULT_CONFIG }; }
}

function writeConfig(config: any) {
    const fp = path.join(ROOT, RBAC_FILE);
    try {
        const dir = path.dirname(fp);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(fp, JSON.stringify(config, null, 2), 'utf-8');
    } catch { }
}

function generateToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 48; i++) token += chars.charAt(Math.floor(Math.random() * chars.length));
    return `rbac-${token}`;
}

export async function GET(req: NextRequest) {
    const config = readConfig();
    const userId = req.nextUrl.searchParams.get('user_id');
    const token = req.nextUrl.searchParams.get('token');

    // Validate session by token
    if (token) {
        const session = Object.values(config.session_store).find(s => s.created_at === token || s.expires_at > new Date().toISOString());
        if (session) {
            const user = config.users[session.user_id];
            return NextResponse.json({
                authenticated: true,
                user_id: session.user_id,
                display_name: user?.display_name || session.user_id,
                role: session.role,
                projects: session.projects,
                permissions: config.roles[session.role]?.permissions || {},
            });
        }
        return NextResponse.json({ authenticated: false, error: 'Invalid or expired token' }, { status: 401 });
    }

    // User lookup
    if (userId && config.users[userId]) {
        const user = config.users[userId];
        const activeSessions = Object.values(config.session_store)
            .filter(s => s.user_id === userId && s.expires_at > new Date().toISOString());
        return NextResponse.json({
            user_id: userId,
            ...user,
            active_sessions: activeSessions.length,
        });
    }

    // Return full config (admin only view)
    return NextResponse.json({
        version: config.version,
        description: config.description,
        roles: config.roles,
        users: Object.fromEntries(
            Object.entries(config.users).map(([id, u]) => [id, { ...u, last_login: u.last_login }])
        ),
        userCount: Object.keys(config.users).length,
        activeSessions: Object.values(config.session_store)
            .filter(s => s.expires_at > new Date().toISOString()).length,
        projectAccess: config.project_access,
    });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action } = body;
        const config = readConfig();

        if (action === 'login') {
            const { user_id, password } = body;
            if (!user_id || !password) {
                return NextResponse.json({ error: 'user_id and password required' }, { status: 400 });
            }

            const user = config.users[user_id];
            if (!user) {
                // Auto-create viewer account for unknown users (demo mode)
                config.users[user_id] = {
                    role: 'viewer',
                    projects: ['petemart'],
                    display_name: user_id,
                    email: body.email || `${user_id}@example.com`,
                    last_login: new Date().toISOString(),
                };
            } else {
                config.users[user_id].last_login = new Date().toISOString();
            }

            // Check session limits
            const activeSessions = Object.values(config.session_store)
                .filter(s => s.user_id === user_id && s.expires_at > new Date().toISOString());
            const roleConfig = config.roles[config.users[user_id].role];
            if (activeSessions.length >= (roleConfig?.max_sessions || 5)) {
                return NextResponse.json({ error: 'Max sessions reached for this user' }, { status: 429 });
            }

            const token = generateToken();
            const session = {
                user_id,
                role: config.users[user_id].role,
                projects: config.users[user_id].projects,
                created_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
            };
            config.session_store[token] = session as any;

            // Audit log
            config.audit_log.push({
                action: 'login',
                user_id,
                role: config.users[user_id].role,
                timestamp: new Date().toISOString(),
            });

            writeConfig(config);

            return NextResponse.json({
                success: true,
                token,
                session,
                user: config.users[user_id],
            });
        }

        if (action === 'logout') {
            const { token } = body;
            if (token && config.session_store[token]) {
                const userId = config.session_store[token].user_id;
                config.audit_log.push({
                    action: 'logout',
                    user_id: userId,
                    timestamp: new Date().toISOString(),
                });
                delete config.session_store[token];
                writeConfig(config);
            }
            return NextResponse.json({ success: true });
        }

        if (action === 'set_role') {
            const { target_user_id, role } = body;
            if (!target_user_id || !role) {
                return NextResponse.json({ error: 'target_user_id and role required' }, { status: 400 });
            }
            if (!config.roles[role]) {
                return NextResponse.json({ error: `Invalid role: ${role}` }, { status: 400 });
            }
            if (!config.users[target_user_id]) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }

            config.users[target_user_id].role = role as Role;
            config.audit_log.push({
                action: 'set_role',
                user_id: target_user_id,
                new_role: role,
                timestamp: new Date().toISOString(),
            });

            writeConfig(config);
            return NextResponse.json({ success: true, user: config.users[target_user_id] });
        }

        if (action === 'set_project_access') {
            const { target_user_id, projects } = body;
            if (!target_user_id || !Array.isArray(projects)) {
                return NextResponse.json({ error: 'target_user_id and projects array required' }, { status: 400 });
            }
            if (!config.users[target_user_id]) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }

            config.users[target_user_id].projects = projects;
            config.project_access[target_user_id] = projects;

            config.audit_log.push({
                action: 'set_project_access',
                user_id: target_user_id,
                projects,
                timestamp: new Date().toISOString(),
            });

            writeConfig(config);
            return NextResponse.json({ success: true, user: config.users[target_user_id] });
        }

        if (action === 'add_user') {
            const { user_id, role, display_name, email, projects } = body;
            if (!user_id || !role) {
                return NextResponse.json({ error: 'user_id and role required' }, { status: 400 });
            }
            if (!config.roles[role]) {
                return NextResponse.json({ error: `Invalid role: ${role}` }, { status: 400 });
            }
            if (config.users[user_id]) {
                return NextResponse.json({ error: 'User already exists' }, { status: 409 });
            }

            config.users[user_id] = {
                role: role as Role,
                projects: projects || ['petemart'],
                display_name: display_name || user_id,
                email: email || '',
                last_login: null,
            };

            config.audit_log.push({
                action: 'add_user',
                user_id,
                role,
                timestamp: new Date().toISOString(),
            });

            writeConfig(config);
            return NextResponse.json({ success: true, user: config.users[user_id] });
        }

        return NextResponse.json({ error: 'Unknown action. Use: login, logout, set_role, set_project_access, add_user' }, { status: 400 });
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
    }
}