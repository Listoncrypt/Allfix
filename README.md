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

The server stores operational records in `data/db.json`. That file is local application data and is excluded from version control. Keep backups of it separately when needed.
