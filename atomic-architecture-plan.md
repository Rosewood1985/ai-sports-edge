# CustomAlertsModal Component - Atomic Architecture Plan

## Overview

This document outlines the atomic architecture plan for implementing the CustomAlertsModal component. The component will be built following atomic design principles, with atoms as the smallest building blocks, molecules as combinations of atoms, and organisms as combinations of molecules and atoms.

## 1. Atoms

Atoms are the basic building blocks of the application. They are the smallest components that can't be broken down further.

### 1.1 IconButton

- **File**: `atomic/atoms/IconButton.tsx`
- **Description**: A reusable button with an icon, used for the close button in the modal header.
- **Props**:
  - `name`: Icon name from Ionicons
  - `size`: Size of the icon
  - `color`: Color of the icon
  - `backgroundColor`: Background color of the button
  - `circular`: Whether the button has a circular shape
  - `onPress`: Callback when the button is pressed
  - `accessibilityLabel`: Accessibility label for screen readers
  - `accessibilityHint`: Accessibility hint for screen readers
  - `style`: Additional style for the button
  - `disabled`: Whether the button is disabled

### 1.2 AlertTypeIcon

- **File**: `atomic/atoms/AlertTypeIcon.tsx`
- **Description**: An icon component specifically for alert types, with a circular background.
- **Props**:
  - `type`: Type of alert ('lineMovement', 'sharpAction', 'aiPrediction', 'playerProps')
  - `size`: Size of the icon
  - `selected`: Whether the icon is selected
  - `accessibilityLabel`: Accessibility label for screen readers
  - `style`: Additional style for the icon

### 1.3 FilterTag

- **File**: `atomic/atoms/FilterTag.tsx`
- **Description**: A tag component for selecting filters like sports (NBA, NFL, etc.).
- **Props**:
  - `label`: Text to display in the tag
  - `selected`: Whether the tag is selected
  - `onPress`: Callback when the tag is pressed
  - `accessibilityLabel`: Accessibility label for screen readers
  - `style`: Additional style for the tag

### 1.4 Slider

- **File**: `atomic/atoms/Slider.tsx`
- **Description**: A slider component for selecting numeric values, used for the line movement threshold.
- **Props**:
  - `value`: Current value of the slider
  - `onValueChange`: Callback when the value changes
  - `minimumValue`: Minimum value of the slider
  - `maximumValue`: Maximum value of the slider
  - `step`: Step size for the slider
  - `accessibilityLabel`: Accessibility label for screen readers
  - `accessibilityHint`: Accessibility hint for screen readers
  - `style`: Additional style for the slider

### 1.5 CheckboxWithLabel

- **File**: `atomic/atoms/CheckboxWithLabel.tsx`
- **Description**: A checkbox component with a label, used for alert method selection.
- **Props**:
  - `label`: Text to display next to the checkbox
  - `checked`: Whether the checkbox is checked
  - `onToggle`: Callback when the checkbox is toggled
  - `accessibilityLabel`: Accessibility label for screen readers
  - `style`: Additional style for the checkbox

## 2. Molecules

Molecules are combinations of atoms that work together as a unit.

### 2.1 ModalHeader

- **File**: `atomic/molecules/ModalHeader.tsx`
- **Description**: The header of the modal, combining a title and a close button.
- **Props**:
  - `title`: Title text to display
  - `onClose`: Callback when the close button is pressed
  - `accessibilityLabel`: Accessibility label for screen readers
  - `style`: Additional style for the header

### 2.2 AlertTypeOption

- **File**: `atomic/molecules/AlertTypeOption.tsx`
- **Description**: A selectable option for alert types, combining an icon and a label.
- **Props**:
  - `type`: Type of alert ('lineMovement', 'sharpAction', 'aiPrediction', 'playerProps')
  - `label`: Text to display below the icon
  - `selected`: Whether the option is selected
  - `onSelect`: Callback when the option is selected
  - `accessibilityLabel`: Accessibility label for screen readers
  - `style`: Additional style for the option

