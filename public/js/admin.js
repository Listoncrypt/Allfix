

document.addEventListener('DOMContentLoaded', () => {
  const agreementsTable = document.getElementById('agreementsTableBody');
  const requestsTable = document.getElementById('requestsTableBody');
  const vendorsTable = document.getElementById('vendorsTableBody');
  if (agreementsTable) loadAgreements();
  if (requestsTable) loadRequests();
  if (vendorsTable) loadVendors();
  loadStats();
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
  async function loadAgreements() {
    try {
      const res = await fetch('/api/agreements');
      const json = await res.json();
      if (!json.success) return;

      const records = json.data;
      if (records.length === 0) {
        agreementsTable.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 2rem;">No agreement records found</td></tr>';
        return;
      }

      agreementsTable.innerHTML = records.map(r => `
        <tr>
          <td><strong style="color: #151B17; font-family: monospace;">${r.id}</strong></td>
          <td>
            <strong>${escapeHtml(r.userName)}</strong><br>
            <span style="font-size: 0.8rem; color: #68756B;">${escapeHtml(r.contact)}</span>
          </td>
          <td>
            <span class="badge ${r.agreementType === 'Client Terms' ? 'badge-client' : 'badge-pending'}">
              ${r.agreementType}
            </span>
          </td>
          <td><strong style="color: #15803D;">${r.version}</strong></td>
          <td><span style="font-size: 0.85rem; color: #3E4D42;">${formatDate(r.acceptedAt)}</span></td>
          <td>
            <span style="color: #15803D; font-weight: 700; font-size: 0.85rem;">
              ✓ Accepted (${r.status ? 'Valid' : 'Revoked'})
            </span>
          </td>
          <td><span style="font-size: 0.8rem; font-family: monospace; color: #68756B;">${r.ip || '127.0.0.1'}</span></td>
        </tr>
      `).join('');
    } catch (err) {
      agreementsTable.innerHTML = `<tr><td colspan="7" style="color: red; text-align:center;">Failed to load agreements: ${err.message}</td></tr>`;
    }
  }
  async function loadRequests() {
    try {
      const res = await fetch('/api/requests');
      const json = await res.json();
      if (!json.success) return;

      const records = json.data;
      if (records.length === 0) {
        requestsTable.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem;">No service requests found</td></tr>';
        return;
      }

      requestsTable.innerHTML = records.map(r => `
        <tr>
          <td><strong style="font-family: monospace; color: #16883D;">${r.id}</strong></td>
          <td>
            <strong>${escapeHtml(r.customerName)}</strong><br>
            <span style="font-size: 0.8rem; color: #68756B;">${escapeHtml(r.phone)}</span>
          </td>
          <td>
            <strong>${escapeHtml(r.category)}</strong><br>
            <span style="font-size: 0.8rem; color: #68756B;">${escapeHtml(r.location || 'N/A')}</span>
            ${Array.isArray(r.propertyTypes) && r.propertyTypes.length ? `<br><span style="font-size:0.78rem;color:#68756B;">Property: ${escapeHtml(r.propertyTypes.join(', '))}${r.propertyTypeOther ? ` — ${escapeHtml(r.propertyTypeOther)}` : ''}</span>` : ''}
            ${r.constructionDescription ? `<br><span style="font-size:0.78rem;color:#68756B;">Construction: ${escapeHtml(r.constructionDescription)}</span>` : ''}
            ${r.landSize ? `<br><span style="font-size:0.78rem;color:#68756B;">Land: ${escapeHtml(r.landSizeOther || r.landSize)} · ${r.landStatus === 'already-have-land' ? 'Customer has land' : r.landStatus === 'help-finding-land' ? 'ALLFIX land assistance requested' : ''}</span>` : ''}
          </td>
          <td>
            <span class="badge ${r.urgency === 'Emergency' ? 'badge-red' : 'badge-gray'}">${r.urgency}</span>
          </td>
          <td>
            <span style="color: #15803D; font-weight: 600; font-size: 0.8rem;">
              ✓ ${r.agreementType} ${r.version}
            </span>
          </td>
          <td><span class="badge badge-green">${r.status}</span></td>
        </tr>
      `).join('');
    } catch (err) {
      requestsTable.innerHTML = `<tr><td colspan="6" style="color: red; text-align:center;">Failed to load requests: ${err.message}</td></tr>`;
    }
  }
  async function loadVendors() {
    try {
      const res = await fetch('/api/vendors');
      const json = await res.json();
      if (!json.success) return;

      const records = json.data;
      if (records.length === 0) {
        vendorsTable.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem;">No vendors registered yet</td></tr>';
        return;
      }

      vendorsTable.innerHTML = records.map(v => `
        <tr>
          <td><strong style="font-family: monospace; color: #16883D;">${v.id}</strong></td>
          <td>
            <strong>${escapeHtml(v.businessName || v.fullName)}</strong><br>
            <span style="font-size: 0.8rem; color: #68756B;">${escapeHtml(v.fullName)}</span>
          </td>
          <td>${escapeHtml(v.phone)}</td>
          <td><strong>${escapeHtml(v.category)}</strong> (${v.experienceYears} yrs)</td>
          <td>
            <span style="color: #15803D; font-weight: 600; font-size: 0.8rem;">
              ✓ ${v.agreementType} ${v.version}
            </span>
          </td>
          <td><span class="badge ${v.verificationStatus === 'verified' ? 'badge-green' : 'badge-pending'}">${v.verificationStatus}</span></td>
        </tr>
      `).join('');
    } catch (err) {
      vendorsTable.innerHTML = `<tr><td colspan="6" style="color: red; text-align:center;">Failed to load vendors: ${err.message}</td></tr>`;
    }
  }
  async function loadStats() {
    try {
      const res = await fetch('/api/stats');
      const json = await res.json();
      if (!json.success) return;
      const s = json.stats;
      const eAgr = document.getElementById('adminStatAgreements');
      const eReq = document.getElementById('adminStatRequests');
      const eVen = document.getElementById('adminStatVendors');
      if (eAgr) eAgr.textContent = s.agreementsSigned.toLocaleString();
      if (eReq) eReq.textContent = s.totalRequests.toLocaleString();
      if (eVen) eVen.textContent = s.verifiedVendors.toLocaleString();
    } catch (e) {}
  }

  function formatDate(iso) {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return iso;
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m]);
  }
});
