import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    ScrollView,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { dashboardApi } from '../api';

// ─── Iconos SVG exactos del wireframe (18×18, viewBox 0 0 24 24) ─────────────

function IconBoe() {
    return (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path d="M4 5h16v14H4z" stroke="#E2483D" strokeWidth={1.6} />
            <Path d="M8 9h8M8 13h6" stroke="#E2483D" strokeWidth={1.6} strokeLinecap="round" />
        </Svg>
    );
}

function IconFatigue() {
    return (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path d="M20 12a8 8 0 1 1-8-8M12 7v5l3 2" stroke="#2D6FB0" strokeWidth={1.6} strokeLinecap="round" />
        </Svg>
    );
}

function IconStreak() {
    return (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path
                d="M12 3c1 3-1 4-1 6a3 3 0 0 0 6 0 9 9 0 1 1-11 5c0-4 3-7 6-11z"
                fill="#FF6B4A"
            />
        </Svg>
    );
}

function IconSocial() {
    return (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Circle cx={9} cy={8} r={3} stroke="#7B4BC4" strokeWidth={1.6} />
            <Path
                d="M3 19a6 6 0 0 1 12 0M16 7a3 3 0 0 1 0 6M21 19a5 5 0 0 0-3-4.5"
                stroke="#7B4BC4"
                strokeWidth={1.5}
                strokeLinecap="round"
            />
        </Svg>
    );
}

function IconCheck() {
    return (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path d="M5 13l4 4L19 7" stroke="#2BB673" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

// ─── Icono + color por clave (item.icon del backend) ─────────────────────────
const ICONS = {
    boe: { icon: <IconBoe />, bg: '#FDEBE9' },
    fatigue: { icon: <IconFatigue />, bg: '#EAF3FB' },
    streak: { icon: <IconStreak />, bg: '#FFF1EC' },
    social: { icon: <IconSocial />, bg: '#F1ECFA' },
    goal: { icon: <IconCheck />, bg: '#EAF7F1' },
};
const DEFAULT_ICON = { icon: <IconBoe />, bg: '#EEF1F7' };

const TABS = [
    { key: 'all', label: 'Todas' },
    { key: 'boe', label: 'BOE' },
    { key: 'social', label: 'Social' },
];

function formatRelativeTime(isoDate) {
    const diffMin = Math.floor((Date.now() - new Date(isoDate).getTime()) / 60000);
    if (diffMin < 1) return 'Ahora mismo';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `Hace ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return new Date(isoDate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
}

// ─── Fila de notificación ─────────────────────────────────────────────────────
function NotificationRow({ item, isLast }) {
    const visuals = ICONS[item.icon] || DEFAULT_ICON;
    return (
        <View style={[styles.notif, isLast && styles.notifLast]}>
            <View style={[styles.notifIcon, { backgroundColor: visuals.bg }]}>{visuals.icon}</View>
            <View style={{ flex: 1 }}>
                <Text style={styles.notifTitle}>{item.title}</Text>
                <Text style={styles.notifSubtitle}>{item.body}</Text>
                <Text style={styles.notifTime}>{formatRelativeTime(item.createdAt)}</Text>
            </View>
        </View>
    );
}

// ─── Pantalla principal (2.3) ────────────────────────────────────────────────
export default function NotificationsScreen({ navigation }) {
    const [activeTab, setActiveTab] = useState('all');
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        let cancelled = false;
        const category = activeTab === 'all' ? undefined : activeTab;
        dashboardApi.listNotifications({ category }).then(({ data }) => {
            if (!cancelled && data) setNotifications(data.items);
        });
        return () => { cancelled = true; };
    }, [activeTab]);

    const handleMarkAllRead = () => {
        dashboardApi.markAllNotificationsRead();
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Status bar */}
            <View style={styles.statusBar}>
                <Text style={styles.statusBarTime}>9:41</Text>
            </View>

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.back}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Notificaciones</Text>
                <TouchableOpacity style={{ marginLeft: 'auto' }} onPress={handleMarkAllRead}>
                    <Text style={styles.markRead}>Marcar leídas</Text>
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                {TABS.map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                        onPress={() => setActiveTab(tab.key)}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Lista */}
            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                {notifications.length === 0 ? (
                    <Text style={styles.empty}>No tienes notificaciones.</Text>
                ) : (
                    notifications.map((item, i) => (
                        <NotificationRow key={item.id} item={item} isLast={i === notifications.length - 1} />
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },

    statusBar: {
        height: 30,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        flexShrink: 0,
    },
    statusBarTime: {
        fontSize: 10,
        fontWeight: '700',
        color: '#1B2A4A',
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    back: {
        color: '#FF6B4A',
        fontWeight: '700',
        fontSize: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F1B33',
        letterSpacing: -0.4,
    },
    markRead: {
        color: '#FF6B4A',
        fontWeight: '700',
        fontSize: 11,
    },

    tabs: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 12,
    },
    tab: {
        backgroundColor: '#F0F2F7',
        borderRadius: 16,
        paddingVertical: 6,
        paddingHorizontal: 12,
    },
    tabActive: {
        backgroundColor: '#1B2A4A',
    },
    tabText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#7A8290',
    },
    tabTextActive: {
        color: '#FFFFFF',
    },

    scroll: {
        flex: 1,
        paddingHorizontal: 16,
    },
    empty: {
        textAlign: 'center',
        color: '#8A92A0',
        fontSize: 12.5,
        marginTop: 40,
    },

    notif: {
        flexDirection: 'row',
        gap: 11,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F2F7',
    },
    notifLast: {
        borderBottomWidth: 0,
    },
    notifIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    notifTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1B2A4A',
    },
    notifSubtitle: {
        fontSize: 11,
        color: '#7A8290',
        marginTop: 1,
    },
    notifTime: {
        fontSize: 9.5,
        color: '#AEB5C2',
        marginTop: 3,
    },
});
