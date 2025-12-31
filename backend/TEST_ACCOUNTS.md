# 🔐 Test Accounts

These test accounts are available for development and testing purposes.

## Quick Access

| Email            | Password      | Username   | High Score | Games |
| ---------------- | ------------- | ---------- | ---------- | ----- |
| test@test.com    | `password123` | TestPlayer | 5,000      | 3     |
| demo@demo.com    | `demo123`     | DemoUser   | 12,500     | 8     |
| admin@cosmic.com | `admin123`    | AdminPilot | 50,000     | 25    |
| player@game.com  | `player123`   | ProGamer   | 100,000    | 50    |

## Usage

1. Navigate to http://localhost:5173
2. Click "Login"
3. Use any of the credentials above

## Reseed Database

To recreate test accounts:

```bash
cd backend
npm run seed
```

The seed script will:

- ✅ Skip existing accounts
- ✅ Create missing accounts
- ✅ Display all available accounts with credentials

## Original Account

The original registered account is also available:

- **Email:** mekesh.engineer@gmail.com
- **Username:** Mekesh
- **Password:** _(set during registration)_
- **High Score:** 41,600
- **Games:** 6
