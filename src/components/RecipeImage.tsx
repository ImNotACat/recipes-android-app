import { View, Text, Image, ImageStyle, ViewStyle } from "react-native";

interface RecipeImageProps {
  imageUrl?: string | null;
  size?: "small" | "medium" | "large";
  className?: string;
  style?: ViewStyle | ImageStyle;
  isDark?: boolean;
}

export function RecipeImage({ 
  imageUrl, 
  size = "medium",
  className = "",
  style,
  isDark = false,
}: RecipeImageProps) {
  const sizeStyles = {
    small: "h-28",
    medium: "h-48",
    large: "h-64",
  };

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        className={`w-full ${sizeStyles[size]} ${className}`}
        style={style}
        resizeMode="cover"
      />
    );
  }

  // Placeholder when no image
  return (
    <View 
      className={`w-full ${sizeStyles[size]} bg-gradient-to-br items-center justify-center ${className}`}
      style={[{ backgroundColor: isDark ? '#252836' : '#FEF2F2' }, style]}
    >
      <View className="items-center">
        <Text className="text-5xl mb-2">🍽️</Text>
        <Text 
          className="text-sm font-medium"
          style={{ color: isDark ? '#ABBBC2' : '#FDA4AF' }}
        >
          No Image
        </Text>
      </View>
    </View>
  );
}
