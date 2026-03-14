import React, { useState, useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Bell } from 'lucide-react-native';
import { Text } from '@/components';
import { useAuth } from '@/context/AuthContext';
import { NotificationsBottomSheet } from '@/screens/home/components/NotificationsBottomSheet';

export const ProfileHeader: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { user, refreshUser } = useAuth();
    const isRTL = i18n.language === 'ar';
    const [showNotifications, setShowNotifications] = useState(false);

    // Fetch user data when component mounts (only once, not on every render)
    useEffect(() => {
        let mounted = true;
        const loadUser = async () => {
            try {
                await refreshUser();
            } catch (error) {
                if (__DEV__) console.warn('Error refreshing user in ProfileHeader:', error);
            }
        };
        
        if (mounted) {
            loadUser();
        }
        
        return () => {
            mounted = false;
        };
    }, []); // Empty dependency array - only run once on mount

    // Get user name or fallback
    const userName = user?.fullName || user?.phoneNumber || '';

    return (
        <>
            <View className={`flex-row ${isRTL ? 'flex-row-reverse' : 'flex-row'} items-center justify-between px-5 pt-3 pb-4`} style={{ width: '100%' }}>
                <View className={`flex-1 ${isRTL ? 'items-end' : 'items-start'}`} style={{ flexShrink: 1 }}>
                    <Text className="text-h3 font-bold text-gray-900" numberOfLines={1} ellipsizeMode="tail">
                        {userName ? `${t('home.greeting')} ${userName}` : t('home.greeting')}
                    </Text>
                    <Text className="text-body text-gray-900" numberOfLines={1} ellipsizeMode="tail">
                        {t('home.subgreeting')}
                    </Text>
                </View>

                <Pressable
                    onPress={() => {
                        console.log('🔔 Notification bell pressed');
                        setShowNotifications(true);
                    }}
                    className="items-center justify-center"
                    style={{ 
                        width: 40, 
                        height: 40, 
                        marginLeft: isRTL ? 0 : 12,
                        marginRight: isRTL ? 12 : 0,
                        flexShrink: 0
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Bell size={24} color="rgba(145, 104, 228, 1)" />
                </Pressable>
            </View>
            {/* Notifications Bottom Sheet */}
            <NotificationsBottomSheet
                visible={showNotifications}
                onClose={() => setShowNotifications(false)}
            />
        </>
    );
};