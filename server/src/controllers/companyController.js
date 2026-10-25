import Company from '../models/Company.js';

export const getCompany = async (req, res) => {
  try {
    let company = await Company.findOne();
    if (!company) {
      company = await Company.create({});
    }
    res.json(company);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCompany = async (req, res) => {
  try {
    // Only owner can update sensitive company details
    if (req.user.role !== 'owner') {
      return res.status(403).json({
        message: 'Permission denied: Only the Owner can modify Company and Bank settings.',
      });
    }

    let company = await Company.findOne();
    if (!company) {
      company = new Company(req.body);
    } else {
      Object.assign(company, req.body);
    }

    const updated = await company.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
