const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Badge = require('./models/badge.model');
const connectDB = require('./config/database');

// Load environment variables
dotenv.config();

// Initial badges data
const badges = [
  // Reporting Badges
  {
    name: 'First Report',
    description: 'Submit your first incident report',
    icon: '🌱',
    category: 'reporting',
    type: 'bronze',
    criteria: {
      type: 'report_count',
      threshold: 1,
      timeframe: 'all_time'
    },
    points: 10,
    rarity: 'common'
  },
  {
    name: 'Dedicated Reporter',
    description: 'Submit 10 incident reports',
    icon: '📋',
    category: 'reporting',
    type: 'silver',
    criteria: {
      type: 'report_count',
      threshold: 10,
      timeframe: 'all_time'
    },
    points: 50,
    rarity: 'uncommon'
  },
  {
    name: 'Guardian of Mangroves',
    description: 'Submit 50 incident reports',
    icon: '🏆',
    category: 'reporting',
    type: 'gold',
    criteria: {
      type: 'report_count',
      threshold: 50,
      timeframe: 'all_time'
    },
    points: 200,
    rarity: 'rare'
  },
  {
    name: 'Mangrove Champion',
    description: 'Submit 100 incident reports',
    icon: '👑',
    category: 'reporting',
    type: 'platinum',
    criteria: {
      type: 'report_count',
      threshold: 100,
      timeframe: 'all_time'
    },
    points: 500,
    rarity: 'epic'
  },

  // Validation Badges
  {
    name: 'Validator',
    description: 'Validate your first report',
    icon: '✅',
    category: 'validation',
    type: 'bronze',
    criteria: {
      type: 'validation_count',
      threshold: 1,
      timeframe: 'all_time'
    },
    points: 15,
    rarity: 'common'
  },
  {
    name: 'Expert Validator',
    description: 'Validate 25 reports',
    icon: '🔍',
    category: 'validation',
    type: 'silver',
    criteria: {
      type: 'validation_count',
      threshold: 25,
      timeframe: 'all_time'
    },
    points: 100,
    rarity: 'uncommon'
  },
  {
    name: 'Master Validator',
    description: 'Validate 100 reports',
    icon: '🎯',
    category: 'validation',
    type: 'gold',
    criteria: {
      type: 'validation_count',
      threshold: 100,
      timeframe: 'all_time'
    },
    points: 300,
    rarity: 'rare'
  },

  // Points Badges
  {
    name: 'Rising Star',
    description: 'Earn 100 points',
    icon: '⭐',
    category: 'achievement',
    type: 'bronze',
    criteria: {
      type: 'points_total',
      threshold: 100,
      timeframe: 'all_time'
    },
    points: 25,
    rarity: 'common'
  },
  {
    name: 'Community Hero',
    description: 'Earn 500 points',
    icon: '🦸',
    category: 'achievement',
    type: 'silver',
    criteria: {
      type: 'points_total',
      threshold: 500,
      timeframe: 'all_time'
    },
    points: 75,
    rarity: 'uncommon'
  },
  {
    name: 'Environmental Warrior',
    description: 'Earn 1000 points',
    icon: '⚔️',
    category: 'achievement',
    type: 'gold',
    criteria: {
      type: 'points_total',
      threshold: 1000,
      timeframe: 'all_time'
    },
    points: 150,
    rarity: 'rare'
  },
  {
    name: 'Legendary Protector',
    description: 'Earn 2500 points',
    icon: '🌟',
    category: 'achievement',
    type: 'platinum',
    criteria: {
      type: 'points_total',
      threshold: 2500,
      timeframe: 'all_time'
    },
    points: 300,
    rarity: 'legendary'
  },

  // Participation Badges
  {
    name: 'Active Contributor',
    description: 'Be active for 7 consecutive days',
    icon: '📅',
    category: 'participation',
    type: 'bronze',
    criteria: {
      type: 'consecutive_days',
      threshold: 7,
      timeframe: 'weekly'
    },
    points: 30,
    rarity: 'common'
  },
  {
    name: 'Dedicated Member',
    description: 'Be active for 30 consecutive days',
    icon: '🔥',
    category: 'participation',
    type: 'silver',
    criteria: {
      type: 'consecutive_days',
      threshold: 30,
      timeframe: 'monthly'
    },
    points: 100,
    rarity: 'uncommon'
  },

  // Special Badges
  {
    name: 'Early Adopter',
    description: 'One of the first 100 users to join',
    icon: '🚀',
    category: 'expertise',
    type: 'special',
    criteria: {
      type: 'special_action',
      threshold: 1,
      timeframe: 'all_time'
    },
    points: 100,
    rarity: 'legendary'
  },
  {
    name: 'Critical Alert',
    description: 'Report a critical incident that was verified',
    icon: '🚨',
    category: 'expertise',
    type: 'special',
    criteria: {
      type: 'special_action',
      threshold: 1,
      timeframe: 'all_time'
    },
    points: 200,
    rarity: 'epic'
  },
  {
    name: 'Community Leader',
    description: 'Help validate and guide other community members',
    icon: '👥',
    category: 'leadership',
    type: 'special',
    criteria: {
      type: 'special_action',
      threshold: 1,
      timeframe: 'all_time'
    },
    points: 250,
    rarity: 'legendary'
  }
];

const seedBadges = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to MongoDB');

    // Clear existing badges
    await Badge.deleteMany({});
    console.log('Cleared existing badges');

    // Insert new badges
    const createdBadges = await Badge.insertMany(badges);
    console.log(`✅ Created ${createdBadges.length} badges`);

    // Display created badges
    console.log('\n📋 Created Badges:');
    createdBadges.forEach(badge => {
      console.log(`${badge.icon} ${badge.name} (${badge.type}) - ${badge.points} points`);
    });

    console.log('\n🎉 Badge seeding completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding badges:', error.message);
    process.exit(1);
  }
};

const listBadges = async () => {
  try {
    await connectDB();
    const badges = await Badge.find().sort({ category: 1, 'criteria.threshold': 1 });
    
    console.log('\n📋 Current Badges in Database:');
    console.log('================================');
    
    let currentCategory = '';
    badges.forEach(badge => {
      if (badge.category !== currentCategory) {
        currentCategory = badge.category;
        console.log(`\n🏷️  ${currentCategory.toUpperCase()} BADGES:`);
      }
      console.log(`${badge.icon} ${badge.name} (${badge.type}) - ${badge.points} points`);
      console.log(`   📝 ${badge.description}`);
      console.log(`   🎯 Criteria: ${badge.criteria.type} >= ${badge.criteria.threshold}`);
      console.log(`   💎 Rarity: ${badge.rarity}`);
      console.log('');
    });
    
    console.log(`Total badges: ${badges.length}`);
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error listing badges:', error.message);
    process.exit(1);
  }
};

// Handle command line arguments
const command = process.argv[2];

switch (command) {
  case 'seed':
    seedBadges();
    break;
  case 'list':
    listBadges();
    break;
  default:
    console.log('Usage:');
    console.log('  node seed-badges.js seed  - Create initial badges');
    console.log('  node seed-badges.js list  - List current badges');
    process.exit(0);
}