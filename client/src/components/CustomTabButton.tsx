import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';

const CustomTabButton: React.FC<BottomTabBarButtonProps> = ({ children, onPress }) => (
  <TouchableOpacity style={styles.container} onPress={onPress}>
    <View style={styles.button}>
      {children}
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 5,
  },
});

export default CustomTabButton;
