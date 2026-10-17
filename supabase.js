const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const ENV_PATH = path.join(__dirname, '.env');

function loadEnvFile() {
  const env = {};
  if (fs.existsSync(ENV_PATH)) {
    try {
      const content = fs.readFileSync(ENV_PATH, 'utf-8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          env[key] = val;
        }
      });
    } catch (e) {
      console.error('Error reading .env file:', e);
    }
  }
  return env;
}

let envConfig = loadEnvFile();

function getSupabaseCredentials() {
  envConfig = loadEnvFile();
  const url = process.env.SUPABASE_URL || envConfig.SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY ||
              envConfig.SUPABASE_SERVICE_ROLE_KEY || envConfig.SUPABASE_KEY || envConfig.SUPABASE_ANON_KEY || '';
  return { url, key };
}

let client = null;

function initClient() {
  const { url, key } = getSupabaseCredentials();
  if (url && key && url.startsWith('http')) {
    try {
      client = createClient(url, key);
      return client;
    } catch (e) {
      console.error('Failed to initialize Supabase client:', e);
      client = null;
      return null;
    }
  }
  client = null;
  return null;
}

initClient();

function isSupabaseConfigured() {
  const { url, key } = getSupabaseCredentials();
  return Boolean(url && key && url.startsWith('http'));
}

function saveSupabaseConfig(url, key) {
  try {
    let existing = '';
    if (fs.existsSync(ENV_PATH)) {
      existing = fs.readFileSync(ENV_PATH, 'utf-8');
    }
    const lines = existing.split('\n').filter(l => !l.startsWith('SUPABASE_URL=') && !l.startsWith('SUPABASE_KEY=') && !l.startsWith('SUPABASE_ANON_KEY='));
    lines.push(`SUPABASE_URL=${url.trim()}`);
    lines.push(`SUPABASE_KEY=${key.trim()}`);
    fs.writeFileSync(ENV_PATH, lines.join('\n').trim() + '\n', 'utf-8');
    initClient();
    return true;
  } catch (err) {
    console.error('Failed to save .env file:', err);
    return false;
  }
}

