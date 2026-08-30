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
type FieldType = 'text' | 'email' | 'textarea' | 'number' | 'select' | 'boolean' | 'list' | 'file';

interface FieldDefinition {
  key: string;
  label: string;
  type?: FieldType;
  options?: string[];
  privateField?: boolean;
  accept?: string;
  help?: string;
}

const sharedFields: FieldDefinition[] = [
  { key: 'visibility', label: 'Visibility', type: 'select', options: ['private', 'public'] },
  { key: 'sortOrder', label: 'Sort order', type: 'number' },
];

const fieldsByModule: Record<string, FieldDefinition[]> = {
  Profile: [
    { key: 'profileImage', label: 'Profile photo', type: 'file' },
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
    { key: 'projectFile', label: 'Project documentation PDF', type: 'file', accept: 'application/pdf', help: 'Optional project report or documentation PDF.' },
    { key: 'projectDocumentPublic', label: 'Allow visitors to view project PDF', type: 'boolean', help: 'Controls the uploaded project document only.' },
    { key: 'featured', label: 'Featured', type: 'boolean' },
  ],
  Certifications: [
    { key: 'name', label: 'Certification name', help: 'Full name shown on the certificate.' },
    { key: 'shortName', label: 'Short name', help: 'Abbreviation such as MTCNA.' },
    { key: 'issuer', label: 'Issuer', help: 'Organization that issued it, such as MikroTik.' },
    { key: 'issuedDate', label: 'Issued date', help: 'Use the date printed on the certificate.' },
    { key: 'expirationDate', label: 'Expiration date', help: 'Leave blank when the certificate does not expire.' },
    { key: 'credentialId', label: 'Credential ID', privateField: true, help: 'Certificate number supplied by the issuer. Leave blank if none is shown.' },
    { key: 'credentialUrl', label: 'Credential verification URL', help: 'Official verification link, if the issuer provides one.' },
    { key: 'description', label: 'Description', type: 'textarea', help: 'A short summary of what the certification covers.' },
    { key: 'skills', label: 'Skills', type: 'list', help: 'Separate skills with commas.' },
    { key: 'certificateFile', label: 'Certificate PDF', type: 'file', accept: 'application/pdf', help: 'Upload the certificate PDF. It will be linked automatically.' },
    { key: 'publicDocument', label: 'Allow visitors to view the PDF', type: 'boolean', help: 'Turn on only when this certificate may be public.' },
    { key: 'featured', label: 'Feature on portfolio', type: 'boolean', help: 'Highlights this certification on the public portfolio.' },
  ],
  Awards: [
    { key: 'name', label: 'Award name' },
    { key: 'issuer', label: 'Issuer' },
    { key: 'issuedDate', label: 'Issued date' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'awardFile', label: 'Award PDF', type: 'file', accept: 'application/pdf', help: 'Upload the award PDF; the document ID is linked automatically.' },
    { key: 'publicDocument', label: 'Allow visitors to view the PDF', type: 'boolean' },
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
    { key: 'name', label: 'Document name', help: 'Example: Chayan Tubsara Resume' },
    { key: 'resumeFile', label: 'Resume PDF', type: 'file', accept: 'application/pdf', help: 'Upload a PDF; Drive ID and MIME type are handled automatically.' },
    { key: 'publicDocument', label: 'Allow visitors to view and download', type: 'boolean' },
  ],
  Documents: [
    { key: 'name', label: 'Document name' },
    { key: 'kind', label: 'Document kind', help: 'Example: transcript, portfolio, or supporting-document.' },
    { key: 'documentFile', label: 'Document PDF', type: 'file', accept: 'application/pdf', help: 'Upload a PDF; Drive ID and MIME type are handled automatically.' },
    { key: 'publicDocument', label: 'Allow public access', type: 'boolean' },
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


function verifiedAdminRecords(module: string, records: AnyRecord[]): AnyRecord[] {
  const verifiedByModule: Record<string, readonly AnyRecord[]> = {
    profile: fallbackData.profile ? [fallbackData.profile as unknown as AnyRecord] : [],
    education: fallbackData.education as unknown as AnyRecord[],
    experience: fallbackData.experience as unknown as AnyRecord[],
    projects: fallbackData.projects as unknown as AnyRecord[],
    certifications: fallbackData.certifications as unknown as AnyRecord[],
    skills: fallbackData.skills as unknown as AnyRecord[],
  };
  const verifiedRecords = verifiedByModule[module];
  if (!verifiedRecords) return records;

  return records.map((record, index) => {
    const verified =
      verifiedRecords.find((item) => item.id === record.id) ??
      verifiedRecords[index];
    if (!verified) return record;

    const corrected: AnyRecord = {
      ...record,
      ...verified,
      id: record.id,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      visibility: record.visibility,
      sortOrder: record.sortOrder,
    };

    if (module === 'profile') {
      corrected.phone = record.phone;
      corrected.address = record.address;
    }

    return corrected;
  });
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

  async function loadRecords(options: { skipBrowserCache?: boolean } = {}) {
    if (!token || active === 'Dashboard' || active === 'Site Settings') return;

    const cacheKey = `portfolio-admin:${key}`;
    if (!options.skipBrowserCache) {
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) setRecords(JSON.parse(cached) as AnyRecord[]);
      } catch {
        sessionStorage.removeItem(cacheKey);
      }
    }

    try {
      const result = await adminApi.list<AnyRecord>(key, token);
      const corrected = verifiedAdminRecords(key, result);
      const visibleRecords =
        active === 'Resume'
          ? corrected.filter((item) => item.kind === 'resume')
          : corrected;
      setRecords(visibleRecords);
      sessionStorage.setItem(cacheKey, JSON.stringify(visibleRecords));
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
    Object.keys(sessionStorage)
      .filter((item) => item.startsWith('portfolio-admin:'))
      .forEach((item) => sessionStorage.removeItem(item));
    setToken('');
  }

  async function removeRecord() {
    if (!deleteTarget) return;
    try {
      await adminApi.remove(key, String(deleteTarget.id), token);
      setDeleteTarget(null);
      setNotice('Deleted successfully');
      sessionStorage.removeItem(`portfolio-admin:${key}`);
      await loadRecords({ skipBrowserCache: true });
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
            sessionStorage.removeItem(`portfolio-admin:${key}`);
            await loadRecords({ skipBrowserCache: true });
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
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  function update(key: string, value: unknown) {
    if (
      key === 'profileImage' ||
      key === 'certificateFile' ||
      key === 'awardFile' ||
      key === 'projectFile' ||
      key === 'resumeFile' ||
      key === 'documentFile'
    ) {
      setUploadFile(value instanceof File ? value : null);
    }
    setRecord((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      const payload: AnyRecord = { ...record };
      let temporaryDocumentId = '';

      if (module === 'Profile' && uploadFile) {
        const uploaded = await adminApi.uploadDocument(
          uploadFile,
          'profile-image',
          token,
        );
        await adminApi.save(
          'documents',
          {
            ...uploaded,
            visibility: 'public',
            publicDocument: true,
            sortOrder: 0,
          },
          token,
        );
      }

      const linkedDocumentConfig: Record<
        string,
        { kind: string; idField: string; publicField: string }
      > = {
        Certifications: {
          kind: 'certificate',
          idField: 'documentId',
          publicField: 'publicDocument',
        },
        Awards: {
          kind: 'award',
          idField: 'documentId',
          publicField: 'publicDocument',
        },
        Projects: {
          kind: 'project-document',
          idField: 'documentationId',
          publicField: 'projectDocumentPublic',
        },
      };
      const linkedConfig = linkedDocumentConfig[module];

      if (linkedConfig && uploadFile) {
        const uploaded = await adminApi.uploadDocument(
          uploadFile,
          linkedConfig.kind,
          token,
        );
        const publish =
          record[linkedConfig.publicField] === true ||
          record[linkedConfig.publicField] === 'true';
        await adminApi.save(
          'documents',
          {
            ...uploaded,
            visibility: publish ? 'public' : 'private',
            publicDocument: publish,
            sortOrder: Number(record.sortOrder ?? 999),
          },
          token,
        );
        payload[linkedConfig.idField] = uploaded.id;
      } else if (linkedConfig && payload[linkedConfig.idField]) {
        const documents = await adminApi.list<AnyRecord>('documents', token);
        const linkedDocument = documents.find(
          (document) => document.id === payload[linkedConfig.idField],
        );
        if (linkedDocument) {
          const publish =
            record[linkedConfig.publicField] === true ||
            record[linkedConfig.publicField] === 'true';
          await adminApi.save(
            'documents',
            {
              ...linkedDocument,
              visibility: publish ? 'public' : 'private',
              publicDocument: publish,
            },
            token,
          );
        }
      }

      if ((module === 'Resume' || module === 'Documents') && uploadFile) {
        const kind =
          module === 'Resume' ? 'resume' : String(record.kind || 'document');
        const uploaded = await adminApi.uploadDocument(uploadFile, kind, token);
        const publish =
          record.publicDocument === true || record.publicDocument === 'true';

        if (initialRecord?.id) {
          payload.driveFileId = uploaded.driveFileId;
          payload.mimeType = uploaded.mimeType;
          payload.name = payload.name || uploaded.name;
          temporaryDocumentId = String(uploaded.id);
        } else {
          Object.assign(payload, uploaded);
        }

        payload.kind = kind;
        payload.visibility = publish ? 'public' : 'private';
        payload.publicDocument = publish;
      }

      [
        'profileImage',
        'certificateFile',
        'awardFile',
        'projectFile',
        'projectDocumentPublic',
        'resumeFile',
        'documentFile',
      ].forEach((key) => delete payload[key]);

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
      if (temporaryDocumentId) {
        await adminApi.remove('documents', temporaryDocumentId, token);
      }
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
  if (field.type === 'file') {
    return (
      <label>
        {field.label}
        <input
          type="file"
          accept={field.accept ?? 'image/jpeg,image/png,image/webp'}
          onChange={(event) => onChange(event.target.files?.[0] ?? null)}
        />
        <small>{field.help ?? 'JPG, PNG, or WEBP up to 8 MB.'}</small>
      </label>
    );
  }

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
      {field.help && <small>{field.help}</small>}
      {!field.help && field.type === 'list' && <small>Separate items with commas.</small>}
    </label>
  );
}
