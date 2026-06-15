const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const EmployeeSchema = new mongoose.Schema({
  fullName: String,
  mobileNumber: String,
  profilePhoto: String,
});

const Employee = mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);

async function checkDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('No MONGODB_URI found in env!');
    process.exit(1);
  }
  console.log('Connecting to:', uri);
  try {
    await mongoose.connect(uri);
    console.log('Connected!');
    const employees = await Employee.find({});
    console.log(`Found ${employees.length} employees:`);
    employees.forEach(emp => {
      console.log(`- Name: ${emp.fullName}, Mobile: ${emp.mobileNumber}, Photo: "${emp.profilePhoto}"`);
    });
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

checkDb();
