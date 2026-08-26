export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action } = req.query;

  if (action === 'refresh') {
    return res.status(200).json({
      token: 'verified_refreshed_uamex_jwt_token',
      expiresIn: 30 * 24 * 60 * 60
    });
  }

  return res.status(200).json({ status: 'ok', authenticated: true });
}
