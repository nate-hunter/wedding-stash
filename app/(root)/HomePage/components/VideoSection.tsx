'use client';

import React, { useState, useEffect } from 'react';
import { TabNavigation } from './TabNavigation';
import { VideoPlayer } from './VideoPlayer';
import { VideoCategory, Video } from '../types';
import { VIDEO_CATEGORIES, getVideoByCategory } from '../data/mock-data';

export function VideoSection() {
  const [activeCategory, setActiveCategory] = useState<VideoCategory>('vintage-film');
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(false);

  // Load videos when category changes
  useEffect(() => {
    setLoading(true);
    const video = getVideoByCategory(activeCategory);
    console.log('-> effect: ', { video });
    setCurrentVideo(video || null);
    setLoading(false);
  }, [activeCategory]);

  console.count('## VideoSection ##');
  console.log({ activeCategory });
  console.log({ currentVideo });

  return (
    <section className='flex flex-col gap-sp6 md:gap-sp7'>
      {/* Section Header */}
      <h2 className='hd-2'>Videos</h2>

      {/* Tab Navigation */}
      <TabNavigation
        categories={VIDEO_CATEGORIES}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {/* Video Player */}
      <VideoPlayer video={currentVideo} loading={loading} />
    </section>
  );
}
