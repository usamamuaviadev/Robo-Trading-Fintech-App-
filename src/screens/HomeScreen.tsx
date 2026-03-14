import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Button, Card, Badge } from '../components';
import { useLanguage } from '../hooks';

interface HomeScreenProps {
  testID?: string;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ testID }) => {
  const { t, isArabic, switchLanguage } = useLanguage();
  const [portfolioValue] = useState('$25,000.50');
  const [dayReturn] = useState('+$1,250.00');
  const [dayReturnPercent] = useState('+5.2%');

  return (
    <ScrollView
      className="flex-1 bg-neutral-50"
      testID={testID}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View className="bg-gradient-to-br from-primary-500 to-primary-700 px-lg py-6">
        <View className="flex flex-row justify-between items-center mb-8">
          <Text className="text-h4 font-bold text-white">Robo Advisor</Text>
          <Pressable
            className="bg-white/20 px-3 py-2 rounded-full"
            onPress={() => switchLanguage(isArabic ? 'en' : 'ar')}
          >
            <Text className="text-label text-white font-semibold">
              {isArabic ? 'EN' : 'AR'}
            </Text>
          </Pressable>
        </View>

        {/* Portfolio Summary */}
        <View className="bg-white/10 rounded-xl p-lg">
          <Text className="text-label text-white/80 mb-2">
            {t('portfolio.totalValue')}
          </Text>
          <Text className="text-h2 font-bold text-white mb-3">
            {portfolioValue}
          </Text>
          <View className="flex flex-row gap-2">
            <Badge
              label={`${dayReturn} (${dayReturnPercent})`}
              variant="success"
            />
          </View>
        </View>
      </View>

      {/* Content */}
      <View className="px-lg py-lg gap-lg">
        {/* Quick Stats */}
        <View className="gap-md">
          <Text className="text-h5 font-bold text-gray-900">
            {t('portfolio.overview')}
          </Text>
          <View className="flex flex-row gap-md">
            <Card variant="default" style={{ flex: 1 }}>
              <View className="items-center">
                <Text className="text-caption text-gray-600 mb-2">
                  {t('portfolio.invested')}
                </Text>
                <Text className="text-h6 font-bold text-gray-900">$20,000</Text>
              </View>
            </Card>
            <Card variant="default" style={{ flex: 1 }}>
              <View className="items-center">
                <Text className="text-caption text-gray-600 mb-2">
                  {t('portfolio.return')}
                </Text>
                <Text className="text-h6 font-bold text-success-600">+25%</Text>
              </View>
            </Card>
          </View>
        </View>

        {/* Recent Recommendations */}
        <View className="gap-md">
          <View className="flex flex-row justify-between items-center">
            <Text className="text-h5 font-bold text-gray-900">
              {t('portfolio.recommendations')}
            </Text>
            <Text className="text-label text-primary-500 font-semibold">
              {t('portfolio.viewAll')}
            </Text>
          </View>

          <Card variant="bordered">
            <View className="flex flex-row items-center justify-between mb-3">
              <View>
                <Text className="text-label font-semibold text-gray-900">
                  Tech Growth Fund
                </Text>
                <Text className="text-caption text-gray-600">
                  Recommended for you
                </Text>
              </View>
              <Badge label="Strong Buy" variant="success" size="sm" />
            </View>
            <View className="flex flex-row justify-between items-center">
              <Text className="text-h6 font-bold text-gray-900">+8.5%</Text>
              <Text className="text-label text-primary-500 font-semibold">
                {t('portfolio.invest')}
              </Text>
            </View>
          </Card>

          <Card variant="bordered">
            <View className="flex flex-row items-center justify-between mb-3">
              <View>
                <Text className="text-label font-semibold text-gray-900">
                  Dividend Income
                </Text>
                <Text className="text-caption text-gray-600">
                  Moderate return
                </Text>
              </View>
              <Badge label="Buy" variant="warning" size="sm" />
            </View>
            <View className="flex flex-row justify-between items-center">
              <Text className="text-h6 font-bold text-gray-900">+4.2%</Text>
              <Text className="text-label text-primary-500 font-semibold">
                {t('portfolio.invest')}
              </Text>
            </View>
          </Card>
        </View>

        {/* Action Buttons */}
        <View className="gap-md pt-md">
          <Button
            title={t('portfolio.addFunds')}
            onPress={() => {}}
            variant="primary"
            size="lg"
          />
          <Button
            title={t('portfolio.viewPortfolio')}
            onPress={() => {}}
            variant="outline"
            size="lg"
          />
        </View>
      </View>
    </ScrollView>
  );
};
