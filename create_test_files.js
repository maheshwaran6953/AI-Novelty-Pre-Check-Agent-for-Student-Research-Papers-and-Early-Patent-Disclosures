const fs = require('fs');

// 1. Simple text file
fs.writeFileSync('test.txt', 'This is a test claim for the novelty agent.');

// 2. Large text file (33,000 characters)
const largeContent = 'A'.repeat(33000);
fs.writeFileSync('large_test.txt', largeContent);

// 3. Invalid file (fake png)
fs.writeFileSync('invalid.png', 'fake image data');

console.log('Test files created.');
