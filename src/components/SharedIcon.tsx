import Svg, { Circle, Path } from "react-native-svg";

interface SharedIconProps {
  size?: number;
  color?: string;
}

export function SharedIcon({ size = 16, color = "#EA4335" }: SharedIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* First person */}
      <Circle cx="9" cy="7" r="3.5" fill={color} />
      <Path
        d="M2 19c0-3.314 3.134-6 7-6s7 2.686 7 6"
        fill={color}
      />
      {/* Second person (slightly behind) */}
      <Circle cx="16" cy="7" r="3" fill={color} opacity={0.6} />
      <Path
        d="M13 19c0-2.761 2.239-5 5-5s5 2.239 5 5"
        fill={color}
        opacity={0.6}
      />
    </Svg>
  );
}
