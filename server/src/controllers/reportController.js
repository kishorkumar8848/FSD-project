import { z } from 'zod';
import { Report } from '../models/Report.js';
import { Scan } from '../models/Scan.js';
import { CloudAccount } from '../models/CloudAccount.js';
import { CloudResource } from '../models/CloudResource.js';
import { Finding } from '../models/Finding.js';
import { ComplianceResult } from '../models/ComplianceResult.js';
import { AuditLog } from '../models/AuditLog.js';
import { generateExecutivePdfReport } from '../services/reports/pdfReportService.js';
import { generateFindingsCsv, generateResourcesCsv } from '../services/reports/csvReportService.js';

const createReportSchema = z.object({
  accountId: z.string().min(1, 'Target account ID is required'),
  scanId: z.string().optional(),
  reportType: z.enum(['executive_summary_pdf', 'detailed_findings_csv', 'resource_inventory_csv']),
});

export async function getReports(req, res, next) {
  try {
    const reports = await Report.find({ organization: req.organizationId })
      .populate('account', 'name provider')
      .populate('generatedBy', 'name email')
      .select('-fileData') // Exclude binary buffer from table query for performance
      .sort({ createdAt: -1 });

    res.json({ success: true, data: reports });
  } catch (err) {
    next(err);
  }
}

export async function createReport(req, res, next) {
  try {
    const data = createReportSchema.parse(req.body);

    const account = await CloudAccount.findOne({
      _id: data.accountId,
      organization: req.organizationId,
    });
    if (!account) {
      return res.status(404).json({ success: false, error: { message: 'Cloud account not found.' } });
    }

    // Find target scan or latest completed scan
    let scan = null;
    if (data.scanId) {
      scan = await Scan.findOne({ _id: data.scanId, organization: req.organizationId });
    } else {
      scan = await Scan.findOne({
        account: account._id,
        organization: req.organizationId,
        status: 'completed',
      }).sort({ completedAt: -1 });
    }

    if (!scan) {
      return res.status(400).json({
        success: false,
        error: { message: 'No completed scan available for this account. Run an assessment scan first.' },
      });
    }

    const timestamp = new Date().toISOString().slice(0, 10);
    let buffer = null;
    let fileName = '';
    let format = 'pdf';
    let title = '';

    const findings = await Finding.find({
      organization: req.organizationId,
      account: account._id,
    }).sort({ severity: 1, riskScore: -1 });

    const complianceResults = await ComplianceResult.find({
      organization: req.organizationId,
      scan: scan._id,
    });

    const resources = await CloudResource.find({
      organization: req.organizationId,
      account: account._id,
    });

    if (data.reportType === 'executive_summary_pdf') {
      format = 'pdf';
      fileName = `CloudGuard_Executive_Report_${account.name.replace(/\s+/g, '_')}_${timestamp}.pdf`;
      title = `Executive Security Summary — ${account.name}`;
      buffer = await generateExecutivePdfReport({
        organization: req.organization,
        account,
        scan,
        findings,
        complianceResults,
      });
    } else if (data.reportType === 'detailed_findings_csv') {
      format = 'csv';
      fileName = `CloudGuard_Findings_${account.name.replace(/\s+/g, '_')}_${timestamp}.csv`;
      title = `Security Findings Export — ${account.name}`;
      const csvStr = generateFindingsCsv(findings);
      buffer = Buffer.from(csvStr, 'utf-8');
    } else {
      format = 'csv';
      fileName = `CloudGuard_Inventory_${account.name.replace(/\s+/g, '_')}_${timestamp}.csv`;
      title = `Resource Inventory Export — ${account.name}`;
      const csvStr = generateResourcesCsv(resources);
      buffer = Buffer.from(csvStr, 'utf-8');
    }

    const report = await Report.create({
      organization: req.organizationId,
      account: account._id,
      scan: scan._id,
      generatedBy: req.user._id,
      title,
      reportType: data.reportType,
      format,
      fileName,
      fileSize: buffer.length,
      fileData: buffer,
      status: 'ready',
      metadata: {
        postureScore: scan.postureScore || 100,
        complianceScore: scan.complianceScore || 100,
        totalFindings: findings.length,
        criticalFindings: scan.findingsSummary?.critical || 0,
        highFindings: scan.findingsSummary?.high || 0,
        resourcesAssessed: resources.length,
      },
    });

    await AuditLog.create({
      organization: req.organizationId,
      actor: req.user._id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'REPORT_GENERATED',
      targetType: 'report',
      targetId: report._id.toString(),
      details: { fileName, reportType: data.reportType },
    });

    const reportResponse = report.toObject();
    delete reportResponse.fileData;

    res.status(201).json({
      success: true,
      message: 'Report generated successfully and ready for download.',
      data: reportResponse,
    });
  } catch (err) {
    next(err);
  }
}

export async function downloadReport(req, res, next) {
  try {
    const report = await Report.findOne({
      _id: req.params.id,
      organization: req.organizationId,
    });

    if (!report || !report.fileData) {
      return res.status(404).json({ success: false, error: { message: 'Report artifact not found.' } });
    }

    const contentType = report.format === 'pdf' ? 'application/pdf' : 'text/csv; charset=utf-8';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${report.fileName}"`);
    res.setHeader('Content-Length', report.fileData.length);

    res.send(report.fileData);
  } catch (err) {
    next(err);
  }
}
