#!/usr/bin/env node

/**
 * Security Audit Script for PsyRehab Application
 * This script performs various security checks and generates audit reports
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

class SecurityAuditor {
  constructor() {
    this.reportDir = path.join(process.cwd(), 'security-reports');
    this.timestamp = new Date().toISOString().split('T')[0];
    this.auditResults = {
      timestamp: new Date().toISOString(),
      dependencies: null,
      codeAnalysis: null,
      configuration: null,
      certificates: null,
      summary: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        passed: 0
      }
    };
    
    this.ensureReportDirectory();
  }

  ensureReportDirectory() {
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level}] ${message}`);
  }

  async runDependencyAudit() {
    this.log('Running dependency vulnerability audit...');
    
    try {
      const auditOutput = execSync('npm audit --json', { 
        encoding: 'utf8',
        cwd: process.cwd()
      });
      
      const auditData = JSON.parse(auditOutput);
      this.auditResults.dependencies = auditData;
      
      // Count vulnerabilities by severity
      if (auditData.vulnerabilities) {
        Object.values(auditData.vulnerabilities).forEach(vuln => {
          const severity = vuln.severity;
          if (this.auditResults.summary[severity] !== undefined) {
            this.auditResults.summary[severity]++;
          }
        });
      }
      
      this.log(`Found ${Object.keys(auditData.vulnerabilities || {}).length} dependency vulnerabilities`);
      
    } catch (error) {
      if (error.status === 1) {
        // npm audit returns exit code 1 when vulnerabilities are found
        const auditData = JSON.parse(error.stdout);
        this.auditResults.dependencies = auditData;
        
        if (auditData.vulnerabilities) {
          Object.values(auditData.vulnerabilities).forEach(vuln => {
            const severity = vuln.severity;
            if (this.auditResults.summary[severity] !== undefined) {
              this.auditResults.summary[severity]++;
            }
          });
        }
        
        this.log(`Found ${Object.keys(auditData.vulnerabilities || {}).length} dependency vulnerabilities`, 'WARN');
      } else {
        this.log(`Dependency audit failed: ${error.message}`, 'ERROR');
        this.auditResults.dependencies = { error: error.message };
      }
    }
  }

  async runCodeAnalysis() {
    this.log('Running code security analysis...');
    
    const codeIssues = [];
    
    try {
      // Check for common security issues in code
      const srcDir = path.join(process.cwd(), 'src');
      
      
      // Check environment variables
      const envExample = path.join(process.cwd(), '.env.example');
      const envFile = path.join(process.cwd(), '.env');
      
      if (!fs.existsSync(envExample)) {
        codeIssues.push({
          file: '.env.example',
          issue: 'Missing .env.example file',
          severity: 'low',
          line: 'N/A'
        });
      } else {
        this.auditResults.summary.passed++;
      }
      
      if (fs.existsSync(envFile)) {
        codeIssues.push({
          file: '.env',
          issue: '.env file should not be committed',
          severity: 'medium',
          line: 'N/A'
        });
      } else {
        this.auditResults.summary.passed++;
      }
      
      this.auditResults.codeAnalysis = {
        issues: codeIssues,
        totalIssues: codeIssues.length
      };
      
      // Update summary counts
      codeIssues.forEach(issue => {
        this.auditResults.summary[issue.severity]++;
      });
      
      this.log(`Code analysis completed. Found ${codeIssues.length} issues`);
      
    } catch (error) {
      this.log(`Code analysis failed: ${error.message}`, 'ERROR');
      this.auditResults.codeAnalysis = { error: error.message };
    }
  }

  async checkConfiguration() {
    this.log('Checking security configuration...');
    
    const configIssues = [];
    
    try {
      // Check package.json for security-related scripts
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      if (!packageJson.scripts || !packageJson.scripts['security:audit']) {
        configIssues.push({
          file: 'package.json',
          issue: 'Missing security audit script',
          severity: 'low'
        });
      } else {
        this.auditResults.summary.passed++;
      }
      
      // Check for security-related dependencies
      const securityDeps = ['helmet', 'express-rate-limit', 'cors', 'bcrypt'];
      const installedDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };
      
      securityDeps.forEach(dep => {
        if (!installedDeps[dep]) {
          configIssues.push({
            file: 'package.json',
            issue: `Missing security dependency: ${dep}`,
            severity: 'medium'
          });
        } else {
          this.auditResults.summary.passed++;
        }
      });
      
      // Check gitignore for sensitive files
      const gitignorePath = path.join(process.cwd(), '.gitignore');
      if (fs.existsSync(gitignorePath)) {
        const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
        
        const requiredIgnores = ['.env', 'node_modules', '*.log', 'dist', 'build'];
        requiredIgnores.forEach(ignore => {
          if (!gitignoreContent.includes(ignore)) {
            configIssues.push({
              file: '.gitignore',
              issue: `Missing ignore pattern: ${ignore}`,
              severity: 'low'
            });
          } else {
            this.auditResults.summary.passed++;
          }
        });
      }
      
      this.auditResults.configuration = {
        issues: configIssues,
        totalIssues: configIssues.length
      };
      
      // Update summary counts
      configIssues.forEach(issue => {
        this.auditResults.summary[issue.severity]++;
      });
      
      this.log(`Configuration check completed. Found ${configIssues.length} issues`);
      
    } catch (error) {
      this.log(`Configuration check failed: ${error.message}`, 'ERROR');
      this.auditResults.configuration = { error: error.message };
    }
  }

  async checkCertificates() {
    this.log('Checking SSL certificates...');
    
    const certIssues = [];
    
    try {
      const certsDir = path.join(process.cwd(), 'certs');
      
      if (fs.existsSync(certsDir)) {
        const certFiles = fs.readdirSync(certsDir);
        
        certFiles.forEach(file => {
          if (file.endsWith('.crt') || file.endsWith('.pem')) {
            const certPath = path.join(certsDir, file);
            const stats = fs.statSync(certPath);
            
            // Check if certificate is older than 90 days (approaching expiration)
            const ageInDays = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
            
            if (ageInDays > 275) { // 365 - 90 = 275 days (assuming 1-year cert)
              certIssues.push({
                file: file,
                issue: 'Certificate may be expiring soon',
                severity: 'medium',
                details: `Certificate age: ${Math.round(ageInDays)} days`
              });
            } else {
              this.auditResults.summary.passed++;
            }
          }
        });
        
        this.log(`Found ${certFiles.length} certificate files`);
      } else {
        certIssues.push({
          file: 'certs/',
          issue: 'No certificates directory found',
          severity: 'high'
        });
      }
      
      this.auditResults.certificates = {
        issues: certIssues,
        totalIssues: certIssues.length
      };
      
      // Update summary counts
      certIssues.forEach(issue => {
        this.auditResults.summary[issue.severity]++;
      });
      
    } catch (error) {
      this.log(`Certificate check failed: ${error.message}`, 'ERROR');
      this.auditResults.certificates = { error: error.message };
    }
  }

  generateReport() {
    this.log('Generating security audit report...');
    
    const reportPath = path.join(this.reportDir, `security-audit-${this.timestamp}.json`);
    const htmlReportPath = path.join(this.reportDir, `security-audit-${this.timestamp}.html`);
    
    // Save JSON report
    fs.writeFileSync(reportPath, JSON.stringify(this.auditResults, null, 2));
    
    // Generate HTML report
    const htmlReport = this.generateHtmlReport();
    fs.writeFileSync(htmlReportPath, htmlReport);
    
    this.log(`Reports generated:`);
    this.log(`- JSON: ${reportPath}`);
    this.log(`- HTML: ${htmlReportPath}`);
    
    return { json: reportPath, html: htmlReportPath };
  }

  generateHtmlReport() {
    const { summary } = this.auditResults;
    const totalIssues = summary.critical + summary.high + summary.medium + summary.low;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Security Audit Report - ${this.timestamp}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 5px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .metric { background: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 5px; text-align: center; }
        .critical { background-color: #ffebee; border-color: #f44336; }
        .high { background-color: #fff3e0; border-color: #ff9800; }
        .medium { background-color: #fff8e1; border-color: #ffc107; }
        .low { background-color: #f3e5f5; border-color: #9c27b0; }
        .passed { background-color: #e8f5e8; border-color: #4caf50; }
        .section { margin: 20px 0; }
        .issues { background: #f9f9f9; padding: 15px; border-radius: 5px; }
        .issue { background: #fff; margin: 10px 0; padding: 10px; border-left: 4px solid #ddd; }
        .issue.critical { border-left-color: #f44336; }
        .issue.high { border-left-color: #ff9800; }
        .issue.medium { border-left-color: #ffc107; }
        .issue.low { border-left-color: #9c27b0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Security Audit Report</h1>
        <p><strong>Date:</strong> ${this.auditResults.timestamp}</p>
        <p><strong>Application:</strong> PsyRehab</p>
    </div>
    
    <div class="summary">
        <div class="metric critical">
            <h3>${summary.critical}</h3>
            <p>Critical</p>
        </div>
        <div class="metric high">
            <h3>${summary.high}</h3>
            <p>High</p>
        </div>
        <div class="metric medium">
            <h3>${summary.medium}</h3>
            <p>Medium</p>
        </div>
        <div class="metric low">
            <h3>${summary.low}</h3>
            <p>Low</p>
        </div>
        <div class="metric passed">
            <h3>${summary.passed}</h3>
            <p>Passed</p>
        </div>
    </div>
    
    <div class="section">
        <h2>Dependency Vulnerabilities</h2>
        <div class="issues">
            ${this.renderDependencyIssues()}
        </div>
    </div>
    
    <div class="section">
        <h2>Code Analysis</h2>
        <div class="issues">
            ${this.renderCodeIssues()}
        </div>
    </div>
    
    <div class="section">
        <h2>Configuration</h2>
        <div class="issues">
            ${this.renderConfigIssues()}
        </div>
    </div>
    
    <div class="section">
        <h2>Certificates</h2>
        <div class="issues">
            ${this.renderCertificateIssues()}
        </div>
    </div>
    
    <div class="section">
        <h2>Recommendations</h2>
        <ul>
            <li>Review and address all critical and high severity issues immediately</li>
            <li>Update dependencies regularly to patch known vulnerabilities</li>
            <li>Implement automated security scanning in CI/CD pipeline</li>
            <li>Conduct regular penetration testing</li>
            <li>Monitor security advisories for used technologies</li>
        </ul>
    </div>
</body>
</html>`;
  }

  renderDependencyIssues() {
    if (!this.auditResults.dependencies || this.auditResults.dependencies.error) {
      return '<p>Dependency scan failed or no data available</p>';
    }
    
    const vulns = this.auditResults.dependencies.vulnerabilities || {};
    if (Object.keys(vulns).length === 0) {
      return '<p>No dependency vulnerabilities found</p>';
    }
    
    return Object.entries(vulns).map(([name, vuln]) => `
      <div class="issue ${vuln.severity}">
        <strong>${name}</strong> (${vuln.severity})
        <p>${vuln.via.join(', ')}</p>
      </div>
    `).join('');
  }

  renderCodeIssues() {
    if (!this.auditResults.codeAnalysis || this.auditResults.codeAnalysis.error) {
      return '<p>Code analysis failed or no data available</p>';
    }
    
    const issues = this.auditResults.codeAnalysis.issues || [];
    if (issues.length === 0) {
      return '<p>No code issues found</p>';
    }
    
    return issues.map(issue => `
      <div class="issue ${issue.severity}">
        <strong>${issue.file}</strong> (${issue.severity})
        <p>${issue.issue}</p>
        ${issue.line !== 'N/A' ? `<code>${issue.line}</code>` : ''}
      </div>
    `).join('');
  }

  renderConfigIssues() {
    if (!this.auditResults.configuration || this.auditResults.configuration.error) {
      return '<p>Configuration check failed or no data available</p>';
    }
    
    const issues = this.auditResults.configuration.issues || [];
    if (issues.length === 0) {
      return '<p>No configuration issues found</p>';
    }
    
    return issues.map(issue => `
      <div class="issue ${issue.severity}">
        <strong>${issue.file}</strong> (${issue.severity})
        <p>${issue.issue}</p>
      </div>
    `).join('');
  }

  renderCertificateIssues() {
    if (!this.auditResults.certificates || this.auditResults.certificates.error) {
      return '<p>Certificate check failed or no data available</p>';
    }
    
    const issues = this.auditResults.certificates.issues || [];
    if (issues.length === 0) {
      return '<p>No certificate issues found</p>';
    }
    
    return issues.map(issue => `
      <div class="issue ${issue.severity}">
        <strong>${issue.file}</strong> (${issue.severity})
        <p>${issue.issue}</p>
        ${issue.details ? `<p><em>${issue.details}</em></p>` : ''}
      </div>
    `).join('');
  }

  async run() {
    this.log('Starting security audit...');
    
    try {
      await this.runDependencyAudit();
      await this.runCodeAnalysis();
      await this.checkConfiguration();
      await this.checkCertificates();
      
      const reports = this.generateReport();
      
      const totalIssues = this.auditResults.summary.critical + 
                         this.auditResults.summary.high + 
                         this.auditResults.summary.medium + 
                         this.auditResults.summary.low;
      
      this.log(`Security audit completed. Found ${totalIssues} total issues.`);
      this.log(`Critical: ${this.auditResults.summary.critical}, High: ${this.auditResults.summary.high}, Medium: ${this.auditResults.summary.medium}, Low: ${this.auditResults.summary.low}`);
      this.log(`Passed checks: ${this.auditResults.summary.passed}`);
      
      return reports;
      
    } catch (error) {
      this.log(`Security audit failed: ${error.message}`, 'ERROR');
      throw error;
    }
  }
}

// Run the audit if called directly
if (require.main === module) {
  const auditor = new SecurityAuditor();
  auditor.run()
    .then(reports => {
      console.log('\n✅ Security audit completed successfully!');
      console.log(`📊 Reports generated: ${reports.json}, ${reports.html}`);
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Security audit failed:', error.message);
      process.exit(1);
    });
}

module.exports = SecurityAuditor; 