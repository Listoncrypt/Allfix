

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'data', 'db.json');
const PUBLIC_DIR = path.join(__dirname, 'public');
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};
function readDb() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading database:', err);
    return { agreements: [], requests: [], vendors: [], messages: [] };
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error saving database:', err);
    return false;
  }
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        if (!body.trim()) return resolve({});
        const parsed = JSON.parse(body);
        resolve(parsed);
      } catch (err) {
        reject(new Error('Invalid JSON format'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  });
  res.end(JSON.stringify(data));
}

function getClientIp(req) {
  return (
    req.headers['x-forwarded-for'] ||
    req.socket.remoteAddress ||
    '127.0.0.1'
  );
}
const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = urlObj.pathname;
  const method = req.method;
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    });
    return res.end();
  }
  if (pathname.startsWith('/api/')) {
    try {
      if (pathname === '/api/requests' && method === 'POST') {
        const body = await parseJsonBody(req);
        const {
          customerName,
          phone,
          email,
          category,
          service,
          location,
          urgency,
          preferredDate,
          description,
          propertyTypes,
          propertyTypeOther,
          constructionDescription,
          landSize,
          landSizeOther,
          landStatus,
          termsAccepted,
          termsVersion
        } = body;
        if (!customerName || !phone || !category || !description) {
          return sendJson(res, 400, {
            success: false,
            error: 'Please fill in all required fields: name, phone, category, and description.'
          });
        }
        if (termsAccepted !== true || termsVersion !== 'v1.0') {
          return sendJson(res, 400, {
            success: false,
            error: 'Please accept the Client Terms & Conditions before submitting your request.'
          });
        }

        const needsConstructionDetails = /construction\s*&\s*land|construct|build(?:ing)?|development|land sourcing|land acquisition/i
          .test(`${category} ${service || ''}`);
        const isValidLandStatus = landStatus === 'already-have-land' || landStatus === 'help-finding-land';
        if (needsConstructionDetails && (!String(constructionDescription || '').trim() || !landSize ||
            !isValidLandStatus || (landSize === 'Other' && !String(landSizeOther || '').trim()))) {
          return sendJson(res, 400, {
            success: false,
            error: 'Please complete the construction description, land size, and land availability details.'
          });
        }

        const db = readDb();
        const isoNow = new Date().toISOString();
        const requestId = 'REQ-' + crypto.randomBytes(4).toString('hex').toUpperCase();
        const agreementId = 'AGR-C-' + crypto.randomBytes(4).toString('hex').toUpperCase();
        const clientIp = getClientIp(req);
        const userAgent = req.headers['user-agent'] || 'Unknown';
        const agreementRecord = {
          id: agreementId,
          userName: customerName.trim(),
          contact: (phone || email || '').trim(),
          agreementType: 'Client Terms',
          version: 'v1.0',
          acceptedAt: isoNow,
          status: true,
          context: 'request_form',
          ip: clientIp,
          userAgent: userAgent,
          relatedEntityId: requestId
        };
        const requestRecord = {
          id: requestId,
          customerName: customerName.trim(),
          phone: phone.trim(),
          email: (email || '').trim(),
          category: category.trim(),
          service: (service || category).trim(),
          location: (location || 'Not specified').trim(),
          urgency: urgency || 'Standard',
          preferredDate: preferredDate || isoNow.split('T')[0],
          description: description.trim(),
          propertyTypes: Array.isArray(propertyTypes) ? propertyTypes.filter(type => typeof type === 'string') : [],
          propertyTypeOther: (propertyTypeOther || '').trim(),
          constructionDescription: (constructionDescription || '').trim(),
          landSize: (landSize || '').trim(),
          landSizeOther: (landSizeOther || '').trim(),
          landStatus: landStatus || '',
          agreementType: 'Client Terms',
          version: 'v1.0',
          acceptedAt: isoNow,
          agreementId: agreementId,
          status: 'pending_matching',
          createdAt: isoNow
        };

        db.agreements.push(agreementRecord);
        db.requests.push(requestRecord);
        writeDb(db);

        return sendJson(res, 201, {
          success: true,
          requestId: requestId,
          agreementId: agreementId,
          message: 'Your service request has been received! Our coordination team is matching you with a verified vendor.'
        });
      }
      if (pathname === '/api/vendors' && method === 'POST') {
        const body = await parseJsonBody(req);
        const {
          fullName,
          businessName,
          phone,
          email,
          category,
          specialties,
          experienceYears,
          operatingAreas,
          regNumber,
          address,
          termsAccepted,
          termsVersion
        } = body;
        if (!fullName || !phone || !category || !experienceYears) {
          return sendJson(res, 400, {
            success: false,
            error: 'Please fill in all required fields: full name, phone number, category, and experience.'
          });
        }
        if (termsAccepted !== true || termsVersion !== 'v1.0') {
          return sendJson(res, 400, {
            success: false,
            error: 'Please accept the Vendor Terms & Conditions before submitting your application.'
          });
        }

        const db = readDb();
        const isoNow = new Date().toISOString();
        const vendorId = 'VEN-' + crypto.randomBytes(4).toString('hex').toUpperCase();
        const agreementId = 'AGR-V-' + crypto.randomBytes(4).toString('hex').toUpperCase();
        const clientIp = getClientIp(req);
        const userAgent = req.headers['user-agent'] || 'Unknown';
        const agreementRecord = {
          id: agreementId,
          userName: fullName.trim(),
          contact: (phone || email || '').trim(),
          agreementType: 'Vendor Terms',
          version: 'v1.0',
          acceptedAt: isoNow,
          status: true,
          context: 'vendor_form',
          ip: clientIp,
          userAgent: userAgent,
          relatedEntityId: vendorId
        };
        const vendorRecord = {
          id: vendorId,
          fullName: fullName.trim(),
          businessName: (businessName || fullName).trim(),
          phone: phone.trim(),
          email: (email || '').trim(),
          category: category.trim(),
          specialties: Array.isArray(specialties) ? specialties : [category.trim()],
          experienceYears: experienceYears.toString(),
          operatingAreas: (operatingAreas || 'All major metropolitan areas').trim(),
          regNumber: (regNumber || '').trim(),
          address: (address || '').trim(),
          agreementType: 'Vendor Terms',
          version: 'v1.0',
          acceptedAt: isoNow,
          agreementId: agreementId,
          verificationStatus: 'pending_verification',
          rating: 5.0,
          jobsCompleted: 0,
          createdAt: isoNow
        };

        db.agreements.push(agreementRecord);
        db.vendors.push(vendorRecord);
        writeDb(db);

        return sendJson(res, 201, {
          success: true,
          vendorId: vendorId,
          agreementId: agreementId,
          message: 'Vendor application submitted successfully! Our compliance team will review your credentials for verification.'
        });
      }
      if (pathname === '/api/contact' && method === 'POST') {
        const body = await parseJsonBody(req);
        const { name, email, phone, subject, message } = body;
        if (!name || !message || (!email && !phone)) {
          return sendJson(res, 400, {
            success: false,
            error: 'Please provide your name, message, and at least one contact method (email or phone).'
          });
        }
        const db = readDb();
        const msgId = 'MSG-' + crypto.randomBytes(3).toString('hex').toUpperCase();
        const msgRecord = {
          id: msgId,
          name: name.trim(),
          email: (email || '').trim(),
          phone: (phone || '').trim(),
          subject: (subject || 'General Inquiry').trim(),
          message: message.trim(),
          createdAt: new Date().toISOString()
        };
        db.messages = db.messages || [];
        db.messages.push(msgRecord);
        writeDb(db);
        return sendJson(res, 201, {
          success: true,
          message: 'Message received! Our customer support desk will respond shortly.'
        });
      }
      if (pathname === '/api/agreements' && method === 'GET') {
        const db = readDb();
        const typeFilter = urlObj.searchParams.get('type');
        let records = db.agreements || [];
        if (typeFilter) {
          records = records.filter(a => a.agreementType.toLowerCase().includes(typeFilter.toLowerCase()));
        }
        return sendJson(res, 200, {
          success: true,
          total: records.length,
          data: records
        });
      }
      if (pathname === '/api/requests' && method === 'GET') {
        const db = readDb();
        return sendJson(res, 200, {
          success: true,
          total: (db.requests || []).length,
          data: (db.requests || []).reverse()
        });
      }
      if (pathname === '/api/vendors' && method === 'GET') {
        const db = readDb();
        return sendJson(res, 200, {
          success: true,
          total: (db.vendors || []).length,
          data: (db.vendors || []).reverse()
        });
      }
      if (pathname === '/api/stats' && method === 'GET') {
        const db = readDb();
        return sendJson(res, 200, {
          success: true,
          stats: {
            totalRequests: (db.requests || []).length + 1850,
            verifiedVendors: (db.vendors || []).length + 420,
            agreementsSigned: (db.agreements || []).length + 2270,
            satisfactionRate: 98.6,
            serviceCategories: 12
          }
        });
      }

      return sendJson(res, 404, { success: false, error: 'API route not found' });
    } catch (apiErr) {
      console.error('API Error:', apiErr);
      return sendJson(res, 500, { success: false, error: apiErr.message || 'Server error' });
    }
  }
  let filePath = '';
  if (pathname === '/' || pathname === '/index.html') {
    filePath = path.join(PUBLIC_DIR, 'index.html');
  } else if (pathname === '/request-service' || pathname === '/request') {
    filePath = path.join(PUBLIC_DIR, 'request-service.html');
  } else if (pathname === '/become-vendor' || pathname === '/vendors') {
    filePath = path.join(PUBLIC_DIR, 'become-vendor.html');
  } else if (pathname === '/client-terms') {
    filePath = path.join(PUBLIC_DIR, 'client-terms.html');
  } else if (pathname === '/vendor-terms') {
    filePath = path.join(PUBLIC_DIR, 'vendor-terms.html');
  } else if (pathname === '/privacy-policy') {
    filePath = path.join(PUBLIC_DIR, 'privacy-policy.html');
  } else if (pathname === '/disclaimer') {
    filePath = path.join(PUBLIC_DIR, 'disclaimer.html');
  } else if (pathname === '/about' || pathname === '/how-it-works') {
    filePath = path.join(PUBLIC_DIR, 'about.html');
  } else if (pathname === '/contact') {
    filePath = path.join(PUBLIC_DIR, 'contact.html');
  } else if (pathname === '/admin' || pathname === '/dashboard') {
    filePath = path.join(PUBLIC_DIR, 'admin.html');
  } else {
    filePath = path.join(PUBLIC_DIR, pathname);
  }
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Access Denied');
  }
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>404 - Page Not Found | ALLFIX Services Xpress</title>
          <link rel="stylesheet" href="/css/style.css">
          <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        </head>
        <body style="min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 2rem; background: #F8FAFC;">
          <div style="max-width: 500px; background: white; padding: 3rem 2rem; border-radius: 24px; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08); border: 1px solid #E2E8F0;">
            <div style="font-size: 4rem; font-weight: 800; color: #F97316; line-height: 1; margin-bottom: 1rem;">404</div>
            <h1 style="font-size: 1.5rem; color: #0F172A; margin-bottom: 0.75rem;">Page Not Found</h1>
            <p style="color: #64748B; margin-bottom: 2rem;">The page you are looking for doesn't exist or has moved.</p>
            <a href="/" class="btn btn-primary" style="display: inline-block; padding: 0.85rem 1.75rem; background: #F97316; color: white; border-radius: 12px; font-weight: 600; text-decoration: none;">Return to Home</a>
          </div>
        </body>
        </html>
      `);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400'
    });

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  ALLFIX Services Xpress Web Server Running!`);
  console.log(`  URL: http://localhost:${PORT}`);
  console.log(`  Environment: Production / Ready`);
  console.log(`======================================================\n`);
});
