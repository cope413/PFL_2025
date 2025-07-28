const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

async function hashPasswords() {
  try {
    // Connect to database
    const dbPath = path.join(process.cwd(), 'PFL_2025.db');
    const db = new Database(dbPath);
    
    console.log('Connected to database:', dbPath);
    
    // Get all users
    const users = db.prepare('SELECT id, username, password FROM user').all();
    console.log(`Found ${users.length} users to update`);
    
    // Hash each password
    const saltRounds = 10;
    let updatedCount = 0;
    
    for (const user of users) {
      try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(user.password, saltRounds);
        
        // Update the user's password in the database
        const updateStmt = db.prepare('UPDATE user SET password = ? WHERE id = ?');
        updateStmt.run(hashedPassword, user.id);
        
        console.log(`✅ Updated password for user: ${user.username}`);
        updatedCount++;
      } catch (error) {
        console.error(`❌ Failed to update password for user ${user.username}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Successfully updated ${updatedCount} out of ${users.length} users`);
    
    // Close database connection
    db.close();
    
  } catch (error) {
    console.error('❌ Database error:', error);
    process.exit(1);
  }
}

// Run the script
hashPasswords(); 