import PDFDocument from 'pdfkit';

/**
 * Generates an executive PDF security report using PDFKit.
 * Returns a Promise resolving to a Buffer.
 */
export function generateExecutivePdfReport({
  organization,
  account,
  scan,
  findings = [],
  complianceResults = [],
}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 45,
        bufferPages: true,
      });

      const buffers = [];
      doc.on('data', (data) => buffers.push(data));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // Header Banner
      doc.rect(45, 45, 505, 50).fill('#0B1120');
      doc.fillColor('#3B82F6').fontSize(18).font('Helvetica-Bold').text('CLOUDGUARD', 60, 58);
      doc.fillColor('#94A3B8').fontSize(10).font('Helvetica').text('Cloud Security Posture & Compliance Report', 60, 78);
      doc.fillColor('#F8FAFC').fontSize(9).font('Helvetica-Bold').text(`SCAN ID: ${scan._id.toString().slice(-8).toUpperCase()}`, 400, 68);

      doc.moveDown(3);
      doc.y = 115;

      // Metadata Grid
      doc.fillColor('#1E293B').fontSize(10).font('Helvetica-Bold').text('ASSESSMENT METADATA', 45, doc.y);
      doc.moveDown(0.5);

      const metaY = doc.y;
      doc.fontSize(9).font('Helvetica');
      doc.fillColor('#475569').text('Organization:', 45, metaY);
      doc.fillColor('#0F172A').font('Helvetica-Bold').text(organization?.name || 'Primary Org', 120, metaY);

      doc.fillColor('#475569').font('Helvetica').text('Account Name:', 45, metaY + 16);
      doc.fillColor('#0F172A').font('Helvetica-Bold').text(account?.name || 'Default Account', 120, metaY + 16);

      doc.fillColor('#475569').font('Helvetica').text('Environment:', 45, metaY + 32);
      doc.fillColor('#0F172A').font('Helvetica-Bold').text((account?.environment || 'production').toUpperCase(), 120, metaY + 32);

      doc.fillColor('#475569').font('Helvetica').text('Scan Date:', 300, metaY);
      doc.fillColor('#0F172A').font('Helvetica-Bold').text(new Date(scan.completedAt || scan.startedAt).toLocaleString(), 380, metaY);

      doc.fillColor('#475569').font('Helvetica').text('Assessment Mode:', 300, metaY + 16);
      doc.fillColor('#0F172A').font('Helvetica-Bold').text('Simulated Rule-Based Engine', 380, metaY + 16);

      doc.fillColor('#475569').font('Helvetica').text('Framework:', 300, metaY + 32);
      doc.fillColor('#0F172A').font('Helvetica-Bold').text('NIST CSF 2.0 (Demonstration)', 380, metaY + 32);

      doc.y = metaY + 55;
      doc.strokeColor('#CBD5E1').lineWidth(1).moveTo(45, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(1);

      // Executive Summary Box
      const scoreY = doc.y + 10;
      doc.rect(45, scoreY, 240, 75).fill('#F1F5F9');
      doc.fillColor('#475569').fontSize(9).font('Helvetica-Bold').text('SECURITY POSTURE SCORE', 55, scoreY + 12);
      
      const scoreColor = scan.postureScore >= 80 ? '#16A34A' : scan.postureScore >= 50 ? '#D97706' : '#DC2626';
      doc.fillColor(scoreColor).fontSize(28).font('Helvetica-Bold').text(`${scan.postureScore}/100`, 55, scoreY + 28);
      doc.fillColor('#64748B').fontSize(8).font('Helvetica').text('Formula: 100 base - active finding penalties', 55, scoreY + 58);

      // Compliance Box
      doc.rect(310, scoreY, 240, 75).fill('#F1F5F9');
      doc.fillColor('#475569').fontSize(9).font('Helvetica-Bold').text('NIST CSF COMPLIANCE SCORE', 320, scoreY + 12);
      doc.fillColor('#2563EB').fontSize(28).font('Helvetica-Bold').text(`${scan.complianceScore || 0}%`, 320, scoreY + 28);
      doc.fillColor('#64748B').fontSize(8).font('Helvetica').text(`Control Coverage: ${scan.complianceCoverage || 0}%`, 320, scoreY + 58);

      doc.y = scoreY + 95;

      // Findings Severity Summary
      doc.fillColor('#1E293B').fontSize(11).font('Helvetica-Bold').text('FINDINGS DISTRIBUTION BY SEVERITY', 45, doc.y);
      doc.moveDown(0.6);

      const sevY = doc.y;
      const criticalCount = scan.findingsSummary?.critical || 0;
      const highCount = scan.findingsSummary?.high || 0;
      const medCount = scan.findingsSummary?.medium || 0;
      const lowCount = scan.findingsSummary?.low || 0;

      const drawStat = (label, count, color, x) => {
        doc.rect(x, sevY, 115, 45).fill('#F8FAFC');
        doc.rect(x, sevY, 4, 45).fill(color);
        doc.fillColor('#475569').fontSize(8).font('Helvetica-Bold').text(label.toUpperCase(), x + 12, sevY + 8);
        doc.fillColor(color).fontSize(16).font('Helvetica-Bold').text(String(count), x + 12, sevY + 22);
      };

      drawStat('Critical', criticalCount, '#DC2626', 45);
      drawStat('High', highCount, '#EA580C', 175);
      drawStat('Medium', medCount, '#D97706', 305);
      drawStat('Low', lowCount, '#2563EB', 435);

      doc.y = sevY + 65;

      // Critical and High Findings Table
      doc.fillColor('#1E293B').fontSize(11).font('Helvetica-Bold').text('PRIORITY FINDINGS & REMEDIATION (CRITICAL & HIGH)', 45, doc.y);
      doc.moveDown(0.5);

      const priorityFindings = findings.filter((f) => f.severity === 'critical' || f.severity === 'high').slice(0, 5);

      if (priorityFindings.length === 0) {
        doc.fillColor('#16A34A').fontSize(9).font('Helvetica').text('No Critical or High severity findings detected in this assessment.', 45, doc.y);
      } else {
        for (const item of priorityFindings) {
          if (doc.y > 680) {
            doc.addPage();
            doc.y = 50;
          }

          const fBoxY = doc.y;
          const badgeColor = item.severity === 'critical' ? '#DC2626' : '#EA580C';

          doc.rect(45, fBoxY, 505, 70).strokeColor('#E2E8F0').lineWidth(0.5).stroke();
          doc.rect(45, fBoxY, 5, 70).fill(badgeColor);

          doc.fillColor(badgeColor).fontSize(8).font('Helvetica-Bold').text(`[${item.severity.toUpperCase()}] ${item.ruleId}`, 58, fBoxY + 8);
          doc.fillColor('#0F172A').fontSize(9).font('Helvetica-Bold').text(item.title, 130, fBoxY + 8);

          doc.fillColor('#475569').fontSize(8).font('Helvetica').text(`Asset: ${item.resourceName} (${item.resourceType})`, 58, fBoxY + 22);
          doc.fillColor('#0F172A').fontSize(8).font('Helvetica-Bold').text('Evidence: ', 58, fBoxY + 34);
          doc.fillColor('#475569').font('Helvetica').text(item.evidence?.message || item.description, 105, fBoxY + 34, { width: 430 });

          doc.fillColor('#0F172A').fontSize(8).font('Helvetica-Bold').text('Remediation: ', 58, fBoxY + 48);
          doc.fillColor('#2563EB').font('Helvetica').text(item.remediationInstructions?.summary || 'Follow security baseline hardening procedure.', 120, fBoxY + 48, { width: 415 });

          doc.y = fBoxY + 76;
        }
      }

      // Compliance Highlights
      if (doc.y > 660) {
        doc.addPage();
        doc.y = 50;
      } else {
        doc.moveDown(1);
      }

      doc.fillColor('#1E293B').fontSize(11).font('Helvetica-Bold').text('NIST CSF 2.0 CONTROL STATUS', 45, doc.y);
      doc.moveDown(0.5);

      const compSlice = complianceResults.slice(0, 6);
      for (const cr of compSlice) {
        const cStatusColor = cr.status === 'pass' ? '#16A34A' : cr.status === 'fail' ? '#DC2626' : '#64748B';
        doc.fillColor('#0F172A').fontSize(8).font('Helvetica-Bold').text(cr.controlId, 45, doc.y);
        doc.fillColor('#334155').font('Helvetica').text(cr.controlTitle, 105, doc.y, { width: 330 });
        doc.fillColor(cStatusColor).font('Helvetica-Bold').text(cr.status.toUpperCase(), 480, doc.y);
        doc.moveDown(0.4);
      }

      // Methodology & Limitations (Required by prompt)
      if (doc.y > 670) {
        doc.addPage();
        doc.y = 50;
      } else {
        doc.moveDown(1);
      }

      doc.strokeColor('#CBD5E1').lineWidth(0.5).moveTo(45, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.8);
      doc.fillColor('#64748B').fontSize(8).font('Helvetica-Bold').text('ASSESSMENT METHODOLOGY & DISCLAIMER');
      doc.font('Helvetica').text(
        'This assessment report is generated deterministically by CloudGuard using simulated cloud resource inventories and rule-based inspection logic. Results reflect compliance against mapped student-project baselines inspired by NIST CSF 2.0 and do not constitute a certified third-party SOC2 or formal regulatory audit. Real-time cloud synchronization requires active provider API credentials.',
        45,
        doc.y,
        { width: 505 }
      );

      // Page numbers footer
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc.fillColor('#94A3B8').fontSize(8).font('Helvetica').text(
          `Page ${i + 1} of ${pages.count}  |  Confidential Security Document  |  CloudGuard Platform`,
          45,
          790,
          { align: 'center', width: 505 }
        );
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
