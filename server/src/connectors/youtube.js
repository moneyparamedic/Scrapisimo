import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import pLimit from 'p-limit';
import { config } from '../config.js';
import { stripHtml, normalizeForDedupe } from '../utils/sanitize.js';

const API_BASE = 'https://www.googleapis.com/youtube/v3';

export async function fetchYouTubeComments({ q, since, until, maxItemsPerPlatform = 500, maxVideos = 25 }) {
  if (!config.youtubeKey) {
    return [];
  }

  const searchRes = await axios.get(`${API_BASE}/search`, {
    params: {
      part: 'id',
      type: 'video',
      q,
      maxResults: Math.min(maxVideos, 50),
      publishedAfter: since.toISOString(),
      publishedBefore: until.toISOString(),
      key: config.youtubeKey
    }
  });
  const videoIds = searchRes.data.items.map((i) => i.id.videoId).filter(Boolean);
  const limit = pLimit(3);
  const items = [];

  await Promise.all(videoIds.map((id) => limit(async () => {
    if (items.length >= maxItemsPerPlatform) return;
    const remaining = maxItemsPerPlatform - items.length;
    const comments = await fetchCommentsForVideo(id, since, until, remaining);
    items.push(...comments);
  })));

  return items.slice(0, maxItemsPerPlatform);
}

async function fetchCommentsForVideo(videoId, since, until, maxComments) {
  let pageToken;
  const out = [];
  do {
    const res = await axios.get(`${API_BASE}/commentThreads`, {
      params: {
        part: 'snippet,replies',
        videoId,
        maxResults: 100,
        pageToken,
        key: config.youtubeKey
      }
    });

    for (const thread of res.data.items) {
      const top = thread.snippet.topLevelComment;
      const c = normalizeComment(top, videoId, null);
      if (within(c.createdAt, since, until)) out.push(c);
      if (thread.replies && thread.replies.comments) {
        for (const reply of thread.replies.comments) {
          const rc = normalizeComment(reply, videoId, top.id);
          if (within(rc.createdAt, since, until)) out.push(rc);
        }
      }
      if (out.length >= maxComments) break;
    }
    pageToken = res.data.nextPageToken;
  } while (pageToken && out.length < maxComments);
  return out;
}

function normalizeComment(c, videoId, parentId) {
  const sn = c.snippet;
  return {
    id: uuidv4(),
    platform: 'youtube',
    postId: videoId,
    commentId: c.id,
    author: sn.authorDisplayName,
    text: stripHtml(sn.textDisplay || ''),
    likeCount: sn.likeCount || 0,
    replyTo: parentId,
    createdAt: sn.publishedAt,
    permalink: `https://www.youtube.com/watch?v=${videoId}&lc=${c.id}`,
    _norm: normalizeForDedupe(sn.textDisplay || '')
  };
}

function within(dateStr, since, until) {
  const d = new Date(dateStr);
  return (!since || d >= since) && (!until || d <= until);
}
