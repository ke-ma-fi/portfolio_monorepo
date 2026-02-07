/**
 * Brand colors synced with globals.css
 * Centralized for consistency across all email templates
 */
export const colors = {
  // Primary palette
  background: '#F8F8F8',      // Off-White
  surface: '#FFFFFF',         // White
  text: '#1A1A1A',            // Black
  textSecondary: '#666666',   // Medium Gray
  
  primary: '#E01035',         // Brand Red (Buttons, Links) - Matches globals.css --primary
  secondary: '#8C30F5',       // Vibrant Purple - Matches globals.css --secondary
  accent: '#E01035',          // Brand Red
  highlight: '#FF2EC5',       // Hot Pink
  
  // Utility colors
  success: '#2E7D32',         // Standard Success Green
  warning: '#FF9900',         // Orange
  error: '#E01035',           // Brand Red
  border: '#E5E5E5',          // Light Gray
  
  // Button styles
  buttonPrimary: '#E01035',   // Brand Red
  buttonPrimaryText: '#FFFFFF',
  buttonHover: '#C00E2D',     // Darker shade of red
} as const
