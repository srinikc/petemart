# Context Lake Entry — 2026-06-02

**Window:** Context-Lake-Ready
**Project:** petemart-agentic-framework
**Captured At:** 2026-06-02T08:36:46.259083+00:00

## Agent Configs (19 found)
- **00_supervisor_agent**: Pipeline Orchestrator & State Machine Controller. Manages the lifecycle of all 15 worker agents. Enforces dependency chains, pool scheduling, loop guardrails, and HITL gates. Does NOT make product decisions.
- **01_ideation_agent**: Product Marketing Manager & Hyper-Local Retail Economics Specialist for Old Bangalore Pete markets. Use when researching traditional physical merchants, designing e-commerce UVP, or generating synthetic retail datasets.
- **02_requirement_agent**: Enterprise Product Manager / Product Owner that translates idea proposals into PRDs with Requirement IDs, user personas, workflows, and cost boundaries. Use after ideation is approved.
- **03_architect_agent**: Senior Enterprise Solution Architect producing technical blueprints, API-first strategy, caching, message-queue, event-driven architecture, and cost models. Use after PRD is approved.
- **04_prototype_agent**: Senior Prototyping Engineer / Concept Verification Engine that builds launchable POC workspaces with realistic sample datasets. Use after architecture specs are approved.
- **05_program_mgmt_agent**: Senior Agile Program Manager & Scrum Master that decomposes scope into Epics, Features, User Stories, and tasks with SDLC timelines and Jira integration. Use after POC is validated.
- **06_infra_devops_agent**: DevOps Systems Architect & Core Supply Chain Automation Engine for GitHub branching, Docker/K8s, CI/CD pipelines, and rollback protocols. Use for infrastructure and deployment pipeline tasks.
- **07a_ui_agent**: Frontend & Mobile Interface Engineer designing responsive wireframes, HTML/CSS, and mobile UI modules with localization and unit tests. Use for frontend implementation tasks.
- **07b_api_agent**: Interface Connection Engineer designing and implementing RESTful API specs, mock endpoints, and secure data-routing code with unit tests. Use for API layer tasks.
- **07c_backend_db_agent**: Data Infrastructure & Storage Engineer provisioning databases, schemas, indexes, caching strategies, and migration scripts. Use for database and data layer tasks.
- **07d_integration_agent**: Systems Assembly Engineer that stitches together frontend, API, and backend components into a fully integrated software package with security auditing. Use for integration and end-to-end assembly.
- **08_qa_agent**: Senior Test Architect & Quality Gatekeeper that builds end-to-end QA test plans, automated test suites, and Go/No-Go recommendations. Use for QA and test execution.
- **09_production_agent**: Release & Deployment Coordinator that manages build and deployment across Staging and Production with final Go/No-Go validation. Use for release management and deployment.
- **10_tech_pub_agent**: Technical Documentation & Localization Specialist that writes help files, installation guides, release notes, and i18n/localization assets. Use for documentation and translation tasks.
- **11_customer_onboarding_agent**: CRM & Operations Specialist that designs customer acquisition pipelines, account provisioning, and merchant onboarding with support ticket ingestion. Use for onboarding and CRM workflows.
- **12_marketing_agent**: Growth & Traffic Automation Specialist that generates social media assets, SEO strategies, video scripts, and multi-channel campaign architectures. Use for marketing and growth tasks.
- **13_maintenance_agent**: Autonomous Remediation & Healing Agent that monitors production logs, isolates errors, formulates fixes, and validates patches through the DevOps pipeline. Use for system maintenance and hotfixes.
- **14_finops_agent**: Cloud Cost Optimization Guardrail that monitors infrastructure spend, LLM token consumption, and enforces budget boundaries with constraint flags. Use for cost tracking and FinOps.
- **15_secrets_compliance_agent**: Security Guardrail that scans all repos, branches, and container configs for exposed secrets, API keys, and compliance variances. Use for security auditing and secrets management.

## State Files (2 found)
- **00_state_ledger\STATE_MATRIX.json** → status: 69
- **00_state_ledger\AGENT_REGISTRY.json** → status: ?

## Conversation Files (6 recent)
- 20260602-08-15-02-New-session-2026-06-02T02-45-0.md (1637190 bytes, modified 2026-06-02T07:17:46)
- 20260601-09-32-39-New-session-2026-06-01T04-02-3.md (2332701 bytes, modified 2026-06-01T18:10:18)
- 20260531-23-39-44-New-session-2026-05-31T18-09-4.md (356 bytes, modified 2026-05-31T18:20:35)
- 20260531-23-21-09-Reading-session_checkpoint.md (205113 bytes, modified 2026-05-31T17:59:31)
- 20260531-15-44-12-Apply-pending-updates.md (5455450 bytes, modified 2026-05-31T17:50:46)
- 20260531-14-25-16-New-session-2026-05-31T08-55-1.md (1552262 bytes, modified 2026-06-02T08:23:40)

