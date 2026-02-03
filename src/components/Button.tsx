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
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export function Button({
  title,
  variant = "primary",
  size = "md",
  isLoading = false,
  icon,
  disabled,
  fullWidth = false,
  className,
  ...props
}: ButtonProps) {
  const sizeStyles = {
    sm: "py-2 px-4",
    md: "py-3 px-6",
    lg: "py-4 px-8",
  };

  const baseStyles = `flex-row items-center justify-center rounded-full ${sizeStyles[size]}`;
  
  const variantStyles = {
    primary: "bg-primary-500 active:bg-primary-600",
    secondary: "bg-gray-100 active:bg-gray-200",
    outline: "bg-white border-2 border-primary-500 active:bg-primary-50",
  };

  const textStyles = {
    primary: "text-white font-semibold text-base",
    secondary: "text-gray-800 font-semibold text-base",
    outline: "text-primary-500 font-semibold text-base",
  };

  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      className={`${baseStyles} ${variantStyles[variant]} ${isDisabled ? "opacity-50" : ""} ${fullWidth ? "w-full" : ""} ${className || ""}`}
      disabled={isDisabled}
      activeOpacity={0.8}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator
          color={variant === "primary" ? "white" : "#EA4335"}
          size="small"
        />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon}
          <Text className={textStyles[variant]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
