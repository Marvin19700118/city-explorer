
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  // Prevent webpack from bundling genkit/handlebars (they use require.extensions)
  serverExternalPackages: ['genkit', '@genkit-ai/core', '@genkit-ai/googleai', 'dotprompt', 'handlebars'],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
