

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!prefersReducedMotion) document.documentElement.classList.add('motion-enabled');

document.addEventListener('DOMContentLoaded', () => {
  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    const revealSelector = [
      '.section-header', '.category-card', '.trust-bar-card', '.steps-grid > *',
      '.dual-card', '.testimonial-card', '.faq-item', '.legal-page-header',
      '.legal-content-container > *', '.form-card-container', '.home-trust-grid',
      '.home-impact', '.home-section-heading', '.home-service-row', '.process-copy',
      '.process-steps > li', '.home-join-grid', '.stories-grid blockquote',
      '.faq-heading', '.last-call-inner'
    ].join(',');
    const revealTargets = [...document.querySelectorAll(revealSelector)];
    const siblingIndexes = new Map();
    revealTargets.forEach(target => {
      const parent = target.parentElement;
      const index = siblingIndexes.get(parent) || 0;
      siblingIndexes.set(parent, index + 1);
      target.dataset.reveal = '';
      target.style.setProperty('--reveal-delay', `${Math.min(index, 5) * 55}ms`);
    });

    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -28px 0px' });
    revealTargets.forEach(target => revealObserver.observe(target));

    const statElements = ['stat-total-requests', 'stat-verified-vendors', 'stat-agreements']
      .map(id => document.getElementById(id)).filter(Boolean);
    const countStat = element => {
      if (!element.dataset.countTarget || element.dataset.countDone) return;
      element.dataset.countDone = 'true';
      const target = Number(element.dataset.countTarget);
      const start = performance.now();
      const duration = 680;
      const draw = now => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = `${Math.round(target * eased).toLocaleString()}+`;
        if (progress < 1) requestAnimationFrame(draw);
      };
      requestAnimationFrame(draw);
    };
    const statsObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.dataset.countVisible = 'true';
          countStat(entry.target);
          if (entry.target.dataset.countDone) statsObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.35 });
    statElements.forEach(element => statsObserver.observe(element));
  }
  const mobileBtn = document.querySelector('.mobile-menu-btn');
  const mobileNav = document.querySelector('.mobile-nav');

  if (mobileBtn && mobileNav) {
    const closeMobileNav = () => {
      mobileNav.classList.remove('open');
      document.body.classList.remove('menu-open');
      mobileBtn.setAttribute('aria-expanded', 'false');
    };

    mobileBtn.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
      const isOpen = mobileNav.classList.contains('open');
      document.body.classList.toggle('menu-open', isOpen);
      mobileBtn.setAttribute('aria-expanded', isOpen);
    });
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        closeMobileNav();
      });
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && mobileNav.classList.contains('open')) {
        closeMobileNav();
        mobileBtn.focus();
      }
    });
  }
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    if (questionBtn) {
      questionBtn.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        faqItems.forEach(other => {
          other.classList.remove('active');
          const otherButton = other.querySelector('.faq-question');
          if (otherButton) otherButton.setAttribute('aria-expanded', 'false');
        });
        if (!isActive) {
          item.classList.add('active');
          questionBtn.setAttribute('aria-expanded', 'true');
        }
      });
    }
  });
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-item a, .mobile-nav a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '/' && href === '/index.html')) {
      link.classList.add('active');
    }
  });
  const statRequests = document.getElementById('stat-total-requests');
  const statVendors = document.getElementById('stat-verified-vendors');
  const statAgreements = document.getElementById('stat-agreements');

  if (statRequests || statVendors || statAgreements) {
    fetch('/api/stats')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.stats) {
          const updateStat = (element, value) => {
            if (!element) return;
            if (!prefersReducedMotion && 'IntersectionObserver' in window) {
              element.dataset.countTarget = String(value);
              if (element.dataset.countVisible) countStat(element);
            } else {
              element.textContent = value.toLocaleString() + '+';
            }
          };
          updateStat(statRequests, json.stats.totalRequests);
          updateStat(statVendors, json.stats.verifiedVendors);
          updateStat(statAgreements, json.stats.agreementsSigned);
        }
      })
      .catch(() => {
      });
  }

  // Floating WhatsApp Support Button (on public pages)
  if (!window.location.pathname.startsWith('/admin') && !document.querySelector('.floating-whatsapp-btn')) {
    const waBtn = document.createElement('a');
    waBtn.href = 'https://wa.me/message/DE26QFV3RJF2N1';
    waBtn.target = '_blank';
    waBtn.rel = 'noopener noreferrer';
    waBtn.className = 'floating-whatsapp-btn';
    waBtn.setAttribute('aria-label', 'Chat with ALLFIX Abuja desk on WhatsApp');
    waBtn.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
      </svg>
      <span class="floating-whatsapp-text">Chat with ALLFIX</span>
    `;
    document.body.appendChild(waBtn);
  }
});
