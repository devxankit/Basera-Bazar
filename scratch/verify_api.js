const http = require('http');

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error("Failed to parse JSON: " + data.slice(0, 100)));
        }
      });
    }).on('error', (err) => reject(err));
  });
}

async function testApi() {
  try {
    console.log("Testing top-level supplier categories...");
    const res1 = await get('http://localhost:5000/api/listings/categories?type=supplier&parent_id=null');
    console.log("Success:", res1.success);
    if (res1.data) {
      console.log("Count:", res1.data.length);
      if (res1.data.length > 0) {
        console.log("First Category:", res1.data[0].name, "ID:", res1.data[0]._id);
        
        console.log("\nTesting subcategories...");
        const parentId = res1.data[0]._id;
        const res2 = await get(`http://localhost:5000/api/listings/categories?parent_id=${parentId}`);
        console.log("Success:", res2.success);
        console.log("Subcategories Count:", res2.data.length);
      }
    } else {
      console.log("No data returned:", res1);
    }
  } catch (err) {
    console.error("API Error:", err.message);
  }
}

testApi();
