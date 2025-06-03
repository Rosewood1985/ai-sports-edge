import { useTheme } from '@react-navigation/native';
import React, { useState, useEffect } from 'react';
import { StyleSheet, ViewStyle, StyleProp, View, Modal } from 'react-native';

import { AccessibleThemedView } from '../atoms';
import { ModalHeader, AlertPreview, ActionButtons } from '../molecules';
import AlertFiltersForm, { AlertFilters } from './AlertFiltersForm';
import AlertTypeSelector from './AlertTypeSelector';
import { AlertType } from '../atoms/AlertTypeIcon';
import { useI18n } from './i18n/I18nContext';

/**
 * CustomAlertsModal component that displays a modal for creating custom alerts.
 *
 * This is an organism component that combines molecules to form
 * a more complex component in the atomic design system.
 */
export interface CustomAlertsModalProps {
  /**
   * Whether the modal is visible
   */
  visible: boolean;

  /**
   * Callback when the modal is closed
   */
  onClose?: () => void;

  /**
   * Callback when an alert is created
   */
  onCreateAlert?: (alertType: AlertType, filters: AlertFilters) => void;

  /**
   * Accessibility label for screen readers
   */
  accessibilityLabel?: string;

  /**
   * Additional style for the modal container
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Initial alert type
   * @default 'lineMovement'
   */
  initialAlertType?: AlertType;

  /**
   * Initial alert filters
   */
  initialFilters?: Partial<AlertFilters>;

  /**
   * Whether the modal is in loading state
   * @default false
   */
  loading?: boolean;
}

const CustomAlertsModal: React.FC<CustomAlertsModalProps> = ({
  visible,
  onClose,
  onCreateAlert,
  accessibilityLabel,
  style,
  initialAlertType = 'lineMovement',
  initialFilters,
  loading = false,
}) => {
  const { colors } = useTheme();
  const { t } = useI18n();

  // Default accessibility label if none provided
  const defaultAccessibilityLabel = accessibilityLabel || t('components.customAlertsModal.label');

  // State for alert type and filters
  const [alertType, setAlertType] = useState<AlertType>(initialAlertType);
  const [filters, setFilters] = useState<AlertFilters>({
    sports: [],
    threshold: 2,
    methods: {
      pushNotification: true,
      email: false,
    },
    ...initialFilters,
  });

  // Reset state when modal becomes visible
  useEffect(() => {
    if (visible) {
      setAlertType(initialAlertType);
      setFilters({
        sports: [],
        threshold: 2,
        methods: {
          pushNotification: true,
          email: false,
        },
        ...initialFilters,
      });
    }
  }, [visible, initialAlertType, initialFilters]);

  // Handle alert type selection
  const handleAlertTypeSelect = (type: AlertType) => {
    setAlertType(type);
  };

  // Handle filters change
  const handleFiltersChange = (newFilters: AlertFilters) => {
    setFilters(newFilters);
  };

  // Handle create alert
  const handleCreateAlert = () => {
    if (onCreateAlert) {
      onCreateAlert(alertType, filters);
    }
  };

  // Generate alert preview text
  const getAlertPreviewText = (): { title: string; description: string } => {
    const sportText =
      filters.sports.length > 0 ? filters.sports.join(', ') : t('alerts.preview.allSports');

    let title = '';
    let description = '';

    switch (alertType) {
      case 'lineMovement':
        title = t('alerts.preview.lineMovementTitle', { sport: sportText });
        description = t('alerts.preview.lineMovementDescription', {
          sport: sportText,
          threshold: filters.threshold,
        });
        break;
      case 'sharpAction':
        title = t('alerts.preview.sharpActionTitle', { sport: sportText });
        description = t('alerts.preview.sharpActionDescription', { sport: sportText });
        break;
      case 'aiPrediction':
        title = t('alerts.preview.aiPredictionTitle', { sport: sportText });
        description = t('alerts.preview.aiPredictionDescription', { sport: sportText });
        break;
      case 'playerProps':
        title = t('alerts.preview.playerPropsTitle', { sport: sportText });
        description = t('alerts.preview.playerPropsDescription', { sport: sportText });
        break;
      default:
        title = t('alerts.preview.defaultTitle');
        description = t('alerts.preview.defaultDescription');
    }

    return { title, description };
  };

  const previewText = getAlertPreviewText();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <AccessibleThemedView
          style={[styles.modalContainer, { backgroundColor: colors.background }, style]}
          accessibilityLabel={defaultAccessibilityLabel}
        >
          <ModalHeader title={t('components.customAlertsModal.title')} onClose={onClose} />

          <View style={styles.modalContent}>
            <AccessibleThemedView style={styles.description}>
              {t('components.customAlertsModal.description')}
            </AccessibleThemedView>

            <View style={styles.section}>
              <AccessibleThemedView style={styles.sectionTitle}>
                {t('components.customAlertsModal.alertTypeTitle')}
              </AccessibleThemedView>

              <AlertTypeSelector
                selectedType={alertType}
                onSelectType={handleAlertTypeSelect}
                disabled={loading}
              />
            </View>

            <View style={styles.section}>
              <AccessibleThemedView style={styles.sectionTitle}>
                {t('components.customAlertsModal.filtersTitle')}
              </AccessibleThemedView>

              <AlertFiltersForm
                alertType={alertType}
                filters={filters}
                onFiltersChange={handleFiltersChange}
                disabled={loading}
              />
            </View>

            <View style={styles.section}>
              <AccessibleThemedView style={styles.sectionTitle}>
                {t('components.customAlertsModal.previewTitle')}
              </AccessibleThemedView>

              <AlertPreview
                title={previewText.title}
                description={previewText.description}
                iconName={
                  alertType === 'lineMovement'
                    ? 'stats-chart'
                    : alertType === 'sharpAction'
                      ? 'information-circle'
                      : alertType === 'aiPrediction'
                        ? 'chatbubbles'
                        : 'person'
                }
              />
            </View>
          </View>

          <View style={styles.footer}>
            <ActionButtons
              primaryLabel={t('components.customAlertsModal.createButton')}
              secondaryLabel={t('components.customAlertsModal.cancelButton')}
              onPrimaryPress={handleCreateAlert}
              onSecondaryPress={onClose}
              primaryDisabled={filters.sports.length === 0 || loading}
              secondaryDisabled={loading}
              primaryLoading={loading}
            />
          </View>
        </AccessibleThemedView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 12,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  modalContent: {
    padding: 16,
  },
  description: {
    fontSize: 14,
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
});

export default CustomAlertsModal;
