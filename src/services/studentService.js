const Student = require('../models/Student');
const AppError = require('../utils/AppError');

async function createStudent(body) {
  const { regNo, name, email } = body || {};
  return Student.create({ regNo, name, email });
}

async function getStudent(regNo) {
  const key = String(regNo || '').trim().toUpperCase();
  const student = await Student.findOne({ regNo: key }).lean();
  if (!student) throw new AppError(404, `Student ${key} not found`);
  return student;
}

module.exports = { createStudent, getStudent };
