-- Seed job board articles for the Job Board category
-- These are curated job postings to help students learn to read job posting language

-- Insert job posting articles
INSERT INTO content (
  id, slug, title, description, content_type, thumbnail_url,
  article_embed_url, article_source_name, reading_time_minutes,
  published_at, is_published
) VALUES
  (gen_random_uuid(), 'wellcome-senior-research-manager-vaccines',
   'Senior Research Manager, Vaccines',
   'Lead vaccine research initiatives at Wellcome Trust in London.',
   'article', '/images/article-placeholder.svg',
   'https://wellcome.wd3.myworkdayjobs.com/en-US/Wellcome/job/London/Senior-Research-Manager--Vaccines_R-003046',
   'Workday', 5, NOW(), true),

  (gen_random_uuid(), 'coefficient-giving-role',
   'Role at Coefficient Giving',
   'Join Coefficient Giving and make an impact in effective giving.',
   'article', '/images/article-placeholder.svg',
   'https://jobs.ashbyhq.com/coefficientgiving/c78f98bb-75f8-46f8-8ace-56c01ef4eb44',
   'Ashby', 5, NOW(), true),

  (gen_random_uuid(), 'rand-ai-biosecurity-research-resident',
   'AI & Biosecurity Research Resident',
   'Research role at RAND Corporation exploring AI and biosecurity.',
   'article', '/images/article-placeholder.svg',
   'https://rand.wd5.myworkdayjobs.com/en-US/External_Career_Site/job/San-Francisco-CA/AI---Biosecurity-Research-Resident_R3446',
   'Workday', 5, NOW(), true);

-- Link to job-board category
INSERT INTO content_categories (content_id, category_id)
SELECT c.id, cat.id FROM content c CROSS JOIN categories cat
WHERE c.slug IN ('wellcome-senior-research-manager-vaccines', 'coefficient-giving-role', 'rand-ai-biosecurity-research-resident')
AND cat.slug = 'job-board';
