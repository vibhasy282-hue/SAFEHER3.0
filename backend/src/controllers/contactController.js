const Contact = require('../models/Contact');
const User = require('../models/User');
const logger = require('../utils/logger');

exports.getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find({ user: req.user.id }).sort({ isPrimary: -1, createdAt: -1 });
    res.json({ success: true, contacts });
  } catch (error) {
    logger.error('Get contacts error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createContact = async (req, res) => {
  try {
    const { name, phone, email, relationship, isGuardian, isPrimary, notifyMethods } = req.body;

    // If setting as primary, unset previous primary
    if (isPrimary) {
      await Contact.updateMany({ user: req.user.id }, { isPrimary: false });
    }

    const contact = await Contact.create({
      user: req.user.id,
      name,
      phone,
      email,
      relationship,
      isGuardian,
      isPrimary,
      notifyMethods
    });

    // If guardian, add to user's guardians list
    if (isGuardian) {
      await User.findByIdAndUpdate(req.user.id, {
        $addToSet: { guardians: contact._id }
      });
    }

    res.status(201).json({ success: true, contact });
  } catch (error) {
    logger.error('Create contact error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateContact = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.isPrimary) {
      await Contact.updateMany({ user: req.user.id }, { isPrimary: false });
    }

    const contact = await Contact.findOneAndUpdate(
      { _id: id, user: req.user.id },
      updates,
      { new: true, runValidators: true }
    );

    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    res.json({ success: true, contact });
  } catch (error) {
    logger.error('Update contact error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await Contact.findOneAndDelete({ _id: id, user: req.user.id });

    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    await User.findByIdAndUpdate(req.user.id, {
      $pull: { guardians: contact._id }
    });

    res.json({ success: true, message: 'Contact deleted' });
  } catch (error) {
    logger.error('Delete contact error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
