// Test import to check if the component is properly exported
import AdminUserManagePage from './pages/AdminUserManagePage.jsx';

console.log('AdminUserManagePage:', AdminUserManagePage);

if (AdminUserManagePage) {
  console.log('✅ AdminUserManagePage component imported successfully');
} else {
  console.log('❌ AdminUserManagePage component import failed');
}

export default function TestImport() {
  return null;
}
