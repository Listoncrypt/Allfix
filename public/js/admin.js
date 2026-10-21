

document.addEventListener('DOMContentLoaded', () => {
  let allRequests = [];
  let allVendors = [];
  let allMessages = [];
  let allAgreements = [];
  let allProperties = [];
  let allWorks = [];
  let allMarketingRequests = [];
  let currentModalRequestId = null;
  let currentModalMarketingId = null;
  let currentModalWorkId = null;

  // DOM Elements
  const requestsContainer = document.getElementById('requestsContainer');
  const vendorsTable = document.getElementById('vendorsTableBody');
  const messagesTable = document.getElementById('messagesTableBody');
  const agreementsTable = document.getElementById('agreementsTableBody');
  const propertiesTable = document.getElementById('propertiesTableBody');
  const marketingContainer = document.getElementById('marketingRequestsContainer');

  const requestSearchInput = document.getElementById('requestSearchInput');
  const requestStatusFilter = document.getElementById('requestStatusFilter');
  const requestUrgencyFilter = document.getElementById('requestUrgencyFilter');
  const requestResultsCount = document.getElementById('requestResultsCount');

  const marketingSearchInput = document.getElementById('marketingSearchInput');
  const marketingTypeFilter = document.getElementById('marketingTypeFilter');
  const marketingStatusFilter = document.getElementById('marketingStatusFilter');
  const marketingResultsCount = document.getElementById('marketingResultsCount');

  const vendorSearchInput = document.getElementById('vendorSearchInput');
  const vendorStatusFilter = document.getElementById('vendorStatusFilter');

  const refreshDataBtn = document.getElementById('refreshDataBtn');

  // Modal Elements
  const modal = document.getElementById('requestDetailModal');
  const closeModalBtn = document.getElementById('closeDetailModalBtn');
  const modalStatusSelect = document.getElementById('modalStatusSelect');
  const modalAdminNotes = document.getElementById('modalAdminNotes');
  const saveModalStatusBtn = document.getElementById('saveModalStatusBtn');
  const deleteRequestBtn = document.getElementById('deleteRequestBtn');

  // Tab switching
  const tabBtns = document.querySelectorAll('.admin-tab-btn');
  const tabPanes = document.querySelectorAll('.admin-tab-pane');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      const targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.add('active');
    });
  });

  // Supabase Modal Elements
  const supabaseModal = document.getElementById('supabaseModal');
  const supabaseConfigBtn = document.getElementById('supabaseConfigBtn');
  const closeSupabaseModalBtn = document.getElementById('closeSupabaseModalBtn');
  const supabaseConfigForm = document.getElementById('supabaseConfigForm');
  const supabaseUrlInput = document.getElementById('supabaseUrlInput');
  const supabaseKeyInput = document.getElementById('supabaseKeyInput');
  const saveSupabaseBtn = document.getElementById('saveSupabaseBtn');
  const supabaseSaveStatus = document.getElementById('supabaseSaveStatus');
  const copySqlSchemaBtn = document.getElementById('copySqlSchemaBtn');
  const copySqlStatus = document.getElementById('copySqlStatus');
  const supabaseIndicatorDot = document.getElementById('supabaseIndicatorDot');
  const supabaseBackendLabel = document.getElementById('supabaseBackendLabel');

  async function checkSupabaseStatus() {
    try {
      const res = await fetch('/api/supabase/status');
      const json = await res.json();
      if (!json.success) return;
      if (json.configured) {
        if (supabaseIndicatorDot) supabaseIndicatorDot.style.background = '#22C55E';
        if (supabaseBackendLabel) supabaseBackendLabel.textContent = 'Storage: Supabase (Live)';
        if (supabaseUrlInput && json.url) supabaseUrlInput.value = json.url;

      } else {
        if (supabaseIndicatorDot) supabaseIndicatorDot.style.background = '#929B93';
        if (supabaseBackendLabel) supabaseBackendLabel.textContent = 'Storage: Local (Connect Supabase)';
      }
    } catch (e) {}
  }

  if (supabaseConfigBtn) {
    supabaseConfigBtn.addEventListener('click', () => {
      supabaseModal.classList.add('open');
    });
  }

  if (closeSupabaseModalBtn) {
    closeSupabaseModalBtn.addEventListener('click', () => {
      supabaseModal.classList.remove('open');
    });
  }

  window.addEventListener('click', (e) => {
    if (e.target === supabaseModal) {
      supabaseModal.classList.remove('open');
    }
  });

  if (supabaseConfigForm) {
    supabaseConfigForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const url = supabaseUrlInput.value.trim();
      const key = supabaseKeyInput.value.trim();
      if (!url || !key) return;

      saveSupabaseBtn.disabled = true;
      saveSupabaseBtn.textContent = 'Connecting...';
      supabaseSaveStatus.textContent = '';

      try {
        const res = await fetch('/api/supabase/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, key })
        });
        const json = await res.json();
        if (json.success) {
          supabaseSaveStatus.style.color = '#16883D';
          supabaseSaveStatus.textContent = ' Connected to Supabase!';
          checkSupabaseStatus();
          refreshAll();
          setTimeout(() => {
            supabaseModal.classList.remove('open');
          }, 1200);
        } else {
          supabaseSaveStatus.style.color = '#DC2626';
          supabaseSaveStatus.textContent = json.error || 'Failed to save';
        }
      } catch (err) {
        supabaseSaveStatus.style.color = '#DC2626';
        supabaseSaveStatus.textContent = err.message;
      } finally {
        saveSupabaseBtn.disabled = false;
        saveSupabaseBtn.textContent = 'Save & Connect Supabase';
      }
    });
  }

  if (copySqlSchemaBtn) {
    copySqlSchemaBtn.addEventListener('click', () => {
      const sql = `-- ALLFIX Supabase SQL Schema
CREATE TABLE IF NOT EXISTS public.requests (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  category TEXT NOT NULL,
  service TEXT,
  location TEXT,
  urgency TEXT DEFAULT 'Medium',
  preferred_date TEXT,
  description TEXT NOT NULL,
  property_types JSONB DEFAULT '[]'::jsonb,
  property_type_other TEXT,
  construction_description TEXT,
  land_size TEXT,
  land_size_other TEXT,
  land_status TEXT,
  status TEXT DEFAULT 'pending_matching',
  admin_notes TEXT,
  agreement_id TEXT,
  terms_version TEXT DEFAULT 'v1.0',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.vendors (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  business_name TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  category TEXT NOT NULL,
  specialties JSONB DEFAULT '[]'::jsonb,
  experience_years TEXT,
  operating_areas TEXT,
  reg_number TEXT,
  address TEXT,
  verification_status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  agreement_id TEXT,
  terms_version TEXT DEFAULT 'v1.0',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.agreements (
  id TEXT PRIMARY KEY,
  user_name TEXT NOT NULL,
  contact TEXT NOT NULL,
  agreement_type TEXT NOT NULL,
  version TEXT DEFAULT 'v1.0',
  status BOOLEAN DEFAULT TRUE,
  context TEXT,
  ip TEXT,
  user_agent TEXT,
  related_entity_id TEXT,
  accepted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on requests" ON public.requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on vendors" ON public.vendors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on agreements" ON public.agreements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on messages" ON public.messages FOR ALL USING (true) WITH CHECK (true);`;

      navigator.clipboard.writeText(sql).then(() => {
        if (copySqlStatus) {
          copySqlStatus.textContent = ' Copied to clipboard!';
          setTimeout(() => { copySqlStatus.textContent = ''; }, 3000);
        }
      }).catch(() => {
        alert('Schema copied. Full SQL file also saved as supabase-schema.sql in the project root.');
      });
    });
  }

  // ==============================================================================
  // Admin Authentication & Session Management
  // ==============================================================================
  const adminLoginScreen = document.getElementById('adminLoginScreen');
  const adminApp = document.getElementById('adminApp');
  const adminLoginForm = document.getElementById('adminLoginForm');
  const adminUsernameInput = document.getElementById('adminUsernameInput');
  const adminPasswordInput = document.getElementById('adminPasswordInput');
  const adminLoginSubmitBtn = document.getElementById('adminLoginSubmitBtn');
  const adminLoginAlert = document.getElementById('adminLoginAlert');
  const togglePasswordVisibilityBtn = document.getElementById('togglePasswordVisibilityBtn');
  const adminLogoutBtn = document.getElementById('adminLogoutBtn');

  // Toggle password visibility
  if (togglePasswordVisibilityBtn && adminPasswordInput) {
    togglePasswordVisibilityBtn.addEventListener('click', () => {
      const isPass = adminPasswordInput.type === 'password';
      adminPasswordInput.type = isPass ? 'text' : 'password';
      togglePasswordVisibilityBtn.textContent = isPass ? '' : '';
    });
  }

  // Handle Login submission
  if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = (adminUsernameInput?.value || '').trim();
      const password = (adminPasswordInput?.value || '').trim();

      if (!username || !password) return;

      if (adminLoginSubmitBtn) {
        adminLoginSubmitBtn.disabled = true;
        adminLoginSubmitBtn.textContent = 'Verifying credentials...';
      }
      if (adminLoginAlert) adminLoginAlert.style.display = 'none';

      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const json = await res.json();
        if (json.success) {
          if (adminLoginScreen) adminLoginScreen.style.display = 'none';
          if (adminApp) adminApp.style.display = 'block';
          refreshAll();
          startRealtimeSync();
        } else {
          if (adminLoginAlert) {
            adminLoginAlert.textContent = json.error || 'Invalid credentials. Access denied.';
            adminLoginAlert.style.display = 'block';
          }
        }
      } catch (err) {
        if (adminLoginAlert) {
          adminLoginAlert.textContent = 'Connection error. Please try again.';
          adminLoginAlert.style.display = 'block';
        }
      } finally {
        if (adminLoginSubmitBtn) {
          adminLoginSubmitBtn.disabled = false;
          adminLoginSubmitBtn.textContent = 'Unlock Admin Portal →';
        }
      }
    });
  }

  // Handle Logout
  if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener('click', async () => {
      try {
        await fetch('/api/admin/logout', { method: 'POST' });
      } catch (e) {}
      localStorage.removeItem('allfix_admin_token');
      stopRealtimeSync();
      if (adminApp) adminApp.style.display = 'none';
      if (adminLoginScreen) adminLoginScreen.style.display = 'flex';
      if (adminPasswordInput) adminPasswordInput.value = '';
    });
  }

  // ==============================================================================
  // Admin Toast Notifications
  // ==============================================================================
  function showAdminToast(message) {
    const container = document.getElementById('adminToastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.style.cssText = `
      background: #0C100D;
      color: #FFFFFF;
      border: 1px solid #16883D;
      border-left: 4px solid #22C55E;
      padding: 0.85rem 1.15rem;
      border-radius: 10px;
      font-size: 0.88rem;
      box-shadow: 0 10px 25px rgba(0,0,0,0.35);
      display: flex;
      align-items: center;
      gap: 0.65rem;
      pointer-events: auto;
      max-width: 360px;
      transition: all 0.3s ease;
    `;
    toast.innerHTML = `
      <span style="font-size: 1.15rem;"></span>
      <div style="flex: 1; line-height: 1.35; font-size: 0.86rem;">${message}</div>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      setTimeout(() => toast.remove(), 400);
    }, 4500);
  }

  // ==============================================================================
  // Live Real-Time Background Synchronization Engine
  // ==============================================================================
  let realtimeTimer = null;
  let lastStatsFingerprint = '';
  let knownRequestIds = new Set();
  let supabaseLiveChannel = null;

  function pulseLiveBadge() {
    const badge = document.getElementById('realtimeLiveBadge');
    if (!badge) return;
    badge.style.background = 'rgba(34, 197, 94, 0.35)';
    badge.style.borderColor = '#22C55E';
    badge.style.transform = 'scale(1.04)';
    badge.style.transition = 'all 0.25s ease';
    setTimeout(() => {
      badge.style.background = 'rgba(34, 197, 94, 0.18)';
      badge.style.borderColor = 'rgba(34, 197, 94, 0.45)';
      badge.style.transform = 'scale(1)';
    }, 1200);
  }

  function initSupabaseRealtimeChannel(url, key) {
    if (supabaseLiveChannel || !url || !key) return;
    if (typeof window.supabase === 'undefined' || !window.supabase.createClient) return;

    try {
      const supa = window.supabase.createClient(url, key);
      supabaseLiveChannel = supa.channel('allfix-admin-live-feed')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, (payload) => {
          pulseLiveBadge();
          if (payload.eventType === 'INSERT' && payload.new) {
            showAdminToast(`New <strong>${escapeHtml(payload.new.category || 'Service')}</strong> request from <strong>${escapeHtml(payload.new.customer_name || 'Customer')}</strong>!`);
          }
          silentSyncRequests();
          loadStats();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
          pulseLiveBadge();
          loadMessages();
          loadStats();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'vendors' }, () => {
          pulseLiveBadge();
          loadVendors();
          loadStats();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'properties' }, () => {
          pulseLiveBadge();
          loadProperties();
          loadStats();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'vendor_works' }, () => {
          pulseLiveBadge();
          loadVendorWorks();
          loadStats();
        })
        .subscribe();
    } catch (err) {
      console.warn('Realtime channel fallback to polling:', err.message);
    }
  }

  async function silentSyncRequests() {
    try {
      const res = await fetch('/api/requests');
      const json = await res.json();
      if (!json.success || !Array.isArray(json.data)) return;

      const incomingRequests = json.data;
      const incomingIds = incomingRequests.map(r => r.id);

      // Check if new requests arrived that weren't known
      if (knownRequestIds.size > 0) {
        const brandNewItems = incomingRequests.filter(r => !knownRequestIds.has(r.id));
        if (brandNewItems.length > 0) {
          pulseLiveBadge();
          brandNewItems.forEach(item => {
            showAdminToast(`New <strong>${escapeHtml(item.category)}</strong> request from <strong>${escapeHtml(item.customerName)}</strong>!`);
          });
        }
      }

      // Update known IDs
      knownRequestIds = new Set(incomingIds);
      allRequests = incomingRequests;

      const badgeCount = document.getElementById('badgeRequestsCount');
      if (badgeCount) badgeCount.textContent = allRequests.length;

      // Re-render requests view seamlessly without disturbing search input or closing modal
      renderFilteredRequests();

      // If modal is currently open and inspecting a request, refresh its details if modified
      if (currentModalRequestId && modal && modal.classList.contains('open')) {
        const activeItem = allRequests.find(r => r.id === currentModalRequestId);
        if (activeItem) {
          window.openRequestModal(currentModalRequestId);
        }
      }
    } catch (e) {
      console.warn('Silent sync error:', e.message);
    }
  }

  async function silentCheckForUpdates() {
    try {
      const res = await fetch('/api/stats');
      const json = await res.json();
      if (!json.success || !json.stats) return;

      const s = json.stats;
      const currentFingerprint = `${s.totalRequests}_${s.pendingRequests}_${s.verifiedVendors}_${s.totalMessages}_${s.agreementsSigned}_${s.totalProperties}_${s.totalVehicles || 0}`;

      if (lastStatsFingerprint && currentFingerprint !== lastStatsFingerprint) {
        // Platform count changed! Sync live
        pulseLiveBadge();
        await Promise.all([
          loadStats(),
          silentSyncRequests(),
          loadVendors(),
          loadMessages(),
          loadAgreements(),
          loadProperties(),
          loadVehicles()
        ]);
      } else if (!lastStatsFingerprint) {
        // Initial snapshot
        await silentSyncRequests();
      }

      lastStatsFingerprint = currentFingerprint;
    } catch (e) {}
  }

  function startRealtimeSync() {
    stopRealtimeSync();
    silentCheckForUpdates();
    // Heartbeat every 4.5 seconds
    realtimeTimer = setInterval(silentCheckForUpdates, 4500);
  }

  function stopRealtimeSync() {
    if (realtimeTimer) {
      clearInterval(realtimeTimer);
      realtimeTimer = null;
    }
  }

  // Check authentication on initial load
  async function checkAdminAuth() {
    try {
      const res = await fetch('/api/admin/auth-check');
      const json = await res.json();
      if (json.authenticated) {
        if (adminLoginScreen) adminLoginScreen.style.display = 'none';
        if (adminApp) adminApp.style.display = 'block';
        refreshAll();
        startRealtimeSync();
      } else {
        if (adminLoginScreen) adminLoginScreen.style.display = 'flex';
        if (adminApp) adminApp.style.display = 'none';
      }
    } catch (e) {
      if (adminLoginScreen) adminLoginScreen.style.display = 'flex';
      if (adminApp) adminApp.style.display = 'none';
    }
  }

  // Load all data
  async function refreshAll() {
    await Promise.all([
      checkSupabaseStatus(),
      loadStats(),
      loadRequests(),
      loadVendorWorks(),
      loadVendors(),
      loadMessages(),
      loadAgreements(),
      loadProperties(),
      loadVehicles(),
      loadMarketingRequests()
    ]);
  }
  window.refreshAll = refreshAll;

  if (refreshDataBtn) {
    refreshDataBtn.addEventListener('click', () => {
      refreshDataBtn.textContent = '↻ Refreshing...';
      refreshAll().finally(() => {
        setTimeout(() => {
          refreshDataBtn.textContent = '↻ Refresh Data';
        }, 500);
      });
    });
  }

  // Run initial authentication check
  checkAdminAuth();

  // Load Platform Stats
  async function loadStats() {
    try {
      const res = await fetch('/api/stats');
      const json = await res.json();
      if (!json.success || !json.stats) return;

      const s = json.stats;
      const elPending = document.getElementById('statPendingRequests');
      const elTotal = document.getElementById('statTotalRequests');
      const elVendors = document.getElementById('statVerifiedVendors');
      const elAgreements = document.getElementById('statAgreements');
      const elMessages = document.getElementById('statTotalMessages');
      const elProperties = document.getElementById('statTotalProperties');
      const elVehicles = document.getElementById('statTotalVehicles');
      const elWorks = document.getElementById('statVendorWorks');
      const badgeWorks = document.getElementById('badgeWorksCount');
      const elMarketing = document.getElementById('statMarketingRequests');
      const elPendingMarketing = document.getElementById('statPendingMarketing');
      const badgeMarketing = document.getElementById('badgeMarketingCount');
      const elActualReqText = document.getElementById('statActualRequestsText');

      if (elPending) elPending.textContent = (s.pendingRequests !== undefined ? s.pendingRequests : 0).toLocaleString();
      if (elTotal) elTotal.textContent = (s.totalRequests || 0).toLocaleString();
      if (elActualReqText) elActualReqText.textContent = `${s.storageBackend || 'Local Storage'}`;
      if (elVendors) elVendors.textContent = (s.verifiedVendors || 0).toLocaleString();
      if (elAgreements) elAgreements.textContent = (s.agreementsSigned || 0).toLocaleString();
      if (elMessages) elMessages.textContent = (s.totalMessages || 0).toLocaleString();
      if (elProperties) elProperties.textContent = (s.totalProperties !== undefined ? s.totalProperties : allProperties.length).toLocaleString();
      if (elVehicles) elVehicles.textContent = (s.totalVehicles !== undefined ? s.totalVehicles : allVehicles.length).toLocaleString();
      if (elWorks) elWorks.textContent = (s.totalVendorWorks !== undefined ? s.totalVendorWorks : allWorks.length).toLocaleString();
      if (badgeWorks) badgeWorks.textContent = (s.totalVendorWorks !== undefined ? s.totalVendorWorks : allWorks.length).toLocaleString();
      if (elMarketing) elMarketing.textContent = (s.totalMarketingRequests !== undefined ? s.totalMarketingRequests : allMarketingRequests.length).toLocaleString();
      if (elPendingMarketing) elPendingMarketing.textContent = (s.pendingMarketingRequests !== undefined ? s.pendingMarketingRequests : 0).toLocaleString();
      if (badgeMarketing) badgeMarketing.textContent = (s.pendingMarketingRequests !== undefined ? s.pendingMarketingRequests : 0).toLocaleString();
    } catch (e) {
      console.error('Error loading stats:', e);
    }
  }

  // 1. SERVICE REQUESTS
  async function loadRequests() {
    try {
      const res = await fetch('/api/requests');
      const json = await res.json();
      if (!json.success) return;

      allRequests = json.data || [];
      const badgeCount = document.getElementById('badgeRequestsCount');
      if (badgeCount) badgeCount.textContent = allRequests.length;

      renderFilteredRequests();
    } catch (err) {
      if (requestsContainer) {
        requestsContainer.innerHTML = `<div style="color: #DC2626; padding: 2rem; background: white; border-radius: 12px; text-align: center;">Failed to load service requests: ${escapeHtml(err.message)}</div>`;
      }
    }
  }

  function renderFilteredRequests() {
    if (!requestsContainer) return;

    const searchTerm = (requestSearchInput?.value || '').toLowerCase().trim();
    const statusVal = requestStatusFilter?.value || 'all';
    const urgencyVal = requestUrgencyFilter?.value || 'all';

    const filtered = allRequests.filter(r => {
      const matchesSearch = !searchTerm ||
        (r.customerName && r.customerName.toLowerCase().includes(searchTerm)) ||
        (r.phone && r.phone.toLowerCase().includes(searchTerm)) ||
        (r.email && r.email.toLowerCase().includes(searchTerm)) ||
        (r.location && r.location.toLowerCase().includes(searchTerm)) ||
        (r.service && r.service.toLowerCase().includes(searchTerm)) ||
        (r.category && r.category.toLowerCase().includes(searchTerm)) ||
        (r.id && r.id.toLowerCase().includes(searchTerm));

      const matchesStatus = statusVal === 'all' || r.status === statusVal;
      const matchesUrgency = urgencyVal === 'all' || r.urgency === urgencyVal;

      return matchesSearch && matchesStatus && matchesUrgency;
    });

    if (requestResultsCount) {
      requestResultsCount.textContent = `Showing ${filtered.length} of ${allRequests.length} requests`;
    }

    if (filtered.length === 0) {
      requestsContainer.innerHTML = `
        <div style="background: white; border: 1px solid #E2E7E3; border-radius: 12px; padding: 3rem 1.5rem; text-align: center;">
          <h3 style="color: #151B17; font-size: 1.15rem; margin-bottom: 0.5rem;">No Service Requests Found</h3>
          <p style="color: #68756B; font-size: 0.9rem;">No requests match your current search or filter criteria.</p>
        </div>
      `;
      return;
    }

    requestsContainer.innerHTML = filtered.map(r => {
      const cleanPhone = cleanPhoneNumber(r.phone);
      const waLink = getWhatsAppLink(r.phone, r.customerName, r.service, r.category);
      const callLink = cleanPhone ? `tel:${cleanPhone}` : '#';
      const formattedDate = formatDate(r.createdAt || r.acceptedAt);
      const urgencyClass = (r.urgency || '').replace(/\s+/g, '-');
      const statusLabel = getStatusLabel(r.status);

      return `
        <div class="request-card status-${r.status || 'pending_matching'}" id="card-${r.id}">
          <div class="card-top-row">
            <div class="req-meta">
              <span class="req-id-badge">#${escapeHtml(r.id)}</span>
              <span class="req-time"> ${formattedDate}</span>
              ${r.preferredDate ? `<span class="req-time" style="background:#F2F4F2; padding:0.15rem 0.5rem; border-radius:4px;">Preferred: ${escapeHtml(r.preferredDate)}</span>` : ''}
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span class="req-urgency-badge urgency-${urgencyClass}">${escapeHtml(r.urgency || 'Standard')}</span>
              <span class="badge ${getStatusBadgeClass(r.status)}">${statusLabel}</span>
            </div>
          </div>

          <div class="card-main-grid">
            <!-- Customer Contact Column -->
            <div class="cust-info">
              <strong>${escapeHtml(r.customerName)}</strong>
              <div class="cust-contact-line">
                <span></span>
                <a href="${callLink}" style="color: #16883D; font-weight: 700; text-decoration: underline;">
                  ${escapeHtml(r.phone)}
                </a>
              </div>
              ${r.email ? `<div class="cust-contact-line" style="font-size:0.82rem; color:#68756B;"><span></span> ${escapeHtml(r.email)}</div>` : ''}
              <div class="cust-location">
                <span></span>
                <span>${escapeHtml(r.location || 'Location Not Specified')}</span>
              </div>
            </div>

            <!-- Service Requirement Column -->
            <div class="service-info">
              <span class="category-pill">${escapeHtml(r.category)}</span>
              <h3>${escapeHtml(r.service || r.category)}</h3>
              <p class="service-desc-snippet">${escapeHtml(r.description || 'No description provided')}</p>
              ${r.bedrooms ? `
                <div style="font-size:0.78rem; color:#166534; margin-top:0.35rem; font-weight:700;">
                   Bedrooms: ${escapeHtml(r.bedrooms)}
                </div>
              ` : ''}
              ${Array.isArray(r.preferredLocations) && r.preferredLocations.length ? `
                <div style="font-size:0.78rem; color:#166534; margin-top:0.2rem; font-weight:600;">
                   Preferred Areas: ${escapeHtml(r.preferredLocations.join(', '))}
                </div>
              ` : ''}
              ${r.propertyBudget ? `
                <div style="font-size:0.78rem; color:#047857; margin-top:0.2rem; font-weight:600;">
                   Property Budget: ${escapeHtml(r.propertyBudget)}
                </div>
              ` : ''}
              ${r.propertyTimeline ? `
                <div style="font-size:0.78rem; color:#4B5563; margin-top:0.2rem;">
                  ⏱ Timeline: ${escapeHtml(r.propertyTimeline)}
                </div>
              ` : ''}
              ${Array.isArray(r.propertyTypes) && r.propertyTypes.length ? `
                <div style="font-size:0.78rem; color:#166534; margin-top:0.2rem; font-weight:600;">
                   Property Type: ${escapeHtml(r.propertyTypes.join(', '))}${r.propertyTypeOther ? ` (${escapeHtml(r.propertyTypeOther)})` : ''}
                </div>
              ` : ''}
              ${r.carType || r.carModelYear ? `
                <div style="font-size:0.78rem; color:#1E40AF; margin-top:0.35rem; font-weight:700;">
                   Vehicle: ${escapeHtml(r.carType || 'Car')} ${r.carModelYear ? `(${escapeHtml(r.carModelYear)})` : ''}
                </div>
              ` : ''}
              ${r.isElectricVehicle ? `
                <div style="font-size:0.78rem; color:#0284C7; margin-top:0.2rem;">
                   EV: ${escapeHtml(r.isElectricVehicle)}
                </div>
              ` : ''}
              ${Array.isArray(r.carColours) && r.carColours.length ? `
                <div style="font-size:0.78rem; color:#4B5563; margin-top:0.2rem;">
                   Colours: ${escapeHtml(r.carColours.join(', '))}
                </div>
              ` : ''}
              ${r.carBudget ? `
                <div style="font-size:0.78rem; color:#047857; margin-top:0.2rem; font-weight:600;">
                   Car Budget: ${escapeHtml(r.carBudget)}
                </div>
              ` : ''}
              ${r.constructionDescription ? `
                <div style="font-size:0.78rem; color:#0369A1; margin-top:0.25rem;">
                   Construction: ${escapeHtml(r.constructionDescription)} ${r.landSize ? `· Land: ${escapeHtml(r.landSizeOther || r.landSize)}` : ''}
                </div>
              ` : ''}
              ${r.adminNotes ? `
                <div style="background:#FFFBEB; border:1px solid #FDE68A; padding:0.3rem 0.5rem; border-radius:6px; font-size:0.78rem; color:#92400E; margin-top:0.4rem;">
                   <strong>Note:</strong> ${escapeHtml(r.adminNotes)}
                </div>
              ` : ''}
            </div>

            <!-- Action Column -->
            <div class="card-actions-col">
              <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="btn-contact-whatsapp">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
                <span>WhatsApp Customer</span>
              </a>

              <a href="${callLink}" class="btn-contact-call">
                <span> Call ${cleanPhone || 'Customer'}</span>
              </a>

              <div class="card-sub-actions">
                <button type="button" class="btn-view-details" onclick="window.openRequestModal('${r.id}')">
                   View Details
                </button>
                <select class="status-select-inline" onchange="window.updateRequestStatus('${r.id}', this.value)">
                  <option value="pending_matching" ${r.status === 'pending_matching' ? 'selected' : ''}>New (Pending)</option>
                  <option value="contacted" ${r.status === 'contacted' ? 'selected' : ''}>Contacted</option>
                  <option value="in_progress" ${r.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                  <option value="completed" ${r.status === 'completed' ? 'selected' : ''}>Completed</option>
                  <option value="cancelled" ${r.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Filter Listeners
  if (requestSearchInput) requestSearchInput.addEventListener('input', renderFilteredRequests);
  if (requestStatusFilter) requestStatusFilter.addEventListener('change', renderFilteredRequests);
  if (requestUrgencyFilter) requestUrgencyFilter.addEventListener('change', renderFilteredRequests);

  // Update Request Status via API
  window.updateRequestStatus = async function(id, newStatus) {
    try {
      const res = await fetch('/api/requests/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      const json = await res.json();
      if (json.success) {
        const item = allRequests.find(r => r.id === id);
        if (item) item.status = newStatus;
        renderFilteredRequests();
        loadStats();
      } else {
        alert('Failed to update status: ' + (json.error || 'Server error'));
      }
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  // Open Full Details Modal
  window.openRequestModal = function(id) {
    const item = allRequests.find(r => r.id === id);
    if (!item || !modal) return;

    currentModalRequestId = id;
    document.getElementById('modalReqId').textContent = '#' + item.id;
    document.getElementById('modalCustomerName').textContent = item.customerName;
    document.getElementById('modalCustomerMeta').textContent = `${item.location || 'Abuja'} • Received on ${formatDate(item.createdAt || item.acceptedAt)}`;

    const statusBadge = document.getElementById('modalReqStatusBadge');
    if (statusBadge) {
      statusBadge.textContent = getStatusLabel(item.status);
      statusBadge.className = 'badge ' + getStatusBadgeClass(item.status);
    }

    const cleanPhone = cleanPhoneNumber(item.phone);
    const waBtn = document.getElementById('modalWhatsAppBtn');
    if (waBtn) waBtn.href = getWhatsAppLink(item.phone, item.customerName, item.service, item.category);

    const callBtn = document.getElementById('modalCallBtn');
    if (callBtn) {
      callBtn.href = cleanPhone ? `tel:${cleanPhone}` : '#';
      callBtn.textContent = ` Call ${item.phone}`;
    }

    document.getElementById('modalCategory').textContent = item.category || '-';
    document.getElementById('modalService').textContent = item.service || item.category || '-';
    document.getElementById('modalDescription').textContent = item.description || 'No description provided';

    // Property Fields
    const propVal = Array.isArray(item.propertyTypes) && item.propertyTypes.length
      ? item.propertyTypes.join(', ') + (item.propertyTypeOther ? ` (${item.propertyTypeOther})` : '')
      : (item.category === 'Property Sales & Rentals' ? 'Residential Property' : 'None specified');
    document.getElementById('modalPropertyTypes').textContent = propVal;

    // Bedrooms
    const bedLabel = document.getElementById('modalBedroomsLabel');
    const bedVal = document.getElementById('modalBedrooms');
    if (item.bedrooms) {
      if (bedLabel) bedLabel.style.display = 'block';
      if (bedVal) { bedVal.style.display = 'block'; bedVal.textContent = item.bedrooms; }
    } else {
      if (bedLabel) bedLabel.style.display = 'none';
      if (bedVal) bedVal.style.display = 'none';
    }

    // Preferred Locations
    const locsLabel = document.getElementById('modalPreferredLocationsLabel');
    const locsVal = document.getElementById('modalPreferredLocations');
    const prefLocs = Array.isArray(item.preferredLocations) && item.preferredLocations.length ? item.preferredLocations.join(', ') : '';
    if (prefLocs) {
      if (locsLabel) locsLabel.style.display = 'block';
      if (locsVal) { locsVal.style.display = 'block'; locsVal.textContent = prefLocs; }
    } else {
      if (locsLabel) locsLabel.style.display = 'none';
      if (locsVal) locsVal.style.display = 'none';
    }

    // Property Budget
    const propBudLabel = document.getElementById('modalPropertyBudgetLabel');
    const propBudVal = document.getElementById('modalPropertyBudget');
    if (item.propertyBudget) {
      if (propBudLabel) propBudLabel.style.display = 'block';
      if (propBudVal) { propBudVal.style.display = 'block'; propBudVal.textContent = item.propertyBudget; }
    } else {
      if (propBudLabel) propBudLabel.style.display = 'none';
      if (propBudVal) propBudVal.style.display = 'none';
    }

    // Property Timeline
    const propTimeLabel = document.getElementById('modalPropertyTimelineLabel');
    const propTimeVal = document.getElementById('modalPropertyTimeline');
    if (item.propertyTimeline) {
      if (propTimeLabel) propTimeLabel.style.display = 'block';
      if (propTimeVal) { propTimeVal.style.display = 'block'; propTimeVal.textContent = item.propertyTimeline; }
    } else {
      if (propTimeLabel) propTimeLabel.style.display = 'none';
      if (propTimeVal) propTimeVal.style.display = 'none';
    }

    // Car Fields
    const carTypeLabel = document.getElementById('modalCarTypeLabel');
    const carTypeVal = document.getElementById('modalCarType');
    if (item.carType) {
      if (carTypeLabel) carTypeLabel.style.display = 'block';
      if (carTypeVal) { carTypeVal.style.display = 'block'; carTypeVal.textContent = item.carType; }
    } else {
      if (carTypeLabel) carTypeLabel.style.display = 'none';
      if (carTypeVal) carTypeVal.style.display = 'none';
    }

    const carModelLabel = document.getElementById('modalCarModelYearLabel');
    const carModelVal = document.getElementById('modalCarModelYear');
    if (item.carModelYear) {
      if (carModelLabel) carModelLabel.style.display = 'block';
      if (carModelVal) { carModelVal.style.display = 'block'; carModelVal.textContent = item.carModelYear; }
    } else {
      if (carModelLabel) carModelLabel.style.display = 'none';
      if (carModelVal) carModelVal.style.display = 'none';
    }

    const carEvLabel = document.getElementById('modalCarEvLabel');
    const carEvVal = document.getElementById('modalCarEv');
    if (item.isElectricVehicle) {
      if (carEvLabel) carEvLabel.style.display = 'block';
      if (carEvVal) { carEvVal.style.display = 'block'; carEvVal.textContent = item.isElectricVehicle; }
    } else {
      if (carEvLabel) carEvLabel.style.display = 'none';
      if (carEvVal) carEvVal.style.display = 'none';
    }

    const carColLabel = document.getElementById('modalCarColoursLabel');
    const carColVal = document.getElementById('modalCarColours');
    const colStr = Array.isArray(item.carColours) && item.carColours.length ? item.carColours.join(', ') : '';
    if (colStr) {
      if (carColLabel) carColLabel.style.display = 'block';
      if (carColVal) { carColVal.style.display = 'block'; carColVal.textContent = colStr; }
    } else {
      if (carColLabel) carColLabel.style.display = 'none';
      if (carColVal) carColVal.style.display = 'none';
    }

    const carBudLabel = document.getElementById('modalCarBudgetLabel');
    const carBudVal = document.getElementById('modalCarBudget');
    if (item.carBudget) {
      if (carBudLabel) carBudLabel.style.display = 'block';
      if (carBudVal) { carBudVal.style.display = 'block'; carBudVal.textContent = item.carBudget; }
    } else {
      if (carBudLabel) carBudLabel.style.display = 'none';
      if (carBudVal) carBudVal.style.display = 'none';
    }

    // Construction & Land
    const constrDesc = item.constructionDescription || '';
    const constrLabel = document.getElementById('modalConstructionLabel');
    const constrDetails = document.getElementById('modalConstructionDetails');
    if (constrDesc) {
      constrLabel.style.display = 'block';
      constrDetails.style.display = 'block';
      constrDetails.textContent = constrDesc;
    } else {
      constrLabel.style.display = 'none';
      constrDetails.style.display = 'none';
    }

    const landSize = item.landSizeOther || item.landSize || '';
    const landStatus = item.landStatus === 'already-have-land' ? 'Customer already owns land' : item.landStatus === 'help-finding-land' ? 'ALLFIX verified land acquisition requested' : '';
    const landLabel = document.getElementById('modalLandLabel');
    const landDetails = document.getElementById('modalLandDetails');
    if (landSize || landStatus) {
      landLabel.style.display = 'block';
      landDetails.style.display = 'block';
      landDetails.textContent = `${landSize ? 'Size: ' + landSize : ''} ${landStatus ? '(' + landStatus + ')' : ''}`;
    } else {
      landLabel.style.display = 'none';
      landDetails.style.display = 'none';
    }

    document.getElementById('modalUrgency').textContent = item.propertyTimeline || item.urgency || 'Standard';

    const prefDateLabel = document.getElementById('modalPreferredDateLabel');
    const prefDateVal = document.getElementById('modalPreferredDate');
    if (item.category === 'Property Sales & Rentals' || item.category === 'Cars & Vehicles') {
      if (prefDateLabel) prefDateLabel.style.display = 'none';
      if (prefDateVal) prefDateVal.style.display = 'none';
    } else {
      if (prefDateLabel) prefDateLabel.style.display = 'block';
      if (prefDateVal) { prefDateVal.style.display = 'block'; prefDateVal.textContent = item.preferredDate || 'Flexible / As soon as possible'; }
    }

    document.getElementById('modalLocation').textContent = item.location || 'Not provided';
    document.getElementById('modalMeetingPerson').textContent = item.meetingPersonName
      ? `${item.meetingPersonName} • ${item.meetingPersonPhone || 'No phone'}${item.isBookingForSomeoneElse && item.meetingPersonRelationship ? ` • Relationship: ${item.meetingPersonRelationship}` : ''}`
      : 'Not provided';
    document.getElementById('modalMeetingAddress').textContent = item.meetingAddress || 'Not provided';
    const identityDetails = document.getElementById('modalIdentityDetails');
    if (identityDetails) {
      const links = [];
      const identityUrl = `/api/identity-file?entity=request&id=${encodeURIComponent(item.id)}&kind=`;
      if (item.identityDocumentPath) links.push(`<a href="${identityUrl}id" target="_blank" rel="noopener noreferrer">View ${escapeHtml(item.identityDocumentType || 'ID')}</a>`);
      if (item.selfiePath) links.push(`<a href="${identityUrl}selfie" target="_blank" rel="noopener noreferrer">View selfie</a>`);
      identityDetails.innerHTML = links.length ? links.join(' &nbsp;•&nbsp; ') : 'No identity files on record';
    }
    document.getElementById('modalPhone').textContent = item.phone || '-';
    document.getElementById('modalEmail').textContent = item.email || 'None provided';
    document.getElementById('modalAgreementId').textContent = item.agreementId || 'AGR-C-RECORDED';
    const termsAcceptedBadge = document.getElementById('modalTermsAcceptedBadge');
    if (termsAcceptedBadge) {
      const v = item.termsVersion || item.version || 'v1.0';
      const type = item.agreementType || 'Client Terms';
      termsAcceptedBadge.textContent = `${type} ${v} — Accepted ${formatDate(item.acceptedAt || item.createdAt)}`;
    }

    if (modalStatusSelect) modalStatusSelect.value = item.status || 'pending_matching';
    if (modalAdminNotes) modalAdminNotes.value = item.adminNotes || '';

    modal.classList.add('open');
  };

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      modal.classList.remove('open');
      currentModalRequestId = null;
    });
  }

  window.addEventListener('click', e => {
    if (e.target === modal) {
      modal.classList.remove('open');
      currentModalRequestId = null;
    }
  });

  // Save Modal Notes & Status
  if (saveModalStatusBtn) {
    saveModalStatusBtn.addEventListener('click', async () => {
      if (!currentModalRequestId) return;
      const status = modalStatusSelect.value;
      const adminNotes = modalAdminNotes.value.trim();

      saveModalStatusBtn.disabled = true;
      saveModalStatusBtn.textContent = 'Saving...';

      try {
        const res = await fetch('/api/requests/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: currentModalRequestId, status, adminNotes })
        });
        const json = await res.json();
        if (json.success) {
          const item = allRequests.find(r => r.id === currentModalRequestId);
          if (item) {
            item.status = status;
            item.adminNotes = adminNotes;
          }
          renderFilteredRequests();
          loadStats();
          modal.classList.remove('open');
          alert('Status and notes updated successfully.');
        } else {
          alert('Failed to update: ' + (json.error || 'Server error'));
        }
      } catch (err) {
        alert('Error: ' + err.message);
      } finally {
        saveModalStatusBtn.disabled = false;
        saveModalStatusBtn.textContent = 'Save Status & Notes';
      }
    });
  }

  // Delete Request
  if (deleteRequestBtn) {
    deleteRequestBtn.addEventListener('click', async () => {
      if (!currentModalRequestId) return;
      if (!confirm(`Are you sure you want to delete request #${currentModalRequestId}? This cannot be undone.`)) return;

      try {
        const res = await fetch('/api/requests/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: currentModalRequestId })
        });
        const json = await res.json();
        if (json.success) {
          allRequests = allRequests.filter(r => r.id !== currentModalRequestId);
          renderFilteredRequests();
          loadStats();
          modal.classList.remove('open');
          currentModalRequestId = null;
        } else {
          alert('Failed to delete: ' + json.error);
        }
      } catch (err) {
        alert('Error: ' + err.message);
      }
    });
  }

  // 2. VENDORS TAB
  async function loadVendors() {
    try {
      const res = await fetch('/api/vendors');
      const json = await res.json();
      if (!json.success) return;

      allVendors = json.data || [];
      const badgeCount = document.getElementById('badgeVendorsCount');
      if (badgeCount) badgeCount.textContent = allVendors.length;

      renderFilteredVendors();
    } catch (err) {
      if (vendorsTable) {
        vendorsTable.innerHTML = `<tr><td colspan="6" style="color:red; text-align:center;">Failed to load vendors: ${err.message}</td></tr>`;
      }
    }
  }

  function renderFilteredVendors() {
    if (!vendorsTable) return;
    const searchTerm = (vendorSearchInput?.value || '').toLowerCase().trim();
    const statusVal = vendorStatusFilter?.value || 'all';

    const filtered = allVendors.filter(v => {
      const matchesSearch = !searchTerm ||
        (v.fullName && v.fullName.toLowerCase().includes(searchTerm)) ||
        (v.businessName && v.businessName.toLowerCase().includes(searchTerm)) ||
        (v.phone && v.phone.toLowerCase().includes(searchTerm)) ||
        (v.category && v.category.toLowerCase().includes(searchTerm)) ||
        (v.regNumber && v.regNumber.toLowerCase().includes(searchTerm)) ||
        (v.id && v.id.toLowerCase().includes(searchTerm));

      const matchesStatus = statusVal === 'all' || v.verificationStatus === statusVal;
      return matchesSearch && matchesStatus;
    });

    if (filtered.length === 0) {
      vendorsTable.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem;">No vendors found matching search.</td></tr>`;
      return;
    }

    vendorsTable.innerHTML = filtered.map(v => {
      const cleanPhone = cleanPhoneNumber(v.phone);
      const waLink = getVendorWhatsAppLink(v.phone, v.fullName, v.businessName, v.category);
      const callLink = cleanPhone ? `tel:${cleanPhone}` : '#';
      const identityUrl = `/api/identity-file?entity=vendor&id=${encodeURIComponent(v.id)}&kind=`;
      const identityLinks = [
        v.identityDocumentPath ? `<a href="${identityUrl}id" target="_blank" rel="noopener noreferrer">View ${escapeHtml(v.identityDocumentType || 'ID')}</a>` : '',
        v.selfiePath ? `<a href="${identityUrl}selfie" target="_blank" rel="noopener noreferrer">View selfie</a>` : ''
      ].filter(Boolean).join(' &nbsp;•&nbsp; ');

      return `
        <tr>
          <td><strong style="font-family: monospace; color: #16883D;">${v.id}</strong></td>
          <td>
            <strong style="font-size: 1rem;">${escapeHtml(v.businessName || v.fullName)}</strong><br>
            <span style="font-size: 0.85rem; color: #3E4D42;">Lead: ${escapeHtml(v.fullName)}</span><br>
            <span style="font-size: 0.8rem; color: #68756B;"> ${escapeHtml(v.phone)}</span><br>
            <span style="font-size: 0.78rem; color: #68756B;">Home address: ${escapeHtml(v.residentialAddress || 'Not provided')}</span>
            ${identityLinks ? `<br><span style="font-size: 0.78rem;">${identityLinks}</span>` : ''}
          </td>
          <td>
            <strong>${escapeHtml(v.category)}</strong><br>
            <span style="font-size: 0.82rem; color: #68756B;">Exp: ${escapeHtml(v.experienceYears || '3-5')} yrs</span>
            ${v.regNumber ? `<br><span style="font-size: 0.78rem; font-family: monospace; color: #166534;">ID: ${escapeHtml(v.regNumber)}</span>` : ''}
          </td>
          <td>
            <span style="font-size: 0.85rem;">${escapeHtml(v.operatingAreas || 'Abuja & surrounding areas')}</span>
          </td>
          <td>
            <select class="admin-select" style="font-size: 0.8rem; padding: 0.35rem 0.6rem;" onchange="window.updateVendorStatus('${v.id}', this.value)">
              <option value="pending" ${v.verificationStatus === 'pending' ? 'selected' : ''}>Pending Review</option>
              <option value="verified" ${v.verificationStatus === 'verified' ? 'selected' : ''}>Verified Artisan</option>
              <option value="rejected" ${v.verificationStatus === 'rejected' ? 'selected' : ''}>Rejected</option>
            </select>
          </td>
          <td style="text-align: right;">
            <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
              <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="btn btn-sm" style="background:#25D366; color:white; padding:0.4rem 0.65rem; font-size:0.78rem;">
                WhatsApp
              </a>
              <a href="${callLink}" class="btn btn-sm btn-secondary" style="padding:0.4rem 0.65rem; font-size:0.78rem;">
                Call
              </a>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  if (vendorSearchInput) vendorSearchInput.addEventListener('input', renderFilteredVendors);
  if (vendorStatusFilter) vendorStatusFilter.addEventListener('change', renderFilteredVendors);

  window.updateVendorStatus = async function(id, verificationStatus) {
    try {
      const res = await fetch('/api/vendors/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, verificationStatus })
      });
      const json = await res.json();
      if (json.success) {
        const item = allVendors.find(v => v.id === id);
        if (item) item.verificationStatus = verificationStatus;
        loadStats();
      } else {
        alert('Failed: ' + json.error);
      }
    } catch (e) {
      alert('Error updating vendor: ' + e.message);
    }
  };

  // 3. MESSAGES TAB
  async function loadMessages() {
    try {
      const res = await fetch('/api/messages');
      const json = await res.json();
      if (!json.success) return;

      allMessages = json.data || [];
      const badgeCount = document.getElementById('badgeMessagesCount');
      if (badgeCount) badgeCount.textContent = allMessages.length;

      if (!messagesTable) return;
      if (allMessages.length === 0) {
        messagesTable.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem;">No contact inquiries received yet.</td></tr>`;
        return;
      }

      messagesTable.innerHTML = allMessages.map(m => {
        const cleanPhone = cleanPhoneNumber(m.phone);
        const waLink = getMessageWhatsAppLink(m.phone, m.name, m.subject);
        const callLink = cleanPhone ? `tel:${cleanPhone}` : '#';

        return `
          <tr>
            <td><strong style="font-family: monospace; color: #D97706;">${m.id}</strong></td>
            <td>
              <strong>${escapeHtml(m.name)}</strong><br>
              ${m.phone ? `<a href="${callLink}" style="color:#16883D; font-size:0.85rem;"> ${escapeHtml(m.phone)}</a><br>` : ''}
              ${m.email ? `<span style="font-size:0.8rem; color:#68756B;"> ${escapeHtml(m.email)}</span>` : ''}
            </td>
            <td><strong>${escapeHtml(m.subject || 'General Inquiry')}</strong></td>
            <td style="max-width: 300px; font-size: 0.85rem; color: #3E4D42;">${escapeHtml(m.message)}</td>
            <td style="font-size: 0.8rem; color: #68756B;">${formatDate(m.createdAt)}</td>
            <td style="text-align: right;">
              <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
                ${cleanPhone ? `
                  <a href="${waLink}" target="_blank" class="btn btn-sm" style="background:#25D366; color:white; padding:0.4rem 0.65rem; font-size:0.78rem;">
                    WhatsApp
                  </a>
                  <a href="${callLink}" class="btn btn-sm btn-secondary" style="padding:0.4rem 0.65rem; font-size:0.78rem;">
                    Call
                  </a>
                ` : ''}
                <button class="btn btn-sm" style="background:#FEF2F2; color:#DC2626; border:1px solid #FECACA; padding:0.4rem 0.65rem; font-size:0.78rem;" onclick="window.deleteMessage('${m.id}')">
                  Delete
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    } catch (e) {
      if (messagesTable) {
        messagesTable.innerHTML = `<tr><td colspan="6" style="color:red; text-align:center;">Failed to load messages: ${e.message}</td></tr>`;
      }
    }
  }

  window.deleteMessage = async function(id) {
    if (!confirm('Delete this inquiry message?')) return;
    try {
      const res = await fetch('/api/messages/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const json = await res.json();
      if (json.success) {
        loadMessages();
        loadStats();
      }
    } catch (e) {
      alert('Error: ' + e.message);
    }
  };

  // 4. TERMS AUDIT LOG
  async function loadAgreements() {
    try {
      const res = await fetch('/api/agreements');
      const json = await res.json();
      if (!json.success) return;

      allAgreements = json.data || [];
      const badgeCount = document.getElementById('badgeAgreementsCount');
      if (badgeCount) badgeCount.textContent = allAgreements.length;

      if (!agreementsTable) return;
      if (allAgreements.length === 0) {
        agreementsTable.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 2rem;">No agreement records found</td></tr>';
        return;
      }

      agreementsTable.innerHTML = allAgreements.map(r => `
        <tr>
          <td><strong style="color: #151B17; font-family: monospace;">${r.id}</strong></td>
          <td>
            <strong>${escapeHtml(r.userName)}</strong><br>
            <span style="font-size: 0.8rem; color: #68756B;">${escapeHtml(r.contact)}</span>
          </td>
          <td>
            <span class="badge ${r.agreementType === 'Client Terms' ? 'badge-green' : 'badge-blue'}">
              ${r.agreementType}
            </span>
          </td>
          <td>
            <strong style="color: #15803D;">${escapeHtml(r.agreementType)} ${escapeHtml(r.version || 'v1.0')}</strong><br>
            <span style="font-size: 0.76rem; color: #56645A;">Accepted ${formatDate(r.acceptedAt)}</span>
          </td>
          <td><span style="font-size: 0.85rem; color: #3E4D42;">${formatDate(r.acceptedAt)}</span></td>
          <td>
            <span style="color: #15803D; font-weight: 700; font-size: 0.85rem;">
               Legally Valid (${r.context || 'form'})
            </span>
          </td>
          <td><span style="font-size: 0.8rem; font-family: monospace; color: #68756B;">${r.ip || '127.0.0.1'}</span></td>
        </tr>
      `).join('');
    } catch (err) {
      if (agreementsTable) {
        agreementsTable.innerHTML = `<tr><td colspan="7" style="color: red; text-align:center;">Failed to load agreements: ${err.message}</td></tr>`;
      }
    }
  }

  // ==============================================================================
  // 5. AVAILABLE PROPERTIES MANAGEMENT
  // ==============================================================================
  const propertySearchInput = document.getElementById('propertySearchInput');
  const propertyTypeFilter = document.getElementById('propertyTypeFilter');
  const btnOpenNewPropertyModal = document.getElementById('btnOpenNewPropertyModal');
  const propertyEditModal = document.getElementById('propertyEditModal');
  const closePropertyModalBtn = document.getElementById('closePropertyModalBtn');
  const propertyEditForm = document.getElementById('propertyEditForm');
  const deletePropBtn = document.getElementById('deletePropBtn');
  const propertyModalHeading = document.getElementById('propertyModalHeading');

  async function loadProperties() {
    try {
      const res = await fetch('/api/properties');
      const json = await res.json();
      if (!json.success) return;

      allProperties = json.properties || json.data || [];
      const badgeCount = document.getElementById('badgePropertiesCount');
      if (badgeCount) badgeCount.textContent = allProperties.length;

      const elProperties = document.getElementById('statTotalProperties');
      if (elProperties) elProperties.textContent = allProperties.length;

      renderFilteredProperties();
    } catch (err) {
      if (propertiesTable) {
        propertiesTable.innerHTML = `<tr><td colspan="7" style="color: red; text-align:center;">Failed to load properties: ${escapeHtml(err.message)}</td></tr>`;
      }
    }
  }

  function renderFilteredProperties() {
    if (!propertiesTable) return;

    const searchTerm = (propertySearchInput?.value || '').toLowerCase().trim();
    const typeVal = propertyTypeFilter?.value || 'all';

    const filtered = allProperties.filter(p => {
      const matchesSearch = !searchTerm ||
        (p.title && p.title.toLowerCase().includes(searchTerm)) ||
        (p.location && p.location.toLowerCase().includes(searchTerm)) ||
        (p.propertyType && p.propertyType.toLowerCase().includes(searchTerm)) ||
        (p.id && p.id.toLowerCase().includes(searchTerm));

      const matchesType = typeVal === 'all' || (p.propertyType && p.propertyType.toLowerCase().includes(typeVal.toLowerCase()));

      return matchesSearch && matchesType;
    });

    if (filtered.length === 0) {
      propertiesTable.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2.5rem; color: #68756B;">
            No properties found matching your filter. Click <strong>Post New Property</strong> to add one.
          </td>
        </tr>
      `;
      return;
    }

    propertiesTable.innerHTML = filtered.map(p => {
      const imageSrc = p.imageUrl || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80';

      let priceDisplay = '';
      if (!p.price || String(p.price).trim() === '') {
        priceDisplay = '<span style="background: #FEF3C7; color: #B45309; padding: 0.2rem 0.55rem; border-radius: 4px; font-weight: 700; font-size: 0.76rem;">Price on Request</span>';
      } else {
        const cleaned = String(p.price).replace(/[^0-9]/g, '');
        if (cleaned && !isNaN(cleaned)) {
          priceDisplay = `<strong style="color: #166534; font-size: 0.95rem;">₦${Number(cleaned).toLocaleString('en-NG')}</strong>`;
        } else {
          priceDisplay = `<strong>${escapeHtml(p.price)}</strong>`;
        }
      }

      const waMsg = `Hello ALLFIX Services Xpress! I am interested in purchasing: ${p.title} (${p.location || 'Abuja'}, Ref: ${p.id}). Price: ${p.price || 'Price on Request'}. Please share title documents.`;
      const waLink = `https://wa.me/2347058099045?text=${encodeURIComponent(waMsg)}`;

      return `
        <tr id="prop-row-${p.id}">
          <td style="width: 70px;">
            <img src="${imageSrc}" alt="${escapeHtml(p.title)}" style="width: 58px; height: 42px; object-fit: cover; border-radius: 6px; border: 1px solid #E2E7E3;" onerror="this.src='https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=200&q=80'">
          </td>
          <td>
            <div style="font-size: 0.75rem; font-family: monospace; color: #68756B;">${escapeHtml(p.id)}</div>
            <strong style="color: #151B17; font-size: 0.92rem;">${escapeHtml(p.title)}</strong>
          </td>
          <td>
            <span style="font-size: 0.88rem; color: #3E4D42;">${escapeHtml(p.location || 'Abuja')}</span>
          </td>
          <td>
            <span class="badge badge-green" style="font-size: 0.76rem;">${escapeHtml(p.propertyType || 'Property')}</span>
          </td>
          <td>
            ${priceDisplay}
          </td>
          <td>
            <div style="font-size: 0.8rem; color: #56645A;">
              ${p.size ? `Size: ${escapeHtml(p.size)}<br>` : ''}
              ${p.titleDocument ? `Doc: ${escapeHtml(p.titleDocument)}` : ''}
            </div>
          </td>
          <td>
            <div style="display: flex; gap: 0.45rem; align-items: center;">
              <button class="btn btn-outline btn-sm btn-edit-property" data-id="${p.id}" style="padding: 0.35rem 0.65rem; font-size: 0.78rem;">
                Edit
              </button>
              <a href="${waLink}" target="_blank" rel="noopener" class="btn btn-outline btn-sm" style="padding: 0.35rem 0.65rem; font-size: 0.78rem; background: #F0FDF4; border-color: #BBF7D0; color: #166534;" title="Open WhatsApp Buyer Chat">
                WhatsApp
              </a>
              <button class="btn btn-outline btn-sm btn-delete-property" data-id="${p.id}" style="padding: 0.35rem 0.55rem; font-size: 0.78rem; color: #DC2626; border-color: #FECACA; display: inline-flex; align-items: center; justify-content: center;" title="Delete Property">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Attach row button events
    document.querySelectorAll('.btn-edit-property').forEach(btn => {
      btn.addEventListener('click', () => {
        const propId = btn.getAttribute('data-id');
        const found = allProperties.find(p => p.id === propId);
        if (found) openEditPropertyModal(found);
      });
    });

    document.querySelectorAll('.btn-delete-property').forEach(btn => {
      btn.addEventListener('click', () => {
        const propId = btn.getAttribute('data-id');
        confirmDeleteProperty(propId);
      });
    });
  }

  // Multi-Image Compression Utility (Canvas-based)
  function compressImageFile(file, maxDim = 1280, quality = 0.82) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type || !file.type.startsWith('image/')) {
        return reject(new Error('Invalid image file'));
      }
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // ==============================================================================
  // Property Multi-Image Gallery (Up to 10 photos)
  // ==============================================================================
  let propertyImagesList = [];
  const propFileInput = document.getElementById('propFormFileInput');
  const propUploadZone = document.getElementById('propImageUploadZone');
  const propUploadPrompt = document.getElementById('propImageUploadPrompt');
  const propGalleryGrid = document.getElementById('propGalleryGrid');
  const propPhotoCountBadge = document.getElementById('propPhotoCountBadge');
  const propImageInput = document.getElementById('propFormImage');
  const btnAddPropUrl = document.getElementById('btnAddPropUrlBtn');

  function renderPropertyGallery() {
    if (propPhotoCountBadge) {
      propPhotoCountBadge.textContent = `${propertyImagesList.length} / 10 photos selected`;
    }
    if (!propGalleryGrid || !propUploadPrompt) return;

    if (propertyImagesList.length === 0) {
      propGalleryGrid.style.display = 'none';
      propGalleryGrid.innerHTML = '';
      propUploadPrompt.style.display = 'block';
      return;
    }

    propUploadPrompt.style.display = 'none';
    propGalleryGrid.style.display = 'grid';

    let html = propertyImagesList.map((src, index) => {
      const isCover = index === 0;
      return `
        <div class="photo-thumb-card ${isCover ? 'is-cover' : ''}">
          <img src="${src}" alt="Property Photo ${index + 1}">
          <span class="photo-thumb-badge">${isCover ? ' Cover' : `#${index + 1}`}</span>
          <button type="button" class="photo-thumb-del" data-index="${index}" title="Remove photo">&times;</button>
        </div>
      `;
    }).join('');

    if (propertyImagesList.length < 10) {
      html += `
        <div class="photo-add-more-card" id="btnPropAddMorePhotos">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          <span>Add More</span>
        </div>
      `;
    }

    propGalleryGrid.innerHTML = html;

    propGalleryGrid.querySelectorAll('.photo-thumb-del').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        propertyImagesList.splice(idx, 1);
        renderPropertyGallery();
      });
    });

    const addMoreBtn = document.getElementById('btnPropAddMorePhotos');
    if (addMoreBtn) {
      addMoreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (propFileInput) propFileInput.click();
      });
    }
  }

  async function handlePropertyFilesSelected(files) {
    if (!files || files.length === 0) return;
    const remaining = 10 - propertyImagesList.length;
    if (remaining <= 0) {
      alert('Maximum 10 pictures reached per listing.');
      return;
    }
    const toProcess = Array.from(files).slice(0, remaining);
    for (const f of toProcess) {
      try {
        const compressed = await compressImageFile(f);
        if (propertyImagesList.length < 10) {
          propertyImagesList.push(compressed);
        }
      } catch (err) {
        console.warn('Property image skipped:', err);
      }
    }
    if (files.length > remaining) {
      alert(`Only ${remaining} photo(s) added because maximum limit is 10 pictures.`);
    }
    renderPropertyGallery();
    if (propFileInput) propFileInput.value = '';
  }

  if (propUploadZone && propFileInput) {
    propUploadZone.addEventListener('click', (e) => {
      if (e.target.closest('.photo-thumb-del') || e.target.closest('#btnPropAddMorePhotos')) return;
      if (propertyImagesList.length >= 10) {
        alert('Maximum of 10 pictures reached.');
        return;
      }
      propFileInput.click();
    });

    propUploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      propUploadZone.classList.add('dragover');
    });

    propUploadZone.addEventListener('dragleave', () => {
      propUploadZone.classList.remove('dragover');
    });

    propUploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      propUploadZone.classList.remove('dragover');
      if (e.dataTransfer && e.dataTransfer.files) {
        handlePropertyFilesSelected(e.dataTransfer.files);
      }
    });
  }

  if (propFileInput) {
    propFileInput.addEventListener('change', () => {
      if (propFileInput.files && propFileInput.files.length > 0) {
        handlePropertyFilesSelected(propFileInput.files);
      }
    });
  }

  if (btnAddPropUrl) {
    btnAddPropUrl.addEventListener('click', () => {
      const val = (propImageInput?.value || '').trim();
      if (!val) return;
      if (propertyImagesList.length >= 10) {
        alert('Maximum of 10 pictures reached.');
        return;
      }
      propertyImagesList.push(val);
      if (propImageInput) propImageInput.value = '';
      renderPropertyGallery();
    });
  }

  function openNewPropertyModal() {
    if (!propertyEditModal) return;
    propertyEditForm.reset();
    propertyImagesList = [];
    renderPropertyGallery();
    document.getElementById('propFormId').value = '';
    if (propertyModalHeading) propertyModalHeading.textContent = 'Post Available Property';
    if (deletePropBtn) deletePropBtn.style.display = 'none';
    propertyEditModal.classList.add('open');
  }

  function openEditPropertyModal(prop) {
    if (!propertyEditModal) return;
    document.getElementById('propFormId').value = prop.id;
    document.getElementById('propFormTitle').value = prop.title || '';
    document.getElementById('propFormLocation').value = prop.location || '';
    document.getElementById('propFormType').value = prop.propertyType || 'Residential';
    document.getElementById('propFormPrice').value = prop.price || '';
    document.getElementById('propFormSize').value = prop.size || '';
    document.getElementById('propFormTitleDoc').value = prop.titleDocument || '';
    if (propImageInput) propImageInput.value = '';
    document.getElementById('propFormDesc').value = prop.description || '';

    if (Array.isArray(prop.images) && prop.images.length > 0) {
      propertyImagesList = [...prop.images];
    } else if (prop.imageUrl) {
      propertyImagesList = [prop.imageUrl];
    } else {
      propertyImagesList = [];
    }
    renderPropertyGallery();

    if (propertyModalHeading) propertyModalHeading.textContent = `Edit Property: ${prop.title}`;
    if (deletePropBtn) deletePropBtn.style.display = 'inline-block';
    propertyEditModal.classList.add('open');
  }

  function closePropertyModal() {
    if (propertyEditModal) propertyEditModal.classList.remove('open');
  }

  async function confirmDeleteProperty(propId) {
    if (!confirm('Are you sure you want to delete this property listing? It will be removed from the public website.')) return;
    try {
      const res = await fetch('/api/properties/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: propId })
      });
      const json = await res.json();
      if (json.success) {
        closePropertyModal();
        await loadProperties();
      } else {
        alert('Failed to delete property: ' + (json.error || 'Unknown error'));
      }
    } catch (e) {
      alert('Network error while deleting: ' + e.message);
    }
  }

  if (btnOpenNewPropertyModal) {
    btnOpenNewPropertyModal.addEventListener('click', openNewPropertyModal);
  }

  if (closePropertyModalBtn) {
    closePropertyModalBtn.addEventListener('click', closePropertyModal);
  }

  if (deletePropBtn) {
    deletePropBtn.addEventListener('click', () => {
      const propId = document.getElementById('propFormId').value;
      if (propId) confirmDeleteProperty(propId);
    });
  }

  if (propertySearchInput) {
    propertySearchInput.addEventListener('input', renderFilteredProperties);
  }

  if (propertyTypeFilter) {
    propertyTypeFilter.addEventListener('change', renderFilteredProperties);
  }

  if (propertyEditForm) {
    propertyEditForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const saveBtn = document.getElementById('savePropertySubmitBtn');
      const propId = document.getElementById('propFormId').value.trim();
      const title = document.getElementById('propFormTitle').value.trim();
      const location = document.getElementById('propFormLocation').value.trim();
      const propertyType = document.getElementById('propFormType').value;
      const price = document.getElementById('propFormPrice').value.trim();
      const size = document.getElementById('propFormSize').value.trim();
      const titleDocument = document.getElementById('propFormTitleDoc').value.trim();
      const description = document.getElementById('propFormDesc').value.trim();

      if (!title || !location) {
        alert('Please provide at least a property title and location.');
        return;
      }

      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving Property...';
      }

      try {
        const payload = {
          title,
          location,
          propertyType,
          price,
          size,
          titleDocument,
          images: propertyImagesList,
          imageUrl: propertyImagesList[0] || '',
          description
        };

        const endpoint = propId ? '/api/properties/update' : '/api/properties';
        if (propId) payload.id = propId;

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success) {
          closePropertyModal();
          await loadProperties();
        } else {
          alert('Failed to save property: ' + (json.error || 'Server error'));
        }
      } catch (err) {
        alert('Network error: ' + err.message);
      } finally {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent = 'Save & Publish Property';
        }
      }
    });
  }

  window.addEventListener('click', (e) => {
    if (e.target === propertyEditModal) {
      closePropertyModal();
    }
    if (typeof vehicleEditModal !== 'undefined' && e.target === vehicleEditModal) {
      closeVehicleModal();
    }
  });

  // ==============================================================================
  // 6. AUTOMOBILE & VEHICLE MANAGEMENT
  // ==============================================================================
  let allVehicles = [];
  let vehicleImagesList = [];

  const vehiclesTable = document.getElementById('vehiclesTableBody');
  const vehicleSearchInput = document.getElementById('vehicleSearchInput');
  const vehicleTypeFilter = document.getElementById('vehicleTypeFilter');
  const vehicleConditionFilter = document.getElementById('vehicleConditionFilter');
  const btnOpenNewVehicleModal = document.getElementById('btnOpenNewVehicleModal');
  const vehicleEditModal = document.getElementById('vehicleEditModal');
  const closeVehicleModalBtn = document.getElementById('closeVehicleModalBtn');
  const vehicleEditForm = document.getElementById('vehicleEditForm');
  const deleteVehBtn = document.getElementById('deleteVehBtn');
  const vehicleModalHeading = document.getElementById('vehicleModalHeading');
  const vehFileInput = document.getElementById('vehFormFileInput');
  const vehUploadZone = document.getElementById('vehImageUploadZone');
  const vehUploadPrompt = document.getElementById('vehImageUploadPrompt');
  const vehGalleryGrid = document.getElementById('vehGalleryGrid');
  const vehPhotoCountBadge = document.getElementById('vehPhotoCountBadge');
  const vehImageInput = document.getElementById('vehFormImage');
  const btnAddVehUrl = document.getElementById('btnAddVehUrlBtn');

  async function loadVehicles() {
    try {
      const res = await fetch('/api/vehicles');
      const json = await res.json();
      if (!json.success) return;

      allVehicles = json.vehicles || json.data || [];
      const badgeCount = document.getElementById('badgeVehiclesCount');
      if (badgeCount) badgeCount.textContent = allVehicles.length;

      const elVehicles = document.getElementById('statTotalVehicles');
      if (elVehicles) elVehicles.textContent = allVehicles.length;

      renderFilteredVehicles();
    } catch (err) {
      if (vehiclesTable) {
        vehiclesTable.innerHTML = `<tr><td colspan="8" style="color: red; text-align:center;">Failed to load vehicles: ${escapeHtml(err.message)}</td></tr>`;
      }
    }
  }

  function renderFilteredVehicles() {
    if (!vehiclesTable) return;

    const searchTerm = (vehicleSearchInput?.value || '').toLowerCase().trim();
    const typeVal = vehicleTypeFilter?.value || 'all';
    const condVal = vehicleConditionFilter?.value || 'all';

    const filtered = allVehicles.filter(v => {
      const matchesSearch = !searchTerm ||
        (v.title && v.title.toLowerCase().includes(searchTerm)) ||
        (v.make && v.make.toLowerCase().includes(searchTerm)) ||
        (v.model && v.model.toLowerCase().includes(searchTerm)) ||
        (v.location && v.location.toLowerCase().includes(searchTerm)) ||
        (v.year && String(v.year).includes(searchTerm)) ||
        (v.id && v.id.toLowerCase().includes(searchTerm));

      const matchesType = typeVal === 'all' || (v.vehicleType && v.vehicleType.toLowerCase().includes(typeVal.toLowerCase()));
      const matchesCond = condVal === 'all' || (v.condition && v.condition.toLowerCase().includes(condVal.toLowerCase()));

      return matchesSearch && matchesType && matchesCond;
    });

    if (filtered.length === 0) {
      const hasVehicleInventory = allVehicles.length > 0;
      vehiclesTable.innerHTML = `
        <tr class="vehicle-inventory-empty">
          <td colspan="8" style="text-align: center; padding: 1.5rem; color: #68756B;">
            <strong style="display: block; color: #151B17; margin-bottom: 0.35rem;">${hasVehicleInventory ? 'No vehicles match these filters' : 'No vehicles have been added yet'}</strong>
            <span>${hasVehicleInventory ? `There are ${allVehicles.length} vehicles in your inventory. Clear the filters to see them.` : 'Post a vehicle to add it to the ALLFIX showroom.'}</span>
            ${hasVehicleInventory ? '<button type="button" id="resetVehicleFilters" class="btn btn-outline btn-sm" style="margin: 0.85rem auto 0;">Clear filters</button>' : ''}
          </td>
        </tr>
      `;
      document.getElementById('resetVehicleFilters')?.addEventListener('click', () => {
        if (vehicleSearchInput) vehicleSearchInput.value = '';
        if (vehicleTypeFilter) vehicleTypeFilter.value = 'all';
        if (vehicleConditionFilter) vehicleConditionFilter.value = 'all';
        renderFilteredVehicles();
      });
      return;
    }

    vehiclesTable.innerHTML = filtered.map(v => {
      const firstImg = (v.images && v.images[0]) || v.imageUrl || '';
      const imgCount = (v.images && v.images.length) || (v.imageUrl ? 1 : 0);

      let priceDisplay = '';
      if (!v.price || String(v.price).trim() === '') {
        priceDisplay = '<span style="background: #FEF3C7; color: #B45309; padding: 0.2rem 0.55rem; border-radius: 4px; font-weight: 700; font-size: 0.76rem;">On Request</span>';
      } else {
        const cleaned = String(v.price).replace(/[^0-9]/g, '');
        if (cleaned && !isNaN(cleaned)) {
          priceDisplay = `<strong style="color: #166534; font-size: 0.95rem;">₦${Number(cleaned).toLocaleString('en-NG')}</strong>`;
        } else {
          priceDisplay = `<strong>${escapeHtml(v.price)}</strong>`;
        }
      }

      const waMsg = `Hello ALLFIX Services Xpress! I am interested in inspecting/purchasing this vehicle: ${v.title} (Year: ${v.year || 'N/A'}, Condition: ${v.condition || 'Verified'}, Ref: ${v.id}). Price: ${v.price || 'On Request'}. Please confirm availability.`;
      const waLink = `https://wa.me/2347058099045?text=${encodeURIComponent(waMsg)}`;
      const quickSpecs = [
        v.year && `Year ${v.year}`,
        v.make && `Make ${v.make}`,
        v.model && `Model ${v.model}`,
        v.transmission,
        v.fuelType,
        v.mileage,
        v.condition,
        v.vehicleType,
        v.seatingCapacity
      ].filter(Boolean);
      const imageMarkup = firstImg
        ? `<img class="vehicle-admin-thumb" src="${escapeHtml(firstImg)}" alt="${escapeHtml(v.title)}" loading="lazy" style="width: 58px; height: 42px; object-fit: cover; border-radius: 6px; border: 1px solid #E2E7E3;">`
        : '<div class="vehicle-admin-thumb" style="width: 58px; height: 42px; display: grid; place-items: center; border-radius: 6px; background: #F2F4F2; color: #68756B; font-size: 0.62rem; text-align: center;">No photo</div>';

      return `
        <tr id="veh-row-${v.id}">
          <td style="width: 70px;">
            <div style="position: relative;">
              ${imageMarkup}
              ${imgCount > 1 ? `<span style="position:absolute; bottom:2px; right:2px; background:rgba(0,0,0,0.75); color:white; font-size:0.6rem; font-weight:700; padding:1px 3px; border-radius:3px;">${imgCount} </span>` : ''}
            </div>
          </td>
          <td>
            <div style="font-size: 0.75rem; font-family: monospace; color: #68756B;">${escapeHtml(v.id)}</div>
            <strong style="color: #151B17; font-size: 0.92rem;">${escapeHtml(v.title)}</strong>
          </td>
          <td>
            <span class="badge ${v.condition === 'Brand New' ? 'badge-green' : 'badge-blue'}" style="font-size: 0.76rem;">${escapeHtml(v.condition || 'Verified')}</span>
          </td>
          <td>
            <span style="font-size: 0.85rem; color: #374151;">${escapeHtml(v.vehicleType || 'Vehicle')}</span>
          </td>
          <td>
            <div style="font-size: 0.8rem; color: #56645A;">
              <div class="vehicle-admin-quick-specs">${quickSpecs.map(spec => `<span>${escapeHtml(spec)}</span>`).join('')}</div>
              ${v.description ? `<p class="vehicle-admin-description">${escapeHtml(v.description)}</p>` : ''}
              ${v.fullSpecifications ? `<details class="vehicle-admin-full-specs"><summary>Full specifications</summary><p>${escapeHtml(v.fullSpecifications)}</p></details>` : ''}
            </div>
          </td>
          <td>
            ${priceDisplay}
          </td>
          <td>
            <span style="font-size: 0.85rem; color: #3E4D42;">${escapeHtml(v.location || 'Abuja')}</span>
          </td>
          <td>
            <div class="vehicle-admin-actions" style="display: flex; gap: 0.45rem; align-items: center;">
              <button class="btn btn-outline btn-sm btn-edit-vehicle" data-id="${v.id}" style="padding: 0.35rem 0.65rem; font-size: 0.78rem;">
                Edit
              </button>
              <a href="${waLink}" target="_blank" rel="noopener" class="btn btn-outline btn-sm" style="padding: 0.35rem 0.65rem; font-size: 0.78rem; background: #EFF6FF; border-color: #BFDBFE; color: #1E40AF;" title="Enquire about this car on WhatsApp">
                Enquire
              </a>
              <button class="btn btn-outline btn-sm btn-delete-vehicle" data-id="${v.id}" style="padding: 0.35rem 0.55rem; font-size: 0.78rem; color: #DC2626; border-color: #FECACA; display: inline-flex; align-items: center; justify-content: center;" title="Delete Vehicle">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Attach vehicle row button events
    document.querySelectorAll('.btn-edit-vehicle').forEach(btn => {
      btn.addEventListener('click', () => {
        const vehId = btn.getAttribute('data-id');
        const found = allVehicles.find(v => v.id === vehId);
        if (found) openEditVehicleModal(found);
      });
    });

    document.querySelectorAll('.btn-delete-vehicle').forEach(btn => {
      btn.addEventListener('click', () => {
        const vehId = btn.getAttribute('data-id');
        confirmDeleteVehicle(vehId);
      });
    });
  }

  function renderVehicleGallery() {
    if (vehPhotoCountBadge) {
      vehPhotoCountBadge.textContent = `${vehicleImagesList.length} / 10 photos selected`;
    }
    if (!vehGalleryGrid || !vehUploadPrompt) return;

    if (vehicleImagesList.length === 0) {
      vehGalleryGrid.style.display = 'none';
      vehGalleryGrid.innerHTML = '';
      vehUploadPrompt.style.display = 'block';
      return;
    }

    vehUploadPrompt.style.display = 'none';
    vehGalleryGrid.style.display = 'grid';

    let html = vehicleImagesList.map((src, index) => {
      const isCover = index === 0;
      return `
        <div class="photo-thumb-card ${isCover ? 'is-cover' : ''}">
          <img src="${src}" alt="Vehicle Photo ${index + 1}">
          <span class="photo-thumb-badge">${isCover ? ' Cover' : `#${index + 1}`}</span>
          <button type="button" class="photo-thumb-del" data-index="${index}" title="Remove photo">&times;</button>
        </div>
      `;
    }).join('');

    if (vehicleImagesList.length < 10) {
      html += `
        <div class="photo-add-more-card" id="btnVehAddMorePhotos">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          <span>Add More</span>
        </div>
      `;
    }

    vehGalleryGrid.innerHTML = html;

    vehGalleryGrid.querySelectorAll('.photo-thumb-del').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        vehicleImagesList.splice(idx, 1);
        renderVehicleGallery();
      });
    });

    const addMoreBtn = document.getElementById('btnVehAddMorePhotos');
    if (addMoreBtn) {
      addMoreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (vehFileInput) vehFileInput.click();
      });
    }
  }

  async function handleVehicleFilesSelected(files) {
    if (!files || files.length === 0) return;
    const remaining = 10 - vehicleImagesList.length;
    if (remaining <= 0) {
      alert('Maximum 10 pictures reached per vehicle listing.');
      return;
    }
    const toProcess = Array.from(files).slice(0, remaining);
    for (const f of toProcess) {
      try {
        const compressed = await compressImageFile(f);
        if (vehicleImagesList.length < 10) {
          vehicleImagesList.push(compressed);
        }
      } catch (err) {
        console.warn('Vehicle image skipped:', err);
      }
    }
    if (files.length > remaining) {
      alert(`Only ${remaining} photo(s) added because maximum limit is 10 pictures.`);
    }
    renderVehicleGallery();
    if (vehFileInput) vehFileInput.value = '';
  }

  if (vehUploadZone && vehFileInput) {
    vehUploadZone.addEventListener('click', (e) => {
      if (e.target.closest('.photo-thumb-del') || e.target.closest('#btnVehAddMorePhotos')) return;
      if (vehicleImagesList.length >= 10) {
        alert('Maximum of 10 pictures reached.');
        return;
      }
      vehFileInput.click();
    });

    vehUploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      vehUploadZone.classList.add('dragover');
    });

    vehUploadZone.addEventListener('dragleave', () => {
      vehUploadZone.classList.remove('dragover');
    });

    vehUploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      vehUploadZone.classList.remove('dragover');
      if (e.dataTransfer && e.dataTransfer.files) {
        handleVehicleFilesSelected(e.dataTransfer.files);
      }
    });
  }

  if (vehFileInput) {
    vehFileInput.addEventListener('change', () => {
      if (vehFileInput.files && vehFileInput.files.length > 0) {
        handleVehicleFilesSelected(vehFileInput.files);
      }
    });
  }

  if (btnAddVehUrl) {
    btnAddVehUrl.addEventListener('click', () => {
      const val = (vehImageInput?.value || '').trim();
      if (!val) return;
      if (vehicleImagesList.length >= 10) {
        alert('Maximum of 10 pictures reached.');
        return;
      }
      vehicleImagesList.push(val);
      if (vehImageInput) vehImageInput.value = '';
      renderVehicleGallery();
    });
  }

  function openNewVehicleModal() {
    if (!vehicleEditModal) return;
    vehicleEditForm.reset();
    vehicleImagesList = [];
    renderVehicleGallery();
    document.getElementById('vehFormId').value = '';
    if (vehicleModalHeading) vehicleModalHeading.textContent = 'Post Available Vehicle / Car';
    if (deleteVehBtn) deleteVehBtn.style.display = 'none';
    vehicleEditModal.classList.add('open');
  }

  function openEditVehicleModal(veh) {
    if (!vehicleEditModal) return;
    document.getElementById('vehFormId').value = veh.id;
    document.getElementById('vehFormTitle').value = veh.title || '';
    document.getElementById('vehFormMake').value = veh.make || '';
    document.getElementById('vehFormModel').value = veh.model || '';
    document.getElementById('vehFormYear').value = veh.year || '';
    document.getElementById('vehFormType').value = veh.vehicleType || 'SUV';
    document.getElementById('vehFormCondition').value = veh.condition || 'Foreign Used (Tokunbo)';
    document.getElementById('vehFormTransmission').value = veh.transmission || 'Automatic';
    document.getElementById('vehFormFuel').value = veh.fuelType || 'Petrol';
    document.getElementById('vehFormMileage').value = veh.mileage || '';
    document.getElementById('vehFormSeats').value = veh.seatingCapacity || '';
    document.getElementById('vehFormPrice').value = veh.price || '';
    document.getElementById('vehFormColor').value = veh.color || '';
    document.getElementById('vehFormLocation').value = veh.location || '';
    if (vehImageInput) vehImageInput.value = '';
    document.getElementById('vehFormDesc').value = veh.description || '';
    document.getElementById('vehFormFullSpecs').value = veh.fullSpecifications || '';

    if (Array.isArray(veh.images) && veh.images.length > 0) {
      vehicleImagesList = [...veh.images];
    } else if (veh.imageUrl) {
      vehicleImagesList = [veh.imageUrl];
    } else {
      vehicleImagesList = [];
    }
    renderVehicleGallery();

    if (vehicleModalHeading) vehicleModalHeading.textContent = `Edit Vehicle: ${veh.title}`;
    if (deleteVehBtn) deleteVehBtn.style.display = 'inline-block';
    vehicleEditModal.classList.add('open');
  }

  function closeVehicleModal() {
    if (vehicleEditModal) vehicleEditModal.classList.remove('open');
  }

  async function confirmDeleteVehicle(vehId) {
    if (!confirm('Are you sure you want to delete this vehicle listing? It will be removed from the public website.')) return;
    try {
      const res = await fetch('/api/vehicles/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: vehId })
      });
      const json = await res.json();
      if (json.success) {
        closeVehicleModal();
        await loadVehicles();
      } else {
        alert('Failed to delete vehicle: ' + (json.error || 'Unknown error'));
      }
    } catch (e) {
      alert('Network error while deleting: ' + e.message);
    }
  }

  if (btnOpenNewVehicleModal) {
    btnOpenNewVehicleModal.addEventListener('click', openNewVehicleModal);
  }

  if (closeVehicleModalBtn) {
    closeVehicleModalBtn.addEventListener('click', closeVehicleModal);
  }

  if (deleteVehBtn) {
    deleteVehBtn.addEventListener('click', () => {
      const vehId = document.getElementById('vehFormId').value;
      if (vehId) confirmDeleteVehicle(vehId);
    });
  }

  if (vehicleSearchInput) {
    vehicleSearchInput.addEventListener('input', renderFilteredVehicles);
  }

  if (vehicleTypeFilter) {
    vehicleTypeFilter.addEventListener('change', renderFilteredVehicles);
  }

  if (vehicleConditionFilter) {
    vehicleConditionFilter.addEventListener('change', renderFilteredVehicles);
  }

  if (vehicleEditForm) {
    vehicleEditForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const saveBtn = document.getElementById('saveVehicleSubmitBtn');
      const vehId = document.getElementById('vehFormId').value.trim();
      const title = document.getElementById('vehFormTitle').value.trim();
      const make = document.getElementById('vehFormMake').value.trim();
      const model = document.getElementById('vehFormModel').value.trim();
      const year = document.getElementById('vehFormYear').value.trim();
      const vehicleType = document.getElementById('vehFormType').value;
      const condition = document.getElementById('vehFormCondition').value;
      const transmission = document.getElementById('vehFormTransmission').value;
      const fuelType = document.getElementById('vehFormFuel').value;
      const mileage = document.getElementById('vehFormMileage').value.trim();
      const seatingCapacity = document.getElementById('vehFormSeats').value.trim();
      const price = document.getElementById('vehFormPrice').value.trim();
      const color = document.getElementById('vehFormColor').value.trim();
      const location = document.getElementById('vehFormLocation').value.trim();
      const description = document.getElementById('vehFormDesc').value.trim();
      const fullSpecifications = document.getElementById('vehFormFullSpecs').value.trim();

      if (!title || !make) {
        alert('Please provide at least a vehicle title and brand/make.');
        return;
      }

      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving Vehicle...';
      }

      try {
        const payload = {
          title,
          make,
          model,
          year,
          vehicleType,
          condition,
          transmission,
          fuelType,
          mileage,
          seatingCapacity,
          price,
          color,
          location,
          images: vehicleImagesList,
          imageUrl: vehicleImagesList[0] || '',
          description,
          fullSpecifications
        };

        const endpoint = vehId ? '/api/vehicles/update' : '/api/vehicles';
        if (vehId) payload.id = vehId;

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success) {
          closeVehicleModal();
          await loadVehicles();
        } else {
          alert('Failed to save vehicle: ' + (json.error || 'Server error'));
        }
      } catch (err) {
        alert('Network error: ' + err.message);
      } finally {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent = 'Save & Publish Vehicle';
        }
      }
    });
  }

  // Utility Functions
  function cleanPhoneNumber(phone) {
    if (!phone) return '';
    let cleaned = phone.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('0') && cleaned.length === 11) {
      cleaned = '+234' + cleaned.substring(1);
    } else if (!cleaned.startsWith('+') && cleaned.startsWith('234')) {
      cleaned = '+' + cleaned;
    }
    return cleaned;
  }

  function formatWhatsAppPhone(phone) {
    if (!phone) return '';
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0') && cleaned.length === 11) {
      cleaned = '234' + cleaned.substring(1);
    } else if (!cleaned.startsWith('234') && cleaned.length === 10) {
      cleaned = '234' + cleaned;
    }
    return cleaned;
  }

  function getWhatsAppLink(phone, customerName, service, category) {
    const cleanNum = formatWhatsAppPhone(phone);
    if (!cleanNum) return '#';
    const text = `Hello ${customerName || 'there'}, thank you for contacting ALLFIX Services Xpress regarding your request for ${service || category || 'services'}. We are reaching out from our Abuja dispatch desk to confirm details and dispatch a verified specialist to your location.`;
    return `https://wa.me/${cleanNum}?text=${encodeURIComponent(text)}`;
  }

  function getVendorWhatsAppLink(phone, fullName, businessName, category) {
    const cleanNum = formatWhatsAppPhone(phone);
    if (!cleanNum) return '#';
    const text = `Hello ${fullName || businessName || 'there'}, thank you for registering with ALLFIX Services Xpress as a verified vendor for ${category || 'artisan services'}. Our Abuja onboarding and verification desk is reviewing your profile.`;
    return `https://wa.me/${cleanNum}?text=${encodeURIComponent(text)}`;
  }

  function getMessageWhatsAppLink(phone, name, subject) {
    const cleanNum = formatWhatsAppPhone(phone);
    if (!cleanNum) return '#';
    const text = `Hello ${name || 'there'}, thank you for contacting ALLFIX Services Xpress regarding "${subject || 'your inquiry'}". We are following up from our Abuja customer desk.`;
    return `https://wa.me/${cleanNum}?text=${encodeURIComponent(text)}`;
  }

  function getStatusLabel(status) {
    switch (status) {
      case 'pending_matching': return 'New (Pending Callback)';
      case 'contacted': return 'Customer Contacted';
      case 'in_progress': return 'Vendor Assigned';
      case 'completed': return 'Service Completed';
      case 'cancelled': return 'Cancelled';
      default: return status || 'Pending';
    }
  }

  function getStatusBadgeClass(status) {
    switch (status) {
      case 'pending_matching': return 'badge-green';
      case 'contacted': return 'badge-blue';
      case 'in_progress': return 'badge-yellow';
      case 'completed': return 'badge-gray';
      case 'cancelled': return 'badge-red';
      default: return 'badge-green';
    }
  }

  function formatDate(iso) {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' +
             d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return iso;
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m]);
  }

  // ==============================================================================
  // 7. OWNER ASSET MARKETING SUBMISSIONS (PROPERTIES & CARS)
  // ==============================================================================
  const marketingDetailModal = document.getElementById('marketingDetailModal');
  const closeMarketingModalBtn = document.getElementById('closeMarketingModalBtn');
  const modalMktId = document.getElementById('modalMktId');
  const modalMktAssetBadge = document.getElementById('modalMktAssetBadge');
  const modalMktStatusBadge = document.getElementById('modalMktStatusBadge');
  const modalMktTitle = document.getElementById('modalMktTitle');
  const modalMktMeta = document.getElementById('modalMktMeta');
  const modalMktWhatsAppBtn = document.getElementById('modalMktWhatsAppBtn');
  const modalMktCallBtn = document.getElementById('modalMktCallBtn');
  const modalMktPublishBtn = document.getElementById('modalMktPublishBtn');
  const modalMktDetailsList = document.getElementById('modalMktDetailsList');
  const modalMktGalleryWrap = document.getElementById('modalMktGalleryWrap');
  const modalMktPhotoGrid = document.getElementById('modalMktPhotoGrid');
  const modalMktStatusSelect = document.getElementById('modalMktStatusSelect');
  const modalMktAdminNotes = document.getElementById('modalMktAdminNotes');
  const saveModalMktStatusBtn = document.getElementById('saveModalMktStatusBtn');
  const deleteMktRequestBtn = document.getElementById('deleteMktRequestBtn');
  const modalMktEditBtn = document.getElementById('modalMktEditBtn');
  const modalMktEditForm = document.getElementById('modalMktEditForm');
  const modalMktEditFields = document.getElementById('modalMktEditFields');
  const modalMktCancelEditBtn = document.getElementById('modalMktCancelEditBtn');
  const modalMktSaveEditBtn = document.getElementById('modalMktSaveEditBtn');

  async function loadMarketingRequests() {
    try {
      const res = await fetch('/api/marketing-requests');
      const json = await res.json();
      if (!json.success) return;

      allMarketingRequests = json.data || [];
      const badgeCount = document.getElementById('badgeMarketingCount');
      const pendingCount = allMarketingRequests.filter(m => m.status === 'pending_review' || !m.status).length;
      if (badgeCount) badgeCount.textContent = pendingCount;

      renderFilteredMarketingRequests();
    } catch (err) {
      if (marketingContainer) {
        marketingContainer.innerHTML = `<div style="color: #DC2626; padding: 2rem; background: white; border-radius: 12px; text-align: center;">Failed to load owner submissions: ${escapeHtml(err.message)}</div>`;
      }
    }
  }

  function getMarketingStatusBadgeClass(status) {
    switch (status) {
      case 'pending_review': return 'badge-yellow';
      case 'contacted': return 'badge-blue';
      case 'inspected': return 'badge-green';
      case 'published': return 'badge-green';
      case 'rejected': return 'badge-red';
      default: return 'badge-yellow';
    }
  }

  function formatMarketingStatus(status) {
    switch (status) {
      case 'pending_review': return 'Pending Review';
      case 'contacted': return 'Owner Contacted';
      case 'inspected': return 'Inspected & Verified';
      case 'published': return 'Published Live';
      case 'rejected': return 'Rejected';
      default: return status || 'Pending Review';
    }
  }

  function renderFilteredMarketingRequests() {
    if (!marketingContainer) return;

    const query = (marketingSearchInput ? marketingSearchInput.value : '').toLowerCase().trim();
    const typeFilter = marketingTypeFilter ? marketingTypeFilter.value : 'all';
    const statusFilter = marketingStatusFilter ? marketingStatusFilter.value : 'all';

    let filtered = allMarketingRequests.filter(item => {
      // Type filter
      if (typeFilter !== 'all' && (item.assetType || '').toLowerCase() !== typeFilter) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'all' && (item.status || 'pending_review').toLowerCase() !== statusFilter) {
        return false;
      }
      // Query search
      if (query) {
        const title = item.assetType === 'property' ? `${item.propertyType} ${item.location}` : `${item.carMakeModelYear} ${item.carType}`;
        const searchCorpus = [
          item.id,
          item.ownerName,
          item.phone,
          item.email,
          item.location,
          title,
          item.description,
          item.price
        ].filter(Boolean).join(' ').toLowerCase();

        if (!searchCorpus.includes(query)) return false;
      }
      return true;
    });

    if (marketingResultsCount) {
      marketingResultsCount.textContent = `Showing ${filtered.length} of ${allMarketingRequests.length} submissions`;
    }

    if (filtered.length === 0) {
      marketingContainer.innerHTML = `
        <div style="background: white; border: 1px solid #E2E7E3; border-radius: 12px; padding: 3rem; text-align: center; color: #68756B;">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;"></div>
          <p style="margin: 0; font-size: 0.95rem; font-weight: 600;">No owner asset submissions found matching your filters.</p>
        </div>
      `;
      return;
    }

    marketingContainer.innerHTML = filtered.map(item => {
      const isCar = item.assetType === 'car';
      const title = isCar ? (item.carMakeModelYear || 'Automobile') : `${item.propertyType || 'Property'} (${item.listingPurpose || 'For Sale'})`;
      const statusClass = getMarketingStatusBadgeClass(item.status);
      const statusText = formatMarketingStatus(item.status);
      const thumbImg = (item.images && item.images.length > 0) ? item.images[0] : '';
      const photoCount = (item.images && item.images.length) || 0;
      const cleanPhone = (item.phone || '').replace(/\s+/g, '');
      const waMsg = encodeURIComponent(`Hello ${item.ownerName}, this is ALLFIX Dispatch. We received your request to market your ${title} in ${item.location} (Ref: ${item.id}). We would like to schedule physical verification.`);

      // Technical Badges
      let techBadges = '';
      if (isCar) {
        const dutyBadge = item.customDutyPaid === 'Yes'
          ? '<span class="badge badge-green" style="font-size: 0.72rem;"> Duty Paid</span>'
          : '<span class="badge badge-red" style="font-size: 0.72rem;"> Incomplete Duty</span>';
        const condBadge = item.carCondition === 'Brand New'
          ? '<span class="badge badge-green" style="font-size: 0.72rem;"> Brand New</span>'
          : `<span class="badge badge-blue" style="font-size: 0.72rem;">${escapeHtml(item.carCondition || 'Fairly Used')}</span>`;
        const accidentBadge = item.accidentHistory === 'Accident Free'
          ? '<span class="badge badge-green" style="font-size: 0.72rem;"> Accident Free</span>'
          : '<span class="badge badge-yellow" style="font-size: 0.72rem;"> Accidented</span>';
        const engineBadge = item.engineGearStatus === 'Untempered engine and gear'
          ? '<span class="badge badge-green" style="font-size: 0.72rem;"> Untempered</span>'
          : '<span class="badge badge-yellow" style="font-size: 0.72rem;"> Tempered Engine</span>';
        const firstBodyBadge = item.firstBody === 'Yes'
          ? '<span class="badge badge-green" style="font-size: 0.72rem;"> First Body</span>'
          : '<span class="badge badge-gray" style="font-size: 0.72rem;"> Resprayed</span>';

        techBadges = `${dutyBadge} ${condBadge} ${accidentBadge} ${engineBadge} ${firstBodyBadge}`;
      } else {
        const purposeBadge = `<span class="badge badge-blue" style="font-size: 0.72rem;"> ${escapeHtml(item.listingPurpose || 'For Sale')}</span>`;
        const titleBadge = item.titleDocument
          ? `<span class="badge badge-green" style="font-size: 0.72rem;"> ${escapeHtml(item.titleDocument)}</span>`
          : '';
        const sizeBadge = item.landSize
          ? `<span class="badge badge-gray" style="font-size: 0.72rem;"> ${escapeHtml(item.landSize)}</span>`
          : '';
        techBadges = `${purposeBadge} ${titleBadge} ${sizeBadge}`;
      }

      return `
        <div class="request-card" style="border-left: 5px solid ${isCar ? '#2563EB' : '#16883D'};">
          <div class="card-top-row">
            <div class="req-meta">
              <span class="req-id-badge" style="color: ${isCar ? '#1D4ED8' : '#166534'}; background: ${isCar ? '#EFF6FF' : '#F0FDF4'};">${escapeHtml(item.id)}</span>
              <span class="badge" style="background: ${isCar ? '#DBEAFE' : '#DCFCE7'}; color: ${isCar ? '#1E40AF' : '#166534'}; font-weight: 700;">${isCar ? ' Automobile' : ' Property'}</span>
              <span class="badge ${statusClass}">${escapeHtml(statusText)}</span>
              <span class="req-time">${formatDate(item.createdAt)}</span>
              ${photoCount > 0 ? `<span style="font-size: 0.75rem; background: #F2F4F2; color: #3E4D42; padding: 0.2rem 0.5rem; border-radius: 6px; font-weight: 600;"> ${photoCount} Photos</span>` : ''}
            </div>
            <div>
              <strong style="color: ${isCar ? '#1D4ED8' : '#16883D'}; font-size: 1.1rem;">${item.price ? escapeHtml(item.price) : 'Price on Request'}</strong>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: ${thumbImg ? '90px 1.4fr 1.6fr 1fr' : '1.4fr 1.6fr 1fr'}; gap: 1rem; align-items: center;" class="card-main-grid">
            ${thumbImg ? `
              <div style="width: 84px; height: 68px; border-radius: 8px; overflow: hidden; background: #0C100D; flex-shrink: 0;">
                <img src="${thumbImg}" alt="Asset thumbnail" style="width: 100%; height: 100%; object-fit: cover;">
              </div>
            ` : ''}

            <div class="cust-info">
              <strong>${escapeHtml(item.ownerName)}</strong>
              <div class="cust-contact-line">
                <span> ${escapeHtml(item.phone)}</span>
              </div>
              <div class="cust-location">
                <span> ${escapeHtml(item.location)}</span>
              </div>
            </div>

            <div>
              <div style="font-weight: 700; color: #151B17; font-size: 0.95rem; margin-bottom: 0.35rem;">
                ${escapeHtml(title)}
              </div>
              <div style="display: flex; gap: 0.35rem; flex-wrap: wrap; margin-bottom: 0.45rem;">
                ${techBadges}
              </div>
              <div style="font-size: 0.82rem; color: #56645A; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                ${escapeHtml(item.description || 'No additional remarks provided.')}
              </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-end;">
              <button type="button" class="btn btn-outline btn-sm" onclick="openMarketingModal('${item.id}')" style="width: 100%; justify-content: center; font-size: 0.82rem;">
                 Inspect Details
              </button>
              <div style="display: flex; gap: 0.4rem; width: 100%;">
                <a href="https://wa.me/${cleanPhone.replace('+', '')}?text=${waMsg}" target="_blank" rel="noopener" class="btn-contact-whatsapp" style="flex: 1; text-align: center; font-size: 0.78rem; padding: 0.45rem 0.3rem;">
                  WhatsApp
                </a>
                <a href="tel:${cleanPhone}" class="btn-contact-call" style="flex: 1; text-align: center; font-size: 0.78rem; padding: 0.45rem 0.3rem;">
                  Call
                </a>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  window.openMarketingModal = function(id) {
    const item = allMarketingRequests.find(m => m.id === id);
    if (!item) return;

    currentModalMarketingId = id;
    const isCar = item.assetType === 'car';
    if (modalMktEditForm) modalMktEditForm.hidden = true;
    if (modalMktDetailsList) modalMktDetailsList.hidden = false;
    if (modalMktEditBtn) modalMktEditBtn.hidden = false;

    modalMktId.textContent = item.id;
    modalMktAssetBadge.textContent = isCar ? ' Automobile' : ' Property';
    modalMktAssetBadge.className = isCar ? 'badge badge-blue' : 'badge badge-green';
    modalMktStatusBadge.textContent = formatMarketingStatus(item.status);
    modalMktStatusBadge.className = `badge ${getMarketingStatusBadgeClass(item.status)}`;

    const title = isCar ? item.carMakeModelYear : `${item.propertyType} (${item.listingPurpose})`;
    modalMktTitle.textContent = title;
    modalMktMeta.textContent = `Owner: ${item.ownerName} • Location: ${item.location} • Submitted: ${formatDate(item.createdAt)}`;

    const cleanPhone = (item.phone || '').replace(/\s+/g, '');
    const waText = encodeURIComponent(`Hello ${item.ownerName}, this is ALLFIX Dispatch. We are reviewing your submission for ${title} (Ref: ${item.id}). When can our inspector visit?`);
    modalMktWhatsAppBtn.href = `https://wa.me/${cleanPhone.replace('+', '')}?text=${waText}`;
    modalMktCallBtn.href = `tel:${cleanPhone}`;

    modalMktStatusSelect.value = item.status || 'pending_review';
    modalMktAdminNotes.value = item.adminNotes || '';

    // Build dl list
    let dlHtml = `
      <dt>Owner Name:</dt>
      <dd><strong>${escapeHtml(item.ownerName)}</strong></dd>

      <dt>Phone (WhatsApp):</dt>
      <dd><a href="tel:${cleanPhone}" style="color: #16883D; font-weight: 600;">${escapeHtml(item.phone)}</a></dd>

      <dt>Email Address:</dt>
      <dd>${escapeHtml(item.email || 'Not specified')}</dd>

      <dt>Physical Location:</dt>
      <dd>${escapeHtml(item.location)}</dd>

      <dt>Target Price / Rent:</dt>
      <dd><strong style="color: #16883D; font-size: 1.05rem;">${escapeHtml(item.price || 'Price on Request')}</strong></dd>
    `;

    if (isCar) {
      dlHtml += `
        <dt>Car Year & Model:</dt>
        <dd><strong>${escapeHtml(item.carMakeModelYear || '-')}</strong></dd>

        <dt>Body Type & Colour:</dt>
        <dd>${escapeHtml(item.carType || '-')} &bull; ${escapeHtml(item.carColour || '-')}</dd>

        <dt>Customs Duty Status:</dt>
        <dd><span class="badge ${item.customDutyPaid === 'Yes' ? 'badge-green' : 'badge-red'}">${item.customDutyPaid === 'Yes' ? ' Duty Fully Paid' : ' Incomplete Duty'}</span></dd>

        <dt>Usage Status:</dt>
        <dd><span class="badge badge-blue">${escapeHtml(item.carCondition || 'Fairly Used')}</span></dd>

        <dt>Accident History:</dt>
        <dd><span class="badge ${item.accidentHistory === 'Accident Free' ? 'badge-green' : 'badge-yellow'}">${escapeHtml(item.accidentHistory || 'Accident Free')}</span></dd>

        <dt>Engine & Gear Status:</dt>
        <dd><span class="badge ${item.engineGearStatus === 'Untempered engine and gear' ? 'badge-green' : 'badge-yellow'}">${escapeHtml(item.engineGearStatus || 'Untempered')}</span></dd>

        <dt>First Body Paint:</dt>
        <dd><span class="badge ${item.firstBody === 'Yes' ? 'badge-green' : 'badge-gray'}">${item.firstBody === 'Yes' ? ' First Body (Original Paint)' : ' Resprayed / Baked'}</span></dd>
      `;
    } else {
      dlHtml += `
        <dt>Property Type:</dt>
        <dd><strong>${escapeHtml(item.propertyType || '-')}</strong></dd>

        <dt>Listing Purpose:</dt>
        <dd><span class="badge badge-blue"> ${escapeHtml(item.listingPurpose || 'For Sale')}</span></dd>

        <dt>Title Document:</dt>
        <dd><span class="badge badge-green"> ${escapeHtml(item.titleDocument || 'Title Pending')}</span></dd>

        <dt>Land Size / Dimensions:</dt>
        <dd>${escapeHtml(item.landSize || '-')}</dd>
      `;
    }

    dlHtml += `
      <dt>Asset Description:</dt>
      <dd style="background: #F8FAF8; padding: 0.75rem; border-radius: 8px; border: 1px solid #E2E7E3;">${escapeHtml(item.description || 'No description provided.')}</dd>

      <dt>Terms Audit ID:</dt>
      <dd><span style="font-family: monospace; color: #166534;">${escapeHtml(item.agreementId || 'AGR-M-LOGGED')}</span> (Owner Marketing Terms v1.0 Accepted)</dd>
    `;

    modalMktDetailsList.innerHTML = dlHtml;

    // Photos Gallery
    if (item.images && item.images.length > 0) {
      modalMktGalleryWrap.style.display = 'block';
      modalMktPhotoGrid.innerHTML = item.images.map((imgUrl, i) => `
        <a href="${imgUrl}" target="_blank" rel="noopener" style="display: block; aspect-ratio: 4/3; border-radius: 8px; overflow: hidden; border: 1px solid #CDD3CE; background: #0C100D;">
          <img src="${imgUrl}" alt="Photo ${i + 1}" style="width: 100%; height: 100%; object-fit: cover;">
        </a>
      `).join('');
    } else {
      modalMktGalleryWrap.style.display = 'none';
      modalMktPhotoGrid.innerHTML = '';
    }

    // Publish button state
    if (item.status === 'published') {
      modalMktPublishBtn.textContent = ' Already Published Live';
      modalMktPublishBtn.disabled = true;
      modalMktPublishBtn.style.opacity = '0.7';
    } else {
      modalMktPublishBtn.textContent = ' Publish Live to Marketplace';
      modalMktPublishBtn.disabled = false;
      modalMktPublishBtn.style.opacity = '1';
    }

    marketingDetailModal.classList.add('open');
  };

  function renderMarketingEditFields(item) {
    const fields = [
      ['ownerName', 'Owner name', item.ownerName, 'text'],
      ['phone', 'Phone', item.phone, 'tel'],
      ['email', 'Email', item.email, 'email'],
      ['location', 'Location', item.location, 'text'],
      ['price', 'Price', item.price, 'text'],
      ...(item.assetType === 'car'
        ? [
            ['carMakeModelYear', 'Year, make and model', item.carMakeModelYear, 'text'],
            ['carType', 'Body type', item.carType, 'text'],
            ['carColour', 'Colour', item.carColour, 'text'],
            ['carCondition', 'Condition', item.carCondition, 'text'],
            ['customDutyPaid', 'Customs duty status', item.customDutyPaid, 'text'],
            ['accidentHistory', 'Accident history', item.accidentHistory, 'text'],
            ['engineGearStatus', 'Engine and gear status', item.engineGearStatus, 'text'],
            ['firstBody', 'First body', item.firstBody, 'text']
          ]
        : [
            ['propertyType', 'Property type', item.propertyType, 'text'],
            ['listingPurpose', 'Listing purpose', item.listingPurpose, 'text'],
            ['titleDocument', 'Title document', item.titleDocument, 'text'],
            ['landSize', 'Land size', item.landSize, 'text']
          ]),
      ['description', 'Description', item.description, 'textarea']
    ];

    modalMktEditFields.innerHTML = fields.map(([key, label, value, type]) => {
      const control = type === 'textarea'
        ? `<textarea class="form-control" rows="4" data-mkt-field="${key}" aria-label="${label}">${escapeHtml(value || '')}</textarea>`
        : `<input class="form-control" type="${type}" data-mkt-field="${key}" aria-label="${label}" value="${escapeHtml(value || '')}">`;
      return `<label class="form-group" style="display:block; margin:0; font-size:0.82rem; color:#3E4D42;">${label}${control}</label>`;
    }).join('');
  }

  if (modalMktEditBtn) {
    modalMktEditBtn.addEventListener('click', () => {
      const item = allMarketingRequests.find(entry => entry.id === currentModalMarketingId);
      if (!item) return;
      renderMarketingEditFields(item);
      modalMktDetailsList.hidden = true;
      modalMktEditForm.hidden = false;
      modalMktEditBtn.hidden = true;
    });
  }

  if (modalMktCancelEditBtn) {
    modalMktCancelEditBtn.addEventListener('click', () => {
      modalMktEditForm.hidden = true;
      modalMktDetailsList.hidden = false;
      modalMktEditBtn.hidden = false;
    });
  }

  if (modalMktEditForm) {
    modalMktEditForm.addEventListener('submit', async event => {
      event.preventDefault();
      if (!currentModalMarketingId) return;
      const itemId = currentModalMarketingId;
      const updates = {};
      modalMktEditFields.querySelectorAll('[data-mkt-field]').forEach(field => {
        updates[field.dataset.mktField] = field.value.trim();
      });
      if (!updates.ownerName || !updates.phone || !updates.location) {
        alert('Owner name, phone, and location are required.');
        return;
      }

      modalMktSaveEditBtn.disabled = true;
      modalMktSaveEditBtn.textContent = 'Saving...';
      try {
        const response = await fetch('/api/marketing-requests/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: itemId, ...updates })
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Could not update post.');
        await loadMarketingRequests();
        window.openMarketingModal(itemId);
        showAdminToast(`Updated post <strong>${escapeHtml(itemId)}</strong>`);
      } catch (error) {
        alert(`Could not update post: ${error.message}`);
      } finally {
        modalMktSaveEditBtn.disabled = false;
        modalMktSaveEditBtn.textContent = 'Save post';
      }
    });
  }

  // Close marketing modal
  if (closeMarketingModalBtn) {
    closeMarketingModalBtn.addEventListener('click', () => {
      marketingDetailModal.classList.remove('open');
      currentModalMarketingId = null;
    });
  }

  // Save status & admin notes
  if (saveModalMktStatusBtn) {
    saveModalMktStatusBtn.addEventListener('click', async () => {
      if (!currentModalMarketingId) return;
      saveModalMktStatusBtn.textContent = 'Saving...';
      saveModalMktStatusBtn.disabled = true;

      try {
        const newStatus = modalMktStatusSelect.value;
        const newNotes = modalMktAdminNotes.value.trim();

        const res = await fetch('/api/marketing-requests/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: currentModalMarketingId,
            status: newStatus,
            adminNotes: newNotes
          })
        });

        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Failed to update');

        showAdminToast(`Updated submission <strong>${currentModalMarketingId}</strong> to <strong>${formatMarketingStatus(newStatus)}</strong>`);
        await loadMarketingRequests();
        await loadStats();

        // Refresh modal
        window.openMarketingModal(currentModalMarketingId);
      } catch (err) {
        alert('Error: ' + err.message);
      } finally {
        saveModalMktStatusBtn.textContent = 'Save Status & Notes';
        saveModalMktStatusBtn.disabled = false;
      }
    });
  }

  // Publish Live button
  if (modalMktPublishBtn) {
    modalMktPublishBtn.addEventListener('click', async () => {
      if (!currentModalMarketingId) return;
      const confirmPub = confirm('Publish this asset live to the public marketplace? It will appear immediately on the website.');
      if (!confirmPub) return;

      modalMktPublishBtn.textContent = 'Publishing Live...';
      modalMktPublishBtn.disabled = true;

      try {
        const res = await fetch('/api/marketing-requests/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: currentModalMarketingId })
        });

        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Failed to publish');

        showAdminToast(` Asset published live! Reference: <strong>${json.publishedId}</strong>`);
        await loadMarketingRequests();
        await loadStats();
        if (json.assetType === 'property') {
          await loadProperties();
        } else {
          await loadVehicles();
        }

        window.openMarketingModal(currentModalMarketingId);
      } catch (err) {
        alert('Publishing error: ' + err.message);
        modalMktPublishBtn.textContent = ' Publish Live to Marketplace';
        modalMktPublishBtn.disabled = false;
      }
    });
  }

  // Delete marketing submission
  if (deleteMktRequestBtn) {
    deleteMktRequestBtn.addEventListener('click', async () => {
      if (!currentModalMarketingId) return;
      const confirmDel = confirm(`Permanently delete post ${currentModalMarketingId}? If it is published, its live property or car listing will also be removed.`);
      if (!confirmDel) return;

      try {
        const res = await fetch('/api/marketing-requests/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: currentModalMarketingId })
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Failed to delete');

        showAdminToast(`Deleted submission ${currentModalMarketingId}`);
        marketingDetailModal.classList.remove('open');
        currentModalMarketingId = null;
        await loadMarketingRequests();
        await loadStats();
      } catch (err) {
        alert('Delete error: ' + err.message);
      }
    });
  }

  // Search & Filter Listeners for Marketing Tab
  if (marketingSearchInput) {
    marketingSearchInput.addEventListener('input', renderFilteredMarketingRequests);
  }
  if (marketingTypeFilter) {
    marketingTypeFilter.addEventListener('change', renderFilteredMarketingRequests);
  }
  if (marketingStatusFilter) {
    marketingStatusFilter.addEventListener('change', renderFilteredMarketingRequests);
  }

  // Also close modal when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === marketingDetailModal) {
      marketingDetailModal.classList.remove('open');
      currentModalMarketingId = null;
    }
    if (e.target === workEditModal) {
      workEditModal.classList.remove('open');
      currentModalWorkId = null;
    }
  });

  // ==============================================================================
  // VENDOR HANDIWORK SHOWCASE MANAGEMENT (TAB 2)
  // ==============================================================================
  let workImagesList = [];
  const worksTable = document.getElementById('worksTableBody');
  const workSearchInput = document.getElementById('workSearchInput');
  const workJobTypeFilter = document.getElementById('workJobTypeFilter');
  const workStatusFilter = document.getElementById('workStatusFilter');
  const btnOpenNewWorkModal = document.getElementById('btnOpenNewWorkModal');
  const workEditModal = document.getElementById('workEditModal');
  const closeWorkModalBtn = document.getElementById('closeWorkModalBtn');
  const workEditForm = document.getElementById('workEditForm');
  const saveWorkSubmitBtn = document.getElementById('saveWorkSubmitBtn');
  const deleteWorkBtn = document.getElementById('deleteWorkBtn');

  // Work Image Upload Elements
  const workFileInput = document.getElementById('workFormFileInput');
  const workUploadZone = document.getElementById('workImageUploadZone');
  const workUploadPrompt = document.getElementById('workImageUploadPrompt');
  const workGalleryGrid = document.getElementById('workGalleryGrid');
  const workPhotoCountBadge = document.getElementById('workPhotoCountBadge');
  const btnSelectWorkPictures = document.getElementById('btnSelectWorkPictures');
  const workImageInput = document.getElementById('workFormImage');
  const btnAddWorkUrl = document.getElementById('btnAddWorkUrlBtn');

  async function loadVendorWorks() {
    try {
      const res = await fetch('/api/vendor-works');
      const json = await res.json();
      if (!json.success) return;

      allWorks = json.data || [];
      const badgeCount = document.getElementById('badgeWorksCount');
      if (badgeCount) badgeCount.textContent = allWorks.length;
      const statWorks = document.getElementById('statVendorWorks');
      if (statWorks) statWorks.textContent = allWorks.length;

      renderWorksTable();
    } catch (err) {
      if (worksTable) {
        worksTable.innerHTML = `<tr><td colspan="8" style="text-align:center; color:#DC2626; padding:2rem;">Failed to load vendor handiwork: ${escapeHtml(err.message)}</td></tr>`;
      }
    }
  }

  function renderWorksTable() {
    if (!worksTable) return;

    const searchTerm = (workSearchInput?.value || '').toLowerCase().trim();
    const typeVal = workJobTypeFilter?.value || 'all';
    const statusVal = workStatusFilter?.value || 'all';

    const filtered = allWorks.filter(w => {
      const matchesSearch = !searchTerm ||
        (w.title && w.title.toLowerCase().includes(searchTerm)) ||
        (w.jobType && w.jobType.toLowerCase().includes(searchTerm)) ||
        (w.vendorName && w.vendorName.toLowerCase().includes(searchTerm)) ||
        (w.location && w.location.toLowerCase().includes(searchTerm)) ||
        (w.description && w.description.toLowerCase().includes(searchTerm)) ||
        (w.id && w.id.toLowerCase().includes(searchTerm));

      const matchesType = typeVal === 'all' || w.jobType === typeVal;
      const matchesStatus = statusVal === 'all' || (w.status || 'active') === statusVal;

      return matchesSearch && matchesType && matchesStatus;
    });

    if (filtered.length === 0) {
      worksTable.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 3rem 1.5rem; color: #68756B;">
            <div style="font-weight: 700; font-size: 1.05rem; color: #151B17; margin-bottom: 0.35rem;">No Handiwork Matches Found</div>
            <p style="font-size: 0.88rem; margin: 0;">Try adjusting your search terms or trade filters, or post a new job using the green button above.</p>
          </td>
        </tr>
      `;
      return;
    }

    worksTable.innerHTML = filtered.map(w => {
      const photos = Array.isArray(w.photos) && w.photos.length > 0 ? w.photos : (w.image ? [w.image] : ['/favicon.png']);
      const coverPhoto = photos[0];
      const photoCount = photos.length;
      const status = w.status || 'active';
      const statusBadge = status === 'active'
        ? `<span class="badge badge-green" style="font-size: 0.74rem;">Active / Live</span>`
        : `<span class="badge" style="background:#FEF3C7; color:#B45309; font-size: 0.74rem;">Draft</span>`;

      const tradeColors = {
        'Plumbing': { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
        'Carpentry': { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' },
        'Electrical': { bg: '#FEF9C3', text: '#A16207', border: '#FEF08A' },
        'Auto Mechanic': { bg: '#FEE2E2', text: '#B91C1C', border: '#FECACA' },
        'Interior Decor': { bg: '#F3E8FF', text: '#7E22CE', border: '#E9D5FF' },
        'Painting & Tiling': { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' },
        'AC & Appliances': { bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD' }
      };
      const tc = tradeColors[w.jobType] || { bg: '#F3F4F6', text: '#374151', border: '#E5E7EB' };

      return `
        <tr>
          <td>
            <div style="position: relative; width: 62px; height: 48px; border-radius: 8px; overflow: hidden; background: #0C100D; border: 1px solid #E2E7E3;">
              <img src="${coverPhoto}" alt="${escapeHtml(w.title)}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='/favicon.png'">
              <span style="position: absolute; bottom: 2px; right: 2px; background: rgba(0,0,0,0.75); color: white; font-size: 0.65rem; font-weight: 700; padding: 1px 4px; border-radius: 4px;">
                 ${photoCount}
              </span>
            </div>
          </td>
          <td>
            <div style="font-weight: 700; color: #151B17; font-size: 0.92rem; margin-bottom: 0.2rem;">
              ${escapeHtml(w.title)}
              ${w.featured ? `<span style="margin-left: 0.35rem; background: #FEF3C7; color: #B45309; padding: 2px 6px; border-radius: 4px; font-size: 0.68rem; font-weight: 800;"> Featured</span>` : ''}
            </div>
            <span class="req-id-badge" style="font-size: 0.72rem; padding: 0.15rem 0.45rem;">${escapeHtml(w.id)}</span>
          </td>
          <td>
            <span style="display: inline-block; background: ${tc.bg}; color: ${tc.text}; border: 1px solid ${tc.border}; font-size: 0.75rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 6px; white-space: nowrap;">
              ${escapeHtml(w.jobType || 'Artisan Work')}
            </span>
          </td>
          <td>
            <div style="font-size: 0.88rem; font-weight: 600; color: #151B17;">${escapeHtml(w.vendorName || 'ALLFIX Verified Artisan')}</div>
            ${w.vendorPhone ? `<a href="https://wa.me/234${w.vendorPhone.replace(/\D/g,'').replace(/^0/,'')}?text=Hello%20${encodeURIComponent(w.vendorName || 'Artisan')}%2C%20regarding%20job%20${encodeURIComponent(w.id)}" target="_blank" style="font-size: 0.78rem; color: #16883D; text-decoration: underline;"> WhatsApp</a>` : ''}
          </td>
          <td>
            <span style="font-size: 0.86rem; color: #4B5563;">${escapeHtml(w.location || 'Abuja')}</span>
          </td>
          <td>
            <span style="font-size: 0.84rem; font-weight: 700; color: #16883D;">${photoCount} photo${photoCount === 1 ? '' : 's'}</span>
          </td>
          <td>
            ${statusBadge}
          </td>
          <td>
            <div style="display: flex; gap: 0.45rem; align-items: center;">
              <button class="btn btn-outline btn-sm btn-edit-work" data-id="${w.id}" style="padding: 0.35rem 0.65rem; font-size: 0.78rem;">
                Edit
              </button>
              <a href="/gallery#work-${w.id}" target="_blank" rel="noopener" class="btn btn-outline btn-sm" style="padding: 0.35rem 0.65rem; font-size: 0.78rem; background: #F1F8F2; border-color: #B8D9C0; color: #166534;" title="View on Public Gallery">
                View
              </a>
              <button class="btn btn-outline btn-sm btn-delete-work" data-id="${w.id}" style="padding: 0.35rem 0.55rem; font-size: 0.78rem; color: #DC2626; border-color: #FECACA; display: inline-flex; align-items: center; justify-content: center;" title="Delete Handiwork">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Attach row button events
    worksTable.querySelectorAll('.btn-edit-work').forEach(btn => {
      btn.addEventListener('click', () => {
        const workId = btn.getAttribute('data-id');
        const found = allWorks.find(w => w.id === workId);
        if (found) openEditWorkModal(found);
      });
    });

    worksTable.querySelectorAll('.btn-delete-work').forEach(btn => {
      btn.addEventListener('click', () => {
        const workId = btn.getAttribute('data-id');
        confirmDeleteWork(workId);
      });
    });
  }

  // Work Gallery Photos Rendering
  function renderWorkGallery() {
    if (workPhotoCountBadge) {
      workPhotoCountBadge.textContent = `${workImagesList.length} / 10 photos selected`;
    }
    if (!workGalleryGrid || !workUploadPrompt) return;

    if (workImagesList.length === 0) {
      workGalleryGrid.style.display = 'none';
      workGalleryGrid.innerHTML = '';
      workUploadPrompt.style.display = 'block';
      return;
    }

    workUploadPrompt.style.display = 'none';
    workGalleryGrid.style.display = 'grid';

    let html = workImagesList.map((src, index) => {
      const isCover = index === 0;
      return `
        <div class="photo-thumb-card ${isCover ? 'is-cover' : ''}" style="${isCover ? 'border-color: #16883D; box-shadow: 0 0 0 2px rgba(22, 136, 61, 0.25);' : ''}">
          <img src="${src}" alt="Work Photo ${index + 1}">
          <span class="photo-thumb-badge" style="${isCover ? 'background: #16883D; color: white;' : ''}">${isCover ? ' Cover' : `#${index + 1}`}</span>
          <button type="button" class="photo-thumb-del" data-index="${index}" title="Remove photo">&times;</button>
        </div>
      `;
    }).join('');

    if (workImagesList.length < 10) {
      html += `
        <div class="photo-add-more-card" id="btnWorkAddMorePhotos" style="color: #16883D; border-color: #86EFAC;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          <span>Add More</span>
        </div>
      `;
    }

    workGalleryGrid.innerHTML = html;

    workGalleryGrid.querySelectorAll('.photo-thumb-del').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        workImagesList.splice(idx, 1);
        renderWorkGallery();
      });
    });

    const addMoreBtn = document.getElementById('btnWorkAddMorePhotos');
    if (addMoreBtn) {
      addMoreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (workFileInput) workFileInput.click();
      });
    }
  }

  // Work Pictures File Selection & Compression
  if (btnSelectWorkPictures) {
    btnSelectWorkPictures.addEventListener('click', (e) => {
      e.stopPropagation();
      if (workFileInput) workFileInput.click();
    });
  }

  if (workUploadZone) {
    workUploadZone.addEventListener('click', () => {
      if (workFileInput) workFileInput.click();
    });

    workUploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      workUploadZone.classList.add('dragover');
    });

    workUploadZone.addEventListener('dragleave', () => {
      workUploadZone.classList.remove('dragover');
    });

    workUploadZone.addEventListener('drop', async (e) => {
      e.preventDefault();
      workUploadZone.classList.remove('dragover');
      const files = Array.from(e.dataTransfer?.files || []).filter(f => f.type.startsWith('image/'));
      if (files.length === 0) return;
      await processWorkFiles(files);
    });
  }

  if (workFileInput) {
    workFileInput.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'));
      if (files.length === 0) return;
      await processWorkFiles(files);
      workFileInput.value = '';
    });
  }

  async function processWorkFiles(files) {
    const slotsLeft = 10 - workImagesList.length;
    if (slotsLeft <= 0) {
      alert('Maximum of 10 pictures allowed per vendor work showcase.');
      return;
    }
    const toProcess = files.slice(0, slotsLeft);
    if (workPhotoCountBadge) workPhotoCountBadge.textContent = 'Compressing pictures...';

    for (const f of toProcess) {
      try {
        const compressedBase64 = await compressImageFile(f, 1280, 0.82);
        workImagesList.push(compressedBase64);
      } catch (err) {
        console.warn('Could not compress image file:', err);
      }
    }
    renderWorkGallery();
  }

  if (btnAddWorkUrl && workImageInput) {
    btnAddWorkUrl.addEventListener('click', (e) => {
      e.preventDefault();
      const url = (workImageInput.value || '').trim();
      if (!url) return;
      if (workImagesList.length >= 10) {
        alert('Maximum of 10 pictures reached.');
        return;
      }
      workImagesList.push(url);
      workImageInput.value = '';
      renderWorkGallery();
    });
  }

  // Open Modal: New Work
  function openNewWorkModal() {
    currentModalWorkId = null;
    if (workEditForm) workEditForm.reset();
    const idField = document.getElementById('workFormId');
    if (idField) idField.value = '';
    const heading = document.getElementById('workModalHeading');
    if (heading) heading.textContent = 'Post Vendor Handiwork';
    if (saveWorkSubmitBtn) saveWorkSubmitBtn.textContent = 'Save & Publish Handiwork';
    if (deleteWorkBtn) deleteWorkBtn.style.display = 'none';

    workImagesList = [];
    renderWorkGallery();
    if (workEditModal) workEditModal.classList.add('open');
  }

  // Open Modal: Edit Work
  function openEditWorkModal(work) {
    currentModalWorkId = work.id;
    const idField = document.getElementById('workFormId');
    const jobTypeField = document.getElementById('workFormJobType');
    const titleField = document.getElementById('workFormTitle');
    const vendorNameField = document.getElementById('workFormVendorName');
    const vendorPhoneField = document.getElementById('workFormVendorPhone');
    const locationField = document.getElementById('workFormLocation');
    const descField = document.getElementById('workFormDesc');
    const statusField = document.getElementById('workFormStatus');
    const featuredField = document.getElementById('workFormFeatured');
    const heading = document.getElementById('workModalHeading');

    if (idField) idField.value = work.id;
    if (jobTypeField) jobTypeField.value = work.jobType || '';
    if (titleField) titleField.value = work.title || '';
    if (vendorNameField) vendorNameField.value = work.vendorName || '';
    if (vendorPhoneField) vendorPhoneField.value = work.vendorPhone || '';
    if (locationField) locationField.value = work.location || '';
    if (descField) descField.value = work.description || '';
    if (statusField) statusField.value = work.status || 'active';
    if (featuredField) featuredField.checked = !!work.featured;

    if (heading) heading.textContent = `Edit Handiwork (${work.id})`;
    if (saveWorkSubmitBtn) saveWorkSubmitBtn.textContent = 'Update Handiwork';
    if (deleteWorkBtn) deleteWorkBtn.style.display = 'inline-block';

    workImagesList = Array.isArray(work.photos) && work.photos.length > 0
      ? [...work.photos]
      : (work.image ? [work.image] : []);
    renderWorkGallery();

    if (workEditModal) workEditModal.classList.add('open');
  }

  if (btnOpenNewWorkModal) {
    btnOpenNewWorkModal.addEventListener('click', openNewWorkModal);
  }

  if (closeWorkModalBtn) {
    closeWorkModalBtn.addEventListener('click', () => {
      if (workEditModal) workEditModal.classList.remove('open');
      currentModalWorkId = null;
    });
  }

  // Submit Work Edit / Create Form
  if (workEditForm) {
    workEditForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const id = (document.getElementById('workFormId')?.value || '').trim();
      const jobType = (document.getElementById('workFormJobType')?.value || '').trim();
      const title = (document.getElementById('workFormTitle')?.value || '').trim();
      const vendorName = (document.getElementById('workFormVendorName')?.value || '').trim();
      const vendorPhone = (document.getElementById('workFormVendorPhone')?.value || '').trim();
      const location = (document.getElementById('workFormLocation')?.value || '').trim();
      const description = (document.getElementById('workFormDesc')?.value || '').trim();
      const status = document.getElementById('workFormStatus')?.value || 'active';
      const featured = !!document.getElementById('workFormFeatured')?.checked;

      if (!jobType) {
        alert('Please select the Type of Job / Trade (e.g. Plumbing, Carpentry, etc.).');
        return;
      }
      if (!title || !description || !location) {
        alert('Please fill in Job Title, Location, and Job Description.');
        return;
      }
      if (workImagesList.length === 0) {
        alert('Please add at least 1 picture of the completed work.');
        return;
      }

      if (saveWorkSubmitBtn) {
        saveWorkSubmitBtn.disabled = true;
        saveWorkSubmitBtn.textContent = 'Saving Handiwork...';
      }

      const payload = {
        id: id || undefined,
        jobType,
        title,
        vendorName: vendorName || 'ALLFIX Verified Artisan',
        vendorPhone,
        location,
        description,
        photos: workImagesList,
        image: workImagesList[0],
        status,
        featured
      };

      const isUpdate = !!id;
      const url = isUpdate ? '/api/vendor-works/update' : '/api/vendor-works';

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Failed to save handiwork');

        showAdminToast(`Vendor handiwork <strong>${escapeHtml(title)}</strong> ${isUpdate ? 'updated' : 'published'} successfully!`);
        if (workEditModal) workEditModal.classList.remove('open');
        currentModalWorkId = null;

        await loadVendorWorks();
        await loadStats();
      } catch (err) {
        alert('Error saving handiwork: ' + err.message);
      } finally {
        if (saveWorkSubmitBtn) {
          saveWorkSubmitBtn.disabled = false;
          saveWorkSubmitBtn.textContent = isUpdate ? 'Update Handiwork' : 'Save & Publish Handiwork';
        }
      }
    });
  }

  // Delete Work
  async function confirmDeleteWork(workId) {
    if (!workId) return;
    const found = allWorks.find(w => w.id === workId);
    const title = found ? found.title : workId;
    const ok = confirm(`Are you sure you want to delete this vendor work?\n"${title}" (${workId})\n\nThis will remove it from the public work gallery.`);
    if (!ok) return;

    try {
      const res = await fetch('/api/vendor-works/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: workId })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to delete');

      showAdminToast(`Deleted work <strong>${escapeHtml(workId)}</strong>`);
      if (workEditModal) workEditModal.classList.remove('open');
      currentModalWorkId = null;

      await loadVendorWorks();
      await loadStats();
    } catch (err) {
      alert('Delete error: ' + err.message);
    }
  }

  if (deleteWorkBtn) {
    deleteWorkBtn.addEventListener('click', () => {
      const id = document.getElementById('workFormId')?.value || currentModalWorkId;
      if (id) confirmDeleteWork(id);
    });
  }

  // Search & Filter listeners
  if (workSearchInput) workSearchInput.addEventListener('input', renderWorksTable);
  if (workJobTypeFilter) workJobTypeFilter.addEventListener('change', renderWorksTable);
  if (workStatusFilter) workStatusFilter.addEventListener('change', renderWorksTable);
});
