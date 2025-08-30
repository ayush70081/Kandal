const mongoose = require('mongoose');
const User = require('./models/user.model');
require('dotenv').config();

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected for user creation');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
};

// Create test user
const createTestUser = async () => {
  try {
    console.log('👤 Creating test user...');

    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'test@mangrove.com' });
    if (existingUser) {
      console.log('✅ Test user already exists:');
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Name: ${existingUser.name}`);
      return existingUser;
    }

    // Create new test user
    const testUser = new User({
      name: 'Test User',
      email: 'test@mangrove.com',
      password: 'password123',
      location: {
        city: 'Test City'
      },
      isActive: true
    });

    await testUser.save();

    console.log('✅ Test user created successfully:');
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Password: password123`);
    console.log(`   Name: ${testUser.name}`);

    return testUser;

  } catch (error) {
    console.error('❌ Error creating test user:', error);
    throw error;
  }
};

// Main execution
const runScript = async () => {
  try {
    await connectDB();
    await createTestUser();
    
    console.log('\n🎉 Test user setup completed!');
    console.log('You can now login with:');
    console.log('  Email: test@mangrove.com');
    console.log('  Password: password123');
    
  } catch (error) {
    console.error('❌ Script failed:', error);
  } finally {
    process.exit(0);
  }
};

// Run script
if (require.main === module) {
  runScript();
}

module.exports = { createTestUser };