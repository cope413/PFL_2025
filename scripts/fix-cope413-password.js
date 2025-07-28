const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

function fixPassword() {
  try {
    // Connect to database
    const dbPath = path.join(process.cwd(), 'PFL_2025.db');
    const db = new Database(dbPath);
    
    console.log('Connected to database:', dbPath);
    
    // Hash the correct password
    const correctPassword = 'C2temp';
    const correctHash = bcrypt.hashSync(correctPassword, 10);
    
    console.log('Correct password:', correctPassword);
    console.log('Correct hash:', correctHash);
    
    // Update the user's password
    const updateStmt = db.prepare('UPDATE user SET password = ? WHERE username = ?');
    const result = updateStmt.run(correctHash, 'cope413');
    
    console.log('Update result:', result);
    console.log('✅ Password updated for cope413');
    
    // Verify the update
    const user = db.prepare('SELECT username, password FROM user WHERE username = ?').get('cope413');
    console.log('Updated user:', user.username);
    console.log('New hash:', user.password);
    
    // Test the password
    const isMatch = bcrypt.compareSync(correctPassword, user.password);
    console.log('Password match test:', isMatch);
    
    db.close();
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixPassword(); 