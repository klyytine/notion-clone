import { getLanguage } from '../i18n';

const t = (text, marks = {}) => ({ text, ...marks });
const block = (type, children, extra = {}) => ({ type, children: Array.isArray(children) ? children : [t(children)], ...extra });
const code = (text) => t(text, { code: true });

const CONTENT = {
  en: {
    title: 'Getting started',
    blocks: () => [
      block('paragraph', [t('Welcome! Every line here is a '), t('block', { bold: true }), t('. Click anywhere and start typing — changes save automatically.')]),
      block('heading-two', 'Try these'),
      block('todo', [t('Type '), code('/'), t(' on an empty line to open the command menu')], { checked: false }),
      block('todo', 'Hover over the title area to add an icon or a cover image', { checked: false }),
      block('todo', [t('Select some text to format it, or press '), code('Ctrl/⌘ + B')], { checked: false }),
      block('todo', 'Click “Share” in the top bar to get a public read-only link', { checked: true }),
      block('heading-two', 'Markdown shortcuts'),
      block('bulleted-list', [code('#'), t(', '), code('##'), t(', '), code('###'), t(' + space for headings')]),
      block('bulleted-list', [code('-'), t(' or '), code('1.'), t(' + space for lists, '), code('[]'), t(' for a to-do')]),
      block('bulleted-list', [code('"'), t(' + space for a quote, '), code('```'), t(' for code, '), code('---'), t(' for a divider')]),
      block('bulleted-list', [code('**bold**'), t(', '), code('*italic*'), t(', '), code('`code`'), t(', '), code('~strike~')]),
      block('bulleted-list', 'Press Tab / Shift+Tab to nest list items', { indent: 0 }),
      block('bulleted-list', 'Like this one', { indent: 1 }),
      block('callout', 'Pages are stored in this browser unless you choose a folder in Preferences → Storage. Images are saved inside the page, so no hosting is needed.', { emoji: '💡' }),
      block('quote', 'The best way to get started is to start.'),
      block('code', 'function hello(name) {\n  return `Hello, ${name}!`;\n}'),
      block('divider', ''),
      block('paragraph', ''),
    ],
  },
  fi: {
    title: 'Aloitusopas',
    blocks: () => [
      block('paragraph', [t('Tervetuloa! Jokainen rivi on '), t('lohko', { bold: true }), t('. Napsauta mitä tahansa kohtaa ja ala kirjoittaa – muutokset tallentuvat automaattisesti.')]),
      block('heading-two', 'Kokeile näitä'),
      block('todo', [t('Avaa komentovalikko kirjoittamalla '), code('/'), t(' tyhjälle riville')], { checked: false }),
      block('todo', 'Lisää kuvake tai kansikuva viemällä hiiri otsikon yläpuolelle', { checked: false }),
      block('todo', [t('Muotoile tekstiä valitsemalla se tai paina '), code('Ctrl/⌘ + B')], { checked: false }),
      block('todo', 'Saat julkisen vain luku -linkin valitsemalla yläpalkista ”Jaa”', { checked: true }),
      block('heading-two', 'Markdown-pikanäppäimet'),
      block('bulleted-list', [code('#'), t(', '), code('##'), t(', '), code('###'), t(' + välilyönti lisää otsikon')]),
      block('bulleted-list', [code('-'), t(' tai '), code('1.'), t(' + välilyönti lisää luettelon, '), code('[]'), t(' tehtävän')]),
      block('bulleted-list', [code('"'), t(' + välilyönti lisää lainauksen, '), code('```'), t(' koodilohkon ja '), code('---'), t(' jakajan')]),
      block('bulleted-list', [code('**lihavoitu**'), t(', '), code('*kursivoitu*'), t(', '), code('`koodi`'), t(', '), code('~yliviivattu~')]),
      block('bulleted-list', 'Sisennä luettelon kohtia näppäimillä Tab / Shift+Tab', { indent: 0 }),
      block('bulleted-list', 'Kuten tämä', { indent: 1 }),
      block('callout', 'Sivut tallennetaan tähän selaimeen, ellet valitse kansiota kohdassa Asetukset → Tallennuspaikka. Kuvat tallennetaan sivun sisään, joten erillistä kuvapalvelua ei tarvita.', { emoji: '💡' }),
      block('quote', 'Paras tapa aloittaa on aloittaa.'),
      block('code', 'function tervehdi(nimi) {\n  return `Hei, ${nimi}!`;\n}'),
      block('divider', ''),
      block('paragraph', ''),
    ],
  },
};

/** Title, icon and content of the welcome page in the current (or given) language. */
export function welcomePageFields(lang = getLanguage()) {
  const { title, blocks } = CONTENT[lang] ?? CONTENT.en;
  return { title, icon: '👋', content: blocks() };
}

export function createWelcomePage(makePage) {
  return makePage({ id: 'welcome', ...welcomePageFields() });
}
