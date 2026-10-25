import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'ledgerly_gst_secret_jwt_key_2026', {
    expiresIn: '30d',
  });
};

export const register = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'owner',
      phone,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Switch role endpoint to let the frontend switch between demo accounts effortlessly
export const switchRoleUser = async (req, res) => {
  try {
    const { role } = req.params;
    if (!['owner', 'biller', 'ca'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    let user = await User.findOne({ role });
    if (!user) {
      user = await User.create({
        name: role === 'owner' ? 'Aditya Sharma (Owner)' : role === 'biller' ? 'Pooja Verma (Biller)' : 'Ramesh Mehta, FCA (CA)',
        email: `${role}@ledgerly.app`,
        password: 'password123',
        role: role,
        phone: '+91 98200 11223',
      });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
