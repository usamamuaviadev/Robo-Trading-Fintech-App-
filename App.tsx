
import { Platform, useColorScheme, View, StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import './global.css';
import './src/i18n';
import { RootNavigator } from './src/navigation';
import { useEffect, useState } from 'react';

useEffect

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    Platform.OS === 'ios' ?
    <SafeAreaProvider>
       <SafeAreaView style={{flex: 1, backgroundColor: 'transparent', }} className='font-arabic'>
      
      <RootNavigator />
      </SafeAreaView> 
    </SafeAreaProvider>:
    <View style={{flex: 1, backgroundColor: 'white',paddingBottom:Platform.OS === 'android' ? 25 : 0 }} className='font-arabic'>
      <StatusBar  barStyle="dark-content" />
      <RootNavigator />
    </View>
  );
}

export default App;