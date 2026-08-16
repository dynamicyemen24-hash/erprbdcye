(async () => {
  const res1 = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'executive@rohamaab.org', password: 'admin123' })
  });
  const data = await res1.json();
  console.log('LOGIN DATA:', data);
  
  const token = data.token;
  const res2 = await fetch('http://localhost:3000/api/tables/programs', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  console.log('PROGRAMS STATUS:', res2.status);
})();
