async function testFetch() {
  const slug = 'ministry-of-finance';
  const url = `http://localhost:8080/api/portals/${slug}`;
  console.log(`Fetching ${url}...`);
  try {
    const res = await fetch(url);
    console.log(`Status: ${res.status} ${res.statusText}`);
    const data = await res.json();
    console.log('Data:', JSON.stringify(data, null, 2).substring(0, 500));
  } catch (e) {
    console.error('Fetch Error:', e);
  }
}

testFetch();
