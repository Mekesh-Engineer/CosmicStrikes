import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

// Seed data: Test accounts with known credentials
const testAccounts = [
  {
    email: 'test@test.com',
    username: 'TestPlayer',
    password: 'password123',
    highScore: 5000,
    totalGames: 3
  },
  {
    email: 'demo@demo.com',
    username: 'DemoUser',
    password: 'demo123',
    highScore: 12500,
    totalGames: 8
  },
  {
    email: 'admin@cosmic.com',
    username: 'AdminPilot',
    password: 'admin123',
    highScore: 50000,
    totalGames: 25
  },
  {
    email: 'player@game.com',
    username: 'ProGamer',
    password: 'player123',
    highScore: 100000,
    totalGames: 50
  }
];

async function seed() {
  console.log('\n🌱 Starting database seed...\n');

  const db = new Database('./cosmic-strikes.db');

  try {
    // Check if users table exists
    const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
    if (!tableCheck) {
      console.error('❌ Users table does not exist. Please run the server first to initialize the database.');
      process.exit(1);
    }

    let created = 0;
    let skipped = 0;

    for (const account of testAccounts) {
      // Check if user already exists
      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(account.email);
      
      if (existing) {
        console.log(`⏭️  Skipped: ${account.email} (already exists)`);
        skipped++;
        continue;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(account.password, 12);

      // Create user
      const userId = randomUUID();
      const now = Date.now();

      db.prepare(`
        INSERT INTO users (
          id, email, username, passwordHash, avatar, 
          highScore, totalGames, recentScores, settings, 
          createdAt, lastPlayed, googleId
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        account.email,
        account.username,
        passwordHash,
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${account.username}`,
        account.highScore,
        account.totalGames,
        JSON.stringify([]),
        JSON.stringify({ difficulty: 'normal', soundEnabled: true, musicEnabled: true }),
        now,
        now,
        null
      );

      console.log(`✅ Created: ${account.email}`);
      console.log(`   Username: ${account.username}`);
      console.log(`   Password: ${account.password}`);
      console.log(`   High Score: ${account.highScore.toLocaleString()}`);
      console.log('');
      created++;
    }

    console.log('\n📊 Seed Summary:');
    console.log(`   ✅ Created: ${created} account(s)`);
    console.log(`   ⏭️  Skipped: ${skipped} account(s)`);
    console.log('\n🎮 Test Accounts Available:\n');

    // Display all test accounts
    const users = db.prepare('SELECT email, username, highScore, totalGames FROM users ORDER BY createdAt').all();
    users.forEach((user: any, i: number) => {
      const testAccount = testAccounts.find(acc => acc.email === user.email);
      console.log(`${i + 1}. ${user.username} (${user.email})`);
      if (testAccount) {
        console.log(`   Password: ${testAccount.password}`);
      }
      console.log(`   Stats: ${user.highScore.toLocaleString()} score, ${user.totalGames} games\n`);
    });

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    db.close();
  }

  console.log('✅ Seed completed successfully!\n');
}

seed();
