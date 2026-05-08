-- Seed content for testing
-- Includes: 2 videos, 2 articles (1 original, 1 embedded), 2 playbooks

-- Get category IDs for reference
DO $$
DECLARE
  cat_emerging UUID;
  cat_day_in_life UUID;
  cat_life_skills UUID;
  cat_mindsets UUID;
  cat_how_i_got_here UUID;
  cat_problems UUID;
BEGIN
  SELECT id INTO cat_emerging FROM categories WHERE slug = 'emerging-careers';
  SELECT id INTO cat_day_in_life FROM categories WHERE slug = 'day-in-the-life';
  SELECT id INTO cat_life_skills FROM categories WHERE slug = 'life-skills';
  SELECT id INTO cat_mindsets FROM categories WHERE slug = 'mindsets';
  SELECT id INTO cat_how_i_got_here FROM categories WHERE slug = 'how-i-got-here';
  SELECT id INTO cat_problems FROM categories WHERE slug = 'problems-to-solve';

  -- Video 1: Horizontal orientation
  INSERT INTO content (
    id, slug, title, description, content_type, thumbnail_url,
    video_url, video_orientation, video_duration,
    published_at, is_published
  ) VALUES (
    'video-ai-engineer-day',
    'ai-engineer-day-in-life',
    'A Day in the Life of an AI Engineer',
    'Follow Sarah as she walks through her typical day working on machine learning models at a tech startup.',
    'video',
    'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'horizontal',
    324,
    NOW() - INTERVAL '2 days',
    true
  );

  -- Video 2: Vertical orientation (with related playbook)
  INSERT INTO content (
    id, slug, title, description, content_type, thumbnail_url,
    video_url, video_orientation, video_duration,
    published_at, is_published, related_playbook_id
  ) VALUES (
    'video-interview-tips',
    'interview-tips-quick-guide',
    '5 Interview Tips That Got Me Hired',
    'Quick tips from a hiring manager on what makes candidates stand out.',
    'video',
    'https://img.youtube.com/vi/abc123xyz/maxresdefault.jpg',
    'https://www.youtube.com/watch?v=abc123xyz',
    'vertical',
    90,
    NOW() - INTERVAL '5 days',
    true,
    'playbook-interview-prep'
  );

  -- Article 1: Original MDX content
  INSERT INTO content (
    id, slug, title, description, content_type, thumbnail_url,
    article_content, reading_time_minutes,
    published_at, is_published
  ) VALUES (
    'article-future-of-work',
    'future-of-work-2030',
    'The Future of Work: What Jobs Will Look Like in 2030',
    'Explore emerging career paths and the skills that will matter most in the next decade.',
    'article',
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e',
    E'# The Future of Work\n\nThe workplace is changing rapidly. Here''s what you need to know.\n\n## Emerging Technologies\n\nAI, automation, and remote work are reshaping every industry.\n\n## Skills That Matter\n\n- Critical thinking\n- Digital literacy\n- Emotional intelligence\n- Adaptability\n\n> **Tip:** Start building these skills now to stay ahead.',
    5,
    NOW() - INTERVAL '10 days',
    true
  );

  -- Article 2: Embedded/curated external article
  INSERT INTO content (
    id, slug, title, description, content_type, thumbnail_url,
    article_embed_url, article_source_name, reading_time_minutes,
    published_at, is_published
  ) VALUES (
    'article-green-careers',
    'green-careers-guide',
    'Green Careers: Jobs Fighting Climate Change',
    'A comprehensive guide to careers in sustainability and environmental protection.',
    'article',
    'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e',
    'https://www.bbc.com/worklife/article/green-careers',
    'BBC Worklife',
    8,
    NOW() - INTERVAL '3 days',
    true
  );

  -- Playbook 1: Interview prep (referenced by video-2)
  INSERT INTO content (
    id, slug, title, description, content_type, thumbnail_url,
    playbook_content, reading_time_minutes,
    published_at, is_published
  ) VALUES (
    'playbook-interview-prep',
    'interview-preparation-guide',
    'Interview Preparation Playbook',
    'A step-by-step guide to ace your next job interview.',
    'playbook',
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf',
    E'# Interview Preparation Guide\n\nThis playbook will help you prepare for and succeed in job interviews.\n\n## Before the Interview\n\n### Research the Company\n\nSpend at least 30 minutes learning about:\n- Company mission and values\n- Recent news and achievements\n- The role you''re applying for\n\n### Prepare Your Stories\n\nUse the STAR method:\n- **S**ituation: Set the scene\n- **T**ask: Describe your responsibility\n- **A**ction: Explain what you did\n- **R**esult: Share the outcome\n\n## During the Interview\n\n> **Tip:** Arrive 10-15 minutes early to settle your nerves.\n\n### Body Language\n\n- Maintain eye contact\n- Sit up straight\n- Smile and nod appropriately\n\n## After the Interview\n\nSend a thank-you email within 24 hours.',
    10,
    NOW() - INTERVAL '7 days',
    true
  );

  -- Playbook 2: Resume building
  INSERT INTO content (
    id, slug, title, description, content_type, thumbnail_url,
    playbook_content, reading_time_minutes,
    published_at, is_published
  ) VALUES (
    'playbook-resume-builder',
    'resume-building-guide',
    'Build a Resume That Gets Noticed',
    'Learn how to create a resume that stands out to employers.',
    'playbook',
    'https://images.unsplash.com/photo-1586281380349-632531db7ed4',
    E'# Resume Building Guide\n\nYour resume is your first impression. Make it count.\n\n## Essential Sections\n\n### Contact Information\n\nInclude:\n- Full name\n- Phone number\n- Professional email\n- LinkedIn profile (optional)\n\n### Education\n\nList your most recent education first.\n\n### Experience\n\nUse action verbs:\n- Led, Created, Developed, Improved, Managed\n\n> **Warning:** Never lie on your resume. Background checks are common.\n\n## Formatting Tips\n\n- Keep it to 1 page for students\n- Use consistent fonts and spacing\n- Save as PDF to preserve formatting',
    7,
    NOW() - INTERVAL '14 days',
    true
  );

  -- Link content to categories via junction table
  INSERT INTO content_categories (content_id, category_id) VALUES
    -- Video 1: AI Engineer Day
    ('video-ai-engineer-day', cat_day_in_life),
    ('video-ai-engineer-day', cat_emerging),
    -- Video 2: Interview Tips
    ('video-interview-tips', cat_life_skills),
    ('video-interview-tips', cat_how_i_got_here),
    -- Article 1: Future of Work
    ('article-future-of-work', cat_emerging),
    ('article-future-of-work', cat_problems),
    -- Article 2: Green Careers
    ('article-green-careers', cat_emerging),
    ('article-green-careers', cat_day_in_life),
    -- Playbook 1: Interview Prep
    ('playbook-interview-prep', cat_life_skills),
    -- Playbook 2: Resume Builder
    ('playbook-resume-builder', cat_life_skills);

END $$;
