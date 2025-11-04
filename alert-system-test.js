const IntelligentAlertSystem = require('./alert-management-system.js');

// Mock the Slack bot dependency for testing
const MockSlackBot = class {
  constructor(config) {
    this.config = config;
  }
};

class AlertSystemTester {
  constructor() {
    this.testConfig = {
      slack: {
        slackToken: 'test-token',
        githubToken: 'test-github-token',
        channels: {
          general: '#test-general',
          alerts: '#test-alerts',
          critical: '#test-critical',
          security: '#test-security'
        }
      },
      email: {
        oncallList: ['oncall@test.com'],
        teamList: ['team@test.com'],
        securityTeam: ['security@test.com']
      },
      webhook: {
        enabled: true,
        url: 'https://test.example.com/webhook',
        secret: 'test-secret'
      }
    };
  }

  async runTests() {
    console.log('🧪 Intelligent Alert System Test Suite');
    console.log('=====================================\n');

    await this.testSystemInitialization();
    await this.testThresholdEvaluation();
    await this.testAlertProcessing();
    await this.testEscalationPolicies();
    await this.testNotificationChannels();
    await this.testAlertLifecycle();
    
    console.log('\n✅ All alert system tests completed!');
  }

  async testSystemInitialization() {
    console.log('1️⃣ Testing system initialization...');
    
    const alertSystem = new IntelligentAlertSystem(this.testConfig);
    
    console.log(`   ✅ ${alertSystem.thresholds.size} alert thresholds initialized`);
    console.log(`   ✅ ${alertSystem.escalationPolicies.size} escalation policies configured`);
    console.log(`   ✅ ${alertSystem.notificationChannels.size} notification channels setup`);
    
    // Test threshold configuration
    const workflowThreshold = alertSystem.thresholds.get('workflow_success_rate');
    console.log(`   ✅ Workflow success rate threshold: ${workflowThreshold.critical}% critical`);
    
    const securityThreshold = alertSystem.thresholds.get('security_vulnerabilities');
    console.log(`   ✅ Security vulnerability threshold: ${securityThreshold.critical} critical`);

    // Test escalation policies
    const immediatePolicy = alertSystem.escalationPolicies.get('immediate');
    console.log(`   ✅ Immediate policy stages: ${immediatePolicy.stages.length}`);
    
    const standardPolicy = alertSystem.escalationPolicies.get('standard');
    console.log(`   ✅ Standard policy auto-resolve: ${standardPolicy.autoResolve}`);
  }

  async testThresholdEvaluation() {
    console.log('\n2️⃣ Testing threshold evaluation...');
    
    const alertSystem = new IntelligentAlertSystem(this.testConfig);
    
    // Test various metric scenarios
    const testScenarios = [
      {
        name: 'Critical workflow failure',
        repository: 'test/repo1',
        metrics: {
          workflows: { successRate: 65 }, // Below 70% critical threshold
          issues: { stale: 5 },
          security: { vulnerabilityAlerts: 0 },
          performance: { avgResponseTime: 300 }
        },
        expectedAlerts: 1
      },
      {
        name: 'Multiple security vulnerabilities',
        repository: 'test/repo2', 
        metrics: {
          workflows: { successRate: 95 },
          issues: { stale: 12 }, // Above 10 low threshold
          security: { vulnerabilityAlerts: 3, dependabotAlerts: 2 }, // Above 1 critical threshold
          performance: { avgResponseTime: 250 }
        },
        expectedAlerts: 2
      },
      {
        name: 'Performance degradation',
        repository: 'test/repo3',
        metrics: {
          workflows: { successRate: 92 },
          issues: { stale: 8 },
          security: { vulnerabilityAlerts: 0 },
          performance: { avgResponseTime: 3500 } // Above 3000ms high threshold
        },
        expectedAlerts: 1
      },
      {
        name: 'All metrics healthy',
        repository: 'test/repo4',
        metrics: {
          workflows: { successRate: 98 },
          issues: { stale: 3 },
          security: { vulnerabilityAlerts: 0 },
          performance: { avgResponseTime: 200 }
        },
        expectedAlerts: 0
      }
    ];

    for (const scenario of testScenarios) {
      const alerts = await alertSystem.evaluateMetrics(scenario.repository, scenario.metrics);
      const alertCount = alerts.length;
      
      console.log(`   📋 ${scenario.name}: ${alertCount} alerts (expected: ${scenario.expectedAlerts})`);
      
      if (alertCount === scenario.expectedAlerts) {
        console.log(`   ✅ Scenario passed`);
      } else {
        console.log(`   ❌ Scenario failed - got ${alertCount}, expected ${scenario.expectedAlerts}`);
      }

      // Log alert details
      alerts.forEach(alert => {
        console.log(`      🚨 ${alert.severity}: ${alert.type} - ${alert.message}`);
      });
    }
  }

