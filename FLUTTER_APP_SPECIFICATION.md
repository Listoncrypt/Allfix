# 🚀 ALLFIX Services Xpress — Flutter Android Mobile App Specification

This document is the complete product, design, backend, and technical architecture specification for building the **ALLFIX Services Xpress** native Android application using **Flutter**. Any AI coding assistant or mobile development team can use this as the single source of truth.

---

## 1. Executive Summary & Brand Identity

* **Product Name**: ALLFIX Services Xpress (ALLFIX)
* **Tagline**: *"Bridging the trust deficit in everyday services across Nigeria & Africa."*
* **Brand Promise**: *"Not just selling you products and services, but selling you peace of mind."*
* **Business Model**: ALLFIX operates as a **dedicated coordination bridge** between customers and background-checked artisans, technicians, property consultants, and vehicle specialists. Quotes are confirmed through inspection clarity, and all bookings are governed by legally audited terms.
* **Headquarters**: Abuja HQ, Nigeria (serving nationwide: Abuja, Lagos, Port Harcourt, and major metropolitan centres).
* **Official Hotline & WhatsApp**: `+234 705 809 9045`
* **Support Email**: `allfix456@gmail.com`
* **Social Channels**:
  * Facebook: `https://www.facebook.com/profile.php?id=61594556316060`
  * TikTok: `https://www.tiktok.com/@allfixservicexpress`
  * Instagram: `https://www.instagram.com/allfixservicexpress`

---

## 2. Design System & Brand Palette

Use these exact color tokens and typography to maintain visual consistency with the web platform:

| Design Token | Hex Code | Flutter `Color` | Usage |
| :--- | :--- | :--- | :--- |
| **Brand Primary Green** | `#16883D` | `Color(0xFF16883D)` | Primary buttons, active tabs, verified badges, checkmarks |
| **Brand Green Dark** | `#166534` | `Color(0xFF166534)` | Pressed states, dark green contrast elements |
| **Brand Green Light** | `#DCFCE7` | `Color(0xFFDCFCE7)` | Badge backgrounds, highlighted container cards |
| **Dark Neutral (Heading)** | `#151B17` | `Color(0xFF151B17)` | Screen titles, card headers, high-emphasis text |
| **Body Neutral** | `#4A5568` | `Color(0xFF4A5568)` | Subtitles, body descriptions, form helpers |
| **Background Subtle** | `#F8FAF8` | `Color(0xFFF8FAF8)` | Scaffold background, grouped fieldset cards |
| **Card Border** | `#DCE4DD` | `Color(0xFFDCE4DD)` | Card borders, text field outline borders |
| **High Urgency (Red)** | `#DC2626` | `Color(0xFFDC2626)` | Emergency / Immediate dispatch badge |
| **Medium Urgency (Amber)** | `#D97706` | `Color(0xFFD97706)` | Within 24–48 hours badge, pending status |
| **Low Urgency (Green)** | `#16883D` | `Color(0xFF16883D)` | Flexible schedule badge |
| **Typography** | `Plus Jakarta Sans` & `Inter` | Google Fonts | Modern, premium sans-serif typography |

---

## 3. Backend & Cloud Infrastructure

* **API Engine**: Node.js REST API (hosted on Vercel Serverless / Node server).
* **Database**: **Supabase PostgreSQL** (with automatic fallback to local JSON storage).
* **Media & File Storage**: Cloudinary integration (`/api/upload`) + Supabase Storage for property and KYC pictures.
* **Real-time Subscriptions**: Supabase Realtime WebSocket channel (`schema: 'public'`).
* **Base URL for Flutter Client**:
  * Development / Android Emulator: `http://10.0.2.2:3000`
  * Production: `https://allfix-xpress.vercel.app` (or custom production domain)

---

## 4. Supabase Database Schema (PostgreSQL)

