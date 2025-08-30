const mongoose = require('mongoose');
const Report = require('./models/report.model');
const User = require('./models/user.model');
require('dotenv').config();

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected for seeding');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
};

// Sample reports data
const sampleReports = [
  {
    title: 'Illegal Mangrove Cutting in Coastal Area',
    incidentType: 'illegal_cutting',
    description: 'Observed unauthorized cutting of mangrove trees along the coastal area near the industrial zone. Approximately 50 trees have been cut down in the last week.',
    severity: 'high',
    location: {
      type: 'Point',
      coordinates: [72.8777, 19.0760] // Mumbai coordinates
    },
    address: {
      street: 'Marine Drive',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India'
    },
    status: 'pending',
    tags: ['mangrove', 'cutting', 'coastal', 'illegal']
  },
  {
    title: 'Waste Dumping in Mangrove Wetland',
    incidentType: 'dumping',
    description: 'Large amounts of industrial waste being dumped into the mangrove wetland area, causing severe pollution and habitat destruction.',
    severity: 'critical',
    location: {
      type: 'Point',
      coordinates: [72.8311, 18.9207] // Thane coordinates
    },
    address: {
      street: 'Ghodbunder Road',
      city: 'Thane',
      state: 'Maharashtra',
      country: 'India'
    },
    status: 'under_review',
    tags: ['pollution', 'waste', 'industrial', 'habitat']
  },
  {
    title: 'Oil Spill Affecting Mangrove Ecosystem',
    incidentType: 'oil_spill',
    description: 'Oil spill from nearby tanker has contaminated the mangrove area. Birds and marine life are affected.',
    severity: 'critical',
    location: {
      type: 'Point',
      coordinates: [72.8549, 19.0178] // Bandra coordinates
    },
    address: {
      street: 'Bandra Reclamation',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India'
    },
    status: 'verified',
    tags: ['oil_spill', 'marine_life', 'contamination', 'urgent']
  },
  {
    title: 'Wildlife Disturbance by Construction',
    incidentType: 'wildlife_disturbance',
    description: 'Construction work near mangrove area is disturbing nesting birds and other wildlife. Noise pollution is also affecting the ecosystem.',
    severity: 'medium',
    location: {
      type: 'Point',
      coordinates: [72.9675, 19.2183] // Navi Mumbai coordinates
    },
    address: {
      street: 'Sector 19',
      city: 'Navi Mumbai',
      state: 'Maharashtra',
      country: 'India'
    },
    status: 'pending',
    tags: ['construction', 'wildlife', 'noise', 'birds']
  },
  {
    title: 'Coastal Erosion Due to Development',
    incidentType: 'erosion',
    description: 'Accelerated coastal erosion observed due to recent development activities. Mangrove buffer zone is being compromised.',
    severity: 'high',
    location: {
      type: 'Point',
      coordinates: [72.9781, 19.0867] // Vashi coordinates
    },
    address: {
      street: 'Palm Beach Road',
      city: 'Navi Mumbai',
      state: 'Maharashtra',
      country: 'India'
    },
    status: 'under_review',
    tags: ['erosion', 'coastal', 'development', 'buffer_zone']
  }
];

// Seed function
const seedReports = async () => {
  try {
    console.log('🌱 Starting to seed reports...');

    // Get a user to assign as reporter (you might want to create a test user first)
    const user = await User.findOne();
    if (!user) {
      console.log('❌ No users found. Please create a user first.');
      return;
    }

    console.log(`👤 Using user: ${user.name} (${user.email})`);

    // Clear existing reports (optional)
    const existingCount = await Report.countDocuments();
    console.log(`📊 Found ${existingCount} existing reports`);

    if (existingCount > 0) {
      console.log('🗑️  Clearing existing reports...');
      await Report.deleteMany({});
    }

    // Create new reports
    const reportsWithUser = sampleReports.map(report => ({
      ...report,
      reporter: user._id
    }));

    const createdReports = await Report.insertMany(reportsWithUser);

    console.log(`✅ Successfully created ${createdReports.length} test reports`);

    // Display created reports
    console.log('\n📋 Created Reports:');
    createdReports.forEach((report, index) => {
      console.log(`${index + 1}. ${report.title} (${report.severity}) - ${report.status}`);
    });

  } catch (error) {
    console.error('❌ Error seeding reports:', error);
  }
};

// Main execution
const runSeeder = async () => {
  await connectDB();
  await seedReports();

  console.log('\n🎉 Seeding completed!');
  console.log('You can now test the reports functionality.');

  process.exit(0);
};

// Run seeder
if (require.main === module) {
  runSeeder();
}

module.exports = { seedReports };
