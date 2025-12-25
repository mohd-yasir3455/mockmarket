import { connectToDatabase } from './db.js';
import User from '../models/User.js';

export default async function handler(req, res) {
  try {
    // GET /api/user?username=foo or /api/user/foo
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const parts = url.pathname.split('/').filter(Boolean); // ['api','user','foo']
    const username = url.searchParams.get('username') || parts[2];

    if (!username) return res.status(400).json({ msg: 'username required' });

    if (req.method === 'GET') {
      await connectToDatabase();
      let user = await User.findOne({ username });
      if (!user) {
        user = new User({ username });
        await user.save();
      }
      return res.json(user);
    }

    return res.status(405).json({ msg: 'Method not allowed' });
  } catch (err) {
    console.error('user route error', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
}
