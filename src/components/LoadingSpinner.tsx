import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { Loader2 } from 'lucide-react-native';

export const LoadingSpinner = ({className}: { className?: string }) => {
  const rotationValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rotationValue, {
        toValue: 100,
        duration: 1000,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [rotationValue]);

  const rotation = rotationValue.interpolate({
    inputRange: [0, 100],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View className={className} style={{ transform: [{ rotate: rotation }], width: 32, height: 32 }}>
      <Loader2 color={'#C7B2F5'} size={32} />
    </Animated.View>
  );
};
