/**
 * Script to fix database indexes
 * Run this if you get duplicate key errors
 * 
 * Usage: node scripts/fix-database-indexes.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

async function fixIndexes() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/robo-advisor');

    console.log('✅ Connected to MongoDB');

    // Drop old/incorrect indexes
    try {
      await User.collection.dropIndex('phone_1');
      console.log('✅ Dropped old phone_1 index');
    } catch (error) {
      if (error.code !== 27) { // 27 = index not found
        console.log('⚠️ Could not drop phone_1 index:', error.message);
      }
    }

    // Ensure correct index exists
    await User.collection.createIndex({ phoneNumber: 1 }, { unique: true, sparse: false });
    console.log('✅ Created correct phoneNumber index');

    // Clean up any users with null/empty phoneNumber
    const result = await User.deleteMany({ 
      $or: [
        { phoneNumber: null },
        { phoneNumber: '' },
        { phoneNumber: { $exists: false } }
      ]
    });
    console.log(`✅ Cleaned up ${result.deletedCount} users with invalid phone numbers`);

    // List all indexes
    const indexes = await User.collection.getIndexes();
    console.log('\n📋 Current indexes:', JSON.stringify(indexes, null, 2));

    console.log('\n✅ Database indexes fixed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing indexes:', error);
    process.exit(1);
  }
}

fixIndexes();
