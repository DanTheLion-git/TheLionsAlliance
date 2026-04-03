// =========================================================
// CONFIGURATION
// =========================================================
const BASE_PRICE   = 79.99;
const POSTAL_PRICE = 15.00; // PostNL send + return — update if PostNL rates change

// =========================================================
// STICKY NAV
// =========================================================
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
});

// =========================================================
// MOBILE MENU
// =========================================================
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
hamburger.addEventListener('click', () => mobileMenu.classList.toggle('open'));
mobileMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => mobileMenu.classList.remove('open'));
});

// =========================================================
// DELIVERY CALCULATOR — PostNL flat rate
// =========================================================
const deliveryRadios = document.querySelectorAll('input[name="delivery"]');

deliveryRadios.forEach(radio => {
  radio.addEventListener('change', () => {
    const isPostal = radio.value === 'postal';
    document.getElementById('postalHint').style.display = isPostal ? '' : 'none';
    updatePriceDisplay(isPostal);
  });
});

function formatPrice(amount) {
  return '€' + amount.toFixed(2).replace('.', ',');
}

function updatePriceDisplay(includePostal = false) {
  const shippingCost    = includePostal ? POSTAL_PRICE : 0;
  const total           = BASE_PRICE + shippingCost;
  const deliveryCostRow = document.getElementById('deliveryCostRow');
  const grandTotalEl    = document.getElementById('grandTotal');
  const bookBtn         = document.getElementById('bookBtn');

  deliveryCostRow.style.display = includePostal ? 'flex' : 'none';
  if (includePostal) {
    document.getElementById('deliveryCostAmount').textContent = formatPrice(shippingCost);
  }

  grandTotalEl.textContent = formatPrice(total);
  bookBtn.textContent      = `Book for ${formatPrice(total)}`;
}

// =========================================================
// BOOKING FORM VALIDATION
// =========================================================
const form       = document.getElementById('bookingForm');
const successMsg = document.getElementById('formSuccess');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  let valid = true;

  const fields = [
    { id: 'name',  errorId: 'nameError',  msg: 'Please enter your name.' },
    { id: 'email', errorId: 'emailError', msg: 'Please enter a valid email.' },
    { id: 'date',  errorId: 'dateError',  msg: 'Please pick your wedding date.' },
  ];

  fields.forEach(({ id, errorId, msg }) => {
    const input          = document.getElementById(id);
    const error          = document.getElementById(errorId);
    const isEmpty        = !input.value.trim();
    const isInvalidEmail = id === 'email' && !isEmpty && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value);
    const isPastDate     = id === 'date'  && !isEmpty && new Date(input.value) < new Date();

    if (isEmpty || isInvalidEmail || isPastDate) {
      input.classList.add('invalid');
      error.textContent = isInvalidEmail ? 'Please enter a valid email address.'
                        : isPastDate     ? 'Wedding date must be in the future.'
                        : msg;
      valid = false;
    } else {
      input.classList.remove('invalid');
      error.textContent = '';
    }
  });

  if (!valid) return;

  const submitBtn = form.querySelector('[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending…';

  setTimeout(() => {
    form.reset();
    submitBtn.style.display = 'none';
    successMsg.classList.add('visible');
  }, 900);
});

form.querySelectorAll('input, textarea').forEach(input => {
  input.addEventListener('input', () => {
    input.classList.remove('invalid');
    const errorEl = document.getElementById(input.id + 'Error');
    if (errorEl) errorEl.textContent = '';
  });
});

// =========================================================
// SCROLL REVEAL
// =========================================================
const revealEls = document.querySelectorAll('.step, .feature, .pricing__card, .quote, .portal-step, .portal-coming-soon');
const observer  = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity   = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

revealEls.forEach(el => {
  el.style.opacity   = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = 'opacity .5s ease, transform .5s ease';
  observer.observe(el);
});

