import { render } from '@testing-library/react-native';
import React from 'react';
import { AccessibilityInfo } from 'react-native';

import QuestionSubmissionForm from '../../components/QuestionSubmissionForm';
import { I18nProvider } from '../../contexts/I18nContext';
import { ThemeProvider } from '../../contexts/ThemeContext';
import FAQScreen from '../../screens/FAQScreen';

// Mock AccessibilityInfo
jest.mock('react-native/Libraries/Components/AccessibilityInfo/AccessibilityInfo', () => ({
  isScreenReaderEnabled: jest.fn(() => Promise.resolve(true)),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  announceForAccessibility: jest.fn(),
  setAccessibilityFocus: jest.fn(),
}));

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

// Mock faqService
jest.mock('../../services/faqService', () => ({
  getApprovedQuestions: jest.fn(() => Promise.resolve([])),
  submitQuestion: jest.fn(() => Promise.resolve('question-id')),
  FAQQuestion: jest.fn(),
}));

// Mock firebase
jest.mock('../../config/firebase', () => ({
  firestore: {},
  auth: {
    currentUser: { email: 'test@example.com' },
  },
}));

describe('Spanish FAQ Accessibility Tests', () => {
  it('should have proper accessibility attributes on FAQ items in Spanish', async () => {
    const { findAllByRole } = render(
      <ThemeProvider>
        <I18nProvider initialLanguage="es">
          <FAQScreen />
        </I18nProvider>
      </ThemeProvider>
    );

    // Find all buttons (FAQ questions)
    const buttons = await findAllByRole('button');

    // Check that we have buttons with accessibility attributes
    expect(buttons.length).toBeGreaterThan(0);

    // Check that each button has proper accessibility attributes
    buttons.forEach(button => {
      expect(button.props.accessibilityLabel).toBeTruthy();
      expect(button.props.accessibilityHint).toBeTruthy();
      expect(button.props.accessibilityRole).toBe('button');
    });
  });

  it('should have proper accessibility attributes on question form in Spanish', () => {
    const { getByRole, getByLabelText } = render(
      <ThemeProvider>
        <I18nProvider initialLanguage="es">
          <QuestionSubmissionForm />
        </I18nProvider>
      </ThemeProvider>
    );

    // Check that the input field has proper accessibility attributes
    const input = getByLabelText('Campo para ingresar su pregunta');
    expect(input).toBeTruthy();
    expect(input.props.accessibilityHint).toBeTruthy();

    // Check that the submit button has proper accessibility attributes
    const submitButton = getByRole('button');
    expect(submitButton.props.accessibilityLabel).toBe('Botón para enviar pregunta');
    expect(submitButton.props.accessibilityHint).toBeTruthy();
    expect(submitButton.props.accessibilityRole).toBe('button');
  });

  it('should announce expanded answers for screen readers in Spanish', async () => {
    const { findAllByRole, findByLabelText } = render(
      <ThemeProvider>
        <I18nProvider initialLanguage="es">
          <FAQScreen />
        </I18nProvider>
      </ThemeProvider>
    );

    // Find all buttons (FAQ questions)
    const buttons = await findAllByRole('button');

    // Simulate pressing the first question
    if (buttons.length > 0) {
      const firstButton = buttons[0];
      firstButton.props.onPress();

      // Check that the answer is accessible
      const answerText = await findByLabelText(/Respuesta:/);
      expect(answerText).toBeTruthy();
    }
  });
});
