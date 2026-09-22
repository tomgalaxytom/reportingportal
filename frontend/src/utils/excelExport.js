import * as XLSX from 'xlsx';

const numVal = (v) => {
  if (v === null || v === undefined || v === '' || v === '—') return 0;
  const n = parseFloat(v);
  return isNaN(n) ? v : n;
};

/**
 * Export consolidated waste stream reports to a cleanly formatted Excel workbook (.xlsx).
 */
export function exportConsolidatedReport({ stream, reportingMonth, rows = [], totalRow = null }) {
  if (!rows || rows.length === 0) {
    throw new Error('No data available to export.');
  }

  let aoa = [];
  let merges = [];
  let cols = [];
  let sheetName = 'Consolidated';

  if (stream === 'e-waste') {
    sheetName = 'E-Waste';
    aoa = [
      ['TAMIL NADU POLLUTION CONTROL BOARD'],
      [`E-WASTE CONSOLIDATED REPORT — ${reportingMonth}`],
      ['DEE OFFICE', 'COLLECTED (Kg)', '', '', '', '', 'RECOVERED (Kg)', '', '', '', '', 'STATUS'],
      ['', 'IT & Telecom', 'Electrical & Electronic', 'Toys', 'Medical Equipment', 'Others', 'IT & Telecom', 'Electrical & Electronic', 'Toys', 'Medical Equipment', 'Others', ''],
    ];

    merges = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 11 } },
      { s: { r: 2, c: 0 }, e: { r: 3, c: 0 } },
      { s: { r: 2, c: 1 }, e: { r: 2, c: 5 } },
      { s: { r: 2, c: 6 }, e: { r: 2, c: 10 } },
      { s: { r: 2, c: 11 }, e: { r: 3, c: 11 } },
    ];

    cols = [
      { wch: 22 }, { wch: 15 }, { wch: 18 }, { wch: 12 }, { wch: 16 }, { wch: 12 },
      { wch: 15 }, { wch: 18 }, { wch: 12 }, { wch: 16 }, { wch: 12 }, { wch: 15 }
    ];

    rows.forEach((r) => {
      aoa.push([
        r.district_name || '',
        numVal(r.collected_it_telecom),
        numVal(r.collected_electrical),
        numVal(r.collected_toys),
        numVal(r.collected_medical),
        numVal(r.collected_others),
        numVal(r.recovered_it_telecom),
        numVal(r.recovered_electrical),
        numVal(r.recovered_toys),
        numVal(r.recovered_medical),
        numVal(r.recovered_others),
        r.status || 'Not Submitted',
      ]);
    });

    if (totalRow) {
      aoa.push([
        'TOTAL',
        numVal(totalRow.collected_it_telecom),
        numVal(totalRow.collected_electrical),
        numVal(totalRow.collected_toys),
        numVal(totalRow.collected_medical),
        numVal(totalRow.collected_others),
        numVal(totalRow.recovered_it_telecom),
        numVal(totalRow.recovered_electrical),
        numVal(totalRow.recovered_toys),
        numVal(totalRow.recovered_medical),
        numVal(totalRow.recovered_others),
        '',
      ]);
    }
  } else if (stream === 'biomedical') {
    sheetName = 'Bio-Medical';
    aoa = [
      ['TAMIL NADU POLLUTION CONTROL BOARD'],
      [`BIO-MEDICAL WASTE CONSOLIDATED REPORT — ${reportingMonth}`],
      ['DEE OFFICE', 'GENERATED (Kg/day)', 'INCINERATOR (Kg/day)', 'AUTOCLAVE (Kg/day)', 'TOTAL TREATED (Kg/day)', 'DIFFERENCE (Kg/day)', 'STATUS'],
    ];

    merges = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
    ];

    cols = [
      { wch: 22 }, { wch: 20 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 20 }, { wch: 16 }
    ];

    rows.forEach((r) => {
      aoa.push([
        r.district_name || '',
        numVal(r.generated_qty),
        numVal(r.incinerator_treated_qty),
        numVal(r.autoclave_treated_qty),
        numVal(r.total_treated_qty),
        numVal(r.difference_qty),
        r.status || 'Not Submitted',
      ]);
    });

    if (totalRow) {
      aoa.push([
        'TOTAL',
        numVal(totalRow.generated_qty),
        numVal(totalRow.incinerator_treated_qty),
        numVal(totalRow.autoclave_treated_qty),
        numVal(totalRow.total_treated_qty),
        numVal(totalRow.difference_qty),
        '',
      ]);
    }
  } else if (stream === 'plastic') {
    sheetName = 'Plastic Waste';
    aoa = [
      ['TAMIL NADU POLLUTION CONTROL BOARD'],
      [`PLASTIC WASTE CONSOLIDATED REPORT — ${reportingMonth}`],
      ['DEE OFFICE', 'Single Use Plastic Inspection & PWM', '', '', '', 'Meendum Manjappai Campaign', '', '', '', 'Annexure I', 'Annexure II', 'STATUS'],
      ['', 'Inspections (Raids)', 'Seized Plastic (Tons)', 'Fine Imposed (₹ Lakhs)', 'Recyclers Registered', 'Awareness Activities', 'Manjappai Distributed', 'MVM Installed', 'Cloth Bags Dispensed (MVM)', '', '', ''],
    ];

    merges = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 11 } },
      { s: { r: 2, c: 0 }, e: { r: 3, c: 0 } },
      { s: { r: 2, c: 1 }, e: { r: 2, c: 4 } },
      { s: { r: 2, c: 5 }, e: { r: 2, c: 8 } },
      { s: { r: 2, c: 9 }, e: { r: 3, c: 9 } },
      { s: { r: 2, c: 10 }, e: { r: 3, c: 10 } },
      { s: { r: 2, c: 11 }, e: { r: 3, c: 11 } },
    ];

    cols = [
      { wch: 22 }, { wch: 20 }, { wch: 20 }, { wch: 22 }, { wch: 20 }, { wch: 20 },
      { wch: 22 }, { wch: 16 }, { wch: 26 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
    ];

    rows.forEach((r) => {
      aoa.push([
        r.district_name || '',
        numVal(r.inspection_raids_local_bodies),
        numVal(r.seized_plastic_tons),
        numVal(r.fine_imposed_lakhs),
        numVal(r.total_plastic_recyclers),
        numVal(r.awareness_activities_count),
        numVal(r.manjappai_distributed_count),
        numVal(r.mvm_installed_count),
        numVal(r.cloth_bags_dispensed_mvm),
        r.annexure1_status || 'Draft',
        r.annexure2_status || 'Draft',
        r.status || 'Not Submitted',
      ]);
    });

    if (totalRow) {
      aoa.push([
        'TOTAL',
        numVal(totalRow.inspection_raids_local_bodies),
        numVal(totalRow.seized_plastic_tons),
        numVal(totalRow.fine_imposed_lakhs),
        numVal(totalRow.total_plastic_recyclers),
        numVal(totalRow.awareness_activities_count),
        numVal(totalRow.manjappai_distributed_count),
        numVal(totalRow.mvm_installed_count),
        numVal(totalRow.cloth_bags_dispensed_mvm),
        '',
        '',
        '',
      ]);
    }
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  if (merges.length > 0) ws['!merges'] = merges;
  if (cols.length > 0) ws['!cols'] = cols;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const cleanMonth = (reportingMonth || 'Report').replace(/\s+/g, '_');
  const filename = `${sheetName.replace(/\s+/g, '_')}_Consolidated_${cleanMonth}.xlsx`;

  XLSX.writeFile(wb, filename);
  return filename;
}

