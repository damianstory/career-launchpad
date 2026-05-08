-- Seed AdviceWithErin career shorts
-- Source: https://www.youtube.com/@AdviceWithErin/shorts (Popular sort)
-- All videos are vertical YouTube Shorts
-- Category: Day in the Life/On the Job

-- Insert video content
INSERT INTO content (id, slug, title, description, content_type, thumbnail_url, video_url, video_orientation, published_at, is_published)
VALUES
  -- 1. 15M views
  (gen_random_uuid(), 'sunshine-breaks-at-work', 'Petition for Sunshine Breaks at Work', 'A fun take on workplace wellness - why non-smokers deserve their own version of smoke breaks.', 'video', 'https://img.youtube.com/vi/wONT3tMI3SQ/maxresdefault.jpg', 'https://www.youtube.com/shorts/wONT3tMI3SQ', 'vertical', NOW() - INTERVAL '30 days', true),

  -- 2. 9.2M views
  (gen_random_uuid(), 'how-to-get-higher-salary', 'How To Get A Higher Salary 101', 'Essential tips for negotiating your salary during the job offer process.', 'video', 'https://img.youtube.com/vi/8_gzeOS8u0E/maxresdefault.jpg', 'https://www.youtube.com/shorts/8_gzeOS8u0E', 'vertical', NOW() - INTERVAL '29 days', true),

  -- 3. 9M views
  (gen_random_uuid(), 'responding-to-inappropriate-interview-questions', 'Responding to Inappropriate Interview Questions', 'How to professionally handle questions that cross the line during job interviews.', 'video', 'https://img.youtube.com/vi/WLi4ENHnqAY/maxresdefault.jpg', 'https://www.youtube.com/shorts/WLi4ENHnqAY', 'vertical', NOW() - INTERVAL '28 days', true),

  -- 4. 7.6M views
  (gen_random_uuid(), 'watch-out-for-ai-scams', 'Watch Out for AI Scams', 'Important warning about AI-powered scams targeting job seekers and how to protect yourself.', 'video', 'https://img.youtube.com/vi/H9SUuYX4xrY/maxresdefault.jpg', 'https://www.youtube.com/shorts/H9SUuYX4xrY', 'vertical', NOW() - INTERVAL '27 days', true),

  -- 5. 6.5M views
  (gen_random_uuid(), 'financial-independence-for-partners', 'Financial Independence for Stay-at-Home Partners', 'Why having your own financial safety net matters, even in committed relationships.', 'video', 'https://img.youtube.com/vi/YvyxSBGLNi4/maxresdefault.jpg', 'https://www.youtube.com/shorts/YvyxSBGLNi4', 'vertical', NOW() - INTERVAL '26 days', true),

  -- 6. 5M views
  (gen_random_uuid(), 'hidden-value-of-service-jobs', 'The Hidden Value of Service Jobs', 'Why service industry experience is more valuable on your resume than you might think.', 'video', 'https://img.youtube.com/vi/nMCKjqPCLJc/maxresdefault.jpg', 'https://www.youtube.com/shorts/nMCKjqPCLJc', 'vertical', NOW() - INTERVAL '25 days', true),

  -- 7. 4.4M views
  (gen_random_uuid(), 'power-of-compound-interest', 'The Power of Compound Interest', 'A classic fable that explains why starting to invest early makes such a big difference.', 'video', 'https://img.youtube.com/vi/kU5NH5XPtgQ/maxresdefault.jpg', 'https://www.youtube.com/shorts/kU5NH5XPtgQ', 'vertical', NOW() - INTERVAL '24 days', true),

  -- 8. 3.9M views
  (gen_random_uuid(), 'unlimited-pto-red-flag', 'When Unlimited PTO is a Red Flag', 'How to tell if a company''s unlimited vacation policy is genuine or a warning sign.', 'video', 'https://img.youtube.com/vi/40sgm2F4otM/maxresdefault.jpg', 'https://www.youtube.com/shorts/40sgm2F4otM', 'vertical', NOW() - INTERVAL '23 days', true),

  -- 9. 3.9M views
  (gen_random_uuid(), 'what-not-to-say-job-offer', 'What Not to Say When Receiving a Job Offer', 'One phrase you should never say when an employer extends a job offer.', 'video', 'https://img.youtube.com/vi/AL9SFlqtHCM/maxresdefault.jpg', 'https://www.youtube.com/shorts/AL9SFlqtHCM', 'vertical', NOW() - INTERVAL '22 days', true),

  -- 10. 3.8M views
  (gen_random_uuid(), 'always-accept-a-raise', 'Why You Should Always Accept a Raise', 'Debunking the myth that accepting a raise will hurt you at tax time.', 'video', 'https://img.youtube.com/vi/A2oepbABiVE/maxresdefault.jpg', 'https://www.youtube.com/shorts/A2oepbABiVE', 'vertical', NOW() - INTERVAL '21 days', true),

  -- 11. 3.7M views
  (gen_random_uuid(), 'star-method-interviews', 'How to Use the STAR Method in Interviews', 'Master this proven technique for answering behavioral interview questions effectively.', 'video', 'https://img.youtube.com/vi/Nc2jH5csQqk/maxresdefault.jpg', 'https://www.youtube.com/shorts/Nc2jH5csQqk', 'vertical', NOW() - INTERVAL '20 days', true),

  -- 12. 3.6M views
  (gen_random_uuid(), 'avoiding-workplace-drama', 'Avoiding Workplace Drama', 'How to spot and steer clear of coworkers who thrive on office drama.', 'video', 'https://img.youtube.com/vi/Rna4_yeJzEg/maxresdefault.jpg', 'https://www.youtube.com/shorts/Rna4_yeJzEg', 'vertical', NOW() - INTERVAL '19 days', true),

  -- 13. 3.6M views
  (gen_random_uuid(), 'dream-job-after-accepting-another', 'When Your Dream Job Comes After You Accepted Another', 'What to do when you get your dream offer right after accepting a different position.', 'video', 'https://img.youtube.com/vi/pdPArb8nWg8/maxresdefault.jpg', 'https://www.youtube.com/shorts/pdPArb8nWg8', 'vertical', NOW() - INTERVAL '18 days', true),

  -- 14. 3.4M views
  (gen_random_uuid(), 'setting-boundaries-people-pleaser', 'Setting Boundaries as a People Pleaser', 'Why people pleasers need to establish limits, and how to start doing it at work.', 'video', 'https://img.youtube.com/vi/uY44GJ8zYlk/maxresdefault.jpg', 'https://www.youtube.com/shorts/uY44GJ8zYlk', 'vertical', NOW() - INTERVAL '17 days', true),

  -- 15. 3.3M views
  (gen_random_uuid(), 'discussing-salary-with-coworkers', 'Can You Discuss Salary with Coworkers?', 'The truth about whether you can talk about pay with your colleagues at work.', 'video', 'https://img.youtube.com/vi/RsqkkNGWlD4/maxresdefault.jpg', 'https://www.youtube.com/shorts/RsqkkNGWlD4', 'vertical', NOW() - INTERVAL '16 days', true),

  -- 16. 3.3M views
  (gen_random_uuid(), 'how-to-brag-at-work', 'How to Brag at Work Without Sounding Rude', 'Techniques for promoting your accomplishments professionally without coming across as arrogant.', 'video', 'https://img.youtube.com/vi/SfvTSmDfwJQ/maxresdefault.jpg', 'https://www.youtube.com/shorts/SfvTSmDfwJQ', 'vertical', NOW() - INTERVAL '15 days', true),

  -- 17. 3.2M views
  (gen_random_uuid(), 'why-do-you-want-to-work-here', 'How to Answer Why Do You Want to Work Here', 'A clever trick for crafting a genuine answer to this common interview question.', 'video', 'https://img.youtube.com/vi/6HGPSI-0cK4/maxresdefault.jpg', 'https://www.youtube.com/shorts/6HGPSI-0cK4', 'vertical', NOW() - INTERVAL '14 days', true),

  -- 18. 3M views
  (gen_random_uuid(), 'subtle-art-of-small-talk', 'The Subtle Art of Small Talk', 'Tips for mastering casual conversation in professional settings.', 'video', 'https://img.youtube.com/vi/vTRFK7o0h_0/maxresdefault.jpg', 'https://www.youtube.com/shorts/vTRFK7o0h_0', 'vertical', NOW() - INTERVAL '13 days', true),

  -- 19. 2.8M views
  (gen_random_uuid(), 'impossible-interview-questions', 'Answering Impossible Interview Questions', 'How to handle tricky interview questions that seem designed to trip you up.', 'video', 'https://img.youtube.com/vi/9_a2lFaFIRo/maxresdefault.jpg', 'https://www.youtube.com/shorts/9_a2lFaFIRo', 'vertical', NOW() - INTERVAL '12 days', true),

  -- 20. 2.3M views
  (gen_random_uuid(), 'psychological-trick-winning-arguments', 'A Psychological Trick for Winning Arguments', 'A simple communication technique that helps you navigate disagreements more effectively.', 'video', 'https://img.youtube.com/vi/dWCviojs8jA/maxresdefault.jpg', 'https://www.youtube.com/shorts/dWCviojs8jA', 'vertical', NOW() - INTERVAL '11 days', true),

  -- 21. 2.2M views
  (gen_random_uuid(), 'recovering-from-toxic-boss', 'Recovering from a Toxic Boss', 'What it feels like to heal after leaving a difficult work environment.', 'video', 'https://img.youtube.com/vi/cFzP8CtyD3A/maxresdefault.jpg', 'https://www.youtube.com/shorts/cFzP8CtyD3A', 'vertical', NOW() - INTERVAL '10 days', true),

  -- 22. 2.2M views
  (gen_random_uuid(), 'secret-interview-etiquette-tips', 'Secret Interview Etiquette Tips', 'Cultural interview tips that most people don''t know about.', 'video', 'https://img.youtube.com/vi/bdz1dbpjlMk/maxresdefault.jpg', 'https://www.youtube.com/shorts/bdz1dbpjlMk', 'vertical', NOW() - INTERVAL '9 days', true),

  -- 23. 2.1M views
  (gen_random_uuid(), 'why-promotions-arent-always-good', 'Why Promotions Are Not Always a Good Thing', 'Sometimes saying no to a promotion is the smarter career move.', 'video', 'https://img.youtube.com/vi/Jvk_GqjWiEk/maxresdefault.jpg', 'https://www.youtube.com/shorts/Jvk_GqjWiEk', 'vertical', NOW() - INTERVAL '8 days', true),

  -- 24. 2.1M views
  (gen_random_uuid(), 'beware-remote-job-scams', 'Beware of Remote Job Scams', 'How to identify and avoid common scams targeting remote job seekers.', 'video', 'https://img.youtube.com/vi/bz9935kIkm0/maxresdefault.jpg', 'https://www.youtube.com/shorts/bz9935kIkm0', 'vertical', NOW() - INTERVAL '7 days', true),

  -- 25. 2.1M views
  (gen_random_uuid(), 'salary-negotiation-not-personal', 'Salary Negotiation Is Not Personal', 'Remember that asking for more money is a professional discussion, not a personal one.', 'video', 'https://img.youtube.com/vi/9w1FgoeJWic/maxresdefault.jpg', 'https://www.youtube.com/shorts/9w1FgoeJWic', 'vertical', NOW() - INTERVAL '6 days', true);

-- Link all videos to the day-in-the-life category
INSERT INTO content_categories (content_id, category_id)
SELECT c.id, cat.id
FROM content c
CROSS JOIN categories cat
WHERE c.slug IN (
  'sunshine-breaks-at-work',
  'how-to-get-higher-salary',
  'responding-to-inappropriate-interview-questions',
  'watch-out-for-ai-scams',
  'financial-independence-for-partners',
  'hidden-value-of-service-jobs',
  'power-of-compound-interest',
  'unlimited-pto-red-flag',
  'what-not-to-say-job-offer',
  'always-accept-a-raise',
  'star-method-interviews',
  'avoiding-workplace-drama',
  'dream-job-after-accepting-another',
  'setting-boundaries-people-pleaser',
  'discussing-salary-with-coworkers',
  'how-to-brag-at-work',
  'why-do-you-want-to-work-here',
  'subtle-art-of-small-talk',
  'impossible-interview-questions',
  'psychological-trick-winning-arguments',
  'recovering-from-toxic-boss',
  'secret-interview-etiquette-tips',
  'why-promotions-arent-always-good',
  'beware-remote-job-scams',
  'salary-negotiation-not-personal'
)
AND cat.slug = 'day-in-the-life';
