import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  metric: string;
  condition: 'above' | 'below' | 'equals' | 'change_percent';
  threshold: number;
  timeWindow: number; // minutes
  severity: 'low' | 'medium' | 'high' | 'critical';
  isEnabled: boolean;
  channels: ('email' | 'slack' | 'webhook' | 'push')[];
  recipients: string[];
  cooldown: number; // minutes
  createdAt: string;
  lastTriggered?: string;
  triggerCount: number;
}

export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  metric: string;
  currentValue: number;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved';
  triggeredAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
  description: string;
  suggestedActions: string[];
}

export interface SmartAlertingSystemProps {
  className?: string;
  showCreateForm?: boolean;
}

/**
 * Smart Alerting System
 * AI-powered intelligent alerting with machine learning optimization
 */
export function SmartAlertingSystem({
  className = '',
  showCreateForm = false
}: SmartAlertingSystemProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [selectedTab, setSelectedTab] = useState<'active' | 'rules' | 'history'>('active');
  const [isLoading, setIsLoading] = useState(false);
  const [showRuleForm, setShowRuleForm] = useState(showCreateForm);

  // Mock alert rules
  const mockRules: AlertRule[] = [
    {
      id: 'rule-001',
      name: 'High Error Rate',
      description: 'Alert when error rate exceeds 5% over 10 minutes',
      metric: 'error_rate',
      condition: 'above',
      threshold: 5,
      timeWindow: 10,
      severity: 'high',
      isEnabled: true,
      channels: ['email', 'slack'],
      recipients: ['admin@aisportsedge.app', '#alerts'],
      cooldown: 30,
      createdAt: '2025-05-27T10:00:00Z',
      lastTriggered: '2025-05-27T18:30:00Z',
      triggerCount: 3
    },
    {
      id: 'rule-002',
      name: 'Payment Failures Spike',
      description: 'Critical alert for payment failure rate above 15%',
      metric: 'payment_failure_rate',
      condition: 'above',
      threshold: 15,
      timeWindow: 5,
      severity: 'critical',
      isEnabled: true,
      channels: ['email', 'slack', 'push'],
      recipients: ['admin@aisportsedge.app', 'finance@aisportsedge.app'],
      cooldown: 15,
      createdAt: '2025-05-27T09:15:00Z',
      triggerCount: 1
    },
    {
      id: 'rule-003',
      name: 'Low User Engagement',
      description: 'Alert when daily active users drop below expected threshold',
      metric: 'daily_active_users',
      condition: 'below',
      threshold: 1000,
      timeWindow: 60,
      severity: 'medium',
      isEnabled: true,
      channels: ['email'],
      recipients: ['product@aisportsedge.app'],
      cooldown: 120,
      createdAt: '2025-05-26T16:20:00Z',
      triggerCount: 0
    }
  ];

  // Mock active alerts
  const mockAlerts: Alert[] = [
    {
      id: 'alert-001',
      ruleId: 'rule-001',
      ruleName: 'High Error Rate',
      metric: 'error_rate',
      currentValue: 7.3,
      threshold: 5,
      severity: 'high',
      status: 'active',
      triggeredAt: '2025-05-27T19:45:00Z',
      description: 'Error rate has exceeded the threshold of 5% and is currently at 7.3%',
      suggestedActions: [
        'Check application logs for error patterns',
        'Review recent deployments',
        'Monitor server resources',
        'Escalate to engineering team if persistent'
      ]
    },
    {
      id: 'alert-002',
      ruleId: 'rule-002',
      ruleName: 'Payment Failures Spike',
      metric: 'payment_failure_rate',
      currentValue: 18.5,
      threshold: 15,
      severity: 'critical',
      status: 'acknowledged',
      triggeredAt: '2025-05-27T19:30:00Z',
      acknowledgedAt: '2025-05-27T19:35:00Z',
      acknowledgedBy: 'admin@aisportsedge.app',
      description: 'Critical: Payment failure rate has spiked to 18.5%, well above the 15% threshold',
      suggestedActions: [
        'Contact payment processor immediately',
        'Check payment gateway status',
        'Review API error logs',
        'Notify customer support team'
      ]
    }
  ];

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      setAlerts(mockAlerts);
      setRules(mockRules);
    } catch (error) {
      console.error('Error loading alert data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeAlerts = alerts.filter(alert => alert.status === 'active');
  const acknowledgedAlerts = alerts.filter(alert => alert.status === 'acknowledged');

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'acknowledged': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId
        ? {
            ...alert,
            status: 'acknowledged' as const,
            acknowledgedAt: new Date().toISOString(),
            acknowledgedBy: 'current-user@aisportsedge.app'
          }
        : alert
    ));
  };

  const resolveAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId
        ? {
            ...alert,
            status: 'resolved' as const,
            resolvedAt: new Date().toISOString()
          }
        : alert
    ));
  };

  const toggleRule = (ruleId: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId
        ? { ...rule, isEnabled: !rule.isEnabled }
        : rule
    ));
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Smart Alerting System
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            AI-powered intelligent alerts and notifications
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRuleForm(!showRuleForm)}
          >
            {showRuleForm ? 'Cancel' : 'New Rule'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={loadData}
            isLoading={isLoading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Alert Summary */}
      <Card className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">
              {activeAlerts.length}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Active Alerts</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {acknowledgedAlerts.length}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Acknowledged</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {rules.filter(r => r.isEnabled).length}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Active Rules</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {rules.reduce((sum, rule) => sum + rule.triggerCount, 0)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Triggers</p>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Card className="p-0">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { key: 'active', label: 'Active Alerts', count: activeAlerts.length },
              { key: 'rules', label: 'Alert Rules', count: rules.length },
              { key: 'history', label: 'Alert History', count: alerts.length }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setSelectedTab(tab.key as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === tab.key
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
                <Badge className="ml-2 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                  {tab.count}
                </Badge>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Active Alerts Tab */}
          {selectedTab === 'active' && (
            <div className="space-y-4">
              {activeAlerts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">🎉</div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No Active Alerts
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    All systems are operating normally
                  </p>
                </div>
              ) : (
                alerts.filter(alert => alert.status !== 'resolved').map(alert => (
                  <Card key={alert.id} className="p-4 border-l-4 border-l-red-500">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                          {alert.ruleName}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Triggered {formatTimestamp(alert.triggeredAt)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                        <Badge className={getStatusColor(alert.status)}>
                          {alert.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-gray-900 dark:text-white mb-4">
                      {alert.description}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Current Value
                        </p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {alert.currentValue}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Threshold
                        </p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {alert.threshold}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Metric
                        </p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {alert.metric.replace('_', ' ')}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Suggested Actions
                      </h5>
                      <ul className="space-y-1">
                        {alert.suggestedActions.map((action, index) => (
                          <li key={index} className="flex items-start space-x-2 text-sm text-gray-700 dark:text-gray-300">
                            <span className="text-blue-500 mt-1">•</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                      {alert.status === 'active' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => acknowledgeAlert(alert.id)}
                        >
                          Acknowledge
                        </Button>
                      )}
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => resolveAlert(alert.id)}
                      >
                        Resolve
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Alert Rules Tab */}
          {selectedTab === 'rules' && (
            <div className="space-y-4">
              {rules.map(rule => (
                <Card key={rule.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                          {rule.name}
                        </h4>
                        <Badge className={rule.isEnabled ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'}>
                          {rule.isEnabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                        <Badge className={getSeverityColor(rule.severity)}>
                          {rule.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {rule.description}
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Metric:</span>
                          <span className="ml-1 font-medium">{rule.metric.replace('_', ' ')}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Condition:</span>
                          <span className="ml-1 font-medium">{rule.condition} {rule.threshold}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Window:</span>
                          <span className="ml-1 font-medium">{rule.timeWindow}m</span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Triggers:</span>
                          <span className="ml-1 font-medium">{rule.triggerCount}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleRule(rule.id)}
                      >
                        {rule.isEnabled ? 'Disable' : 'Enable'}
                      </Button>
                      <Button variant="secondary" size="sm">
                        Edit
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <span>Channels: {rule.channels.join(', ')}</span>
                    {rule.lastTriggered && (
                      <span className="ml-4">Last triggered: {formatTimestamp(rule.lastTriggered)}</span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Alert History Tab */}
          {selectedTab === 'history' && (
            <div className="space-y-3">
              {alerts.map(alert => (
                <div key={alert.id} className="flex items-center justify-between py-3 px-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {alert.ruleName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTimestamp(alert.triggeredAt)}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(alert.status)}>
                    {alert.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}