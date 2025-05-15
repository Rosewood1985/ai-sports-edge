import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Share,
  Clipboard,
  Alert,
  Modal,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '../hooks/useThemeColor';
import NeonButton from './ui/NeonButton';
import NeonCard from './ui/NeonCard';

interface ReferralShareOptionsProps {
  visible: boolean;
  onClose: () => void;
  referralCode: string;
  appLink?: string;
}

/**
 * ReferralShareOptions component displays options for sharing a referral code
 * @param {ReferralShareOptionsProps} props - Component props
 * @returns {JSX.Element} - Rendered component
 */
const ReferralShareOptions: React.FC<ReferralShareOptionsProps> = ({
  visible,
  onClose,
  referralCode,
  appLink = 'https://aisportsedge.com/download'
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'tint');
  
  // Generate share message
  const getShareMessage = (platform?: string) => {
    const baseMessage = `Join me on AI Sports Edge and get exclusive rewards! Use my referral code: ${referralCode}`;
    
    switch (platform) {
      case 'sms':
        return `${baseMessage}\n\nDownload the app: ${appLink}`;
      case 'email':
        return `${baseMessage}\n\nDownload the app here: ${appLink}`;
      case 'social':
        return `${baseMessage}\n\nDownload: ${appLink} #AISportsEdge #SportsBetting`;
      default:
        return `${baseMessage}\n\nDownload the app: ${appLink}`;
    }
  };
  
  // Handle copy to clipboard
  const handleCopy = () => {
    Clipboard.setString(referralCode);
    setCopied(true);
    
    // Reset copied state after 3 seconds
    setTimeout(() => {
      setCopied(false);
    }, 3000);
    
    Alert.alert('Copied!', 'Referral code copied to clipboard');
  };
  
  // Handle share via system share sheet
  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: getShareMessage(),
        url: appLink // iOS only
      });
      
      if (result.action === Share.sharedAction) {
        // Track successful share
        console.log('Shared successfully');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share referral code. Please try again.');
    }
  };
  
  // Handle share via SMS
  const handleSMS = async () => {
    try {
      // On a real device, this would use a library like react-native-sms
      // For now, we'll use the Share API
      await Share.share({
        message: getShareMessage('sms')
      });
    } catch (error) {
      console.error('Error sharing via SMS:', error);
      Alert.alert('Error', 'Failed to share via SMS. Please try again.');
    }
  };
  
  // Handle share via Email
  const handleEmail = async () => {
    try {
      // On a real device, this would use a library like react-native-mail
      // For now, we'll use the Share API
      await Share.share({
        message: getShareMessage('email'),
        subject: 'Join me on AI Sports Edge!'
      });
    } catch (error) {
      console.error('Error sharing via email:', error);
      Alert.alert('Error', 'Failed to share via email. Please try again.');
    }
  };
  
  // Handle share via social media
  const handleSocial = async () => {
    try {
      await Share.share({
        message: getShareMessage('social')
      });
    } catch (error) {
      console.error('Error sharing via social:', error);
      Alert.alert('Error', 'Failed to share via social media. Please try again.');
    }
  };
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <NeonCard style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: textColor }]}>
              Share Your Referral Code
            </Text>
            
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={textColor} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.codeContainer}>
            <Text style={[styles.codeLabel, { color: textColor }]}>
              Your Code:
            </Text>
            
            <View style={[styles.codeBox, { borderColor: primaryColor }]}>
              <Text style={[styles.code, { color: primaryColor }]}>
                {referralCode}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.copyButton, { backgroundColor: copied ? '#2ecc71' : primaryColor }]}
              onPress={handleCopy}
            >
              <Ionicons 
                name={copied ? "checkmark" : "copy-outline"} 
                size={18} 
                color="#fff" 
              />
              <Text style={styles.copyButtonText}>
                {copied ? 'Copied!' : 'Copy Code'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.shareText, { color: textColor }]}>
            Share via:
          </Text>
          
          <View style={styles.shareOptions}>
            <TouchableOpacity 
              style={styles.shareOption}
              onPress={handleSMS}
            >
              <View style={[styles.shareIconContainer, { backgroundColor: '#3498db' }]}>
                <Ionicons name="chatbubble" size={24} color="#fff" />
              </View>
              <Text style={[styles.shareOptionText, { color: textColor }]}>
                SMS
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.shareOption}
              onPress={handleEmail}
            >
              <View style={[styles.shareIconContainer, { backgroundColor: '#e74c3c' }]}>
                <Ionicons name="mail" size={24} color="#fff" />
              </View>
              <Text style={[styles.shareOptionText, { color: textColor }]}>
                Email
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.shareOption}
              onPress={handleSocial}
            >
              <View style={[styles.shareIconContainer, { backgroundColor: '#9b59b6' }]}>
                <Ionicons name="share-social" size={24} color="#fff" />
              </View>
              <Text style={[styles.shareOptionText, { color: textColor }]}>
                Social
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.shareOption}
              onPress={handleShare}
            >
              <View style={[styles.shareIconContainer, { backgroundColor: '#2ecc71' }]}>
                <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
              </View>
              <Text style={[styles.shareOptionText, { color: textColor }]}>
                More
              </Text>
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.rewardText, { color: textColor }]}>
            You'll both get rewards when they subscribe!
          </Text>
          
          <NeonButton
            title="Done"
            onPress={onClose}
            style={styles.doneButton}
          />
        </NeonCard>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end', // Modal slides up from bottom
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  codeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  codeLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  codeBox: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 2,
    borderRadius: 8,
    marginBottom: 12,
  },
  code: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  copyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 6,
  },
  shareText: {
    fontSize: 16,
    marginBottom: 16,
  },
  shareOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  shareOption: {
    alignItems: 'center',
  },
  shareIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  shareOptionText: {
    fontSize: 12,
  },
  rewardText: {
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.8,
  },
  doneButton: {
    marginTop: 10,
  },
});

export default ReferralShareOptions;