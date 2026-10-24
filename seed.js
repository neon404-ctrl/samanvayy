// SAMANVAY - Demo Data Seed
// Synthetic data for hackathon judging. Never use real student PII.

import { dbAdd, dbGetAll, dbClear } from './db.js';
import { hashPassword } from './auth.js';
import { scoreRecord } from './reconciliation.js';
import { addAuditEvent } from './audit.js';
import { issueCredential } from './credentials.js';

export const DEMO_INSTITUTIONS = [
  { id: 1, name: 'National Institute of Technology, Chennai', code: 'NIT-CHN', state: 'Tamil Nadu', type: 'NIT', status: 'active', registered_at: '2024-01-15', city: 'Chennai', contact: 'admin@nitchennai.ac.in' },
  { id: 2, name: 'Anna University, Coimbatore', code: 'AU-CBE', state: 'Tamil Nadu', type: 'State University', status: 'active', registered_at: '2024-01-20', city: 'Coimbatore', contact: 'admin@aucbe.ac.in' },
  { id: 3, name: 'PSG College of Technology', code: 'PSG-CBE', state: 'Tamil Nadu', type: 'Autonomous College', status: 'active', registered_at: '2024-02-01', city: 'Coimbatore', contact: 'admin@psgtech.ac.in' },
];

export const DEMO_USERS = [
  { username: 'superadmin', email: 'superadmin@samanvay.gov.in', name: 'Super Administrator', role: 'super_admin', institution_id: null, status: 'active' },
  { username: 'admin_nitchennai', email: 'admin@nitchennai.ac.in', name: 'Dr. Rajesh Kumar', role: 'institution_admin', institution_id: 1, status: 'active' },
  { username: 'admin_aucoimbatore', email: 'admin@aucbe.ac.in', name: 'Dr. Priya Sundar', role: 'institution_admin', institution_id: 2, status: 'active' },
  { username: 'admin_psgtech', email: 'admin@psgtech.ac.in', name: 'Dr. Anand Krishnan', role: 'institution_admin', institution_id: 3, status: 'active' },
  { username: 'student_arjun', email: 'arjun.sharma@student.nitchennai.ac.in', name: 'Arjun Sharma', role: 'student', institution_id: 1, status: 'active', student_ref: 'NIT-2021-001' },
  { username: 'student_priya', email: 'priya.r@student.aucbe.ac.in', name: 'Priya Radhakrishnan', role: 'student', institution_id: 2, status: 'active', student_ref: 'AU-2022-005' },
  { username: 'verifier_demo', email: 'verifier@aicte.gov.in', name: 'AICTE Verifier', role: 'verifier', institution_id: null, status: 'active' },
];

