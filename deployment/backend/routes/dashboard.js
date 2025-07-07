const express = require('express');
const router = express.Router();
const { Op, fn, col, literal } = require('sequelize');
const Residence = require('../models/residence');
const Client = require('../models/client');
const Charge = require('../models/charge');
const Invoice = require('../models/invoice');
const Payment = require('../models/payment');

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    // Get current month and year
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    
    console.log('Current date calculation:', { now: now.toISOString(), month, year });

    // Total residences
    const totalResidences = await Residence.count();
    
    // Total clients
    const totalClients = await Client.count();
    
    // Total charges (all time)
    const totalChargesResult = await Charge.sum('amount');
    const totalCharges = totalChargesResult ? Number(totalChargesResult) : 0;
    
    // Debug: Get all charges to see their dates
    const allCharges = await Charge.findAll({
      attributes: ['date', 'amount'],
      order: [['date', 'DESC']],
      limit: 10
    });
    console.log('Sample charges from database:', allCharges.map(c => ({ date: c.date, amount: c.amount })));
    
    // Debug: Get sample invoices to see their structure
    const sampleInvoices = await Invoice.findAll({
      attributes: ['month', 'year', 'amount', 'status'],
      order: [['createdAt', 'DESC']],
      limit: 10
    });
    console.log('Sample invoices from database:', sampleInvoices.map(i => ({ month: i.month, year: i.year, amount: i.amount, status: i.status })));
    
    // Debug: Get ALL invoices to see what we have
    const allInvoices = await Invoice.findAll({
      attributes: ['month', 'year', 'amount', 'status', 'client_id'],
      order: [['year', 'DESC'], ['month', 'DESC']]
    });
    console.log('ALL INVOICES IN DATABASE:', allInvoices.map(i => ({ month: i.month, year: i.year, amount: i.amount, status: i.status, client_id: i.client_id })));
    
    // Debug: Check specifically for July 2025 invoices
    const july2025Invoices = await Invoice.findAll({
      where: { month: 7, year: 2025 },
      attributes: ['month', 'year', 'amount', 'status', 'client_id']
    });
    console.log('July 2025 invoices:', july2025Invoices.map(i => ({ month: i.month, year: i.year, amount: i.amount, status: i.status, client_id: i.client_id })));
    
    // Debug: Check for ANY invoices with Payé status
    const paidInvoices = await Invoice.findAll({
      where: { status: 'Payé' },
      attributes: ['month', 'year', 'amount', 'status', 'client_id'],
      order: [['year', 'DESC'], ['month', 'DESC']]
    });
    console.log('ALL PAID INVOICES:', paidInvoices.map(i => ({ month: i.month, year: i.year, amount: i.amount, status: i.status, client_id: i.client_id })));
    
    // Test: Check what invoices exist for month 7, year 2025 specifically
    const testInvoices = await Invoice.findAll({
      where: { month: 7, year: 2025 },
      attributes: ['month', 'year', 'amount', 'status', 'client_id']
    });
    console.log('TEST: Invoices for month 7, year 2025:', testInvoices.map(i => ({ month: i.month, year: i.year, amount: i.amount, status: i.status, client_id: i.client_id })));
    
    // Test: Check what charges exist for month 7, year 2025 specifically
    const testCharges = await Charge.findAll({
      where: literal('MONTH(date) = 7 AND YEAR(date) = 2025'),
      attributes: ['date', 'amount']
    });
    console.log('TEST: Charges for month 7, year 2025:', testCharges.map(c => ({ date: c.date, amount: c.amount })));
    
    // Total client balance (sum of balances for clients with Payé status)
    const totalBalanceResult = await Client.sum('balance', {
      where: { payment_status: 'Payé' }
    });
    const totalBalance = totalBalanceResult ? Number(totalBalanceResult) : 0;
    
    // Monthly revenues (from invoices with Payé status)
    console.log('Looking for invoices with month:', month, 'year:', year, 'status: Payé');
    const monthlyRevenuesResult = await Invoice.sum('amount', {
      where: { 
        month: month,
        year: year,
        status: 'Payé'
      }
    });
    const monthlyRevenues = monthlyRevenuesResult ? Number(monthlyRevenuesResult) : 0;
    console.log('Monthly revenues result:', monthlyRevenuesResult, 'Final:', monthlyRevenues);
    
    // Monthly charges (sum of charges for current month)
    const currentMonthStart = `${year}-${month.toString().padStart(2, '0')}-01`;
    const currentMonthEnd = `${year}-${month.toString().padStart(2, '0')}-31`;
    console.log('Looking for charges between:', currentMonthStart, 'and', currentMonthEnd);
    
    const monthlyChargesResult = await Charge.sum('amount', {
      where: {
        date: {
          [Op.between]: [currentMonthStart, currentMonthEnd]
        }
      }
    });
    const monthlyCharges = monthlyChargesResult ? Number(monthlyChargesResult) : 0;
    
    console.log('Monthly charges result:', monthlyChargesResult, 'Final:', monthlyCharges);
    
    // Net revenue (revenues - charges)
    const netRevenue = monthlyRevenues - monthlyCharges;

    // Charges vs Revenues for last 12 months
    const chartData = [];
    console.log('=== STARTING CHART DATA CALCULATION ===');
    console.log('Current date:', { month, year });
    
    // Get all unique months from charges and invoices
    const chargeMonths = await Charge.findAll({
      attributes: [
        [literal('YEAR(date)'), 'year'],
        [literal('MONTH(date)'), 'month']
      ],
      group: [literal('YEAR(date)'), literal('MONTH(date)')],
      order: [[literal('YEAR(date)'), 'DESC'], [literal('MONTH(date)'), 'DESC']]
    });
    
    const invoiceMonths = await Invoice.findAll({
      attributes: ['year', 'month'],
      group: ['year', 'month'],
      order: [['year', 'DESC'], ['month', 'DESC']]
    });
    
    // Combine and deduplicate months
    const allMonths = new Set();
    chargeMonths.forEach(cm => allMonths.add(`${cm.dataValues.year}-${cm.dataValues.month.toString().padStart(2, '0')}`));
    invoiceMonths.forEach(im => allMonths.add(`${im.year}-${im.month.toString().padStart(2, '0')}`));
    
    const sortedMonths = Array.from(allMonths).sort().reverse().slice(0, 12); // Get last 12 months with data
    console.log('Months with data:', sortedMonths);
    
    for (const monthKey of sortedMonths) {
      const [y, m] = monthKey.split('-');
      const year = parseInt(y);
      const month = parseInt(m);
      
      console.log(`\n--- Processing month ${monthKey} (${month}/${year}) ---`);
      
      // Get revenues from invoices (Payé status only)
      console.log(`Looking for invoices: month=${month}, year=${year}, status=Payé`);
      const revenuesResult = await Invoice.sum('amount', { 
        where: { 
          month: month,
          year: year,
          status: 'Payé'
        } 
      });
      const revenues = revenuesResult ? Number(revenuesResult) : 0;
      console.log(`Revenues for ${monthKey}:`, revenuesResult, 'Final:', revenues);
      
      // Get charges for this month
      console.log(`Looking for charges in month ${month}, year ${year}`);
      const chargesResult = await Charge.sum('amount', {
        where: literal(`MONTH(date) = ${month} AND YEAR(date) = ${year}`)
      });
      const charges = chargesResult ? Number(chargesResult) : 0;
      console.log(`Charges for ${monthKey}:`, chargesResult, 'Final:', charges);
      
      chartData.push({ 
        month: monthKey, 
        revenues, 
        charges,
        net: revenues - charges
      });
      
      console.log(`Chart data for ${monthKey}:`, { month: monthKey, revenues, charges, net: revenues - charges });
    }
    console.log('=== FINAL CHART DATA ===', chartData);

    res.json({
      totalResidences,
      totalClients,
      totalCharges,
      totalBalance,
      monthlyRevenues,
      monthlyCharges,
      netRevenue,
      chartData
    });
    
    console.log('Dashboard stats response:', {
      totalResidences,
      totalClients,
      totalCharges,
      totalBalance,
      monthlyRevenues,
      monthlyCharges,
      netRevenue,
      chartDataLength: chartData.length
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 