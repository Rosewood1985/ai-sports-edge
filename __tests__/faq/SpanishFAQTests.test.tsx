import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import FAQScreen from '../../screens/FAQScreen';
import QuestionSubmissionForm from '../../components/QuestionSubmissionForm';
import { I18nProvider } from '../../contexts/I18nContext';
import { ThemeProvider } from '../../contexts/ThemeContext';

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve('es')),
  setItem: jest.fn(),
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

// Mock Alert
jest.mock('react-native', () => {
  const rn = jest.requireActual('react-native');
  return {
    ...rn,
    Alert: {
      ...rn.Alert,
      alert: jest.fn(),
    },
  };
});

describe('Spanish FAQ Tests', () => {
  it('should render FAQ screen in Spanish', async () => {
    const { findByText, getByText } = render(
      <ThemeProvider>
        <I18nProvider initialLanguage="es">
          <FAQScreen />
        </I18nProvider>
      </ThemeProvider>
    );

    // Check that the title is in Spanish
    expect(await findByText('Preguntas Frecuentes')).toBeTruthy();
    expect(await findByText('Aprenda más sobre nuestras predicciones de apuestas deportivas con IA')).toBeTruthy();

    // Check that at least one FAQ item is in Spanish
    expect(await findByText('¿Cómo se calculan los intervalos de confianza en las predicciones de IA?')).toBeTruthy();
  });

  it('should render question submission form in Spanish', () => {
    const { getByText, getByPlaceholderText } = render(
      <ThemeProvider>
        <I18nProvider initialLanguage="es">
          <QuestionSubmissionForm />
        </I18nProvider>
      </ThemeProvider>
    );

    // Check that the form elements are in Spanish
    expect(getByText('Hacer una Pregunta')).toBeTruthy();
    expect(getByText('¿Tiene una pregunta sobre apuestas deportivas o nuestras predicciones de IA? Envíela aquí y nuestro equipo la responderá.')).toBeTruthy();
    expect(getByPlaceholderText('Escriba su pregunta aquí...')).toBeTruthy();
    expect(getByText('Enviar Pregunta')).toBeTruthy();
    expect(getByText('Las preguntas son revisadas por nuestro equipo antes de ser añadidas a las FAQ.')).toBeTruthy();
  });

  it('should handle form submission in Spanish', () => {
    const mockAlert = jest.spyOn(require('react-native').Alert, 'alert');
    const { getByText, getByPlaceholderText } = render(
      <ThemeProvider>
        <I18nProvider initialLanguage="es">
          <QuestionSubmissionForm />
        </I18nProvider>
      </ThemeProvider>
    );

    // Enter a question
    const input = getByPlaceholderText('Escriba su pregunta aquí...');
    fireEvent.changeText(input, '¿Cómo puedo mejorar mis apuestas?');

    // Submit the form
    const submitButton = getByText('Enviar Pregunta');
    fireEvent.press(submitButton);

    // Check that the success alert is shown in Spanish
    expect(mockAlert).toHaveBeenCalledWith(
      'Pregunta Enviada',
      'Su pregunta ha sido enviada para revisión. Una vez aprobada, aparecerá en las FAQ.',
      expect.anything()
    );
  });

  it('should show error message in Spanish for empty question', () => {
    const mockAlert = jest.spyOn(require('react-native').Alert, 'alert');
    const { getByText } = render(
      <ThemeProvider>
        <I18nProvider initialLanguage="es">
          <QuestionSubmissionForm />
        </I18nProvider>
      </ThemeProvider>
    );

    // Submit the form without entering a question
    const submitButton = getByText('Enviar Pregunta');
    fireEvent.press(submitButton);

    // Check that the error alert is shown in Spanish
    expect(mockAlert).toHaveBeenCalledWith(
      'Error',
      'Por favor ingrese una pregunta'
    );
  });

  it('should expand FAQ items in Spanish', async () => {
    const { findByText } = render(
      <ThemeProvider>
        <I18nProvider initialLanguage="es">
          <FAQScreen />
        </I18nProvider>
      </ThemeProvider>
    );

    // Find a FAQ question in Spanish
    const question = await findByText('¿Cómo se calculan los intervalos de confianza en las predicciones de IA?');
    
    // Click on the question to expand it
    fireEvent.press(question);
    
    // Check that the answer is displayed in Spanish
    expect(await findByText(/Los intervalos de confianza en nuestras predicciones de IA se calculan/)).toBeTruthy();
  });
});