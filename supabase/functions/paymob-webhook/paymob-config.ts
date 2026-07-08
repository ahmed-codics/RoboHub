// Paymob Configuration - Duplicated to avoid bundling issues with shared modules when Docker is absent
export const PAYMOB_CONFIG = {
    // Your Paymob API Key
    API_KEY: "ZXlKaGJHY2lPaUpJVXpVeE1pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SmpiR0Z6Y3lJNklrMWxjbU5vWVc1MElpd2ljSEp2Wm1sc1pWOXdheUk2TVRBNE1UWTNNU3dpYm1GdFpTSTZJbWx1YVhScFlXd2lmUS5Uc2ppVVktUDF0UmV6b3k3YVJDVUFFek9nZEFVWTlLOE85MHd4ZUxUUERNVU5UWGI1eU10cm5NelhxT3FlalhkdmlDeHNoN1lMSFJ0VHN6ZjJYeXc1dw==",

    // Integration ID for card payments
    INTEGRATION_ID: "5699848",

    // iFrame ID for payment UI
    IFRAME_ID: "39775",

    // HMAC secret for webhook verification
    HMAC_SECRET: "49A78E8931ECDEBDFF0AF6D3C04E4A24",

    // Paymob API endpoints
    BASE_URL: "https://accept.paymob.com/api",

    // Platform fee percentage (e.g., 10 = 10%)
    PLATFORM_FEE_PERCENTAGE: 10,
};
