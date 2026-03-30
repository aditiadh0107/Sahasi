import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { ColorPalette, CardStyles, BorderRadius } from '../../constants/designSystem';

interface CardProps {
  children: React.ReactNode;
  variant?: 'standard' | 'beige' | 'featured' | 'interactive';
  style?: ViewStyle;
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'standard',
  style,
}) => {
  const cardStyle = CardStyles[variant];
  
  return (
    <View style={[cardStyle, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  // Additional card styles can be added here
});
