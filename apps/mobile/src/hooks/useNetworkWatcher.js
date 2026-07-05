import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { navigate, getCurrentRouteName } from '../navigation/navigationRef';

// Pantallas donde no tiene sentido interrumpir con el aviso de sin conexión
const IGNORED_ROUTES = ['SplashNoConnection', 'SplashUpdate', 'Splash'];

export default function useNetworkWatcher() {
    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state) => {
            const isConnected = state.isConnected && state.isInternetReachable !== false;
            if (isConnected) return;

            const currentRoute = getCurrentRouteName();
            if (IGNORED_ROUTES.includes(currentRoute)) return;

            navigate('SplashNoConnection');
        });

        return unsubscribe;
    }, []);
}
