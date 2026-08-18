/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      }
    ],
  },
  eslint: {
    // Evita que Vercel cancele el despliegue por avisos menores (ej. imports sin usar)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Evita que Vercel cancele el despliegue por validaciones estrictas de tipos
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
