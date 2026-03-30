import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { ColorPalette, Typography, ButtonStyles, Spacing } from '../../constants/designSystem';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
}) => {
  const getButtonStyle = () => {
    const baseStyle = ButtonStyles[variant];
    const sizeStyle = styles[`button_${size}`];
    
    return [
      baseStyle,
      sizeStyle,
      fullWidth && styles.fullWidth,
      disabled && styles.disabled,
      style,
    ];
  };

  const getTextColor = () => {
    if (disabled) return ColorPalette.text.disabled;
    if (variant === 'outline') return ColorPalette.primary.pink;
    if (variant === 'text') return ColorPalette.primary.pink;
    return ColorPalette.neutral.white;
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text
          style={[
            styles.buttonText,
            { color: getTextColor() },
            styles[`text_${size}`],
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Size Variants
  button_small: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
  },
  button_medium: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  button_large: {
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.xxl,
  },
  
  text_small: {
    fontSize: Typography.fontSize.sm,
  },
  text_medium: {
    fontSize: Typography.fontSize.base,
  },
  text_large: {
    fontSize: Typography.fontSize.md,
  },
  
  buttonText: {
    fontFamily: Typography.fontFamily.primary,
    fontWeight: Typography.fontWeight.semibold,
    textAlign: 'center',
  },
  
  fullWidth: {
    width: '100%',
  },
  
  disabled: {
    opacity: 0.5,
  },
});
