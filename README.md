# Digital College Notice Board (MERN)

A simple college notice board built with **MongoDB, Express, React and Node.js**.

```
notice-board/
├── backend/    Node + Express REST API, Mongoose models, JWT auth
└── frontend/   React (Vite) app
```

## Requirements
- Node.js 18+
- MongoDB (local install or a free MongoDB Atlas cluster)

## 1. Backend
```bash
cd backend
npm install
cp .env.example .env      # then edit .env (MONGO_URI, JWT_SECRET) - a ready .env is already included
npm run dev               # API on http://localhost:5000
```

## 2. Frontend
```bash
cd frontend
npm install
cp .env.example .env      # set VITE_API_URL and your college name
npm run dev               # open http://localhost:5173
```

## 3. Using the app
1. Open http://localhost:5173/register and create the **first account as "Principal / Admin"**
   (this option appears only while no admin exists). Everything you type is saved in MongoDB.
2. Anyone else can register as **Teacher**, **Student** or **HOD** (email + password),
   choosing their department from the list. Then log in from the matching tab (Principal / HOD / Student) with the same email + password.
3. Admin -> **Departments** tab: add your own departments. **Users** tab: create accounts,
   grant "Can publish college-wide" to HODs, disable or delete users.
4. When adding a notice, pick a category or choose **"+ Other (type your own)"** to save a new one.

Departments (CSE, ECE, ME, CV) are created automatically only the first time, if the database is empty.
The role is stored in the database and checked by the server on every request.

## Teacher portal
- Teachers register (or the admin creates them) with email, password and department, then log in from the **Teacher** tab.
- **Notices** tab: every active notice for their department plus college-wide ones, from the Principal and HODs. Filter by sender (Principal / HOD), scope, category or search. Each card shows who posted it.
- **My Department** tab: the HOD(s) and students of their own department only.
- Teachers are read-only: they cannot post, edit or delete notices.

## Rules implemented
| Role | Can do |
|------|--------|
| Student | View active college-wide notices and notices for own department; search & filter; deadline bell |
| HOD | Add/edit/delete notices of own department only; college-wide only if authorized |
| Admin | Everything: all notices (incl. expired history), deactivate, departments, HOD/student accounts |

- Passwords hashed with bcrypt; sessions use JWT (1 day).
- "3 days left / 1 day left / Expired" is calculated from the real expiry date.
- Expired, inactive and not-yet-published notices never appear in the student feed.
- The bell shows notices expiring within 3 days.

## API summary
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | /api/auth/register | public (admin only while none exists) |
| GET | /api/auth/setup-status | public |
| POST | /api/auth/login | public |
| GET | /api/auth/me | logged in |
| GET | /api/notices/feed | logged in |
| GET | /api/notices/manage | hod, admin |
| POST/PUT/DELETE | /api/notices/:id | hod (own dept), admin |
| PATCH | /api/notices/:id/toggle | admin |
| GET | /api/people | teacher (own department's HOD + students) |
| GET | /api/departments/public | public |
| GET/POST/DELETE | /api/departments | GET logged in, write admin |
| GET/POST/PATCH/DELETE | /api/users | admin |
