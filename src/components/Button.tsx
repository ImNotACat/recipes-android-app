import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  TouchableOpacityProps,
} from "react-native";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: "primary" | "secondary" | "outline";
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  title,
  variant = "primary",
  isLoading = false,
  icon,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const baseStyles = "flex-row items-center justify-center py-4 px-6 rounded-xl";
  
  const variantStyles = {
    primary: "bg-primary-500 active:bg-primary-600",
    secondary: "bg-gray-100 active:bg-gray-200",
    outline: "bg-white border-2 border-gray-200 active:bg-gray-50",
  };

  const textStyles = {
    primary: "text-white font-semibold text-base",
    secondary: "text-gray-800 font-semibold text-base",
    outline: "text-gray-800 font-semibold text-base",
  };

  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      className={`${baseStyles} ${variantStyles[variant]} ${isDisabled ? "opacity-50" : ""} ${className || ""}`}
      disabled={isDisabled}
      activeOpacity={0.8}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator
          color={variant === "primary" ? "white" : "#1f2937"}
          size="small"
        />
      ) : (
        <View className="flex-row items-center gap-3">
          {icon}
          <Text className={textStyles[variant]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
