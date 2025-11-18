import React, {useEffect} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Alert} from 'react-native';
import * as KakaoLogin from '@react-native-seoul/kakao-login';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

/* 네이버 API 기본 정보 */
const NAVER_CLIENT_ID = 'dxclVS6at59zMGoRJmjS';
const NAVER_CLIENT_SECRET = 'aQy2kqGyIP';
const NAVER_REDIRECT_URI = AuthSession.makeRedirectUri({scheme: 'traveline'});

const NAVER_DISCOVERY = {
    authorizationEndpoint: 'https://nid.naver.com/oauth2.0/authorize',
    tokenEndpoint: 'https://nid.naver.com/oauth2.0/token',
};

/*Google Client ID */
const GOOGLE_CLIENT_ID = '790302680991-egrftjtn3qv35ni5bdrlsep0b2ntbraq.apps.googleusercontent.com';

export default function LoginScreen() {
    /*Google 로그인 훅 */
    const [googleRequest, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
        iosClientId: GOOGLE_CLIENT_ID,
    });

    /*네이버 로그인 훅 */
    const [naverRequest, naverResponse, promptNaverAsync] = AuthSession.useAuthRequest(
        {
            clientId: NAVER_CLIENT_ID,
            clientSecret: NAVER_CLIENT_SECRET,
            redirectUri: NAVER_REDIRECT_URI,
            scopes: [],
            responseType: AuthSession.ResponseType.Code,
            extraParams: {auth_type: 'reprompt'},
        },
        NAVER_DISCOVERY
    );

    useEffect(() => {
        if (googleResponse?.type === 'success') {
            const {authentication} = googleResponse;
            Alert.alert('Google 로그인 성공', 'AccessToken이 발급되었습니다!');
        } else if (googleResponse?.type === 'error') {
            console.error(' Google 로그인 오류:', googleResponse.error);
            Alert.alert('Google 로그인 실패', '로그인 중 오류가 발생했습니다.');
        }
    }, [googleResponse]);

    useEffect(() => {
        if (naverResponse?.type === 'success') {
            const {code} = naverResponse.params;

            (async () => {
                try {
                    const tokenResponse = await fetch(
                        `${NAVER_DISCOVERY.tokenEndpoint}?grant_type=authorization_code&client_id=${NAVER_CLIENT_ID}&client_secret=${NAVER_CLIENT_SECRET}&code=${code}&state=RANDOM_STATE_STRING`
                    );
                    const tokenData = await tokenResponse.json();
                    if (tokenData.access_token) {
                        Alert.alert('네이버 로그인 성공', 'AccessToken이 발급되었습니다!');
                    } else {
                        Alert.alert('네이버 로그인 실패', '토큰을 가져오지 못했습니다.');
                    }
                } catch (error) {
                    console.error('네이버 토큰 교환 오류:', error);
                    Alert.alert('에러', '네이버 로그인 중 오류가 발생했습니다.');
                }
            })();
        } else if (naverResponse?.type === 'error') {
            console.error('네이버 로그인 오류:', naverResponse.error);
            Alert.alert('에러', '네이버 로그인 중 오류가 발생했습니다.');
        }
    }, [naverResponse]);

    const handleKakaoLogin = async () => {
        try {
            const token = await KakaoLogin.login();
            Alert.alert('카카오 로그인 성공', 'AccessToken이 발급되었습니다!');
        } catch (error) {
            console.error('카카오 로그인 오류:', error);
            Alert.alert('에러', '카카오 로그인 중 오류가 발생했습니다.');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Traveline</Text>
            <Text style={styles.subtitle}>3초만에 빠른 회원가입 ⚡</Text>

            <TouchableOpacity
                style={[styles.button, styles.google]}
                onPress={() => promptGoogleAsync()}
                disabled={!googleRequest}
            >
                <Text style={styles.buttonText}>구글로 시작하기</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.kakao]} onPress={handleKakaoLogin}>
                <Text style={styles.buttonText}>카카오로 시작하기</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.button, styles.naver]}
                onPress={() => promptNaverAsync()}
                disabled={!naverRequest}
            >
                <Text style={styles.buttonText}>네이버로 시작하기</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.guest]}>
                <Text style={styles.buttonText}>게스트로 시작하기</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 40,
        fontWeight: 'bold',
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 14,
        color: '#555',
        marginBottom: 50,
    },
    button: {
        width: '100%',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 12,
    },
    google: {
        borderWidth: 1,
        borderColor: '#ccc',
        backgroundColor: '#fff',
    },
    kakao: {
        backgroundColor: '#FEE500',
    },
    naver: {
        backgroundColor: '#03C75A',
    },
    guest: {
        borderWidth: 1,
        borderColor: '#ccc',
        backgroundColor: '#fff',
        marginTop: 10,
    },
    buttonText: {
        fontWeight: '600',
    },
});
