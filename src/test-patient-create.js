// Simple test script to check if patient creation works
const testPatientData = {
  name: 'Test Pasien',
  phone: '08123456789',
  address: 'Jl. Test No. 123',
  birthDate: '1990-01-01',
  gender: 'male',
  registrationDate: '2025-01-09' // Today's date
};

console.log('Testing patient creation with data:', testPatientData);

// This would be used to test the endpoint manually
// fetch('https://hgzmzbkzgojgxqyurqzy.supabase.co/functions/v1/make-server-73417b67/patients', {
//   method: 'POST',
//   headers: {
//     'Content-Type': 'application/json',
//     'Authorization': 'Bearer YOUR_ACCESS_TOKEN_HERE'
//   },
//   body: JSON.stringify(testPatientData)
// }).then(response => response.json()).then(data => console.log(data));