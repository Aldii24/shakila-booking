/* global process */
/** @type {import("next").NextConfig} */
const nextConfig = {env:{NEXT_PUBLIC_APP_MODE:process.env.APP_MODE,NEXT_PUBLIC_TURNSTILE_MODE:process.env.TURNSTILE_MODE}};

export default nextConfig;
