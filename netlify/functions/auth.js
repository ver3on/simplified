exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    if (!event.body) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing request body' }) };
    }

    const { password } = JSON.parse(event.body);
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

    if (password === ADMIN_PASSWORD) {
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    } else {
      return { statusCode: 401, headers, body: JSON.stringify({ success: false, error: 'Unauthorized' }) };
    }
  } catch (error) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON format' }) };
  }
};
