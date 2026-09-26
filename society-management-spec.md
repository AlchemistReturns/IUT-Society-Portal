# University Society Management System — Specification

## 1. Overview
Web platform for managing university societies (e.g., IUT Computer Society, IUT Debating Society, IUT Chess Society): society profiles, membership, and a configurable multi-level application approval workflow.

**Stack:** Next.js (React, App Router), Supabase (Postgres + Auth + Storage).

---

## 2. Roles & Access Control

### 2.1 Global roles
| Role | Scope | Assigned by |
|---|---|---|
| Super Admin | University-wide | Seeded/initial; can create more |
| Social and Cultural Affairs Committee | University-wide | Super Admin |
| Office of Student Welfare | University-wide | Super Admin |
| Pro-Vice Chancellor | University-wide | Super Admin |
| Vice Chancellor | University-wide | Super Admin |

### 2.2 Per-society roles
| Role | Notes |
|---|---|
| Society Moderator | Faculty; assigned by Super Admin; one per society; can view finance tracker |
| Society Admin (President) | Assigned by Super Admin initially; can appoint another member as Society Admin (transfer/co-admin); manages roles, applications, approves membership |
| Executive | Set by Society Admin |
| Sub-Executive | Set by Society Admin |
| Member | Default after approved membership request |

**Rules:**
- A user can hold multiple roles across societies (e.g., Executive in Society A, Member in Society B) and simultaneously a university-wide role.
- Department Head is a per-society role (each society has its own Department Head assignment, not shared across societies in the same university department), assigned by Super Admin.
- Registration: user signs up with university email → requests membership in a society → Society Admin approves/rejects.

### 2.3 Authentication
- Email + password via Supabase Auth.
- Super Admin configures allowed university email domain(s); signup rejected if domain doesn't match.
- Email verification required before membership requests can be submitted.

---

## 3. Society Profile

Created only by Super Admin (name, description seed). Editable by Society Admin/Executive.

### Mandatory fields
| Field | Type | Notes |
|---|---|---|
| Mission | Text | |
| Vision | Text | |
| Activities | Repeatable blog entries | title, description, images[] |
| Achievements | Repeatable blog entries | title, description, images[], winners[] (name + optional detail) |
| Gallery | Images[] | |
| Reports | PDF documents[] | uploaded, listed with date/title |
| Finance Tracker | Structured data | see §6 |

### Custom fields
- Society Admin can add arbitrary extra profile fields (key-value: label + text/richtext/image), stored separately from mandatory schema so they don't interfere with fixed sections.

---

## 4. Applications & Approval Workflow

### 4.1 Application types
Configurable list per society (e.g., Event, Permission, Logistic Support), managed by Society Admin. Each type has its own default approval chain.

### 4.2 Approval chain configuration
- Entities available for chain-building: Society Moderator, Department Head, Social and Cultural Affairs Committee, Office of Student Welfare, Pro-Vice Chancellor, Vice Chancellor.
- Society Admin defines a **default chain** (ordered subset, levels can be skipped) per application type.
- The chain is **locked to the type's default at submit time** — not editable per individual application/submission. Any change to the routing must be made by editing the application type's default chain (which then applies only to future applications, not in-flight ones — see `chain_json` snapshot in §5).

### 4.3 Application lifecycle
```
DRAFT → SUBMITTED → [Level 1 review] → [Level 2 review] → ... → APPROVED (final)
                            ↓ reject/request changes
                       CHANGES_REQUESTED → (member edits) → SUBMITTED (restarts at Level 1)
                            ↓ reject (final)
                       REJECTED
```

- At each level, the reviewer can: **Approve** (moves to next level, or to APPROVED if last level), **Reject** (terminal — application closed), or **Request Resubmission** (with feedback — application returns to Society Admin/Executive/Sub-Executive for editing).
- On resubmission after edits, the application restarts at Level 1 of its chain (per requirement — no partial resume).
- Every action at every level requires an optional/mandatory comment field (comment is stored and visible in history regardless of direction).
- **Approve action requires signature + seal:** when approving, the reviewer attaches a signature image and a seal. Both are saved to the reviewer's profile on first use and reused/reselected on subsequent approvals (with option to update). Signature and seal images are stamped onto the application record for that level and shown in the printed snapshot.
- Full history log per application: level, actor, action, comment, signature/seal reference (if approved), timestamp — retained across resubmission cycles (not overwritten).

### 4.4 Permissions
- Society Admin, Executive, and Sub-Executive can all create, draft, edit, and (re)submit applications.
- Members: view-only.
- A reviewing entity only sees applications currently at their level, across all societies they oversee.

### 4.5 Printing
- Each application detail page has a "Print" action generating a print-friendly, A4-sized view of the application's **current snapshot only** (current status, content, and — if approved at that level — the approver's signature/seal for that level). Prior-cycle history is not included in the print output.

---

## 5. Data Model (high-level)

```
users (id, email, name, university_domain_verified, created_at)
global_roles (user_id, role_enum)              -- super_admin, sca_committee, student_welfare, pro_vc, vc
societies (id, name, description, moderator_id, created_at)
society_roles (user_id, society_id, role_enum)  -- admin, executive, sub_executive, member
society_department_heads (society_id, user_id)  -- if Dept Head modeled per-society
membership_requests (id, user_id, society_id, status, requested_at, decided_by, decided_at)

profile_sections (society_id, mission, vision)
activities (id, society_id, title, description, images[], created_at)
achievements (id, society_id, title, description, winners[], images[], created_at)
gallery_images (id, society_id, image_url, caption)
reports (id, society_id, file_url, title, uploaded_at)
custom_fields (id, society_id, label, type, value)

finance_entries (id, society_id, type[income/expense], amount, category, note, entered_by, date)

application_types (id, society_id, name, default_chain_json)
applications (id, society_id, type_id, title, details, status, current_level_index, chain_json, created_by, created_at)
application_history (id, application_id, level_index, entity_role, actor_id, action[approve/reject/request_changes], comment, signature_url, seal_url, created_at)

user_signatures (user_id, signature_image_url, seal_image_url, updated_at)  -- saved for reuse across approvals
```

`chain_json` snapshot stored per application (not just a reference to the type default) so edits to the type's default chain don't retroactively affect in-flight applications.

---

## 6. Finance Tracker

- Entry: type (income/expense), amount, category, note, date. Entry strictly restricted to Society Admin (not Executives/Sub-Executives).
- Visibility: Society Admin/Executive (full), Moderator (view-only).
- Standard visualizations (default set, adjustable later):
  - Monthly income vs. expense bar chart
  - Expense breakdown by category (pie/donut)
  - Running balance line chart over time
  - Summary cards: total income, total expense, net balance (current period + all-time)

---

## 7. UI / Design Guidelines
- Overall tone: modern SaaS product — not stiff/corporate, not casual. Clean layout, generous whitespace, a clear type scale, subtle color accents (avoid heavy gradients or playful illustration-heavy styling).
- Tooltips on non-obvious controls and fields (e.g., role meanings, approval chain steps, finance chart terms) to reduce need for external documentation.
- Consistent component patterns: cards for society profiles/activities/achievements, stepper/timeline component for approval chain visualization (showing current level, completed levels with signature/seal thumbnail, pending levels).
- Responsive (society members and reviewers will access on mobile/tablet as well as desktop).

## 8. Non-functional notes
- File storage (images, PDFs, signatures, seals) via Supabase Storage, scoped per society.
- Row-Level Security (Supabase RLS) enforced per role for all tables above — critical given multi-tenant (per-society) + university-wide role structure.
- Notifications (in-app minimum): membership request decisions, application status changes at each level, resubmission requests.