// Map database columns to app schema
function mapRequestFromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    customerName: row.customer_name,
    phone: row.phone,
    email: row.email || '',
    category: row.category,
    service: row.service || row.category,
    location: row.location || 'Not specified',
    urgency: row.urgency || 'Medium',
    preferredDate: row.preferred_date || '',
    description: row.description || '',
    bedrooms: row.bedrooms || '',
    preferredLocations: Array.isArray(row.preferred_locations) ? row.preferred_locations : [],
    propertyBudget: row.property_budget || '',
    propertyTimeline: row.property_timeline || '',
    carType: row.car_type || '',
    carModelYear: row.car_model_year || '',
    isElectricVehicle: row.is_electric_vehicle || '',
    carColours: Array.isArray(row.car_colours) ? row.car_colours : [],
    carBudget: row.car_budget || '',
    propertyTypes: Array.isArray(row.property_types) ? row.property_types : [],
    propertyTypeOther: row.property_type_other || '',
    constructionDescription: row.construction_description || '',
    landSize: row.land_size || '',
    landSizeOther: row.land_size_other || '',
    landStatus: row.land_status || '',
    agreementType: 'Client Terms',
    version: row.terms_version || 'v1.0',
    agreementId: row.agreement_id || '',
    status: row.status || 'pending_matching',
    adminNotes: row.admin_notes || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapVendorFromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    fullName: row.full_name,
    businessName: row.business_name || row.full_name,
    phone: row.phone,
    email: row.email || '',
    category: row.category,
    specialties: Array.isArray(row.specialties) ? row.specialties : [],
    experienceYears: row.experience_years || '3-5',
    operatingAreas: row.operating_areas || '',
    regNumber: row.reg_number || '',
    address: row.address || '',
    verificationStatus: row.verification_status || 'pending',
    adminNotes: row.admin_notes || '',
    agreementId: row.agreement_id || '',
    version: row.terms_version || 'v1.0',
    agreementType: 'Vendor Terms',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapPropertyFromDb(row) {
  if (!row) return null;
  const images = Array.isArray(row.images) ? row.images : (row.image_url ? [row.image_url] : []);
  return {
    id: row.id,
    title: row.title,
    location: row.location,
    propertyType: row.property_type || 'Residential',
    price: row.price || '',
    size: row.size || '',
    titleDocument: row.title_document || '',
    description: row.description || '',
    imageUrl: row.image_url || (images.length > 0 ? images[0] : ''),
    images: images,
    status: row.status || 'available',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapVehicleFromDb(row) {
  if (!row) return null;
  const images = Array.isArray(row.images) ? row.images : (row.image_url ? [row.image_url] : []);
  return {
    id: row.id,
    title: row.title,
    make: row.make || '',
    model: row.model || '',
    year: row.year || '',
    vehicleType: row.vehicle_type || 'SUV / Jeep',
    price: row.price || '',
    mileage: row.mileage || '',
    transmission: row.transmission || 'Automatic',
    fuelType: row.fuel_type || 'Petrol',
    condition: row.condition || 'Foreign Used (Tokunbo)',
    color: row.color || '',
    location: row.location || 'Abuja',
    description: row.description || '',
    imageUrl: row.image_url || (images.length > 0 ? images[0] : ''),
    images: images,
    status: row.status || 'available',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapMarketingRequestFromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    assetType: row.asset_type,
    ownerName: row.owner_name,
    phone: row.phone,
    email: row.email || '',
    location: row.location || '',
    price: row.price || '',
    description: row.description || '',
    images: Array.isArray(row.images) ? row.images : [],
    // Property specific
    propertyType: row.property_type || '',
    listingPurpose: row.listing_purpose || 'For Sale',
    titleDocument: row.title_document || '',
    landSize: row.land_size || '',
    // Car specific
    carType: row.car_type || '',
    carColour: row.car_colour || '',
    carMakeModelYear: row.car_make_model_year || '',
    customDutyPaid: row.custom_duty_paid || 'Yes',
    carCondition: row.car_condition || 'Fairly Used (Tokunbo)',
    accidentHistory: row.accident_history || 'Accident Free',
    engineGearStatus: row.engine_gear_status || 'Untempered engine and gear',
    firstBody: row.first_body || 'Yes',
    // Management & Compliance
    status: row.status || 'pending_review',
    adminNotes: row.admin_notes || '',
    agreementId: row.agreement_id || '',
    termsVersion: row.terms_version || 'v1.0',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapVendorWorkFromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    jobType: row.job_type,
    title: row.title,
    description: row.description,
    vendorName: row.vendor_name || '',
    vendorId: row.vendor_id || '',
    location: row.location || '',
    imageUrl: row.image_url || '',
    images: Array.isArray(row.images) ? row.images : [],
    status: row.status || 'published',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

module.exports = {
  isSupabaseConfigured,
  getSupabaseCredentials,
  saveSupabaseConfig,
  getClient: () => client || initClient(),

  async getRequests() {
    const c = client || initClient();
    if (!c) return null;
    const { data, error } = await c.from('requests').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapRequestFromDb);
  },

  async insertRequest(r) {
    const c = client || initClient();
    if (!c) return null;
    const baseRow = {
      id: r.id,
      customer_name: r.customerName,
      phone: r.phone,
      email: r.email,
      category: r.category,
      service: r.service,
      location: r.location,
      urgency: r.urgency || 'Medium',
      preferred_date: r.preferredDate || '',
      description: r.description,
      property_types: r.propertyTypes || [],
      property_type_other: r.propertyTypeOther || '',
      construction_description: r.constructionDescription || '',
      land_size: r.landSize || '',
      land_size_other: r.landSizeOther || '',
      land_status: r.landStatus || '',
      status: r.status || 'pending_matching',
      admin_notes: r.adminNotes || '',
      agreement_id: r.agreementId,
      terms_version: r.termsVersion || 'v1.0'
    };

    const fullRow = {
      ...baseRow,
      bedrooms: r.bedrooms || '',
      preferred_locations: r.preferredLocations || [],
      property_budget: r.propertyBudget || '',
      property_timeline: r.propertyTimeline || '',
      car_type: r.carType || '',
      car_model_year: r.carModelYear || '',
      is_electric_vehicle: r.isElectricVehicle || '',
      car_colours: r.carColours || [],
      car_budget: r.carBudget || ''
    };

    try {
      const { data, error } = await c.from('requests').insert([fullRow]).select();
      if (error) throw error;
      return mapRequestFromDb(data[0]);
    } catch (fullErr) {
      // Graceful fallback in case new columns are not yet applied via SQL migration
      const { data, error } = await c.from('requests').insert([baseRow]).select();
      if (error) throw error;
      return mapRequestFromDb(data[0]);
    }
  },

  async updateRequest(id, updates) {
    const c = client || initClient();
    if (!c) return null;
    const row = { updated_at: new Date().toISOString() };
    if (updates.status !== undefined) row.status = updates.status;
    if (updates.adminNotes !== undefined) row.admin_notes = updates.adminNotes;

    const { data, error } = await c.from('requests').update(row).eq('id', id).select();
    if (error) throw error;
    return mapRequestFromDb(data[0]);
  },

  async deleteRequest(id) {
    const c = client || initClient();
    if (!c) return null;
    const { error } = await c.from('requests').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  async getVendors() {
    const c = client || initClient();
    if (!c) return null;
    const { data, error } = await c.from('vendors').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapVendorFromDb);
  },

  async insertVendor(v) {
    const c = client || initClient();
    if (!c) return null;
    const row = {
      id: v.id,
      full_name: v.fullName,
      business_name: v.businessName,
      phone: v.phone,
      email: v.email,
      category: v.category,
      specialties: v.specialties || [],
      experience_years: v.experienceYears,
      operating_areas: v.operatingAreas,
      reg_number: v.regNumber || '',
      address: v.address || '',
      verification_status: v.verificationStatus || 'pending',
      agreement_id: v.agreementId,
      terms_version: v.termsVersion || 'v1.0'
    };
    const { data, error } = await c.from('vendors').insert([row]).select();
    if (error) throw error;
    return mapVendorFromDb(data[0]);
  },

  async updateVendor(id, updates) {
    const c = client || initClient();
    if (!c) return null;
    const row = { updated_at: new Date().toISOString() };
    if (updates.verificationStatus !== undefined) row.verification_status = updates.verificationStatus;
    if (updates.adminNotes !== undefined) row.admin_notes = updates.adminNotes;

    const { data, error } = await c.from('vendors').update(row).eq('id', id).select();
    if (error) throw error;
    return mapVendorFromDb(data[0]);
  },

  async deleteVendor(id) {
    const c = client || initClient();
    if (!c) return null;
    const { error } = await c.from('vendors').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  async getAgreements() {
    const c = client || initClient();
    if (!c) return null;
    const { data, error } = await c.from('agreements').select('*').order('accepted_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(a => ({
      id: a.id,
      userName: a.user_name,
      contact: a.contact,
      agreementType: a.agreement_type,
      version: a.version,
      status: a.status,
      context: a.context,
      ip: a.ip,
      userAgent: a.user_agent,
      relatedEntityId: a.related_entity_id,
      acceptedAt: a.accepted_at
    }));
  },

  async insertAgreement(a) {
    const c = client || initClient();
    if (!c) return null;
    const row = {
      id: a.id,
      user_name: a.userName,
      contact: a.contact,
      agreement_type: a.agreementType,
      version: a.version,
      status: a.status !== undefined ? a.status : true,
      context: a.context || '',
      ip: a.ip || '',
      user_agent: a.userAgent || '',
      related_entity_id: a.relatedEntityId || '',
      accepted_at: a.acceptedAt || new Date().toISOString()
    };
    const { error } = await c.from('agreements').insert([row]);
    if (error) throw error;
    return true;
  },

  async getMessages() {
    const c = client || initClient();
    if (!c) return null;
    const { data, error } = await c.from('messages').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async insertMessage(m) {
    const c = client || initClient();
    if (!c) return null;
    const row = {
      id: m.id,
      name: m.name,
      email: m.email,
      phone: m.phone,
      subject: m.subject,
      message: m.message,
      created_at: m.createdAt || new Date().toISOString()
    };
    const { data, error } = await c.from('messages').insert([row]).select();
    if (error) throw error;
    return data[0];
  },

  async deleteMessage(id) {
    const c = client || initClient();
    if (!c) return null;
    const { error } = await c.from('messages').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  async getProperties() {
    const c = client || initClient();
    if (!c) return null;
    const { data, error } = await c.from('properties').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapPropertyFromDb);
  },

  async insertProperty(p) {
    const c = client || initClient();
    if (!c) return null;
    const imagesList = Array.isArray(p.images) ? p.images : (p.imageUrl ? [p.imageUrl] : []);
    const row = {
      id: p.id,
      title: p.title,
      location: p.location,
      property_type: p.propertyType || 'Residential',
      price: p.price || '',
      size: p.size || '',
      title_document: p.titleDocument || '',
      description: p.description || '',
      image_url: p.imageUrl || (imagesList[0] || ''),
      images: imagesList,
      status: p.status || 'available',
      created_at: p.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    try {
      const { data, error } = await c.from('properties').insert([row]).select();
      if (error) throw error;
      return mapPropertyFromDb(data[0]);
    } catch (err) {
      // Fallback without images column if not yet migrated
      const fallbackRow = { ...row };
      delete fallbackRow.images;
      const { data, error } = await c.from('properties').insert([fallbackRow]).select();
      if (error) throw error;
      return mapPropertyFromDb(data[0]);
    }
  },

  async updateProperty(id, updates) {
    const c = client || initClient();
    if (!c) return null;
    const row = { updated_at: new Date().toISOString() };
    if (updates.title !== undefined) row.title = updates.title;
    if (updates.location !== undefined) row.location = updates.location;
    if (updates.propertyType !== undefined) row.property_type = updates.propertyType;
    if (updates.price !== undefined) row.price = updates.price;
    if (updates.size !== undefined) row.size = updates.size;
    if (updates.titleDocument !== undefined) row.title_document = updates.titleDocument;
    if (updates.description !== undefined) row.description = updates.description;
    if (updates.imageUrl !== undefined) row.image_url = updates.imageUrl;
    if (updates.images !== undefined) row.images = updates.images;
    if (updates.status !== undefined) row.status = updates.status;

    try {
      const { data, error } = await c.from('properties').update(row).eq('id', id).select();
      if (error) throw error;
      return mapPropertyFromDb(data[0]);
    } catch (err) {
      const fallbackRow = { ...row };
      delete fallbackRow.images;
      const { data, error } = await c.from('properties').update(fallbackRow).eq('id', id).select();
      if (error) throw error;
      return mapPropertyFromDb(data[0]);
    }
  },

  async deleteProperty(id) {
    const c = client || initClient();
    if (!c) return null;
    const { error } = await c.from('properties').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  // ==============================================================================
  // Vehicles / Automobiles CRUD
  // ==============================================================================
  async getVehicles() {
    const c = client || initClient();
    if (!c) return null;
    try {
      const { data, error } = await c.from('vehicles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapVehicleFromDb);
    } catch (e) {
      console.warn('Supabase getVehicles warning:', e.message);
      return [];
    }
  },

  async insertVehicle(v) {
    const c = client || initClient();
    if (!c) return null;
    const imagesList = Array.isArray(v.images) ? v.images : (v.imageUrl ? [v.imageUrl] : []);
    const row = {
      id: v.id,
      title: v.title,
      make: v.make || '',
      model: v.model || '',
      year: v.year || '',
      vehicle_type: v.vehicleType || 'SUV / Jeep',
      price: v.price || '',
      mileage: v.mileage || '',
      transmission: v.transmission || 'Automatic',
      fuel_type: v.fuelType || 'Petrol',
      condition: v.condition || 'Foreign Used (Tokunbo)',
      color: v.color || '',
      location: v.location || 'Abuja',
      description: v.description || '',
      image_url: v.imageUrl || (imagesList[0] || ''),
      images: imagesList,
      status: v.status || 'available',
      created_at: v.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    try {
      const { data, error } = await c.from('vehicles').insert([row]).select();
      if (error) throw error;
      return mapVehicleFromDb(data[0]);
    } catch (err) {
      console.error('Supabase insertVehicle error:', err.message);
      return null;
    }
  },

  async updateVehicle(id, updates) {
    const c = client || initClient();
    if (!c) return null;
    const row = { updated_at: new Date().toISOString() };
    if (updates.title !== undefined) row.title = updates.title;
    if (updates.make !== undefined) row.make = updates.make;
    if (updates.model !== undefined) row.model = updates.model;
    if (updates.year !== undefined) row.year = updates.year;
    if (updates.vehicleType !== undefined) row.vehicle_type = updates.vehicleType;
    if (updates.price !== undefined) row.price = updates.price;
    if (updates.mileage !== undefined) row.mileage = updates.mileage;
    if (updates.transmission !== undefined) row.transmission = updates.transmission;
    if (updates.fuelType !== undefined) row.fuel_type = updates.fuelType;
    if (updates.condition !== undefined) row.condition = updates.condition;
    if (updates.color !== undefined) row.color = updates.color;
    if (updates.location !== undefined) row.location = updates.location;
    if (updates.description !== undefined) row.description = updates.description;
    if (updates.imageUrl !== undefined) row.image_url = updates.imageUrl;
    if (updates.images !== undefined) row.images = updates.images;
    if (updates.status !== undefined) row.status = updates.status;

    try {
      const { data, error } = await c.from('vehicles').update(row).eq('id', id).select();
      if (error) throw error;
      return mapVehicleFromDb(data[0]);
    } catch (err) {
      console.error('Supabase updateVehicle error:', err.message);
      return null;
    }
  },

  async deleteVehicle(id) {
    const c = client || initClient();
    if (!c) return null;
    try {
      const { error } = await c.from('vehicles').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Supabase deleteVehicle error:', e.message);
      return false;
    }
  },

  async getMarketingRequests() {
    const c = client || initClient();
    if (!c) return null;
    try {
      const { data, error } = await c.from('marketing_requests').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapMarketingRequestFromDb);
    } catch (err) {
      console.error('Supabase getMarketingRequests error:', err.message);
      return null;
    }
  },

  async insertMarketingRequest(m) {
    const c = client || initClient();
    if (!c) return null;
    const row = {
      id: m.id,
      asset_type: m.assetType,
      owner_name: m.ownerName,
      phone: m.phone,
      email: m.email || '',
      location: m.location,
      price: m.price || '',
      description: m.description || '',
      images: Array.isArray(m.images) ? m.images : [],
      // Property specific
      property_type: m.propertyType || '',
      listing_purpose: m.listingPurpose || 'For Sale',
      title_document: m.titleDocument || '',
      land_size: m.landSize || '',
      // Car specific
      car_type: m.carType || '',
      car_colour: m.carColour || '',
      car_make_model_year: m.carMakeModelYear || '',
      custom_duty_paid: m.customDutyPaid || 'Yes',
      car_condition: m.carCondition || 'Fairly Used (Tokunbo)',
      accident_history: m.accidentHistory || 'Accident Free',
      engine_gear_status: m.engineGearStatus || 'Untempered engine and gear',
      first_body: m.firstBody || 'Yes',
      // Status & compliance
      status: m.status || 'pending_review',
      admin_notes: m.adminNotes || '',
      agreement_id: m.agreementId || '',
      terms_version: m.termsVersion || 'v1.0',
      created_at: m.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    try {
      const { data, error } = await c.from('marketing_requests').insert([row]).select();
      if (error) throw error;
      return mapMarketingRequestFromDb(data[0]);
    } catch (err) {
      console.error('Supabase insertMarketingRequest error:', err.message);
      return null;
    }
  },

  async updateMarketingRequest(id, updates) {
    const c = client || initClient();
    if (!c) return null;
    const row = { updated_at: new Date().toISOString() };
    if (updates.status !== undefined) row.status = updates.status;
    if (updates.adminNotes !== undefined) row.admin_notes = updates.adminNotes;
    if (updates.price !== undefined) row.price = updates.price;
    if (updates.description !== undefined) row.description = updates.description;
    if (updates.images !== undefined) row.images = updates.images;
    try {
      const { data, error } = await c.from('marketing_requests').update(row).eq('id', id).select();
      if (error) throw error;
      return mapMarketingRequestFromDb(data[0]);
    } catch (err) {
      console.error('Supabase updateMarketingRequest error:', err.message);
      return null;
    }
  },

  async deleteMarketingRequest(id) {
    const c = client || initClient();
    if (!c) return null;
    try {
      const { error } = await c.from('marketing_requests').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Supabase deleteMarketingRequest error:', err.message);
      return false;
    }
  },

  async getVendorWorks(jobType) {
    const c = client || initClient();
    if (!c) return null;
    try {
      let query = c.from('vendor_works').select('*').order('created_at', { ascending: false });
      if (jobType && jobType !== 'all') {
        query = query.ilike('job_type', `%${jobType}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(mapVendorWorkFromDb);
    } catch (err) {
      console.warn('Supabase getVendorWorks error:', err.message);
      return null;
    }
  },

  async insertVendorWork(w) {
    const c = client || initClient();
    if (!c) return null;
    const row = {
      id: w.id,
      job_type: w.jobType,
      title: w.title,
      description: w.description,
      vendor_name: w.vendorName || '',
      vendor_id: w.vendorId || '',
      location: w.location || '',
      image_url: w.imageUrl || '',
      images: Array.isArray(w.images) ? w.images : [],
      status: w.status || 'published',
      created_at: w.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    try {
      const { data, error } = await c.from('vendor_works').insert([row]).select();
      if (error) throw error;
      return mapVendorWorkFromDb(data[0]);
    } catch (err) {
      console.error('Supabase insertVendorWork error:', err.message);
      return null;
    }
  },

  async updateVendorWork(id, updates) {
    const c = client || initClient();
    if (!c) return null;
    const row = { updated_at: new Date().toISOString() };
    if (updates.jobType !== undefined) row.job_type = updates.jobType;
    if (updates.title !== undefined) row.title = updates.title;
    if (updates.description !== undefined) row.description = updates.description;
    if (updates.vendorName !== undefined) row.vendor_name = updates.vendorName;
    if (updates.vendorId !== undefined) row.vendor_id = updates.vendorId;
    if (updates.location !== undefined) row.location = updates.location;
    if (updates.imageUrl !== undefined) row.image_url = updates.imageUrl;
    if (updates.images !== undefined) row.images = updates.images;
    if (updates.status !== undefined) row.status = updates.status;

    try {
      const { data, error } = await c.from('vendor_works').update(row).eq('id', id).select();
      if (error) throw error;
      return mapVendorWorkFromDb(data[0]);
    } catch (err) {
      console.error('Supabase updateVendorWork error:', err.message);
      return null;
    }
  },

  async deleteVendorWork(id) {
    const c = client || initClient();
    if (!c) return null;
    try {
      const { error } = await c.from('vendor_works').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Supabase deleteVendorWork error:', err.message);
      return false;
    }
  }
};