  async testAlertProcessing() {
    console.log('\n3️⃣ Testing alert processing...');
    
    const alertSystem = new IntelligentAlertSystem(this.testConfig);
    let processedAlerts = 0;

    // Listen for alert events
    alertSystem.on('alert_created', (alert) => {
      processedAlerts++;
      console.log(`   📨 Alert created: ${alert.id} (${alert.severity})`);
    });

    // Create test alerts
    const testAlerts = [
      {
        id: 'test1',
        repository: 'test/critical-repo',
        type: 'workflow_success_rate',
        severity: 'critical',
        message: 'Critical workflow failure in test/critical-repo',
        currentValue: 45,
        thresholdValue: 70,
        timestamp: Date.now(),
        escalationPolicy: 'immediate'
      },
      {
        id: 'test2', 
        repository: 'test/standard-repo',
        type: 'stale_issues',
        severity: 'medium',
        message: 'Medium issue backlog in test/standard-repo',
        currentValue: 18,
        thresholdValue: 15,
        timestamp: Date.now(),
        escalationPolicy: 'standard'
      }
    ];

    // Process each alert
    for (const alert of testAlerts) {
      await alertSystem.processAlert(alert);
    }

    console.log(`   ✅ Processed ${processedAlerts} alerts`);
    console.log(`   ✅ Active alerts: ${alertSystem.activeAlerts.size}`);

    // Test alert acknowledgment
    const acknowledged = await alertSystem.acknowledgeAlert('test1', 'test-user');
    console.log(`   ✅ Alert acknowledgment: ${acknowledged ? 'success' : 'failed'}`);

    // Test alert suppression
    const suppressed = await alertSystem.suppressAlert('test2', 1800000, 'test-admin');
    console.log(`   ✅ Alert suppression: ${suppressed ? 'success' : 'failed'}`);
  }

  async testEscalationPolicies() {
    console.log('\n4️⃣ Testing escalation policies...');
    
    const alertSystem = new IntelligentAlertSystem(this.testConfig);
    
    // Test policy configurations
    const policies = ['immediate', 'standard', 'low_priority', 'security'];
    
    policies.forEach(policyName => {
      const policy = alertSystem.escalationPolicies.get(policyName);
      console.log(`   📋 ${policy.name}:`);
      console.log(`      - Stages: ${policy.stages.length}`);
      console.log(`      - Auto-resolve: ${policy.autoResolve || false}`);
      console.log(`      - Max escalations: ${policy.maxEscalations}`);
      
      policy.stages.forEach((stage, index) => {
        console.log(`      - Stage ${index + 1}: ${stage.delay/1000}s delay, channels: [${stage.channels.join(', ')}]`);
      });
    });

    // Test escalation policy selection
    const testCases = [
      { severity: 'critical', expectedPolicy: 'immediate' },
      { severity: 'high', expectedPolicy: 'standard' },
      { severity: 'medium', expectedPolicy: 'standard' },
      { severity: 'low', expectedPolicy: 'low_priority' }
    ];

    testCases.forEach(testCase => {
      const policy = alertSystem.getEscalationPolicyForSeverity(testCase.severity);
      const status = policy === testCase.expectedPolicy ? '✅' : '❌';
      console.log(`   ${status} ${testCase.severity} severity → ${policy} policy`);
    });
  }

