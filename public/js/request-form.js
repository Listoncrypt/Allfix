// ALLFIX Services Xpress — Customer Request Form Controller

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
  const serviceItemWrap = document.getElementById('serviceItemWrap');

  // Conditional Sections
  const propertySection = document.getElementById('propertySection');
  const carSection = document.getElementById('carSection');
  const constructionSection = document.getElementById('constructionDetailsSection');

  // Property Custom Toggles
  const propertyOther = document.getElementById('propertyTypeOther');
  const propertyOtherWrap = document.getElementById('propertyTypeOtherWrap');
  const propertyOtherText = document.getElementById('propertyTypeOtherText');
  const propertyBedroomsCustomRadio = document.getElementById('propertyBedroomsCustomRadio');
  const propertyBedroomsCustomWrap = document.getElementById('propertyBedroomsCustomWrap');
  const propertyBedroomsCustomText = document.getElementById('propertyBedroomsCustomText');
  const propLocationOther = document.getElementById('propLocationOther');
  const propLocationOtherWrap = document.getElementById('propLocationOtherWrap');
  const propLocationOtherText = document.getElementById('propLocationOtherText');
  const propBudgetCustomRadio = document.getElementById('propBudgetCustomRadio');
  const propBudgetCustomWrap = document.getElementById('propBudgetCustomWrap');
  const propBudgetCustomText = document.getElementById('propBudgetCustomText');

  // Car Custom Toggles
  const carTypeOtherRadio = document.getElementById('carTypeOtherRadio');
  const carTypeOtherWrap = document.getElementById('carTypeOtherWrap');
  const carTypeOtherText = document.getElementById('carTypeOtherText');
  const carModelYear = document.getElementById('carModelYear');
  const carBudgetCustomRadio = document.getElementById('carBudgetCustomRadio');
  const carBudgetCustomWrap = document.getElementById('carBudgetCustomWrap');
  const carBudgetCustomText = document.getElementById('carBudgetCustomText');

  // Construction Custom Toggles
  const landSizeOther = document.getElementById('landSizeOther');
  const landSizeOtherWrap = document.getElementById('landSizeOtherWrap');
  const landSizeOtherText = document.getElementById('landSizeOtherText');

  // Standard Wrappers
  const standardLocationWrap = document.getElementById('standardLocationWrap');
  const locationInput = document.getElementById('location');
  const standardUrgencyFieldset = document.getElementById('standardUrgencyFieldset');
  const standardDateWrap = document.getElementById('standardDateWrap');
  const preferredDateInput = document.getElementById('preferredDate');
  const generalDescription = document.getElementById('description');
  const generalDescriptionLabel = document.getElementById('descriptionLabel') || (form ? form.querySelector('label[for="description"]') : null);
  const bookingForInputs = form ? form.querySelectorAll('input[name="bookingFor"]') : [];
  const meetingPersonDetails = document.getElementById('meetingPersonDetails');

  function readUpload(input, label) {
    const file = input?.files?.[0];
    if (!file) throw new Error(`Please upload ${label}.`);
    if (file.size > 4 * 1024 * 1024) throw new Error(`${label} must be 4 MB or smaller.`);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error(`Unable to read ${label}. Please choose the file again.`));
      reader.readAsDataURL(file);
    });
  }

  if (!form || !checkbox || !submitBtn) return;

  function updateMeetingPersonDetails() {
    if (!meetingPersonDetails) return;
    const isOther = form.querySelector('input[name="bookingFor"]:checked')?.value === 'someone-else';
    meetingPersonDetails.hidden = !isOther;
    meetingPersonDetails.setAttribute('aria-hidden', String(!isOther));
    meetingPersonDetails.querySelectorAll('input').forEach(input => {
      input.disabled = !isOther;
      input.required = isOther && ['meetingPersonName', 'meetingPersonPhone', 'meetingPersonRelationship', 'representativeConsent'].includes(input.id);
    });
    const help = document.getElementById('identitySubjectHelp');
    if (help) {
      help.textContent = isOther
        ? 'Upload the ID and selfie of the person who will meet the provider. Please use their documents.'
        : 'Upload your own ID and selfie. These should belong to the person who will meet the provider.';
    }
  }
  bookingForInputs.forEach(input => input.addEventListener('change', updateMeetingPersonDetails));
  updateMeetingPersonDetails();

  function setSectionVisibility(section, isVisible) {
    if (!section) return;
    section.hidden = !isVisible;
    section.setAttribute('aria-hidden', String(!isVisible));
    section.querySelectorAll('input, textarea, select').forEach(input => {
      input.disabled = !isVisible;
    });
  }

  function syncRadioCustomToggle(radioName, customRadio, wrapper, textInput) {
    if (!form || !customRadio || !wrapper || !textInput) return;
    const isCustom = customRadio.checked && !customRadio.disabled;
    wrapper.hidden = !isCustom;
    textInput.disabled = !isCustom;
  }

  function syncCheckboxCustomToggle(checkboxInput, wrapper, textInput) {
    if (!checkboxInput || !wrapper || !textInput) return;
    const isChecked = checkboxInput.checked && !checkboxInput.disabled;
    wrapper.hidden = !isChecked;
    textInput.disabled = !isChecked;
  }

  function updateServiceDetails() {
    const category = categoryInput.value;
    const service = (serviceInput ? serviceInput.value.trim().toLowerCase() : '');

    const isProperty = category === 'Property Sales & Rentals';
    const isCar = category === 'Cars & Vehicles';
    const isConstruction = category === 'Construction & Land' ||
      /construct|civil building|development project|land sourcing|land acquisition/.test(service);

    // 1. Service Item input (hide for Property & Cars)
    if (serviceItemWrap) {
      serviceItemWrap.hidden = isProperty || isCar;
      if (serviceInput) serviceInput.disabled = isProperty || isCar;
    }

    // 2. Property Dedicated Section
    setSectionVisibility(propertySection, isProperty);

    // 3. Car Dedicated Section
    setSectionVisibility(carSection, isCar);

    // 4. Construction Dedicated Section
    setSectionVisibility(constructionSection, isConstruction);

    // 5. Standard Location Input
    if (standardLocationWrap) {
      // Property uses multi-select locations; Cars & General use standard location
      standardLocationWrap.hidden = isProperty;
      if (locationInput) {
        locationInput.disabled = isProperty;
        locationInput.required = !isProperty;
      }
    }

    // 6. Urgency Fieldset
    if (standardUrgencyFieldset) {
      // Property has dedicated timeline, Cars do not use 24h urgency
      standardUrgencyFieldset.hidden = isProperty || isCar;
      standardUrgencyFieldset.querySelectorAll('input[name="urgency"]').forEach(inp => {
        inp.disabled = isProperty || isCar;
      });
    }

    // 7. Preferred Service Date
    if (standardDateWrap) {
      // Property & Cars do not use service dates (delivery/closing depends on transaction)
      standardDateWrap.hidden = isProperty || isCar;
      if (preferredDateInput) preferredDateInput.disabled = isProperty || isCar;
    }

    // 8. Description Area
    if (generalDescriptionLabel && generalDescription) {
      if (isProperty) {
        generalDescriptionLabel.innerHTML = 'Describe the Request / Preferences <span class="required">*</span>';
        generalDescription.placeholder = 'Please describe your property preferences in detail (e.g. style, security, specific amenities, intended move-in date)...';
        generalDescription.required = true;
      } else if (isCar) {
        generalDescriptionLabel.innerHTML = 'Describe the Vehicle Specifications & Special Requests <span class="required">*</span>';
        generalDescription.placeholder = 'Include transmission preference, trim, mileage preference, key features, or delivery instructions...';
        generalDescription.required = true;
      } else if (isConstruction) {
        generalDescriptionLabel.innerHTML = 'Additional notes or site details <span style="font-size:.8rem;color:#68756B;">(optional)</span>';
        generalDescription.placeholder = 'Add access requirements, timing details, or anything else we should know.';
        generalDescription.required = false;
      } else {
        generalDescriptionLabel.innerHTML = 'Describe the Issue / Scope of Work <span class="required">*</span>';
        generalDescription.placeholder = 'Please describe the fault or requirement in detail. Include any specific symptoms or equipment brands.';
        generalDescription.required = true;
      }
    }

    // Sync custom toggles
    syncCheckboxCustomToggle(propertyOther, propertyOtherWrap, propertyOtherText);
    syncRadioCustomToggle('propertyBedrooms', propertyBedroomsCustomRadio, propertyBedroomsCustomWrap, propertyBedroomsCustomText);
    syncCheckboxCustomToggle(propLocationOther, propLocationOtherWrap, propLocationOtherText);
    syncRadioCustomToggle('propBudget', propBudgetCustomRadio, propBudgetCustomWrap, propBudgetCustomText);

    syncRadioCustomToggle('carType', carTypeOtherRadio, carTypeOtherWrap, carTypeOtherText);
    syncRadioCustomToggle('carBudget', carBudgetCustomRadio, carBudgetCustomWrap, carBudgetCustomText);

    syncRadioCustomToggle('landSize', landSizeOther, landSizeOtherWrap, landSizeOtherText);
  }

  // Event Listeners for Dynamic Toggles
  categoryInput.addEventListener('change', updateServiceDetails);
  if (serviceInput) serviceInput.addEventListener('input', updateServiceDetails);

  // Property radio / checkbox change listeners
  if (propertySection) {
    propertySection.addEventListener('change', () => {
      syncCheckboxCustomToggle(propertyOther, propertyOtherWrap, propertyOtherText);
      syncRadioCustomToggle('propertyBedrooms', propertyBedroomsCustomRadio, propertyBedroomsCustomWrap, propertyBedroomsCustomText);
      syncCheckboxCustomToggle(propLocationOther, propLocationOtherWrap, propLocationOtherText);
      syncRadioCustomToggle('propBudget', propBudgetCustomRadio, propBudgetCustomWrap, propBudgetCustomText);
    });
  }

  // Car radio change listeners
  if (carSection) {
    carSection.addEventListener('change', () => {
      syncRadioCustomToggle('carType', carTypeOtherRadio, carTypeOtherWrap, carTypeOtherText);
      syncRadioCustomToggle('carBudget', carBudgetCustomRadio, carBudgetCustomWrap, carBudgetCustomText);
    });
  }

  if (constructionSection) {
    constructionSection.addEventListener('change', () => {
      syncRadioCustomToggle('landSize', landSizeOther, landSizeOtherWrap, landSizeOtherText);
    });
  }

  // URL query parameter support
  const urlParams = new URLSearchParams(window.location.search);
  const catParam = urlParams.get('cat');
  if (catParam) {
    const catMap = {
      'property': 'Property Sales & Rentals',
      'realestate': 'Property Sales & Rentals',
      'cars': 'Cars & Vehicles',
      'car': 'Cars & Vehicles',
      'home': 'Home Services',
      'beauty': 'Beauty & Personal Grooming',
      'wellness': 'Wellness & Fitness',
      'decor': 'Interior Decoration & Design',
      'events': 'Events & Catering',
      'travel': 'Visa & Travel Assistance',
      'visa': 'Visa & Travel Assistance',
      'medical': 'Medical Virtual Assistance',
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
  if (svcParam && serviceInput) {
    serviceInput.value = svcParam;
  }

  updateServiceDetails();

  // Terms and conditions checkbox visual state
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
      statusMsg.textContent = ' Client Terms & Conditions v1.0 accepted. You can now submit your request.';
    } else {
      termsBox.classList.remove('terms-accepted');
      statusMsg.className = 'terms-status-msg';
      statusMsg.textContent = '';
    }
  }

  // Form Submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!checkbox.checked) {
      statusMsg.className = 'terms-status-msg error';
      statusMsg.textContent = 'Please accept the Client Terms & Conditions before submitting your request.';
      checkbox.focus();
      return;
    }

    const category = categoryInput.value;
    const isProperty = category === 'Property Sales & Rentals';
    const isCar = category === 'Cars & Vehicles';
    const isConstruction = !constructionSection.hidden;
    const isBookingForSomeoneElse = form.querySelector('input[name="bookingFor"]:checked')?.value === 'someone-else';

    // Collect Property specific data
    let bedrooms = '';
    let preferredLocations = [];
    let propertyBudget = '';
    let propertyTimeline = '';
    let propertyTypes = [];
    let propertyTypeOtherVal = '';

    if (isProperty) {
      const selectedBedrooms = form.querySelector('input[name="propertyBedrooms"]:checked:not(:disabled)')?.value || '';
      bedrooms = selectedBedrooms === 'Custom' ? (propertyBedroomsCustomText?.value.trim() || 'Custom') : selectedBedrooms;

      preferredLocations = [...form.querySelectorAll('input[name="propLocations"]:checked:not(:disabled)')].map(i => i.value);
      if (propLocationOther && propLocationOther.checked && propLocationOtherText?.value.trim()) {
        preferredLocations.push(propLocationOtherText.value.trim());
      }

      const selectedPropBudget = form.querySelector('input[name="propBudget"]:checked:not(:disabled)')?.value || '';
      propertyBudget = selectedPropBudget === 'Custom' ? (propBudgetCustomText?.value.trim() || 'Custom Budget') : selectedPropBudget;

      propertyTimeline = form.querySelector('input[name="propTimeline"]:checked:not(:disabled)')?.value || 'Actively searching (Within 1 month)';

      propertyTypes = [...form.querySelectorAll('input[name="propertyTypes"]:checked:not(:disabled)')].map(i => i.value);
      propertyTypeOtherVal = propertyOtherText?.value.trim() || '';
    }

    // Collect Car specific data
    let carType = '';
    let carModelYearVal = '';
    let isElectricVehicle = 'No';
    let carColours = [];
    let carBudget = '';

    if (isCar) {
      const selectedCarType = form.querySelector('input[name="carType"]:checked:not(:disabled)')?.value || '';
      carType = selectedCarType === 'Other' ? (carTypeOtherText?.value.trim() || 'Other Vehicle') : selectedCarType;
      carModelYearVal = carModelYear?.value.trim() || '';
      isElectricVehicle = form.querySelector('input[name="isElectricVehicle"]:checked:not(:disabled)')?.value || 'No (Petrol / Diesel / Hybrid)';
      carColours = [...form.querySelectorAll('input[name="carColours"]:checked:not(:disabled)')].map(i => i.value);
      const selectedCarBudget = form.querySelector('input[name="carBudget"]:checked:not(:disabled)')?.value || '';
      carBudget = selectedCarBudget === 'Custom' ? (carBudgetCustomText?.value.trim() || 'Custom Budget') : selectedCarBudget;
    }

    // Standard location resolution
    let finalLocation = '';
    if (isProperty) {
      finalLocation = preferredLocations.length ? preferredLocations.join(', ') : 'Abuja';
    } else {
      finalLocation = locationInput?.value.trim() || 'Abuja';
    }

    // Standard urgency resolution
    let finalUrgency = 'Medium';
    if (isProperty) {
      finalUrgency = propertyTimeline.includes('immediately') ? 'High' : (propertyTimeline.includes('1 month') ? 'Medium' : 'Low');
    } else if (isCar) {
      finalUrgency = 'Standard';
    } else {
      finalUrgency = (form.querySelector('input[name="urgency"]:checked:not(:disabled)')?.value) || 'Medium';
    }

    // Service label resolution
    let finalService = '';
    if (isProperty) {
      const typeStr = propertyTypes.length ? propertyTypes.join(', ') : 'Property';
      finalService = `${bedrooms ? bedrooms + ' • ' : ''}${typeStr}`;
    } else if (isCar) {
      finalService = `${carType || 'Car'}${carModelYearVal ? ' (' + carModelYearVal + ')' : ''}`;
    } else {
      finalService = (serviceInput?.value.trim()) || category;
    }

    const formData = {
      customerName: document.getElementById('customerName').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      email: document.getElementById('email').value.trim(),
      isBookingForSomeoneElse,
      meetingPersonName: isBookingForSomeoneElse ? document.getElementById('meetingPersonName').value.trim() : document.getElementById('customerName').value.trim(),
      meetingPersonPhone: isBookingForSomeoneElse ? document.getElementById('meetingPersonPhone').value.trim() : document.getElementById('phone').value.trim(),
      meetingPersonEmail: isBookingForSomeoneElse ? document.getElementById('meetingPersonEmail').value.trim() : document.getElementById('email').value.trim(),
      meetingPersonRelationship: isBookingForSomeoneElse ? document.getElementById('meetingPersonRelationship').value.trim() : 'Self',
      meetingAddress: document.getElementById('meetingAddress').value.trim(),
      identityDocumentType: document.getElementById('requestIdentityType').value,
      identityConsent: document.getElementById('requestIdentityConsent').checked,
      representativeConsent: !isBookingForSomeoneElse || document.getElementById('representativeConsent').checked,
      category: category,
      service: finalService,
      location: finalLocation,
      urgency: finalUrgency,
      preferredDate: (standardDateWrap && !standardDateWrap.hidden) ? preferredDateInput?.value : '',
      description: generalDescription.value.trim() || (isConstruction ? document.getElementById('constructionDescription')?.value.trim() : ''),
      // Property Fields
      bedrooms: bedrooms,
      preferredLocations: preferredLocations,
      propertyBudget: propertyBudget,
      propertyTimeline: propertyTimeline,
      propertyTypes: propertyTypes,
      propertyTypeOther: propertyTypeOtherVal,
      // Car Fields
      carType: carType,
      carModelYear: carModelYearVal,
      isElectricVehicle: isElectricVehicle,
      carColours: carColours,
      carBudget: carBudget,
      // Construction Fields
      constructionDescription: isConstruction ? document.getElementById('constructionDescription')?.value.trim() : '',
      landSize: isConstruction ? (form.querySelector('input[name="landSize"]:checked:not(:disabled)')?.value || '') : '',
      landSizeOther: isConstruction ? landSizeOtherText?.value.trim() : '',
      landStatus: isConstruction ? (form.querySelector('input[name="landStatus"]:checked:not(:disabled)')?.value || '') : '',
      // Legal terms
      termsAccepted: true,
      termsVersion: 'v1.0'
    };

    if (!formData.customerName || !formData.phone || !formData.category || !formData.description) {
      alert('Please fill in all required fields (Name, Phone, Service Category, and Description).');
      return;
    }

    if (isProperty) {
      if (preferredLocations.length === 0) {
        alert('Please choose at least one preferred location for the property.');
        propertySection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }

    if (isCar) {
      if (!formData.carModelYear) {
        alert('Please enter your preferred Car Year / Model (e.g. 2022 Toyota RAV4).');
        carModelYear.focus();
        return;
      }
    }

    if (isBookingForSomeoneElse && (!formData.meetingPersonName || !formData.meetingPersonPhone || !formData.meetingPersonRelationship || !formData.representativeConsent)) {
      alert('Please provide the person meeting the provider, your relationship to them, and confirm you have permission to share their details.');
      meetingPersonDetails.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (!formData.meetingAddress || !formData.identityDocumentType || !formData.identityConsent) {
      alert('Please provide the meeting address, choose an ID type, and consent to the identity check.');
      return;
    }

    if (isConstruction) {
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
      const identityDocumentUpload = await readUpload(document.getElementById('requestIdentityFile'), "the meeting person's ID");
      const identitySelfieUpload = await readUpload(document.getElementById('requestSelfieFile'), "the meeting person's selfie");
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, identityDocumentUpload, identitySelfieUpload })
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
      updateMeetingPersonDetails();
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
