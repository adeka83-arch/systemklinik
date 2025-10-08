// Test script untuk vouchers endpoint
console.log('Testing vouchers endpoint...')

const serverUrl = 'https://adeka83-arch.supabase.co/functions/v1/make-server-73417b67'
const accessToken = 'dummy_token'

fetch(`${serverUrl}/vouchers`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('Response status:', response.status)
  return response.text()
})
.then(text => {
  console.log('Response body:', text)
})
.catch(error => {
  console.error('Error:', error)
})