// employee Controller
const pool = require('../config/db');

// Helper to get user_id from request (for data isolation)
const getUserId = (req) => req.user?.id;

// --- READ (Get All) ---
exports.getEmployees = async (req, res) => {
  try {
    // All users can see ALL employees (for lookups when capturing timesheets)
    // Only the Account Manager can create/update/delete
    const query = 'SELECT * FROM employees ORDER BY co_number ASC';
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ message: 'Server error fetching employees' });
  }
};

// --- READ (Get by CO Number) ---
exports.getEmployeeByCoNumber = async (req, res) => {
  const { co_number } = req.params;
  
  try {
    // All users can look up any employee by CO number (for timesheet capture)
    const [rows] = await pool.query('SELECT * FROM employees WHERE co_number = ?', [co_number]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching employee by CO Number:', error);
    res.status(500).json({ message: 'Server error fetching employee' });
  }
};

// --- CREATE ---
exports.createEmployee = async (req, res) => {
  const { co_number, full_name, id_number, co_code } = req.body;
  const userId = getUserId(req);
  
  try {
    const query = `INSERT INTO employees (co_number, full_name, id_number, co_code, user_id) VALUES (?, ?, ?, ?, ?)`;
    const [result] = await pool.query(query, [co_number, full_name, id_number, co_code, userId]);
    res.status(201).json({ id: result.insertId, ...req.body, user_id: userId });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ message: 'Server error creating employee', details: error.message });
  }
};

// --- UPDATE ---
exports.updateEmployee = async (req, res) => {
    const { id } = req.params;
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
        return res.status(400).json({ message: 'Invalid id' });
    }
    const { co_number, full_name, id_number, co_code } = req.body;
    const userId = getUserId(req);
    
    try {
        let query = `UPDATE employees SET co_number=?, full_name=?, id_number=?, co_code=? WHERE id=?`;
        let params = [co_number, full_name, id_number, co_code, parsedId];
        
        // Non-managers can only update their own employees
        if (req.user?.role !== 'Account Manager') {
          query += ' AND user_id=?';
          params.push(userId);
        }
        
        const [result] = await pool.query(query, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        res.json({ message: 'Employee updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error updating employee', details: error.message });
    }
};

// --- DELETE ---
exports.deleteEmployee = async (req, res) => {
  const { id } = req.params;
  const userId = getUserId(req);
  
  try {
    let query = 'DELETE FROM employees WHERE id = ?';
    let params = [id];
    
    // Non-managers can only delete their own employees
    if (req.user?.role !== 'Account Manager') {
      query += ' AND user_id = ?';
      params.push(userId);
    }
    
    const [result] = await pool.query(query, params);

    if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Employee not found' });
    }
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting employee' });
  }
};