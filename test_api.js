async function run() {
  try {
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'kunal@gmail.com', password: 'password' })
    }).then(r => r.json());
    
    let token = loginRes.token;
    if (!token) {
       const login2 = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'admin@b2b.com', password: 'password123' })
       }).then(r => r.json());
       token = login2.token;
    }
    
    if (!token) return console.log('Login failed');

    const catRes = await fetch('http://localhost:5000/api/catalogues', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json());
    
    const cat = catRes.catalogues[0];
    if (!cat) return console.log('No catalogues found');

    console.log(`Putting against catalog ${cat._id}...`);
    
    const res = await fetch(`http://localhost:5000/api/catalogues/${cat._id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({
        linkSettings: {
          requireEmail: true,
          expiresOn: null,
        }
      })
    });
    
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Data:', data);
    
  } catch (e) {
    console.error('API Error:', e);
  }
}
run();
