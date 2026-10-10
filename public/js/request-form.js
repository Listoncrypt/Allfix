

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('serviceRequestForm');
  const checkbox = document.getElementById('clientTermsCheckbox');
  const submitBtn = document.getElementById('submitRequestBtn');
  const termsBox = document.getElementById('termsEnforcementBox');
  const statusMsg = document.getElementById('termsStatusMsg');
  const modal = document.getElementById('successModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const categoryInput = document.getElementById('category');
  const serviceInput = document.getElementById('service');
  const propertyTypeSection = document.getElementById('propertyTypeSection');
  const constructionSection = document.getElementById('constructionDetailsSection');
  const propertyOther = document.getElementById('propertyTypeOther');
  const propertyOtherWrap = document.getElementById('propertyTypeOtherWrap');
  const propertyOtherText = document.getElementById('propertyTypeOtherText');
  const landSizeOther = document.getElementById('landSizeOther');
  const landSizeOtherWrap = document.getElementById('landSizeOtherWrap');
  const landSizeOtherText = document.getElementById('landSizeOtherText');
  const generalDescription = document.getElementById('description');
  const generalDescriptionLabel = form ? form.querySelector('label[for="description"]') : null;

  if (!form || !checkbox || !submitBtn) return;

  function setSectionVisibility(section, isVisible) {
    if (!section) return;
    section.hidden = !isVisible;
    section.setAttribute('aria-hidden', String(!isVisible));
    section.querySelectorAll('input, textarea').forEach(input => {
      input.disabled = !isVisible;
    });
  }

  function syncOptionalOther(checkboxInput, wrapper, textInput) {
    if (!checkboxInput || !wrapper || !textInput) return;
    const isVisible = !checkboxInput.disabled && checkboxInput.checked;
    wrapper.hidden = !isVisible;
    textInput.disabled = !isVisible;
  }

  function updateServiceDetails() {
    const category = categoryInput.value;
    const service = serviceInput.value.trim().toLowerCase();
    const propertyMatch = category === 'Property Maintenance' || category === 'Construction & Land' ||
      /property|bungalow|duplex|land/.test(service);
    const constructionMatch = category === 'Construction & Land' ||
      /construct|build(?:ing)?|development|land sourcing|land acquisition/.test(service);

    setSectionVisibility(propertyTypeSection, propertyMatch);
    setSectionVisibility(constructionSection, constructionMatch);
    generalDescription.required = !constructionMatch;
    generalDescriptionLabel.innerHTML = constructionMatch
      ? 'Additional notes or site details <span style="font-size:.8rem;color:#68756B;">(optional)</span>'
      : 'Describe the Issue / Scope of Work <span class="required">*</span>';
    generalDescription.placeholder = constructionMatch
      ? 'Add access requirements, timing details, or anything else we should know.'
      : 'Please describe the fault or requirement in detail. Include any specific symptoms or equipment brands.';
    syncOptionalOther(propertyOther, propertyOtherWrap, propertyOtherText);
    syncOptionalOther(landSizeOther, landSizeOtherWrap, landSizeOtherText);
  }

  categoryInput.addEventListener('change', updateServiceDetails);
  serviceInput.addEventListener('input', updateServiceDetails);
  propertyOther.addEventListener('change', updateServiceDetails);
  landSizeOther.addEventListener('change', updateServiceDetails);
  const urlParams = new URLSearchParams(window.location.search);
  const catParam = urlParams.get('cat');
  if (catParam) {
    const catMap = {
      'home': 'Home Services',
      'cars': 'Cars & Vehicles',
      'property': 'Property Maintenance',
      'construction': 'Construction & Land',
      'cleaning': 'Cleaning & Janitorial',
      'appliances': 'Appliance Repairs',
      'products': 'Products & Spare Parts',
      'other': 'Other Specialist Services'
    };
    const matched = catMap[catParam.toLowerCase()] ||
      [...categoryInput.options].find(opt => opt.value.toLowerCase().includes(catParam.toLowerCase()))?.value;
    if (matched) {
      categoryInput.value = matched;
    }
  }
  const svcParam = urlParams.get('service');
  if (svcParam) {
    serviceInput.value = svcParam;
  }
  updateServiceDetails();
  submitBtn.disabled = !checkbox.checked;
  updateTermsVisuals(checkbox.checked);
  checkbox.addEventListener('change', () => {
    const isChecked = checkbox.checked;
    submitBtn.disabled = !isChecked;
    updateTermsVisuals(isChecked);
  });

  function updateTermsVisuals(isChecked) {
    if (isChecked) {
      termsBox.classList.add('terms-accepted');
      statusMsg.className = 'terms-status-msg success';
      statusMsg.textContent = '✓ Client Terms & Conditions v1.0 accepted. You can now submit your request.';
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
      statusMsg.textContent = 'Please accept the Client Terms & Conditions before submitting your request.';
      checkbox.focus();
      return;
    }
    const formData = {
      customerName: document.getElementById('customerName').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      email: document.getElementById('email').value.trim(),
      category: document.getElementById('category').value,
      service: document.getElementById('service').value.trim(),
      location: document.getElementById('location').value.trim(),
      urgency: (form.querySelector('input[name="urgency"]:checked')?.value) || 'Medium',
      preferredDate: document.getElementById('preferredDate').value,
      description: generalDescription.value.trim() || (constructionSection.hidden ? '' : document.getElementById('constructionDescription').value.trim()),
      propertyTypes: [...form.querySelectorAll('input[name="propertyTypes"]:checked:not(:disabled)')].map(input => input.value),
      propertyTypeOther: propertyTypeSection.hidden ? '' : propertyOtherText.value.trim(),
      constructionDescription: constructionSection.hidden ? '' : document.getElementById('constructionDescription').value.trim(),
      landSize: constructionSection.hidden ? '' : form.querySelector('input[name="landSize"]:checked:not(:disabled)')?.value || '',
      landSizeOther: constructionSection.hidden ? '' : landSizeOtherText.value.trim(),
      landStatus: constructionSection.hidden ? '' : form.querySelector('input[name="landStatus"]:checked:not(:disabled)')?.value || '',
      termsAccepted: true,
      termsVersion: 'v1.0'
    };
    if (!formData.customerName || !formData.phone || !formData.category || !formData.description) {
      alert('Please fill in all required fields (Name, Phone, Service Category, and Description).');
      return;
    }

    if (!constructionSection.hidden) {
      if (!formData.constructionDescription) {
        alert('Please describe what you want to construct.');
        document.getElementById('constructionDescription').focus();
        return;
      }
      if (!formData.landSize || !formData.landStatus) {
        alert('Please select a land size and let us know whether you already have land.');
        constructionSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      if (formData.landSize === 'Other' && !formData.landSizeOther) {
        alert('Please enter the land size.');
        landSizeOtherText.focus();
        return;
      }
    }

    if (formData.propertyTypes.includes('Other') && !formData.propertyTypeOther) {
      alert('Please tell us the property type.');
      propertyOtherText.focus();
      return;
    }
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;">
        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
        <path d="M12 2a10 10 0 0 1 10 10"></path>
      </svg>
      Submitting Request...
    `;

    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to submit service request.');
      }
      document.getElementById('modalReqId').textContent = result.requestId;
      document.getElementById('modalAgrId').textContent = result.agreementId;
      document.getElementById('modalAgrVersion').textContent = 'Client Terms v1.0';
      document.getElementById('modalTimestamp').textContent = new Date().toISOString();
      document.getElementById('modalCustomerName').textContent = formData.customerName;
      modal.classList.add('open');
      form.reset();
      updateServiceDetails();
      checkbox.checked = false;
      submitBtn.disabled = true;
      updateTermsVisuals(false);

    } catch (err) {
      statusMsg.className = 'terms-status-msg error';
      statusMsg.textContent = err.message || 'An error occurred while submitting. Please try again.';
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