// ~100 Synthetic student records with intentional quality issues for demo
export const DEMO_STUDENTS = [
  // ===== NIT Chennai (institution_id: 1) =====
  // Good records
  { student_id: 'NIT-2021-001', institution_id: 1, full_name: 'Arjun Sharma', date_of_birth: '2003-05-14', guardian_name: 'Ramesh Sharma', department: 'Computer Science', admission_year: 2021, apaar_id: '123456789012', email: 'arjun.sharma@example.com', status: 'GOOD' },
  { student_id: 'NIT-2021-002', institution_id: 1, full_name: 'Anjali Kumari Singh', date_of_birth: '2002-11-22', guardian_name: 'Vijay Singh', department: 'Electronics', admission_year: 2021, apaar_id: '234567890123', email: 'anjali.singh@example.com', status: 'GOOD' },
  { student_id: 'NIT-2021-004', institution_id: 1, full_name: 'Smt. Karthika Nair', date_of_birth: '2002-08-30', guardian_name: 'Suresh Nair', department: 'Civil', admission_year: 2021, apaar_id: '456789012345', email: 'karthika.n@example.com', status: 'NORMALIZED', _note: 'Honorific Smt. removed' },
  { student_id: 'NIT-2021-005', institution_id: 1, full_name: 'Mohammed Abdul Rahman', date_of_birth: '2001-03-17', guardian_name: 'Abdul Rahman', department: 'Computer Science', admission_year: 2021, apaar_id: '567890123456', email: 'mar@example.com', status: 'GOOD' },
  { student_id: 'NIT-2021-006', institution_id: 1, full_name: 'Supriya Raghunath Hegde', date_of_birth: '2002-07-04', guardian_name: 'Raghunath Hegde', department: 'Mechanical', admission_year: 2021, apaar_id: '678901234567', email: 'supriya.h@example.com', status: 'GOOD' },
  { student_id: 'NIT-2021-007', institution_id: 1, full_name: 'Vivek Narayan Pillai', date_of_birth: '2002-01-20', guardian_name: 'Narayan Pillai', department: 'Information Technology', admission_year: 2021, apaar_id: '789012345671', email: 'vivek.p@example.com', status: 'GOOD' },
  { student_id: 'NIT-2021-008', institution_id: 1, full_name: 'Lalitha Krishnamurthy', date_of_birth: '2002-09-15', guardian_name: 'P. Krishnamurthy', department: 'Electrical', admission_year: 2021, apaar_id: '890123456781', email: 'lalitha.k@example.com', status: 'GOOD' },
  { student_id: 'NIT-2021-009', institution_id: 1, full_name: 'Nikhil Raj Menon', date_of_birth: '2002-04-11', guardian_name: 'Raj Menon', department: 'Chemical', admission_year: 2021, apaar_id: '901234567891', email: 'nikhil.m@example.com', status: 'GOOD' },
  { student_id: 'NIT-2021-010', institution_id: 1, full_name: 'Swati Agarwal', date_of_birth: '2002-12-29', guardian_name: 'Ramesh Agarwal', department: 'Computer Science', admission_year: 2021, apaar_id: '012345678901', email: 'swati.a@example.com', status: 'GOOD' },
  // Problematic records
  { student_id: 'NIT-2021-003', institution_id: 1, full_name: 'Arjun Sharma', date_of_birth: '2003-05-14', guardian_name: 'Ramesh Sharma', department: 'Mechanical', admission_year: 2021, apaar_id: '345678901234', email: 'arjun.s2@example.com', status: 'MISMATCH', _note: 'Potential duplicate of NIT-2021-001' },
  { student_id: 'NIT-2022-001', institution_id: 1, full_name: 'Deepika R.', date_of_birth: '2004-01-09', guardian_name: 'Rajan K.', department: 'Information Technology', admission_year: 2022, apaar_id: '678901234568', email: 'deepika.r@example.com', status: 'WARNING', _note: 'Initial-only last name' },
  { student_id: 'NIT-2022-002', institution_id: 1, full_name: 'Vikram S Pillai', date_of_birth: '29/02/2003', guardian_name: '', department: 'Electrical', admission_year: 2022, apaar_id: '789012345679', status: 'WARNING', _note: 'Invalid date (2003 not leap year), missing guardian' },
  { student_id: 'NIT-2022-003', institution_id: 1, full_name: 'P. Kavitha', date_of_birth: '2004-07-23', guardian_name: 'Perumal K', department: 'Computer Science', admission_year: 2022, apaar_id: '12345', status: 'ERROR', _note: 'Invalid APAAR ID format' },
  { student_id: 'NIT-2022-004', institution_id: 1, full_name: 'Rahul Kumar Gupta', date_of_birth: '2003-09-11', guardian_name: 'Suresh Gupta', department: 'Electronics', admission_year: 2022, apaar_id: '890123456789', status: 'GOOD' },
  { student_id: 'NIT-2022-005', institution_id: 1, full_name: 'Lakshmi Priya Venkataraman', date_of_birth: '2004-12-05', guardian_name: 'Venkataraman S', department: 'Mechanical', admission_year: 2022, apaar_id: '901234567890', status: 'GOOD' },
  { student_id: 'NIT-2022-006', institution_id: 1, full_name: 'Arun Kumar T', date_of_birth: '2003-06-18', guardian_name: 'Tamil Selvan', department: 'Civil', admission_year: 2022, apaar_id: '112233445566', status: 'GOOD' },
  { student_id: 'NIT-2022-007', institution_id: 1, full_name: 'Nandita Krishnan', date_of_birth: '2004-02-28', guardian_name: 'S. Krishnan', department: 'Computer Science', admission_year: 2022, apaar_id: '223344556677', status: 'GOOD' },
  { student_id: 'NIT-2022-008', institution_id: 1, full_name: 'PRADEEP KUMAR', date_of_birth: '2003-10-07', guardian_name: 'Srinivasan Kumar', department: 'Electrical', admission_year: 2022, apaar_id: '334455667788', status: 'NORMALIZED', _note: 'All-caps name needs normalization' },
  { student_id: 'NIT-2023-001', institution_id: 1, full_name: 'Aarav Singh', date_of_birth: '2005-03-14', guardian_name: 'Rajiv Singh', department: 'Computer Science', admission_year: 2023, apaar_id: '445566778899', status: 'GOOD' },
  { student_id: 'NIT-2023-002', institution_id: 1, full_name: 'Ishaan Verma', date_of_birth: '2005-07-22', guardian_name: 'Manoj Verma', department: 'Electronics', admission_year: 2023, apaar_id: '556677889900', status: 'GOOD' },
  { student_id: 'NIT-2023-003', institution_id: 1, full_name: 'Ms. Kavya Reddy', date_of_birth: '2005-11-08', guardian_name: 'Venkatesh Reddy', department: 'Mechanical', admission_year: 2023, apaar_id: '667788990011', status: 'NORMALIZED', _note: 'Ms. honorific removed' },
  { student_id: 'NIT-2023-004', institution_id: 1, full_name: 'Rohit Patel', date_of_birth: '2005-01-30', guardian_name: '', department: 'Information Technology', admission_year: 2023, apaar_id: '778899001122', status: 'WARNING', _note: 'Missing guardian name' },
  { student_id: 'NIT-2023-005', institution_id: 1, full_name: 'Tanvi Mehta', date_of_birth: '2005-09-16', guardian_name: 'Kiran Mehta', department: 'Chemical', admission_year: 2023, apaar_id: '889900112233', status: 'GOOD' },
  { student_id: 'NIT-2023-006', institution_id: 1, full_name: 'Yash Joshi', date_of_birth: '2005-04-05', guardian_name: 'Dilip Joshi', department: 'Civil', admission_year: 2023, apaar_id: '', status: 'WARNING', _note: 'Missing APAAR ID' },
  { student_id: 'NIT-2023-007', institution_id: 1, full_name: 'Ananya Bose', date_of_birth: '2005-08-19', guardian_name: 'Debashish Bose', department: 'Computer Science', admission_year: 2023, apaar_id: '990011223344', status: 'GOOD' },

  // ===== Anna University, Coimbatore (institution_id: 2) =====
  { student_id: 'AU-2022-001', institution_id: 2, full_name: 'Ramya Krishnan', date_of_birth: '2003-06-18', guardian_name: 'Krishna Murthy', department: 'Computer Science', admission_year: 2022, apaar_id: '111222333444', status: 'GOOD' },
  { student_id: 'AU-2022-002', institution_id: 2, full_name: 'Mr. Sanjay Mehta', date_of_birth: '2002-04-25', guardian_name: 'Anil Mehta', department: 'Civil', admission_year: 2022, apaar_id: '222333444555', status: 'NORMALIZED', _note: 'Mr. honorific removed' },
  { student_id: 'AU-2022-003', institution_id: 2, full_name: 'Ariun Sharma', date_of_birth: '2003-05-14', guardian_name: 'Ramesh Sharma', department: 'Electrical', admission_year: 2022, apaar_id: '333444555666', status: 'MISMATCH', _note: 'Possible cross-institution duplicate of NIT-2021-001 (typo: Ariun vs Arjun)' },
  { student_id: 'AU-2022-004', institution_id: 2, full_name: 'Sneha Padmanabhan', date_of_birth: '2003-02-14', guardian_name: 'Padmanabhan V', department: 'Information Technology', admission_year: 2022, apaar_id: '444555666777', status: 'GOOD' },
  { student_id: 'AU-2022-005', institution_id: 2, full_name: 'Priya Radhakrishnan', date_of_birth: '2004-09-30', guardian_name: 'Radhakrishnan M', department: 'Electronics', admission_year: 2022, apaar_id: '555666777888', status: 'GOOD' },
  { student_id: 'AU-2022-006', institution_id: 2, full_name: 'Anand Kumar T', date_of_birth: '2003-11-08', guardian_name: 'Thiagarajan', department: 'Mechanical', admission_year: 2022, apaar_id: '666777888999', status: 'GOOD' },
  { student_id: 'AU-2022-007', institution_id: 2, full_name: 'Surya Prakash K', date_of_birth: '2003-03-22', guardian_name: 'Karthikeyan S', department: 'Computer Science', admission_year: 2022, apaar_id: '777888999000', status: 'GOOD' },
  { student_id: 'AU-2022-008', institution_id: 2, full_name: 'Pooja Iyer', date_of_birth: '2002-12-12', guardian_name: 'Gopalan Iyer', department: 'Electronics', admission_year: 2022, apaar_id: '888999000111', status: 'GOOD' },
  { student_id: 'AU-2022-009', institution_id: 2, full_name: 'Bharath Raja P', date_of_birth: '2002-08-05', guardian_name: 'Perumal P', department: 'Mechanical', admission_year: 2022, apaar_id: '999000111222', status: 'GOOD' },
  { student_id: 'AU-2022-010', institution_id: 2, full_name: 'Kavitha Lakshmi S', date_of_birth: '2003-01-17', guardian_name: 'Sundaram K', department: 'Civil', admission_year: 2022, apaar_id: '000111222333', status: 'GOOD' },
  { student_id: 'AU-2023-001', institution_id: 2, full_name: '', date_of_birth: '2005-01-01', guardian_name: 'Unknown', department: 'Computer Science', admission_year: 2023, apaar_id: '', status: 'ERROR', _note: 'Missing name and APAAR ID' },
  { student_id: 'AU-2023-002', institution_id: 2, full_name: 'Meena Devi Sharma', date_of_birth: '2004-03-22', guardian_name: 'Sharma R.K.', department: 'Electronics', admission_year: 2023, apaar_id: '777888999001', status: 'GOOD' },
  { student_id: 'AU-2023-003', institution_id: 2, full_name: 'Jayaram V', date_of_birth: '2005-06-30', guardian_name: 'Venkataraman J', department: 'Information Technology', admission_year: 2023, apaar_id: '111223334445', status: 'GOOD' },
  { student_id: 'AU-2023-004', institution_id: 2, full_name: 'Harini Balasubramanian', date_of_birth: '2005-10-14', guardian_name: 'S. Balasubramanian', department: 'Mechanical', admission_year: 2023, apaar_id: '222334445556', status: 'GOOD' },
  { student_id: 'AU-2023-005', institution_id: 2, full_name: 'Vinoth Kumar M', date_of_birth: '2004-12-25', guardian_name: 'Murugan V', department: 'Computer Science', admission_year: 2023, apaar_id: '333445556667', status: 'GOOD' },
  { student_id: 'AU-2023-006', institution_id: 2, full_name: 'Brinda Devi S', date_of_birth: '2005-02-08', guardian_name: 'Senthilkumar B', department: 'Civil', admission_year: 2023, apaar_id: '444556667778', status: 'GOOD' },
  { student_id: 'AU-2023-007', institution_id: 2, full_name: 'Muthukumaran R', date_of_birth: '2004-08-19', guardian_name: 'R. Rajendran', department: 'Electrical', admission_year: 2023, apaar_id: 'INVALID123', status: 'ERROR', _note: 'Invalid APAAR ID (alphanumeric)' },
  { student_id: 'AU-2023-008', institution_id: 2, full_name: 'Sangeetha P', date_of_birth: '14-06-2005', guardian_name: 'Palaniappan S', department: 'Electronics', admission_year: 2023, apaar_id: '555667778889', status: 'NORMALIZED', _note: 'Date format DD-MM-YYYY normalized' },
  { student_id: 'AU-2023-009', institution_id: 2, full_name: 'Thilaga M', date_of_birth: '2005-04-11', guardian_name: 'Murugesan T', department: 'Computer Science', admission_year: 2023, apaar_id: '666778889990', status: 'GOOD' },
  { student_id: 'AU-2023-010', institution_id: 2, full_name: 'Selvakumar P', date_of_birth: '2004-07-27', guardian_name: 'Palanisamy S', department: 'Mechanical', admission_year: 2023, apaar_id: '', status: 'WARNING', _note: 'Missing APAAR ID' },
  { student_id: 'AU-2021-001', institution_id: 2, full_name: 'Dharani Devi R', date_of_birth: '2002-03-09', guardian_name: 'Ramasamy D', department: 'Electronics', admission_year: 2021, apaar_id: '100200300400', status: 'GOOD' },
  { student_id: 'AU-2021-002', institution_id: 2, full_name: 'Senthil Kumaran A', date_of_birth: '2001-11-16', guardian_name: 'Arunachalam S', department: 'Computer Science', admission_year: 2021, apaar_id: '200300400500', status: 'GOOD' },
  { student_id: 'AU-2021-003', institution_id: 2, full_name: 'Mahalakshmi Subramanian', date_of_birth: '2002-05-28', guardian_name: 'Subramanian K', department: 'Civil', admission_year: 2021, apaar_id: '300400500600', status: 'GOOD' },
  { student_id: 'AU-2021-004', institution_id: 2, full_name: 'Sakthi vel R.', date_of_birth: '2002-09-03', guardian_name: 'Rajendhiran S', department: 'Information Technology', admission_year: 2021, apaar_id: '400500600700', status: 'WARNING', _note: 'Trailing dot in name' },

  // ===== PSG College of Technology (institution_id: 3) =====
  { student_id: 'PSG-2021-001', institution_id: 3, full_name: 'Gopal Krishnan', date_of_birth: '2002-07-19', guardian_name: 'Krishnan M', department: 'Computer Science', admission_year: 2021, apaar_id: '888999000112', status: 'GOOD' },
  { student_id: 'PSG-2021-002', institution_id: 3, full_name: 'Dr. Shwetha Narayanan', date_of_birth: '2001-12-04', guardian_name: 'Narayanan P', department: 'Biomedical', admission_year: 2021, apaar_id: '999000111223', status: 'NORMALIZED', _note: 'Dr. honorific removed' },
  { student_id: 'PSG-2021-003', institution_id: 3, full_name: 'RAHUL KUMAR', date_of_birth: '2003-09-11', guardian_name: 'Suresh Gupta', department: 'Electronics', admission_year: 2021, apaar_id: '890123456789', status: 'MISMATCH', _note: 'All-caps, same DOB and guardian as NIT-2022-004 Rahul Kumar Gupta' },
  { student_id: 'PSG-2021-004', institution_id: 3, full_name: 'Kumari Rekha T', date_of_birth: '2002-04-14', guardian_name: 'Thirumalai K', department: 'Mechanical', admission_year: 2021, apaar_id: '111222333445', status: 'GOOD' },
  { student_id: 'PSG-2021-005', institution_id: 3, full_name: 'Saravanan Murugan', date_of_birth: '2002-01-31', guardian_name: 'Murugan S', department: 'Civil', admission_year: 2021, apaar_id: '222333444556', status: 'GOOD' },
  { student_id: 'PSG-2021-006', institution_id: 3, full_name: 'Preeti Sharma', date_of_birth: '2002-06-22', guardian_name: 'Anil Sharma', department: 'Computer Science', admission_year: 2021, apaar_id: '333444555667', status: 'GOOD' },
  { student_id: 'PSG-2021-007', institution_id: 3, full_name: 'Manoj Dhas T', date_of_birth: '2002-10-08', guardian_name: 'Thangaraj M', department: 'Information Technology', admission_year: 2021, apaar_id: '444555666778', status: 'GOOD' },
  { student_id: 'PSG-2021-008', institution_id: 3, full_name: 'Vimala Devi K', date_of_birth: '2002-02-15', guardian_name: 'Kannan V', department: 'Electrical', admission_year: 2021, apaar_id: '555666777889', status: 'GOOD' },
  { student_id: 'PSG-2022-001', institution_id: 3, full_name: 'Aisha Fathima', date_of_birth: '2004-06-12', guardian_name: 'Fathima M', department: 'Information Technology', admission_year: 2022, apaar_id: '100200300401', status: 'GOOD' },
  { student_id: 'PSG-2022-002', institution_id: 3, full_name: 'Suresh Babu T.V.', date_of_birth: '2003-08-28', guardian_name: 'Venkatesan T', department: 'Mechanical', admission_year: 2022, apaar_id: '200300400501', status: 'GOOD' },
  { student_id: 'PSG-2022-003', institution_id: 3, full_name: 'Nithya Sri K', date_of_birth: '2003-04-16', guardian_name: '', department: 'Computer Science', admission_year: 2022, apaar_id: '300400500601', status: 'WARNING', _note: 'Missing guardian name' },
  { student_id: 'PSG-2022-004', institution_id: 3, full_name: 'Balaji Subramanian', date_of_birth: '2003-10-01', guardian_name: 'Subramanian S', department: 'Civil', admission_year: 2022, apaar_id: '400500600701', status: 'GOOD' },
  { student_id: 'PSG-2022-005', institution_id: 3, full_name: 'Udhaya Kumar R', date_of_birth: '2003-07-14', guardian_name: 'Rajan U', department: 'Electronics', admission_year: 2022, apaar_id: '500600700801', status: 'GOOD' },
  { student_id: 'PSG-2022-006', institution_id: 3, full_name: 'Padmapriya N', date_of_birth: '2004-01-25', guardian_name: 'Narayanan P', department: 'Biomedical', admission_year: 2022, apaar_id: '600700800901', status: 'GOOD' },
  { student_id: 'PSG-2022-007', institution_id: 3, full_name: 'Bharani Kumar S', date_of_birth: '2003-05-31', guardian_name: 'Shankar B', department: 'Computer Science', admission_year: 2022, apaar_id: '700800901001', status: 'GOOD' },
  { student_id: 'PSG-2022-008', institution_id: 3, full_name: 'Geetha Rani A', date_of_birth: '2003-09-07', guardian_name: 'Arumugam G', department: 'Electrical', admission_year: 2022, apaar_id: '800901001101', status: 'GOOD' },
  { student_id: 'PSG-2023-001', institution_id: 3, full_name: 'Divya Bharathi M', date_of_birth: '2005-02-18', guardian_name: 'Murugan D', department: 'Electronics', admission_year: 2023, apaar_id: '500600700802', status: 'GOOD' },
  { student_id: 'PSG-2023-002', institution_id: 3, full_name: 'Karthik Raja S', date_of_birth: '2004-11-23', guardian_name: 'Selvam K', department: 'Computer Science', admission_year: 2023, apaar_id: '', status: 'WARNING', _note: 'Missing APAAR ID' },
  { student_id: 'PSG-2023-003', institution_id: 3, full_name: 'Pavithra Devi', date_of_birth: '2005-06-07', guardian_name: 'Devi G', department: 'Mechanical', admission_year: 2023, apaar_id: '600700800902', status: 'GOOD' },
  { student_id: 'PSG-2023-004', institution_id: 3, full_name: 'Siddharth R', date_of_birth: '2004-08-15', guardian_name: 'Rajendran S', department: 'Civil', admission_year: 2023, apaar_id: 'ABCD1234', status: 'ERROR', _note: 'Invalid APAAR ID (alphanumeric)' },
  { student_id: 'PSG-2023-005', institution_id: 3, full_name: 'Janani Kumari P', date_of_birth: '2005-03-29', guardian_name: 'Periyasamy J', department: 'Information Technology', admission_year: 2023, apaar_id: '700800901002', status: 'GOOD' },
  { student_id: 'PSG-2023-006', institution_id: 3, full_name: 'Hari Prasad V', date_of_birth: '2004-10-10', guardian_name: 'Vasanth H', department: 'Biomedical', admission_year: 2023, apaar_id: '800901001102', status: 'GOOD' },
  { student_id: 'PSG-2023-007', institution_id: 3, full_name: 'Sureka Devi C', date_of_birth: '2005-07-01', guardian_name: 'Chinnadurai S', department: 'Computer Science', admission_year: 2023, apaar_id: '900100120013', status: 'GOOD' },
  { student_id: 'PSG-2023-008', institution_id: 3, full_name: 'Ramachandran G', date_of_birth: '2004-12-16', guardian_name: 'G. Gopalakrishnan', department: 'Electrical', admission_year: 2023, apaar_id: '', status: 'WARNING', _note: 'Missing APAAR ID' },
  { student_id: 'PSG-2024-001', institution_id: 3, full_name: 'Adhithya N', date_of_birth: '2006-01-08', guardian_name: 'Nagarajan A', department: 'Computer Science', admission_year: 2024, apaar_id: '100200300402', status: 'GOOD' },
  { student_id: 'PSG-2024-002', institution_id: 3, full_name: 'Revathi K', date_of_birth: '2006-04-20', guardian_name: 'K. Kandasamy', department: 'Electronics', admission_year: 2024, apaar_id: '200300400502', status: 'GOOD' },
];

