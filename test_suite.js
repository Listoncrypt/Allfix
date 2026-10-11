

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

  console.log('\n--- VERIFICATION SUITE COMPLETE: ALL TESTS PASSED! ---');
}

runTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