/**
 * Export board dashboard overview table to Excel (.xlsx)
 */
export function exportDashboardReport({ activeTab, reportingMonth, rows = [] }) {
  if (!rows || rows.length === 0) {
    throw new Error('No data available to export.');
  }

  const sheetName = activeTab.substring(0, 31);
  const aoa = [
    ['TAMIL NADU POLLUTION CONTROL BOARD'],
    [`${activeTab.toUpperCase()} SUBMISSIONS — ${reportingMonth}`],
    ['DEE OFFICE', 'STATUS', 'SUBMISSION DATE', 'VERIFIED BY / NOTES'],
  ];

  const merges = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
  ];

  const cols = [
    { wch: 24 }, { wch: 18 }, { wch: 22 }, { wch: 25 }
  ];

  rows.forEach((r) => {
    aoa.push([
      r.district_name || '',
      r.status || 'Not Submitted',
      r.submitted_at || '—',
      r.notes || (r.status === 'Verified' ? 'Verified' : '—'),
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!merges'] = merges;
  ws['!cols'] = cols;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const cleanMonth = (reportingMonth || 'Report').replace(/\s+/g, '_');
  const filename = `${activeTab.replace(/\s+/g, '_')}_Submissions_${cleanMonth}.xlsx`;

  XLSX.writeFile(wb, filename);
  return filename;
}
