// components/CustomTabButton.tsx
import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';

interface CustomTabButtonProps {
  label: string;
  icon: string;
  isFocused: boolean;
  onPress: () => void;
}

const CustomTabButton: React.FC<CustomTabButtonProps> = ({ label, icon, isFocused, onPress }) => {
  return (
    <TouchableOpacity
      style={tw`items-center justify-center`}
      onPress={onPress}
    >
      <View style={tw`items-center justify-center ${isFocused ? 'bg-red-600' : 'bg-white'} rounded-full w-12 h-12`}>
        <Ionicons name={icon as any} size={24} color={isFocused ? 'white' : 'gray'} />
      </View>
      <Text style={tw`text-xs mt-1 ${isFocused ? 'text-red-600' : 'text-gray-500'}`}>{label}</Text>
    </TouchableOpacity>
  );
};

export default CustomTabButton;