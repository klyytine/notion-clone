import { MOD_LABEL as M } from '../utils/platform';
import {
  CommandList,
  InlineIcon,
  KeyTable,
  ShortcutGroups,
  blockShortcutRows,
  formattingRows,
  inlineShortcutRows,
  instantShortcutRows,
  newPageKeys,
} from './HelpParts';

// Termit noudattavat Notionin suomenkielistä ohjetta (https://www.notion.com/fi/help).
export default function helpContent() {
  return {
    lead: (
      <>
        Näin kirjoitat, järjestät ja jaat muistiinpanoja. Jokainen sivun rivi on <strong>lohko</strong>, ja minkä
        tahansa lohkon voi muuttaa otsikoksi, luetteloksi, tehtäväksi, koodiksi ja muuksi.
      </>
    ),
    tocLabel: 'Tällä sivulla',
    sections: [
      {
        id: 'basics',
        title: 'Perusteet',
        body: (
          <>
            <ol className="help-steps">
              <li>Valitse sivupalkista <b>+ Uusi sivu</b>.</li>
              <li>Kirjoita otsikko ja siirry sivulle painamalla <kbd>Enter</kbd>.</li>
              <li>Aloita kirjoittaminen. <kbd>Enter</kbd> lisää uuden lohkon.</li>
              <li>Valitse lohkotyyppi kirjoittamalla <kbd>/</kbd> tyhjälle riville.</li>
            </ol>
            <p>Kaikki tallentuu automaattisesti kirjoittaessasi.</p>
          </>
        ),
      },
      {
        id: 'pages',
        title: 'Sivut',
        body: (
          <ul>
            <li><b>Luo:</b> valitse sivupalkista <b>+ Uusi sivu</b> tai paina <kbd>{newPageKeys()}</kbd>.</li>
            <li><b>Avaa:</b> napsauta sivua sivupalkissa. Avoin sivu on korostettu.</li>
            <li>
              <b>Poista:</b> vie hiiri sivun päälle sivupalkissa, napsauta <InlineIcon name="trash" />-painiketta ja
              vahvista. Poistoa ei voi kumota.
            </li>
            <li>
              <b>Piilota sivupalkki:</b> napsauta yläpalkin <InlineIcon name="menu" />-painiketta tai paina{' '}
              <kbd>{M} \</kbd>.
            </li>
          </ul>
        ),
      },
      {
        id: 'header',
        title: 'Kuvake, kansikuva ja otsikko',
        body: (
          <>
            <p>Vie hiiri sivun yläreunaan, niin näkyviin tulevat <b>Lisää kuvake</b> ja <b>Lisää kansi</b>.</p>
            <ul>
              <li><b>Otsikko:</b> muokkaa napsauttamalla. Sivut ilman otsikkoa näkyvät nimellä ”Nimetön”.</li>
              <li>
                <b>Kuvake:</b> valitse yksi 30 emojista tai napsauta <b>Satunnainen</b>. Vaihda kuvake napsauttamalla sitä
                tai valitse <b>Poista</b>. Valitsin sulkeutuu, kun napsautat sen ulkopuolelle.
              </li>
              <li>
                <b>Kansikuva:</b> valitse <b>Lataa kuva</b> tietokoneeltasi tai liitä kuvan linkki ja valitse{' '}
                <b>Lisää linkki</b>. Vie hiiri kansikuvan päälle, niin voit valita <b>Vaihda kansikuva</b> tai{' '}
                <b>Poista kansikuva</b>.
              </li>
            </ul>
            <p className="help-note">Ladatut kuvat pienennetään enintään 1600 pikseliin ja tallennetaan sivun sisään, joten niitä ei säilytetä muualla.</p>
          </>
        ),
      },
      {
        id: 'commands',
        title: 'Vinoviivakomennot',
        body: (
          <>
            <p>
              Kirjoita <kbd>/</kbd> rivin alkuun tai välilyönnin jälkeen. Rajaa vaihtoehtoja jatkamalla kirjoittamista
              (esimerkiksi <kbd>/tehtävä</kbd>), liiku nuolinäppäimillä <kbd>↑</kbd> <kbd>↓</kbd> ja lisää lohko
              painamalla <kbd>Enter</kbd>. <kbd>Esc</kbd> sulkee valikon.
            </p>
            <CommandList />
            <p className="help-note">
              Tyhjällä rivillä komento muuttaa rivin. Jos rivillä on tekstiä, uusi lohko lisätään sen alle. Myös
              englanninkieliset komennot, kuten <kbd>/todo</kbd>, toimivat.
            </p>
          </>
        ),
      },
      {
        id: 'markdown',
        title: 'Markdown-pikanäppäimet',
        body: (
          <>
            <p>Kirjoita nämä tavallisen tekstirivin alkuun ja paina sitten <kbd>välilyöntiä</kbd>:</p>
            <KeyTable rows={blockShortcutRows()} />
            <p>Nämä muuttuvat heti, kun olet kirjoittanut ne rivin alkuun:</p>
            <KeyTable rows={instantShortcutRows()} />
            <p>Missä tahansa rivillä voit muotoilla tekstiä ympäröimällä sen näillä merkeillä:</p>
            <KeyTable rows={inlineShortcutRows('teksti')} />
          </>
        ),
      },
      {
        id: 'editing',
        title: 'Lohkojen muokkaaminen',
        body: (
          <ul>
            <li><b>Shift + Enter</b> lisää rivinvaihdon aloittamatta uutta lohkoa.</li>
            <li><b>Askelpalautin</b> otsikon, luettelon tai lainauksen alussa muuttaa sen takaisin tavalliseksi tekstiksi.</li>
            <li><b>Enter</b> tyhjässä luettelon kohdassa lopettaa luettelon.</li>
            <li><b>Tab</b> / <b>Shift + Tab</b> sisentää luettelon kohtia ja tehtäviä enintään kolmelle tasolle.</li>
            <li><b>Tehtävät:</b> napsauta valintaruutua tai paina <kbd>{M} Enter</kbd>.</li>
            <li>
              <b>Koodilohkot:</b> <kbd>Enter</kbd> lisää uuden rivin ja <kbd>Tab</kbd> sisentää. Poistu lohkosta
              painamalla <kbd>{M} Enter</kbd>. Vie hiiri lohkon päälle, niin voit valita <b>Kopioi</b>.
            </li>
            <li><b>Huomiolohkot:</b> vaihda emojia napsauttamalla sitä.</li>
            <li>
              <b>Kuvat:</b> lisää komennolla <kbd>/kuva</kbd> tai liitä kuva leikepöydältä. Vie hiiri kuvan päälle, niin
              voit valita <b>Korvaa</b> tai <b>Poista</b>.
            </li>
            <li>Jatka kirjoittamista sivun loppuun napsauttamalla viimeisen lohkon alla olevaa tyhjää tilaa.</li>
            <li>Kumoa ja tee uudelleen näppäimillä <kbd>{M} Z</kbd> ja <kbd>{M} Shift Z</kbd>.</li>
          </ul>
        ),
      },
      {
        id: 'formatting',
        title: 'Tekstin muotoilu',
        body: (
          <>
            <p>
              Kun valitset tekstiä, näkyviin tulee muotoilupalkki: <b>lihavointi</b>, <em>kursivointi</em>,{' '}
              <u>alleviivaus</u>, <s>yliviivaus</s> ja <code className="inline-code">koodi</code>. Voit myös käyttää
              näppäimistöä:
            </p>
            <KeyTable rows={formattingRows()} />
          </>
        ),
      },
      {
        id: 'files',
        title: 'Tiedostot',
        body: (
          <>
            <p>
              Yläpalkin <b>Tiedosto</b>-valikosta käsittelet tietokoneesi tiedostoja. Tiedostosta avattu sivu pysyy
              linkitettynä siihen: tiedostonimi näkyy sivun otsikon vieressä, ja <b>●</b> kertoo tallentamattomista
              muutoksista.
            </p>
            <ul>
              <li>
                <b>Avaa tiedosto…</b> (<kbd>{M} O</kbd>): avaa <code>.note</code>-, Markdown- (<code>.md</code>), teksti-
                tai <code>.json</code>-tiedosto. Se näkyy sivuna sivupalkissa.
              </li>
              <li><b>Avaa URL-osoitteesta…</b>: liitä verkko-osoite. Verkkosivut, Markdown- ja tekstitiedostot avautuvat uutena sivuna.</li>
              <li><b>Viimeisimmät:</b> 10 viimeksi avattua tiedostoa ja linkkiä. Luettelo säilyy istuntojen välillä.</li>
              <li><b>Tallenna</b> (<kbd>{M} S</kbd>): tallentaa heti kaiken, myös linkitetyt tiedostot.</li>
              <li>
                <b>Tallenna nimellä…</b> (<kbd>{M} Shift S</kbd>): tallentaa sivun uuteen tiedostoon.{' '}
                <b>Muistiinpano (.note)</b> säilyttää kaiken; <b>Markdown (.md)</b> on tavallista tekstiä, jota muut
                sovellukset osaavat lukea (ilman kuvaketta ja kansikuvaa).
              </li>
              <li><b>Nimeä uudelleen…</b> (<kbd>F2</kbd>): vaihda sivun otsikko ja halutessasi myös tiedoston nimi levyllä.</li>
              <li><b>Tulosta…</b> (<kbd>{M} P</kbd>): tulosta tulostimella tai tallenna PDF-tiedostona. Vain itse sivu tulostetaan.</li>
              <li>
                <b>Lopeta</b> (<kbd>{M} Q</kbd>): sulkee sovelluksen. Jos jotain on tallentamatta, sinulta kysytään
                ensin, ellet ole valinnut <b>Älä näytä tätä uudelleen</b>.
              </li>
            </ul>
            <p className="help-note">
              Jos suljet ikkunan sen <b>×</b>-painikkeella ja muutoksia on tallentamatta, selain näyttää oman
              ”Poistutaanko sivustolta?” -varoituksensa. Selaimet eivät salli siinä omaa valintaikkunaa, joten käytä
              <b> Lopeta</b>-komentoa, jos haluat valita Tallenna / Älä tallenna.
            </p>
          </>
        ),
      },
      {
        id: 'saving',
        title: 'Tallentaminen',
        body: (
          <>
            <p>
              Muutokset tallentuvat automaattisesti hetki sen jälkeen, kun lopetat kirjoittamisen. Yläpalkissa näkyy
              ensin <b>Tallennetaan...</b> ja sitten <b>Tallennettu juuri nyt</b>. Tallenna heti painamalla{' '}
              <kbd>{M} S</kbd>. Jos automaattinen tallennus on poistettu käytöstä asetuksista, yläpalkissa näkyy{' '}
              <b>Tallentamattomia muutoksia</b>, kunnes tallennat.
            </p>
            <p className="help-note">
              Oletuksena muistiinpanot tallennetaan vain tähän selaimeen: ne eivät näy muilla laitteilla, ja selaimen
              sivustotietojen tyhjentäminen poistaa ne. Jos selaimen tallennustila täyttyy (yleensä suurten kuvien
              takia), tilaksi vaihtuu <b>Ei tallennettu</b>. Välttääksesi molemmat valitse kansio kohdassa{' '}
              <b>Asetukset → Tallennuspaikka</b>.
            </p>
          </>
        ),
      },
      {
        id: 'preferences',
        title: 'Asetukset',
        body: (
          <>
            <p>
              Avaa <b>Asetukset</b> sivupalkista, valikosta <b>Tiedosto → Asetukset…</b> tai painamalla{' '}
              <kbd>{M} ,</kbd>.
            </p>
            <ul>
              <li><b>Kieli:</b> suomi (oletus) tai englanti. Valikot, valintaikkunat ja tämä ohje vaihtuvat heti; sivujesi sisältö pysyy ennallaan.</li>
              <li>
                <b>Tallennuspaikka:</b> säilytä sivusi tässä selaimessa tai valitsemassasi kansiossa (esimerkiksi{' '}
                <code>C:\Users\sinä\Documents\Muistipaikka</code>). Kansiossa on yksi tiedosto,{' '}
                <code>notes-workspace.json</code>. Sillä ei ole kokorajoitusta, ja sen voi helposti varmuuskopioida tai
                synkronoida.
              </li>
              <li>
                <b>Automaattinen tallennus</b> päälle tai pois sekä <b>tallennuksen viive</b> millisekunteina: kuinka kauan
                odotetaan kirjoittamisen lopettamisesta tallennukseen.
              </li>
              <li>
                <b>Kysy tallentamattomista muutoksista suljettaessa:</b> ottaa varoituksen takaisin käyttöön, jos olit
                valinnut ”Älä näytä tätä uudelleen”.
              </li>
              <li><b>Näytä rivinumerot</b> vasemmassa reunuksessa, yksi numero lohkoa kohden.</li>
              <li><b>Näytä sanamäärä:</b> sanat, merkit ja kappaleet sivun alareunan palkissa.</li>
            </ul>
          </>
        ),
      },
      {
        id: 'sharing',
        title: 'Jakaminen',
        body: (
          <>
            <ol className="help-steps">
              <li>Valitse yläpalkista <b>Jaa</b>.</li>
              <li>Valitse <b>Kopioi linkki</b> ja lähetä linkki kenelle tahansa.</li>
            </ol>
            <p>
              Linkki avaa sivusta <b>vain luku</b> -kopion. Katsoja voi valita <b>Kopioi omiin muistiinpanoihin</b>, jolloin
              hän saa muokattavan kopion omaan selaimeensa.
            </p>
            <p className="help-note">
              Sivu on tallennettu itse linkkiin, joten linkki on tilannekuva: muokkausten jälkeen avaa Jaa uudelleen, niin
              saat päivitetyn linkin. Ladatut kuvat pidentävät linkkiä, ja jotkin viestisovellukset voivat katkaista sen.
            </p>
          </>
        ),
      },
      {
        id: 'shortcuts',
        title: 'Pikanäppäimet',
        body: (
          <>
            <ShortcutGroups />
            <p className="help-note">
              Vaihda vaalean ja tumman tilan välillä painamalla <kbd>{M} Shift L</kbd> tai{' '}
              <InlineIcon name="moon" />-painiketta.
            </p>
          </>
        ),
      },
    ],
  };
}