```sql
-- 1. Customer Service Requests
CREATE TABLE public.requests (
  id TEXT PRIMARY KEY,                       -- e.g. 'REQ-B0A7D420'
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  category TEXT NOT NULL,
  service TEXT,
  location TEXT,
  urgency TEXT DEFAULT 'Medium',             -- 'High', 'Medium', 'Low'
  preferred_date TEXT,
  description TEXT NOT NULL,
  bedrooms TEXT,                             -- '1 Bedroom', '2 Bedrooms', ..., 'Custom'
  preferred_locations JSONB DEFAULT '[]',    -- ['Lugbe', 'Maitama', ...]
  property_budget TEXT,                      -- 'Under ₦30M', '₦30M – ₦70M', ...
  property_timeline TEXT,                    -- 'Ready immediately', '1 month', ...
  car_type TEXT,                             -- 'SUV / Jeep', 'Sedan', ...
  car_model_year TEXT,                       -- 'Toyota RAV4 2022'
  is_electric_vehicle TEXT,                  -- 'Yes (100% Electric EV)' / 'No'
  car_colours JSONB DEFAULT '[]',            -- ['Black', 'White', 'Silver']
  car_budget TEXT,                           -- 'Under ₦15M', '₦15M – ₦30M', ...
  property_types JSONB DEFAULT '[]',         -- ['Duplex', 'Bungalow', 'Land / Plot']
  property_type_other TEXT,
  construction_description TEXT,
  land_size TEXT,
  land_size_other TEXT,
  land_status TEXT,                          -- 'already-have-land' / 'help-finding-land'
  status TEXT DEFAULT 'pending_matching',    -- 'pending_matching', 'contacted', 'matched', 'completed'
  admin_notes TEXT,
  agreement_id TEXT,                         -- 'AGR-C-XXXX'
  terms_version TEXT DEFAULT 'v1.0',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Verified Vendors & Artisans
CREATE TABLE public.vendors (
  id TEXT PRIMARY KEY,                       -- e.g. 'VEN-8C156BF9'
  full_name TEXT NOT NULL,
  business_name TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  category TEXT NOT NULL,
  specialties JSONB DEFAULT '[]',
  experience_years TEXT,
  operating_areas TEXT,
  reg_number TEXT,                           -- CAC / Trade ID
  address TEXT,
  verification_status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
  admin_notes TEXT,
  agreement_id TEXT,                         -- 'AGR-V-XXXX'
  terms_version TEXT DEFAULT 'v1.0',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Available Real Estate & Land Properties
CREATE TABLE public.properties (
  id TEXT PRIMARY KEY,                       -- e.g. 'PROP-9F12A'
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  property_type TEXT DEFAULT 'Residential',
  price TEXT,
  size TEXT,
  title_document TEXT,                       -- 'C of O', 'R of O', 'Deed'
  description TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'available',           -- 'available', 'under_offer', 'sold'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Available Automobiles & Vehicles
CREATE TABLE public.vehicles (
  id TEXT PRIMARY KEY,                       -- e.g. 'VEH-3A2B1'
  title TEXT NOT NULL,
  brand TEXT,
  model_year TEXT,
  car_type TEXT,
  price TEXT,
  location TEXT,
  colour TEXT,
  condition TEXT,                            -- 'Brand New', 'Tokunbo / Foreign Used', 'Nigerian Used'
  description TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'available',           -- 'available', 'reserved', 'sold'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Owner Asset Marketing Submissions (Properties & Cars)
CREATE TABLE public.marketing_requests (
  id TEXT PRIMARY KEY,                       -- e.g. 'MKT-PROP-XXXX' or 'MKT-CAR-XXXX'
  asset_type TEXT NOT NULL,                  -- 'property' or 'car'
  owner_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  location TEXT,
  price TEXT,
  description TEXT,
  images JSONB DEFAULT '[]',
  -- Property-specific fields:
  property_type TEXT,                        -- 'Bungalow', 'Duplex', 'Land / Plot', etc.
  listing_purpose TEXT,                      -- 'For Sale', 'For Rent / Lease'
  title_document TEXT,                       -- 'C of O', 'R of O', 'Governor Consent', etc.
  land_size TEXT,                            -- '500 sqm', '1,000 sqm (2 plots)', etc.
  -- Car-specific fields:
  car_type TEXT,                             -- 'SUV / Jeep', 'Sedan / Saloon', etc.
  car_model_year TEXT,                       -- 'Toyota Camry 2021'
  colour TEXT,                               -- 'Black', 'White', etc.
  condition TEXT,                            -- 'Brand New', 'Fairly Used (Foreign / Tokunbo)', 'Fairly Used (Nigerian)'
  custom_duty_paid TEXT,                     -- 'Yes', 'No'
  accident_status TEXT,                      -- 'Accident Free', 'Accidented'
  engine_gear_status TEXT,                   -- 'Untempered engine and gear', 'Tempered engine and gear'
  first_body TEXT,                           -- 'Yes', 'No'
  -- Management & compliance:
  status TEXT DEFAULT 'pending_review',      -- 'pending_review', 'inspected', 'published', 'rejected'
  admin_notes TEXT,
  agreement_id TEXT,                         -- 'AGR-C-XXXX'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Legal Compliance Audit Trail (Agreements)
CREATE TABLE public.agreements (
  id TEXT PRIMARY KEY,                       -- e.g. 'AGR-C-...' or 'AGR-V-...'
  user_name TEXT NOT NULL,
  contact TEXT NOT NULL,
  agreement_type TEXT NOT NULL,              -- 'Client Terms' or 'Vendor Terms'
  version TEXT DEFAULT 'v1.0',
  status BOOLEAN DEFAULT TRUE,
  context TEXT,
  ip TEXT,
  user_agent TEXT,
  related_entity_id TEXT,
  accepted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Vendor Handiwork Showcase & Job Evidence
CREATE TABLE public.vendor_works (
  id TEXT PRIMARY KEY,                       -- e.g. 'WORK-PLUMB01'
  vendor_id TEXT,                            -- optional foreign link to vendors.id
  vendor_name TEXT NOT NULL,                 -- e.g. 'Plumber Emeka Okafor'
  vendor_phone TEXT,
  job_type TEXT NOT NULL,                    -- 'Plumbing', 'Carpentry', 'Electrical', 'Auto Mechanic', etc.
  title TEXT NOT NULL,                       -- e.g. 'Concealed Bathroom Piping & Shower System'
  description TEXT NOT NULL,                 -- Detailed scope, materials, problem solved
  location TEXT,                             -- e.g. 'Maitama, Abuja'
  image TEXT,                                -- primary cover picture (URL or base64)
  photos JSONB DEFAULT '[]',                 -- array of image URLs/base64 strings (up to 10 photos)
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  featured BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active',              -- 'active', 'draft'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. REST API Specifications for Flutter (`Dio` / `Http`)

### A. Customer Service Request
* **Endpoint**: `POST /api/requests`
* **Headers**: `Content-Type: application/json`
* **Payload**:
```json
{
  "customerName": "Adeola Olawale",
  "phone": "+2348031234567",
  "email": "adeola@gmail.com",
  "category": "Beauty & Personal Grooming",
  "service": "Barber home visit",
  "location": "Wuse 2, Abuja",
  "urgency": "High",
  "preferredDate": "2026-10-15",
  "description": "Haircut and beard grooming needed at home.",
  "termsAccepted": true,
  "termsVersion": "v1.0"
}
```
* **Success Response (201)**:
```json
{
  "success": true,
  "requestId": "REQ-B0A7D420",
  "agreementId": "AGR-C-991414CD",
  "message": "Service request submitted successfully!"
}
```

### B. Vendor Onboarding
* **Endpoint**: `POST /api/vendors`
* **Payload**:
```json
{
  "fullName": "Tunde Bakare",
  "businessName": "Bakare Electricals",
  "phone": "+2348023456789",
  "email": "tunde@bakare.ng",
  "category": "Home Services",
  "specialties": ["Wiring", "Generator repair", "Solar inverter setup"],
  "experienceYears": "5",
  "operatingAreas": "Abuja (Maitama, Wuse, Gwarinpa)",
  "address": "Zone 4, Wuse, Abuja",
  "termsAccepted": true,
  "termsVersion": "v1.0"
}
```

### C. Available Properties
* **List Properties**: `GET /api/properties`
* **Response**:
```json
{
  "success": true,
  "total": 4,
  "properties": [
    {
      "id": "PROP-4B1C",
      "title": "4 Bedroom Fully Detached Duplex with BQ",
      "location": "Guzape, Abuja",
      "propertyType": "Residential",
      "price": "₦180,000,000",
      "size": "650 sqm",
      "titleDocument": "C of O",
      "description": "Newly completed luxury duplex with tarred access road and solar backup.",
      "imageUrl": "https://res.cloudinary.com/...",
      "status": "available"
    }
  ]
}
```
* **Create Property (Admin)**: `POST /api/properties` (Requires Admin Auth)
* **Delete Property (Admin)**: `DELETE /api/properties/:id` (Requires Admin Auth)

### D. Live Platform Statistics
* **Endpoint**: `GET /api/stats`
* **Response**:
```json
{
  "success": true,
  "stats": {
    "totalRequests": 12,
    "verifiedVendors": 1,
    "agreementsSigned": 15,
    "totalProperties": 4
  }
}
```

### E. Image / File Upload
* **Endpoint**: `POST /api/upload`
* **Format**: `multipart/form-data` with form field key `file` (Image uploaded directly to Cloudinary or Supabase Storage bucket; returns `{ success: true, url: "..." }`).

### F. Owner Asset Marketing Submissions (Property & Car)
* **Submit Marketing Request**: `POST /api/marketing-requests`
* **Headers**: `Content-Type: application/json`
* **Property Owner Payload**:
```json
{
  "assetType": "property",
  "ownerName": "Chief Segun Adeleke",
  "phone": "+2348039876543",
  "email": "segun@adeleke.ng",
  "propertyType": "4 Bedroom Detached Duplex",
  "listingPurpose": "For Sale",
  "location": "Maitama Extension, Abuja",
  "titleDocument": "Certificate of Occupancy (C of O)",
  "landSize": "850 sqm",
  "price": "₦350,000,000",
  "description": "Newly completed luxury mansion with swimming pool, smart home automation, and 2-room BQ.",
  "images": ["data:image/jpeg;base64,..."],
  "termsAccepted": true,
  "termsVersion": "v1.0"
}
```
* **Car Owner Payload (with tactile button values)**:
```json
{
  "assetType": "car",
  "ownerName": "Dr. Emeka Okonkwo",
  "phone": "+2348123456789",
  "email": "emeka.okonkwo@gmail.com",
  "carType": "SUV / Jeep",
  "carModelYear": "Toyota Land Cruiser Prado 2022",
  "colour": "Pearl White",
  "location": "Garki 2, Abuja",
  "condition": "Fairly Used (Foreign / Tokunbo)",
  "customDutyPaid": "Yes",
  "accidentStatus": "Accident Free",
  "engineGearStatus": "Untempered engine and gear",
  "firstBody": "Yes",
  "price": "₦75,000,000",
  "description": "Full option, panoramic roof, leather interior, clean foreign title, zero faults.",
  "images": ["data:image/jpeg;base64,..."],
  "termsAccepted": true,
  "termsVersion": "v1.0"
}
```
* **Success Response (201)**:
```json
{
  "success": true,
  "requestId": "MKT-PROP-4A82F19E",
  "agreementId": "AGR-C-63D11BA2",
  "assetType": "property",
  "message": "Property marketing request submitted successfully! Our valuation and brokerage team will inspect and verify your asset."
}
```
* **Fetch Submissions (Admin)**: `GET /api/marketing-requests?type=all&status=all`
* **Update Status (Admin)**: `POST /api/marketing-requests/update` (`{ id, status, adminNotes }`)
* **1-Click Convert to Live Listing (Admin)**: `POST /api/marketing-requests/publish` (`{ id, title, price, location, propertyType / carType, description, imageUrl }`)
* **Delete Submission (Admin)**: `POST /api/marketing-requests/delete` (`{ id }`)

### G. Available Automobiles & Vehicles
* **List Vehicles**: `GET /api/vehicles`
* **Create Vehicle (Admin)**: `POST /api/vehicles`
* **Update Vehicle (Admin)**: `PUT /api/vehicles/:id`
* **Delete Vehicle (Admin)**: `DELETE /api/vehicles/:id`

### H. Vendor Handiwork Showcase & Work Gallery
* **Public Gallery Endpoint**: `GET /api/vendor-works?jobType=all&search=`
* **Public Response**:
```json
{
  "success": true,
  "count": 6,
  "data": [
    {
      "id": "WORK-PLUMB01",
      "vendorId": "VEN-EMEKAPLUMB",
      "vendorName": "Plumber Emeka Okafor",
      "vendorPhone": "07058099045",
      "jobType": "Plumbing",
      "title": "Concealed Bathroom Piping & Shower System",
      "description": "Complete bathroom repiping with Italian PPR pressure testing and zero leaks.",
      "location": "Maitama, Abuja",
      "image": "https://images.unsplash.com/...",
      "photos": [
        "https://images.unsplash.com/...",
        "https://images.unsplash.com/..."
      ],
      "completedAt": "2026-10-10T14:30:00.000Z",
      "featured": true,
      "status": "active"
    }
  ]
}
```
* **Post New Handiwork (Admin)**: `POST /api/vendor-works` (Payload includes `jobType`, `title`, `description`, `vendorName`, `vendorPhone`, `location`, `photos`, `image`, `status`, `featured`)
* **Update Handiwork (Admin)**: `POST /api/vendor-works/update`
* **Delete Handiwork (Admin)**: `POST /api/vendor-works/delete` (`{ id }`)

---

## 6. Service Categories & Dynamic Workflow

The form in the Flutter app must dynamically adapt based on the selected category:

```
                          ┌───────────────────────────┐
                          │ Customer Selects Category │
                          └─────────────┬─────────────┘
                                        │
        ┌───────────────────────┬───────┴───────────────┬────────────────────────┐
        ▼                       ▼                       ▼                        ▼
 1. Property Sales        2. Cars &             3. Construction         4. General Artisan /
   & Rentals               Vehicles               & Land                  Other Services
 ─────────────────        ────────────          ───────────────         ─────────────────────
 • Property Types         • Car Type            • Scope of Build        • Specific Service Item
   (Duplex, Land, ...)      (SUV, Sedan, ...)   • Land Size (1 plot,    • City / Area Address
 • Bedrooms (1 to 5+)     • Model / Year          2 plots, Half plot)   • Urgency (High/Med/Low)
 • Locations (Lugbe,...)  • EV (Yes / No)       • Land Status:          • Preferred Date
 • Budget Bracket         • Colours multi-select  - Already have land   • Problem Description
 • Timeline (1-2 weeks)   • Target Budget         - Help me scout land
