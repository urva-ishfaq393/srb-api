const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    regNo: {
      type: String,
      required: [true, 'regNo is required'],
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z]{2}\d{2}-[A-Z]{3}-\d{3}$/, 'regNo must look like FA23-BCS-045'],
      immutable: true,
    },
    name: { type: String, required: [true, 'name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'email is required'],
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'email is not valid'],
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('Student', studentSchema);
