import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import type { ReportReason } from '../src/types/travelPost.types';

interface ReportModalProps {
  visible: boolean;
  contentType: '여행기' | '댓글';
  onClose: () => void;
  onSubmit: (reason: ReportReason, description?: string) => Promise<void>;
  isLoading?: boolean;
}

const REPORT_REASONS: { value: ReportReason; label: string; description: string }[] = [
  {
    value: 'SPAM',
    label: '스팸',
    description: '광고, 홍보 등 부적절한 스팸 콘텐츠',
  },
  {
    value: 'INAPPROPRIATE',
    label: '부적절한 콘텐츠',
    description: '성인 콘텐츠, 폭력적인 내용 등',
  },
  {
    value: 'ABUSE',
    label: '괴롭힘/욕설',
    description: '욕설, 비방, 괴롭힘 등의 내용',
  },
  {
    value: 'PRIVACY',
    label: '개인정보 유출',
    description: '개인정보가 포함된 콘텐츠',
  },
  {
    value: 'OTHER',
    label: '기타',
    description: '기타 사유 (상세 설명 필수)',
  },
];

export default function ReportModal({
  visible,
  contentType,
  onClose,
  onSubmit,
  isLoading = false,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState('');

  const handleSubmit = async () => {
    if (!selectedReason) {
      return;
    }

    // 기타 사유인 경우 상세 설명 필수
    if (selectedReason === 'OTHER' && !description.trim()) {
      return;
    }

    try {
      await onSubmit(selectedReason, description.trim() || undefined);
      // 성공 후 초기화
      setSelectedReason(null);
      setDescription('');
      onClose();
    } catch (error) {
      // 에러는 상위에서 처리
    }
  };

  const handleClose = () => {
    setSelectedReason(null);
    setDescription('');
    onClose();
  };

  const canSubmit = selectedReason && (selectedReason !== 'OTHER' || description.trim().length > 0);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.content} onPress={(e) => e.stopPropagation()}>
          {/* 헤더 */}
          <View style={styles.header}>
            <Text style={styles.title}>{contentType} 신고</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Feather name="x" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* 안내 문구 */}
            <Text style={styles.subtitle}>
              부적절한 {contentType}를 신고해주세요.{'\n'}
              신고 내용을 검토 후 조치하겠습니다.
            </Text>

            {/* 신고 사유 선택 */}
            <View style={styles.reasonsContainer}>
              {REPORT_REASONS.map((reason) => (
                <TouchableOpacity
                  key={reason.value}
                  style={[
                    styles.reasonItem,
                    selectedReason === reason.value && styles.reasonItemSelected,
                  ]}
                  onPress={() => setSelectedReason(reason.value)}
                >
                  <View style={styles.reasonContent}>
                    <View style={styles.reasonHeader}>
                      <Text
                        style={[
                          styles.reasonLabel,
                          selectedReason === reason.value && styles.reasonLabelSelected,
                        ]}
                      >
                        {reason.label}
                      </Text>
                      <View
                        style={[
                          styles.radioButton,
                          selectedReason === reason.value && styles.radioButtonSelected,
                        ]}
                      >
                        {selectedReason === reason.value && (
                          <View style={styles.radioButtonInner} />
                        )}
                      </View>
                    </View>
                    <Text style={styles.reasonDescription}>{reason.description}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* 상세 설명 입력 */}
            {selectedReason && (
              <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionLabel}>
                  상세 설명 {selectedReason === 'OTHER' && '(필수)'}
                </Text>
                <TextInput
                  style={styles.descriptionInput}
                  value={description}
                  onChangeText={setDescription}
                  placeholder={
                    selectedReason === 'OTHER'
                      ? '신고 사유를 상세히 입력해주세요.'
                      : '추가로 설명할 내용이 있다면 입력해주세요. (선택사항)'
                  }
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  editable={!isLoading}
                />
              </View>
            )}
          </ScrollView>

          {/* 제출 버튼 */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.cancelButton, isLoading && styles.buttonDisabled]}
              onPress={handleClose}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!canSubmit || isLoading) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!canSubmit || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>신고하기</Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    maxHeight: 400,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  reasonsContainer: {
    marginBottom: 20,
  },
  reasonItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  reasonItemSelected: {
    borderColor: '#088cda',
    backgroundColor: '#f0f8ff',
  },
  reasonContent: {
    flex: 1,
  },
  reasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  reasonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  reasonLabelSelected: {
    color: '#088cda',
  },
  reasonDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: '#088cda',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#088cda',
  },
  descriptionContainer: {
    marginTop: 8,
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  descriptionInput: {
    fontSize: 14,
    color: '#000',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#088cda',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
