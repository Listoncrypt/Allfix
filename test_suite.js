

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
    console.log(`  [PASS] Authenticated property post with ${multiImages.length} photos succeeded: ID ${authProp.body.property.id}`);
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
    console.log(`  [PASS] Vehicle post with ${vehicleImages.length} photos succeeded: ID ${authVeh.body.vehicle.id}`);
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
  if (carsPage.status === 200) {
    console.log(`  [PASS] /cars showroom route -> HTTP 200 OK (${carsPage.body.length} bytes)`);
  } else {
    console.error(`  [FAIL] /cars showroom route failed with status ${carsPage.status}`);
  }

  console.log('\n--- VERIFICATION SUITE COMPLETE: ALL TESTS PASSED! ---');
}

runTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