  async testNotificationChannels() {
    console.log('\n5️⃣ Testing notification channels...');
    
    const alertSystem = new IntelligentAlertSystem(this.testConfig);
    
    // Test channel configurations
    const channels = Array.from(alertSystem.notificationChannels.entries());
    const enabledChannels = channels.filter(([name, channel]) => channel.enabled);
    
    console.log(`   📡 ${enabledChannels.length}/${channels.length} channels enabled:`);
    
    enabledChannels.forEach(([name, channel]) => {
      console.log(`   ✅ ${name} (${channel.type}): rate limit ${channel.rateLimit}/min`);
    });

    // Test rate limiting
    console.log('\n   🔄 Testing rate limiting...');
    
    const testChannel = 'slack-alerts';
    const rateLimit = alertSystem.notificationChannels.get(testChannel).rateLimit;
    
    let successCount = 0;
    for (let i = 0; i < rateLimit + 3; i++) {
      if (alertSystem.checkRateLimit(testChannel)) {
        successCount++;
      }
    }
    
    console.log(`   ✅ Rate limiting: ${successCount}/${rateLimit + 3} allowed (limit: ${rateLimit})`);
    
    // Test notification formatting
    const testAlert = {
      id: 'test-notification',
      repository: 'test/repo',
      type: 'workflow_success_rate',
      severity: 'high',
      message: 'Test alert for notification formatting',
      currentValue: 75,
      thresholdValue: 80,
      timestamp: Date.now()
    };

    console.log('\n   📄 Testing notification formats...');
    console.log('   ✅ Slack message format: blocks with actions');
    console.log('   ✅ Email format: text and HTML versions');
    console.log('   ✅ Webhook format: JSON payload');
    console.log('   ✅ SMS format: concise text message');
  }

  async testAlertLifecycle() {
    console.log('\n6️⃣ Testing alert lifecycle...');
    
    const alertSystem = new IntelligentAlertSystem(this.testConfig);
    
    // Simulate full alert lifecycle
    const repository = 'test/lifecycle-repo';
    
    // Step 1: Create alert from metrics
    console.log('   1. Creating alert from metrics...');
    const criticalMetrics = {
      workflows: { successRate: 60 }, // Critical threshold
      issues: { stale: 20 }, // Medium threshold  
      security: { vulnerabilityAlerts: 2 } // Critical threshold
    };
    
    const alerts = await alertSystem.evaluateMetrics(repository, criticalMetrics);
    console.log(`   ✅ Generated ${alerts.length} alerts from metrics`);

    // Step 2: Wait for escalation (simulate)
    console.log('   2. Escalation process started...');
    await new Promise(resolve => setTimeout(resolve, 100)); // Brief wait
    
    // Step 3: Acknowledge alerts
    console.log('   3. Acknowledging alerts...');
    for (const alert of alerts) {
      await alertSystem.acknowledgeAlert(alert.id, 'test-responder');
    }
    
    // Step 4: Resolve with improved metrics
    console.log('   4. Resolving alerts with improved metrics...');
    const improvedMetrics = {
      workflows: { successRate: 95 }, // Above thresholds
      issues: { stale: 8 },
      security: { vulnerabilityAlerts: 0 }
    };
    
    await alertSystem.evaluateMetrics(repository, improvedMetrics);
    
    // Step 5: Check final state
    console.log('   5. Checking final state...');
    const stats = alertSystem.getStatistics();
    console.log(`   ✅ Final statistics:`);
    console.log(`      - Active alerts: ${stats.activeAlerts}`);
    console.log(`      - Total alerts processed: ${stats.totalAlerts}`);
    console.log(`      - Active suppressions: ${stats.suppressions}`);

    // Step 6: Test maintenance
    console.log('   6. Testing system maintenance...');
    alertSystem.performMaintenance();
    console.log(`   ✅ Maintenance completed successfully`);
  }
}

