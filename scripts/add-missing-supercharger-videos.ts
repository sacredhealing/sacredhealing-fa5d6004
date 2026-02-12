/**
 * Script to add missing video URLs to Supercharger course lessons
 * 
 * Usage:
 * 1. Update the VIDEO_URLS object below with the actual video URLs
 * 2. Run: npx tsx scripts/add-missing-supercharger-videos.ts
 * 
 * Or run via Supabase CLI:
 * supabase db execute --file supabase/migrations/20260212135626_add_missing_supercharger_videos.sql
 */

import { createClient } from '@supabase/supabase-js';

// TODO: Replace these with actual video URLs
const VIDEO_URLS = {
  'Kriya Meditation': 'REPLACE_WITH_KRIYA_MEDITATION_VIDEO_URL', // Lesson 4
  // Add the second missing lesson title and URL here
  // 'Lesson Title': 'REPLACE_WITH_VIDEO_URL',
};

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

async function addMissingVideos() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Find the Supercharger course
  const { data: courses, error: courseError } = await supabase
    .from('courses')
    .select('id, title')
    .or('title.ilike.%Supercharger%,title.ilike.%supercharger%')
    .limit(1);

  if (courseError || !courses || courses.length === 0) {
    console.error('Course not found:', courseError);
    process.exit(1);
  }

  const course = courses[0];
  console.log(`Found course: ${course.title} (${course.id})`);

  // Find all lessons for this course that are missing video URLs
  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('id, title, content_url, order_index, content_type')
    .eq('course_id', course.id)
    .eq('content_type', 'video')
    .order('order_index');

  if (lessonsError) {
    console.error('Error fetching lessons:', lessonsError);
    process.exit(1);
  }

  console.log('\nLessons found:');
  lessons?.forEach((lesson) => {
    const hasVideo = lesson.content_url && lesson.content_url.trim() !== '';
    console.log(
      `  ${lesson.order_index + 1}. ${lesson.title} - ${hasVideo ? '✓ Has video' : '✗ MISSING VIDEO'}`
    );
  });

  // Find missing videos
  const missingLessons = lessons?.filter(
    (lesson) =>
      !lesson.content_url ||
      lesson.content_url.trim() === '' ||
      lesson.content_url === 'Content Coming Soon'
  );

  if (!missingLessons || missingLessons.length === 0) {
    console.log('\n✓ All lessons have video URLs!');
    return;
  }

  console.log(`\nFound ${missingLessons.length} missing video(s):`);
  missingLessons.forEach((lesson) => {
    console.log(`  - ${lesson.title} (order: ${lesson.order_index + 1})`);
  });

  // Update missing lessons
  console.log('\nUpdating missing videos...');
  for (const lesson of missingLessons) {
    const videoUrl = VIDEO_URLS[lesson.title as keyof typeof VIDEO_URLS];

    if (!videoUrl || videoUrl.includes('REPLACE_WITH')) {
      console.log(`  ⚠ Skipping "${lesson.title}" - no URL provided in VIDEO_URLS`);
      continue;
    }

    const { error: updateError } = await supabase
      .from('lessons')
      .update({ content_url: videoUrl })
      .eq('id', lesson.id);

    if (updateError) {
      console.error(`  ✗ Error updating "${lesson.title}":`, updateError);
    } else {
      console.log(`  ✓ Updated "${lesson.title}" with video URL`);
    }
  }

  console.log('\nDone!');
}

addMissingVideos().catch(console.error);
