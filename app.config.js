module.exports = {
  expo: {
    name: "WATHO",
    slug: "watho",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "healthmonitor",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    },
    ios: {
      supportsTablet: true,
      config: {
        googleMapsApiKey: ""
      }
    },
    android: {
      config: {
        googleMaps: {
          apiKey: ""
        }
      },
      permissions: [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION"
      ]
    },
    web: {
      bundler: "metro",
      output: "single"
    },
    plugins: [
      "expo-router",
      "expo-font",
      "expo-web-browser",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "Allow $(PRODUCT_NAME) to use your location to provide personalized health alerts for your area."
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    }
  }
};