```

### 15 Core Categories:
1. **Property Sales & Rentals** (Apartments, Duplexes, Land, Commercial Leasing)
2. **Beauty & Personal Grooming** (Barber, Nail Tech, Hair Braiding, Frontal Installation)
3. **Wellness & Fitness** (Home Massage & Therapy, Online Fitness Coaching)
4. **Interior Decoration & Design** (Home & Office Styling, Wallpaper, Furniture Decor)
5. **Events & Catering** (Event Planning, Sound/Decor, Catering & Personal Cook)
6. **Visa & Travel Assistance** (Visa Application Support, Document Review)
7. **Medical Virtual Assistance** (Clinic Admin, Patient Intake, Telehealth Booking)
8. **Home Services** (Plumbing, Electrical, Carpentry, Painting)
9. **Cars & Vehicles** (Mechanics, Computer Diagnostics, Auto AC)
10. **Construction & Land** (Civil Building, Architectural CAD, Verified Land Scouting)
11. **Property Maintenance** (Roofing, Borehole Drilling, Solar Inverters)
12. **Cleaning & Janitorial** (Deep Cleans, Post-construction, Fumigation)
13. **Appliance Repairs** (AC, Generator, Fridge, Washing Machine)
14. **Products & Certified Spare Parts** (Hardware, Genuine Auto & Plumbing Parts)
15. **Other Specialist Services**

---

## 7. Recommended Flutter Mobile Architecture

### Recommended Package Stack (`pubspec.yaml`)
```yaml
dependencies:
  flutter:
    sdk: flutter
  flutter_riverpod: ^2.5.1       # Reactive state management
  dio: ^5.4.3                    # HTTP client with timeout & interceptors
  go_router: ^14.1.4             # Declarative app navigation
  supabase_flutter: ^2.5.6       # Realtime WebSocket stream & DB client
  cached_network_image: ^3.3.1   # Fast image cache for property listings
  image_picker: ^1.1.0           # Camera & gallery upload
  url_launcher: ^6.2.6           # Direct WhatsApp & tel: deep links
  flutter_secure_storage: ^9.2.2 # Encrypted local storage for admin token
  google_fonts: ^6.2.1           # Plus Jakarta Sans and Inter fonts
