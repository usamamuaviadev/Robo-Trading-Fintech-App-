import React from 'react';
import { View, Text, Image, ImageSourcePropType, Pressable } from 'react-native';
import { Badge } from './Badge';

export interface FeatureCardProps {
  title: string;
  subtitle?: string;
  description: string;
  imageUrl?: ImageSourcePropType;
  badge?: string;
  badgeVariant?: 'primary' | 'success' | 'warning' | 'danger';
  onPress?: () => void;
  actionText?: string;
  testID?: string;
}

/**
 * Feature Card Component - Reusable card for displaying features/products
 * Used in onboarding, portfolio display, etc.
 */
export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  subtitle,
  description,
  imageUrl,
  badge,
  badgeVariant = 'primary',
  onPress,
  actionText,
  testID,
}) => {
  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-2xl overflow-hidden shadow-md active:shadow-lg transition-all"
      testID={testID}
    >
      {/* Header with Badge */}
      <View className="bg-gradient-to-br from-primary-50 to-secondary-100 px-4 py-6 flex flex-row justify-between items-start">
        <View className="flex-1">
          {subtitle && (
            <Text className="text-label-sm text-primary-600 mb-2 font-semibold">
              {subtitle}
            </Text>
          )}
          <Text className="text-h5 font-bold text-gray-900 mb-1">
            {title}
          </Text>
        </View>
        {badge && (
          <Badge label={badge} variant={badgeVariant} size="sm" />
        )}
      </View>

      {/* Image Area */}
      {imageUrl && (
        <View className="h-40 bg-neutral-100 items-center justify-center overflow-hidden">
          <Image
            source={imageUrl}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        </View>
      )}

      {/* Content */}
      <View className="px-4 py-4">
        <Text className="text-body text-gray-700 mb-4 leading-relaxed">
          {description}
        </Text>

        {actionText && (
          <View className="flex flex-row justify-between items-center">
            <Text className="text-label font-semibold text-primary-500">
              {actionText}
            </Text>
            <Text className="text-lg">→</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
};
