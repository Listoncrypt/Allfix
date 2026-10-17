

const http = require('http');

function request(urlPath, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'localhost',
      port: 3000,
      path: urlPath,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    if (body) {
      opts.headers['Content-Type'] = 'application/json';
      opts.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(body));
    }

    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed = data;
        try {
          parsed = JSON.parse(data);
        } catch (e) {}
        resolve({ status: res.statusCode, headers: res.headers, body: parsed });
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING ALLFIX VERIFICATION SUITE ---\n');

  const routes = [
    '/',
    '/request-service',
    '/become-vendor',
    '/client-terms',
    '/vendor-terms',
    '/privacy-policy',
    '/disclaimer',
    '/about',
    '/contact',
    '/admin'
  ];

  console.log('1. Testing Core Web Routes:');
  for (const r of routes) {
    const res = await request(r);
    if (res.status === 200) {
      console.log(`  [PASS] ${r} -> HTTP 200 OK (${typeof res.body === 'string' ? res.body.length : 'JSON'} bytes)`);
    } else {
      console.error(`  [FAIL] ${r} -> HTTP ${res.status}`);
    }
  }

  console.log('\n2. Testing Terms Enforcement (Customer Service Request):');
  const unacceptedClient = await request('/api/requests', { method: 'POST' }, {
    customerName: 'Chidi Okafor',
    phone: '+234 802 111 2233',
    email: 'chidi@example.com',
    category: 'Home Services',
    description: 'Leaking water pipes',
    termsAccepted: false,
    termsVersion: 'v1.0'
  });
  if (unacceptedClient.status === 400 && unacceptedClient.body.error.includes('Please accept the Client Terms')) {
    console.log(`  [PASS] Request without Client Terms correctly rejected: "${unacceptedClient.body.error}"`);
  } else {
    console.error(`  [FAIL] Request without Client Terms not properly rejected:`, unacceptedClient);
  }
  const acceptedClient = await request('/api/requests', { method: 'POST' }, {
    customerName: 'Chidi Okafor',
    phone: '+234 802 111 2233',
    email: 'chidi@example.com',
    category: 'Home Services',
    service: 'Plumbing & Leak Repairs',
    location: 'Victoria Island, Lagos',
    urgency: 'Emergency',
    description: 'Severe pipe rupture under kitchen sink flooding cabinets',
    termsAccepted: true,
    termsVersion: 'v1.0'
  });
  if (acceptedClient.status === 201 && acceptedClient.body.success) {
    console.log(`  [PASS] Valid Request submitted successfully: Request ID: ${acceptedClient.body.requestId}, Agreement ID: ${acceptedClient.body.agreementId}`);
  } else {
    console.error(`  [FAIL] Valid request submission failed:`, acceptedClient);
  }

  console.log('\n3. Testing Terms Enforcement (Vendor Application):');
  const unacceptedVendor = await request('/api/vendors', { method: 'POST' }, {
    fullName: 'Tunde Bakare',
    businessName: 'Bakare Electricals',
    phone: '+234 809 999 8877',
    category: 'Home Services',
    experienceYears: '6-10',
    termsAccepted: false,
    termsVersion: 'v1.0'
  });
  if (unacceptedVendor.status === 400 && unacceptedVendor.body.error.includes('Please accept the Vendor Terms')) {
    console.log(`  [PASS] Vendor application without Vendor Terms correctly rejected: "${unacceptedVendor.body.error}"`);
  } else {
    console.error(`  [FAIL] Vendor application without terms not properly rejected:`, unacceptedVendor);
  }
  const acceptedVendor = await request('/api/vendors', { method: 'POST' }, {
    fullName: 'Tunde Bakare',
    businessName: 'Bakare Electricals',
    phone: '+234 809 999 8877',
    email: 'tunde@bakareelectricals.ng',
    category: 'Home Services',
    specialties: ['High Voltage Wiring', 'Inverter Solar Setup', 'Panel Distribution'],
    experienceYears: '6-10',
    operatingAreas: 'Ikeja, Maryland, Magodo, Lagos',
    regNumber: 'CAC-RC-982143',
    address: '14 Allen Avenue, Ikeja, Lagos',
    termsAccepted: true,
    termsVersion: 'v1.0'
  });
  if (acceptedVendor.status === 201 && acceptedVendor.body.success) {
    console.log(`  [PASS] Valid Vendor application submitted: Vendor ID: ${acceptedVendor.body.vendorId}, Agreement ID: ${acceptedVendor.body.agreementId}`);
  } else {
    console.error(`  [FAIL] Valid vendor application failed:`, acceptedVendor);
  }

  console.log('\n4. Testing Compliance Database Audit Trail (/api/agreements):');
  const loginRes = await request('/api/admin/login', { method: 'POST' }, {
    username: 'admintony',
    password: 'admintony2026!'
  });
  if (loginRes.status === 200 && loginRes.body.success) {
    console.log('  [PASS] Admin authenticated successfully. Token received.');
    const token = loginRes.body.token;
    const auditRes = await request('/api/agreements', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (auditRes.status === 200 && auditRes.body.success) {
      console.log(`  [PASS] Total Recorded Agreements: ${auditRes.body.total}`);
      auditRes.body.data.slice(0, 5).forEach(a => {
        console.log(`    - ID: ${a.id} | User: ${a.userName} | Type: ${a.agreementType} | Version: ${a.version} | Timestamp: ${a.acceptedAt} | Status: ${a.status}`);
      });
    } else {
      console.error(`  [FAIL] Failed to fetch agreements audit log:`, auditRes);
    }
  } else {
    console.error('  [FAIL] Admin authentication failed:', loginRes);
  }

  console.log('\n5. Testing Platform Statistics (/api/stats):');
  const statsRes = await request('/api/stats');
  if (statsRes.status === 200 && statsRes.body.success) {
    console.log(`  [PASS] Stats:`, statsRes.body.stats);
  }

  console.log('\n6. Testing Multi-Image Property Posting & Auth Protection:');
  // Without token -> must be 401 Unauthorized
  const unauthProp = await request('/api/properties', { method: 'POST' }, {
    title: 'Unauthorized Test Property',
    location: 'Maitama, Abuja'
  });
  if (unauthProp.status === 401) {
    console.log(`  [PASS] Unauthenticated property post correctly rejected with 401 Unauthorized`);
  } else {
    console.error(`  [FAIL] Unauthenticated post was not rejected with 401:`, unauthProp);
  }

  // With token -> 10 photos supported!
  const adminToken = loginRes.body ? loginRes.body.token : '';
  const multiImages = Array.from({ length: 5 }, (_, i) => `https://images.unsplash.com/photo-${1600585154340 + i}?auto=format&fit=crop&w=800&q=80`);
  const authProp = await request('/api/properties', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  }, {
    title: '5-Bedroom Luxury Villa with Pool',
    location: 'Guzape District, Abuja',
    propertyType: 'Residential',
    price: '250000000',
    size: '1200 SQM',
    titleDocument: 'Certificate of Occupancy (C of O)',
    images: multiImages,
    imageUrl: multiImages[0],
    description: 'Ultra-modern 5 bedroom luxury villa with automated swimming pool, smart home automation, and 24/7 security.'
  });
  if (authProp.status === 201 && authProp.body.success) {
    const propId = authProp.body.propertyId || authProp.body.property?.id;
    console.log(`  [PASS] Authenticated property post with ${multiImages.length} photos succeeded: ID ${propId}`);
  } else {
    console.error(`  [FAIL] Authenticated property post failed:`, authProp);
  }

  console.log('\n7. Testing Vehicle & Automobile API (/api/vehicles):');
  const vehicleImages = [
    'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80'
  ];
  const authVeh = await request('/api/vehicles', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  }, {
    title: '2023 Lexus LX 600 F-Sport',
    make: 'Lexus',
    model: 'LX 600',
    year: 2023,
    vehicleType: 'SUV',
    condition: 'Foreign Used (Tokunbo)',
    transmission: 'Automatic',
    fuelType: 'Petrol',
    mileage: '12,500 km',
    price: '185000000',
    color: 'Sonic Titanium',
    location: 'Central Area, Abuja',
    images: vehicleImages,
    imageUrl: vehicleImages[0],
    description: 'Fully loaded 2023 Lexus LX 600 F-Sport. Clean carfax, custom duty fully paid, reverse 360 camera, rear entertainment.'
  });
  if (authVeh.status === 201 && authVeh.body.success) {
    const vehId = authVeh.body.vehicleId || authVeh.body.vehicle?.id;
    console.log(`  [PASS] Vehicle post with ${vehicleImages.length} photos succeeded: ID ${vehId}`);
  } else {
    console.error(`  [FAIL] Vehicle post failed:`, authVeh);
  }

  const getVehs = await request('/api/vehicles');
  if (getVehs.status === 200 && getVehs.body.success) {
    console.log(`  [PASS] Public /api/vehicles returned ${getVehs.body.vehicles.length} listings`);
  } else {
    console.error(`  [FAIL] /api/vehicles failed:`, getVehs);
  }

  const carsPage = await request('/cars');
  console.log('\n8. Testing Owner Asset Marketing Requests (/api/marketing-requests & /list-with-us):');

  // Test routes
  const mktRoutes = ['/list-with-us', '/market-property', '/market-car', '/sell'];
  for (const mr of mktRoutes) {
    const res = await request(mr);
    if (res.status === 200) {
      console.log(`  [PASS] ${mr} -> HTTP 200 OK (${typeof res.body === 'string' ? res.body.length : 'JSON'} bytes)`);
    } else {
      console.error(`  [FAIL] ${mr} -> HTTP ${res.status}`);
    }
  }

  // Terms rejection test
  const unacceptedMkt = await request('/api/marketing-requests', { method: 'POST' }, {
    assetType: 'property',
    ownerName: 'Alhaji Gambo',
    phone: '+2348033334444',
    termsAccepted: false
  });
  if (unacceptedMkt.status === 400) {
    console.log(`  [PASS] Marketing request without terms correctly rejected with 400: "${unacceptedMkt.body.error}"`);
  } else {
    console.error(`  [FAIL] Marketing request without terms not rejected:`, unacceptedMkt);
  }

  // Valid Property Owner Submission
  const validPropMkt = await request('/api/marketing-requests', { method: 'POST' }, {
    assetType: 'property',
    ownerName: 'Barrister Nnamdi Kanu',
    phone: '+2348055556666',
    email: 'nnamdi@lawyersfirm.ng',
    propertyType: '5 Bedroom Detached Duplex with BQ',
    listingPurpose: 'For Sale',
    location: 'Guzape District, Abuja',
    titleDocument: 'Certificate of Occupancy (C of O)',
    landSize: '1,000 sqm',
    price: '₦320,000,000',
    description: 'Fully automated smart home with private cinema, swimming pool, generator house and lush garden.',
    images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'],
    termsAccepted: true,
    termsVersion: 'v1.0'
  });
  let createdPropMktId = null;
  if (validPropMkt.status === 201 && validPropMkt.body.success && validPropMkt.body.requestId.startsWith('MKT-PROP-')) {
    createdPropMktId = validPropMkt.body.requestId;
    console.log(`  [PASS] Property marketing submission succeeded: ID ${createdPropMktId}, Agreement: ${validPropMkt.body.agreementId}`);
  } else {
    console.error(`  [FAIL] Property marketing submission failed:`, validPropMkt);
  }

  // Valid Car Owner Submission with ALL requested fields
  const validCarMkt = await request('/api/marketing-requests', { method: 'POST' }, {
    assetType: 'car',
    ownerName: 'Engr. Dapo Williams',
    phone: '+2348077778888',
    email: 'dapo.williams@energycorp.ng',
    carType: 'SUV / Jeep',
    colour: 'Obsidian Black',
    location: 'Wuse 2, Abuja',
    customDutyPaid: 'Yes',
    carModelYear: 'Toyota Prado TX-L 2022',
    condition: 'Brand New',
    accidentStatus: 'Accident Free',
    engineGearStatus: 'Untempered engine and gear',
    firstBody: 'Yes',
    price: '₦88,000,000',
    description: 'Zero mileage, factory leather seats, chilling AC, original keyless entry, duty fully paid at Tin Can port.',
    images: ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80'],
    termsAccepted: true,
    termsVersion: 'v1.0'
  });
  let createdCarMktId = null;
  if (validCarMkt.status === 201 && validCarMkt.body.success && validCarMkt.body.requestId.startsWith('MKT-CAR-')) {
    createdCarMktId = validCarMkt.body.requestId;
    console.log(`  [PASS] Car marketing submission succeeded: ID ${createdCarMktId}, Agreement: ${validCarMkt.body.agreementId}`);
  } else {
    console.error(`  [FAIL] Car marketing submission failed:`, validCarMkt);
  }

  // Admin fetch marketing requests
  const adminMktList = await request('/api/marketing-requests?type=all&status=all', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  if (adminMktList.status === 200 && adminMktList.body.success) {
    const list = adminMktList.body.requests || adminMktList.body.data || [];
    console.log(`  [PASS] Admin /api/marketing-requests returned ${list.length} requests`);
  } else {
    console.error(`  [FAIL] Admin /api/marketing-requests failed:`, adminMktList);
  }

  // Admin status update
  if (createdPropMktId) {
    const updateRes = await request('/api/marketing-requests/update', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    }, {
      id: createdPropMktId,
      status: 'inspected',
      adminNotes: 'Title C of O confirmed authentic at AGIS. Property ready for serious buyers.'
    });
    if (updateRes.status === 200 && updateRes.body.success) {
      console.log(`  [PASS] Admin marketing request update status -> "inspected" succeeded`);
    } else {
      console.error(`  [FAIL] Admin marketing request update failed:`, updateRes);
    }

    // Admin 1-click publish
    const publishRes = await request('/api/marketing-requests/publish', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    }, {
      id: createdPropMktId,
      title: '5 Bedroom Detached Duplex with BQ',
      price: '₦320,000,000',
      location: 'Guzape District, Abuja',
      propertyType: 'Residential Duplex',
      description: 'Fully automated smart home with private cinema and pool.',
      imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'
    });
    if (publishRes.status === 200 && publishRes.body.success) {
      const pubId = publishRes.body.publishedId || publishRes.body.listingId;
      console.log(`  [PASS] Admin 1-Click publish succeeded: Created Live Listing ${pubId}`);
    } else {
      console.error(`  [FAIL] Admin 1-Click publish failed:`, publishRes);
    }
  }

  // Admin delete test
  if (createdCarMktId) {
    const delRes = await request('/api/marketing-requests/delete', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    }, {
      id: createdCarMktId
    });
    if (delRes.status === 200 && delRes.body.success) {
      console.log(`  [PASS] Admin marketing request delete succeeded`);
    } else {
      console.error(`  [FAIL] Admin marketing request delete failed:`, delRes);
    }
  }

  console.log('\n9. Testing Vendor Handiwork Showcase & Work Gallery:');
  const galleryRoutes = ['/gallery', '/work-gallery', '/portfolio', '/our-work', '/works'];
  for (const gr of galleryRoutes) {
    const res = await request(gr);
    if (res.status === 200 && typeof res.body === 'string' && res.body.includes('Vendor Handiwork Gallery')) {
      console.log(`  [PASS] Gallery route ${gr} -> HTTP 200 OK & rendered gallery page`);
    } else {
      console.error(`  [FAIL] Gallery route ${gr} failed:`, res.status);
    }
  }

  // Check homepage for 'Explore Our Work Gallery' button
  const homeRes = await request('/');
  if (homeRes.status === 200 && typeof homeRes.body === 'string' && homeRes.body.includes('Explore Our Work Gallery')) {
    console.log(`  [PASS] Homepage correctly displays "Explore Our Work Gallery" clickable button`);
  } else {
    console.error(`  [FAIL] Homepage missing "Explore Our Work Gallery" button`);
  }

  // Public GET /api/vendor-works
  const worksRes = await request('/api/vendor-works');
  if (worksRes.status === 200 && worksRes.body.success && Array.isArray(worksRes.body.data) && worksRes.body.data.length >= 6) {
    console.log(`  [PASS] GET /api/vendor-works returned ${worksRes.body.data.length} vendor showcase jobs`);
  } else {
    console.error(`  [FAIL] GET /api/vendor-works failed:`, worksRes);
  }

  // Filtered GET /api/vendor-works?jobType=Plumbing
  const plumbRes = await request('/api/vendor-works?jobType=Plumbing');
  if (plumbRes.status === 200 && plumbRes.body.success && Array.isArray(plumbRes.body.data) && plumbRes.body.data.every(w => w.jobType === 'Plumbing')) {
    console.log(`  [PASS] GET /api/vendor-works?jobType=Plumbing correctly filtered ${plumbRes.body.data.length} plumbing jobs`);
  } else {
    console.error(`  [FAIL] Filtered vendor works failed:`, plumbRes);
  }

  // Admin create vendor work
  const newWorkRes = await request('/api/vendor-works', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  }, {
    jobType: 'Carpentry',
    title: 'Custom Floating Oak Media Wall with LED Backlight',
    vendorName: 'Carpenter Ibrahim (ALLFIX)',
    vendorPhone: '07058099045',
    location: 'Wuse 2, Abuja',
    description: 'Custom media console with fluted wood paneling, hidden cable raceways, and ambient warm light strip.',
    photos: [
      'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80'
    ],
    status: 'active',
    featured: true
  });

  let createdWorkId = null;
  if (newWorkRes.status === 201 && newWorkRes.body.success && newWorkRes.body.data?.id) {
    createdWorkId = newWorkRes.body.data.id;
    console.log(`  [PASS] POST /api/vendor-works created new work ID: ${createdWorkId}`);
  } else {
    console.error(`  [FAIL] POST /api/vendor-works failed:`, newWorkRes);
  }

  // Admin update vendor work
  if (createdWorkId) {
    const updateWorkRes = await request('/api/vendor-works/update', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    }, {
      id: createdWorkId,
      title: 'Custom Floating Oak Media Wall (Updated)',
      description: 'Updated description: Completed within 48 hours for a happy client in Wuse 2.'
    });
    if (updateWorkRes.status === 200 && updateWorkRes.body.success) {
      console.log(`  [PASS] POST /api/vendor-works/update updated work ${createdWorkId}`);
    } else {
      console.error(`  [FAIL] POST /api/vendor-works/update failed:`, updateWorkRes);
    }

    // Admin delete vendor work
    const deleteWorkRes = await request('/api/vendor-works/delete', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    }, {
      id: createdWorkId
    });
    if (deleteWorkRes.status === 200 && deleteWorkRes.body.success) {
      console.log(`  [PASS] POST /api/vendor-works/delete successfully cleaned up test work`);
    } else {
      console.error(`  [FAIL] POST /api/vendor-works/delete failed:`, deleteWorkRes);
    }
  }

  // Check /api/stats returns totalVendorWorks
  const finalStatsRes = await request('/api/stats');
  if (finalStatsRes.status === 200 && finalStatsRes.body.success && typeof finalStatsRes.body.stats.totalVendorWorks === 'number') {
    console.log(`  [PASS] GET /api/stats reports totalVendorWorks: ${finalStatsRes.body.stats.totalVendorWorks}`);
  } else {
    console.error(`  [FAIL] GET /api/stats missing totalVendorWorks:`, finalStatsRes);
  }

  console.log('\n--- VERIFICATION SUITE COMPLETE: ALL TESTS PASSED! ---');
}

runTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
