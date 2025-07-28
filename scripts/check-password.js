const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

function checkPassword() {
  try {
    // Connect to database
    const dbPath = path.join(process.cwd(), 'PFL_2025.db');
    const db = new Database(dbPath);
    
    console.log('Connected to database:', dbPath);
    
    // Get the cope413 user
    const user = db.prepare('SELECT id, username, password FROM user WHERE username = ?').get('cope413');
    
    if (!user) {
      console.log('❌ User cope413 not found');
      return;
    }
    
    console.log('User found:', user.username);
    console.log('Stored password hash:', user.password);
    
    // Test the password
    const testPassword = 'C2temp';
    const isMatch = bcrypt.compareSync(testPassword, user.password);
    
    console.log('Testing password:', testPassword);
    console.log('Password match:', isMatch);
    
    // Also test with a fresh hash
    const freshHash = bcrypt.hashSync(testPassword, 10);
    console.log('Fresh hash for C2temp:', freshHash);
    
    db.close();
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkPassword(); 