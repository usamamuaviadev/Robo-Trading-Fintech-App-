import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

export interface AssetPerformanceChartProps {
  data: number[];
  width?: number;
  height?: number;
  lineColor?: string;
  gradientColor?: string; // base color for gradient
  gradientFromOpacity?: number;
  gradientToOpacity?: number;
  labels?: string[]; // year labels already translated
  isRTL?: boolean;
}

// Convert array of numeric values to smooth Catmull-Rom cubic bezier path + area path.
const buildPaths = (values: number[], width: number, height: number) => {
  if (!values.length) {
    return { strokePath: '', areaPath: '' };
  }
  const max = Math.max(...values);
  const min = Math.min(...values);
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / (max - min)) * (height - 4); // small top pad
    return { x, y };
  });
  if (pts.length < 2) {
    const single = `M0,${pts[0].y}`;
    return { strokePath: single, areaPath: `${single} L${width},${height} L0,${height} Z` };
  }
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  const last = pts[pts.length - 1];
  const areaPath = `${d} L${last.x},${height} L0,${height} Z`;
  return { strokePath: d, areaPath };
};

export const AssetPerformanceChart: React.FC<AssetPerformanceChartProps> = ({
  data,
  width = 320,
  height = 160,
  lineColor = '#1D2D86',
  gradientColor = '#1D2D86',
  gradientFromOpacity = 0.15,
  gradientToOpacity = 0.03,
  labels,
  isRTL,
}) => {
  const { strokePath, areaPath } = buildPaths(data, width, height);
  return (
    <View>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <LinearGradient id="areaGradient" x1="0" y1="0" x2="0" y2={height}>
            <Stop offset="0%" stopColor={gradientColor} stopOpacity={gradientFromOpacity} />
            <Stop offset="100%" stopColor={gradientColor} stopOpacity={gradientToOpacity} />
          </LinearGradient>
        </Defs>
        <Path d={areaPath} fill="url(#areaGradient)" />
        <Path d={strokePath} stroke={lineColor} strokeWidth={2} fill="none" strokeLinecap="round" />
      </Svg>
      {!!labels?.length && (
        <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} justify-between mt-2 px-1`}>
          {labels.map((label) => (
            <Text key={label} className="text-body-xs text-gray-500">
              {label}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};
