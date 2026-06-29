// client rates controller
const pool = require('../config/db');

// Helper to get user_id from request (for data isolation)
const getUserId = (req) => req.user?.id;

// ---- READ (Get All) -----
exports.getClientrates = async(req,res) => {
    try {
        // All users can see ALL client rates (to calculate wages, batch export, invoice, etc.)
        // Only the Account Manager can create/update/delete
        const query = 'SELECT * FROM client_rates ORDER BY client_id DESC';
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (error) {
     console.error('Error fetching client rates:', error);
     res.status(500).json({ message: 'Server error fetching client rates'});
    }
}

// ---- CREATE  -----
exports.createClientrate = async(req,res) => {
    const {lookup, client_id, client_name, site, region, pay_cycle, sector, contact_person, contact_details, sales_rep, transaction_code, occupation, nt_hourly_rate, ot_1_5_rate, ot_2_0_rate, annual_leave, sick_leave, family_resp_leave, paid_public_holidays, severance_provision, annual_bonus, provident_fund, wellness_fund, industry_reg_levy, sub_total_a, uif, sdl, coida, sub_total_b, medicals, criminal_checks, ppe, preservation_fund, service_fee, admin_costs, payroll_financing_fee, supervision_fee, nt_invoice_rate, ot_1_5_invoice_rate, ot_2_0_invoice_rate, night_shift_allowance, substance_allowance, hazardous_allowance, nt_per_day, deduct_lunch_hour, hrs_pd} = req.body
    const userId = getUserId(req);
    
    try {
        const query = ` INSERT INTO client_rates (lookup, client_id, client_name, site, region, pay_cycle, sector, contact_person, contact_details, sales_rep, transaction_code, occupation, nt_hourly_rate, ot_1_5_rate, ot_2_0_rate, annual_leave, sick_leave, family_resp_leave, paid_public_holidays, severance_provision, annual_bonus, provident_fund, wellness_fund, industry_reg_levy, sub_total_a, uif, sdl, coida, sub_total_b, medicals, criminal_checks, ppe, preservation_fund, service_fee, admin_costs, payroll_financing_fee, supervision_fee, nt_invoice_rate, ot_1_5_invoice_rate, ot_2_0_invoice_rate, night_shift_allowance, substance_allowance, hazardous_allowance, nt_per_day, deduct_lunch_hour, hrs_pd, user_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
        const [result] = await pool.query(query, [lookup, client_id, client_name, site, region, pay_cycle, sector, contact_person, contact_details, sales_rep, transaction_code, occupation, nt_hourly_rate, ot_1_5_rate, ot_2_0_rate, annual_leave, sick_leave, family_resp_leave, paid_public_holidays, severance_provision, annual_bonus, provident_fund, wellness_fund, industry_reg_levy, sub_total_a, uif, sdl, coida, sub_total_b, medicals, criminal_checks, ppe, preservation_fund, service_fee, admin_costs, payroll_financing_fee, supervision_fee, nt_invoice_rate, ot_1_5_invoice_rate, ot_2_0_invoice_rate, night_shift_allowance, substance_allowance, hazardous_allowance, nt_per_day, deduct_lunch_hour, hrs_pd, userId]);
        res.status(201).json({ id: result.insertId, ...req.body, user_id: userId});
    } catch (error){
        console.error(error);
        res.status(500).json({ message: 'Server error creating client rate', details: error.message});
    }
}

// ---- UPDATE -----
exports.updateClientrate = async (req, res) => {
    const { id } = req.params;
    const { lookup, client_id, client_name, site, region, pay_cycle, sector, contact_person, contact_details, sales_rep, transaction_code, occupation, nt_hourly_rate, ot_1_5_rate, ot_2_0_rate, annual_leave, sick_leave, family_resp_leave, paid_public_holidays, severance_provision, annual_bonus, provident_fund, wellness_fund, industry_reg_levy, sub_total_a, uif, sdl, coida, sub_total_b, medicals, criminal_checks, ppe, preservation_fund, service_fee, admin_costs, payroll_financing_fee, supervision_fee, nt_invoice_rate, ot_1_5_invoice_rate, ot_2_0_invoice_rate, night_shift_allowance, substance_allowance, hazardous_allowance, nt_per_day, deduct_lunch_hour, hrs_pd } = req.body;
    const userId = getUserId(req);
    
    try {
        let query = `UPDATE client_rates SET lookup=?, client_id=?, client_name=?, site=?, region=?, pay_cycle=?, sector=?, contact_person=?, contact_details=?, sales_rep=?, transaction_code=?, occupation=?, nt_hourly_rate=?, ot_1_5_rate=?, ot_2_0_rate=?, annual_leave=?, sick_leave=?, family_resp_leave=?, paid_public_holidays=?, severance_provision=?, annual_bonus=?, provident_fund=?, wellness_fund=?, industry_reg_levy=?, sub_total_a=?, uif=?, sdl=?, coida=?, sub_total_b=?, medicals=?, criminal_checks=?, ppe=?, preservation_fund=?, service_fee=?, admin_costs=?, payroll_financing_fee=?, supervision_fee=?, nt_invoice_rate=?, ot_1_5_invoice_rate=?, ot_2_0_invoice_rate=?, night_shift_allowance=?, substance_allowance=?, hazardous_allowance=?, nt_per_day=?, deduct_lunch_hour=?, hrs_pd=? WHERE id=?`;
        let params = [lookup, client_id, client_name, site, region, pay_cycle, sector, contact_person, contact_details, sales_rep, transaction_code, occupation, nt_hourly_rate, ot_1_5_rate, ot_2_0_rate, annual_leave, sick_leave, family_resp_leave, paid_public_holidays, severance_provision, annual_bonus, provident_fund, wellness_fund, industry_reg_levy, sub_total_a, uif, sdl, coida, sub_total_b, medicals, criminal_checks, ppe, preservation_fund, service_fee, admin_costs, payroll_financing_fee, supervision_fee, nt_invoice_rate, ot_1_5_invoice_rate, ot_2_0_invoice_rate, night_shift_allowance, substance_allowance, hazardous_allowance, nt_per_day, deduct_lunch_hour, hrs_pd, id];
        
        // Non-managers can only update their own records
        if (req.user?.role !== 'Account Manager') {
          query += ' AND user_id=?';
          params.push(userId);
        }
        
        const [result] = await pool.query(query, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Client rate not found' });
        }
        res.json({ message: 'Client rate updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error updating Client rate', details: error.message });
    }
};

// ---- DELETE -----
exports.deleteClientrate = async (req, res) => {
  const { id } = req.params;
  const userId = getUserId(req);
  
  try {
    let query = 'DELETE FROM client_rates WHERE id = ?';
    let params = [id];
    
    // Non-managers can only delete their own records
    if (req.user?.role !== 'Account Manager') {
      query += ' AND user_id = ?';
      params.push(userId);
    }
    
    const [result] = await pool.query(query, params);
    
    if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Client rate not found' });
    }
    res.json({ message: 'Client rate deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting Client rate' });
  }
};