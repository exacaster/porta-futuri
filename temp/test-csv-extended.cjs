#!/usr/bin/env node

// Test script to verify CSV parsing with extended fields

const fs = require('fs');
const path = require('path');

// Read the test CSV file
const csvContent = fs.readFileSync(path.join(__dirname, '..', 'test-products-extended.csv'), 'utf8');

console.log('Test CSV Content (first 500 chars):');
console.log(csvContent.substring(0, 500));
console.log('\n---\n');

// Parse CSV headers
const lines = csvContent.split('\n');
const headers = lines[0].split(',');

console.log('CSV Headers:', headers);
console.log('\nExpected new fields:');
console.log('- attributes: ', headers.includes('attributes') ? '✅' : '❌');
console.log('- comments: ', headers.includes('comments') ? '✅' : '❌');

// Parse first data row
if (lines.length > 1) {
  console.log('\nFirst product data (partial):');
  const firstRow = lines[1];
  
  // Extract attributes field (JSON)
  const attributesMatch = firstRow.match(/"(\{[^}]+\})"/);
  if (attributesMatch) {
    console.log('\nAttributes JSON:', attributesMatch[1]);
    try {
      const attrs = JSON.parse(attributesMatch[1]);
      console.log('Parsed attributes:', attrs);
    } catch (e) {
      console.log('Failed to parse attributes:', e.message);
    }
  }
  
  // Extract comments field (JSON array)
  const commentsMatch = firstRow.match(/"(\[[^\]]+\])"/);
  if (commentsMatch) {
    console.log('\nComments JSON (truncated):', commentsMatch[1].substring(0, 200) + '...');
    try {
      const comments = JSON.parse(commentsMatch[1]);
      console.log('Number of comments:', comments.length);
      if (comments.length > 0) {
        console.log('First comment:', comments[0]);
      }
    } catch (e) {
      console.log('Failed to parse comments:', e.message);
    }
  }
}

console.log('\n✅ Test CSV file is ready for upload via Admin Panel');
console.log('📝 File location:', path.join(__dirname, '..', 'test-products-extended.csv'));
console.log('\n🔗 Admin Panel URL: http://localhost:5174');
console.log('📤 Upload the test CSV file and verify that:');
console.log('   1. Products are uploaded successfully');
console.log('   2. Attributes are stored in metadata field');
console.log('   3. Comments are stored in comments field');
console.log('   4. No errors occur during parsing');