// ไฟล์ทดสอบ syntax
const checkSyntax = () => {
  console.log("Syntax checking...");
  try {
    // Import และ test การอ่านไฟล์
    const fs = require('fs');
    const path = require('path');
    
    const filePath = path.join(__dirname, 'pages', 'OwnerDormManagePage.jsx');
    console.log('Checking file:', filePath);
    
    if (fs.existsSync(filePath)) {
      console.log('File exists');
      const content = fs.readFileSync(filePath, 'utf8');
      console.log('File length:', content.length);
      
      // ตรวจสอบ syntax หลักๆ
      const hasMatchingBraces = (content.match(/\{/g) || []).length === (content.match(/\}/g) || []).length;
      const hasMatchingParens = (content.match(/\(/g) || []).length === (content.match(/\)/g) || []).length;
      const hasMatchingBrackets = (content.match(/\[/g) || []).length === (content.match(/\]/g) || []).length;
      
      console.log('Braces match:', hasMatchingBraces);
      console.log('Parentheses match:', hasMatchingParens);
      console.log('Brackets match:', hasMatchingBrackets);
      
      if (hasMatchingBraces && hasMatchingParens && hasMatchingBrackets) {
        console.log('✅ Basic syntax check passed');
      } else {
        console.log('❌ Basic syntax check failed');
      }
    } else {
      console.log('❌ File not found');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
};

checkSyntax();