```

### Screen Map
1. **Splash & Welcome Screen**: Logo animation, offline cached data check.
2. **Main Navigation Shell**:
   * **Tab 1: Home Dashboard**:
     * Hero Title: *"A Smarter, Safer Way to Hire Artisans"*
     * Launch Stats: **`1+ Verified Artisans`**, **`100% ID Verified`**, **`100% Satisfaction`**
     * Category Grid (15 items with responsive cards and icons)
     * Featured Verified Properties Horizontal Carousel
     * The ALLFIX Promise Banner
     * Floating Action Button: Quick WhatsApp Dispatch
   * **Tab 2: Request Service Wizard**:
     * Dynamic step-by-step form (adapts to Property, Car, Construction, or General)
     * Urgency selector: High (Red), Medium (Amber), Low (Green)
     * Mandatory Terms Checkbox (Client Terms v1.0)
     * Instant Confirmation Screen with Request ID + Direct "Chat with Dispatch" button
   * **Tab 3: Property & Automobile Explorers**:
     * Real Estate: Verified land, duplexes, apartments, and commercial listings with inspection booking
     * Automobiles: Available foreign used / brand new vehicles with condition badges and test-drive inquiries
   * **Tab 4: List / Market With Us (Property & Car Owners)**:
     * Segmented Switcher: `Market a Property` vs `Market a Car`
     * Tactile toggle buttons for cars:
       * Custom duty fully paid? (Yes / No)
       * Vehicle condition: Brand New vs Fairly Used (Tokunbo / Nigerian Used)
       * History: Accident Free vs Accidented
       * Engine & Gear: Untempered engine and gear vs Tempered
       * Body status: First Body (Yes / No)
     * Up to 10 photos upload with local thumbnail previews
     * Mandatory Terms Checkbox & instant pre-filled WhatsApp link
   * **Tab 5: Become a Vendor (Join ALLFIX)**:
     * Artisan KYC registration, trade documents, experience years
     * Vendor Terms v1.0 acceptance
   * **Tab 6: Admin / Dispatch Portal (Protected)**:
     * Real-time list of all incoming requests with push/in-app notifications
     * Owner Asset Submissions manager with search, filter, and WhatsApp link
     * 1-Click Publishing: Convert submitted asset into live property or vehicle catalog item
     * Status updater (`pending_review` → `inspected` → `published` → `rejected`)

---

## 8. Direct WhatsApp Deep-Link Rule

ALLFIX operates with human dispatching support. Any WhatsApp action in the Flutter app should launch:
* **Target Number**: `2347058099045`
* **URL Format**: `https://wa.me/2347058099045?text=<URL_ENCODED_MESSAGE>`
* **Pre-filled Context Examples**:
  * *From Service Request Confirmation*:
    `"Hello ALLFIX Support, I just submitted request [REQ-ID] for [Category]. Can you connect me with a specialist?"`
  * *From Property Listing Inquiry*:
    `"Hello ALLFIX Properties, I am inquiring about [Property Title] in [Location] (Ref: [PROP-ID]). Is it available for inspection?"`
  * *General Support Inquiry*:
    `"Hello ALLFIX Xpress, I need assistance with a service."`

---

## 9. Launch Status & Compliance Rules

* **NO Mock Data**: All vendor metrics initialize at **`1+ Verified Artisans`** (never hardcode 420+ or fake stats).
* **Zero Dummy Testimonials**: Use genuine platform assurances, verified badges, and real Abuja HQ contact details.
* **Legal Terms Acceptance Mandatory**: No request or vendor application can be submitted without `termsAccepted: true` and `termsVersion: "v1.0"`.
