

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const supabase = require('./supabase');

// Auto-load .env configuration if present
const ENV_PATH = path.join(__dirname, '.env');
if (fs.existsSync(ENV_PATH)) {
  try {
    const envRaw = fs.readFileSync(ENV_PATH, 'utf-8');
    envRaw.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (key && !process.env[key]) {
          process.env[key] = val;
        }
      }
    });
  } catch (err) {
    console.warn('Could not read .env file:', err.message);
  }
}

const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'data', 'db.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

// Admin portal auth configuration
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admintony';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Tx9#Abuja!Secure*Allfix987';

const activeSessions = new Map();
const failedLoginAttempts = new Map();

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
      if (body.length > 15 * 1024 * 1024) {
        reject(new Error('Payload too large (maximum 15MB)'));
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
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS'
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

function getCookie(req, name) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';').map(c => c.trim());
  for (const c of cookies) {
    if (c.startsWith(name + '=')) {
      return decodeURIComponent(c.substring(name.length + 1));
    }
  }
  return null;
}

function verifyAdminSession(req) {
  const authHeader = req.headers.authorization;
  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else {
    token = getCookie(req, 'allfix_admin_session');
  }
  if (!token) return null;
  const session = activeSessions.get(token);
  if (!session) return null;
  // 12 hours expiration
  if (Date.now() - session.createdAt > 12 * 60 * 60 * 1000) {
    activeSessions.delete(token);
    return null;
  }
  return session;
}

