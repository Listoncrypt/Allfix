# ALLFIX Services Xpress

ALLFIX Services Xpress connects customers with local service professionals across Nigeria. The site uses static HTML, CSS, and browser JavaScript, with a small Node.js server for page routing, form submissions, and the compliance dashboard.

## Run locally

Use Node.js 18 or newer.

```sh
npm start
```

Open [http://localhost:3000](http://localhost:3000). The server uses port 3000 by default; set the `PORT` environment variable to use another port.

## Pages

- `/` — Home
- `/request-service` — Customer service request
- `/become-vendor` — Vendor application
- `/about` — About and service process
- `/contact` — Contact form and support information
- `/client-terms` and `/vendor-terms` — Terms and conditions
- `/privacy-policy` and `/disclaimer` — Legal information
- `/admin` — Requests, vendors, and agreement records

## API

- `POST /api/requests` — Create a service request and record client terms acceptance
- `POST /api/vendors` — Submit a vendor application and record vendor terms acceptance
- `POST /api/contact` — Submit a contact message
- `GET /api/requests`, `/api/vendors`, `/api/agreements`, and `/api/stats` — Dashboard data

Local development can use `data/db.json`. Production writes use Supabase; the server does not treat deployment files as durable storage.

## Property and vehicle listings

Run `supabase-marketplace-migration.sql` in the Supabase SQL Editor when upgrading an existing database. It creates the owner-submission, vehicle, and vendor-work tables used by the site and adds the published-listing reference. New installations can use `supabase-schema.sql`.

Submissions from **List With Us** are saved as `pending_review`. An administrator must review and publish each submission before it appears in the public properties or cars inventory. Publishing creates the public inventory record and marks the submission as published.

Production needs `SUPABASE_URL` and the server-only `SUPABASE_SERVICE_ROLE_KEY` configured in Vercel. If a Supabase write fails, the API returns an error instead of reporting that the submission succeeded.

## Identity verification storage

Run `supabase-identity-verification-migration.sql` in the Supabase SQL Editor for an existing database. New installations can use the updated `supabase-schema.sql`. The server needs `SUPABASE_URL` and a server-only `SUPABASE_SERVICE_ROLE_KEY`; identity files are uploaded to the private `identity-verification` bucket and can only be opened from the authenticated admin dashboard. Do not use an anon key for server-side identity storage.

When Supabase is not configured, identity files are stored under `data/private-identity/`, outside the public website directory. This folder is excluded from version control.
