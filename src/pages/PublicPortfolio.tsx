import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Award,
  BriefcaseBusiness,
  Cloud,
  Code2,
  Download,
  ExternalLink,
  FileText as FileTextIcon,
  GitBranch,
  GraduationCap,
  Mail,
  Menu,
  Moon,
  Network,
  Server,
  Sun,
  X,
} from 'lucide-react';
import { fallbackData } from '../data/fallback';
import { getPortfolio } from '../services/api';
import {
  downloadDocument,
  prefetchDocuments,
} from '../services/documents';
import type { PortfolioData, Project } from '../types/portfolio';

const PdfViewer = lazy(() =>
  import('../components/PdfViewer').then((module) => ({
    default: module.PdfViewer,
  })),
);

const navigation = [
  'About',
  'Experience',
  'Projects',
  'Certifications',
  'Skills',
  'Contact',
];

export function PublicPortfolio({ route }: { route: string }) {
  const [data, setData] = useState<PortfolioData>(fallbackData);
  const [isDark, setIsDark] = useState(
    () =>
      localStorage.theme === 'dark' ||
      (!localStorage.theme &&
        matchMedia('(prefers-color-scheme: dark)').matches),
  );
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [viewer, setViewer] = useState<{
    url: string;
    title: string;
  } | null>(null);

  useEffect(() => {
    getPortfolio().then(setData);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
    localStorage.theme = isDark ? 'dark' : 'light';
  }, [isDark]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [route]);

  useEffect(() => {
    if (!isMenuOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMenuOpen(false);
    };
    const closeOnDesktop = () => {
      if (window.innerWidth > 850) setIsMenuOpen(false);
    };

    document.body.classList.add('menu-open');
    window.addEventListener('keydown', closeOnEscape);
    window.addEventListener('resize', closeOnDesktop);

    return () => {
      document.body.classList.remove('menu-open');
      window.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('resize', closeOnDesktop);
    };
  }, [isMenuOpen]);

  const groupedSkills = useMemo(
    () =>
      data.skills.reduce<Record<string, typeof data.skills>>(
        (groups, skill) => {
          (groups[skill.category] ??= []).push(skill);
          return groups;
        },
        {},
      ),
    [data.skills],
  );

  const selectedProjectId = route.match(/^#\/projects\/(.+)$/)?.[1];
  const selectedProject = data.projects.find(
    (project) => project.id === selectedProjectId,
  );
  const selectedProjectDocument = data.documents.find(
    (document) => document.id === selectedProject?.documentationId,
  );
  const resume = data.documents.find(
    (document) =>
      document.kind === 'resume' &&
      document.publicDocument &&
      document.visibility === 'public',
  );
  const profileImage = [...data.documents]
    .filter(
      (document) =>
        document.kind === 'profile-image' &&
        document.publicDocument &&
        document.visibility === 'public',
    )
    .sort((a, b) =>
      String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? '')),
    )[0];

  useEffect(() => {
    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    if (connection?.saveData) return;

    const timer = window.setTimeout(() => {
      void import('../components/PdfViewer');
      prefetchDocuments(
        data.documents
          .filter((document) => document.mimeType === 'application/pdf')
          .slice(0, 4)
          .map((document) =>
            documentUrl(
              isStaticDocumentReference(document.driveFileId)
                ? document.driveFileId
                : document.id,
              document.updatedAt,
            ),
          ),
      );
    }, 700);

    return () => window.clearTimeout(timer);
  }, [data.documents]);

  function closeMenu() {
    setIsMenuOpen(false);
  }

  function openPublicDocument(documentId: string, title: string) {
    const document = data.documents.find((item) => item.id === documentId);
    if (!document) return;
    setViewer({
      url: documentUrl(
        isStaticDocumentReference(document.driveFileId)
          ? document.driveFileId
          : document.id,
        document.updatedAt,
      ),
      title,
    });
  }

  function openResume() {
    if (!resume) {
      setViewer({ url: '', title: 'Resume' });
      return;
    }
    openPublicDocument(resume.id, resume.name);
  }

  async function downloadResume() {
    if (!resume) return;
    await downloadDocument(
      documentUrl(
        isStaticDocumentReference(resume.driveFileId)
          ? resume.driveFileId
          : resume.id,
        resume.updatedAt,
      ),
      'Chayan-Tubsara-Resume.pdf',
    );
  }

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <header className="topbar">
        <a className="brand" href="#home" aria-label="Portfolio home">
          <Network aria-hidden="true" />
          <span>
            {data.profile?.name.replace('Mr. ', '')}
            <small>Network Engineering Portfolio</small>
          </span>
        </a>

        <nav aria-label="Primary navigation">
          {navigation.map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`}>
              {item}
            </a>
          ))}
        </nav>

        <div className="top-actions">
          <button
            className="icon-button"
            onClick={() => setIsDark((current) => !current)}
            aria-label={isDark ? 'Use light theme' : 'Use dark theme'}
          >
            {isDark ? <Sun /> : <Moon />}
          </button>
          <button
            className="icon-button menu-button"
            onClick={() => setIsMenuOpen((current) => !current)}
            aria-label="Open navigation menu"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
          >
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {isMenuOpen && (
          <nav
            className="mobile-nav"
            id="mobile-navigation"
            aria-label="Mobile navigation"
          >
            {navigation.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                onClick={closeMenu}
              >
                {item}
              </a>
            ))}
          </nav>
        )}
      </header>

      <main id="main-content">
        <section className="hero" id="home">
          <div className="hero-copy">
            <p className="hero-eyebrow">Network Engineering · IT Infrastructure</p>
            <h1>{data.profile?.name}</h1>
            <h2>{data.profile?.title}</h2>
            <p className="hero-summary">{data.profile?.introduction}</p>
            <div className="hero-buttons">
              <a className="button primary" href="#projects">
                View projects <ArrowRight />
              </a>
              <button className="button secondary" onClick={openResume}>
                View resume
              </button>
              {resume ? (
                <button className="button ghost" onClick={downloadResume}>
                  <Download /> Download resume
                </button>
              ) : (
                <span className="private-note">
                  Public resume available upon request
                </span>
              )}
            </div>
          </div>

          {profileImage ? (
            <ProfilePortrait
              documentId={profileImage.id}
              mimeType={profileImage.mimeType}
              name={data.profile?.name ?? 'Profile'}
            />
          ) : (
            <div className="network-visual" aria-hidden="true">
              <div className="orb">
                <Network />
              </div>
              <span className="node n1" />
              <span className="node n2" />
              <span className="node n3" />
              <span className="line l1" />
              <span className="line l2" />
              <span className="line l3" />
            </div>
          )}
        </section>

        <section className="section split" id="about">
          <div>
            <p className="section-number">01 · Profile</p>
            <h2>Personal goal & education</h2>
            <p className="lead">{data.profile?.about}</p>
          </div>
          <div className="education-list">
            {data.education.map((item) => (
              <article key={item.id}>
                <GraduationCap aria-hidden="true" />
                <div>
                  <h3>{item.institution}</h3>
                  <p>{item.qualification}</p>
                  <span>
                    {item.startYear} — {item.endYear}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section dark-band" id="experience">
          <div className="section-heading">
            <p className="section-number">02 · Experience</p>
            <h2>Hands-on network experience</h2>
          </div>
          {data.experience.map((item) => (
            <article className="experience" key={item.id}>
              <div className="experience-meta">
                <BriefcaseBusiness aria-hidden="true" />
                <span>
                  {item.startDate} — {item.endDate}
                </span>
                <strong>{item.employmentType}</strong>
              </div>
              <div>
                <h3>{item.position}</h3>
                <h4>{item.company}</h4>
                <ul>
                  {item.responsibilities.map((responsibility) => (
                    <li key={responsibility}>{responsibility}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </section>

        <section className="section" id="projects">
          <div className="section-heading">
            <p className="section-number">03 · Selected work</p>
            <h2>Academic projects</h2>
            <p>
              Practical university coursework across web development,
              networking, server administration, and cybersecurity.
            </p>
          </div>
          <div className="projects-grid">
            {data.projects.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} />
            ))}
          </div>
        </section>

        <section className="section certification-band" id="certifications">
          <div className="section-heading">
            <p className="section-number">04 · Credentials</p>
            <h2>Certifications & awards</h2>
          </div>
          {data.certifications.map((certification) => (
            <article className="cert-row" key={certification.id}>
              <Award aria-hidden="true" />
              <div>
                <strong>{certification.shortName}</strong>
                <h3>{certification.name}</h3>
                <p>
                  {certification.issuer}
                  {certification.issuedDate
                    ? ` · ${certification.issuedDate}`
                    : ''}
                </p>
              </div>
              <div>
                {certification.documentId &&
                certification.publicDocument ? (
                  <button
                    className="button secondary"
                    onClick={() =>
                      setViewer({
                        url: documentUrl(
                          certification.documentId,
                          data.documents.find(
                            (document) =>
                              document.id === certification.documentId,
                          )?.updatedAt,
                        ),
                        title: certification.name,
                      })
                    }
                  >
                    View certificate
                  </button>
                ) : (
                  <span className="private-note">
                    Document available upon request
                  </span>
                )}
              </div>
            </article>
          ))}
          {data.awards.map((award) => (
            <article className="cert-row" key={award.id}>
              <Award aria-hidden="true" />
              <div>
                <strong>Award</strong>
                <h3>{award.name}</h3>
                <p>
                  {award.issuer}
                  {award.issuedDate ? ` · ${award.issuedDate}` : ''}
                </p>
              </div>
              <div>
                {award.documentId && award.publicDocument ? (
                  <button
                    className="button secondary"
                    onClick={() =>
                      setViewer({
                        url: documentUrl(
                          award.documentId,
                          data.documents.find(
                            (document) => document.id === award.documentId,
                          )?.updatedAt,
                        ),
                        title: award.name,
                      })
                    }
                  >
                    View award
                  </button>
                ) : (
                  <span className="private-note">
                    Document available upon request
                  </span>
                )}
              </div>
            </article>
          ))}
        </section>

        <section className="section" id="skills">
          <div className="section-heading">
            <p className="section-number">05 · Capabilities</p>
            <h2>Skills & languages</h2>
          </div>
          <div className="skills-layout">
            {Object.entries(groupedSkills).map(([category, skills]) => (
              <div className="skill-group" key={category}>
                <h3>{category}</h3>
                <div>
                  {skills.map((skill) => (
                    <span key={skill.id}>{skill.name}</span>
                  ))}
                </div>
              </div>
            ))}
            <div className="skill-group">
              <h3>Languages</h3>
              {data.languages.map((language) => (
                <p key={language.name}>
                  <strong>{language.name}</strong> — {language.level}
                </p>
              ))}
            </div>
          </div>
        </section>

        <section className="contact" id="contact">
          <div>
            <p className="section-number">06 · Contact</p>
          </div>
          <a className="button light" href={`mailto:${data.profile?.email}`}>
            <Mail /> {data.profile?.email}
          </a>
        </section>
      </main>

      <footer className="footer">
        <span>
          © {new Date().getFullYear()} {data.profile?.name}
        </span>
        <a href="#/admin">Admin</a>
        <div>
          {data.socialLinks.map((link) => (
            <a key={link.id} href={link.url} aria-label={link.platform}>
              {link.platform === 'GitHub' ? <GitBranch /> : <ExternalLink />}
            </a>
          ))}
        </div>
      </footer>

      {viewer &&
        (viewer.url ? (
          <Suspense
            fallback={<div className="screen-loader">Loading viewer…</div>}
          >
            <PdfViewer {...viewer} onClose={() => setViewer(null)} />
          </Suspense>
        ) : (
          <div className="modal-backdrop">
            <div className="dialog" role="dialog" aria-modal="true">
              <button
                className="dialog-close"
                onClick={() => setViewer(null)}
                aria-label="Close"
              >
                <X />
              </button>
              <h2>Resume available upon request</h2>
              <p>
                The source resume contains private contact details, so it is not
                published automatically.
              </p>
              <a
                className="button primary"
                href={`mailto:${data.profile?.email}`}
              >
                Request by email
              </a>
            </div>
          </div>
        ))}

      {selectedProject && (
        <ProjectDetail
          project={selectedProject}
          documentName={selectedProjectDocument?.name}
          onViewDocument={
            selectedProjectDocument ||
            isStaticDocumentReference(selectedProject.documentationId)
              ? () =>
                  setViewer({
                    url: documentUrl(
                      selectedProjectDocument?.driveFileId ||
                        selectedProject.documentationId,
                      selectedProjectDocument?.updatedAt,
                    ),
                    title:
                      selectedProjectDocument?.name ||
                      `${selectedProject.name} documentation`,
                  })
              : undefined
          }
        />
      )}
    </div>
  );
}

function isStaticDocumentReference(reference: unknown) {
  const value = String(reference ?? '').trim();
  return (
    value.startsWith('documents/') ||
    value.startsWith('/documents/') ||
    value.startsWith('https://')
  );
}

function documentUrl(reference: string, version = '') {
  const value = String(reference ?? '').trim();

  if (value.startsWith('https://')) {
    return value;
  }

  if (
    value.startsWith('documents/') ||
    value.startsWith('/documents/')
  ) {
    const relativePath = value.replace(/^\/+/, '');
    return `${import.meta.env.BASE_URL}${relativePath}`;
  }

  const params = new URLSearchParams({
    action: 'document',
    id: value,
  });
  if (version) params.set('v', version);
  return `${String(import.meta.env.VITE_GAS_API_URL)}?${params.toString()}`;
}

function ProjectCard({
  project,
  index,
}: {
  project: Project;
  index: number;
}) {
  const icons = [Code2, Network, Server, Cloud];
  const Icon = icons[index % icons.length];

  return (
    <a className="project-card" href={`#/projects/${project.id}`}>
      <Icon aria-hidden="true" />
      <span>{project.projectType}</span>
      <h3>{project.name}</h3>
      <p>{project.shortDescription}</p>
      <span className="project-link">
        View project <ArrowRight aria-hidden="true" />
      </span>
    </a>
  );
}

