-- Seed Indeed.com career advice articles
-- These are curated external articles that open via iframe fallback (Indeed blocks embedding)

-- =====================================================
-- INDEED CAREER ADVICE ARTICLES (3 articles)
-- =====================================================

INSERT INTO content (id, slug, title, description, content_type, thumbnail_url, article_embed_url, article_source_name, reading_time_minutes, published_at, is_published)
VALUES
  -- Interview prep article
  (gen_random_uuid(), 'what-to-bring-to-an-interview', 'What to Bring to an Interview', 'Learn the essential items you should bring to every job interview to make a great impression and be prepared for anything.', 'article', '/images/article-placeholder.svg', 'https://ca.indeed.com/career-advice/interviewing/what-to-bring-to-an-interview', 'Indeed', 5, NOW() - INTERVAL '1 day', true),

  -- Logistics careers article
  (gen_random_uuid(), 'careers-in-logistics', 'Careers in Logistics', 'Explore the diverse career opportunities in the logistics industry, from supply chain management to warehouse operations.', 'article', '/images/article-placeholder.svg', 'https://ca.indeed.com/career-advice/finding-a-job/careers-in-logistics', 'Indeed', 6, NOW() - INTERVAL '2 days', true),

  -- Zoo jobs article
  (gen_random_uuid(), 'jobs-at-the-zoo', 'Jobs at the Zoo', 'Discover the variety of careers available at zoos, from animal care to education and conservation roles.', 'article', '/images/article-placeholder.svg', 'https://ca.indeed.com/career-advice/finding-a-job/jobs-at-the-zoo', 'Indeed', 5, NOW() - INTERVAL '3 days', true);

-- Link articles to appropriate categories
-- What to Bring to an Interview → Life Skills
INSERT INTO content_categories (content_id, category_id)
SELECT c.id, cat.id
FROM content c
CROSS JOIN categories cat
WHERE c.slug = 'what-to-bring-to-an-interview'
AND cat.slug = 'life-skills';

-- Careers in Logistics → Emerging Careers/Industries
INSERT INTO content_categories (content_id, category_id)
SELECT c.id, cat.id
FROM content c
CROSS JOIN categories cat
WHERE c.slug = 'careers-in-logistics'
AND cat.slug = 'emerging-careers';

-- Jobs at the Zoo → Day in the Life/On the Job
INSERT INTO content_categories (content_id, category_id)
SELECT c.id, cat.id
FROM content c
CROSS JOIN categories cat
WHERE c.slug = 'jobs-at-the-zoo'
AND cat.slug = 'day-in-the-life';
