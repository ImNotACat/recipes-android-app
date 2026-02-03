import React from "react";
import { View, Text } from "react-native";
import Svg, { Circle, G } from "react-native-svg";

interface MacroData {
  carbs: number;  // in grams
  protein: number; // in grams
  fat: number;    // in grams
  calories?: number; // if provided, use this; otherwise calculate
}

interface MacroWheelProps {
  macros: MacroData;
  size?: number;
  strokeWidth?: number;
  showLegend?: boolean;
  isDark?: boolean;
}

export function MacroWheel({
  macros,
  size = 120,
  strokeWidth = 12,
  showLegend = true,
  isDark = false,
}: MacroWheelProps) {
  // Calculate calories: carbs=4cal/g, protein=4cal/g, fat=9cal/g
  const carbCalories = macros.carbs * 4;
  const proteinCalories = macros.protein * 4;
  const fatCalories = macros.fat * 9;
  const calculatedCalories = carbCalories + proteinCalories + fatCalories;
  // Use stored calories if available, otherwise use calculated
  const totalCalories = macros.calories ?? calculatedCalories;

  // Calculate percentages
  const carbPercent = totalCalories > 0 ? (carbCalories / totalCalories) * 100 : 0;
  const proteinPercent = totalCalories > 0 ? (proteinCalories / totalCalories) * 100 : 0;
  const fatPercent = totalCalories > 0 ? (fatCalories / totalCalories) * 100 : 0;

  // SVG calculations
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Colors matching the design
  const colors = {
    carbs: "#9B59B6",    // Purple
    protein: "#F1C40F",  // Yellow
    fat: "#E74C8C",      // Pink
  };

  // Calculate stroke dash arrays for each segment
  const carbDash = (carbPercent / 100) * circumference;
  const proteinDash = (proteinPercent / 100) * circumference;
  const fatDash = (fatPercent / 100) * circumference;

  // Calculate rotation offsets
  const carbOffset = 0;
  const proteinOffset = carbDash;
  const fatOffset = carbDash + proteinDash;

  return (
    <View className="flex-row items-center">
      {/* Donut Chart */}
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          {/* Background circle */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={isDark ? "#393C49" : "#F3F4F6"}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          
          <G rotation="-90" origin={`${center}, ${center}`}>
            {/* Carbs segment */}
            {carbPercent > 0 && (
              <Circle
                cx={center}
                cy={center}
                r={radius}
                stroke={colors.carbs}
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={`${carbDash} ${circumference - carbDash}`}
                strokeDashoffset={0}
                strokeLinecap="round"
              />
            )}
            
            {/* Protein segment */}
            {proteinPercent > 0 && (
              <Circle
                cx={center}
                cy={center}
                r={radius}
                stroke={colors.protein}
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={`${proteinDash} ${circumference - proteinDash}`}
                strokeDashoffset={-carbDash}
                strokeLinecap="round"
              />
            )}
            
            {/* Fat segment */}
            {fatPercent > 0 && (
              <Circle
                cx={center}
                cy={center}
                r={radius}
                stroke={colors.fat}
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={`${fatDash} ${circumference - fatDash}`}
                strokeDashoffset={-(carbDash + proteinDash)}
                strokeLinecap="round"
              />
            )}
          </G>
        </Svg>
        
        {/* Center text */}
        <View 
          className="absolute items-center justify-center"
          style={{ 
            width: size, 
            height: size,
          }}
        >
          <Text 
            className="text-2xl font-bold"
            style={{ color: isDark ? '#FFFFFF' : '#111827' }}
          >
            {Math.round(totalCalories)}
          </Text>
          <Text 
            className="text-xs uppercase tracking-wider"
            style={{ color: isDark ? '#ABBBC2' : '#9CA3AF' }}
          >
            Calories
          </Text>
        </View>
      </View>

      {/* Legend */}
      {showLegend && (
        <View className="ml-6 gap-3">
          <View className="flex-row items-center">
            <View 
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: colors.carbs }}
            />
            <View>
              <Text className="text-sm" style={{ color: isDark ? '#ABBBC2' : '#6B7280' }}>Carbohydrate</Text>
              <Text className="font-semibold" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>{macros.carbs}g</Text>
            </View>
          </View>
          
          <View className="flex-row items-center">
            <View 
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: colors.protein }}
            />
            <View>
              <Text className="text-sm" style={{ color: isDark ? '#ABBBC2' : '#6B7280' }}>Protein</Text>
              <Text className="font-semibold" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>{macros.protein}g</Text>
            </View>
          </View>
          
          <View className="flex-row items-center">
            <View 
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: colors.fat }}
            />
            <View>
              <Text className="text-sm" style={{ color: isDark ? '#ABBBC2' : '#6B7280' }}>Fat</Text>
              <Text className="font-semibold" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>{macros.fat}g</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
