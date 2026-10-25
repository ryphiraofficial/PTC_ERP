import Customer from '../models/Customer.js';

export const getCustomers = async (req, res) => {
  try {
    const { search, customerType } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { gstin: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    if (customerType) {
      query.customerType = customerType;
    }

    const customers = await Customer.find(query).sort({ createdAt: -1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createCustomer = async (req, res) => {
  try {
    // If GSTIN provided, derive State code (first 2 digits)
    const data = { ...req.body };
    if (data.gstin && data.gstin.length >= 2) {
      const gstinStateCode = data.gstin.substring(0, 2);
      if (!data.billingAddress) data.billingAddress = {};
      if (!data.billingAddress.stateCode) {
        data.billingAddress.stateCode = gstinStateCode;
      }
    }

    const customer = await Customer.create(data);
    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    Object.assign(customer, req.body);
    const updated = await customer.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    if (req.user.role === 'ca') {
      return res.status(403).json({ message: 'CA has audit-only permissions and cannot delete customers' });
    }

    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    await customer.deleteOne();
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
