// timesheet Controller
const pool = require('../config/db');

// Helper to get user_id from request (for data isolation)
const getUserId = (req) => req.user?.id;

// --- READ (Get All) ---
exports.getTimesheets = async (req, res) => {
  try {
    const userId = getUserId(req);
    let query = 'SELECT * FROM timesheets';
    let params = [];
    
    // Filter by user_id if user is authenticated (not Account Manager sees all)
    if (req.user?.role !== 'Account Manager') {
      query += ' WHERE user_id = ?';
      params.push(userId);
    }
    
    query += ' ORDER BY id DESC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching timesheets' });
  }
};

// --- CREATE ---
exports.createTimesheet = async (req, res) => {
  const { timesheet_number, client_name, timesheet_date, client_id, co_number, transaction_code, occupation, shift_type, start_time, end_time, units, rate, total_hours, actual_lunch_hours, isDoubleShift, status } = req.body;
  const userId = getUserId(req);
  
  try {
    const query = `INSERT INTO timesheets (timesheet_number, client_name, timesheet_date, client_id, co_number, transaction_code, occupation, shift_type, start_time, end_time, units, rate, total_hours, actual_lunch_hours, isDoubleShift, status, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const [result] = await pool.query(query, [timesheet_number, client_name, timesheet_date, client_id, co_number, transaction_code, occupation, shift_type, start_time, end_time, units, rate, total_hours, actual_lunch_hours, isDoubleShift, status || 'active', userId]);
    res.status(201).json({ id: result.insertId, ...req.body, status: status || 'active', user_id: userId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating timesheet', details: error.message });
  }
};

// --- UPDATE ---
exports.updateTimesheet = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const userId = getUserId(req);
    
    try {
        // Fetch existing record first
        let query = 'SELECT * FROM timesheets WHERE id = ?';
        let params = [id];
        
        // Non-managers can only update their own records
        if (req.user?.role !== 'Account Manager') {
          query += ' AND user_id = ?';
          params.push(userId);
        }
        
        const [existing] = await pool.query(query, params);
        
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Timesheet not found' });
        }
        
        const existingRecord = existing[0];
        
        // Merge existing data with updates
        const mergedData = {
            timesheet_number: updates.timesheet_number ?? existingRecord.timesheet_number,
            client_name: updates.client_name ?? existingRecord.client_name,
            timesheet_date: updates.timesheet_date ?? existingRecord.timesheet_date,
            client_id: updates.client_id ?? existingRecord.client_id,
            co_number: updates.co_number ?? existingRecord.co_number,
            transaction_code: updates.transaction_code ?? existingRecord.transaction_code,
            occupation: updates.occupation ?? existingRecord.occupation,
            shift_type: updates.shift_type ?? existingRecord.shift_type,
            start_time: updates.start_time ?? existingRecord.start_time,
            end_time: updates.end_time ?? existingRecord.end_time,
            units: updates.units ?? existingRecord.units,
            rate: updates.rate ?? existingRecord.rate,
            total_hours: updates.total_hours ?? existingRecord.total_hours,
            actual_lunch_hours: updates.actual_lunch_hours ?? existingRecord.actual_lunch_hours,
            isDoubleShift: updates.isDoubleShift ?? existingRecord.isDoubleShift,
            status: updates.status ?? existingRecord.status,
        };
        
        const queryUpdate = `UPDATE timesheets SET timesheet_number=?, client_name=?, timesheet_date=?, client_id=?, co_number=?, transaction_code=?, occupation=?, shift_type=?, start_time=?, end_time=?, units=?, rate=?, total_hours=?, actual_lunch_hours=?, isDoubleShift=?, status=? WHERE id=?`;
        const [result] = await pool.query(queryUpdate, [
            mergedData.timesheet_number,
            mergedData.client_name,
            mergedData.timesheet_date,
            mergedData.client_id,
            mergedData.co_number,
            mergedData.transaction_code,
            mergedData.occupation,
            mergedData.shift_type,
            mergedData.start_time,
            mergedData.end_time,
            mergedData.units,
            mergedData.rate,
            mergedData.total_hours,
            mergedData.actual_lunch_hours,
            mergedData.isDoubleShift,
            mergedData.status,
            id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Timesheet not found' });
        }
        res.json({ message: 'Timesheet updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error updating timesheet', details: error.message });
    }
};

// --- DELETE ---
exports.deleteTimesheet = async (req, res) => {
  const { id } = req.params;
  const userId = getUserId(req);
  
  try {
    let query = 'DELETE FROM timesheets WHERE id = ?';
    let params = [id];
    
    // Non-managers can only delete their own records
    if (req.user?.role !== 'Account Manager') {
      query += ' AND user_id = ?';
      params.push(userId);
    }
    
    const [result] = await pool.query(query, params);
    
    if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Timesheet not found' });
    }
    res.json({ message: 'Timesheet deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting timesheet' });
  }
};

// --- IMPORT CSV ---
exports.importTimesheetsCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const csvData = req.file.buffer.toString('utf-8');
    const lines = csvData.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length < 1) {
      return res.status(400).json({ message: 'CSV file is empty' });
    }

    // Parse CSV - columns are mapped by position
    // Correct format: timesheet_number, timesheet_date, client_id, client_name, co_number, transaction_code, occupation, shift_type, start_time, end_time, units, rate
    const expectedColumns = 12;
    const userId = getUserId(req);
    
    const results = [];
    const errors = [];
    
    for (let i = 0; i < lines.length; i++) {
      // Filter out empty values and handle trailing commas
      const values = lines[i].split(',').map(v => v.trim().replace(/["\r]/g, '')).filter((v, idx, arr) => idx < 10 || v !== '');
      
      if (values.length < 8) {
        console.log(`[CSV Import] Row ${i + 1}: Not enough columns - expected at least 8, got ${values.length}`);
        errors.push(`Row ${i + 1}: Not enough columns (expected at least 8, got ${values.length})`);
        continue;
      }
      
      // Map columns by position (12 columns: timesheet_number, timesheet_date, client_id, client_name, co_number, transaction_code, occupation, shift_type, start_time, end_time, units, rate)
      const row = {
        timesheet_number: values[0],
        timesheet_date: values[1],
        client_id: values[2],
        client_name: values[3],
        co_number: values[4],
        transaction_code: values[5],
        occupation: values[6],
        shift_type: values[7],
        start_time: values[8] || '',
        end_time: values[9] || '',
        // Only set units/rate if they have valid numeric values
        units: (values[10] && values[10] !== '' && !isNaN(values[10])) ? parseFloat(values[10]) : null,
        rate: (values[11] && values[11] !== '' && !isNaN(values[11])) ? parseFloat(values[11]) : null,
        actual_lunch_hours: null
      };
      
      // Skip empty rows
      if (!row.timesheet_number && !row.timesheet_date && !row.client_id) {
        continue;
      }
      
      // Insert into database with user_id
      const query = `INSERT INTO timesheets (timesheet_number, timesheet_date, client_id, client_name, co_number, transaction_code, occupation, shift_type, start_time, end_time, units, rate, actual_lunch_hours, isDoubleShift, status, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`;
      
        try {
          const [result] = await pool.query(query, [
            row.timesheet_number || null,
            row.timesheet_date || null,
            row.client_id || null,
            row.client_name || '',
            row.co_number || null,
            row.transaction_code || '',
            row.occupation || '',
            row.shift_type || 'Standard',
            row.start_time || '',
            row.end_time || '',
            row.units || null,
            row.rate || null,
            row.actual_lunch_hours || null,
            row.isDoubleShift || false,
            userId
          ]);
          results.push(result.insertId);
        } catch (err) {
          console.log(`[CSV Import] Row ${i + 1} DB error:`, err.message);
          errors.push(`Row ${i + 1}: ${err.message}`);
        }
    }

    console.log('[CSV Import] Total imported:', results.length, 'Total errors:', errors.length);
    if (errors.length > 0) console.log('[CSV Import] Errors:', errors);

    res.json({
      message: `Successfully imported ${results.length} timesheets`,
      imported: results.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error importing CSV:', error);
    res.status(500).json({ message: 'Server error importing CSV', details: error.message });
  }
};

// --- IMPORT BIOMETRICS (CSV with total_hours, nullable start/end) ---
exports.importBiometrics = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const csvData = req.file.buffer.toString('utf-8');
    const lines = csvData.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length < 1) {
      return res.status(400).json({ message: 'CSV file is empty' });
    }

    // Parse CSV - columns are mapped by position
    // Format: timesheet_number, timesheet_date, client_id, client_name, co_number, transaction_code, occupation, shift_type, total_hours
    const userId = getUserId(req);
    
    const results = [];
    const errors = [];
    
    for (let i = 0; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/["\r]/g, '')).filter((v, idx, arr) => idx < 9 || v !== '');
      
      if (values.length < 8) {
        console.log(`[Biometrics Import] Row ${i + 1}: Not enough columns - expected at least 8, got ${values.length}`);
        errors.push(`Row ${i + 1}: Not enough columns (expected at least 8, got ${values.length})`);
        continue;
      }
      
      // Map columns: timesheet_number, timesheet_date, client_id, client_name, co_number, transaction_code, occupation, shift_type, total_hours
      const row = {
        timesheet_number: values[0],
        timesheet_date: values[1],
        client_id: values[2],
        client_name: values[3],
        co_number: values[4],
        transaction_code: values[5],
        occupation: values[6],
        shift_type: values[7],
        total_hours: (values[8] && values[8] !== '' && !isNaN(values[8])) ? parseFloat(values[8]) : null,
        // start_time and end_time will be NULL for biometrics imports
      };
      
      // Skip empty rows
      if (!row.timesheet_number && !row.timesheet_date && !row.client_id) {
        continue;
      }
      
      // Insert into database - note: total_hours column is used, start_time/end_time are NULL
      const query = `INSERT INTO timesheets (timesheet_number, timesheet_date, client_id, client_name, co_number, transaction_code, occupation, shift_type, start_time, end_time, total_hours, actual_lunch_hours, isDoubleShift, status, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, NULL, FALSE, 'active', ?)`;
      
        try {
          const [result] = await pool.query(query, [
            row.timesheet_number || null,
            row.timesheet_date || null,
            row.client_id || null,
            row.client_name || '',
            row.co_number || null,
            row.transaction_code || '',
            row.occupation || '',
            row.shift_type || 'Standard',
            row.total_hours || null,
            userId
          ]);
          results.push(result.insertId);
        } catch (err) {
          console.log(`[Biometrics Import] Row ${i + 1} DB error:`, err.message);
          errors.push(`Row ${i + 1}: ${err.message}`);
        }
    }

    console.log('[Biometrics Import] Total imported:', results.length, 'Total errors:', errors.length);
    if (errors.length > 0) console.log('[Biometrics Import] Errors:', errors);

    res.json({
      message: `Successfully imported ${results.length} timesheets from biometrics`,
      imported: results.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error importing biometrics:', error);
    res.status(500).json({ message: 'Server error importing biometrics', details: error.message });
  }
};

// --- MIGRATE FROM WORKHORSE ---
exports.migrateFromWorkhorse = async (req, res) => {
  try {
    const { timesheets } = req.body;
    
    if (!timesheets || !Array.isArray(timesheets) || timesheets.length === 0) {
      return res.status(400).json({ message: 'No timesheets provided for migration' });
    }

    // Get userId from request (fallback to null if not authenticated for shared access)
    const userId = req.user?.id || null;
    
    console.log('[Workhorse Migration] Received', timesheets.length, 'timesheets, userId:', userId);
    
    const results = [];
    const errors = [];

    for (const ts of timesheets) {
      // Map Workhorse fields to our database schema - be flexible with field names
      // Azure fields: TSNo, Date, CONumber, ClientName, ClientCode, Occupation, ShiftType, Start, End
      const timesheetNo = ts.TSNo || ts.TimesheetNo || ts.TimesheetID || ts.timesheet_number || ts.id || null;
      const timesheetDate = ts.Date || ts.TimesheetDate || ts.timesheet_date || null;
      const clientId = ts.ClientCode || ts.ClientID || ts.client_id || ts.Client || null;
      const clientName = ts.ClientName || ts.Client || ts.client_name || '';
      const coNumber = ts.CONumber || ts.CONo || ts.co_number || null;
      const transactionCode = ts.TransactionCode || ts.TxCode || ts.transaction_code || '';
      const occupation = ts.Occupation || ts.occupation || '';
      const shiftType = ts.ShiftType || ts.Shift || ts.shift_type || 'Standard';
      const startTime = ts.Start || ts.StartTime || ts.start_time || '';
      const endTime = ts.End || ts.EndTime || ts.end_time || '';
      const units = ts.Units || ts.units || null;
      const rate = ts.Rate || ts.rate || null;

      // Skip if no identifiable data at all
      if (!timesheetNo && !timesheetDate && !clientId && !clientName) {
        errors.push(`Skipped: no identifiable data`);
        continue;
      }

      // Insert into database - use userId if available, otherwise allow null for shared access
      const query = `INSERT INTO timesheets (timesheet_number, timesheet_date, client_id, client_name, co_number, transaction_code, occupation, shift_type, start_time, end_time, units, rate, actual_lunch_hours, isDoubleShift, status, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`;
      
      try {
        const [result] = await pool.query(query, [
          timesheetNo,
          timesheetDate,
          clientId,
          clientName,
          coNumber,
          transactionCode,
          occupation,
          shiftType,
          startTime,
          endTime,
          units ? parseFloat(units) : null,
          rate ? parseFloat(rate) : null,
          null,
          false,
          userId
        ]);
        results.push(result.insertId);
      } catch (err) {
        console.log(`[Workhorse Migration] DB error for ts:`, JSON.stringify(ts), 'Error:', err.message);
        errors.push(`Error: ${err.message}`);
      }
    }

    console.log('[Workhorse Migration] Total migrated:', results.length, 'Total errors:', errors.length);

    res.json({
      message: `Successfully migrated ${results.length} timesheets`,
      migrated: results.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error migrating from Workhorse:', error);
    res.status(500).json({ message: 'Server error migrating timesheets', details: error.message });
  }
};