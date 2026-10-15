'use strict';
// Menu acessível: fecha por link, clique fora ou Escape.
const menuButton = document.querySelector('#menu-toggle');
const menu = document.querySelector('#menu-panel');
function closeMenu() { menu.hidden = true; menuButton.setAttribute('aria-expanded', 'false'); }
menuButton.addEventListener('click', () => {
  const willOpen = menu.hidden;
  menu.hidden = !willOpen;
  menuButton.setAttribute('aria-expanded', String(willOpen));
});
menu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('click', event => {
  if (!menu.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !menu.hidden) { closeMenu(); menuButton.focus(); }
});

// A navegação acompanha a seção mais próxima do topo da tela.
const navigationLinks = [...document.querySelectorAll('.desktop-nav a')];
const observedSections = navigationLinks.map(link => document.querySelector(link.getAttribute('href')));
const intersectionObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) navigationLinks.forEach(link => {
      const selected = link.hash === '#' + entry.target.id;
      link.classList.toggle('active', selected);
      if (selected) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  });
}, { rootMargin: '-10% 0px -65% 0px', threshold: 0 }) : null;
if (intersectionObserver) observedSections.filter(Boolean).forEach(section => intersectionObserver.observe(section));
document.querySelector('#year').textContent = String(new Date().getFullYear());

// Janelas nativas: foco gerenciado pelo navegador, fechamento por Escape.
const dialog = document.querySelector('#content-dialog');
const dialogBody = document.querySelector('#dialog-body');
document.querySelectorAll('dialog').forEach(element => {
  element.querySelector('.dialog-close').addEventListener('click', () => element.close());
  element.addEventListener('click', event => {
    if (event.target !== element) return;
    const bounds = element.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) element.close();
  });
});
document.querySelector('#team-details').addEventListener('click', () => {
  dialogBody.innerHTML = '<p class="eyebrow">QUEM CUIDA DO SEU ESTILO</p><h2 id="dialog-title">Nossa equipe</h2><img src="assets/team.webp" alt="Barbeiro atendendo um cliente"><h3>RAFAEL · CORTE E ESTILIZAÇÃO</h3><p>Precisão no degradê, atenção ao formato e acabamento em cada detalhe.</p><h3>BRUNO · BARBA E BARBOTERAPIA</h3><p>Desenho de barba, cuidado com os fios e o conforto de uma toalha quente.</p><a class="button button-red" href="#contato" id="team-contact">FALE COM A GENTE →</a>';
  dialog.setAttribute('aria-labelledby', 'dialog-title');
  if (window.openBarberDialog) window.openBarberDialog(dialog, document.querySelector('#team-details')); else dialog.showModal();
  document.querySelector('#team-contact').addEventListener('click', () => dialog.close());
});

// Busca local, sem dependências ou requisições externas.
const searchDialog = document.querySelector('#search-dialog');
const searchInput = document.querySelector('#site-search');
const searchResults = document.querySelector('#search-results');
const searchable = [
  ['Corte de cabelo', '#servicos', 'cabelo corte estilização capilar'],
  ['Barba e barboterapia', '#servicos', 'barba barboterapia toalha quente'],
  ['Todos os serviços', '#servicos', 'serviços couro cabeludo tratamento'],
  ['Sobre a barbearia', '#sobre', 'sobre tradição história'],
  ['Nossa equipe', '#equipe', 'equipe profissionais barbeiros'],
  ['Horários de atendimento', '#equipe', 'horários segunda sexta sábado domingo aberto'],
  ['Catálogo de cortes', '#cortes', 'cortes estilos galeria degradê baixo médio americano social tesoura raspado'],
  ['Agendar horário', '#agendar', 'agendar agendamento reservar horário serviço data corte barba'],
  ['Contato', '#contato', 'contato endereço são paulo telefone email']
];
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
function search() {
  const query = normalize(searchInput.value.trim());
  const matches = searchable.filter(([title, href, keywords]) => normalize(title + ' ' + keywords).includes(query));
  searchResults.replaceChildren();
  matches.forEach(([title, href]) => {
    const item = document.createElement('li'); const link = document.createElement('a'); link.href = href; link.textContent = title + ' →';
    link.addEventListener('click', () => searchDialog.close()); item.append(link); searchResults.append(item);
  });
  searchDialog.querySelector('.search-empty').hidden = matches.length !== 0;
}
document.querySelector('#search-toggle').addEventListener('click', () => { closeMenu(); searchInput.value = ''; search(); if (window.openBarberDialog) window.openBarberDialog(searchDialog, document.querySelector('#search-toggle')); else searchDialog.showModal(); searchInput.focus(); });
searchInput.addEventListener('input', search);

// Demonstração estática: não simula o envio ou armazena dados pessoais.
// Conecte aqui seu provedor de newsletter antes de receber inscrições reais.
document.querySelector('#newsletter-form').addEventListener('submit', event => {
  event.preventDefault();
  document.querySelector('#newsletter-status').textContent = 'Página de demonstração: inscrição indisponível no momento.';
});
