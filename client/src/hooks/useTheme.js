import { useTheme as useThemeFromContext } from '../context/ThemeContext';

export function useTheme() {
  return useThemeFromContext();
}