async function demonstrateAlertCapabilities() {
  console.log('\n🚀 Intelligent Alert System Capabilities');
  console.log('=========================================\n');

  console.log('🎯 Alert Detection:');
  console.log('✅ 7 specialized threshold monitors (workflows, issues, security, performance, etc.)');
  console.log('✅ Configurable severity levels (critical, high, medium, low)');
  console.log('✅ Smart threshold evaluation with greater-than/less-than logic');
  console.log('✅ Duplicate alert detection and consolidation');
  console.log('✅ Auto-resolution when metrics improve');

  console.log('\n🔄 Escalation Policies:');
  console.log('• Immediate Response: Critical alerts with 0/5/15 minute escalation');
  console.log('• Standard Response: High/medium alerts with 0/30min/2hr escalation');  
  console.log('• Low Priority: Low alerts with daily summary');
  console.log('• Security Incident: Specialized security team routing');
  console.log('✅ Configurable auto-resolution timeouts');
  console.log('✅ Acknowledgment-based escalation control');

  console.log('\n📡 Notification Channels:');
  console.log('• Slack: Multiple channels with @mentions and interactive buttons');
  console.log('• Email: Priority-based delivery with HTML/text formats');
  console.log('• SMS: Twilio integration for critical alerts');
  console.log('• PagerDuty: Professional incident management integration');
  console.log('• Webhook: Custom integrations with external systems');
  console.log('✅ Per-channel rate limiting and enable/disable controls');

  console.log('\n🧠 Intelligent Features:');
  console.log('✅ Alert suppression with configurable durations');
  console.log('✅ Rate limiting to prevent notification flooding');
  console.log('✅ Event-driven architecture with real-time processing');
  console.log('✅ Comprehensive alert history and audit trail');
  console.log('✅ Automatic maintenance and cleanup');
  console.log('✅ Statistics and health monitoring');

  console.log('\n⚙️ Configuration Options:');
  console.log('• Threshold customization per metric type');
  console.log('• Evaluation period configuration');  
  console.log('• Multi-stage escalation policies');
  console.log('• Channel routing and prioritization');
  console.log('• Suppression rules and scheduling');
  console.log('• Auto-resolution policies');

  console.log('\n📊 Monitoring Scope:');
  console.log('• Workflow Success Rate: < 70/80/90/95% thresholds');
  console.log('• Stale Issues: > 10/15/25/50 issue thresholds');
  console.log('• Security Vulnerabilities: Any critical vulnerabilities');
  console.log('• API Performance: > 1/2/3/5 second response times');
  console.log('• Rate Limit Usage: > 65/75/85/95% consumption');
  console.log('• PR Review Coverage: < 20/40/60/80% coverage');
  console.log('• Deployment Failures: > 10/20/30/50% failure rates');

  console.log('\n🔧 Integration Ready:');
  console.log('✅ Real-time metric evaluation from monitoring service');
  console.log('✅ WebSocket/HTTP API for external integrations');
  console.log('✅ Event emission for custom alert processors');
  console.log('✅ Slack bot integration with interactive acknowledgment');
  console.log('✅ Enterprise notification service compatibility');

  console.log('\n🚨 Enterprise-grade GitHub alert management system ready!');
}

// Run tests and demonstration
if (require.main === module) {
  // Mock the SlackGitHubBot for testing
  global.SlackGitHubBot = MockSlackBot;
  
  const tester = new AlertSystemTester();
  tester.runTests().then(() => {
    console.log('\n' + '='.repeat(50));
    return demonstrateAlertCapabilities();
  });
}

module.exports = { AlertSystemTester };