// Predefined match candidates for demo
export const DEMO_MATCH_CANDIDATES = [
  {
    student1_ref: 'NIT-2021-001', student2_ref: 'NIT-2021-003',
    institution1_id: 1, institution2_id: 1,
    confidence: 98, band: 'HIGH',
    status: 'PENDING_REVIEW',
    reasons: ['Name matches exactly', 'Date of birth matches exactly', 'Guardian name matches exactly'],
    created_at: '2024-03-10T09:00:00Z',
  },
  {
    student1_ref: 'NIT-2021-001', student2_ref: 'AU-2022-003',
    institution1_id: 1, institution2_id: 2,
    confidence: 82, band: 'MEDIUM',
    status: 'PENDING_REVIEW',
    reasons: ['Name similarity 88% (Arjun vs Ariun — likely typo)', 'Date of birth matches exactly', 'Guardian name matches exactly'],
    created_at: '2024-03-11T10:00:00Z',
  },
  {
    student1_ref: 'NIT-2022-004', student2_ref: 'PSG-2021-003',
    institution1_id: 1, institution2_id: 3,
    confidence: 91, band: 'HIGH',
    status: 'PENDING_REVIEW',
    reasons: ['Name similarity 85% (Rahul Kumar Gupta vs RAHUL KUMAR — partial name)', 'Date of birth matches exactly', 'Guardian name matches exactly'],
    created_at: '2024-03-12T11:00:00Z',
  },
  {
    student1_ref: 'AU-2022-005', student2_ref: 'NIT-2021-002',
    institution1_id: 2, institution2_id: 1,
    confidence: 64, band: 'LOW',
    status: 'APPROVED',
    reasons: ['Name similarity 71% (Priya Radhakrishnan vs Anjali Kumari Singh)', 'Date of birth mismatch'],
    created_at: '2024-03-08T14:00:00Z',
  },
];