### 2.3 FilterSection

- **File**: `atomic/molecules/FilterSection.tsx`
- **Description**: A section for filters, with a title and content.
- **Props**:
  - `title`: Title text to display
  - `children`: Content to display in the section
  - `accessibilityLabel`: Accessibility label for screen readers
  - `style`: Additional style for the section

### 2.4 AlertPreview

- **File**: `atomic/molecules/AlertPreview.tsx`
- **Description**: A preview of what the alert will look like, with an icon and description.
- **Props**:
  - `title`: Title of the alert
  - `description`: Description of the alert
  - `icon`: Icon to display
  - `accessibilityLabel`: Accessibility label for screen readers
  - `style`: Additional style for the preview

### 2.5 ActionButtons

- **File**: `atomic/molecules/ActionButtons.tsx`
- **Description**: Container for action buttons (Cancel, Create).
- **Props**:
  - `primaryLabel`: Label for the primary button
  - `secondaryLabel`: Label for the secondary button
  - `onPrimaryPress`: Callback when the primary button is pressed
  - `onSecondaryPress`: Callback when the secondary button is pressed
  - `primaryDisabled`: Whether the primary button is disabled
  - `secondaryDisabled`: Whether the secondary button is disabled
  - `accessibilityLabel`: Accessibility label for screen readers
  - `style`: Additional style for the buttons

## 3. Organisms

Organisms are combinations of molecules and atoms that form a distinct section of the interface.

### 3.1 AlertTypeSelector

- **File**: `atomic/organisms/AlertTypeSelector.tsx`
- **Description**: Grid of alert type options.
- **Props**:
  - `selectedType`: Currently selected alert type
  - `onSelectType`: Callback when an alert type is selected
  - `accessibilityLabel`: Accessibility label for screen readers
  - `style`: Additional style for the selector

### 3.2 AlertFiltersForm

- **File**: `atomic/organisms/AlertFiltersForm.tsx`
- **Description**: Collection of filter sections for configuring the alert.
- **Props**:
  - `alertType`: Type of alert selected
  - `filters`: Current filter values
  - `onFiltersChange`: Callback when filters are changed
  - `accessibilityLabel`: Accessibility label for screen readers
  - `style`: Additional style for the form

### 3.3 CustomAlertsModal

- **File**: `atomic/organisms/CustomAlertsModal.tsx`
- **Description**: The main modal component that combines all the other components.
- **Props**:
  - `visible`: Whether the modal is visible
  - `onClose`: Callback when the modal is closed
  - `onCreateAlert`: Callback when an alert is created
  - `initialAlertType`: Initial alert type to select
  - `initialFilters`: Initial filter values
  - `accessibilityLabel`: Accessibility label for screen readers
  - `style`: Additional style for the modal

## 4. State Management

The CustomAlertsModal will manage the following state:

1. **Alert Type**: The currently selected alert type
2. **Filters**:
   - Selected sports
   - Selected team (if any)
   - Line movement threshold
   - Alert methods (push notification, email)
3. **Modal Visibility**: Whether the modal is visible

## 5. Internationalization

All text in the component will be internationalized using the I18nContext. This includes:

- Modal title and description
- Alert type labels
- Filter labels
- Button labels
- Alert preview text

## 6. Accessibility

All components will include proper accessibility support:

- Accessible labels and hints
- Focus management
- Screen reader support
- High contrast mode support
- Large text support

## 7. Theming

All components will use the theme context to ensure consistent styling across light and dark modes.

## 8. Implementation Order

The components will be implemented in the following order:

1. Atoms: IconButton, AlertTypeIcon, FilterTag, Slider, CheckboxWithLabel
2. Molecules: ModalHeader, AlertTypeOption, FilterSection, AlertPreview, ActionButtons
3. Organisms: AlertTypeSelector, AlertFiltersForm, CustomAlertsModal

This ensures that each component has its dependencies available when it's implemented.
