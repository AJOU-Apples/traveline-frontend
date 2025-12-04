module.exports = {
    expo: {
        name: "traveline-frontend",
        slug: "traveline-frontend",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/icon.png",
        userInterfaceStyle: "light",
        newArchEnabled: true,
        experiments: {
            reactCanary: true
        },
        splash: {
            image: "./assets/splash-icon.png",
            resizeMode: "contain",
            backgroundColor: "#ffffff"
        },
        scheme: "traveline",
        plugins: [
            [
                "expo-media-library",
                {
                    photosPermission: "여행 사진을 장소에 추가하기 위해 사진 라이브러리 접근이 필요합니다.",
                    savePhotosPermission: "여행 사진을 저장하기 위해 사진 라이브러리 접근이 필요합니다.",
                    isAccessMediaLocationEnabled: true
                }
            ]
        ],
        ios: {
            supportsTablet: true,
            bundleIdentifier: "com.anonymous.travelinefrontend",
            config: {
                googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY
            },
            infoPlist: {
                NSPhotoLibraryUsageDescription: "여행 사진을 장소에 추가하기 위해 사진 라이브러리 접근이 필요합니다.",
                NSPhotoLibraryAddUsageDescription: "여행 사진을 저장하기 위해 사진 라이브러리 접근이 필요합니다."
            }
        },
        android: {
            adaptiveIcon: {
                foregroundImage: "./assets/adaptive-icon.png",
                backgroundColor: "#ffffff"
            },
            edgeToEdgeEnabled: true,
            predictiveBackGestureEnabled: false,
            package: "com.anonymous.travelinefrontend",
            permissions: [
                "READ_MEDIA_IMAGES",
                "READ_EXTERNAL_STORAGE",
                "ACCESS_MEDIA_LOCATION"
            ],
            config: {
                googleMaps: {
                    apiKey: process.env.GOOGLE_MAPS_API_KEY
                }
            }
        },
        web: {
            favicon: "./assets/favicon.png"
        },
        extra: {
            amadeus: {
                apiKey: process.env.AMADEUS_API_KEY,
                apiSecret: process.env.AMADEUS_API_SECRET
            }
        }
    }
};

