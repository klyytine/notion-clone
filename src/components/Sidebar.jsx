import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePages } from '../context/PagesContext';
import ConfirmDialog from './ConfirmDialog';
import ShortcutsDialog from './ShortcutsDialog';
import ThemeToggle from './ThemeToggle';
import Icon from './Icon';
import { useFileActions } from '../files/FileActions';
import { useT } from '../i18n';

export default function Sidebar({ activeId, helpActive = false, open, onNavigate }) {
  const { pages, createPage, deletePage } = usePages();
  const navigate = useNavigate();
  const [pendingDelete, setPendingDelete] = useState(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const { preferences } = useFileActions();
  const t = useT();

  function handleNewPage() {
    const page = createPage();
    navigate(`/p/${page.id}`);
    onNavigate?.();
  }

  function confirmDelete() {
    const target = pendingDelete;
    setPendingDelete(null);
    const index = pages.findIndex((p) => p.id === target.id);
    const neighbour = pages[index + 1] ?? pages[index - 1];
    // There is always at least one page to land on.
    const fallback = neighbour ?? createPage();
    deletePage(target.id);
    if (target.id === activeId) navigate(`/p/${fallback.id}`, { replace: true });
  }

  return (
    <>
      <aside className={`sidebar ${open ? 'open' : 'closed'}`} aria-label={t('sidebar.label')}>
        <div className="sidebar-header">
          <span className="workspace-avatar" aria-hidden="true">M</span>
          <span className="workspace-name">{t('app.name')}</span>
        </div>

        <div className="sidebar-section-label">{t('sidebar.pages')}</div>
        <nav className="page-list">
          {pages.map((page) => (
            <div key={page.id} className={`page-item ${page.id === activeId ? 'active' : ''}`}>
              <Link
                to={`/p/${page.id}`}
                className="page-link"
                onClick={onNavigate}
                aria-current={page.id === activeId ? 'page' : undefined}
              >
                <span className="page-item-icon">{page.icon || <Icon name="file" />}</span>
                <span className={`page-item-title ${page.title ? '' : 'untitled'}`}>{page.title || t('common.untitled')}</span>
              </Link>
              <button
                type="button"
                className="page-item-delete"
                onClick={() => setPendingDelete(page)}
                aria-label={t('sidebar.deleteNamed', { title: page.title || t('common.untitled') })}
                title={t('sidebar.deletePage')}
              >
                <Icon name="trash" size={15} />
              </button>
            </div>
          ))}
        </nav>

        <button type="button" className="new-page-btn" onClick={handleNewPage}>
          {t('sidebar.newPage')}
        </button>

        <div className="sidebar-footer">
          <button type="button" className="sidebar-footer-btn" onClick={() => setShowShortcuts(true)}>
            <Icon name="keyboard" /> {t('sidebar.shortcuts')}
          </button>
          <Link
            to="/help"
            className={`sidebar-footer-btn ${helpActive ? 'active' : ''}`}
            onClick={onNavigate}
            aria-current={helpActive ? 'page' : undefined}
          >
            <Icon name="help" /> {t('common.help')}
          </Link>
          <button type="button" className="sidebar-footer-btn" onClick={preferences}>
            <Icon name="settings" /> {t('sidebar.preferences')}
          </button>
          <ThemeToggle className="sidebar-footer-btn" showLabel />
        </div>
      </aside>

      {pendingDelete && (
        <ConfirmDialog
          title={t('sidebar.confirmTitle')}
          message={t('sidebar.confirmMessage', { title: pendingDelete.title || t('common.untitled') })}
          confirmLabel={t('common.delete')}
          danger
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
      {showShortcuts && <ShortcutsDialog onClose={() => setShowShortcuts(false)} />}
    </>
  );
}
