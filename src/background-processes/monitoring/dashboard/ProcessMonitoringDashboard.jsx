import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import {
  Box,
  Heading,
  Text,
  Flex,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  useColorModeValue,
  Spinner,
} from '@chakra-ui/react';
import { CheckCircleIcon, WarningIcon, TimeIcon, RepeatIcon, InfoIcon } from '@chakra-ui/icons';

/**
 * Process Monitoring Dashboard Component
 *
 * This component displays monitoring data for background processes,
 * including metrics, recent executions, and active alerts.
 */
const ProcessMonitoringDashboard = () => {
  const [metrics, setMetrics] = useState({});
  const [executions, setExecutions] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProcess, setSelectedProcess] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // List of monitored processes
  const processes = [
    { id: 'syncSubscriptionStatus', name: 'Sync Subscription Status', category: 'Database' },
    { id: 'syncCustomerId', name: 'Sync Customer ID', category: 'Database' },
    { id: 'standardizeStatusSpelling', name: 'Standardize Status Spelling', category: 'Database' },
    { id: 'generateReferralCode', name: 'Generate Referral Code', category: 'Referral' },
    { id: 'rewardReferrer', name: 'Reward Referrer', category: 'Referral' },
    { id: 'markAIPickOfDay', name: 'Mark AI Pick of Day', category: 'Critical' },
    { id: 'predictTodayGames', name: 'Predict Today Games', category: 'Critical' },
    { id: 'scheduledFirestoreBackup', name: 'Scheduled Firestore Backup', category: 'Critical' },
    {
      id: 'processScheduledNotifications',
      name: 'Process Scheduled Notifications',
      category: 'Critical',
    },
    { id: 'cleanupOldNotifications', name: 'Cleanup Old Notifications', category: 'Critical' },
    { id: 'processRssFeedsAndNotify', name: 'Process RSS Feeds', category: 'Critical' },
    { id: 'updateStatsPage', name: 'Update Stats Page', category: 'Critical' },
  ];

  // Fetch metrics for all processes
  const fetchMetrics = async () => {
    const metricsData = {};

    for (const process of processes) {
      try {
        const metricsRef = collection(db, 'processMonitoring', 'metrics', process.id);
        const metricsDoc = await getDocs(query(metricsRef, limit(1)));

        if (!metricsDoc.empty) {
          metricsData[process.id] = metricsDoc.docs[0].data();
        } else {
          metricsData[process.id] = {
            processName: process.id,
            totalExecutions: 0,
            successCount: 0,
            errorCount: 0,
            averageDuration: 0,
            lastUpdated: null,
          };
        }
      } catch (error) {
        console.error(`Error fetching metrics for ${process.id}:`, error);
        metricsData[process.id] = {
          processName: process.id,
          totalExecutions: 0,
          successCount: 0,
          errorCount: 0,
          averageDuration: 0,
          lastUpdated: null,
          error: error.message,
        };
      }
    }

    setMetrics(metricsData);
  };

  // Fetch recent executions for all processes
  const fetchExecutions = async () => {
    const executionsData = {};

    for (const process of processes) {
      try {
        const executionsRef = collection(db, 'processMonitoring', 'executions', process.id);
        const executionsQuery = query(executionsRef, orderBy('startTime', 'desc'), limit(5));
        const executionsSnapshot = await getDocs(executionsQuery);

        executionsData[process.id] = executionsSnapshot.docs.map(doc => doc.data());
      } catch (error) {
        console.error(`Error fetching executions for ${process.id}:`, error);
        executionsData[process.id] = [];
      }
    }

    setExecutions(executionsData);
  };

  // Fetch active alerts
  const fetchAlerts = async () => {
    try {
      const alertsData = [];

      for (const process of processes) {
        const alertsRef = collection(db, 'processMonitoring', 'alerts', process.id);
        const alertsQuery = query(alertsRef, where('acknowledged', '==', false), limit(10));
        const alertsSnapshot = await getDocs(alertsQuery);

        alertsSnapshot.forEach(doc => {
          alertsData.push({
            id: doc.id,
            processId: process.id,
            processName: process.name,
            ...doc.data(),
          });
        });
      }

      setAlerts(alertsData);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  // Acknowledge an alert
  const acknowledgeAlert = async (processId, alertId) => {
    try {
      const alertRef = doc(db, 'processMonitoring', 'alerts', processId, alertId);
      await updateDoc(alertRef, {
        acknowledged: true,
        acknowledgedAt: serverTimestamp(),
      });

      // Refresh alerts
      fetchAlerts();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  // Refresh all data
  const refreshData = () => {
    setLoading(true);
    setRefreshKey(prevKey => prevKey + 1);
  };

  // Load data on component mount and when refreshKey changes
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchMetrics(), fetchExecutions(), fetchAlerts()]);

      setLoading(false);
    };

    loadData();
  }, [refreshKey]);

  // Filter processes based on selected process
  const filteredProcesses =
    selectedProcess === 'all'
      ? processes
      : processes.filter(process => process.category === selectedProcess);

  return (
    <Box p={4}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Background Process Monitoring</Heading>
        <Button
          leftIcon={<RepeatIcon />}
          colorScheme="blue"
          onClick={refreshData}
          isLoading={loading}
        >
          Refresh
        </Button>
      </Flex>

      {/* Process Filter Tabs */}
      <Tabs
        mb={6}
        onChange={index => {
          const categories = ['all', 'Critical', 'Database', 'Referral'];
          setSelectedProcess(categories[index]);
        }}
      >
        <TabList>
          <Tab>All Processes</Tab>
          <Tab>Critical</Tab>
          <Tab>Database</Tab>
          <Tab>Referral</Tab>
        </TabList>
      </Tabs>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <Box mb={6}>
          <Heading size="md" mb={3}>
            Active Alerts
          </Heading>
          {alerts.map(alert => (
            <Alert
              key={alert.id}
              status={alert.status === 'error' ? 'error' : 'warning'}
              variant="left-accent"
              mb={3}
              borderRadius="md"
            >
              <AlertIcon />
              <Box flex="1">
                <AlertTitle>{alert.processName}</AlertTitle>
                <AlertDescription display="block">
                  {alert.error ? alert.error.message : `Slow execution: ${alert.duration}ms`}
                  <Text fontSize="sm" color="gray.500">
                    {new Date(alert.timestamp.toDate()).toLocaleString()}
                  </Text>
                </AlertDescription>
              </Box>
              <Button size="sm" onClick={() => acknowledgeAlert(alert.processId, alert.id)}>
                Acknowledge
              </Button>
            </Alert>
          ))}
        </Box>
      )}

      {/* Process Metrics */}
      <Box mb={6}>
        <Heading size="md" mb={3}>
          Process Metrics
        </Heading>
        <Flex wrap="wrap" gap={4}>
          {loading ? (
            <Flex justify="center" w="full" py={10}>
              <Spinner size="xl" />
            </Flex>
          ) : (
            filteredProcesses.map(process => {
              const processMetrics = metrics[process.id] || {};
              const successRate =
                processMetrics.totalExecutions > 0
                  ? (processMetrics.successCount / processMetrics.totalExecutions) * 100
                  : 0;

              return (
                <Box
                  key={process.id}
                  p={4}
                  borderWidth="1px"
                  borderRadius="lg"
                  bg={bgColor}
                  borderColor={borderColor}
                  width={{ base: '100%', md: 'calc(50% - 8px)', lg: 'calc(33.333% - 11px)' }}
                >
                  <Flex justify="space-between" align="center" mb={2}>
                    <Heading size="sm">{process.name}</Heading>
                    <Badge colorScheme={process.category === 'Critical' ? 'red' : 'blue'}>
                      {process.category}
                    </Badge>
                  </Flex>

                  <Flex wrap="wrap" gap={4} mt={4}>
                    <Stat>
                      <StatLabel>Success Rate</StatLabel>
                      <StatNumber>{successRate.toFixed(1)}%</StatNumber>
                      <StatHelpText>
                        {processMetrics.successCount} / {processMetrics.totalExecutions} executions
                      </StatHelpText>
                    </Stat>

                    <Stat>
                      <StatLabel>Avg Duration</StatLabel>
                      <StatNumber>{processMetrics.averageDuration?.toFixed(0) || 0}ms</StatNumber>
                      <StatHelpText>
                        <Flex align="center">
                          <TimeIcon mr={1} />
                          <Text>
                            Last run:{' '}
                            {processMetrics.lastUpdated
                              ? new Date(processMetrics.lastUpdated.toDate()).toLocaleString()
                              : 'Never'}
                          </Text>
                        </Flex>
                      </StatHelpText>
                    </Stat>
                  </Flex>
                </Box>
              );
            })
          )}
        </Flex>
      </Box>

      {/* Recent Executions */}
      <Box>
        <Heading size="md" mb={3}>
          Recent Executions
        </Heading>
        <Tabs>
          <TabList>
            {filteredProcesses.map(process => (
              <Tab key={process.id}>{process.name}</Tab>
            ))}
          </TabList>

          <TabPanels>
            {filteredProcesses.map(process => {
              const processExecutions = executions[process.id] || [];

              return (
                <TabPanel key={process.id} p={0} mt={4}>
                  {processExecutions.length === 0 ? (
                    <Alert status="info">
                      <AlertIcon />
                      No recent executions found for this process.
                    </Alert>
                  ) : (
                    <Box overflowX="auto">
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th>Status</Th>
                            <Th>Start Time</Th>
                            <Th>Duration</Th>
                            <Th>Details</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {processExecutions.map(execution => (
                            <Tr key={execution.executionId}>
                              <Td>
                                <Flex align="center">
                                  {execution.status === 'success' ? (
                                    <CheckCircleIcon color="green.500" mr={2} />
                                  ) : execution.status === 'error' ? (
                                    <WarningIcon color="red.500" mr={2} />
                                  ) : (
                                    <InfoIcon color="blue.500" mr={2} />
                                  )}
                                  {execution.status}
                                </Flex>
                              </Td>
                              <Td>
                                {execution.startTime
                                  ? new Date(execution.startTime.toDate()).toLocaleString()
                                  : 'N/A'}
                              </Td>
                              <Td>{execution.duration ? `${execution.duration}ms` : 'N/A'}</Td>
                              <Td>
                                {execution.error ? (
                                  <Text color="red.500">{execution.error.message}</Text>
                                ) : (
                                  <Text color="gray.500">Completed successfully</Text>
                                )}
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                  )}
                </TabPanel>
              );
            })}
          </TabPanels>
        </Tabs>
      </Box>
    </Box>
  );
};

export default ProcessMonitoringDashboard;