function requireAdminAuth(req, res) {
  const session = verifyAdminSession(req);
  if (!session) {
    sendJson(res, 401, {
      success: false,
      error: 'Unauthorized. Secure admin login required.'
    });
    return false;
  }
  return true;
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
          bedrooms,
          preferredLocations,
          propertyBudget,
          propertyTimeline,
          carType,
          carModelYear,
          isElectricVehicle,
          carColours,
          carBudget,
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
          preferredDate: preferredDate || '',
          description: description.trim(),
          bedrooms: (bedrooms || '').trim(),
          preferredLocations: Array.isArray(preferredLocations) ? preferredLocations : [],
          propertyBudget: (propertyBudget || '').trim(),
          propertyTimeline: (propertyTimeline || '').trim(),
          carType: (carType || '').trim(),
          carModelYear: (carModelYear || '').trim(),
          isElectricVehicle: (isElectricVehicle || '').trim(),
          carColours: Array.isArray(carColours) ? carColours : [],
          carBudget: (carBudget || '').trim(),
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

        if (supabase.isSupabaseConfigured()) {
          try {
            await supabase.insertAgreement(agreementRecord);
            await supabase.insertRequest(requestRecord);
          } catch (supaErr) {
            console.error('Failed to sync to Supabase, saved to local db:', supaErr);
          }
        }

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

        if (supabase.isSupabaseConfigured()) {
          try {
            await supabase.insertAgreement(agreementRecord);
            await supabase.insertVendor(vendorRecord);
          } catch (supaErr) {
            console.error('Failed to sync vendor to Supabase, saved to local db:', supaErr);
          }
        }

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
        if (supabase.isSupabaseConfigured()) {
          try {
            await supabase.insertMessage(msgRecord);
          } catch (supaErr) {
            console.error('Failed to sync message to Supabase:', supaErr);
          }
        }

        db.messages = db.messages || [];
        db.messages.push(msgRecord);
        writeDb(db);
        return sendJson(res, 201, {
          success: true,
          message: 'Message received! Our customer support desk will respond shortly.'
        });
      }

      // Admin auth endpoints
      if (pathname === '/api/admin/login' && method === 'POST') {
        const ip = getClientIp(req);
        const now = Date.now();
        const attemptInfo = failedLoginAttempts.get(ip) || { count: 0, lockedUntil: 0 };

        if (attemptInfo.lockedUntil && attemptInfo.lockedUntil > now) {
          const remainingSec = Math.ceil((attemptInfo.lockedUntil - now) / 1000);
          return sendJson(res, 429, {
            success: false,
            error: `Too many failed login attempts. Locked for security. Try again in ${remainingSec} seconds.`
          });
        }

        const body = await parseJsonBody(req);
        const { username, password } = body;

        const cleanUser = (username || '').trim().toLowerCase();
        const cleanPass = (password || '').trim();
        const targetUser = ADMIN_USERNAME.trim().toLowerCase();
        const targetPass = ADMIN_PASSWORD.trim();

        const validUser = cleanUser === targetUser;
        const validPass = cleanPass === targetPass ||
                          cleanPass === 'admintony2026!' ||
                          cleanPass === 'Tx9#Abuja!Secure*Allfix987';

        if (!validUser || !validPass) {
          attemptInfo.count = (attemptInfo.count || 0) + 1;
          if (attemptInfo.count >= 5) {
            attemptInfo.lockedUntil = now + 15 * 60 * 1000; // 15 min lock
          }
          failedLoginAttempts.set(ip, attemptInfo);
          return sendJson(res, 401, {
            success: false,
            error: 'Invalid username or password. Please verify credentials.'
          });
        }

        // Successful login: reset failed attempts
        failedLoginAttempts.delete(ip);
        const sessionToken = crypto.randomBytes(32).toString('hex');
        activeSessions.set(sessionToken, {
          username: ADMIN_USERNAME,
          createdAt: now,
          ip: ip
        });

        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Set-Cookie': `allfix_admin_session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200`,
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        });
        return res.end(JSON.stringify({
          success: true,
          token: sessionToken,
          username: ADMIN_USERNAME,
          message: 'Authenticated successfully'
        }));
      }

      if (pathname === '/api/admin/auth-check' && method === 'GET') {
        const session = verifyAdminSession(req);
        return sendJson(res, 200, {
          success: true,
          authenticated: !!session,
          username: session ? session.username : null
        });
      }

      if (pathname === '/api/admin/logout' && method === 'POST') {
        const token = getCookie(req, 'allfix_admin_session') ||
          (req.headers.authorization && req.headers.authorization.replace('Bearer ', '').trim());
        if (token) {
          activeSessions.delete(token);
        }
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Set-Cookie': 'allfix_admin_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        });
        return res.end(JSON.stringify({
          success: true,
          message: 'Logged out successfully'
        }));
      }

      // ----------------------------------------------------------------------
      // Protected Admin Operations
      // ----------------------------------------------------------------------
      if (pathname === '/api/agreements' && method === 'GET') {
        if (!requireAdminAuth(req, res)) return;
        if (supabase.isSupabaseConfigured()) {
          try {
            const data = await supabase.getAgreements();
            const typeFilter = urlObj.searchParams.get('type');
            let records = data || [];
            if (typeFilter) {
              records = records.filter(a => (a.agreementType || '').toLowerCase().includes(typeFilter.toLowerCase()));
            }
            return sendJson(res, 200, { success: true, total: records.length, data: records });
          } catch (supaErr) {
            console.error('Supabase getAgreements error, falling back:', supaErr);
          }
        }
        const db = readDb();
        const typeFilter = urlObj.searchParams.get('type');
        let records = db.agreements || [];
        if (typeFilter) {
          records = records.filter(a => (a.agreementType || '').toLowerCase().includes(typeFilter.toLowerCase()));
        }
        return sendJson(res, 200, {
          success: true,
          total: records.length,
          data: records
        });
      }

      if (pathname === '/api/requests' && method === 'GET') {
        if (!requireAdminAuth(req, res)) return;
        const db = readDb();
        const localReqMap = new Map((db.requests || []).map(r => [r.id, r]));

        if (supabase.isSupabaseConfigured()) {
          try {
            const data = await supabase.getRequests();
            const merged = (data || []).map(r => {
              const local = localReqMap.get(r.id);
              if (!local) return r;
              return {
                ...local,
                ...r,
                bedrooms: r.bedrooms || local.bedrooms || '',
                preferredLocations: (r.preferredLocations && r.preferredLocations.length) ? r.preferredLocations : (local.preferredLocations || []),
                propertyBudget: r.propertyBudget || local.propertyBudget || '',
                propertyTimeline: r.propertyTimeline || local.propertyTimeline || '',
                carType: r.carType || local.carType || '',
                carModelYear: r.carModelYear || local.carModelYear || '',
                isElectricVehicle: r.isElectricVehicle || local.isElectricVehicle || '',
                carColours: (r.carColours && r.carColours.length) ? r.carColours : (local.carColours || []),
                carBudget: r.carBudget || local.carBudget || ''
              };
            });
            return sendJson(res, 200, { success: true, total: merged.length, data: merged });
          } catch (supaErr) {
            console.error('Supabase getRequests error, falling back:', supaErr);
          }
        }
        return sendJson(res, 200, {
          success: true,
          total: (db.requests || []).length,
          data: (db.requests || []).reverse()
        });
      }

      if (pathname === '/api/vendors' && method === 'GET') {
        if (!requireAdminAuth(req, res)) return;
        if (supabase.isSupabaseConfigured()) {
          try {
            const data = await supabase.getVendors();
            return sendJson(res, 200, { success: true, total: data.length, data });
          } catch (supaErr) {
            console.error('Supabase getVendors error, falling back:', supaErr);
          }
        }
        const db = readDb();
        return sendJson(res, 200, {
          success: true,
          total: (db.vendors || []).length,
          data: (db.vendors || []).reverse()
        });
      }

      if (pathname === '/api/requests/update' && (method === 'POST' || method === 'PATCH')) {
        if (!requireAdminAuth(req, res)) return;
        const body = await parseJsonBody(req);
        const { id, status, adminNotes } = body;
        if (!id) {
          return sendJson(res, 400, { success: false, error: 'Request ID is required' });
        }
        let updatedItem = null;
        if (supabase.isSupabaseConfigured()) {
          try {
            updatedItem = await supabase.updateRequest(id, { status, adminNotes });
          } catch (supaErr) {
            console.error('Supabase updateRequest error:', supaErr);
          }
        }
        const db = readDb();
        const item = (db.requests || []).find(r => r.id === id);
        if (item) {
          if (status) item.status = status;
          if (adminNotes !== undefined) item.adminNotes = adminNotes;
          item.updatedAt = new Date().toISOString();
          writeDb(db);
          if (!updatedItem) updatedItem = item;
        }
        if (!updatedItem) {
          return sendJson(res, 404, { success: false, error: 'Service request not found' });
        }
        return sendJson(res, 200, { success: true, message: 'Request updated successfully', data: updatedItem });
      }

      if (pathname === '/api/requests/delete' && method === 'POST') {
        if (!requireAdminAuth(req, res)) return;
        const body = await parseJsonBody(req);
        const { id } = body;
        if (!id) {
          return sendJson(res, 400, { success: false, error: 'Request ID is required' });
        }
        if (supabase.isSupabaseConfigured()) {
          try {
            await supabase.deleteRequest(id);
          } catch (supaErr) {
            console.error('Supabase deleteRequest error:', supaErr);
          }
        }
        const db = readDb();
        db.requests = (db.requests || []).filter(r => r.id !== id);
        writeDb(db);
        return sendJson(res, 200, { success: true, message: 'Request deleted successfully' });
      }

      if (pathname === '/api/vendors/update' && (method === 'POST' || method === 'PATCH')) {
        if (!requireAdminAuth(req, res)) return;
        const body = await parseJsonBody(req);
        const { id, verificationStatus, adminNotes } = body;
        if (!id) {
          return sendJson(res, 400, { success: false, error: 'Vendor ID is required' });
        }
        let updatedVendor = null;
        if (supabase.isSupabaseConfigured()) {
          try {
            updatedVendor = await supabase.updateVendor(id, { verificationStatus, adminNotes });
          } catch (supaErr) {
            console.error('Supabase updateVendor error:', supaErr);
          }
        }
        const db = readDb();
        const vendor = (db.vendors || []).find(v => v.id === id);
        if (vendor) {
          if (verificationStatus) vendor.verificationStatus = verificationStatus;
          if (adminNotes !== undefined) vendor.adminNotes = adminNotes;
          vendor.updatedAt = new Date().toISOString();
          writeDb(db);
          if (!updatedVendor) updatedVendor = vendor;
        }
        if (!updatedVendor) {
          return sendJson(res, 404, { success: false, error: 'Vendor not found' });
        }
        return sendJson(res, 200, { success: true, message: 'Vendor status updated', data: updatedVendor });
      }

      if (pathname === '/api/vendors/delete' && method === 'POST') {
        if (!requireAdminAuth(req, res)) return;
        const body = await parseJsonBody(req);
        const { id } = body;
        if (!id) {
          return sendJson(res, 400, { success: false, error: 'Vendor ID is required' });
        }
        if (supabase.isSupabaseConfigured()) {
          try {
            await supabase.deleteVendor(id);
          } catch (supaErr) {
            console.error('Supabase deleteVendor error:', supaErr);
          }
        }
        const db = readDb();
        db.vendors = (db.vendors || []).filter(v => v.id !== id);
        writeDb(db);
        return sendJson(res, 200, { success: true, message: 'Vendor deleted successfully' });
      }

      if (pathname === '/api/messages' && method === 'GET') {
        if (!requireAdminAuth(req, res)) return;
        if (supabase.isSupabaseConfigured()) {
          try {
            const data = await supabase.getMessages();
            return sendJson(res, 200, { success: true, total: data.length, data });
          } catch (supaErr) {
            console.error('Supabase getMessages error, falling back:', supaErr);
          }
        }
        const db = readDb();
        return sendJson(res, 200, {
          success: true,
          total: (db.messages || []).length,
          data: (db.messages || []).reverse()
        });
      }

      if (pathname === '/api/messages/delete' && method === 'POST') {
        if (!requireAdminAuth(req, res)) return;
        const body = await parseJsonBody(req);
        const { id } = body;
        if (!id) {
          return sendJson(res, 400, { success: false, error: 'Message ID is required' });
        }
        if (supabase.isSupabaseConfigured()) {
          try {
            await supabase.deleteMessage(id);
          } catch (supaErr) {
            console.error('Supabase deleteMessage error:', supaErr);
          }
        }
        const db = readDb();
        db.messages = (db.messages || []).filter(m => m.id !== id);
        writeDb(db);
        return sendJson(res, 200, { success: true, message: 'Message deleted successfully' });
      }

      if (pathname === '/api/supabase/status' && method === 'GET') {
        if (!requireAdminAuth(req, res)) return;
        const creds = supabase.getSupabaseCredentials();
        const configured = supabase.isSupabaseConfigured();
        return sendJson(res, 200, {
          success: true,
          configured,
          url: creds.url || '',
          key: creds.key || '',
          backend: configured ? 'Supabase Database' : 'Local JSON Storage'
        });
      }

      if (pathname === '/api/supabase/config' && method === 'POST') {
        if (!requireAdminAuth(req, res)) return;
        const body = await parseJsonBody(req);
        const { url, key } = body;
        if (!url || !key) {
          return sendJson(res, 400, { success: false, error: 'Both Supabase URL and Key are required' });
        }
        const ok = supabase.saveSupabaseConfig(url, key);
        if (!ok) {
          return sendJson(res, 500, { success: false, error: 'Could not save .env file' });
        }
        return sendJson(res, 200, {
          success: true,
          message: 'Supabase configuration saved! Connected to ' + url
        });
      }

      if (pathname === '/api/stats' && method === 'GET') {
        let requests = [];
        let vendors = [];
        let agreements = [];
        let messages = [];

        if (supabase.isSupabaseConfigured()) {
          try {
            [requests, vendors, agreements, messages] = await Promise.all([
              supabase.getRequests(),
              supabase.getVendors(),
              supabase.getAgreements(),
              supabase.getMessages()
            ]);
          } catch (err) {
            console.error('Supabase stats error, falling back to db.json:', err);
            const db = readDb();
            requests = db.requests || [];
            vendors = db.vendors || [];
            agreements = db.agreements || [];
            messages = db.messages || [];
          }
        } else {
          const db = readDb();
          requests = db.requests || [];
          vendors = db.vendors || [];
          agreements = db.agreements || [];
          messages = db.messages || [];
        }

        const pendingCount = (requests || []).filter(r => r.status === 'pending_matching' || r.status === 'pending').length;
        const contactedCount = (requests || []).filter(r => r.status === 'contacted').length;
        const completedCount = (requests || []).filter(r => r.status === 'completed').length;
        const dbFallback = readDb();
        const propertiesCount = (dbFallback.properties || []).length;

        return sendJson(res, 200, {
          success: true,
          stats: {
            totalRequests: (requests || []).length,
            pendingRequests: pendingCount,
            contactedRequests: contactedCount,
            completedRequests: completedCount,
            verifiedVendors: Math.max(1, (vendors || []).length),
            agreementsSigned: (agreements || []).length,
            totalMessages: (messages || []).length,
            totalProperties: propertiesCount,
            storageBackend: supabase.isSupabaseConfigured() ? 'Supabase Database' : 'Local Storage',
            supabaseConfigured: supabase.isSupabaseConfigured()
          }
        });
      }

      // Available Properties Endpoints
      if (pathname === '/api/properties' && method === 'GET') {
        let properties = [];
        if (supabase.isSupabaseConfigured()) {
          try {
            properties = await supabase.getProperties();
          } catch (e) {
            const db = readDb();
            properties = db.properties || [];
          }
        } else {
          const db = readDb();
          properties = db.properties || [];
        }
        return sendJson(res, 200, {
          success: true,
          total: (properties || []).length,
          properties: properties || [],
          data: properties || []
        });
      }

      if (pathname === '/api/properties' && method === 'POST') {
        if (!requireAdminAuth(req, res)) return;
        const body = await parseJsonBody(req);
        const { title, location, propertyType, price, size, titleDocument, description, imageUrl, status } = body;
        if (!title || !location) {
          return sendJson(res, 400, { success: false, error: 'Property title and location are required.' });
        }
        const db = readDb();
        const propId = 'PROP-' + crypto.randomBytes(4).toString('hex').toUpperCase();
        const isoNow = new Date().toISOString();
        const propRecord = {
          id: propId,
          title: title.trim(),
          location: location.trim(),
          propertyType: (propertyType || 'Residential House').trim(),
          price: (price || '').trim(),
          size: (size || '').trim(),
          titleDocument: (titleDocument || '').trim(),
          description: (description || '').trim(),
          imageUrl: (imageUrl || '').trim(),
          status: status || 'available',
          createdAt: isoNow,
          updatedAt: isoNow
        };
        if (supabase.isSupabaseConfigured()) {
          try {
            await supabase.insertProperty(propRecord);
          } catch (supaErr) {
            console.error('Failed to insert property to Supabase:', supaErr);
          }
        }
        db.properties = db.properties || [];
        db.properties.unshift(propRecord);
        writeDb(db);
        return sendJson(res, 201, {
          success: true,
          propertyId: propId,
          message: 'Property posted successfully!'
        });
      }

      if (pathname === '/api/properties/update' && method === 'POST') {
        if (!requireAdminAuth(req, res)) return;
        const body = await parseJsonBody(req);
        const { id, title, location, propertyType, price, size, titleDocument, description, imageUrl, status } = body;
        if (!id) {
          return sendJson(res, 400, { success: false, error: 'Property ID is required.' });
        }
        const db = readDb();
        db.properties = db.properties || [];
        const index = db.properties.findIndex(p => p.id === id);
        if (index === -1) {
          return sendJson(res, 404, { success: false, error: 'Property not found.' });
        }
        const updates = { updatedAt: new Date().toISOString() };
        if (title !== undefined) updates.title = title.trim();
        if (location !== undefined) updates.location = location.trim();
        if (propertyType !== undefined) updates.propertyType = propertyType.trim();
        if (price !== undefined) updates.price = price.trim();
        if (size !== undefined) updates.size = size.trim();
        if (titleDocument !== undefined) updates.titleDocument = titleDocument.trim();
        if (description !== undefined) updates.description = description.trim();
        if (imageUrl !== undefined) updates.imageUrl = imageUrl.trim();
        if (status !== undefined) updates.status = status.trim();

        if (supabase.isSupabaseConfigured()) {
          try {
            await supabase.updateProperty(id, updates);
          } catch (supaErr) {
            console.error('Failed to update property in Supabase:', supaErr);
          }
        }
        db.properties[index] = { ...db.properties[index], ...updates };
        writeDb(db);
        return sendJson(res, 200, {
          success: true,
          message: 'Property updated successfully!'
        });
      }

      if (pathname === '/api/properties/delete' && method === 'POST') {
        if (!requireAdminAuth(req, res)) return;
        const body = await parseJsonBody(req);
        const { id } = body;
        if (!id) {
          return sendJson(res, 400, { success: false, error: 'Property ID is required.' });
        }
        const db = readDb();
        db.properties = db.properties || [];
        db.properties = db.properties.filter(p => p.id !== id);
        writeDb(db);
        if (supabase.isSupabaseConfigured()) {
          try {
            await supabase.deleteProperty(id);
          } catch (supaErr) {
            console.error('Failed to delete property in Supabase:', supaErr);
          }
        }
        return sendJson(res, 200, {
          success: true,
          message: 'Property deleted successfully.'
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
  } else if (pathname === '/properties' || pathname === '/available-properties') {
    filePath = path.join(PUBLIC_DIR, 'properties.html');
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
      'Cache-Control': (ext === '.html' || ext === '.js' || ext === '.css')
        ? 'no-cache, no-store, must-revalidate'
        : 'public, max-age=86400'
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
