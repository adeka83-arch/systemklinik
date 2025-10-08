// =============== START SERVER ===============
console.log('🎯 Server configured with all endpoints, starting...')

// Start the server
Deno.serve(app.fetch)

console.log('✅ Server started successfully with vouchers endpoint!')