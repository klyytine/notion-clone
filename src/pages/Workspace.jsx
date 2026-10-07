import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { usePages } from '../context/PagesContext';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import PageHeader from '../components/PageHeader';
import BlockEditor from '../editor/BlockEditor';
import HelpPage from './HelpPage';
import StatusBar from '../components/StatusBar';
import { usePrefs } from '../context/PrefsContext';
import { FileActionsProvider } from '../files/FileActions';
import { useLanguage, t } from '../i18n';

const MOBILE_QUERY = '(max-width: 768px)';
const isMobile = () => window.matchMedia(MOBILE_QUERY).matches;

export default function Workspace({ view = 'page' }) {
  const { pageId } = useParams();
  const { pages, updatePage, createPage } = usePages();
  const { prefs } = usePrefs();
  const language = useLanguage();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(() => !isMobile());
  const editorApi = useRef(null);
  const isHelp = view === 'help';
  const page = isHelp ? null : pages.find((p) => p.id === pageId);

  useEffect(() => {
    if (isHelp) document.title = `${t('common.help')} – ${t('app.name')}`;
    else if (page) document.title = `${page.icon ? `${page.icon} ` : ''}${page.title || t('common.untitled')}`;
  }, [isHelp, page?.icon, page?.title, language]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        setSidebarOpen((o) => !o);
      }
      if ((e.metaKey || e.ctrlKey) && e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        navigate(`/p/${createPage().id}`);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [createPage, navigate]);

  if (!isHelp && !page) return <Navigate to={`/p/${pages[0].id}`} replace />;

  const closeOnMobile = () => isMobile() && setSidebarOpen(false);

  return (
    <FileActionsProvider page={page}>
      <div className={`app-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <Sidebar activeId={page?.id} helpActive={isHelp} open={sidebarOpen} onNavigate={closeOnMobile} />
        {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

        <main className="main">
          <Topbar page={page} title={isHelp ? t('common.help') : undefined} onToggleSidebar={() => setSidebarOpen((o) => !o)} />
          <div className="page-scroll">
            {isHelp ? (
              <HelpPage />
            ) : (
              <article className="page" key={page.id}>
                <PageHeader
                  page={page}
                  onUpdate={(patch) => updatePage(page.id, patch)}
                  onTitleEnter={() => editorApi.current?.focusStart()}
                />
                <BlockEditor
                  initialValue={page.content}
                  onChange={(content) => updatePage(page.id, { content })}
                  apiRef={editorApi}
                  showLineNumbers={prefs.showLineNumbers}
                />
              </article>
            )}
          </div>
          {prefs.showWordCount && page && <StatusBar content={page.content} />}
        </main>
      </div>
    </FileActionsProvider>
  );
}
