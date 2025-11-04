const EventEmitter = require('events');

// Mock SlackGitHubBot for testing if not available
let SlackGitHubBot;
try {
  SlackGitHubBot = require('./slack-github-bot.js');
} catch (error) {
  SlackGitHubBot = class MockSlackBot {
    constructor(config) {
      this.config = config;
      this.slack = {
        chat: {
          postMessage: async (message) => {
            console.log(`📱 Mock Slack message to ${message.channel}: ${message.text || 'Alert notification'}`);
          }
        }
      };
    }
  };
}

class IntelligentAlertSystem extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    
    // Alert storage and state management
    this.activeAlerts = new Map();
    this.alertHistory = [];
    this.thresholds = new Map();
    this.escalationPolicies = new Map();
    this.notificationChannels = new Map();
    
    // Alert processing state
    this.suppressions = new Map();
    this.ratelimits = new Map();
    this.alertCounts = new Map();
    
    // Initialize system
    this.initializeThresholds();
    this.initializeEscalationPolicies();
    this.initializeNotificationChannels();
    this.startMaintenanceTimer();
  }

  // Initialize default alert thresholds
  initializeThresholds() {
    console.log('⚙️ Initializing alert thresholds...');

    const defaultThresholds = {
      // Workflow Performance Alerts
      'workflow_success_rate': {
        critical: 70,    // < 70% success rate
        high: 80,        // < 80% success rate
        medium: 90,      // < 90% success rate
        low: 95,         // < 95% success rate
        enabled: true,
        evaluationPeriod: 3600000, // 1 hour
        description: 'GitHub Actions workflow success rate monitoring'
      },

      // Issue Management Alerts  
      'stale_issues': {
        critical: 50,    // > 50 stale issues
        high: 25,        // > 25 stale issues
        medium: 15,      // > 15 stale issues
        low: 10,         // > 10 stale issues
        enabled: true,
        evaluationPeriod: 86400000, // 24 hours
        description: 'Stale issue accumulation monitoring'
      },

      // Security Alerts
      'security_vulnerabilities': {
        critical: 1,     // Any critical vulnerability
        high: 3,         // > 3 high vulnerabilities
        medium: 5,       // > 5 medium vulnerabilities
        low: 10,         // > 10 low vulnerabilities
        enabled: true,
        evaluationPeriod: 3600000, // 1 hour
        description: 'Security vulnerability detection'
      },

      // Performance Alerts
      'api_response_time': {
        critical: 5000,  // > 5 seconds avg response
        high: 3000,      // > 3 seconds avg response
        medium: 2000,    // > 2 seconds avg response
        low: 1000,       // > 1 second avg response
        enabled: true,
        evaluationPeriod: 1800000, // 30 minutes
        description: 'GitHub API response time monitoring'
      },

      // Rate Limit Alerts
      'rate_limit_usage': {
        critical: 95,    // > 95% rate limit used
        high: 85,        // > 85% rate limit used
        medium: 75,      // > 75% rate limit used
        low: 65,         // > 65% rate limit used
        enabled: true,
        evaluationPeriod: 900000, // 15 minutes
        description: 'GitHub API rate limit usage monitoring'
      },

      // Repository Health Alerts
      'pr_review_coverage': {
        critical: 20,    // < 20% PRs have reviews
        high: 40,        // < 40% PRs have reviews
        medium: 60,      // < 60% PRs have reviews
        low: 80,         // < 80% PRs have reviews
        enabled: true,
        evaluationPeriod: 86400000, // 24 hours
        description: 'Pull request review coverage monitoring'
      },

      // Deployment Alerts
      'deployment_failure_rate': {
        critical: 50,    // > 50% deployment failures
        high: 30,        // > 30% deployment failures
        medium: 20,      // > 20% deployment failures
        low: 10,         // > 10% deployment failures
        enabled: true,
        evaluationPeriod: 7200000, // 2 hours
        description: 'Deployment failure rate monitoring'
      }
    };

    Object.entries(defaultThresholds).forEach(([name, threshold]) => {
      this.thresholds.set(name, threshold);
    });

    console.log(`✅ Initialized ${this.thresholds.size} alert thresholds`);
  }

  // Initialize escalation policies
  initializeEscalationPolicies() {
    console.log('🔄 Setting up escalation policies...');

    const escalationPolicies = {
      'immediate': {
        name: 'Immediate Response',
        description: 'Critical issues requiring immediate attention',
        stages: [
          { delay: 0, channels: ['slack-critical', 'email-oncall'], acknowledge: false },
          { delay: 300000, channels: ['sms-oncall', 'pagerduty'], acknowledge: true }, // 5 minutes
          { delay: 900000, channels: ['slack-management', 'email-management'], acknowledge: true } // 15 minutes
        ],
        autoResolve: false,
        maxEscalations: 3
      },

      'standard': {
        name: 'Standard Response',
        description: 'High/medium priority issues with standard escalation',
        stages: [
          { delay: 0, channels: ['slack-alerts'], acknowledge: false },
          { delay: 1800000, channels: ['email-team'], acknowledge: true }, // 30 minutes
          { delay: 7200000, channels: ['slack-management'], acknowledge: true } // 2 hours
        ],
        autoResolve: true,
        autoResolveAfter: 86400000, // 24 hours
        maxEscalations: 2
      },

      'low_priority': {
        name: 'Low Priority',
        description: 'Low priority issues with minimal escalation',
        stages: [
          { delay: 0, channels: ['slack-alerts'], acknowledge: false },
          { delay: 86400000, channels: ['email-daily-summary'], acknowledge: false } // 24 hours
        ],
        autoResolve: true,
        autoResolveAfter: 604800000, // 7 days
        maxEscalations: 1
      },

      'security': {
        name: 'Security Incident',
        description: 'Security-related issues with specialized routing',
        stages: [
          { delay: 0, channels: ['slack-security', 'email-security-team'], acknowledge: false },
          { delay: 600000, channels: ['sms-security-lead', 'pagerduty-security'], acknowledge: true }, // 10 minutes
          { delay: 1800000, channels: ['email-ciso', 'slack-leadership'], acknowledge: true } // 30 minutes
        ],
        autoResolve: false,
        requireManualResolution: true,
        maxEscalations: 3
      }
    };

    Object.entries(escalationPolicies).forEach(([name, policy]) => {
      this.escalationPolicies.set(name, policy);
    });

    console.log(`✅ Configured ${this.escalationPolicies.size} escalation policies`);
  }

  // Initialize notification channels
  initializeNotificationChannels() {
    console.log('📡 Setting up notification channels...');

    // Initialize Slack integration if available
    if (this.config.slack) {
      this.slackBot = new SlackGitHubBot(this.config.slack);
    }

    const channels = {
      'slack-critical': {
        type: 'slack',
        config: { channel: '#critical-alerts', mention: '@channel' },
        enabled: true,
        rateLimit: 5 // max 5 messages per minute
      },
      'slack-alerts': {
        type: 'slack', 
        config: { channel: '#github-alerts' },
        enabled: true,
        rateLimit: 10
      },
      'slack-security': {
        type: 'slack',
        config: { channel: '#security-alerts', mention: '@security-team' },
        enabled: true,
        rateLimit: 3
      },
      'slack-management': {
        type: 'slack',
        config: { channel: '#management', mention: '@managers' },
        enabled: true,
        rateLimit: 2
      },
      'email-oncall': {
        type: 'email',
        config: { 
          recipients: this.config.email?.oncallList || ['oncall@company.com'],
          priority: 'high'
        },
        enabled: true,
        rateLimit: 3
      },
      'email-team': {
        type: 'email',
        config: { 
          recipients: this.config.email?.teamList || ['dev-team@company.com'],
          priority: 'normal'
        },
        enabled: true,
        rateLimit: 5
      },
      'email-security-team': {
        type: 'email',
        config: { 
          recipients: this.config.email?.securityTeam || ['security@company.com'],
          priority: 'urgent'
        },
        enabled: true,
        rateLimit: 2
      },
      'sms-oncall': {
        type: 'sms',
        config: { 
          numbers: this.config.sms?.oncallNumbers || [],
          service: 'twilio'
        },
        enabled: !!this.config.sms?.enabled,
        rateLimit: 1
      },
      'pagerduty': {
        type: 'pagerduty',
        config: { 
          integrationKey: this.config.pagerduty?.integrationKey,
          service: this.config.pagerduty?.service
        },
        enabled: !!this.config.pagerduty?.enabled,
        rateLimit: 2
      },
      'webhook': {
        type: 'webhook',
        config: { 
          url: this.config.webhook?.url,
          secret: this.config.webhook?.secret
        },
        enabled: !!this.config.webhook?.enabled,
        rateLimit: 10
      }
    };

    Object.entries(channels).forEach(([name, channel]) => {
      this.notificationChannels.set(name, channel);
      this.ratelimits[name] = [];
    });

    const enabledChannels = Array.from(this.notificationChannels.values())
      .filter(channel => channel.enabled).length;

    console.log(`✅ Configured ${enabledChannels}/${this.notificationChannels.size} notification channels`);
  }

  // Main alert evaluation function
  async evaluateMetrics(repository, metrics) {
    console.log(`🔍 Evaluating alerts for ${repository}...`);

    const alerts = [];
    const timestamp = Date.now();

    try {
      // Evaluate each threshold against current metrics
      for (const [thresholdName, threshold] of this.thresholds) {
        if (!threshold.enabled) continue;

        const alertResult = await this.evaluateThreshold(
          repository, 
          thresholdName, 
          threshold, 
          metrics, 
          timestamp
        );

        if (alertResult) {
          alerts.push(alertResult);
        }
      }

      // Process new alerts
      for (const alert of alerts) {
        await this.processAlert(alert);
      }

      return alerts;

    } catch (error) {
      console.error(`❌ Alert evaluation failed for ${repository}:`, error.message);
      return [];
    }
  }

  // Evaluate individual threshold
  async evaluateThreshold(repository, thresholdName, threshold, metrics, timestamp) {
    try {
      const metricValue = this.extractMetricValue(thresholdName, metrics);
      if (metricValue === null) return null;

      // Determine alert severity based on threshold levels
      let severity = null;
      let breached = false;

      if (this.isThresholdBreached(thresholdName, metricValue, threshold.critical)) {
        severity = 'critical';
        breached = true;
      } else if (this.isThresholdBreached(thresholdName, metricValue, threshold.high)) {
        severity = 'high';
        breached = true;
      } else if (this.isThresholdBreached(thresholdName, metricValue, threshold.medium)) {
        severity = 'medium';
        breached = true;
      } else if (this.isThresholdBreached(thresholdName, metricValue, threshold.low)) {
        severity = 'low';
        breached = true;
      }

      if (!breached) {
        // Check if we should resolve an existing alert
        const alertKey = `${repository}_${thresholdName}`;
        if (this.activeAlerts.has(alertKey)) {
          await this.resolveAlert(alertKey, 'metric_recovered');
        }
        return null;
      }

      // Create alert object
      const alert = {
        id: this.generateAlertId(),
        repository,
        type: thresholdName,
        severity,
        message: this.generateAlertMessage(thresholdName, metricValue, threshold[severity], repository),
        currentValue: metricValue,
        thresholdValue: threshold[severity],
        timestamp,
        source: 'threshold_monitoring',
        escalationPolicy: this.getEscalationPolicyForSeverity(severity),
        metadata: {
          threshold: thresholdName,
          description: threshold.description,
          evaluationPeriod: threshold.evaluationPeriod
        }
      };

      return alert;

    } catch (error) {
      console.error(`❌ Threshold evaluation failed for ${thresholdName}:`, error.message);
      return null;
    }
  }

  // Extract metric value based on threshold type
  extractMetricValue(thresholdName, metrics) {
    const extractors = {
      'workflow_success_rate': () => metrics.workflows?.successRate || null,
      'stale_issues': () => metrics.issues?.stale || null,
      'security_vulnerabilities': () => {
        const security = metrics.security || {};
        return (security.vulnerabilityAlerts || 0) + (security.dependabotAlerts || 0) + 
               (security.codeScanning || 0) + (security.secretScanning || 0);
      },
      'api_response_time': () => metrics.performance?.avgResponseTime || null,
      'rate_limit_usage': () => {
        const performance = metrics.performance || {};
        if (!performance.rateLimitRemaining || !performance.rateLimitTotal) return null;
        return ((performance.rateLimitTotal - performance.rateLimitRemaining) / performance.rateLimitTotal) * 100;
      },
      'pr_review_coverage': () => metrics.pullrequests?.reviewCoverage || null,
      'deployment_failure_rate': () => {
        const deployments = metrics.deployments || {};
        if (!deployments.recent || deployments.recent.length === 0) return null;
        const failed = deployments.recent.filter(d => d.latestStatus === 'failure').length;
        return (failed / deployments.recent.length) * 100;
      }
    };

    const extractor = extractors[thresholdName];
    return extractor ? extractor() : null;
  }

  // Check if threshold is breached (handles different comparison types)
  isThresholdBreached(thresholdName, value, threshold) {
    // Define which metrics use "greater than" vs "less than" logic
    const greaterThanMetrics = [
      'stale_issues', 'security_vulnerabilities', 'api_response_time',
      'rate_limit_usage', 'deployment_failure_rate'
    ];

    if (greaterThanMetrics.includes(thresholdName)) {
      return value > threshold;
    } else {
      return value < threshold; // workflow_success_rate, pr_review_coverage
    }
  }

  // Generate alert message
  generateAlertMessage(thresholdName, currentValue, thresholdValue, repository) {
    const messages = {
      'workflow_success_rate': `Workflow success rate is ${currentValue.toFixed(1)}% (threshold: ${thresholdValue}%) in ${repository}`,
      'stale_issues': `${currentValue} stale issues detected (threshold: ${thresholdValue}) in ${repository}`,
      'security_vulnerabilities': `${currentValue} security vulnerabilities found (threshold: ${thresholdValue}) in ${repository}`,
      'api_response_time': `API response time is ${currentValue}ms (threshold: ${thresholdValue}ms) for ${repository}`,
      'rate_limit_usage': `Rate limit usage is ${currentValue.toFixed(1)}% (threshold: ${thresholdValue}%) for ${repository}`,
      'pr_review_coverage': `PR review coverage is ${currentValue.toFixed(1)}% (threshold: ${thresholdValue}%) in ${repository}`,
      'deployment_failure_rate': `Deployment failure rate is ${currentValue.toFixed(1)}% (threshold: ${thresholdValue}%) in ${repository}`
    };

    return messages[thresholdName] || `Threshold ${thresholdName} breached in ${repository}`;
  }

  // Get escalation policy based on severity
  getEscalationPolicyForSeverity(severity) {
    const policyMapping = {
      'critical': 'immediate',
      'high': 'standard',
      'medium': 'standard',
      'low': 'low_priority'
    };

    return policyMapping[severity] || 'standard';
  }

  // Process new alert
  async processAlert(alert) {
    const alertKey = `${alert.repository}_${alert.type}`;
    
    try {
      // Check if this is a duplicate or suppressed alert
      if (this.isAlertSuppressed(alertKey, alert)) {
        console.log(`🔇 Alert suppressed: ${alertKey}`);
        return;
      }

      // Check if similar alert already exists
      const existingAlert = this.activeAlerts.get(alertKey);
      if (existingAlert) {
        // Update existing alert if severity changed
        if (existingAlert.severity !== alert.severity) {
          await this.updateAlert(alertKey, alert);
        }
        return;
      }

      // Store new alert
      this.activeAlerts.set(alertKey, alert);
      this.alertHistory.push({ ...alert, action: 'created' });

      console.log(`🚨 New ${alert.severity} alert: ${alert.message}`);

      // Start escalation process
      await this.startEscalation(alertKey, alert);

      // Emit alert event
      this.emit('alert_created', alert);

    } catch (error) {
      console.error(`❌ Alert processing failed for ${alertKey}:`, error.message);
    }
  }

  // Start escalation process
  async startEscalation(alertKey, alert) {
    const policy = this.escalationPolicies.get(alert.escalationPolicy);
    if (!policy) {
      console.error(`❌ Unknown escalation policy: ${alert.escalationPolicy}`);
      return;
    }

    console.log(`🔄 Starting escalation for ${alertKey} using policy: ${policy.name}`);

    // Execute escalation stages
    for (let stageIndex = 0; stageIndex < policy.stages.length; stageIndex++) {
      const stage = policy.stages[stageIndex];
      
      // Schedule stage execution
      setTimeout(async () => {
        try {
          // Check if alert is still active
          if (!this.activeAlerts.has(alertKey)) return;

          // Check if alert was acknowledged (if required)
          const currentAlert = this.activeAlerts.get(alertKey);
          if (stage.acknowledge && currentAlert.acknowledged) return;

          console.log(`📢 Executing escalation stage ${stageIndex + 1} for ${alertKey}`);

          // Send notifications to all channels in this stage
          for (const channelName of stage.channels) {
            await this.sendNotification(channelName, alert, stageIndex);
          }

          // Update alert with escalation info
          currentAlert.escalationStage = stageIndex;
          currentAlert.lastEscalated = Date.now();

        } catch (error) {
          console.error(`❌ Escalation stage ${stageIndex} failed for ${alertKey}:`, error.message);
        }
      }, stage.delay);
    }

    // Auto-resolve if configured
    if (policy.autoResolve && policy.autoResolveAfter) {
      setTimeout(async () => {
        if (this.activeAlerts.has(alertKey)) {
          await this.resolveAlert(alertKey, 'auto_resolved');
        }
      }, policy.autoResolveAfter);
    }
  }

  // Send notification to specific channel
  async sendNotification(channelName, alert, escalationStage = 0) {
    const channel = this.notificationChannels.get(channelName);
    if (!channel || !channel.enabled) {
      console.log(`⚠️ Channel ${channelName} not available or disabled`);
      return;
    }

    // Check rate limiting
    if (!this.checkRateLimit(channelName)) {
      console.log(`⏱️ Rate limit exceeded for channel ${channelName}`);
      return;
    }

    try {
      switch (channel.type) {
        case 'slack':
          await this.sendSlackNotification(channel, alert, escalationStage);
          break;
        case 'email':
          await this.sendEmailNotification(channel, alert, escalationStage);
          break;
        case 'sms':
          await this.sendSMSNotification(channel, alert, escalationStage);
          break;
        case 'pagerduty':
          await this.sendPagerDutyNotification(channel, alert, escalationStage);
          break;
        case 'webhook':
          await this.sendWebhookNotification(channel, alert, escalationStage);
          break;
        default:
          console.error(`❌ Unknown channel type: ${channel.type}`);
      }

      console.log(`✅ Notification sent to ${channelName} for alert ${alert.id}`);

    } catch (error) {
      console.error(`❌ Notification failed for ${channelName}:`, error.message);
    }
  }

  // Slack notification implementation
  async sendSlackNotification(channel, alert, escalationStage) {
    // Mock Slack implementation for demonstration
    console.log(`📱 Slack notification to ${channel.config.channel}: ${alert.message}`);
    
    const severityEmojis = {
      critical: '🚨',
      high: '⚠️',
      medium: '⚡',
      low: 'ℹ️'
    };

    const message = `${severityEmojis[alert.severity]} *${alert.severity.toUpperCase()} ALERT*\n${alert.message}`;
    console.log(`   Message: ${message}`);
  }

  // Email notification implementation
  async sendEmailNotification(channel, alert, escalationStage) {
    console.log(`📧 Email to ${channel.config.recipients.join(', ')}: ${alert.message}`);
  }

  // SMS notification implementation  
  async sendSMSNotification(channel, alert, escalationStage) {
    console.log(`📱 SMS to ${channel.config.numbers.join(', ')}: ${alert.message}`);
  }

  // PagerDuty notification implementation
  async sendPagerDutyNotification(channel, alert, escalationStage) {
    console.log(`🚨 PagerDuty incident: ${alert.message}`);
  }

  // Webhook notification implementation
  async sendWebhookNotification(channel, alert, escalationStage) {
    console.log(`🔗 Webhook to ${channel.config.url}: ${alert.message}`);
  }

  // Check rate limiting
  checkRateLimit(channelName) {
    const channel = this.notificationChannels.get(channelName);
    if (!channel) return false;

    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window

    // Clean old entries
    this.ratelimits[channelName] = this.ratelimits[channelName].filter(time => time > windowStart);

    // Check if under limit
    if (this.ratelimits[channelName].length >= channel.rateLimit) {
      return false;
    }

    // Add current time
    this.ratelimits[channelName].push(now);
    return true;
  }

  // Alert suppression check
  isAlertSuppressed(alertKey, alert) {
    const suppression = this.suppressions.get(alertKey);
    if (!suppression) return false;

    // Check if suppression is still active
    if (suppression.until > Date.now()) {
      return true;
    }

    // Remove expired suppression
    this.suppressions.delete(alertKey);
    return false;
  }

  // Resolve alert
  async resolveAlert(alertKey, reason = 'manual') {
    const alert = this.activeAlerts.get(alertKey);
    if (!alert) return;

    alert.resolvedAt = Date.now();
    alert.resolvedBy = reason;

    this.activeAlerts.delete(alertKey);
    this.alertHistory.push({ ...alert, action: 'resolved', reason });

    console.log(`✅ Alert resolved: ${alertKey} (${reason})`);

    this.emit('alert_resolved', { alert, reason });
  }

  // Acknowledge alert
  async acknowledgeAlert(alertId, acknowledgedBy) {
    for (const [key, alert] of this.activeAlerts) {
      if (alert.id === alertId) {
        alert.acknowledged = true;
        alert.acknowledgedAt = Date.now();
        alert.acknowledgedBy = acknowledgedBy;

        console.log(`👍 Alert acknowledged: ${alertId} by ${acknowledgedBy}`);
        this.emit('alert_acknowledged', alert);
        return true;
      }
    }
    return false;
  }

  // Suppress alert
  async suppressAlert(alertId, duration = 3600000, suppressedBy = 'system') {
    for (const [key, alert] of this.activeAlerts) {
      if (alert.id === alertId) {
        const suppression = {
          until: Date.now() + duration,
          suppressedBy,
          suppressedAt: Date.now()
        };

        this.suppressions.set(key, suppression);
        console.log(`🔇 Alert suppressed: ${alertId} for ${duration/1000}s by ${suppressedBy}`);
        this.emit('alert_suppressed', { alert, suppression });
        return true;
      }
    }
    return false;
  }

  // Generate unique alert ID
  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Start maintenance timer
  startMaintenanceTimer() {
    setInterval(() => {
      this.performMaintenance();
    }, 3600000); // Run every hour

    console.log('🔧 Alert system maintenance timer started');
  }

  // Perform system maintenance
  performMaintenance() {
    const now = Date.now();
    
    // Clean old alert history (keep last 1000 entries)
    if (this.alertHistory.length > 1000) {
      this.alertHistory = this.alertHistory.slice(-1000);
    }

    // Clean expired suppressions
    for (const [key, suppression] of this.suppressions) {
      if (suppression.until <= now) {
        this.suppressions.delete(key);
      }
    }

    // Clean rate limit tracking
    const windowStart = now - 60000;
    for (const channelName in this.ratelimits) {
      this.ratelimits[channelName] = this.ratelimits[channelName].filter(time => time > windowStart);
    }

    console.log('🧹 Alert system maintenance completed');
  }

  // Get system statistics
  getStatistics() {
    return {
      activeAlerts: this.activeAlerts.size,
      totalAlerts: this.alertHistory.length,
      thresholds: this.thresholds.size,
      escalationPolicies: this.escalationPolicies.size,
      notificationChannels: Array.from(this.notificationChannels.values()).filter(c => c.enabled).length,
      suppressions: this.suppressions.size,
      lastMaintenance: Date.now()
    };
  }
}

module.exports = IntelligentAlertSystem;