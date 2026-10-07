import { useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { usePages } from '../context/PagesContext';
import { decodePage } from '../utils/share';
import PageHeader from '../components/PageHeader';
import ThemeToggle from '../components/ThemeToggle';
import BlockEditor from '../editor/BlockEditor';
import Icon from '../components/Icon';

export default function SharedPage() {
  const { hash } = useLocation();
  const { createPage } = usePages();
  const navigate = useNavigate();

  const page = useMemo(() => {
    try {
      return decodePage(hash.slice(1));
    } catch {
      return null;
    }
  }, [hash]);

  useEffect(() => {
    document.title = page ? `${page.icon ? `${page.icon} ` : ''}${page.title || 'Untitled'}` : 'Link not found';
  }, [page]);

  if (!page) {
    return (
      <div className="shared-error">
        <div className="shared-error-icon"><Icon name="link" size={40} /></div>
        <h1>This link doesn’t work</h1>
        <p>The shared page couldn’t be read. The link may be incomplete — try copying it again.</p>
        <Link to="/" className="btn btn-primary">Go to my notes</Link>
      </div>
    );
  }

  function duplicate() {
    const copy = createPage({ ...page, title: page.title ? `${page.title} (copy)` : '' });
    navigate(`/p/${copy.id}`);
  }

  return (
    <div className="shared-layout">
      <div className="topbar">
        <div className="breadcrumb">
          <span className="breadcrumb-icon">{page.icon || <Icon name="file" />}</span>
          <span className="breadcrumb-title">{page.title || 'Untitled'}</span>
          <span className="badge">Read-only</span>
        </div>
        <div className="topbar-right">
          <button type="button" className="topbar-btn" onClick={duplicate}>Duplicate to my notes</button>
          <ThemeToggle />
        </div>
      </div>
      <div className="page-scroll">
        <article className="page">
          <PageHeader page={page} readOnly />
          <BlockEditor key={hash} initialValue={page.content} readOnly />
        </article>
      </div>
    </div>
  );
}
