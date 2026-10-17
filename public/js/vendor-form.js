

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('vendorRegisterForm');
  const checkbox = document.getElementById('vendorTermsCheckbox');
  const submitBtn = document.getElementById('submitVendorBtn');
  const termsBox = document.getElementById('termsEnforcementBox');
  const statusMsg = document.getElementById('termsStatusMsg');
  const modal = document.getElementById('vendorSuccessModal');
  const closeModalBtn = document.getElementById('closeModalBtn');

  if (!form || !checkbox || !submitBtn) return;
  const categorySelect = document.getElementById('category');
  if (categorySelect) {
    const urlParams = new URLSearchParams(window.location.search);
    const catParam = urlParams.get('cat');
    if (catParam) {
      const catMap = {
        'property': 'Property Sales & Rentals',
        'home': 'Home Services',
        'cars': 'Cars & Vehicles',
        'beauty': 'Beauty & Personal Grooming',
        'wellness': 'Wellness & Fitness',
        'decor': 'Interior Decoration & Design',
        'events': 'Events & Catering',
        'travel': 'Visa & Travel Assistance',
        'visa': 'Visa & Travel Assistance',
        'medical': 'Medical Virtual Assistance',
        'mva': 'Medical Virtual Assistance',
        'construction': 'Construction & Land',
        'cleaning': 'Cleaning & Janitorial',
        'appliances': 'Appliance Repairs',
        'products': 'Products & Spare Parts',
        'other': 'Other Specialist Services'
      };
      const matched = catMap[catParam.toLowerCase()] ||
        [...categorySelect.options].find(opt => opt.value.toLowerCase().includes(catParam.toLowerCase()))?.value;
      if (matched) {
        categorySelect.value = matched;
      }
    }
  }
  submitBtn.disabled = !checkbox.checked;
  updateVendorTermsVisuals(checkbox.checked);
  checkbox.addEventListener('change', () => {
    const isChecked = checkbox.checked;
    submitBtn.disabled = !isChecked;
    updateVendorTermsVisuals(isChecked);
  });

  function updateVendorTermsVisuals(isChecked) {
    if (isChecked) {
      termsBox.classList.add('terms-accepted');
      statusMsg.className = 'terms-status-msg success';
      statusMsg.textContent = ' Vendor Terms & Conditions v1.0 accepted. You can now submit your application.';
    } else {
      termsBox.classList.remove('terms-accepted');
      statusMsg.className = 'terms-status-msg';
      statusMsg.textContent = '';
    }
  }
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!checkbox.checked) {
      statusMsg.className = 'terms-status-msg error';
      statusMsg.textContent = 'Please accept the Vendor Terms & Conditions before submitting your application.';
      checkbox.focus();
      return;
    }
    const specialtiesInput = document.getElementById('specialties').value.trim();
    const specialtiesList = specialtiesInput ? specialtiesInput.split(',').map(s => s.trim()) : [];

    const formData = {
      fullName: document.getElementById('fullName').value.trim(),
      businessName: document.getElementById('businessName').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      email: document.getElementById('email').value.trim(),
      category: document.getElementById('category').value,
      specialties: specialtiesList,
      experienceYears: document.getElementById('experienceYears').value,
      operatingAreas: document.getElementById('operatingAreas').value.trim(),
      regNumber: document.getElementById('regNumber').value.trim(),
      address: document.getElementById('address').value.trim(),
      termsAccepted: true,
      termsVersion: 'v1.0'
    };
    if (!formData.fullName || !formData.phone || !formData.category || !formData.experienceYears) {
      alert('Please fill in all required fields (Full Name, Phone, Category, and Years of Experience).');
      return;
    }
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;">
        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
        <path d="M12 2a10 10 0 0 1 10 10"></path>
      </svg>
      Submitting Application...
    `;

    try {
      const response = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to submit vendor application.');
      }
      document.getElementById('modalVendorId').textContent = result.vendorId;
      document.getElementById('modalAgrId').textContent = result.agreementId;
      document.getElementById('modalAgrVersion').textContent = 'Vendor Terms v1.0';
      document.getElementById('modalTimestamp').textContent = new Date().toISOString();
      document.getElementById('modalVendorName').textContent = formData.businessName || formData.fullName;
      modal.classList.add('open');
      form.reset();
      checkbox.checked = false;
      submitBtn.disabled = true;
      updateVendorTermsVisuals(false);

    } catch (err) {
      statusMsg.className = 'terms-status-msg error';
      statusMsg.textContent = err.message || 'An error occurred while submitting your application.';
      alert(err.message);
    } finally {
      submitBtn.innerHTML = originalBtnText;
      submitBtn.disabled = !checkbox.checked;
    }
  });

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      modal.classList.remove('open');
    });
  }

  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('open');
    }
  });
});
