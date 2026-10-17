// ALLFIX Services Xpress — Asset Marketing Controller (Properties & Vehicles)

document.addEventListener('DOMContentLoaded', () => {
  // Tabs
  const tabBtnProperty = document.getElementById('tabBtnProperty');
  const tabBtnCar = document.getElementById('tabBtnCar');
  const propertySectionWrap = document.getElementById('propertySectionWrap');
  const carSectionWrap = document.getElementById('carSectionWrap');

  // Property Form Elements
  const propForm = document.getElementById('propertyMarketingForm');
  const propSubmitBtn = document.getElementById('propSubmitBtn');
  const propTypeOtherRadio = document.getElementById('propTypeOtherRadio');
  const propTypeOtherWrap = document.getElementById('propTypeOtherWrap');
  const propTypeOtherText = document.getElementById('propTypeOtherText');
  const propPhotosInput = document.getElementById('propPhotosInput');
  const propPhotosPreviewGrid = document.getElementById('propPhotosPreviewGrid');

  // Car Form Elements
  const carForm = document.getElementById('carMarketingForm');
  const carSubmitBtn = document.getElementById('carSubmitBtn');
  const carPhotosInput = document.getElementById('carPhotosInput');
  const carPhotosPreviewGrid = document.getElementById('carPhotosPreviewGrid');

  // Modal Elements
  const modal = document.getElementById('marketSuccessModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const modalAssetTitle = document.getElementById('modalAssetTitle');
  const modalAssetMessage = document.getElementById('modalAssetMessage');
  const modalTrackingRef = document.getElementById('modalTrackingRef');
  const modalWhatsAppBtn = document.getElementById('modalWhatsAppBtn');

  // Photo Storage Arrays
  let propPhotos = [];
  let carPhotos = [];

  // --------------------------------------------------------------------------
  // Tab Switching Logic
  // --------------------------------------------------------------------------
  function switchTab(type) {
    if (type === 'car') {
      tabBtnCar.classList.add('active');
      tabBtnProperty.classList.remove('active');
      carSectionWrap.style.display = 'block';
      propertySectionWrap.style.display = 'none';
      history.replaceState(null, '', '?type=car');
    } else {
      tabBtnProperty.classList.add('active');
      tabBtnCar.classList.remove('active');
      propertySectionWrap.style.display = 'block';
      carSectionWrap.style.display = 'none';
      history.replaceState(null, '', '?type=property');
    }
  }

  if (tabBtnProperty && tabBtnCar) {
    tabBtnProperty.addEventListener('click', () => switchTab('property'));
    tabBtnCar.addEventListener('click', () => switchTab('car'));
  }

  // Check URL parameter on load (e.g. /list-with-us?type=car)
  const urlParams = new URLSearchParams(window.location.search);
  const requestedType = (urlParams.get('type') || '').toLowerCase();
  if (requestedType === 'car' || requestedType === 'vehicle') {
    switchTab('car');
  } else {
    switchTab('property');
  }

  // --------------------------------------------------------------------------
  // Property Custom Type Toggle
  // --------------------------------------------------------------------------
  const propTypeRadios = document.querySelectorAll('input[name="propType"]');
  propTypeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (propTypeOtherRadio && propTypeOtherRadio.checked) {
        propTypeOtherWrap.hidden = false;
        propTypeOtherText.required = true;
        propTypeOtherText.focus();
      } else if (propTypeOtherWrap) {
        propTypeOtherWrap.hidden = true;
        propTypeOtherText.required = false;
      }
    });
  });

  // --------------------------------------------------------------------------
  // Photo Upload & Preview Logic
  // --------------------------------------------------------------------------
  function renderPhotoPreviews(photos, gridEl, onRemove) {
    gridEl.innerHTML = '';
    photos.forEach((photoUrl, index) => {
      const card = document.createElement('div');
      card.className = 'market-photo-card';
      card.innerHTML = `
        <img src="${photoUrl}" alt="Uploaded photo ${index + 1}">
        <button type="button" class="market-photo-del" title="Remove photo" aria-label="Remove photo">&times;</button>
      `;
      card.querySelector('.market-photo-del').addEventListener('click', (e) => {
        e.stopPropagation();
        onRemove(index);
      });
      gridEl.appendChild(card);
    });
  }

  function handleFiles(files, existingPhotos, maxPhotos, onUpdate) {
    const fileList = Array.from(files).slice(0, maxPhotos - existingPhotos.length);
    if (!fileList.length) return;

    let loadedCount = 0;
    fileList.forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        existingPhotos.push(e.target.result);
        loadedCount++;
        if (loadedCount === fileList.length) {
          onUpdate();
        }
      };
      reader.readAsDataURL(file);
    });
  }

  // Property Photos
  if (propPhotosInput) {
    propPhotosInput.addEventListener('change', (e) => {
      handleFiles(e.target.files, propPhotos, 10, () => {
        renderPhotoPreviews(propPhotos, propPhotosPreviewGrid, (idx) => {
          propPhotos.splice(idx, 1);
          renderPhotoPreviews(propPhotos, propPhotosPreviewGrid, arguments.callee);
        });
      });
      propPhotosInput.value = '';
    });
  }

  // Car Photos
  if (carPhotosInput) {
    carPhotosInput.addEventListener('change', (e) => {
      handleFiles(e.target.files, carPhotos, 10, () => {
        renderPhotoPreviews(carPhotos, carPhotosPreviewGrid, (idx) => {
          carPhotos.splice(idx, 1);
          renderPhotoPreviews(carPhotos, carPhotosPreviewGrid, arguments.callee);
        });
      });
      carPhotosInput.value = '';
    });
  }

  // --------------------------------------------------------------------------
  // Property Form Submit
  // --------------------------------------------------------------------------
  if (propForm) {
    propForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const ownerName = document.getElementById('propOwnerName').value.trim();
      const phone = document.getElementById('propPhone').value.trim();
      const email = document.getElementById('propEmail').value.trim();

      const listingPurposeEl = document.querySelector('input[name="propListingPurpose"]:checked');
      const listingPurpose = listingPurposeEl ? listingPurposeEl.value : 'For Sale';

      const propTypeEl = document.querySelector('input[name="propType"]:checked');
      let propertyType = propTypeEl ? propTypeEl.value : 'Fully Detached Duplex';
      if (propertyType === 'Other' && propTypeOtherText.value.trim()) {
        propertyType = propTypeOtherText.value.trim();
      }

      const location = document.getElementById('propLocation').value.trim();
      const landSize = document.getElementById('propLandSize').value.trim();
      const titleDocument = document.getElementById('propTitleDoc').value.trim();
      const price = document.getElementById('propPrice').value.trim();
      const description = document.getElementById('propDescription').value.trim();
      const termsAccepted = document.getElementById('propTermsCheckbox').checked;

      if (!termsAccepted) {
        alert('Please accept the Marketing & Representation Terms before submitting.');
        return;
      }

      propSubmitBtn.disabled = true;
      const originalText = propSubmitBtn.innerHTML;
      propSubmitBtn.innerHTML = 'Submitting Property Details...';

      try {
        const payload = {
          assetType: 'property',
          ownerName,
          phone,
          email,
          listingPurpose,
          propertyType,
          location,
          landSize,
          titleDocument,
          price,
          description,
          images: propPhotos,
          termsAccepted: true,
          termsVersion: 'v1.0'
        };

        const res = await fetch('/api/marketing-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Submission failed. Please check required fields.');
        }

        // Show Success Modal
        modalAssetTitle.textContent = 'Property Marketing Request Submitted!';
        modalAssetMessage.textContent = `Thank you, ${ownerName}. Your ${propertyType} in ${location} has been registered for marketing. The ALLFIX Property Desk will contact you to schedule physical site verification.`;
        modalTrackingRef.textContent = data.id || 'MKT-PROP-SUCCESS';

        const waText = `Hello ALLFIX Property Desk, I just submitted a marketing request for my ${propertyType} in ${location} (Ref: ${data.id}). Please let me know when we can schedule an inspection.`;
        modalWhatsAppBtn.href = `https://wa.me/2347058099045?text=${encodeURIComponent(waText)}`;
        modal.style.display = 'flex';

        // Reset
        propForm.reset();
        propPhotos = [];
        propPhotosPreviewGrid.innerHTML = '';
        if (propTypeOtherWrap) propTypeOtherWrap.hidden = true;

      } catch (err) {
        alert('Error: ' + err.message);
      } finally {
        propSubmitBtn.disabled = false;
        propSubmitBtn.innerHTML = originalText;
      }
    });
  }

  // --------------------------------------------------------------------------
  // Car Form Submit
  // --------------------------------------------------------------------------
  if (carForm) {
    carForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const ownerName = document.getElementById('carOwnerName').value.trim();
      const phone = document.getElementById('carPhone').value.trim();
      const email = document.getElementById('carEmail').value.trim();

      const carTypeEl = document.querySelector('input[name="carType"]:checked');
      const carType = carTypeEl ? carTypeEl.value : 'SUV / Jeep';

      const carMakeModelYear = document.getElementById('carMakeModelYear').value.trim();
      const carColour = document.getElementById('carColour').value.trim();
      const location = document.getElementById('carLocation').value.trim();
      const price = document.getElementById('carPrice').value.trim();

      const customDutyEl = document.querySelector('input[name="customDutyPaid"]:checked');
      const customDutyPaid = customDutyEl ? customDutyEl.value : 'Yes';

      const conditionEl = document.querySelector('input[name="carCondition"]:checked');
      const carCondition = conditionEl ? conditionEl.value : 'Foreign Used (Tokunbo)';

      const accidentEl = document.querySelector('input[name="accidentHistory"]:checked');
      const accidentHistory = accidentEl ? accidentEl.value : 'Accident Free';

      const engineEl = document.querySelector('input[name="engineGearStatus"]:checked');
      const engineGearStatus = engineEl ? engineEl.value : 'Untempered engine and gear';

      const firstBodyEl = document.querySelector('input[name="firstBody"]:checked');
      const firstBody = firstBodyEl ? firstBodyEl.value : 'Yes';

      const description = document.getElementById('carDescription').value.trim();
      const termsAccepted = document.getElementById('carTermsCheckbox').checked;

      if (!termsAccepted) {
        alert('Please accept the Representation Terms before submitting.');
        return;
      }

      carSubmitBtn.disabled = true;
      const originalText = carSubmitBtn.innerHTML;
      carSubmitBtn.innerHTML = 'Submitting Automobile Details...';

      try {
        const payload = {
          assetType: 'car',
          ownerName,
          phone,
          email,
          carType,
          carMakeModelYear,
          carColour,
          location,
          price,
          customDutyPaid,
          carCondition,
          accidentHistory,
          engineGearStatus,
          firstBody,
          description,
          images: carPhotos,
          termsAccepted: true,
          termsVersion: 'v1.0'
        };

        const res = await fetch('/api/marketing-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Submission failed. Please check required fields.');
        }

        // Show Success Modal
        modalAssetTitle.textContent = 'Car Marketing Request Submitted!';
        modalAssetMessage.textContent = `Thank you, ${ownerName}. Your ${carMakeModelYear} in ${location} has been registered. The ALLFIX Automobile Desk will review your customs & vehicle specs for pre-inspection.`;
        modalTrackingRef.textContent = data.id || 'MKT-CAR-SUCCESS';

        const waText = `Hello ALLFIX Auto Desk, I just submitted a marketing request for my ${carMakeModelYear} (${carColour}) in ${location} (Ref: ${data.id}). Customs Duty: ${customDutyPaid}. When can we schedule physical verification?`;
        modalWhatsAppBtn.href = `https://wa.me/2347058099045?text=${encodeURIComponent(waText)}`;
        modal.style.display = 'flex';

        // Reset
        carForm.reset();
        carPhotos = [];
        carPhotosPreviewGrid.innerHTML = '';

      } catch (err) {
        alert('Error: ' + err.message);
      } finally {
        carSubmitBtn.disabled = false;
        carSubmitBtn.innerHTML = originalText;
      }
    });
  }

  // --------------------------------------------------------------------------
  // Modal Dismiss
  // --------------------------------------------------------------------------
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      modal.style.display = 'none';
      window.location.href = '/';
    });
  }

  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });
});
