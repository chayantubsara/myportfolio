import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Award,
  BriefcaseBusiness,
  FileText,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Menu,
  Network,
  Plus,
  Save,
  Settings,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { adminApi } from '../services/api';
import { fallbackData } from '../data/fallback';

const modules = [
  ['Dashboard', LayoutDashboard],
  ['Profile', UserRound],
  ['Experience', BriefcaseBusiness],
  ['Education', GraduationCap],
  ['Projects', FolderKanban],
  ['Certifications', Award],
  ['Awards', Award],
  ['Skills', Network],
  ['Social Links', Network],
  ['Resume', FileText],
  ['Documents', FileText],
  ['Site Settings', Settings],
  ['Audit Logs', Activity],
] as const;

type AnyRecord = Record<string, unknown>;
type FieldType = 'text' | 'email' | 'textarea' | 'number' | 'select' | 'boolean' | 'list';

interface FieldDefinition {
  key: string;
  label: string;
  type?: FieldType;
  options?: string[];
  privateField?: boolean;
}

const sharedFields: FieldDefinition[] = [
  { key: 'visibility', label: 'Visibility', type: 'select', options: ['private', 'public'] },
  { key: 'sortOrder', label: 'Sort order', type: 'number' },
];

const fieldsByModule: Record<string, FieldDefinition[]> = {
  Profile: [
    { key: 'name', label: 'Display name' },
    { key: 'title', label: 'Professional title' },
    { key: 'introduction', label: 'Short introduction', type: 'textarea' },
    { key: 'about', label: 'About me', type: 'textarea' },
    { key: 'email', label: 'Public email', type: 'email' },
    { key: 'phone', label: 'Phone', privateField: true },
    { key: 'address', label: 'Address', type: 'textarea', privateField: true },
  ],
  Experience: [
    { key: 'company', label: 'Company' },
    { key: 'position', label: 'Position' },
    { key: 'employmentType', label: 'Employment type' },
    { key: 'startDate', label: 'Start date' },
    { key: 'endDate', label: 'End date' },
    { key: 'location', label: 'Location' },
    { key: 'responsibilities', label: 'Responsibilities', type: 'list' },
    { key: 'technologies', label: 'Technologies', type: 'list' },
  ],
  Education: [
    { key: 'institution', label: 'Institution' },
    { key: 'qualification', label: 'Qualification' },
    { key: 'startYear', label: 'Start year' },
    { key: 'endYear', label: 'End year' },
  ],
  Projects: [
    { key: 'name', label: 'Project name' },
    { key: 'projectType', label: 'Project type' },
    { key: 'courseName', label: 'Course name' },
    { key: 'year', label: 'Year' },
    { key: 'shortDescription', label: 'Short description', type: 'textarea' },
    { key: 'fullDescription', label: 'Full description', type: 'textarea' },
    { key: 'objective', label: 'Problem / objective', type: 'textarea' },
    { key: 'role', label: 'My role', type: 'textarea' },
    { key: 'solution', label: 'Solution', type: 'textarea' },
    { key: 'techStack', label: 'Tech stack', type: 'list' },
    { key: 'features', label: 'Features', type: 'list' },
    { key: 'skillsLearned', label: 'Skills learned', type: 'list' },
    { key: 'githubUrl', label: 'GitHub URL' },
    { key: 'demoUrl', label: 'Demo URL' },
    { key: 'featured', label: 'Featured', type: 'boolean' },
  ],
  Certifications: [
    { key: 'name', label: 'Certification name' },
    { key: 'shortName', label: 'Short name' },
    { key: 'issuer', label: 'Issuer' },
    { key: 'issuedDate', label: 'Issued date' },
    { key: 'expirationDate', label: 'Expiration date' },
    { key: 'credentialId', label: 'Credential ID', privateField: true },
    { key: 'credentialUrl', label: 'Credential URL' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'skills', label: 'Skills', type: 'list' },
    { key: 'documentId', label: 'Document record ID' },
    { key: 'publicDocument', label: 'Public document', type: 'boolean' },
    { key: 'featured', label: 'Featured', type: 'boolean' },
  ],
  Awards: [
    { key: 'name', label: 'Award name' },
    { key: 'issuer', label: 'Issuer' },
    { key: 'issuedDate', label: 'Issued date' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'documentId', label: 'Document record ID' },
    { key: 'publicDocument', label: 'Public document', type: 'boolean' },
    { key: 'featured', label: 'Featured', type: 'boolean' },
  ],
  Skills: [
    { key: 'name', label: 'Skill name' },
    {
      key: 'category',
      label: 'Category',
      type: 'select',
      options: ['Networking', 'System / Infrastructure', 'Programming / Web', 'Cloud / Infrastructure', 'Tools', 'Productivity'],
    },
  ],
  'Social Links': [
    { key: 'platform', label: 'Platform' },
    { key: 'url', label: 'Profile URL' },
  ],
  Resume: [
    { key: 'name', label: 'Document name' },
    { key: 'driveFileId', label: 'Google Drive File ID', privateField: true },
    { key: 'mimeType', label: 'MIME type' },
    { key: 'publicDocument', label: 'Public document', type: 'boolean' },
  ],
  Documents: [
    { key: 'name', label: 'Document name' },
    { key: 'kind', label: 'Document kind' },
    { key: 'driveFileId', label: 'Google Drive File ID', privateField: true },
    { key: 'mimeType', label: 'MIME type' },
    { key: 'publicDocument', label: 'Public document', type: 'boolean' },
  ],
};

