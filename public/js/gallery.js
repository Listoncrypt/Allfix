/**
 * ALLFIX Services Xpress — Vendor Handiwork & Completed Jobs Gallery Controller
 */

(function () {
  'use strict';

  let allWorks = [];
  let currentFilter = 'all';
  let currentSearch = '';
  let visibleWorks = [];
  const workCardIndexes = {};
  let lightboxTouchStart = null;

  // Lightbox state
  let currentLightboxImages = [];
  let currentLightboxIndex = 0;
  let currentLightboxTitle = '';

  // DOM Elements
  const worksGrid = document.getElementById('worksGridContainer');
  const emptyState = document.getElementById('galleryEmptyState');
  const countBadge = document.getElementById('galleryTotalCountBadge');
  const searchInput = document.getElementById('gallerySearchInput');
  const filterChips = document.querySelectorAll('.filter-btn-chip');
  const resetBtn = document.getElementById('resetGalleryFilterBtn');

  // Lightbox Elements
  const lightboxModal = document.getElementById('galleryLightbox');
  const lightboxImg = document.getElementById('lightboxImage');
  const lightboxCounter = document.getElementById('lightboxCounter');
  const lightboxTitle = document.getElementById('lightboxTitle');
  const closeLightboxBtn = document.getElementById('closeLightboxBtn');
  const prevLightboxBtn = document.getElementById('prevLightboxBtn');
  const nextLightboxBtn = document.getElementById('nextLightboxBtn');

  function getServiceCategorySlug(jobType) {
    const lower = (jobType || '').toLowerCase();
    if (lower.includes('plumb') || lower.includes('pipe')) return 'home';
    if (lower.includes('carpent') || lower.includes('wood')) return 'home';
    if (lower.includes('electr') || lower.includes('solar') || lower.includes('inverter')) return 'appliances';
    if (lower.includes('auto') || lower.includes('mechanic') || lower.includes('car')) return 'cars';
    if (lower.includes('decor') || lower.includes('interior')) return 'decor';
    if (lower.includes('paint') || lower.includes('tile')) return 'home';
    if (lower.includes('ac') || lower.includes('appliance') || lower.includes('fridge')) return 'appliances';
    if (lower.includes('clean') || lower.includes('fumigat')) return 'cleaning';
    return 'home';
  }

  async function fetchVendorWorks() {
    try {
      const res = await fetch('/api/vendor-works');
      const data = await res.json();
      if (data && data.success && Array.isArray(data.works)) {
        allWorks = data.works;
      } else if (Array.isArray(data)) {
        allWorks = data;
      } else {
        allWorks = [];
      }
      renderWorks();
    } catch (err) {
      console.error('Error fetching vendor works:', err);
      worksGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem 1rem;">
          <p style="color: #DC2626; font-weight: 600;">Unable to load vendor works gallery right now.</p>
          <button onclick="location.reload()" class="btn btn-outline btn-sm" style="margin-top: 0.5rem;">Tap to retry</button>
        </div>
      `;
    }
  }

  function getFilteredWorks() {
    return allWorks.filter(item => {
      // Filter by category
      if (currentFilter !== 'all') {
        const typeLower = (item.jobType || '').toLowerCase();
        if (!typeLower.includes(currentFilter)) return false;
      }
      // Search keyword
      if (currentSearch) {
        const q = currentSearch.toLowerCase();
        const matches = (item.title || '').toLowerCase().includes(q) ||
          (item.jobType || '').toLowerCase().includes(q) ||
          (item.description || '').toLowerCase().includes(q) ||
          (item.location || '').toLowerCase().includes(q) ||
          (item.vendorName || '').toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }

  function renderWorks() {
    const list = getFilteredWorks();
    visibleWorks = list;
    Object.keys(workCardIndexes).forEach(index => delete workCardIndexes[index]);

    if (countBadge) {
      countBadge.textContent = `Showing ${list.length} of ${allWorks.length} verified jobs`;
    }

    if (list.length === 0) {
      worksGrid.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }

    worksGrid.style.display = 'grid';
    emptyState.style.display = 'none';

    worksGrid.innerHTML = list.map((work, idx) => {
      const images = Array.isArray(work.images) && work.images.length > 0
        ? work.images
        : (work.imageUrl ? [work.imageUrl] : []);

      const primaryPhoto = images[0];
      const photoCount = images.length;
      const catSlug = getServiceCategorySlug(work.jobType);
      const photoStrip = images.length ? `
        <div class="work-photo-strip">
          <div class="work-photo-strip-heading"><span>Photos</span><strong>${photoCount} photo${photoCount === 1 ? '' : 's'}</strong></div>
          <div class="work-photo-thumbnails" aria-label="Work photos">
            ${images.map((image, photoIdx) => `<button type="button" class="work-photo-thumb ${photoIdx === 0 ? 'active' : ''}" aria-label="View photo ${photoIdx + 1} of ${photoCount}" aria-pressed="${photoIdx === 0}" data-work-index="${idx}" data-photo-index="${photoIdx}"><img src="${escapeHtml(image)}" alt="" loading="lazy"></button>`).join('')}
          </div>
        </div>` : '';

      const encodedMsg = encodeURIComponent(
        `Hello ALLFIX, I saw the "${work.title}" completed by your verified artisan in ${work.location || 'Abuja'} on your Work Gallery. I would like to request a similar service.`
      );
      const waLink = `https://wa.me/2347058099045?text=${encodedMsg}`;

      return `
        <article class="work-card" data-id="${work.id}">
          <div class="work-media-container" data-action="open-lightbox" data-work-index="${idx}" title="Click to view full photos">
            <span class="work-type-badge">${escapeHtml(work.jobType || 'Craftsmanship')}</span>
            ${primaryPhoto ? `<img id="workCardImage_${idx}" src="${escapeHtml(primaryPhoto)}" alt="${escapeHtml(work.title)}" loading="lazy">` : '<div class="work-photo-empty">Photos will be added shortly.</div>'}
          </div>
          ${photoStrip}

          <div class="work-body">
            <div class="work-meta-row">
              <span class="work-location">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                <span>${escapeHtml(work.location || 'Abuja')}</span>
              </span>
              <span class="work-artisan"> ${escapeHtml(work.vendorName || 'Verified Artisan')}</span>
            </div>

            <h3 class="work-title">${escapeHtml(work.title)}</h3>
            <p class="work-desc">${escapeHtml(work.description)}</p>

            <div class="work-actions">
              <a href="/request-service?cat=${catSlug}" class="btn btn-primary btn-sm" style="display: flex; align-items: center; justify-content: center; gap: 0.35rem; font-size: 0.84rem;">
                <span>Book This Trade</span>
                <span aria-hidden="true">↗</span>
              </a>
              <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm" style="display: flex; align-items: center; justify-content: center; padding: 0.5rem 0.75rem;" title="Inquire on WhatsApp">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654z"/></svg>
              </a>
            </div>
          </div>
        </article>
      `;
    }).join('');

    // Attach click events for lightbox on media containers
    document.querySelectorAll('[data-action="open-lightbox"]').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.getAttribute('data-work-index'), 10);
        const work = list[idx];
        if (work) {
          const imgs = Array.isArray(work.images) && work.images.length > 0 ? work.images : (work.imageUrl ? [work.imageUrl] : []);
          openLightbox(imgs, workCardIndexes[idx] || 0, work.title);
        }
      });
    });

    document.querySelectorAll('.work-photo-thumb').forEach(button => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        const workIdx = Number(button.dataset.workIndex);
        const photoIdx = Number(button.dataset.photoIndex);
        const work = visibleWorks[workIdx];
        const images = Array.isArray(work?.images) && work.images.length > 0 ? work.images : (work?.imageUrl ? [work.imageUrl] : []);
        if (!images[photoIdx]) return;
        workCardIndexes[workIdx] = photoIdx;
        const image = document.getElementById(`workCardImage_${workIdx}`);
        if (image) image.src = images[photoIdx];
        button.closest('.work-photo-thumbnails')?.querySelectorAll('.work-photo-thumb').forEach((thumb, index) => {
          thumb.classList.toggle('active', index === photoIdx);
          thumb.setAttribute('aria-pressed', String(index === photoIdx));
        });
      });
    });
  }

  function openLightbox(images, startIndex, title) {
    if (!images || images.length === 0) return;
    currentLightboxImages = images;
    currentLightboxIndex = startIndex || 0;
    currentLightboxTitle = title || '';
    updateLightboxUI();
    lightboxModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightboxModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  function updateLightboxUI() {
    const total = currentLightboxImages.length;
    if (total === 0) return;
    lightboxImg.src = currentLightboxImages[currentLightboxIndex];
    lightboxCounter.textContent = `Photo ${currentLightboxIndex + 1} of ${total}`;
    lightboxTitle.textContent = currentLightboxTitle;

    prevLightboxBtn.style.display = total > 1 ? 'flex' : 'none';
    nextLightboxBtn.style.display = total > 1 ? 'flex' : 'none';
  }

  function prevImage() {
    if (currentLightboxImages.length <= 1) return;
    currentLightboxIndex = (currentLightboxIndex - 1 + currentLightboxImages.length) % currentLightboxImages.length;
    updateLightboxUI();
  }

  function nextImage() {
    if (currentLightboxImages.length <= 1) return;
    currentLightboxIndex = (currentLightboxIndex + 1) % currentLightboxImages.length;
    updateLightboxUI();
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Event Listeners
  if (filterChips) {
    filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        currentFilter = chip.getAttribute('data-job') || 'all';
        renderWorks();
      });
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearch = (e.target.value || '').trim();
      renderWorks();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      currentFilter = 'all';
      currentSearch = '';
      if (searchInput) searchInput.value = '';
      filterChips.forEach(c => {
        if (c.getAttribute('data-job') === 'all') c.classList.add('active');
        else c.classList.remove('active');
      });
      renderWorks();
    });
  }

  // Lightbox controls
  if (closeLightboxBtn) closeLightboxBtn.addEventListener('click', closeLightbox);
  if (prevLightboxBtn) prevLightboxBtn.addEventListener('click', prevImage);
  if (nextLightboxBtn) nextLightboxBtn.addEventListener('click', nextImage);

  lightboxModal.addEventListener('click', (e) => {
    if (e.target === lightboxModal) closeLightbox();
  });

  lightboxModal.addEventListener('touchstart', (e) => {
    const touch = e.changedTouches[0];
    lightboxTouchStart = { x: touch.clientX, y: touch.clientY };
  }, { passive: true });
  lightboxModal.addEventListener('touchend', (e) => {
    if (!lightboxTouchStart || currentLightboxImages.length < 2) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - lightboxTouchStart.x;
    const dy = touch.clientY - lightboxTouchStart.y;
    lightboxTouchStart = null;
    if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) nextImage();
    else prevImage();
  }, { passive: true });

  window.addEventListener('keydown', (e) => {
    if (!lightboxModal.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') prevImage();
    if (e.key === 'ArrowRight') nextImage();
  });

  // Initial Fetch
  fetchVendorWorks();

})();
