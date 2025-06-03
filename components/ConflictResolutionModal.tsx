import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';

import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { useThemeColor } from '../hooks/useThemeColor';
import dataSyncService, { EntityData, SyncStatus } from '../services/dataSyncService';
import { ConflictResolutionStrategy } from '../services/offlineQueueService';

/**
 * Props for the ConflictResolutionModal component
 */
interface ConflictResolutionModalProps {
  /**
   * Whether the modal is visible
   */
  visible: boolean;

  /**
   * Callback when the modal is closed
   */
  onClose: () => void;

  /**
   * Callback when all conflicts are resolved
   */
  onAllResolved?: () => void;
}

/**
 * Component for resolving data conflicts
 */
const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  visible,
  onClose,
  onAllResolved,
}) => {
  const [conflicts, setConflicts] = useState<EntityData[]>([]);
  const [selectedConflict, setSelectedConflict] = useState<EntityData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = '#0a7ea4';

  // Load conflicts when modal becomes visible
  useEffect(() => {
    if (visible) {
      loadConflicts();
    }
  }, [visible]);

  /**
   * Load conflicts
   */
  const loadConflicts = async () => {
    setLoading(true);

    try {
      const conflicts = await dataSyncService.getConflicts();
      setConflicts(conflicts);

      if (conflicts.length > 0) {
        setSelectedConflict(conflicts[0]);
      } else {
        setSelectedConflict(null);
      }
    } catch (error) {
      console.error('Error loading conflicts:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Resolve conflict
   * @param conflict Conflict to resolve
   * @param strategy Resolution strategy
   */
  const resolveConflict = async (conflict: EntityData, strategy: ConflictResolutionStrategy) => {
    setLoading(true);

    try {
      await dataSyncService.resolveConflict(conflict, strategy);

      // Remove resolved conflict from list
      setConflicts(conflicts.filter(c => c.id !== conflict.id || c.type !== conflict.type));

      // Select next conflict
      const nextConflict = conflicts.find(c => c.id !== conflict.id || c.type !== conflict.type);
      setSelectedConflict(nextConflict || null);

      // If no more conflicts, call onAllResolved
      if (conflicts.length === 1 && onAllResolved) {
        onAllResolved();
      }
    } catch (error) {
      console.error('Error resolving conflict:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get entity type display name
   * @param type Entity type
   * @returns Display name
   */
  const getEntityTypeDisplayName = (type: string): string => {
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  };

  /**
   * Format date
   * @param timestamp Timestamp
   * @returns Formatted date
   */
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  /**
   * Render conflict list
   */
  const renderConflictList = () => {
    if (conflicts.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
          <ThemedText style={styles.emptyStateText}>No conflicts to resolve</ThemedText>
        </View>
      );
    }

    return (
      <ScrollView style={styles.conflictList}>
        {conflicts.map((conflict, index) => (
          <TouchableOpacity
            key={`${conflict.type}-${conflict.id}`}
            style={[
              styles.conflictItem,
              selectedConflict &&
              selectedConflict.id === conflict.id &&
              selectedConflict.type === conflict.type
                ? styles.selectedConflictItem
                : null,
            ]}
            onPress={() => setSelectedConflict(conflict)}
          >
            <View style={styles.conflictItemHeader}>
              <ThemedText style={styles.conflictItemType}>
                {getEntityTypeDisplayName(conflict.type)}
              </ThemedText>
              <ThemedText style={styles.conflictItemId}>{conflict.id}</ThemedText>
            </View>
            <ThemedText style={styles.conflictItemDate}>
              Modified: {formatDate(conflict.lastModified)}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  /**
   * Render conflict details
   */
  const renderConflictDetails = () => {
    if (!selectedConflict) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="information-circle" size={48} color="#999" />
          <ThemedText style={styles.emptyStateText}>Select a conflict to resolve</ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.conflictDetails}>
        <View style={styles.conflictHeader}>
          <ThemedText style={styles.conflictTitle}>
            {getEntityTypeDisplayName(selectedConflict.type)} Conflict
          </ThemedText>
          <ThemedText style={styles.conflictId}>{selectedConflict.id}</ThemedText>
        </View>

        <View style={styles.conflictDataContainer}>
          <View style={styles.dataColumn}>
            <ThemedText style={styles.dataColumnTitle}>Local Data</ThemedText>
            <ThemedText style={styles.dataColumnSubtitle}>
              Version: {selectedConflict.version}
            </ThemedText>
            <ThemedText style={styles.dataColumnSubtitle}>
              Modified: {formatDate(selectedConflict.lastModified)}
            </ThemedText>
            <ScrollView style={styles.dataContent}>
              <ThemedText style={styles.dataText}>
                {JSON.stringify(selectedConflict.data, null, 2)}
              </ThemedText>
            </ScrollView>
          </View>

          <View style={styles.dataColumn}>
            <ThemedText style={styles.dataColumnTitle}>Server Data</ThemedText>
            <ThemedText style={styles.dataColumnSubtitle}>
              Version: {selectedConflict.conflictData?.version || 'Unknown'}
            </ThemedText>
            <ThemedText style={styles.dataColumnSubtitle}>
              Modified:{' '}
              {selectedConflict.conflictData?.lastModified
                ? formatDate(selectedConflict.conflictData.lastModified)
                : 'Unknown'}
            </ThemedText>
            <ScrollView style={styles.dataContent}>
              <ThemedText style={styles.dataText}>
                {JSON.stringify(selectedConflict.conflictData, null, 2)}
              </ThemedText>
            </ScrollView>
          </View>
        </View>

        <View style={styles.resolutionOptions}>
          <TouchableOpacity
            style={[styles.resolutionButton, styles.clientButton]}
            onPress={() =>
              resolveConflict(selectedConflict, ConflictResolutionStrategy.CLIENT_WINS)
            }
            disabled={loading}
          >
            <Ionicons name="phone-portrait" size={24} color="#fff" />
            <ThemedText style={styles.resolutionButtonText}>Keep Local</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.resolutionButton, styles.serverButton]}
            onPress={() =>
              resolveConflict(selectedConflict, ConflictResolutionStrategy.SERVER_WINS)
            }
            disabled={loading}
          >
            <Ionicons name="cloud" size={24} color="#fff" />
            <ThemedText style={styles.resolutionButtonText}>Use Server</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.resolutionButton, styles.mergeButton]}
            onPress={() => resolveConflict(selectedConflict, ConflictResolutionStrategy.MERGE)}
            disabled={loading}
          >
            <Ionicons name="git-merge" size={24} color="#fff" />
            <ThemedText style={styles.resolutionButtonText}>Merge Data</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <ThemedView style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>Resolve Data Conflicts</ThemedText>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={textColor} />
            </TouchableOpacity>
          </View>

          <ThemedText style={styles.modalDescription}>
            These conflicts occurred when syncing data with the server. Please choose how to resolve
            each conflict.
          </ThemedText>

          <View style={styles.contentContainer}>
            <View style={styles.sidebar}>
              <ThemedText style={styles.sidebarTitle}>Conflicts ({conflicts.length})</ThemedText>
              {renderConflictList()}
            </View>

            <View style={styles.mainContent}>{renderConflictDetails()}</View>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <ThemedText style={styles.closeButtonText}>Close</ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 800,
    maxHeight: '90%',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalDescription: {
    marginBottom: 20,
    opacity: 0.7,
  },
  contentContainer: {
    flexDirection: 'row',
    flex: 1,
    minHeight: 400,
  },
  sidebar: {
    width: 200,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#ccc',
    paddingRight: 10,
  },
  sidebarTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
  conflictList: {
    flex: 1,
  },
  conflictItem: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  selectedConflictItem: {
    borderColor: '#0a7ea4',
    backgroundColor: 'rgba(10, 126, 164, 0.1)',
  },
  conflictItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conflictItemType: {
    fontWeight: 'bold',
  },
  conflictItemId: {
    fontSize: 12,
    opacity: 0.7,
  },
  conflictItemDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  mainContent: {
    flex: 1,
    paddingLeft: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    marginTop: 10,
    opacity: 0.7,
  },
  conflictDetails: {
    flex: 1,
  },
  conflictHeader: {
    marginBottom: 20,
  },
  conflictTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  conflictId: {
    opacity: 0.7,
  },
  conflictDataContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  dataColumn: {
    flex: 1,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 10,
  },
  dataColumnTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  dataColumnSubtitle: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 5,
  },
  dataContent: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    padding: 10,
  },
  dataText: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  resolutionOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  resolutionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
  },
  resolutionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  clientButton: {
    backgroundColor: '#FF9800',
  },
  serverButton: {
    backgroundColor: '#2196F3',
  },
  mergeButton: {
    backgroundColor: '#4CAF50',
  },
  modalFooter: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  closeButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  closeButtonText: {
    fontWeight: 'bold',
  },
});

export default ConflictResolutionModal;
