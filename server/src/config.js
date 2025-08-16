import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 4000,
  youtubeKey: process.env.YOUTUBE_API_KEY || '',
  xToken: process.env.X_BEARER_TOKEN || '',
  tiktokKey: process.env.TIKTOK_API_KEY || '',
  metaToken: process.env.META_ACCESS_TOKEN || ''
};
