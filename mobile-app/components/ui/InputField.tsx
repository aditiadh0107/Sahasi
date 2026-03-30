import React, { useState } from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { ColorPalette, Typography, InputStyles, Spacing, BorderRadius } from '../../constants/designSystem';
import { Ionicons } from '@expo/vector-icons';

interface InputFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  containerStyle?: ViewStyle;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  error,
  icon,
  containerStyle,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={styles.inputWrapper}>
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={error ? ColorPalette.danger.red : isFocused ? ColorPalette.primary.pink : ColorPalette.neutral.gray400}
            style={styles.icon}
          />
        )}
        
        <TextInput
          style={[
            styles.input,
            icon && styles.inputWithIcon,
            isFocused && styles.inputFocused,
            error && styles.inputError,
          ]}
          placeholderTextColor={ColorPalette.text.tertiary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.base,
  },
  
  label: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.secondary,
    fontWeight: Typography.fontWeight.medium,
    color: ColorPalette.text.primary,
    marginBottom: Spacing.sm,
  },
  
  inputWrapper: {
    position: 'relative',
  },
  
  input: {
    ...InputStyles.standard,
    fontFamily: Typography.fontFamily.secondary,
  },
  
  inputWithIcon: {
    paddingLeft: 45,
  },
  
  inputFocused: {
    ...InputStyles.focused,
  },
  
  inputError: {
    ...InputStyles.error,
  },
  
  icon: {
    position: 'absolute',
    left: Spacing.md,
    top: '50%',
    transform: [{ translateY: -10 }],
    zIndex: 1,
  },
  
  errorText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.secondary,
    color: ColorPalette.danger.red,
    marginTop: Spacing.xs,
  },
});
