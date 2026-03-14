import { Alert } from 'react-native';

/**
 * Show an error popup to the user instead of only logging to console.
 * Use for user-facing errors (API failures, validation, etc.).
 */
export function showErrorPopup(
  message: string,
  title: string = 'Error'
): void {
  Alert.alert(title, message, [{ text: 'OK' }]);
}
