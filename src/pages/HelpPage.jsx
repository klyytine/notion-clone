import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import { usePages } from '../context/PagesContext';
import { welcomePageFields } from '../context/welcomePage';
import { useLanguage, t } from '../i18n';
import enContent from '../help/content.en';
import fiContent from '../help/content.fi';

const CONTENT = { en: enContent, fi: fiContent };

function scrollToSection(event, id) {
  event.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function HelpPage() {
  const language = useLanguage();
  const { createPage } = usePages();
  const navigate = useNavigate();
  const { lead, tocLabel, sections } = (CONTENT[language] ?? enContent)();

  function addWelcomePage() {
    const page = createPage(welcomePageFields(language));
    navigate(`/p/${page.id}`);
  }

  return (
    <article className="page help-page">
      <header className="help-header">
        <div className="help-header-icon">
          <Icon name="help" size={40} />
        </div>
        <h1 className="help-title">{t('common.help')}</h1>
        <p className="help-lead">{lead}</p>
        <div className="help-welcome">
          <button type="button" className="btn" onClick={addWelcomePage}>
            👋 {t('help.addWelcome')}
          </button>
          <span className="help-welcome-desc">{t('help.addWelcomeDesc')}</span>
        </div>
      </header>

      <div className="help-body">
        <nav className="help-toc" aria-label={tocLabel}>
          {sections.map(({ id, title }) => (
            <a key={id} href={`#${id}`} onClick={(e) => scrollToSection(e, id)}>
              {title}
            </a>
          ))}
        </nav>

        {sections.map(({ id, title, body }) => (
          <section key={id} id={id} className="help-section">
            <h2>{title}</h2>
            {body}
          </section>
        ))}
      </div>
    </article>
  );
}
