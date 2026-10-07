import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePages } from '../context/PagesContext';
import ConfirmDialog from './ConfirmDialog';
import ShortcutsDialog from './ShortcutsDialog';
import ThemeToggle from './ThemeToggle';
import Icon from './Icon';
import { useFileActions } from '../files/FileActions';

export default function Sidebar({ activeId, helpActive = false, open, onNavigate }) {
  const { pages, createPage, deletePage } = usePages();
  const navigate = useNavigate();
  const [pendingDelete, setPendingDelete] = useState(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const { preferences } = useFileActions();

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
      <aside className={`sidebar ${open ? 'open' : 'closed'}`} aria-label="Pages">
        <div className="sidebar-header">
          <span className="workspace-avatar" aria-hidden="true">N</span>
          <span className="workspace-name">My Notes</span>
        </div>

        <div className="sidebar-section-label">Pages</div>
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
                <span className={`page-item-title ${page.title ? '' : 'untitled'}`}>{page.title || 'Untitled'}</span>
              </Link>
              <button
                type="button"
                className="page-item-delete"
                onClick={() => setPendingDelete(page)}
                aria-label={`Delete ${page.title || 'Untitled'}`}
                title="Delete page"
              >
                <Icon name="trash" size={15} />
              </button>
            </div>
          ))}
        </nav>

        <button type="button" className="new-page-btn" onClick={handleNewPage}>
          + New Page
        </button>

        <div className="sidebar-footer">
          <button type="button" className="sidebar-footer-btn" onClick={() => setShowShortcuts(true)}>
            <Icon name="keyboard" /> Shortcuts
          </button>
          <Link
            to="/help"
            className={`sidebar-footer-btn ${helpActive ? 'active' : ''}`}
            onClick={onNavigate}
            aria-current={helpActive ? 'page' : undefined}
          >
            <Icon name="help" /> Help
          </Link>
          <button type="button" className="sidebar-footer-btn" onClick={preferences}>
            <Icon name="settings" /> Preferences
          </button>
          <ThemeToggle className="sidebar-footer-btn" showLabel />
        </div>
      </aside>

      {pendingDelete && (
        <ConfirmDialog
          title="Delete this page?"
          message={`“${pendingDelete.title || 'Untitled'}” will be permanently deleted. This can’t be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
      {showShortcuts && <ShortcutsDialog onClose={() => setShowShortcuts(false)} />}
    </>
  );
}
