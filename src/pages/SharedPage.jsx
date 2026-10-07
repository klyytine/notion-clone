import { useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { usePages } from '../context/PagesContext';
import { decodePage } from '../utils/share';
import PageHeader from '../components/PageHeader';
import ThemeToggle from '../components/ThemeToggle';
import BlockEditor from '../editor/BlockEditor';
import Icon from '../components/Icon';
import { useT } from '../i18n';

export default function SharedPage() {
  const t = useT();
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
    document.title = page ? `${page.icon ? `${page.icon} ` : ''}${page.title || t('common.untitled')}` : t('shared.notFoundTitle');
  }, [page, t]);

  if (!page) {
    return (
      <div className="shared-error">
        <div className="shared-error-icon"><Icon name="link" size={40} /></div>
        <h1>{t('shared.brokenHeading')}</h1>
        <p>{t('shared.brokenMessage')}</p>
        <Link to="/" className="btn btn-primary">{t('shared.goHome')}</Link>
      </div>
    );
  }

  function duplicate() {
    const copy = createPage({ ...page, title: page.title ? t('shared.copySuffix', { title: page.title }) : '' });
    navigate(`/p/${copy.id}`);
  }

  return (
    <div className="shared-layout">
      <div className="topbar">
        <div className="breadcrumb">
          <span className="breadcrumb-icon">{page.icon || <Icon name="file" />}</span>
          <span className="breadcrumb-title">{page.title || t('common.untitled')}</span>
          <span className="badge">{t('shared.readOnly')}</span>
        </div>
        <div className="topbar-right">
          <button type="button" className="topbar-btn" onClick={duplicate}>{t('shared.duplicate')}</button>
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