const PASSWORDS = {
  superadmin: 'SuperAdmin@2026',
  admin_nitchennai: 'NitAdmin@2026',
  admin_aucoimbatore: 'AuAdmin@2026',
  admin_psgtech: 'PsgAdmin@2026',
  student_arjun: 'Student@2026',
  student_priya: 'Student@2026',
  verifier_demo: 'Verifier@2026',
};

export async function seedDatabase(force = false) {
  const existing = await dbGetAll('users');
  if (existing.length > 0 && !force) return { skipped: true };
  
  // Clear existing data
  const stores = ['users', 'institutions', 'students', 'match_candidates', 'audit_events', 'credentials', 'revocations', 'import_jobs', 'validation_issues', 'review_decisions'];
  for (const store of stores) await dbClear(store);
  
  // Seed institutions
  for (const inst of DEMO_INSTITUTIONS) {
    await dbAdd('institutions', inst);
  }
  
  // Seed users with hashed passwords
  const seededUsers = [];
  for (const user of DEMO_USERS) {
    const password_hash = await hashPassword(PASSWORDS[user.username] || 'Demo@2026');
    const id = await dbAdd('users', { ...user, password_hash });
    seededUsers.push({ ...user, id });
  }
  
  // Seed students with quality scores
  const seededStudents = [];
  for (const student of DEMO_STUDENTS) {
    const quality = scoreRecord(student);
    const id = await dbAdd('students', { 
      ...student, 
      quality_score: quality.score,
      quality_label: quality.quality,
      quality_issues: quality.issues,
      created_at: new Date(Date.now() - Math.random() * 90 * 24 * 3600000).toISOString(),
      updated_at: new Date().toISOString(),
    });
    seededStudents.push({ ...student, id });
  }
  
  // Seed match candidates
  for (const mc of DEMO_MATCH_CANDIDATES) {
    await dbAdd('match_candidates', { ...mc, updated_at: new Date().toISOString() });
  }

  // Issue a demo credential for the student account (Arjun Sharma)
  const arjunStudent = seededStudents.find(s => s.student_id === 'NIT-2021-001');
  const adminUser = seededUsers.find(u => u.username === 'admin_nitchennai');
  if (arjunStudent && adminUser) {
    try {
      await issueCredential(
        { ...arjunStudent, institution_id: 1 },
        'National Institute of Technology, Chennai',
        adminUser.id || 2
      );
    } catch(e) { console.warn('Could not seed credential:', e); }
  }

  // Seed a sample import job record
  await dbAdd('import_jobs', {
    institution_id: 1,
    filename: 'students_batch1.csv',
    status: 'COMPLETED',
    total_rows: 15,
    valid_rows: 10,
    warning_rows: 3,
    rejected_rows: 2,
    imported_by: 'admin_nitchennai',
    created_at: '2024-03-01T10:00:00Z',
    completed_at: '2024-03-01T10:05:00Z',
  });

  await addAuditEvent({ action: 'SYSTEM_SEEDED', actor_name: 'system', details: `Database seeded with ${DEMO_STUDENTS.length} students across ${DEMO_INSTITUTIONS.length} institutions` });
  
  return { success: true, counts: {
    institutions: DEMO_INSTITUTIONS.length,
    users: DEMO_USERS.length,
    students: DEMO_STUDENTS.length,
    match_candidates: DEMO_MATCH_CANDIDATES.length,
  }};
}

export const DEMO_CREDENTIALS_INFO = [
  { username: 'superadmin', password: 'SuperAdmin@2026', role: 'Super Administrator', description: 'Full system access — all institutions' },
  { username: 'admin_nitchennai', password: 'NitAdmin@2026', role: 'Institution Admin', description: 'NIT Chennai — manage students, imports' },
  { username: 'admin_aucoimbatore', password: 'AuAdmin@2026', role: 'Institution Admin', description: 'Anna University — manage students, imports' },
  { username: 'admin_psgtech', password: 'PsgAdmin@2026', role: 'Institution Admin', description: 'PSG Tech — manage students, imports' },
  { username: 'student_arjun', password: 'Student@2026', role: 'Student', description: 'View profile and credentials' },
  { username: 'verifier_demo', password: 'Verifier@2026', role: 'Verifier', description: 'QR credential verification' },
];