function ProjectDetail({
  project,
  documentName,
  onViewDocument,
}: {
  project: Project;
  documentName?: string;
  onViewDocument?: () => void;
}) {
  return (
    <div className="modal-backdrop">
      <article className="project-detail" role="dialog" aria-modal="true">
        <a className="dialog-close" href="#projects" aria-label="Close project">
          <X />
        </a>
        <p className="section-number">Academic case study</p>
        <h2>{project.name}</h2>
        <p className="lead">{project.shortDescription}</p>
        <dl>
          <div>
            <dt>Course</dt>
            <dd>{project.courseName || 'To be added'}</dd>
          </div>
          <div>
            <dt>Year</dt>
            <dd>{project.year || 'To be added'}</dd>
          </div>
          <div>
            <dt>Objective</dt>
            <dd>{project.objective || 'More project details will be added.'}</dd>
          </div>
          <div>
            <dt>My role</dt>
            <dd>{project.role || 'More project details will be added.'}</dd>
          </div>
        </dl>
        {onViewDocument && (
          <button className="button secondary" onClick={onViewDocument}>
            <FileTextIcon /> View {documentName || 'project PDF'}
          </button>
        )}
      </article>
    </div>
  );
}

function ProfilePortrait({
  documentId,
  mimeType,
  name,
}: {
  documentId: string;
  mimeType: string;
  name: string;
}) {
  const [source, setSource] = useState('');

  useEffect(() => {
    let isActive = true;

    fetch(documentUrl(documentId))
      .then((response) => {
        if (!response.ok) throw new Error('Profile image unavailable');
        return response.text();
      })
      .then((base64) => {
        if (isActive) {
          setSource(`data:${mimeType};base64,${base64.trim()}`);
        }
      })
      .catch(() => {
        if (isActive) setSource('');
      });

    return () => {
      isActive = false;
    };
  }, [documentId, mimeType]);

  return (
    <div className="profile-portrait">
      {source ? (
        <img
          src={source}
          alt={`${name} profile`}
          width="430"
          height="500"
          decoding="async"
        />
      ) : (
        <div
          className="profile-image-skeleton"
          aria-label="Loading profile photo"
        />
      )}
    </div>
  );
}
