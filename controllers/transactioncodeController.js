// Transactioncode Controller
const pool = require('../config/db');

// Helper to get user_id from request (for data isolation)
const getUserId = (req) => req.user?.id;

// --- READ (Get All) ---
exports.getTransactionCode = async (req, res) => {
  try {
    // All users can see ALL transaction codes (to calculate wages, batch export, invoice, etc.)
    // Only the Account Manager can create/update/delete
    const query = 'SELECT * FROM transaction_codes ORDER BY transaction_code DESC';
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching transaction codes:', error);
    res.status(500).json({ message: 'Server error fetching transaction codes' });
  }
};

// --- CREATE ---
exports.createTransactionCode = async (req, res) => {
  const { transaction_code, occupation_name } = req.body;
  const userId = getUserId(req);
  
  try {
    const [exists] = await pool.query(
      'SELECT id FROM transaction_codes WHERE transaction_code = ?',
      [transaction_code]
    );

    if (exists.length > 0) {
      return res.status(400).json({ message: 'Transaction code already exists' });
    }

    const query = `INSERT INTO transaction_codes (transaction_code, occupation_name, user_id) VALUES (?, ?, ?)`;
    const [result] = await pool.query(query, [transaction_code, occupation_name, userId]);

    res.status(201).json({ id: result.insertId, transaction_code, occupation_name, user_id: userId });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error creating transaction code",
      details: error.message,
    });
  }
};


// --- UPDATE ---
exports.updateTransactionCode = async (req, res) => {
  const { id } = req.params;
  const { transaction_code, occupation_name } = req.body;
  const userId = getUserId(req);
  
  try {
    let query = `UPDATE transaction_codes SET transaction_code=?, occupation_name=? WHERE id=?`;
    let params = [transaction_code, occupation_name, id];
    
    // Non-managers can only update their own records
    if (req.user?.role !== 'Account Manager') {
      query += ' AND user_id=?';
      params.push(userId);
    }
    
    const [result] = await pool.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Transaction code not found" });
    }
    res.json({ message: "Transaction code updated successfully" });
  } catch (error) {
    console.error(error);
        res.status(500).json({ message: 'Server error updating transaction codes', details: error.message });
  }
};

// --- DELETE ---
exports.deleteTransactionCode = async (req, res) => {
  const { id } = req.params;
  const userId = getUserId(req);
  
  try {
    let query = 'DELETE FROM transaction_codes WHERE id = ?';
    let params = [id];
    
    // Non-managers can only delete their own records
    if (req.user?.role !== 'Account Manager') {
      query += ' AND user_id = ?';
      params.push(userId);
    }
    
    const [result] = await pool.query(query, params);
    
    if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Transaction code not found' });
    }
    res.json({ message: 'Transaction code deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting Transaction code' });
  }
};