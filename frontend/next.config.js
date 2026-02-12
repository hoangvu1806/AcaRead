/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        // Use environment variable or default to localhost for development
        const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
        
        return [
            // Only proxy /api/v1/* to backend
            // Do NOT proxy /api/auth/* - that's handled by NextAuth
            {
                source: "/api/v1/:path*",
                destination: `${backendUrl}/api/v1/:path*`,
            },
        ];
    },
};

export default nextConfig;
