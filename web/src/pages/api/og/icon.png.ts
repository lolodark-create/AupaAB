// AUPA AB app icon — 1024×1024 PNG. Used for the Facebook Dev app icon
// (requires 512-1024 PNG). Just our brand mark scaled up.
import type { APIRoute } from 'astro';
import { ImageResponse } from '@vercel/og';

export const prerender = false;

export const GET: APIRoute = () => {
  const card = {
    type: 'div',
    props: {
      style: {
        width: '1024px',
        height: '1024px',
        background: '#B3DCFA',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0px',
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              fontFamily: 'serif',
              fontSize: '380px',
              fontWeight: 900,
              color: '#0B2545', // navy on ciel = ~9:1 AAA contrast
              letterSpacing: '-18px',
              lineHeight: 0.85,
            },
            children: 'AUPA',
          },
        },
        {
          type: 'div',
          props: {
            style: {
              fontFamily: 'serif',
              fontSize: '380px',
              fontWeight: 900,
              color: '#0B2545',
              letterSpacing: '-18px',
              lineHeight: 0.85,
              marginTop: '40px',
            },
            children: 'AB',
          },
        },
      ],
    },
  };
  return new ImageResponse(card as never, {
    width: 1024,
    height: 1024,
    headers: { 'cache-control': 'public, max-age=31536000, immutable' },
  });
};
