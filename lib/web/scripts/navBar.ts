export {};

const header = document.getElementById('navBar');
if (!header) {
  throw new Error(`Missing Header`);
}

const hamburger = createDiv('hamburger', null);
const hamburgerLines = createHamburgerLines();
hamburger.appendChild(hamburgerLines);
const dropdown = createDiv('dropdown', 'hamburgerDropdown');

createMenuItem('Home', '/');
createMenuItem('Logs', '/logs');
createSubmenuItem('Discord', ['Spotify'], ['/auth/discord?task=spotify']);
createSubmenuItem('Authentication', ['Spotify', 'MyAnimeList'], ['/auth/spotify', '/auth/mal']);
createSubmenuItem('Anime', ['Shows'], ['/anime/show']);

hamburger.appendChild(dropdown);
header.appendChild(hamburger);

const title = createParagraph('Riebot', null, 'navBarTitle');
title.addEventListener('click', redirectHome);
header.appendChild(title);

sendGetRequest('/user').then((response) => {
  let account;
  if (response.user) {
    account = 'Logout';
  } else {
    account = 'Login';
  }
  account = createParagraph(account, null, 'accountStatus');
  account.addEventListener('click', accountActions);
  header.appendChild(account);
});

function hamburgerHandler(event: MouseEvent) {
  if (event.target instanceof Element) {
    event.target.classList.toggle('change');
  }
  if (document.getElementById('hamburgerDropdown')!.classList.contains('fadeIn')) {
    document.getElementById('hamburgerDropdown')!.classList.toggle('fadeIn');
    document.getElementById('hamburgerDropdown')!.classList.toggle('fadeOut');
    setTimeout(function () {
      document.getElementById('hamburgerDropdown')!.classList.toggle('fadeOut');
      document.getElementById('hamburgerDropdown')!.style.opacity = '0';
      document.getElementById('hamburgerDropdown')!.classList.toggle('show');
    }, 500);
  } else {
    document.getElementById('hamburgerDropdown')!.classList.toggle('show');
    document.getElementById('hamburgerDropdown')!.style.opacity = '0';
    document.getElementById('hamburgerDropdown')!.classList.toggle('fadeIn');
  }
}

function submenuHandler(event: MouseEvent) {
  if (event.target instanceof Element) {
    const submenu = document.getElementsByClassName(`${event.target.id}Submenu`) as HTMLCollectionOf<HTMLElement>;
    if (submenu[0].classList.contains('slideIn')) {
      for (let i = 0; i < submenu.length; i++) {
        submenu[i].classList.toggle('slideIn');
        submenu[i].classList.toggle('slideOut');
        setTimeout(function () {
          submenu[i].classList.toggle('slideOut');
          submenu[i].style.display = 'none';
        }, 300);
      }
    } else {
      for (let i = 0; i < submenu.length; i++) {
        submenu[i].style.display = 'block';
        submenu[i].classList.toggle('slideIn');
      }
    }
    document.getElementById(`${event.target.id}MenuArrow`)!.classList.toggle('rotate');
  }
}

function redirectHome() {
  window.location.href = '/';
}

function accountActions(this: any) {
  if (this.textContent == 'Logout') {
    window.location.href = '/logout';
  } else {
    window.location.href = '/login';
  }
}

function createMenuItem(name: string, link: string) {
  const item = createDiv('menuItem', name);
  item.appendChild(createAnchor(link, name, 'menuLink', null));
  dropdown.appendChild(item);
}

function createSubmenuItem(parentName: string, submenuNames: string | any[], links: any[]) {
  const parent = createDiv('menuItem submenuParent', parentName);
  parent.appendChild(createParagraph(parentName, 'menuParagraph', null));
  parent.appendChild(createParagraph('>', 'menuParagraph menuArrow', `${parentName}MenuArrow`));
  parent.addEventListener('click', (event) => submenuHandler(event));
  dropdown.appendChild(parent);
  for (let i = 0; i < submenuNames.length; i++) {
    const submenu = createDiv(`${parentName}Submenu submenuItem`, null);
    submenu.appendChild(createAnchor(links[i], submenuNames[i], 'menuLink', null));
    dropdown.appendChild(submenu);
  }
}

function createDiv(className: string | null, id: string | null) {
  const div = document.createElement('div');
  if (className) {
    div.setAttribute('class', className);
  }
  if (id) {
    div.setAttribute('id', id);
  }
  return div;
}

function createAnchor(link: string, text: string, className: string, id: string | null) {
  const anchor = document.createElement('a');
  anchor.setAttribute('href', link);
  anchor.appendChild(document.createTextNode(text));
  if (className) {
    anchor.setAttribute('class', className);
  }
  if (id) {
    anchor.setAttribute('id', id);
  }
  return anchor;
}

function createParagraph(text: string, className: string | null, id: string | null) {
  const p = document.createElement('p');
  p.appendChild(document.createTextNode(text));
  if (className) {
    p.setAttribute('class', className);
  }
  if (id) {
    p.setAttribute('id', id);
  }
  return p;
}

function createHamburgerLines() {
  const hamburgerLines = createDiv(null, 'hamburgerLines');
  const bar1 = createDiv(null, 'bar1');
  hamburgerLines.appendChild(bar1);
  const bar2 = createDiv(null, 'bar2');
  hamburgerLines.appendChild(bar2);
  const bar3 = createDiv(null, 'bar3');
  hamburgerLines.appendChild(bar3);
  hamburgerLines.addEventListener('click', (event) => hamburgerHandler(event));
  return hamburgerLines;
}

async function sendGetRequest(url: RequestInfo | URL) {
  const response = await fetch(url, { method: 'GET' });
  return response.json();
}
