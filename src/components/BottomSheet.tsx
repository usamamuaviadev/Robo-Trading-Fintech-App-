import React, { useEffect, useRef } from 'react';
import { View, Text, Modal, Pressable, ViewStyle, Animated, PanResponder, Dimensions, Easing } from 'react-native';

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  height?: number; // desired sheet height
  style?: ViewStyle;
  testID?: string;
  dismissThreshold?: number; // drag distance to dismiss
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  title,
  children,
  height = 300,
  style,
  testID,
  dismissThreshold = 120,
}) => {
  const screenHeight = Dimensions.get('window').height;
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const isClosingRef = useRef(false);
  const dragStartY = useRef(0);

  // Animate in when becoming visible
  useEffect(() => {
    if (visible) {
      isClosingRef.current = false;
      Animated.timing(translateY, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    } else {
      // Reset position off-screen for next open
      translateY.setValue(screenHeight);
    }
  }, [visible, translateY, screenHeight]);

  const closeSheet = (velocity?: number) => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    Animated.timing(translateY, {
      toValue: screenHeight,
      duration: 220,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      onClose();
      isClosingRef.current = false;
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 3,
      onPanResponderGrant: () => {
        dragStartY.current = 0;
      },
      onPanResponderMove: (_, gesture) => {
        // Only allow dragging downward; clamp at 0
        const dragY = Math.max(0, gesture.dy);
        dragStartY.current = dragY;
        translateY.setValue(dragY);
      },
      onPanResponderRelease: (_, gesture) => {
        const { dy, vy } = gesture;
        const shouldDismiss = dy > dismissThreshold || vy > 1.2;
        if (shouldDismiss) {
          closeSheet(vy);
        } else {
          Animated.timing(translateY, {
            toValue: 0,
            duration: 180,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Dark overlay opacity reduces as user drags sheet down
  const overlayOpacity = translateY.interpolate({
    inputRange: [0, screenHeight * 0.6, screenHeight],
    outputRange: [0.4, 0.2, 0],
    extrapolate: 'clamp',
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      testID={testID}
    >
      <View style={{ flex: 1 }}>
        {/* Overlay covers entire screen independent of sheet drag */}
        <Animated.View
          pointerEvents="auto"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'black',
            opacity: overlayOpacity,
          }}
        >
          <Pressable style={{ flex: 1 }} onPress={() => closeSheet()} />
        </Animated.View>

        {/* Animated Sheet anchored at bottom */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              transform: [{ translateY }],
              height,
            },
            style,
          ]}
          className="bg-white rounded-t-3xl overflow-hidden"
          {...panResponder.panHandlers}
        >
          {/* Handle */}
          <View className="items-center justify-center py-3">
            <View className="w-12 h-1 bg-neutral-300 rounded-full" />
          </View>
          {/* Header */}
          {title && (
            <View className="flex flex-row items-center justify-between px-5 py-4 border-b border-neutral-200">
              <Text className="text-h5 font-bold">{title}</Text>
              <Pressable onPress={() => closeSheet()}>
                <Text className="text-2xl font-bold text-neutral-400">×</Text>
              </Pressable>
            </View>
          )}
          {/* Content */}
          <View className="flex-1 px-5 pb-6">
            {children}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};