## Last Window Messages (5 recent)
<details><summary>Expand</summary>
  ### [Files](#files)

  Use `{file:path/to/file}` to substitute the contents of a file:

  opencode.json

  ```
  {  "$schema": "https://opencode.ai/config.json",  "instructions": ["./custom-instructions.md"],  "provider": {    "openai": {      "options": {        "apiKey": "{file:~/.secrets/openai-key}"      }    }  }}
  ```

  File paths can be:

  -   Relative to the config file directory
  -   Or absolute paths starting with `/` or `~`

  These are useful for:

  -   Keeping sensitive data like API keys in separate files.
  -   Including large instruction files without cluttering your config.
  -   Sharing common configuration snippets across multiple config files.

  [Edit page](https://github.com/anomalyco/opencode/edit/dev/packages/web/src/content/docs/config.mdx)[Found a bug? Open an issue](https://github.com/anomalyco/opencode/issues/new)[Join our Discord community](https://opencode.ai/discord) Select language EnglishالعربيةBosanskiDanskDeutschEspañolFrançaisItaliano日本語한국어Norsk BokmålPolskiPortuguês (Brasil)РусскийไทยTürkçe简体中文繁體中文 

  © [Anomaly](https://anoma.ly)

  Last updated: Jun 1, 2026
  ```

  #### 🔧 Tool: bash
  **Status:** completed
  **Title:** Check for run scripts or startup patterns in opencode.exe

  **Input:**
  ```json
  {
    "description": "Check for run scripts or startup patterns in opencode.exe",
    "command": "Get-ChildItem -LiteralPath \"C:\\Users\\ADMIN\\.local\\share\\opencode\" -ErrorAction SilentlyContinue -Depth 1 | Select-Object FullName, Length, LastWriteTime | Format-Table -AutoSize"
  }
  ```

  **Output:**
  ```

  FullName                                                                         Length   LastWriteTime        
  --------                                                                         ------   -------------        
  C:\Users\ADMIN\.local\share\opencode\log                                                  6/2/2026 8:14:36 AM  
  C:\Users\ADMIN\.local\share\opencode\repos                                                5/16/2026 4:46:08 PM 
  C:\Users\ADMIN\.local\share\opencode\storage                                              5/16/2026 5:41:43 PM 
  C:\Users\ADMIN\.local\share\opencode\tool-output                                          6/2/2026 12:43:52 PM 
  C:\Users\ADMIN\.local\share\opencode\auth.json                                   123      5/31/2026 11:38:52 PM
  C:\Users\ADMIN\.local\share\opencode\opencode.db                                 43769856 6/2/2026 12:47:43 PM 
  C:\Users\ADMIN\.local\share\opencode\opencode.db-shm                             32768    5/30/2026 10:43:08 PM
  C:\Users\ADMIN\.local\share\opencode\opencode.db-wal                             4194192  6/2/2026 12:47:43 PM 
  C:\Users\ADMIN\.local\share\opencode\log\2026-05-31T030122.log                   1212164  5/31/2026 2:24:48 PM 
  C:\Users\ADMIN\.local\share\opencode\log\2026-05-31T085451.log                   1015101  6/1/2026 8:14:03 PM  
  C:\Users\ADMIN\.local\share\opencode\log\2026-05-31T101358.log                   1701     5/31/2026 3:44:01 PM 
  C:\Users\ADMIN\.local\share\opencode\log\2026-05-31T101359.log                   13826045 5/31/2026 11:20:51 PM
  C:\Users\ADMIN\.local\share\opencode\log\2026-05-31T175056.log                   1701     5/31/2026 11:21:04 PM
  C:\Users\ADMIN\.local\share\opencode\log\2026-05-31T175057.log                   1328518  5/31/2026 11:38:23 PM
  C:\Users\ADMIN\.local\share\opencode\log\2026-05-31T180834.log                   3770     5/31/2026 11:38:52 PM
  C:\Users\ADMIN\.local\share\opencode\log\2026-05-31T180858.log                   101661   6/1/2026 9:31:27 AM  
  C:\Users\ADMIN\.local\share\opencode\log\2026-06-01T040140.log                   9528061  6/2/2026 8:14:20 AM  
  C:\Users\ADMIN\.local\share\opencode\log\2026-06-02T024435.log                   1685     6/2/2026 8:14:42 AM  
  C:\Users\ADMIN\.local\share\opencode\log\2026-06-02T024436.log                   1370990  6/2/2026 8:52:21 AM  
  C:\Users\ADMIN\.local\share\opencode\storage\session_diff                                 6/2/2026 12:38:39 PM 
  C:\Users\ADMIN\.local\share\opencode\storage\migration                           1        5/16/2026 5:41:43 PM 
  C:\Users\ADMIN\.local\share\opencode\tool-output\tool_e7555d3ed001a0FCeCTI11qJPO 56320    5/30/2026 1:33:39 AM 
  C:\Users\ADMIN\.local\share\opencode\tool-output\tool_e785e6100001TDMc8jwrV6JPPZ 448916   5/30/2026 3:41:56 PM 
  C:\Users\ADMIN\.local\share\opencode\tool-output\tool_e789e213d001KXTRxIIV49rS04 105834   5/30/2026 4:51:29 PM 
  C:\Users\ADMIN\.local\share\opencode\tool-output\tool_e790eb083001OLPihAj87fJXl6 86667    5/30/2026 6:54:26 PM 
  C:\Users\ADMIN\.local\share\opencode\tool-output\tool_e7925f79d001QL0bfgAoA15Oqd 3914478  5/30/2026 7:21:29 PM 
  C:\Users\ADMIN\.local\share\opencode\tool-output\tool_e7928a3520018j5nmrMPE5QB7T 1150059  5/30/2026 7:27:38 PM 
  C:\Users\ADMIN\.local\share\opencode\tool-output\tool_e7933869e001YNAccDgRH7eEQz 492452   5/30/2026 7:39:12 PM 
  C:\Users\ADMIN\.local\share\opencode\tool-output\tool_e7d3fe48a001ee4uY1UwtMmue9 63882    5/31/2026 2:26:39 PM 
  C:\Users\ADMIN\.local\share\opencode\tool-output\tool_e7d7be8ec0017RKh5405HVrKbN 759303   5/31/2026 3:32:22 PM 
  C:\Users\ADMIN\.local\share\opencode\tool-output\tool_e7d7f56de001qirx7N2aaNfp6m 108749   5/31/2026 3:35:58 PM 
  C:\Users\ADMIN\.local\share\opencode\tool-output\tool_e7d7f5dee001TwvRU1tSUPHPEK 209584   5/31/2026 3:36:00 PM 
  C:\Users\ADMIN\.local\share\opencode\tool-output\tool_e7da50e8f0011ypPUT81xm7fgq 2004210  5/31/2026 4:17:10 PM 
  C:\Users\ADMIN\.local\share\opencode\tool-output\tool_e7e2af868001SHpl1KMa8RALoZ 113439   5/31/2026 6:43:49 PM 
  C:\Users\ADMIN\.local\share\opencode\tool-output\tool_e7e4a3133001Xl1k5qhsJR2wFa 21004    5/31/2026 7:17:32 PM 
  C:\Users\ADMIN\.local\share\opencode\tool-output\tool_e7e4e420a001jMjbFP3txqYUTT 31901    5/31/2026 7:21:58 PM 
  C:\Users\ADMIN\.local\share\opencode\tool-output\tool_e7e597447001MKLB6k7Rn5ZDJJ 38130    5/31/2026 7:34:12 PM 
  C:\Users\ADMIN\.local\share\opencode\tool-output\tool_e7e5a8480001YfDXxRZHMRUpmP 148491   5/31/2026 7:35:21 PM 
  C:\Users\ADMIN\.local\share\opencode\tool-output\tool_e7ea99451001T7lj9NDbDJ93mQ 38173    5/31/2026 9:01:43 PM 
  C:\Users\ADMIN\.local\share\opencode\tool-output\tool_e7ea9a2f10010CbtaVKo3No2aX 90312    5/31/2026 9:01:47 PM 
  C:\Users\ADMIN\.local\share\opencode\tool-output\tool_e7ee3ce680013a3uPqvnIbdZZQ 90312    5/31/2026 10:05:19 PM
  C:\Users\ADMIN\.local\share\opencode\tool-output\tool_e7ee65db5001QTAOsotE1w4YOA 55314    5/31/2026 10:08:07 PM
  C:\Users\ADMIN\.local\share\opencode\tool-output\tool_e7ee703ab001GZH31sXpq7v558 74147    5/31/2026 10:08:49 PM
  C:\Users\ADMIN\.local\share\opencode\tool-output\tool_e7ef1a775001lQKiF6EijSu1aS 296361   5/31/2026 10:20:26 PM
  C:\Users\ADMIN\.local\share\opencode\tool-output\tool_e7ef33c9f001gsiApk614xnYue 78916    5/31/2026 10:22:10 PM
  C:\Users\ADMIN\.local\share\opencode\tool-output\tool_e83a512e300140dTI2UQZrPMfu 51710    6/1/2026 8:14:54 PM  
  C:\Users\ADMIN\.local\share\opencode\tool-output\tool_e83b4aeb6001P5rjDRlFFALnWt 75368    6/1/2026 8:31:57 PM  
  C:\Users\ADMIN\.local\share\opencode\tool-output\tool_e83b69044001cOZEA1dggjDUqZ 87274    6/1/2026 8:34:00 PM  
  C:\Users\ADMIN\.local\share\opencode\tool-output\tool_e83e036e4001A9xSN8FkclgY0Z 53414    6/1/2026 9:19:29 PM  
  C:\Users\ADMIN\.local\share\opencode\tool-output\tool_e844e3a22001R55NuadSIWgybV 174092   6/1/2026 11:19:39 PM 
  C:\Users\ADMIN\.local\share\opencode\tool-output\tool_e86a4c15f001qbTMWLqWiXngCU 63156    6/2/2026 10:13:25 AM 
  C:\Users\ADMIN\.local\share\opencode\tool-output\tool_e872a6e89001JhpRksO4ud9Fit 446012   6/2/2026 12:39:41 PM 
  C:\Users\ADMIN\.local\share\opencode\tool-output\tool_e872b2671001U9yjHYrBkswxq2 297139   6/2/2026 12:40:22 PM 
  C:\Users\ADMIN\.local\share\opencode\tool-output\tool_e872b31b0001zkRFU43sBhJn5m 7145177  6/2/2026 12:42:31 PM 
  C:\Users\ADMIN\.local\share\opencode\tool-output\tool_e872e810a001cOEHfgw3G24rRV 240554   6/2/2026 12:44:05 PM 



  ```

  *[step-finish part]*

  #### 🤖 Assistant
  *2026-06-02 13:53:39*

  *[step-start part]*

  💭 **Reasoning:**

  <details>
  <summary>Click to expand reasoning</summary>

  Now let me also look at the plugins documentation for hooks, and check if there's a `hooks` or `postinstall` mechanism at the platform level. Let me also check the `experimental.hook` configuration options by looking at the opencode schema itself.

  </details>

  Let me fetch the opencode config schema directly and check for any other hook-related documentation.

  #### 🔧 Tool: webfetch
  **Status:** completed
  **Title:** https://opencode.ai/config.json (application/json)

  **Input:**
  ```json
  {
    "format": "text",
    "url": "https://opencode.ai/config.json"
  }
  ```

  **Output:**
  ```
  {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$ref": "#/$defs/Config",
    "$defs": {
      "LogLevel": {
        "type": "string",
        "enum": [
          "DEBUG",
          "INFO",
          "WARN",
          "ERROR"
        ],
        "description": "Log level"
      },
      "ServerConfig": {
        "type": "object",
        "properties": {
          "port": {
            "exclusiveMinimum": 0,
            "type": "integer",
            "maximum": 9007199254740991,
            "description": "Port to listen on"
          },
          "hostname": {
            "type": "string",
            "description": "Hostname to listen on"
          },
          "mdns": {
            "type": "boolean",
            "description": "Enable mDNS service discovery"
          },
          "mdnsDomain": {
            "type": "string",
            "description": "Custom domain name for mDNS service (default: opencode.local)"
          },
          "cors": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "description": "Additional domains to allow for CORS"
          }
        },
        "additionalProperties": false
      },
      "ReferenceConfigEntry": {
        "anyOf": [
          {
            "type": "string"
          },
          {
            "type": "object",
            "properties": {
              "repository": {
                "type": "string",
                "description": "Git repository URL, host/path reference, or GitHub owner/repo shorthand"
              },
              "branch": {
                "type": "string",
                "description": "Branch or ref Scout should clone and inspect"
              }
            },
            "required": [
              "repository"
            ],
            "additionalProperties": false
          },
          {
            "type": "object",
            "properties": {
              "path": {
                "type": "string",
                "description": "Absolute path, ~/ path, or workspace-relative path to a local reference directory"
              }
            },
            "required": [
              "path"
            ],
            "additionalProperties": false
          }
        ]
      },
      "ReferenceConfig": {
        "type": "object",
        "additionalProperties": {
          "$ref": "#/$defs/ReferenceConfigEntry"
        }
      },
      "PermissionActionConfig": {
        "type": "string",
        "enum": [
          "ask",
          "allow",
          "deny"
        ]
      },
      "PermissionObjectConfig": {
        "type": "object",
        "additionalProperties": {
          "$ref": "#/$defs/PermissionActionConfig"
        }
      },
      "PermissionRuleConfig": {
        "anyOf": [
          {
            "$ref": "#/$defs/PermissionActionConfig"
          },
          {
            "$ref": "#/$defs/PermissionObjectConfig"
          }
        ]
      },
      "PermissionConfig": {
        "anyOf": [
          {
            "$ref": "#/$defs/PermissionActionConfig"
          },
          {
            "type": "object",
            "properties": {
              "read": {
                "$ref": "#/$defs/PermissionRuleConfig"
              },
              "edit": {
                "$ref": "#/$defs/PermissionRuleConfig"
              },
              "glob": {
                "$ref": "#/$defs/PermissionRuleConfig"
              },
              "grep": {
                "$ref": "#/$defs/PermissionRuleConfig"
              },
              "list": {
                "$ref": "#/$defs/PermissionRuleConfig"
              },
              "bash": {
                "$ref": "#/$defs/PermissionRuleConfig"
              },
              "task": {
                "$ref": "#/$defs/PermissionRuleConfig"
              },
              "external_directory": {
                "$ref": "#/$defs/PermissionRuleConfig"
              },
              "todowrite": {
                "$ref": "#/$defs/PermissionActionConfig"
              },
              "question": {
                "$ref": "#/$defs/PermissionActionConfig"
              },
              "webfetch": {
                "$ref": "#/$defs/PermissionActionConfig"
              },
              "websearch": {
                "$ref": "#/$defs/PermissionActionConfig"
              },
              "repo_clone": {
                "$ref": "#/$defs/PermissionRuleConfig"
              },
              "repo_overview": {
                "$ref": "#/$defs/PermissionRuleConfig"
              },
              "lsp": {
                "$ref": "#/$defs/PermissionRuleConfig"
              },
              "doom_loop": {
                "$ref": "#/$defs/PermissionActionConfig"
              },
              "skill": {
                "$ref": "#/$defs/PermissionRuleConfig"
              }
            },
            "additionalProperties": {
              "$ref": "#/$defs/PermissionRuleConfig"
            }
          }
        ]
      },
      "AgentConfig": {
        "type": "object",
        "properties": {
          "model": {
            "type": "string",
            "$ref": "https://models.dev/model-schema.json#/$defs/Model"
          },
          "variant": {
            "type": "string",
            "description": "Default model variant for this agent (applies only when using the agent's configured model)."
          },
          "temperature": {
            "type": "number"
          },
          "top_p": {
            "type": "number"
          },
          "prompt": {
            "type": "string"
          },
          "tools": {
            "type": "object",
            "additionalProperties": {
              "type": "boolean"
            },
            "description": "@deprecated Use 'permission' field instead"
          },
          "disable": {
            "type": "boolean"
          },
          "description": {
            "type": "string",
            "description": "Description of when to use the agent"
          },
          "mode": {
            "type": "string",
            "enum": [
              "subagent",
              "primary",
              "all"
            ]
          },
          "hidden": {
            "type": "boolean",
            "description": "Hide this subagent from the @ autocomplete menu (default: false, only applies to mode: subagent)"
          },
          "options": {
            "type": "object"
          },
          "color": {
            "anyOf": [
              {
                "pattern": "^#[0-9a-fA-F]{6}$",
                "type": "string"
              },
              {
                "type": "string",
                "enum": [
                  "primary",
                  "secondary",
                  "accent",
                  "success",
                  "warning",
                  "error",
                  "info"
                ]
              }
            ],
            "description": "Hex color code (e.g., #FF5733) or theme color (e.g., primary)"
          },
          "steps": {
            "exclusiveMinimum": 0,
            "type": "integer",
            "maximum": 9007199254740991,
            "description": "Maximum number of agentic iterations before forcing text-only response"
          },
          "maxSteps": {
            "exclusiveMinimum": 0,
            "type": "integer",
            "maximum": 9007199254740991,
            "description": "@deprecated Use 'steps' field instead."
          },
          "permission": {
            "$ref": "#/$defs/PermissionConfig"
          }
        }
      },
      "ProviderConfig": {
        "type": "object",
        "properties": {
          "api": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "env": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "id": {
            "type": "string"
          },
          "npm": {
            "type": "string"
          },
          "whitelist": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "blacklist": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "options": {
            "type": "object",
            "properties": {
              "apiKey": {
                "type": "string"
              },
              "baseURL": {
                "type": "string"
              },
              "enterpriseUrl": {
                "type": "string",
                "description": "GitHub Enterprise URL for copilot authentication"
              },
              "setCacheKey": {
                "type": "boolean",
                "description": "Enable promptCacheKey for this provider (default false)"
              },
              "timeout": {
                "anyOf": [
                  {
                    "exclusiveMinimum": 0,
                    "type": "integer",
                    "maximum": 9007199254740991
                  },
                  {
                    "type": "boolean",
                    "enum": [
                      false
                    ]
                  }
                ],
                "description": "Timeout in milliseconds for full requests to this provider. Set to false to disable timeout."
              },
              "headerTimeout": {
                "anyOf": [
                  {
                    "exclusiveMinimum": 0,
                    "type": "integer",
                    "maximum": 9007199254740991
                  },
                  {
                    "type": "boolean",
                    "enum": [
                      false
                    ]
                  }
                ],
                "description": "Timeout in milliseconds to wait for response headers. Provider integrations may set defaults. Set to false to disable timeout."
              },
              "chunkTimeout": {
                "exclusiveMinimum": 0,
                "type": "integer",
                "maximum": 9007199254740991,
                "description": "Timeout in milliseconds between streamed SSE chunks for this provider. If no chunk arrives within this window, the request is aborted."
              }
            }
          },
          "models": {
            "type": "object",
            "additionalProperties": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "string"
                },
                "name": {
                  "type": "string"
                },
                "family": {
                  "type": "string"
                },
                "release_date": {
                  "type": "string"
                },
                "attachment": {
                  "type": "boolean"
                },
                "reasoning": {
                  "type": "boolean"
                },
                "temperature": {
                  "type": "boolean"
                },
                "tool_call": {
                  "type": "boolean"
                },
                "interleaved": {
                  "anyOf": [
                    {
                      "type": "boolean",
                      "enum": [
                        true
                      ]
                    },
                    {
                      "type": "object",
                      "properties": {
                        "field": {
                          "type": "string",
                          "enum": [
                            "reasoning_content",
                            "reasoning_details"
                          ]
                        }
                      },
                      "required": [
                        "field"
                      ],
                      "additionalProperties": false
                    }
                  ]
                },
                "cost": {
                  "type": "object",
                  "properties": {
                    "input": {
                      "type": "number"
                    },
                    "output": {
                      "type": "number"
                    },
                    "cache_read": {
                      "type": "number"
                    },
                    "cache_write": {
                      "type": "number"
                    },
                    "context_over_200k": {
                      "type": "object",
                      "properties": {
                        "input": {
                          "type": "number"
                        },
                        "output": {
                          "type": "number"
                        },
                        "cache_read": {
                          "type": "number"
                        },
                        "cache_write": {
                          "type": "number"
                        }
                      },
                      "required": [
                        "input",
                        "output"
                      ],
                      "additionalProperties": false
                    }
                  },
                  "required": [
                    "input",
                    "output"
                  ],
                  "additionalProperties": false
                },
                "limit": {
                  "type": "object",
                  "properties": {
                    "context": {
                      "type": "number"
                    },
                    "input": {
                      "type": "number"
                    },
                    "output": {
                      "type": "number"
                    }
                  },
                  "required": [
                    "context",
                    "output"
                  ],
                  "additionalProperties": false
                },
                "modalities": {
                  "type": "object",
                  "properties": {
                    "input": {
                      "type": "array",
                      "items": {
                        "type": "string",
                        "enum": [
                          "text",
                          "audio",
                          "image",
                          "video",
                          "pdf"
                        ]
                      }
                    },
                    "output": {
                      "type": "array",
                      "items": {
                        "type": "string",
                        "enum": [
                          "text",
                          "audio",
                          "image",
                          "video",
                          "pdf"
                        ]
                      }
                    }
                  },
                  "additionalProperties": false
                },
                "experimental": {
                  "type": "boolean"
                },
                "status": {
                  "type": "string",
                  "enum": [
                    "alpha",
                    "beta",
                    "deprecated",
                    "active"
                  ]
                },
                "provider": {
                  "type": "object",
                  "properties": {
                    "npm": {
                      "type": "string"
                    },
                    "api": {
                      "type": "string"
                    }
                  },
                  "additionalProperties": false
                },
                "options": {
                  "type": "object"
                },
                "headers": {
                  "type": "object",
                  "additionalProperties": {
                    "type": "string"
                  }
                },
                "variants": {
                  "type": "object",
                  "additionalProperties": {
                    "type": "object",
                    "properties": {
                      "disabled": {
                        "type": "boolean",
                        "description": "Disable this variant for the model"
                      }
                    }
                  },
                  "description": "Variant-specific configuration"
                }
              },
              "additionalProperties": false
            }
          }
        },
        "additionalProperties": false
      },
      "McpLocalConfig": {
        "type": "object",
        "properties": {
          "type": {
            "type": "string",
            "enum": [
              "local"
            ],
            "description": "Type of MCP server connection"
          },
          "command": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "description": "Command and arguments to run the MCP server"
          },
          "environment": {
            "type": "object",
            "additionalProperties": {
              "type": "string"
            },
            "description": "Environment variables to set when running the MCP server"
          },
          "enabled": {
            "type": "boolean",
            "description": "Enable or disable the MCP server on startup"
          },
          "timeout": {
            "exclusiveMinimum": 0,
            "type": "integer",
            "maximum": 9007199254740991,
            "description": "Timeout in ms for MCP server requests. Defaults to 5000 (5 seconds) if not specified."
          }
        },
        "required": [
          "type",
          "command"
        ],
        "additionalProperties": false
      },
      "McpOAuthConfig": {
        "type": "object",
        "properties": {
          "clientId": {
            "type": "string",
            "description": "OAuth client ID. If not provided, dynamic client registration (RFC 7591) will be attempted."
          },
          "clientSecret": {
            "type": "string",
            "description": "OAuth client secret (if required by the authorization server)"
          },
          "scope": {
            "type": "string",
            "description": "OAuth scopes to request during authorization"
          },
          "callbackPort": {
            "minimum": 1,
            "maximum": 65535,
            "type": "integer",
            "description": "Port for the local OAuth callback server (default: 19876). Shorthand for redirectUri when only the port needs changing. Ignored if redirectUri is set."
          },
          "redirectUri": {
            "type": "string",
            "description": "OAuth redirect URI (default: http://127.0.0.1:19876/mcp/oauth/callback)."
          }
        },
        "additionalProperties": false
      },
      "McpRemoteConfig": {
        "type": "object",
        "properties": {
          "type": {
            "type": "string",
            "enum": [
              "remote"
            ],
            "description": "Type of MCP server connection"
          },
          "url": {
            "type": "string",
            "description": "URL of the remote MCP server"
          },
          "enabled": {
            "type": "boolean",
            "description": "Enable or disable the MCP server on startup"
          },
          "headers": {
            "type": "object",
            "additionalProperties": {
              "type": "string"
            },
            "description": "Headers to send with the request"
          },
          "oauth": {
            "anyOf": [
              {
                "$ref": "#/$defs/McpOAuthConfig"
              },
              {
                "type": "boolean",
                "enum": [
                  false
                ]
              }
            ],
            "description": "OAuth authentication configuration for the MCP server. Set to false to disable OAuth auto-detection."
          },
          "timeout": {
            "exclusiveMinimum": 0,
            "type": "integer",
            "maximum": 9007199254740991,
            "description": "Timeout in ms for MCP server requests. Defaults to 5000 (5 seconds) if not specified."
          }
        },
        "required": [
          "type",
          "url"
        ],
        "additionalProperties": false
      },
      "LayoutConfig": {
        "type": "string",
        "enum": [
          "auto",
          "stretch"
        ]
      },
      "ImageAttachmentConfig": {
        "type": "object",
        "properties": {
          "auto_resize": {
            "type": "boolean",
            "description": "Resize images before sending them to the model when they exceed configured limits (default: true)"
          },
          "max_width": {
            "exclusiveMinimum": 0,
            "type": "integer",
            "maximum": 9007199254740991,
            "description": "Maximum image width before resizing or rejecting the attachment (default: 2000)"
          },
          "max_height": {
            "exclusiveMinimum": 0,
            "type": "integer",
            "maximum": 9007199254740991,
            "description": "Maximum image height before resizing or rejecting the attachment (default: 2000)"
          },
          "max_base64_bytes": {
            "exclusiveMinimum": 0,
            "type": "integer",
            "maximum": 9007199254740991,
            "description": "Maximum base64 payload bytes for an image attachment (default: 5242880)"
          }
        },
        "additionalProperties": false
      },
      "AttachmentConfig": {
        "type": "object",
        "properties": {
          "image": {
            "$ref": "#/$defs/ImageAttachmentConfig",
            "description": "Image attachment configuration"
          }
        },
        "additionalProperties": false
      },
      "Policy.Effect": {
        "type": "string",
        "enum": [
          "allow",
          "deny"
        ]
      },
      "ConfigV2.Experimental.Policy": {
        "type": "object",
        "properties": {
          "action": {
            "anyOf": [
              {
                "anyOf": [
                  {
                    "type": "string",
                    "enum": [
                      "provider.use"
                    ]
                  }
                ]
              }
            ]
          },
          "effect": {
            "$ref": "#/$defs/Policy.Effect"
          },
          "resource": {
            "type": "string"
          }
        },
        "required": [
          "action",
          "effect",
          "resource"
        ],
        "additionalProperties": false
      },
      "Config": {
        "type": "object",
        "properties": {
          "$schema": {
            "type": "string",
            "description": "JSON schema reference for configuration validation"
          },
          "shell": {
            "type": "string",
            "description": "Default shell to use for terminal and bash tool"
          },
          "logLevel": {
            "$ref": "#/$defs/LogLevel",
            "description": "Log level"
          },
          "server": {
            "$ref": "#/$defs/ServerConfig",
            "description": "Server configuration for opencode serve and web commands"
          },
          "command": {
            "type": "object",
            "additionalProperties": {
              "type": "object",
              "properties": {
                "template": {
                  "type": "string"
                },
                "description": {
                  "type": "string"
                },
                "agent": {
                  "type": "string"
                },
                "model": {
                  "type": "string",
                  "$ref": "https://models.dev/model-schema.json#/$defs/Model"
                },
                "subtask": {
                  "type": "boolean"
                }
              },
              "required": [
                "template"
              ],
              "additionalProperties": false
            },
            "description": "Command configuration, see https://opencode.ai/docs/commands"
          },
          "skills": {
            "type": "object",
            "properties": {
              "paths": {
                "type": "array",
                "items": {
                  "type": "string"
                },
                "description": "Additional paths to skill folders"
              },
              "urls": {
                "type": "array",
                "items": {
                  "type": "string"
                },
                "description": "URLs to fetch skills from (e.g., https://example.com/.well-known/skills/)"
              }
            },
            "additionalProperties": false,
            "description": "Additional skill folder paths"
          },
          "reference": {
            "$ref": "#/$defs/ReferenceConfig",
            "description": "Named git or local directory references that can be mentioned as @alias or @alias/path"
          },
          "watcher": {
            "type": "object",
            "properties": {
              "ignore": {
                "type": "array",
                "items": {
                  "type": "string"
                }
              }
            },
            "additionalProperties": false
          },
          "snapshot": {
            "type": "boolean",
            "description": "Enable or disable snapshot tracking. When false, filesystem snapshots are not recorded and undoing or reverting will not undo/redo file changes. Defaults to true."
          },
          "plugin": {
            "type": "array",
            "items": {
              "anyOf": [
                {
                  "type": "string"
                },
                {
                  "type": "array",
                  "prefixItems": [
                    {
                      "type": "string"
                    },
                    {
                      "type": "object"
                    }
                  ],
                  "maxItems": 2,
                  "minItems": 2
                }
              ]
            }
          },
          "share": {
            "type": "string",
            "enum": [
              "manual",
              "auto",
              "disabled"
            ],
            "description": "Control sharing behavior:'manual' allows manual sharing via commands, 'auto' enables automatic sharing, 'disabled' disables all sharing"
          },
          "autoshare": {
            "type": "boolean",
            "description": "@deprecated Use 'share' field instead. Share newly created sessions automatically"
          },
          "autoupdate": {
            "anyOf": [
              {
                "type": "boolean"
              },
              {
                "type": "string",
                "enum": [
                  "notify"
                ]
              }
            ],
            "description": "Automatically update to the latest version. Set to true to auto-update, false to disable, or 'notify' to show update notifications"
          },
          "disabled_providers": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "description": "Disable providers that are loaded automatically"
          },
          "enabled_providers": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "description": "When set, ONLY these providers will be enabled. All other providers will be ignored"
          },
          "model": {
            "type": "string",
            "description": "Model to use in the format of provider/model, eg anthropic/claude-2",
            "$ref": "https://models.dev/model-schema.json#/$defs/Model"
          },
          "small_model": {
            "type": "string",
            "description": "Small model to use for tasks like title generation in the format of provider/model",
            "$ref": "https://models.dev/model-schema.json#/$defs/Model"
          },
          "default_agent": {
            "type": "string",
            "description": "Default agent to use when none is specified. Must be a primary agent. Falls back to 'build' if not set or if the specified agent is invalid."
          },
          "username": {
            "type": "string",
            "description": "Custom username to display in conversations instead of system username"
          },
          "mode": {
            "type": "object",
            "properties": {
              "build": {
                "$ref": "#/$defs/AgentConfig"
              },
              "plan": {
                "$ref": "#/$defs/AgentConfig"
              }
            },
            "additionalProperties": {
              "$ref": "#/$defs/AgentConfig"
            },
            "description": "@deprecated Use `agent` field instead."
          },
          "agent": {
            "type": "object",
            "properties": {
              "plan": {
                "$ref": "#/$defs/AgentConfig"
              },
              "build": {
                "$ref": "#/$defs/AgentConfig"
              },
              "general": {
                "$ref": "#/$defs/AgentConfig"
              },
              "explore": {
                "$ref": "#/$defs/AgentConfig"
              },
              "scout": {
                "$ref": "#/$defs/AgentConfig"
              },
              "title": {
                "$ref": "#/$defs/AgentConfig"
              },
              "summary": {
                "$ref": "#/$defs/AgentConfig"
              },
              "compaction": {
                "$ref": "#/$defs/AgentConfig"
              }
            },
            "additionalProperties": {
              "$ref": "#/$defs/AgentConfig"
            },
            "description": "Agent configuration, see https://opencode.ai/docs/agents"
          },
          "provider": {
            "type": "object",
            "additionalProperties": {
              "$ref": "#/$defs/ProviderConfig"
            },
            "description": "Custom provider configurations and model overrides"
          },
          "mcp": {
            "type": "object",
            "additionalProperties": {
              "anyOf": [
                {
                  "anyOf": [
                    {
                      "$ref": "#/$defs/McpLocalConfig"
                    },
                    {
                      "$ref": "#/$defs/McpRemoteConfig"
                    }
                  ]
                },
                {
                  "type": "object",
                  "properties": {
                    "enabled": {
                      "type": "boolean"
                    }
                  },
                  "required": [
                    "enabled"
                  ],
                  "additionalProperties": false
                }
              ]
            },
            "description": "MCP (Model Context Protocol) server configurations"
          },
          "formatter": {
            "anyOf": [
              {
                "type": "boolean"
              },
              {
                "type": "object",
                "additionalProperties": {
                  "type": "object",
                  "properties": {
                    "disabled": {
                      "type": "boolean"
                    },
                    "command": {
                      "type": "array",
                      "items": {
                        "type": "string"
                      }
                    },
                    "environment": {
                      "type": "object",
                      "additionalProperties": {
                        "type": "string"
                      }
                    },
                    "extensions": {
                      "type": "array",
                      "items": {
                        "type": "string"
                      }
                    }
                  },
                  "additionalProperties": false
                }
              }
            ],
            "description": "Enable or configure formatters. Omit or set to false to disable, true to enable built-ins, or an object to enable built-ins with overrides."
          },
          "lsp": {
            "anyOf": [
              {
                "type": "boolean"
              },
              {
                "type": "object",
                "additionalProperties": {
                  "anyOf": [
                    {
                      "type": "object",
                      "properties": {
                        "disabled": {
                          "type": "boolean",
                          "enum": [
                            true
                          ]
                        }
                      },
                      "required": [
                        "disabled"
                      ],
                      "additionalProperties": false
                    },
                    {
                      "type": "object",
                      "properties": {
                        "command": {
                          "type": "array",
                          "items": {
                            "type": "string"
                          }
                        },
                        "extensions": {
                          "type": "array",
                          "items": {
                            "type": "string"
                          }
                        },
                        "disabled": {
                          "type": "boolean"
                        },
                        "env": {
                          "type": "object",
                          "additionalProperties": {
                            "type": "string"
                          }
                        },
                        "initialization": {
                          "type": "object"
                        }
                      },
                      "required": [
                        "command"
                      ],
                      "additionalProperties": false
                    }
                  ]
                }
              }
            ],
            "description": "Enable or configure LSP servers. Omit or set to false to disable, true to enable built-ins, or an object to enable built-ins with overrides."
          },
          "instructions": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "description": "Additional instruction files or patterns to include"
          },
          "layout": {
            "$ref": "#/$defs/LayoutConfig",
            "description": "@deprecated Always uses stretch layout."
          },
          "permission": {
            "$ref": "#/$defs/PermissionConfig"
          },
          "tools": {
            "type": "object",
            "additionalProperties": {
              "type": "boolean"
            }
          },
          "attachment": {
            "$ref": "#/$defs/AttachmentConfig",
            "description": "Attachment processing configuration, including image size limits and resizing behavior"
          },
          "enterprise": {
            "type": "object",
            "properties": {
              "url": {
                "type": "string",
                "description": "Enterprise URL"
              }
            },
            "additionalProperties": false
          },
          "tool_output": {
            "type": "object",
            "properties": {
              "max_lines": {
                "exclusiveMinimum": 0,
                "type": "integer",
                "maximum": 9007199254740991,
                "description": "Maximum lines of tool output before it is truncated and saved to disk (default: 2000)"
              },
              "max_bytes": {
                "exclusiveMinimum": 0,
                "type": "integer",
                "maximum": 9007199254740991,
                "description": "Maximum bytes of tool output before it is truncated and saved to disk (default: 51200)"
              }
            },
            "additionalProperties": false,
            "description": "Thresholds for truncating tool output. When output exceeds either limit, the full text is written to the truncation directory and a preview is returned."
          },
          "compaction": {
            "type": "object",
            "properties": {
              "auto": {
                "type": "boolean",
                "description": "Enable automatic compaction when context is full (default: true)"
              },
              "prune": {
                "type": "boolean",
                "description": "Enable pruning of old tool outputs (default: true)"
              },
              "tail_turns": {
                "minimum": 0,
                "type": "integer",
                "maximum": 9007199254740991,
                "description": "Number of recent user turns, including their following assistant/tool responses, to keep verbatim during compaction (default: 2)"
              },
              "preserve_recent_tokens": {
                "minimum": 0,
                "type": "integer",
                "maximum": 9007199254740991,
                "description": "Maximum number of tokens from recent turns to preserve verbatim after compaction"
              },
              "reserved": {
                "minimum": 0,
                "type": "integer",
                "maximum": 9007199254740991,
                "description": "Token buffer for compaction. Leaves enough window to avoid overflow during compaction."
              }
            },
            "additionalProperties": false
          },
          "experimental": {
            "type": "object",
            "properties": {
              "disable_paste_summary": {
                "type": "boolean"
              },
              "batch_tool": {
                "type": "boolean",
                "description": "Enable the batch tool"
              },
              "openTelemetry": {
                "type": "boolean",
                "description": "Enable OpenTelemetry spans for AI SDK calls (using the 'experimental_telemetry' flag)"
              },
              "primary_tools": {
                "type": "array",
                "items": {
                  "type": "string"
                },
                "description": "Tools that should only be available to primary agents."
              },
              "continue_loop_on_deny": {
                "type": "boolean",
                "description": "Continue the agent loop when a tool call is denied"
              },
              "mcp_timeout": {
                "exclusiveMinimum": 0,
                "type": "integer",
                "maximum": 9007199254740991,
                "description": "Timeout in milliseconds for model context protocol (MCP) requests"
              },
              "policies": {
                "type": "array",
                "items": {
                  "$ref": "#/$defs/ConfigV2.Experimental.Policy"
                },
                "description": "Policy statements applied to supported resources, such as provider access"
              }
            },
            "additionalProperties": false
          }
        },
        "additionalProperties": false
      }
    },
    "allowComments": true,
    "allowTrailingCommas": true
  }
  ```

  #### 🔧 Tool: webfetch
  **Status:** completed
  **Title:** https://opencode.ai/docs/plugins (text/html)

  **Input:**
  ```json
  {
    "format": "markdown",
    "url": "https://opencode.ai/docs/plugins"
  }
  ```

  **Output:**
  ```
  Plugins | OpenCode     [Skip to content](#_top)

    [![](/docs/_astro/logo-dark.DOStV66V.svg) ![](/docs/_astro/logo-light.B0yzR0O5.svg) OpenCode](/docs/)

  [app.header.home](/)[app.header.docs](/docs/)

  [](https://github.com/anomalyco/opencode)[](https://opencode.ai/discord)

  Search CtrlK

  Cancel

  -   [Intro](/docs/)
  -   [Config](/docs/config/)
  -   [Providers](/docs/providers/)
  -   [Network](/docs/network/)
  -   [Enterprise](/docs/enterprise/)
  -   [Troubleshooting](/docs/troubleshooting/)
  -   [Windows](/docs/windows-wsl)
  -   Usage

      -   [Go](/docs/go/)
      -   [TUI](/docs/tui/)
      -   [CLI](/docs/cli/)
      -   [Web](/docs/web/)
      -   [IDE](/docs/ide/)
      -   [Zen](/docs/zen/)
      -   [Share](/docs/share/)
      -   [GitHub](/docs/github/)
      -   [GitLab](/docs/gitlab/)

  -   Configure

      -   [Tools](/docs/tools/)
      -   [Rules](/docs/rules/)
      -   [Agents](/docs/agents/)
      -   [Models](/docs/models/)
      -   [Themes](/docs/themes/)
      -   [Keybinds](/docs/keybinds/)
      -   [Commands](/docs/commands/)
      -   [Formatters](/docs/formatters/)
      -   [Permissions](/docs/permissions/)
      -   [Policies](/docs/policies/)
      -   [LSP Servers](/docs/lsp/)
      -   [MCP servers](/docs/mcp-servers/)
      -   [ACP Support](/docs/acp/)
      -   [Agent Skills](/docs/skills/)
      -   [Custom Tools](/docs/custom-tools/)

  -   Develop

      -   [SDK](/docs/sdk/)
      -   [Server](/docs/server/)
      -   [Plugins](/docs/plugins/)
      -   [Ecosystem](/docs/ecosystem/)


  [GitHub](https://github.com/anomalyco/opencode)[Discord](https://opencode.ai/discord)

  Select theme DarkLightAuto   Select language EnglishالعربيةBosanskiDanskDeutschEspañolFrançaisItaliano日本語한국어Norsk BokmålPolskiPortuguês (Brasil)РусскийไทยTürkçe简体中文繁體中文

  On this page

  -   [Overview](#_top)
  -   [Use a plugin](#use-a-plugin)
      -   [From local files](#from-local-files)
      -   [From npm](#from-npm)
      -   [How plugins are installed](#how-plugins-are-installed)
      -   [Load order](#load-order)
  -   [Create a plugin](#create-a-plugin)
      -   [Dependencies](#dependencies)
      -   [Basic structure](#basic-structure)
      -   [TypeScript support](#typescript-support)
      -   [Events](#events)
  -   [Examples](#examples)
      -   [Send notifications](#send-notifications)
      -   [.env protection](#env-protection)
      -   [Inject environment variables](#inject-environment-variables)
      -   [Custom tools](#custom-tools)
      -   [Logging](#logging)
      -   [Compaction hooks](#compaction-hooks)

  ## On this page

  -   [Overview](#_top)
  -   [Use a plugin](#use-a-plugin)
      -   [From local files](#from-local-files)
      -   [From npm](#from-npm)
      -   [How plugins are installed](#how-plugins-are-installed)
      -   [Load order](#load-order)
  -   [Create a plugin](#create-a-plugin)
      -   [Dependencies](#dependencies)
      -   [Basic structure](#basic-structure)
      -   [TypeScript support](#typescript-support)
      -   [Events](#events)
  -   [Examples](#examples)
      -   [Send notifications](#send-notifications)
      -   [.env protection](#env-protection)
      -   [Inject environment variables](#inject-environment-variables)
      -   [Custom tools](#custom-tools)
      -   [Logging](#logging)
      -   [Compaction hooks](#compaction-hooks)

  # Plugins

  Write your own plugins to extend OpenCode.

  Plugins allow you to extend OpenCode by hooking into various events and customizing behavior. You can create plugins to add new features, integrate with external services, or modify OpenCode’s default behavior.

  For examples, check out the [plugins](/docs/ecosystem#plugins) created by the community.

  ---

  ## [Use a plugin](#use-a-plugin)

  There are two ways to load plugins.

  ---

</details>
<details><summary>Expand</summary>
  ### [Compaction hooks](#compaction-hooks)

  Customize the context included when a session is compacted:

  .opencode/plugins/compaction.ts

  ```
  import type { Plugin } from "@opencode-ai/plugin"
  export const CompactionPlugin: Plugin = async (ctx) => {  return {    "experimental.session.compacting": async (input, output) => {      // Inject additional context into the compaction prompt      output.context.push(`## Custom Context
  Include any state that should persist across compaction:- Current task status- Important decisions made- Files being actively worked on`)    },  }}
  ```

  The `experimental.session.compacting` hook fires before the LLM generates a continuation summary. Use it to inject domain-specific context that the default compaction prompt would miss.

  You can also replace the compaction prompt entirely by setting `output.prompt`:

  .opencode/plugins/custom-compaction.ts

  ```
  import type { Plugin } from "@opencode-ai/plugin"
  export const CustomCompactionPlugin: Plugin = async (ctx) => {  return {    "experimental.session.compacting": async (input, output) => {      // Replace the entire compaction prompt      output.prompt = `You are generating a continuation prompt for a multi-agent swarm session.
  Summarize:1. The current task and its status2. Which files are being modified and by whom3. Any blockers or dependencies between agents4. The next steps to complete the work
  Format as a structured prompt that a new agent can use to resume work.`    },  }}
  ```

  When `output.prompt` is set, it completely replaces the default compaction prompt. The `output.context` array is ignored in this case.

  [Edit page](https://github.com/anomalyco/opencode/edit/dev/packages/web/src/content/docs/plugins.mdx)[Found a bug? Open an issue](https://github.com/anomalyco/opencode/issues/new)[Join our Discord community](https://opencode.ai/discord) Select language EnglishالعربيةBosanskiDanskDeutschEspañolFrançaisItaliano日本語한국어Norsk BokmålPolskiPortuguês (Brasil)РусскийไทยTürkçe简体中文繁體中文 

  © [Anomaly](https://anoma.ly)

  Last updated: Jun 1, 2026
  ```

  *[step-finish part]*

  #### 🤖 Assistant
  *2026-06-02 13:53:39*

  *[step-start part]*

  💭 **Reasoning:**

  <details>
  <summary>Click to expand reasoning</summary>

  Now I have a comprehensive picture. Let me read a few more things to be complete:

  1. The `experimental.hook` section is present in the TypeScript types but NOT in the JSON schema I fetched. This suggests the hook section was perhaps removed or moved. Let me look more carefully.

  Actually, looking at the JSON schema, the `Config` type's `experimental` section only has:
  - disable_paste_summary
  - batch_tool
  - openTelemetry
  - primary_tools
  - continue_loop_on_deny
  - mcp_timeout
  - policies

  But in the TypeScript generated types file, it also had:
  ```typescript
  hook?: {
      file_edited?: {
          [key: string]: Array<{
              command: Array<string>;
              environment?: { [key: string]: string };
          }>;
      };
      session_completed?: Array<{
          command: Array<string>;
          environment?: { [key: string]: string };
      }>;
  };
  ```

  This discrepancy suggests the JSON schema might be from a different version. Let me re-read the types.gen.d.ts to confirm the full experimental section.

  Let me also check if there's any `.opencode/` directory in the user's home or project directory, and check for any hook-related environment variables.

  </details>

  Let me do a final set of checks to be thorough.

  #### 🔧 Tool: bash
  **Status:** completed
  **Title:** Check for .opencode directories and hooks

  **Input:**
  ```json
  {
    "description": "Check for .opencode directories and hooks",
    "command": "Get-ChildItem -LiteralPath \"C:\\Users\\ADMIN\" -ErrorAction SilentlyContinue -Filter '.opencode' -Directory -Force | Select-Object FullName"
  }
  ```

  **Output:**
  ```
  (no output)
  ```

  #### 🔧 Tool: bash
  **Status:** completed
  **Title:** Check for .opencode in project directory

  **Input:**
  ```json
  {
    "description": "Check for .opencode in project directory",
    "command": "Get-ChildItem -LiteralPath \"C:\\Users\\ADMIN\\Documents\\Srinikc\\AI Products\\petemart-agentic-framework\" -ErrorAction SilentlyContinue -Filter '.opencode' -Directory -Force | Select-Object FullName"
  }
  ```

  **Output:**
  ```

  FullName                                                                         
  --------                                                                         
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode



  ```

  #### 🔧 Tool: bash
  **Status:** completed
  **Title:** Search for startup hook env vars

  **Input:**
  ```json
  {
    "description": "Search for startup hook env vars",
    "command": "Get-ChildItem -LiteralPath \"C:\\Users\\ADMIN\\.config\\opencode\" -ErrorAction SilentlyContinue -Recurse -Include '*hook*', '*startup*', '*init*', '*bootstrap*' -Depth 2 | Select-Object FullName"
  }
  ```

  **Output:**
  ```

  FullName                                                                                       
  --------                                                                                       
  C:\Users\ADMIN\.config\opencode\node_modules                                                   
  C:\Users\ADMIN\.config\opencode\.gitignore                                                     
  C:\Users\ADMIN\.config\opencode\opencode.json                                                  
  C:\Users\ADMIN\.config\opencode\package-lock.json                                              
  C:\Users\ADMIN\.config\opencode\package.json                                                   
  C:\Users\ADMIN\.config\opencode\node_modules\.bin                                              
  C:\Users\ADMIN\.config\opencode\node_modules\@msgpackr-extract                                 
  C:\Users\ADMIN\.config\opencode\node_modules\@opencode-ai                                      
  C:\Users\ADMIN\.config\opencode\node_modules\@standard-schema                                  
  C:\Users\ADMIN\.config\opencode\node_modules\cross-spawn                                       
  C:\Users\ADMIN\.config\opencode\node_modules\detect-libc                                       
  C:\Users\ADMIN\.config\opencode\node_modules\effect                                            
  C:\Users\ADMIN\.config\opencode\node_modules\fast-check                                        
  C:\Users\ADMIN\.config\opencode\node_modules\find-my-way-ts                                    
  C:\Users\ADMIN\.config\opencode\node_modules\ini                                               
  C:\Users\ADMIN\.config\opencode\node_modules\isexe                                             
  C:\Users\ADMIN\.config\opencode\node_modules\kubernetes-types                                  
  C:\Users\ADMIN\.config\opencode\node_modules\msgpackr                                          
  C:\Users\ADMIN\.config\opencode\node_modules\msgpackr-extract                                  
  C:\Users\ADMIN\.config\opencode\node_modules\multipasta                                        
  C:\Users\ADMIN\.config\opencode\node_modules\node-gyp-build-optional-packages                  
  C:\Users\ADMIN\.config\opencode\node_modules\path-key                                          
  C:\Users\ADMIN\.config\opencode\node_modules\pure-rand                                         
  C:\Users\ADMIN\.config\opencode\node_modules\shebang-command                                   
  C:\Users\ADMIN\.config\opencode\node_modules\shebang-regex                                     
  C:\Users\ADMIN\.config\opencode\node_modules\toml                                              
  C:\Users\ADMIN\.config\opencode\node_modules\uuid                                              
  C:\Users\ADMIN\.config\opencode\node_modules\which                                             
  C:\Users\ADMIN\.config\opencode\node_modules\yaml                                              
  C:\Users\ADMIN\.config\opencode\node_modules\zod                                               
  C:\Users\ADMIN\.config\opencode\node_modules\.package-lock.json                                
  C:\Users\ADMIN\.config\opencode\node_modules\.bin\download-msgpackr-prebuilds                  
  C:\Users\ADMIN\.config\opencode\node_modules\.bin\download-msgpackr-prebuilds.cmd              
  C:\Users\ADMIN\.config\opencode\node_modules\.bin\download-msgpackr-prebuilds.ps1              
  C:\Users\ADMIN\.config\opencode\node_modules\.bin\node-gyp-build-optional-packages             
  C:\Users\ADMIN\.config\opencode\node_modules\.bin\node-gyp-build-optional-packages-optional    
  C:\Users\ADMIN\.config\opencode\node_modules\.bin\node-gyp-build-optional-packages-optional.cmd
  C:\Users\ADMIN\.config\opencode\node_modules\.bin\node-gyp-build-optional-packages-optional.ps1
  C:\Users\ADMIN\.config\opencode\node_modules\.bin\node-gyp-build-optional-packages-test        
  C:\Users\ADMIN\.config\opencode\node_modules\.bin\node-gyp-build-optional-packages-test.cmd    
  C:\Users\ADMIN\.config\opencode\node_modules\.bin\node-gyp-build-optional-packages-test.ps1    
  C:\Users\ADMIN\.config\opencode\node_modules\.bin\node-gyp-build-optional-packages.cmd         
  C:\Users\ADMIN\.config\opencode\node_modules\.bin\node-gyp-build-optional-packages.ps1         
  C:\Users\ADMIN\.config\opencode\node_modules\.bin\node-which                                   
  C:\Users\ADMIN\.config\opencode\node_modules\.bin\node-which.cmd                               
  C:\Users\ADMIN\.config\opencode\node_modules\.bin\node-which.ps1                               
  C:\Users\ADMIN\.config\opencode\node_modules\.bin\uuid                                         
  C:\Users\ADMIN\.config\opencode\node_modules\.bin\uuid.cmd                                     
  C:\Users\ADMIN\.config\opencode\node_modules\.bin\uuid.ps1                                     
  C:\Users\ADMIN\.config\opencode\node_modules\.bin\yaml                                         
  C:\Users\ADMIN\.config\opencode\node_modules\.bin\yaml.cmd                                     
  C:\Users\ADMIN\.config\opencode\node_modules\.bin\yaml.ps1                                     
  C:\Users\ADMIN\.config\opencode\node_modules\@msgpackr-extract\msgpackr-extract-win32-x64      
  C:\Users\ADMIN\.config\opencode\node_modules\@opencode-ai\plugin                               
  C:\Users\ADMIN\.config\opencode\node_modules\@opencode-ai\sdk                                  
  C:\Users\ADMIN\.config\opencode\node_modules\@standard-schema\spec                             
  C:\Users\ADMIN\.config\opencode\node_modules\cross-spawn\lib                                   
  C:\Users\ADMIN\.config\opencode\node_modules\cross-spawn\index.js                              
  C:\Users\ADMIN\.config\opencode\node_modules\cross-spawn\LICENSE                               
  C:\Users\ADMIN\.config\opencode\node_modules\cross-spawn\package.json                          
  C:\Users\ADMIN\.config\opencode\node_modules\cross-spawn\README.md                             
  C:\Users\ADMIN\.config\opencode\node_modules\detect-libc\lib                                   
  C:\Users\ADMIN\.config\opencode\node_modules\detect-libc\index.d.ts                            
  C:\Users\ADMIN\.config\opencode\node_modules\detect-libc\LICENSE                               
  C:\Users\ADMIN\.config\opencode\node_modules\detect-libc\package.json                          
  C:\Users\ADMIN\.config\opencode\node_modules\detect-libc\README.md                             
  C:\Users\ADMIN\.config\opencode\node_modules\effect\dist                                       
  C:\Users\ADMIN\.config\opencode\node_modules\effect\src                                        
  C:\Users\ADMIN\.config\opencode\node_modules\effect\LICENSE                                    
  C:\Users\ADMIN\.config\opencode\node_modules\effect\package.json                               
  C:\Users\ADMIN\.config\opencode\node_modules\effect\README.md                                  
  C:\Users\ADMIN\.config\opencode\node_modules\fast-check\lib                                    
  C:\Users\ADMIN\.config\opencode\node_modules\fast-check\LICENSE                                
  C:\Users\ADMIN\.config\opencode\node_modules\fast-check\package.json                           
  C:\Users\ADMIN\.config\opencode\node_modules\fast-check\README.md                              
  C:\Users\ADMIN\.config\opencode\node_modules\find-my-way-ts\dist                               
  C:\Users\ADMIN\.config\opencode\node_modules\find-my-way-ts\QueryString                        
  C:\Users\ADMIN\.config\opencode\node_modules\find-my-way-ts\src                                
  C:\Users\ADMIN\.config\opencode\node_modules\find-my-way-ts\LICENSE                            
  C:\Users\ADMIN\.config\opencode\node_modules\find-my-way-ts\package.json                       
  C:\Users\ADMIN\.config\opencode\node_modules\find-my-way-ts\README.md                          
  C:\Users\ADMIN\.config\opencode\node_modules\ini\lib                                           
  C:\Users\ADMIN\.config\opencode\node_modules\ini\LICENSE                                       
  C:\Users\ADMIN\.config\opencode\node_modules\ini\package.json                                  
  C:\Users\ADMIN\.config\opencode\node_modules\ini\README.md                                     
  C:\Users\ADMIN\.config\opencode\node_modules\isexe\test                                        
  C:\Users\ADMIN\.config\opencode\node_modules\isexe\.npmignore                                  
  C:\Users\ADMIN\.config\opencode\node_modules\isexe\index.js                                    
  C:\Users\ADMIN\.config\opencode\node_modules\isexe\LICENSE                                     
  C:\Users\ADMIN\.config\opencode\node_modules\isexe\mode.js                                     
  C:\Users\ADMIN\.config\opencode\node_modules\isexe\package.json                                
  C:\Users\ADMIN\.config\opencode\node_modules\isexe\README.md                                   
  C:\Users\ADMIN\.config\opencode\node_modules\isexe\windows.js                                  
  C:\Users\ADMIN\.config\opencode\node_modules\kubernetes-types\admissionregistration            
  C:\Users\ADMIN\.config\opencode\node_modules\kubernetes-types\api                              
  C:\Users\ADMIN\.config\opencode\node_modules\kubernetes-types\apiextensions                    
  C:\Users\ADMIN\.config\opencode\node_modules\kubernetes-types\apiserverinternal                
  C:\Users\ADMIN\.config\opencode\node_modules\kubernetes-types\apps                             
  C:\Users\ADMIN\.config\opencode\node_modules\kubernetes-types\authentication                   
  C:\Users\ADMIN\.config\opencode\node_modules\kubernetes-types\authorization                    
  C:\Users\ADMIN\.config\opencode\node_modules\kubernetes-types\autoscaling                      
  C:\Users\ADMIN\.config\opencode\node_modules\kubernetes-types\batch                            
  C:\Users\ADMIN\.config\opencode\node_modules\kubernetes-types\certificates                     
  C:\Users\ADMIN\.config\opencode\node_modules\kubernetes-types\coordination                     
  C:\Users\ADMIN\.config\opencode\node_modules\kubernetes-types\core                             
  C:\Users\ADMIN\.config\opencode\node_modules\kubernetes-types\discovery                        
  C:\Users\ADMIN\.config\opencode\node_modules\kubernetes-types\events                           
  C:\Users\ADMIN\.config\opencode\node_modules\kubernetes-types\flowcontrol                      
  C:\Users\ADMIN\.config\opencode\node_modules\kubernetes-types\meta                             
  C:\Users\ADMIN\.config\opencode\node_modules\kubernetes-types\networking                       
  C:\Users\ADMIN\.config\opencode\node_modules\kubernetes-types\node                             
  C:\Users\ADMIN\.config\opencode\node_modules\kubernetes-types\policy                           
  C:\Users\ADMIN\.config\opencode\node_modules\kubernetes-types\rbac                             
  C:\Users\ADMIN\.config\opencode\node_modules\kubernetes-types\resource                         
  C:\Users\ADMIN\.config\opencode\node_modules\kubernetes-types\scheduling                       
  C:\Users\ADMIN\.config\opencode\node_modules\kubernetes-types\storage                          
  C:\Users\ADMIN\.config\opencode\node_modules\kubernetes-types\storagemigration                 
  C:\Users\ADMIN\.config\opencode\node_modules\kubernetes-types\package.json                     
  C:\Users\ADMIN\.config\opencode\node_modules\kubernetes-types\README.md                        
  C:\Users\ADMIN\.config\opencode\node_modules\kubernetes-types\runtime.d.ts                     
  C:\Users\ADMIN\.config\opencode\node_modules\kubernetes-types\version.d.ts                     
  C:\Users\ADMIN\.config\opencode\node_modules\msgpackr\dist                                     
  C:\Users\ADMIN\.config\opencode\node_modules\msgpackr\benchmark.md                             
  C:\Users\ADMIN\.config\opencode\node_modules\msgpackr\index.d.cts                              
  C:\Users\ADMIN\.config\opencode\node_modules\msgpackr\index.d.ts                               
  C:\Users\ADMIN\.config\opencode\node_modules\msgpackr\index.js                                 
  C:\Users\ADMIN\.config\opencode\node_modules\msgpackr\iterators.js                             
  C:\Users\ADMIN\.config\opencode\node_modules\msgpackr\LICENSE                                  
  C:\Users\ADMIN\.config\opencode\node_modules\msgpackr\node-index.js                            
  C:\Users\ADMIN\.config\opencode\node_modules\msgpackr\pack.d.cts                               
  C:\Users\ADMIN\.config\opencode\node_modules\msgpackr\pack.d.ts                                
  C:\Users\ADMIN\.config\opencode\node_modules\msgpackr\pack.js                                  
  C:\Users\ADMIN\.config\opencode\node_modules\msgpackr\package.json                             
  C:\Users\ADMIN\.config\opencode\node_modules\msgpackr\README.md                                
  C:\Users\ADMIN\.config\opencode\node_modules\msgpackr\rollup.config.js                         
  C:\Users\ADMIN\.config\opencode\node_modules\msgpackr\SECURITY.md                              
  C:\Users\ADMIN\.config\opencode\node_modules\msgpackr\stream.js                                
  C:\Users\ADMIN\.config\opencode\node_modules\msgpackr\struct.js                                
  C:\Users\ADMIN\.config\opencode\node_modules\msgpackr\test-worker.js                           
  C:\Users\ADMIN\.config\opencode\node_modules\msgpackr\unpack.d.cts                             
  C:\Users\ADMIN\.config\opencode\node_modules\msgpackr\unpack.d.ts                              
  C:\Users\ADMIN\.config\opencode\node_modules\msgpackr\unpack.js                                
  C:\Users\ADMIN\.config\opencode\node_modules\msgpackr-extract\bin                              
  C:\Users\ADMIN\.config\opencode\node_modules\msgpackr-extract\src                              
  C:\Users\ADMIN\.config\opencode\node_modules\msgpackr-extract\binding.gyp                      
  C:\Users\ADMIN\.config\opencode\node_modules\msgpackr-extract\index.js                         
  C:\Users\ADMIN\.config\opencode\node_modules\msgpackr-extract\LICENSE                          
  C:\Users\ADMIN\.config\opencode\node_modules\msgpackr-extract\package.json                     
  C:\Users\ADMIN\.config\opencode\node_modules\msgpackr-extract\README.md                        
  C:\Users\ADMIN\.config\opencode\node_modules\multipasta\dist                                   
  C:\Users\ADMIN\.config\opencode\node_modules\multipasta\src                                    
  C:\Users\ADMIN\.config\opencode\node_modules\multipasta\LICENSE                                
  C:\Users\ADMIN\.config\opencode\node_modules\multipasta\package.json                           
  C:\Users\ADMIN\.config\opencode\node_modules\multipasta\README.md                              
  C:\Users\ADMIN\.config\opencode\node_modules\node-gyp-build-optional-packages\bin.js           
  C:\Users\ADMIN\.config\opencode\node_modules\node-gyp-build-optional-packages\build-test.js    
  C:\Users\ADMIN\.config\opencode\node_modules\node-gyp-build-optional-packages\index.js         
  C:\Users\ADMIN\.config\opencode\node_modules\node-gyp-build-optional-packages\LICENSE          
  C:\Users\ADMIN\.config\opencode\node_modules\node-gyp-build-optional-packages\node-gyp-build.js
  C:\Users\ADMIN\.config\opencode\node_modules\node-gyp-build-optional-packages\optional.js      
  C:\Users\ADMIN\.config\opencode\node_modules\node-gyp-build-optional-packages\package.json     
  C:\Users\ADMIN\.config\opencode\node_modules\node-gyp-build-optional-packages\README.md        
  C:\Users\ADMIN\.config\opencode\node_modules\path-key\index.d.ts                               
  C:\Users\ADMIN\.config\opencode\node_modules\path-key\index.js                                 
  C:\Users\ADMIN\.config\opencode\node_modules\path-key\license                                  
  C:\Users\ADMIN\.config\opencode\node_modules\path-key\package.json                             
  C:\Users\ADMIN\.config\opencode\node_modules\path-key\readme.md                                
  C:\Users\ADMIN\.config\opencode\node_modules\pure-rand\lib                                     
  C:\Users\ADMIN\.config\opencode\node_modules\pure-rand\LICENSE                                 
  C:\Users\ADMIN\.config\opencode\node_modules\pure-rand\package.json                            
  C:\Users\ADMIN\.config\opencode\node_modules\pure-rand\README.md                               
  C:\Users\ADMIN\.config\opencode\node_modules\shebang-command\index.js                          
  C:\Users\ADMIN\.config\opencode\node_modules\shebang-command\license                           
  C:\Users\ADMIN\.config\opencode\node_modules\shebang-command\package.json                      
  C:\Users\ADMIN\.config\opencode\node_modules\shebang-command\readme.md                         
  C:\Users\ADMIN\.config\opencode\node_modules\shebang-regex\index.d.ts                          
  C:\Users\ADMIN\.config\opencode\node_modules\shebang-regex\index.js                            
  C:\Users\ADMIN\.config\opencode\node_modules\shebang-regex\license                             
  C:\Users\ADMIN\.config\opencode\node_modules\shebang-regex\package.json                        
  C:\Users\ADMIN\.config\opencode\node_modules\shebang-regex\readme.md                           
  C:\Users\ADMIN\.config\opencode\node_modules\toml\lib                                          
  C:\Users\ADMIN\.config\opencode\node_modules\toml\index.d.ts                                   
  C:\Users\ADMIN\.config\opencode\node_modules\toml\index.js                                     
  C:\Users\ADMIN\.config\opencode\node_modules\toml\LICENSE                                      
  C:\Users\ADMIN\.config\opencode\node_modules\toml\package.json                                 
  C:\Users\ADMIN\.config\opencode\node_modules\toml\README.md                                    
  C:\Users\ADMIN\.config\opencode\node_modules\uuid\dist                                         
  C:\Users\ADMIN\.config\opencode\node_modules\uuid\dist-node                                    
  C:\Users\ADMIN\.config\opencode\node_modules\uuid\LICENSE.md                                   
  C:\Users\ADMIN\.config\opencode\node_modules\uuid\package.json                                 
  C:\Users\ADMIN\.config\opencode\node_modules\uuid\README.md                                    
  C:\Users\ADMIN\.config\opencode\node_modules\which\bin                                         
  C:\Users\ADMIN\.config\opencode\node_modules\which\CHANGELOG.md                                
  C:\Users\ADMIN\.config\opencode\node_modules\which\LICENSE                                     
  C:\Users\ADMIN\.config\opencode\node_modules\which\package.json                                
  C:\Users\ADMIN\.config\opencode\node_modules\which\README.md                                   
  C:\Users\ADMIN\.config\opencode\node_modules\which\which.js                                    
  C:\Users\ADMIN\.config\opencode\node_modules\yaml\browser                                      
  C:\Users\ADMIN\.config\opencode\node_modules\yaml\dist                                         
  C:\Users\ADMIN\.config\opencode\node_modules\yaml\bin.mjs                                      
  C:\Users\ADMIN\.config\opencode\node_modules\yaml\LICENSE                                      
  C:\Users\ADMIN\.config\opencode\node_modules\yaml\package.json                                 
  C:\Users\ADMIN\.config\opencode\node_modules\yaml\README.md                                    
  C:\Users\ADMIN\.config\opencode\node_modules\yaml\util.js                                      
  C:\Users\ADMIN\.config\opencode\node_modules\zod\locales                                       
  C:\Users\ADMIN\.config\opencode\node_modules\zod\mini                                          
  C:\Users\ADMIN\.config\opencode\node_modules\zod\src                                           
  C:\Users\ADMIN\.config\opencode\node_modules\zod\v3                                            
  C:\Users\ADMIN\.config\opencode\node_modules\zod\v4                                            
  C:\Users\ADMIN\.config\opencode\node_modules\zod\v4-mini                                       
  C:\Users\ADMIN\.config\opencode\node_modules\zod\index.cjs                                     
  C:\Users\ADMIN\.config\opencode\node_modules\zod\index.d.cts                                   
  C:\Users\ADMIN\.config\opencode\node_modules\zod\index.d.ts                                    
  C:\Users\ADMIN\.config\opencode\node_modules\zod\index.js                                      
  C:\Users\ADMIN\.config\opencode\node_modules\zod\LICENSE                                       
  C:\Users\ADMIN\.config\opencode\node_modules\zod\package.json                                  
  C:\Users\ADMIN\.config\opencode\node_modules\zod\README.md                                     



  ```

  #### 🔧 Tool: read
  **Status:** completed
  **Title:** Users\ADMIN\.config\opencode\node_modules\@opencode-ai\sdk\dist\gen\types.gen.d.ts

  **Input:**
  ```json
  {
    "filePath": "C:\\Users\\ADMIN\\.config\\opencode\\node_modules\\@opencode-ai\\sdk\\dist\\gen\\types.gen.d.ts",
    "offset": 1179,
    "limit": 50
  }
  ```

  **Output:**
  ```
  <path>C:\Users\ADMIN\.config\opencode\node_modules\@opencode-ai\sdk\dist\gen\types.gen.d.ts</path>
  <type>file</type>
  <content>
  1179:     experimental?: {
  1180:         hook?: {
  1181:             file_edited?: {
  1182:                 [key: string]: Array<{
  1183:                     command: Array<string>;
  1184:                     environment?: {
  1185:                         [key: string]: string;
  1186:                     };
  1187:                 }>;
  1188:             };
  1189:             session_completed?: Array<{
  1190:                 command: Array<string>;
  1191:                 environment?: {
  1192:                     [key: string]: string;
  1193:                 };
  1194:             }>;
  1195:         };
  1196:         /**
  1197:          * Number of retries for chat completions on failure
  1198:          */
  1199:         chatMaxRetries?: number;
  1200:         disable_paste_summary?: boolean;
  1201:         /**
  1202:          * Enable the batch tool
  1203:          */
  1204:         batch_tool?: boolean;
  1205:         /**
  1206:          * Enable OpenTelemetry spans for AI SDK calls (using the 'experimental_telemetry' flag)
  1207:          */
  1208:         openTelemetry?: boolean;
  1209:         /**
  1210:          * Tools that should only be available to primary agents.
  1211:          */
  1212:         primary_tools?: Array<string>;
  1213:     };
  1214: };
  1215: export type ToolIds = Array<string>;
  1216: export type ToolListItem = {
  1217:     id: string;
  1218:     description: string;
  1219:     parameters: unknown;
  1220: };
  1221: export type ToolList = Array<ToolListItem>;
  1222: export type Path = {
  1223:     state: string;
  1224:     config: string;
  1225:     worktree: string;
  1226:     directory: string;
  1227: };
  1228: export type VcsInfo = {

  (Showing lines 1179-1228 of 3383. Use offset=1229 to continue.)
  </content>
  ```

  *[step-finish part]*

  #### 🤖 Assistant
  *2026-06-02 13:53:39*

  *[step-start part]*

  💭 **Reasoning:**

  <details>
  <summary>Click to expand reasoning</summary>

  Now I have a very comprehensive picture of all opencode's startup/hook mechanisms. Let me also quickly look inside the `.opencode` directory in the project to see if there are any plugins or hooks defined there.

  </details>

  #### 🔧 Tool: bash
  **Status:** completed
  **Title:** Check .opencode directory contents

  **Input:**
  ```json
  {
    "description": "Check .opencode directory contents",
    "command": "Get-ChildItem -LiteralPath \"C:\\Users\\ADMIN\\Documents\\Srinikc\\AI Products\\petemart-agentic-framework\\.opencode\" -ErrorAction SilentlyContinue -Recurse -Force | Select-Object FullName, Length, LastWriteTime | Format-Table -AutoSize"
  }
  ```

  **Output:**
  ```
  ...output truncated...

  Full output saved to: C:\Users\ADMIN\.local\share\opencode\tool-output\tool_e8733594e001WHYV4ug9ENrjX3

  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\src\v4\locales\sl.ts
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\src\v4\locales\sv.ts
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\src\v4\locales\ta.ts
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\src\v4\locales\th.ts
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\src\v4\locales\tr.ts
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\src\v4\locales\ua.ts
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\src\v4\locales\uk.ts
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\src\v4\locales\ur.ts
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\src\v4\locales\vi.ts
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\src\v4\locales\yo.ts
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\src\v4\locales\zh...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\src\v4\locales\zh...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\src\v4\mini\tests   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\src\v4\mini\check...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\src\v4\mini\coerc...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\src\v4\mini\exter...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\src\v4\mini\index.ts
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\src\v4\mini\iso.ts  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\src\v4\mini\parse.ts
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\src\v4\mini\schem...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\src\v4\mini\tests...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\src\v4\mini\tests...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\src\v4\mini\tests...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\src\v4\mini\tests...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\src\v4\mini\tests...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\src\v4\mini\tests...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\src\v4\mini\tests...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\src\v4\mini\tests...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\src\v4\mini\tests...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\src\v4\mini\tests...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\src\v4\mini\tests...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\src\v4\mini\tests...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\src\v4\mini\tests...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\src\v4-mini\index.ts
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\helpers          
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\locales          
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\errors.cjs       
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\errors.d.cts     
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\errors.d.ts      
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\errors.js        
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\external.cjs     
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\external.d.cts   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\external.d.ts    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\external.js      
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\index.cjs        
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\index.d.cts      
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\index.d.ts       
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\index.js         
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\package.json     
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\standard-schem...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\standard-schem...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\standard-schem...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\standard-schem...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\types.cjs        
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\types.d.cts      
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\types.d.ts       
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\types.js         
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\ZodError.cjs     
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\ZodError.d.cts   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\ZodError.d.ts    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\ZodError.js      
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\helpers\enumUt...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\helpers\enumUt...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\helpers\enumUt...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\helpers\enumUt...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\helpers\errorU...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\helpers\errorU...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\helpers\errorU...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\helpers\errorU...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\helpers\parseU...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\helpers\parseU...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\helpers\parseU...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\helpers\parseU...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\helpers\partia...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\helpers\partia...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\helpers\partia...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\helpers\partia...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\helpers\typeAl...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\helpers\typeAl...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\helpers\typeAl...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\helpers\typeAl...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\helpers\util.cjs 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\helpers\util.d...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\helpers\util.d.ts
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\helpers\util.js  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\locales\en.cjs   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\locales\en.d.cts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\locales\en.d.ts  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v3\locales\en.js    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\classic          
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core             
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales          
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\mini             
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\index.cjs        
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\index.d.cts      
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\index.d.ts       
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\index.js         
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\package.json     
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\classic\checks...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\classic\checks...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\classic\checks...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\classic\checks.js
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\classic\coerce...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\classic\coerce...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\classic\coerce...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\classic\coerce.js
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\classic\compat...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\classic\compat...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\classic\compat...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\classic\compat.js
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\classic\errors...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\classic\errors...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\classic\errors...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\classic\errors.js
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\classic\extern...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\classic\extern...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\classic\extern...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\classic\extern...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\classic\index.cjs
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\classic\index....
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\classic\index....
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\classic\index.js 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\classic\iso.cjs  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\classic\iso.d.cts
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\classic\iso.d.ts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\classic\iso.js   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\classic\packag...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\classic\parse.cjs
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\classic\parse....
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\classic\parse....
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\classic\parse.js 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\classic\schema...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\classic\schema...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\classic\schema...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\classic\schema...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\api.cjs     
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\api.d.cts   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\api.d.ts    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\api.js      
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\checks.cjs  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\checks.d.cts
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\checks.d.ts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\checks.js   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\core.cjs    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\core.d.cts  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\core.d.ts   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\core.js     
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\doc.cjs     
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\doc.d.cts   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\doc.d.ts    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\doc.js      
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\errors.cjs  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\errors.d.cts
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\errors.d.ts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\errors.js   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\index.cjs   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\index.d.cts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\index.d.ts  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\index.js    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\json-sche...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\json-sche...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\json-sche...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\json-sche...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\package.json
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\parse.cjs   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\parse.d.cts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\parse.d.ts  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\parse.js    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\regexes.cjs 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\regexes.d...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\regexes.d.ts
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\regexes.js  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\registrie...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\registrie...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\registrie...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\registrie...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\schemas.cjs 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\schemas.d...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\schemas.d.ts
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\schemas.js  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\standard-...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\standard-...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\standard-...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\standard-...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\to-json-s...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\to-json-s...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\to-json-s...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\to-json-s...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\util.cjs    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\util.d.cts  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\util.d.ts   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\util.js     
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\versions.cjs
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\versions....
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\versions....
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\core\versions.js 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\ar.cjs   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\ar.d.cts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\ar.d.ts  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\ar.js    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\az.cjs   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\az.d.cts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\az.d.ts  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\az.js    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\be.cjs   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\be.d.cts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\be.d.ts  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\be.js    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\bg.cjs   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\bg.d.cts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\bg.d.ts  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\bg.js    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\ca.cjs   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\ca.d.cts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\ca.d.ts  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\ca.js    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\cs.cjs   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\cs.d.cts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\cs.d.ts  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\cs.js    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\da.cjs   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\da.d.cts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\da.d.ts  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\da.js    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\de.cjs   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\de.d.cts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\de.d.ts  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\de.js    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\en.cjs   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\en.d.cts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\en.d.ts  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\en.js    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\eo.cjs   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\eo.d.cts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\eo.d.ts  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\eo.js    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\es.cjs   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\es.d.cts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\es.d.ts  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\es.js    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\fa.cjs   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\fa.d.cts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\fa.d.ts  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\fa.js    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\fi.cjs   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\fi.d.cts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\fi.d.ts  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\fi.js    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\fr-CA.cjs
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\fr-CA....
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\fr-CA....
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\fr-CA.js 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\fr.cjs   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\fr.d.cts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\fr.d.ts  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\fr.js    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\he.cjs   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\he.d.cts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\he.d.ts  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\he.js    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\hu.cjs   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\hu.d.cts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\hu.d.ts  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\hu.js    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\id.cjs   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\id.d.cts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\id.d.ts  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\id.js    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\index.cjs
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\index....
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\index....
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\index.js 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\is.cjs   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\is.d.cts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\is.d.ts  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\is.js    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\it.cjs   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\it.d.cts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\it.d.ts  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\it.js    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\ja.cjs   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\ja.d.cts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\ja.d.ts  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\ja.js    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\ka.cjs   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\ka.d.cts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\ka.d.ts  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\ka.js    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\kh.cjs   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\kh.d.cts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\kh.d.ts  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\kh.js    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\km.cjs   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\km.d.cts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\km.d.ts  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\km.js    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\ko.cjs   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\ko.d.cts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\ko.d.ts  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\ko.js    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\lt.cjs   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\lt.d.cts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\lt.d.ts  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\lt.js    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\mk.cjs   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\mk.d.cts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\mk.d.ts  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\mk.js    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\ms.cjs   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\ms.d.cts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\ms.d.ts  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\ms.js    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\nl.cjs   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\nl.d.cts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\nl.d.ts  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\nl.js    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\no.cjs   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\no.d.cts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\no.d.ts  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\no.js    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\ota.cjs  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\ota.d.cts
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\ota.d.ts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\ota.js   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\packag...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\pl.cjs   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\pl.d.cts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\pl.d.ts  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\pl.js    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\ps.cjs   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\ps.d.cts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\ps.d.ts  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\ps.js    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\pt.cjs   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\pt.d.cts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\pt.d.ts  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\pt.js    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\ru.cjs   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\ru.d.cts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\ru.d.ts  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\ru.js    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\sl.cjs   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\sl.d.cts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\sl.d.ts  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\sl.js    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\sv.cjs   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\sv.d.cts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\sv.d.ts  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\sv.js    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\ta.cjs   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\ta.d.cts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\ta.d.ts  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\ta.js    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\th.cjs   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\th.d.cts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\th.d.ts  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\th.js    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\tr.cjs   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\tr.d.cts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\tr.d.ts  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\tr.js    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\ua.cjs   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\ua.d.cts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\ua.d.ts  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\ua.js    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\uk.cjs   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\uk.d.cts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\uk.d.ts  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\uk.js    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\ur.cjs   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\ur.d.cts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\ur.d.ts  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\ur.js    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\vi.cjs   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\vi.d.cts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\vi.d.ts  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\vi.js    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\yo.cjs   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\yo.d.cts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\yo.d.ts  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\yo.js    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\zh-CN.cjs
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\zh-CN....
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\zh-CN....
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\zh-CN.js 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\zh-TW.cjs
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\zh-TW....
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\zh-TW....
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\locales\zh-TW.js 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\mini\checks.cjs  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\mini\checks.d.cts
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\mini\checks.d.ts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\mini\checks.js   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\mini\coerce.cjs  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\mini\coerce.d.cts
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\mini\coerce.d.ts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\mini\coerce.js   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\mini\external.cjs
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\mini\external....
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\mini\external....
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\mini\external.js 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\mini\index.cjs   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\mini\index.d.cts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\mini\index.d.ts  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\mini\index.js    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\mini\iso.cjs     
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\mini\iso.d.cts   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\mini\iso.d.ts    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\mini\iso.js      
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\mini\package.json
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\mini\parse.cjs   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\mini\parse.d.cts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\mini\parse.d.ts  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\mini\parse.js    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\mini\schemas.cjs 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\mini\schemas.d...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\mini\schemas.d.ts
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4\mini\schemas.js  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4-mini\index.cjs   
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4-mini\index.d.cts 
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4-mini\index.d.ts  
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4-mini\index.js    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\node_modules\zod\v4-mini\package.json



  ```

  *[step-finish part]*

  #### 🤖 Assistant
  *2026-06-02 13:53:39*

  *[step-start part]*

  💭 **Reasoning:**

  <details>
  <summary>Click to expand reasoning</summary>

  Now I have a complete picture. Let me compile my findings into a comprehensive report. The `.opencode` directory in the project is just the standard opencode configuration directory (with node_modules for plugins), but let me check the top-level contents of it to see if there are any plugins or hooks configured.

  </details>

  Let me check the top-level contents of the project's `.opencode` directory (excluding node_modules).

  #### 🔧 Tool: bash
  **Status:** completed
  **Title:** List .opencode top-level contents excluding node_modules

  **Input:**
  ```json
  {
    "description": "List .opencode top-level contents excluding node_modules",
    "command": "Get-ChildItem -LiteralPath \"C:\\Users\\ADMIN\\Documents\\Srinikc\\AI Products\\petemart-agentic-framework\\.opencode\" -ErrorAction SilentlyContinue | Where-Object { $_.Name -ne 'node_modules' } | Select-Object FullName, Length, LastWriteTime, Mode | Format-Table -AutoSize"
  }
  ```

  **Output:**
  ```

  FullName                                                                                            Length LastWriteTim
                                                                                                             e           
  --------                                                                                            ------ ------------
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\agents                   5/30/2026...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\.gitignore        63     5/28/2026...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\package-lock.json 13855  5/28/2026...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\package.json      65     5/28/2026...



  ```

  #### 🔧 Tool: bash
  **Status:** completed
  **Title:** Check plugins directory in .opencode

  **Input:**
  ```json
  {
    "description": "Check plugins directory in .opencode",
    "command": "Get-ChildItem -LiteralPath \"C:\\Users\\ADMIN\\Documents\\Srinikc\\AI Products\\petemart-agentic-framework\\.opencode\\plugins\" -ErrorAction SilentlyContinue -Force | Select-Object FullName, Length, LastWriteTime | Format-Table -AutoSize"
  }
  ```

  **Output:**
  ```
  (no output)
  ```

  #### 🔧 Tool: bash
  **Status:** completed
  **Title:** Check for package.json in .opencode

  **Input:**
  ```json
  {
    "description": "Check for package.json in .opencode",
    "command": "Get-ChildItem -LiteralPath \"C:\\Users\\ADMIN\\Documents\\Srinikc\\AI Products\\petemart-agentic-framework\\.opencode\" -ErrorAction SilentlyContinue -Filter '*.json' | Where-Object { $_.Name -ne 'package-lock.json' } | Select-Object FullName, Length, LastWriteTime | Format-Table -AutoSize"
  }
  ```

  **Output:**
  ```

  FullName                                                                                       Length LastWriteTime    
  --------                                                                                       ------ -------------    
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\package.json     65 5/28/2026 6:39...



  ```

  *[step-finish part]*

  #### 🤖 Assistant
  *2026-06-02 13:53:39*

  *[step-start part]*

  💭 **Reasoning:**

  <details>
  <summary>Click to expand reasoning</summary>

  Now I have a complete picture. Let me read the `.opencode/agents` directory and the `.opencode/package.json` to finalize.

  </details>

  #### 🔧 Tool: read
  **Status:** completed
  **Title:** Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\package.json

  **Input:**
  ```json
  {
    "filePath": "C:\\Users\\ADMIN\\Documents\\Srinikc\\AI Products\\petemart-agentic-framework\\.opencode\\package.json"
  }
  ```

  **Output:**
  ```
  <path>C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\package.json</path>
  <type>file</type>
  <content>
  1: {
  2:   "dependencies": {
  3:     "@opencode-ai/plugin": "1.15.11"
  4:   }
  5: }

  (End of file - total 5 lines)
  </content>
  ```

  #### 🔧 Tool: bash
  **Status:** completed
  **Title:** List agents directory in .opencode

  **Input:**
  ```json
  {
    "description": "List agents directory in .opencode",
    "command": "Get-ChildItem -LiteralPath \"C:\\Users\\ADMIN\\Documents\\Srinikc\\AI Products\\petemart-agentic-framework\\.opencode\\agents\" -ErrorAction SilentlyContinue -Recurse -Force | Select-Object FullName, Length, LastWriteTime | Format-Table -AutoSize"
  }
  ```

  **Output:**
  ```

  FullName                                                                                                               
  --------                                                                                                               
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\agents\00_supervisor_agent.md        
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\agents\01_ideation_agent.md          
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\agents\02_requirement_agent.md       
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\agents\03_architect_agent.md         
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\agents\04_prototype_agent.md         
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\agents\05_program_mgmt_agent.md      
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\agents\06_infra_devops_agent.md      
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\agents\07a_ui_agent.md               
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\agents\07b_api_agent.md              
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\agents\07c_backend_db_agent.md       
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\agents\07d_integration_agent.md      
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\agents\08_qa_agent.md                
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\agents\09_production_agent.md        
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\agents\10_tech_pub_agent.md          
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\agents\11_customer_onboarding_agen...
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\agents\12_marketing_agent.md         
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\agents\13_maintenance_agent.md       
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\agents\14_finops_agent.md            
  C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\.opencode\agents\15_secrets_compliance_agent.md



  ```

  *[step-finish part]*

  #### 🤖 Assistant
  *2026-06-02 13:53:39*

  *[step-start part]*

  💭 **Reasoning:**

  <details>
  <summary>Click to expand reasoning</summary>

  Now I have a complete and comprehensive picture. Let me compile all findings into a clear report.

  </details>

  Here is my comprehensive report on all opencode startup/hook mechanisms found on your system.

  ---

  ## Summary of Findings

  **OpenCode version:** 1.15.13 (installed at `C:\Users\ADMIN\AppData\Roaming\npm\node_modules\opencode-ai`)  
  **Plugin SDK version:** 1.15.1 (at `C:\Users\ADMIN\.config\opencode\node_modules\@opencode-ai\plugin`)

  ---

</details>
<details><summary>Expand</summary>
  ### 1. Config Files Found

  | File | Path | Notes |
  |------|------|-------|
  | Global config | `C:\Users\ADMIN\.config\opencode\opencode.json` | Uses `ollama/qwen2.5-coder:14b` with local Ollama provider |
  | Project config | `C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\opencode.json` | Uses plugins `opencode-autosave-conversation` and `@slkiser/opencode-quota`, enables SonarQube MCP, sets permission rules |
  | Project backup | `C:\Users\ADMIN\Documents\Srinikc\AI Products\petemart-agentic-framework\opencode-backup.json` | Previous config referencing `instructions` files |
  | Project `.opencode/` | `...petemart-agentic-framework\.opencode\` | Contains agent definitions (19 markdown files), `package.json` with `@opencode-ai/plugin@1.15.11` |

  ---

</details>
<details><summary>Expand</summary>
  ### 2. All Startup/Hook Mechanisms Available in OpenCode

  #### A. `experimental.hook` (Config-based hooks -- in TypeScript types but absent from published JSON schema)

  Discovered in the SDK type definitions (`types.gen.d.ts`, line 1179-1195), there is an `experimental.hook` configuration object with **two hook types**:

  ```typescript
  experimental?: {
      hook?: {
          // Run commands when files matching a glob pattern are edited
          file_edited?: {
              [key: string]: Array<{
                  command: Array<string>;    // e.g. ["npm", "run", "lint:fix", "$FILE"]
                  environment?: { [key: string]: string };
              }>;
          };
          // Run commands when a session completes
          session_completed?: Array<{
              command: Array<string>;        // e.g. ["python", "track_usage.py"]
              environment?: { [key: string]: string };
          }>;
      };
  }
  ```

  **Important note:** This `experimental.hook` section IS defined in the TypeScript SDK types (the "source of truth" for the config format) but is **NOT present** in the published JSON schema at `https://opencode.ai/config.json`. This likely means it is a newer/experimental feature that was added to the code but not yet documented.

  **Usage format in opencode.json:**
  ```json
  {
    "experimental": {
      "hook": {
        "file_edited": {
          "*.ts": [{ "command": ["npx", "eslint", "--fix", "$FILE"] }],
          "*.md": [{ "command": ["markdownlint", "--fix", "$FILE"] }]
        },
        "session_completed": [
          { "command": ["python", "scripts/track_usage.py"] }
        ]
      }
    }
  }
  ```

  #### B. Plugin System (Full lifecycle hooks)

  OpenCode has a robust plugin system where JS/TS plugin files placed in `.opencode/plugins/` or `~/.config/opencode/plugins/` can hook into **numerous lifecycle events**. The `Hooks` interface (from `@opencode-ai/plugin/dist/index.d.ts`) defines these available hooks:

  | Hook Name | When It Fires |
  |-----------|---------------|
  | `event` | Any platform event (generic catch-all) |
  | `config` | When config is loaded/modified |
  | `tool` (custom tools) | Registers custom tools available to the LLM |
  | `auth` | Authentication flows |
  | `provider` | Provider model registration |
  | `chat.message` | When a new message is received |
  | `chat.params` | Modify LLM parameters (temperature, topP, etc.) |
  | `chat.headers` | Modify HTTP headers sent to LLM provider |
  | `permission.ask` | When user permission is required |
  | `command.execute.before` | Before a shell command executes |
  | `tool.execute.before` | Before a tool executes (modify args) |
  | `tool.execute.after` | After a tool executes (modify output) |
  | `shell.env` | Inject env vars into shell sessions |
  | `experimental.chat.messages.transform` | Transform messages before LLM send |
  | `experimental.chat.system.transform` | Modify system prompt |
  | `experimental.session.compacting` | Customize compaction/summarization |
  | `experimental.compaction.autocontinue` | Control auto-continue after compaction |
  | `experimental.text.complete` | Text completion intercept |
  | `tool.definition` | Modify tool descriptions sent to LLM |

  **Plugin files are loaded automatically at startup** from:
  - `~/.config/opencode/plugins/` (global)
  - `.opencode/plugins/` (project-level)

  Plugins can also be loaded from npm via the `plugin` config array:
  ```json
  { "plugin": ["opencode-autosave-conversation", "@slkiser/opencode-quota"] }
  ```

  #### C. `instructions` Field (Startup instruction loading)

  The `instructions` field in the config loads files at startup and injects them as additional context/system instructions:

  ```json
  {
    "instructions": ["CONTRIBUTING.md", "docs/guidelines.md", ".cursor/rules/*.md"]
  }
  ```

  This is what your project's `opencode-backup.json` used:
  ```json
  {
    "instructions": [
      "00_state_ledger/STATE_MATRIX.json",
      "00_state_ledger/CHANGE_REQUEST.json",
      "00_state_ledger/AGENT_REGISTRY.json"
    ]
  }
  ```

  #### D. `autoupdate` (Startup auto-update mechanism)

  ```json
  { "autoupdate": true }      // Auto-update on startup
  { "autoupdate": "notify" }  // Notify only, don't auto-update
  { "autoupdate": false }     // Disable auto-update
  ```

  #### E. `postinstall.mjs` (npm package install hook)

  The opencode-ai npm package itself has a `postinstall` script (`C:\Users\ADMIN\AppData\Roaming\npm\node_modules\opencode-ai\postinstall.mjs`) that:
  - Detects the correct platform binary (Windows x64, etc.)
  - Installs the appropriate opencode binary
  - This runs automatically when the npm package is installed

  #### F. Custom Commands (for on-demand use, not auto-startup)

  The `command` config section defines reusable commands (invoked via `/command` in chat), but these are not auto-startup:
  ```json
  {
    "command": {
      "test": { "template": "Run tests with coverage", "description": "..." }
    }
  }
  ```

  ---

</details>
<details><summary>Expand</summary>
  ### 3. What Does NOT Exist

  - **No "on_start" or "startup" or "bootstrap" or "init" config field** exists in opencode's current schema.
  - **No `C:\Users\ADMIN\.opencode\` directory** was found (singular `.opencode` in home does not exist).
  - **No `%ProgramData%\opencode`** managed config directory exists on your system.
  - **No `.opencode/plugins/` directory** exists in either the global or project config (so no plugin files are currently loaded).
  - **No explicit "startup script" or "init script" mechanism** outside of the `experimental.hook` and plugin system described above.

  ---

</details>

---
_Generated by context_lake/capture.py_