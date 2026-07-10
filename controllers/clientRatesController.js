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


//import client rates
exports.importClientRatesCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No Rates uploaded' });
    }

    const csvData = req.file.buffer.toString('utf-8');
    const lines = csvData.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length < 1) {
      return res.status(400).json({ message: 'Client Rates file is empty' });
    }

    // Parse CSV - columns are mapped by position
    // Correct format: timesheet_number, timesheet_date, client_id, client_name, co_number, transaction_code, occupation, shift_type, start_time, end_time, units, rate
    const expectedColumns = 46;
    const userId = getUserId(req);
    
    const results = [];
    const errors = [];
    
    for (let i = 0; i < lines.length; i++) {
      // Filter out empty values and handle trailing commas
      const values = lines[i].split(',').map(v => v.trim().replace(/["\r]/g, '')).filter((v, idx, arr) => idx < 40 || v !== '');
      
      if (values.length < 40) {
        console.log(`[Client Rate Import] Row ${i + 1}: Not enough columns - expected at least 40, got ${values.length}`);
        errors.push(`Row ${i + 1}: Not enough columns (expected at least 40, got ${values.length})`);
        continue;
      }
      
      // Map columns by position (12 columns: timesheet_number, timesheet_date, client_id, client_name, co_number, transaction_code, occupation, shift_type, start_time, end_time, units, rate)
      const row = {
        lookup: values[0],
        client_id: values[1],
        client_name: values[2],
        site: values[3],
        region: values[4],
        pay_cycle: values[5],
        sector: values[6],
        contact_person: values[7],
        contact_details: values[8],
        sales_rep: values[9],
        transaction_code: values[10],
        occupation: values[11],
        // Only set units/rate if they have valid numeric values
        nt_hourly_rate: (values[12] && values[12] !== '' && !isNaN(values[12])) ? parseFloat(values[12]) : null,
        ot_1_5_rate: (values[13] && values[13] !== '' && !isNaN(values[13])) ? parseFloat(values[13]) : null,
        ot_2_0_rate: (values[14] && values[14] !== '' && !isNaN(values[14])) ? parseFloat(values[14]) : null,
        annual_leave: (values[15] && values[15] !== '' && !isNaN(values[15])) ? parseFloat(values[15]) : null,
        sick_leave: (values[16] && values[16] !== '' && !isNaN(values[16])) ? parseFloat(values[16]) : null,
        family_resp_leave: (values[17] && values[17] !== '' && !isNaN(values[17])) ? parseFloat(values[17]) : null,
        paid_public_holidays: (values[18] && values[18] !== '' && !isNaN(values[18])) ? parseFloat(values[18]) : null,
        severance_provision: (values[19] && values[19] !== '' && !isNaN(values[19])) ? parseFloat(values[19]) : null,
        annual_bonus: (values[20] && values[20] !== '' && !isNaN(values[20])) ? parseFloat(values[20]) : null,
        provident_fund: (values[21] && values[21] !== '' && !isNaN(values[21])) ? parseFloat(values[21]) : null,
        wellness_fund: (values[22] && values[22] !== '' && !isNaN(values[22])) ? parseFloat(values[22]) : null,
        industry_reg_levy: (values[23] && values[23] !== '' && !isNaN(values[23])) ? parseFloat(values[23]) : null,
        sub_total_a: (values[24] && values[24] !== '' && !isNaN(values[24])) ? parseFloat(values[24]) : null,
        uif: (values[25] && values[25] !== '' && !isNaN(values[25])) ? parseFloat(values[25]) : null,
        sdl: (values[26] && values[26] !== '' && !isNaN(values[26])) ? parseFloat(values[26]) : null,
        coida: (values[27] && values[27] !== '' && !isNaN(values[27])) ? parseFloat(values[27]) : null,
        sub_total_b: (values[28] && values[28] !== '' && !isNaN(values[28])) ? parseFloat(values[28]) : null,
        medicals: (values[29] && values[29] !== '' && !isNaN(values[29])) ? parseFloat(values[29]) : null,
        criminal_checks: (values[30] && values[30] !== '' && !isNaN(values[30])) ? parseFloat(values[30]) : null,
        ppe: (values[31] && values[31] !== '' && !isNaN(values[31])) ? parseFloat(values[31]) : null,
        preservation_fund: (values[32] && values[32] !== '' && !isNaN(values[32])) ? parseFloat(values[32]) : null,
        service_fee: (values[33] && values[33] !== '' && !isNaN(values[33])) ? parseFloat(values[33]) : null,
        admin_costs: (values[34] && values[34] !== '' && !isNaN(values[34])) ? parseFloat(values[34]) : null,
        payroll_financing_fee: (values[35] && values[35] !== '' && !isNaN(values[35])) ? parseFloat(values[35]) : null,
        supervision_fee: (values[36] && values[36] !== '' && !isNaN(values[36])) ? parseFloat(values[36]) : null,
        nt_invoice_rate: (values[37] && values[37] !== '' && !isNaN(values[37])) ? parseFloat(values[37]) : null,
        ot_1_5_invoice_rate: (values[38] && values[38] !== '' && !isNaN(values[38])) ? parseFloat(values[38]) : null,
        ot_2_0_invoice_rate: (values[39] && values[39] !== '' && !isNaN(values[39])) ? parseFloat(values[39]) : null,
        night_shift_allowance: (values[40] && values[40] !== '' && !isNaN(values[40])) ? parseFloat(values[40]) : null,
        substance_allowance: (values[41] && values[41] !== '' && !isNaN(values[41])) ? parseFloat(values[41]) : null,
        hazardous_allowance: (values[42] && values[42] !== '' && !isNaN(values[42])) ? parseFloat(values[42]) : null,
        nt_per_day: (values[43] && values[43] !== '' && !isNaN(values[43])) ? parseFloat(values[43]) : null,
        deduct_lunch_hour: (values[44] && values[44] !== '' && !isNaN(values[44])) ? parseFloat(values[44]) : null,
        hrs_pd: (values[45] && values[45] !== '' && !isNaN(values[45])) ? parseFloat(values[54]) : null,
      };
      
      // Skip empty rows
      if (!row.timesheet_number && !row.timesheet_date && !row.client_id) {
        continue;
      }
      
      // Insert into database with user_id
      const query = `INSERT INTO timesheets (lookup, client_id, client_name, site, region, pay_cycle, sector, contact_person, contact_details, sales_rep, transaction_code, occupation, nt_hourly_rate, ot_1_5_rate, ot_2_0_rate, annual_leave, sick_leave, family_resp_leave, paid_public_holidays, severance_provision, annual_bonus, provident_fund, wellness_fund, industry_reg_levy, sub_total_a, uif, sdl, coida, sub_total_b, medicals, criminal_checks, ppe, preservation_fund, service_fee, admin_costs, payroll_financing_fee, supervision_fee, nt_invoice_rate, ot_1_5_invoice_rate, ot_2_0_invoice_rate, night_shift_allowance, substance_allowance, hazardous_allowance, nt_per_day, deduct_lunch_hour, hrs_pd, user_id) VALUES (?, ?, ?, ?, ?, ?,?, ?, ?, ?, ?,?, ?, ?, ?, ?,?, ?, ?, ?, ?,?, ?, ?, ?, ?,?, ?, ?, ?, ?,?, ?, ?, ?, ?,?, ?, ?, ?, ?,?, ?, ?, ?, ?,?)`;
      
        try {
          const [result] = await pool.query(query, [
            row.lookup,
            row.client_id,
            row.client_name,
            row.site,
            row.region,
            row.pay_cycle,
            row.sector,
            row.contact_person,
            row.contact_details,
            row.sales_rep,
            row.transaction_code,
            row.occupation,
            row.nt_hourly_rate,
            row.ot_1_5_rate,
            row.ot_2_0_rate,
            row.annual_leave,
            row.sick_leave,
            row.family_resp_leave,
            row.paid_public_holidays,
            row.severance_provision,
            row.annual_bonus,
            row.provident_fund,
            row.wellness_fund,
            row.industry_reg_levy,
            row.sub_total_a,
            row.uif,
            row.sdl,
            row.coida,
            row.sub_total_b,
            row.medicals,
            row.criminal_checks,
            row.ppe,
            row.preservation_fund,
            row.service_fee,
            row.admin_costs,
            row.payroll_financing_fee,
            row.supervision_fee,
            row.nt_invoice_rate,
            row.ot_1_5_invoice_rate,
            row.ot_2_0_invoice_rate,
            row.night_shift_allowance,
            row.substance_allowance,
            row.hazardous_allowance,
            row.nt_per_day,
            row.deduct_lunch_hour,
            row.hrs_pd,
            userId
          ]);
          results.push(result.insertId);
        } catch (err) {
          console.log(`[Client Rates CSV Import] Row ${i + 1} DB error:`, err.message);
          errors.push(`Row ${i + 1}: ${err.message}`);
        }
    }

    console.log('[CSV Import] Total imported:', results.length, 'Total errors:', errors.length);
    if (errors.length > 0) console.log('[CSV Import] Errors:', errors);

    res.json({
      message: `Successfully imported ${results.length} client rates`,
      imported: results.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error importing Client Rates CSV:', error);
    res.status(500).json({ message: 'Server error importing CSV', details: error.message });
  }
};