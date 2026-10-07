

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
});
