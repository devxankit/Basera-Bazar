const PDFDocument = require('pdfkit');

/**
 * Generate a salary slip PDF as a Buffer.
 * Returns a Promise<Buffer>.
 */
function generateSalarySlip(salaryData) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const {
      staff_name = 'Staff Member',
      staff_role = '',
      staff_id = '',
      month = '',
      base_salary = 0,
      incentive_amount = 0,
      team_commission_amount = 0,
      deduction_amount = 0,
      effective_salary = 0,
      status = 'pending',
      paid_at = null,
    } = salaryData;

    const net_pay = effective_salary || (base_salary + incentive_amount + team_commission_amount - deduction_amount);

    // ─── Header ─────────────────────────────────────────────────────────────
    doc.rect(0, 0, 595, 80).fill('#001b4e');
    doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text('BaseraBazar', 50, 25);
    doc.fontSize(10).font('Helvetica').text('Salary Slip', 50, 50);
    doc.fillColor('#fa8639').text(`Month: ${month}`, 400, 35, { align: 'right', width: 145 });

    doc.fillColor('#000000').moveDown(4);

    // ─── Staff Info ──────────────────────────────────────────────────────────
    doc.roundedRect(50, 100, 495, 80, 4).stroke('#e2e8f0');
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#001b4e').text(staff_name, 65, 115);
    doc.fontSize(10).font('Helvetica').fillColor('#475569');
    doc.text(`Role: ${formatRole(staff_role)}`, 65, 135);
    doc.text(`ID: ${staff_id}`, 65, 150);

    const statusColor = status === 'paid' ? '#16a34a' : '#ea580c';
    doc.fillColor(statusColor).font('Helvetica-Bold').text(status.toUpperCase(), 400, 135, { align: 'right', width: 130 });
    if (paid_at) {
      doc.font('Helvetica').fillColor('#64748b').fontSize(9).text(`Paid: ${new Date(paid_at).toLocaleDateString('en-IN')}`, 400, 152, { align: 'right', width: 130 });
    }

    // ─── Earnings Table ──────────────────────────────────────────────────────
    doc.fillColor('#000000').fontSize(12).font('Helvetica-Bold').text('Earnings', 50, 200);
    doc.moveTo(50, 216).lineTo(545, 216).stroke('#e2e8f0');

    const rows = [
      ['Basic Salary', `₹${base_salary.toLocaleString('en-IN')}`],
    ];
    if (incentive_amount > 0) rows.push(['Performance Incentive', `₹${incentive_amount.toLocaleString('en-IN')}`]);
    if (team_commission_amount > 0) rows.push(['Team Commission', `₹${team_commission_amount.toLocaleString('en-IN')}`]);

    let y = 225;
    doc.fontSize(10).font('Helvetica');
    for (const [label, value] of rows) {
      doc.fillColor('#374151').text(label, 65, y);
      doc.fillColor('#16a34a').text(value, 400, y, { align: 'right', width: 130 });
      y += 20;
    }

    // ─── Deductions ──────────────────────────────────────────────────────────
    if (deduction_amount > 0) {
      doc.fillColor('#000000').fontSize(12).font('Helvetica-Bold').text('Deductions', 50, y + 10);
      doc.moveTo(50, y + 26).lineTo(545, y + 26).stroke('#e2e8f0');
      y += 35;
      doc.fontSize(10).font('Helvetica').fillColor('#374151').text('Performance Deduction (10%)', 65, y);
      doc.fillColor('#dc2626').text(`-₹${deduction_amount.toLocaleString('en-IN')}`, 400, y, { align: 'right', width: 130 });
      y += 20;
    }

    // ─── Net Pay ─────────────────────────────────────────────────────────────
    doc.rect(50, y + 15, 495, 50).fill('#f8fafc').stroke('#001b4e');
    doc.fillColor('#001b4e').fontSize(13).font('Helvetica-Bold').text('NET PAY', 65, y + 28);
    doc.fillColor('#001b4e').fontSize(16).text(`₹${net_pay.toLocaleString('en-IN')}`, 400, y + 26, { align: 'right', width: 130 });

    // ─── Footer ──────────────────────────────────────────────────────────────
    doc.fillColor('#94a3b8').fontSize(8).font('Helvetica')
      .text('This is a computer-generated salary slip. No signature required.', 50, 750, { align: 'center', width: 495 });

    doc.end();
  });
}

function formatRole(role) {
  const map = {
    team_leader: 'Team Leader (State Head)',
    field_executive: 'Field Executive',
    office_staff: 'Office Staff (Calling)',
    executive: 'Field Executive',
  };
  return map[role] || role;
}

module.exports = { generateSalarySlip };
