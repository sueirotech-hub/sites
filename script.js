const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.nav');

function closeNavigation() {
  navigation.hidden = true;
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Open navigation');
}

menuToggle.addEventListener('click', () => {
  const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
  navigation.hidden = isOpen;
  menuToggle.setAttribute('aria-expanded', String(!isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
});

navigation.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeNavigation));

document.querySelectorAll('[data-dialog]').forEach((button) => {
  button.addEventListener('click', () => {
    const target = document.getElementById(button.dataset.dialog);
    document.querySelectorAll('dialog[open]').forEach((dialog) => dialog.close());
    closeNavigation();
    target.showModal();
  });
});

document.querySelectorAll('[data-close]').forEach((button) => {
  button.addEventListener('click', () => button.closest('dialog').close());
});

document.querySelectorAll('dialog').forEach((dialog) => {
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
});

const dateInput = document.querySelector('input[name="date"]');
dateInput.min = new Date().toISOString().slice(0, 10);

document.getElementById('booking-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const name = form.elements.name.value.trim();
  const date = form.elements.date.value;
  const guests = form.elements.guests.value;
  document.getElementById('booking-message').textContent = `${name}, your request for ${guests} on ${date} is ready as a preview. No reservation was sent.`;
});
