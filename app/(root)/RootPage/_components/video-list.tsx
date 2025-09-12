import React from 'react';

import ReactPlayer from 'react-player';

interface Video {
  id: number;
  title: string;
  url: string;
  cite: string;
  cite_url: string;
}

const VIDEOS: Array<Video> = [
  {
    id: 1,
    title: 'Vintage Film',
    url: 'https://youtu.be/H7WUONmjghU',
    cite: 'Pono Grace',
    cite_url: 'https://www.ponograce.com/',
  },
  {
    id: 2,
    title: 'Super 8',
    url: 'https://youtu.be/_W77OgthovA',
    cite: 'Pono Grace',
    cite_url: 'https://www.ponograce.com/',
  },
  {
    id: 3,
    title: 'Teaser',
    url: 'https://youtu.be/I2JRM_pLzOY',
    cite: 'Pono Grace',
    cite_url: 'https://www.ponograce.com/',
  },
];

export default function VideoList() {
  return (
    <div className='my-sp0'>
      <div className='flex flex-col gap-sp2'>
        {VIDEOS.map((video) => (
          <ReactPlayer
            key={video.id}
            src={video.url}
            controls
            style={{ width: '100%', height: 'auto', aspectRatio: '16/9' }}
          />
        ))}
      </div>
    </div>
  );
}
