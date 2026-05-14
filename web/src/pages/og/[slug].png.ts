// /og/[slug].png — per-article OG image endpoint.
//
// V1: returns a 302 redirect to the static default SVG. SVG is honoured by
// modern social crawlers (X, LinkedIn, Slack, Discord). Older platforms that
// require raster (Facebook in some cases) will fall back to no image, which
// degrades gracefully to the textual og:title + og:description.
//
// V2 hook-up plan (Cloudinary):
//   Replace the redirect with a 302 to a Cloudinary URL like:
//   `https://res.cloudinary.com/aupa-ab/image/upload/
//     w_1200,h_630,c_fill,b_rgb:0B2545/
//     l_text:Fraunces_72_bold:${encoded title},co_white,w_1000,c_fit,g_west,x_60,y_-40/
//     l_aupa_logo,w_80,o_60,g_north_west,x_60,y_40/
//     base_template.png`
//   That generates per-article hero images in real time.

import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = ({ redirect }) => {
  // TODO V2: build a Cloudinary URL from the article slug + title.
  return redirect('/og-default.svg', 302);
};