function moduleKey(label: string) {
  if (label === 'Resume') return 'documents';
  return label.toLowerCase().replaceAll(' ', '_');
}

function recordTitle(record: AnyRecord) {
  return String(
    record.name ??
      record.title ??
      record.institution ??
      record.company ??
      record.platform ??
      'Untitled',
  );
}

export default function AdminApp() {
  const [token, setToken] = useState(() => sessionStorage.adminToken || '');
  const [active, setActive] = useState('Dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [records, setRecords] = useState<AnyRecord[]>([]);
  const [editing, setEditing] = useState<AnyRecord | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<AnyRecord | null>(null);
  const [notice, setNotice] = useState('');
  const key = moduleKey(active);

  async function loadRecords() {
    if (!token || active === 'Dashboard' || active === 'Site Settings') return;
    try {
      const result = await adminApi.list<AnyRecord>(key, token);
      setRecords(active === 'Resume' ? result.filter((item) => item.kind === 'resume') : result);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to load content');
    }
  }

  useEffect(() => {
    void loadRecords();
  }, [active, token]);

  function logout() {
    void adminApi.logout(token).catch(() => undefined);
    sessionStorage.removeItem('adminToken');
    setToken('');
  }

  async function removeRecord() {
    if (!deleteTarget) return;
    try {
      await adminApi.remove(key, String(deleteTarget.id), token);
      setDeleteTarget(null);
      setNotice('Deleted successfully');
      await loadRecords();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Delete failed');
    }
  }

  if (!token) {
    return (
      <Login
        onLogin={(value) => {
          sessionStorage.adminToken = value;
          setToken(value);
        }}
      />
    );
  }

  const counts = {
    Projects: fallbackData.projects.length,
    Certifications: fallbackData.certifications.length,
    Experience: fallbackData.experience.length,
    Skills: fallbackData.skills.length,
  };

  const canCreate = !['Profile', 'Resume', 'Audit Logs', 'Site Settings'].includes(active);
  const fields = [...(fieldsByModule[active] ?? []), ...sharedFields];

  return (
    <div className="admin-shell">
      <aside className={menuOpen ? 'open' : ''}>
        <div className="admin-brand">
          <Network />
          <strong>
            NetworkPro<small>Portfolio CMS</small>
          </strong>
          <button onClick={() => setMenuOpen(false)} aria-label="Close menu">
            <X />
          </button>
        </div>

        <nav>
          {modules.map(([label, Icon]) => (
            <button
              className={active === label ? 'active' : ''}
              key={label}
              onClick={() => {
                setActive(label);
                setMenuOpen(false);
              }}
            >
              <Icon />
              {label}
            </button>
          ))}
        </nav>

        <button className="logout" onClick={logout}>
          <LogOut /> Logout
        </button>
      </aside>

      <main>
        <header className="admin-header">
          <button className="admin-menu" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu />
          </button>
          <div>
            <h1>{active}</h1>
            <p>Manage portfolio content and public visibility.</p>
          </div>
          <div className="secure">
            <ShieldCheck /> Authenticated session
          </div>
        </header>

        {notice && (
          <div className="toast">
            {notice}
            <button onClick={() => setNotice('')} aria-label="Dismiss notification">
              <X />
            </button>
          </div>
        )}

        {active === 'Dashboard' ? (
          <Dashboard counts={counts} />
        ) : active === 'Site Settings' ? (
          <section className="admin-panel">
            <h2>Site settings</h2>
            <p>Site-wide settings are managed from the settings sheet. Content modules can be edited from this dashboard.</p>
          </section>
        ) : (
          <section className="admin-panel">
            <div className="panel-heading">
              <div>
                <h2>{active}</h2>
                <p>{records.length} records</p>
              </div>
              {canCreate && (
                <button className="button primary" onClick={() => setEditing(null)}>
                  <Plus /> Add item
                </button>
              )}
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Title / Name</th>
                    <th>Visibility</th>
                    <th>Sort order</th>
                    <th>Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.length ? (
                    records.map((record, index) => (
                      <tr key={String(record.id ?? index)}>
                        <td>{recordTitle(record)}</td>
                        <td>
                          <span className={`status ${record.visibility === 'public' ? 'public' : 'private'}`}>
                            {String(record.visibility ?? 'private')}
                          </span>
                        </td>
                        <td>{String(record.sortOrder ?? index + 1)}</td>
                        <td>{String(record.updatedAt ?? '—')}</td>
                        <td>
                          {active !== 'Audit Logs' && (
                            <>
                              <button className="table-action" onClick={() => setEditing(record)} aria-label="Edit">
                                <Save />
                              </button>
                              {canCreate && (
                                <button className="table-action danger" onClick={() => setDeleteTarget(record)} aria-label="Delete">
                                  <Trash2 />
                                </button>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5}>
                        <div className="empty-state">
                          No records returned. Confirm the GAS deployment or create the first item.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {editing !== undefined && (
        <EditDrawer
          module={active}
          fields={fields}
          initialRecord={editing}
          token={token}
          onClose={() => setEditing(undefined)}
          onSaved={async () => {
            setEditing(undefined);
            setNotice('Saved successfully');
            await loadRecords();
          }}
        />
      )}

      {deleteTarget && (
        <div className="modal-backdrop">
          <div className="dialog">
            <h2>Delete this item?</h2>
            <p>This will permanently delete “{recordTitle(deleteTarget)}”.</p>
            <div className="drawer-actions">
              <button className="button secondary" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button className="button primary" onClick={() => void removeRecord()}>
                Delete item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Dashboard({ counts }: { counts: Record<string, number> }) {
  return (
    <>
      <section className="privacy-banner">
        <LockKeyhole />
        <div>
          <strong>Private by default</strong>
          <p>Sensitive fields and documents stay private until you explicitly enable public visibility.</p>
        </div>
      </section>
      <div className="stats">
        {Object.entries(counts).map(([label, value]) => (
          <article key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </article>
        ))}
      </div>
      <section className="admin-panel">
        <h2>Content editing is ready</h2>
        <ol>
          <li>Open Profile to correct your display name, title, introduction, and About text.</li>
          <li>Open each content module to edit its complete fields.</li>
          <li>Review visibility before publishing documents or sensitive content.</li>
        </ol>
      </section>
    </>
  );
}

function Login({ onLogin }: { onLogin: (token: string) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await adminApi.login(username, password);
      onLogin(result.token);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-brand">
        <Network />
        <h1>NetworkPro</h1>
        <p>Secure portfolio content management.</p>
      </section>
      <form className="login-card" onSubmit={submit}>
        <ShieldCheck />
        <h2>Admin sign in</h2>
        <p>Credentials are verified by Google Apps Script. Passwords are never stored in the frontend.</p>
        <label>
          Username or email
          <input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </label>
        {error && <div className="form-error">{error}</div>}
        <button className="button primary" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <a href="#home">Return to portfolio</a>
      </form>
    </main>
  );
}

function EditDrawer({
  module,
  fields,
  initialRecord,
  token,
  onClose,
  onSaved,
}: {
  module: string;
  fields: FieldDefinition[];
  initialRecord: AnyRecord | null;
  token: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const initialValues = useMemo(() => {
    const values: AnyRecord = {
      ...(initialRecord ?? {}),
      visibility: initialRecord?.visibility ?? 'private',
      sortOrder: initialRecord?.sortOrder ?? 999,
    };
    fields.forEach((field) => {
      if (field.type === 'list' && Array.isArray(values[field.key])) {
        values[field.key] = (values[field.key] as unknown[]).join(', ');
      }
    });
    return values;
  }, [initialRecord, fields]);

  const [record, setRecord] = useState<AnyRecord>(initialValues);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function update(key: string, value: unknown) {
    setRecord((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = { ...record };
      fields.forEach((field) => {
        if (field.type === 'list') {
          payload[field.key] = String(payload[field.key] ?? '')
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
        }
        if (field.type === 'number') {
          payload[field.key] = Number(payload[field.key] ?? 0);
        }
      });
      await adminApi.save(moduleKey(module), payload, token);
      onSaved();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Save failed');
      setBusy(false);
    }
  }

  return (
    <div className="drawer-backdrop">
      <form className="edit-drawer" onSubmit={submit}>
        <header>
          <div>
            <h2>{initialRecord ? 'Edit' : 'Add'} {module}</h2>
            <p>{initialRecord ? 'Update the fields below.' : 'New content is private by default.'}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close editor">
            <X />
          </button>
        </header>

        <div className="drawer-fields">
          {fields.map((field) => (
            <EditorField key={field.key} field={field} value={record[field.key]} onChange={(value) => update(field.key, value)} />
          ))}
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="drawer-actions">
          <button type="button" className="button secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="button primary" disabled={busy}>
            <Save /> {busy ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

function EditorField({
  field,
  value,
  onChange,
}: {
  field: FieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  if (field.type === 'boolean') {
    return (
      <label className="toggle-field">
        <span>
          {field.label}
          {field.privateField && <small>Private field</small>}
        </span>
        <input type="checkbox" checked={value === true || value === 'true'} onChange={(event) => onChange(event.target.checked)} />
      </label>
    );
  }

  return (
    <label>
      {field.label}
      {field.privateField && <small>Stored for Admin use; never returned by the public profile API.</small>}
      {field.type === 'textarea' ? (
        <textarea rows={4} value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} />
      ) : field.type === 'select' ? (
        <select value={String(value ?? field.options?.[0] ?? '')} onChange={(event) => onChange(event.target.value)}>
          {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      ) : (
        <input
          type={field.type === 'email' ? 'email' : field.type === 'number' ? 'number' : 'text'}
          value={String(value ?? '')}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {field.type === 'list' && <small>Separate items with commas.</small>}
    </label>
  );
}
