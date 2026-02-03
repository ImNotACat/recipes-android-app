import React from "react";
import { View, Text } from "react-native";

interface MacroData {
  carbs: number;   // in grams
  protein: number; // in grams
  fat: number;     // in grams
  calories?: number; // if provided, use this; otherwise calculate
}

interface MacroBarProps {
  macros: MacroData;
  height?: number;
  showLabel?: boolean;
  labelPosition?: "above" | "below";
  isDark?: boolean;
}

export function MacroBar({
  macros,
  height = 6,
  showLabel = true,
  labelPosition = "below",
  isDark = false,
}: MacroBarProps) {
  // Calculate calories: carbs=4cal/g, protein=4cal/g, fat=9cal/g
  const carbCalories = macros.carbs * 4;
  const proteinCalories = macros.protein * 4;
  const fatCalories = macros.fat * 9;
  const calculatedCalories = carbCalories + proteinCalories + fatCalories;
  // Use stored calories if available, otherwise use calculated
  const totalCalories = macros.calories ?? calculatedCalories;

  // Calculate percentages based on calculated values (for visual accuracy)
  const carbPercent = calculatedCalories > 0 ? (carbCalories / calculatedCalories) * 100 : 0;
  const proteinPercent = calculatedCalories > 0 ? (proteinCalories / calculatedCalories) * 100 : 0;
  const fatPercent = calculatedCalories > 0 ? (fatCalories / calculatedCalories) * 100 : 0;

  // Colors matching the wheel
  const colors = {
    carbs: "#9B59B6",    // Purple
    protein: "#F1C40F",  // Yellow
    fat: "#E74C8C",      // Pink
  };

  const label = (
    <Text className="text-xs" style={{ color: isDark ? '#ABBBC2' : '#6B7280' }}>
      <Text className="font-medium" style={{ color: isDark ? '#FFFFFF' : '#374151' }}>{Math.round(totalCalories)} cal</Text>
      <Text style={{ color: isDark ? '#393C49' : '#D1D5DB' }}> · </Text>
      <Text style={{ color: colors.carbs }}>{macros.carbs}g</Text>
      <Text> C</Text>
      <Text style={{ color: isDark ? '#393C49' : '#D1D5DB' }}> / </Text>
      <Text style={{ color: colors.protein }}>{macros.protein}g</Text>
      <Text> P</Text>
      <Text style={{ color: isDark ? '#393C49' : '#D1D5DB' }}> / </Text>
      <Text style={{ color: colors.fat }}>{macros.fat}g</Text>
      <Text> F</Text>
    </Text>
  );

  return (
    <View>
      {showLabel && labelPosition === "above" && (
        <View className="mb-1">{label}</View>
      )}
      
      {/* Bar container */}
      <View 
        className="w-full rounded-full overflow-hidden flex-row"
        style={{ height }}
      >
        {/* Carbs segment */}
        {carbPercent > 0 && (
          <View 
            style={{ 
              width: `${carbPercent}%`, 
              backgroundColor: colors.carbs,
              height: '100%',
            }} 
          />
        )}
        
        {/* Protein segment */}
        {proteinPercent > 0 && (
          <View 
            style={{ 
              width: `${proteinPercent}%`, 
              backgroundColor: colors.protein,
              height: '100%',
            }} 
          />
        )}
        
        {/* Fat segment */}
        {fatPercent > 0 && (
          <View 
            style={{ 
              width: `${fatPercent}%`, 
              backgroundColor: colors.fat,
              height: '100%',
            }} 
          />
        )}
      </View>
      
      {showLabel && labelPosition === "below" && (
        <View className="mt-1">{label}</View>
      )}
    </View>
  );
}
