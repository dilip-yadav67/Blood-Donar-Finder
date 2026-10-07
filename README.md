# Blood Donor Finder (MERN)

Phone-OTP login, GPS "mere paas" search, privacy-first (phone number sirf verified users ko, request par).

## Run
```bash
# 1) MongoDB chalu rakho (local ya Atlas)
cd server && cp .env.example .env && npm i && npm run dev   # :5000
cd ../client && npm i && npm run dev                         # :5173
```
Dev mode mein OTP server console mein print hota hai (`SMS_PROVIDER=console`).
Production: `SMS_PROVIDER=msg91` ya `twilio` set karo aur keys `.env` mein daalo.

## API
| Method | Route | Auth | Kaam |
|---|---|---|---|
| POST | /api/auth/send-otp | - | OTP bhejo |
| POST | /api/auth/verify-otp | - | OTP verify, JWT do |
| GET  | /api/donors/me | JWT | apni profile |
| PUT  | /api/donors/me | JWT | donor profile banao/update |
| DELETE | /api/donors/me | JWT | profile hamesha ke liye delete |
| GET  | /api/donors/search?group=O-&lat=&lng=&km= | - | nearby donors (phone hidden) |
| POST | /api/donors/:id/contact | JWT | phone reveal (limited, logged) |

## Privacy
- Search results mein phone number nahi aata, location ~1 km fuzzy hoti hai.
- Phone reveal sirf OTP-verified user ko, 20 reveals/din tak, har reveal log hota hai.
- Donor kabhi bhi profile delete ya "unavailable" kar sakta hai.
