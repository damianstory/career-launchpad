-- Seed Max Klymenko career ladder videos and Cleo Abram tech explainers
-- Max Klymenko (@maxklymenko) - Career Ladder interview series → Day in the Life/On the Job
-- Cleo Abram (@CleoAbram) - Tech/Science explainer shorts → Emerging Careers/Industries

-- =====================================================
-- MAX KLYMENKO - CAREER LADDER VIDEOS (18 videos)
-- Category: Day in the Life/On the Job
-- =====================================================

INSERT INTO content (id, slug, title, description, content_type, thumbnail_url, video_url, video_orientation, published_at, is_published)
VALUES
  -- Ep. 469
  (gen_random_uuid(), 'celebrities-pay-120k-for-it', 'Celebrities Pay $120,000 For It', 'Discover the exclusive service that celebrities pay top dollar for and meet the person behind this unique career.', 'video', 'https://img.youtube.com/vi/izvVKMAuMck/maxresdefault.jpg', 'https://www.youtube.com/shorts/izvVKMAuMck', 'vertical', NOW() - INTERVAL '1 day', true),

  -- Ep. 468
  (gen_random_uuid(), 'making-millions-at-12', 'Making Millions at 12 Years Old', 'Meet a young entrepreneur who started making millions before even becoming a teenager.', 'video', 'https://img.youtube.com/vi/4SHuMLHJ1tw/maxresdefault.jpg', 'https://www.youtube.com/shorts/4SHuMLHJ1tw', 'vertical', NOW() - INTERVAL '2 days', true),

  -- Ep. 467
  (gen_random_uuid(), 'legendary-mum-crazy-gift', 'Legendary Mum With a Crazy Gift', 'A mother in Singapore with an incredible talent that turned into an amazing career opportunity.', 'video', 'https://img.youtube.com/vi/4gODy8JrwVc/maxresdefault.jpg', 'https://www.youtube.com/shorts/4gODy8JrwVc', 'vertical', NOW() - INTERVAL '3 days', true),

  -- Ep. 466
  (gen_random_uuid(), '15-year-old-genius', 'He''s a 15 Year Old Genius', 'Meet a teenage prodigy whose exceptional abilities have opened incredible career doors.', 'video', 'https://img.youtube.com/vi/pJC1bAc-lvw/maxresdefault.jpg', 'https://www.youtube.com/shorts/pJC1bAc-lvw', 'vertical', NOW() - INTERVAL '4 days', true),

  -- Ep. 465
  (gen_random_uuid(), 'only-3-people-do-her-job', 'Only 3 People in the World Do Her Job', 'Discover one of the rarest careers on the planet with only three people qualified to do it.', 'video', 'https://img.youtube.com/vi/oOSQjCrBAgQ/maxresdefault.jpg', 'https://www.youtube.com/shorts/oOSQjCrBAgQ', 'vertical', NOW() - INTERVAL '5 days', true),

  -- Ep. 464
  (gen_random_uuid(), 'artificially-gives-better-body', 'She Artificially Gives People a Better Body', 'Meet the professional who transforms bodies through innovative artificial enhancement techniques.', 'video', 'https://img.youtube.com/vi/q1YYg5tu9Lg/maxresdefault.jpg', 'https://www.youtube.com/shorts/q1YYg5tu9Lg', 'vertical', NOW() - INTERVAL '6 days', true),

  -- Ep. 463
  (gen_random_uuid(), 'kings-queens-paddington-bear', 'His Job Involves Kings, Queens and Paddington Bear', 'A unique career that connects royalty with beloved fictional characters.', 'video', 'https://img.youtube.com/vi/HHBTgrQZ7es/maxresdefault.jpg', 'https://www.youtube.com/shorts/HHBTgrQZ7es', 'vertical', NOW() - INTERVAL '7 days', true),

  -- Ep. 462
  (gen_random_uuid(), 'kids-love-her-hot-job', 'The Kids Love Her Hot Job', 'Discover a career that brings joy to children and involves some serious heat.', 'video', 'https://img.youtube.com/vi/AjtYPX4m-5o/maxresdefault.jpg', 'https://www.youtube.com/shorts/AjtYPX4m-5o', 'vertical', NOW() - INTERVAL '8 days', true),

  -- Ep. 461
  (gen_random_uuid(), 'what-i-mean-by-famous', 'That''s What I Mean by Famous', 'An interview with someone who truly understands what fame means in their industry.', 'video', 'https://img.youtube.com/vi/mROwlhxfpX4/maxresdefault.jpg', 'https://www.youtube.com/shorts/mROwlhxfpX4', 'vertical', NOW() - INTERVAL '9 days', true),

  -- Ep. 460
  (gen_random_uuid(), 'first-responder-edition', 'First Responder Edition', 'Meet a first responder and learn about the critical role they play in emergency services.', 'video', 'https://img.youtube.com/vi/J3Du25IB5S0/maxresdefault.jpg', 'https://www.youtube.com/shorts/J3Du25IB5S0', 'vertical', NOW() - INTERVAL '10 days', true),

  -- Ep. 459
  (gen_random_uuid(), 'back-with-side-job', 'She Is Back With a Side Job', 'A returning guest shares how they balanced their main career with an exciting side hustle.', 'video', 'https://img.youtube.com/vi/xe3aBcFrJPE/maxresdefault.jpg', 'https://www.youtube.com/shorts/xe3aBcFrJPE', 'vertical', NOW() - INTERVAL '11 days', true),

  -- Ep. 458
  (gen_random_uuid(), 'job-analogous-to-mirrors', 'Her Job Is Analogous to Mirrors', 'A fascinating career that reflects and transforms in unexpected ways.', 'video', 'https://img.youtube.com/vi/s7ODuHUzdl8/maxresdefault.jpg', 'https://www.youtube.com/shorts/s7ODuHUzdl8', 'vertical', NOW() - INTERVAL '12 days', true),

  -- Ep. 457
  (gen_random_uuid(), 'first-woman-to-do-job-twice', 'She Was the First Woman to Do Her Job Twice', 'Meet the trailblazer who broke barriers not once, but twice in her field.', 'video', 'https://img.youtube.com/vi/iDnlliBFeSA/maxresdefault.jpg', 'https://www.youtube.com/shorts/iDnlliBFeSA', 'vertical', NOW() - INTERVAL '13 days', true),

  -- Ep. 456
  (gen_random_uuid(), 'nominated-by-whole-school', 'He Was Nominated by His Whole School', 'A student whose entire school recognized their exceptional talents and potential.', 'video', 'https://img.youtube.com/vi/aLyIX16hkfQ/maxresdefault.jpg', 'https://www.youtube.com/shorts/aLyIX16hkfQ', 'vertical', NOW() - INTERVAL '14 days', true),

  -- Ep. 455
  (gen_random_uuid(), 'wont-guess-in-million-years', 'She Thinks I Won''t Guess in a Million Years', 'Can you guess this Australian''s unique and surprising career?', 'video', 'https://img.youtube.com/vi/fUURcxGhC60/maxresdefault.jpg', 'https://www.youtube.com/shorts/fUURcxGhC60', 'vertical', NOW() - INTERVAL '15 days', true),

  -- Ep. 454
  (gen_random_uuid(), 'job-needs-patience', 'This Job Needs Patience', 'A career in Brazil that requires incredible patience and dedication.', 'video', 'https://img.youtube.com/vi/gdmh5vSmymg/maxresdefault.jpg', 'https://www.youtube.com/shorts/gdmh5vSmymg', 'vertical', NOW() - INTERVAL '16 days', true),

  -- Ep. 4 (Gen Z training)
  (gen_random_uuid(), 'trains-bosses-manage-gen-z', 'She Trains Bosses to Manage Gen Z', 'Meet the professional helping managers understand and work effectively with Generation Z employees.', 'video', 'https://img.youtube.com/vi/QidarcDABcc/maxresdefault.jpg', 'https://www.youtube.com/shorts/QidarcDABcc', 'vertical', NOW() - INTERVAL '17 days', true),

  -- Ep. 453
  (gen_random_uuid(), 'dream-job-pays-well', 'She Has a Dream Job That Pays Well', 'Discover a career that combines passion with excellent compensation.', 'video', 'https://img.youtube.com/vi/z2x3gRSYEoo/maxresdefault.jpg', 'https://www.youtube.com/shorts/z2x3gRSYEoo', 'vertical', NOW() - INTERVAL '18 days', true);

-- Link Max Klymenko videos to day-in-the-life category
INSERT INTO content_categories (content_id, category_id)
SELECT c.id, cat.id
FROM content c
CROSS JOIN categories cat
WHERE c.slug IN (
  'celebrities-pay-120k-for-it',
  'making-millions-at-12',
  'legendary-mum-crazy-gift',
  '15-year-old-genius',
  'only-3-people-do-her-job',
  'artificially-gives-better-body',
  'kings-queens-paddington-bear',
  'kids-love-her-hot-job',
  'what-i-mean-by-famous',
  'first-responder-edition',
  'back-with-side-job',
  'job-analogous-to-mirrors',
  'first-woman-to-do-job-twice',
  'nominated-by-whole-school',
  'wont-guess-in-million-years',
  'job-needs-patience',
  'trains-bosses-manage-gen-z',
  'dream-job-pays-well'
)
AND cat.slug = 'day-in-the-life';


-- =====================================================
-- CLEO ABRAM - TECH/SCIENCE EXPLAINER VIDEOS (25 videos)
-- Category: Emerging Careers/Industries
-- =====================================================

INSERT INTO content (id, slug, title, description, content_type, thumbnail_url, video_url, video_orientation, published_at, is_published)
VALUES
  -- Video 1
  (gen_random_uuid(), 'discovered-new-fire-creature', 'We Discovered A New Fire Creature', 'Scientists have discovered an amazing new organism that thrives in extreme heat conditions.', 'video', 'https://img.youtube.com/vi/P88f_qMCgOw/maxresdefault.jpg', 'https://www.youtube.com/shorts/P88f_qMCgOw', 'vertical', NOW() - INTERVAL '19 days', true),

  -- Video 2
  (gen_random_uuid(), 'quantum-gps-device', 'This New Device Uses a Quantum GPS', 'Explore breakthrough quantum technology that could revolutionize navigation systems.', 'video', 'https://img.youtube.com/vi/lwj5t6H7CYc/maxresdefault.jpg', 'https://www.youtube.com/shorts/lwj5t6H7CYc', 'vertical', NOW() - INTERVAL '20 days', true),

  -- Video 3
  (gen_random_uuid(), 'shoes-alter-your-brain', 'These Shoes Aim To Alter Your Brain', 'Innovative footwear technology designed to influence brain activity and performance.', 'video', 'https://img.youtube.com/vi/PtYh9fzT_sM/maxresdefault.jpg', 'https://www.youtube.com/shorts/PtYh9fzT_sM', 'vertical', NOW() - INTERVAL '21 days', true),

  -- Video 4
  (gen_random_uuid(), 'what-is-3i-atlas-made-of', 'What Is 3I/ATLAS Actually Made Of?', 'Breaking down the composition of the mysterious interstellar object 3I/ATLAS.', 'video', 'https://img.youtube.com/vi/vQK6ifCaXec/maxresdefault.jpg', 'https://www.youtube.com/shorts/vQK6ifCaXec', 'vertical', NOW() - INTERVAL '22 days', true),

  -- Video 5
  (gen_random_uuid(), 'medical-treatment-saved-boy', 'New Medical Treatment Saved This Little Boy''s Life', 'A breakthrough medical treatment that gave a child a second chance at life.', 'video', 'https://img.youtube.com/vi/r14RsDlcrC4/maxresdefault.jpg', 'https://www.youtube.com/shorts/r14RsDlcrC4', 'vertical', NOW() - INTERVAL '23 days', true),

  -- Video 6
  (gen_random_uuid(), 'white-leds-almost-didnt-exist', 'Why White LEDs Almost Didn''t Exist', 'The surprising history behind the technology that lights up our modern world.', 'video', 'https://img.youtube.com/vi/0sYYB1J5QOY/maxresdefault.jpg', 'https://www.youtube.com/shorts/0sYYB1J5QOY', 'vertical', NOW() - INTERVAL '24 days', true),

  -- Video 7
  (gen_random_uuid(), 'massive-machine-under-antarctica', 'The Massive Machine Hidden Under Antarctica', 'Discover the enormous scientific equipment buried beneath the Antarctic ice.', 'video', 'https://img.youtube.com/vi/5CkRJnY2NNg/maxresdefault.jpg', 'https://www.youtube.com/shorts/5CkRJnY2NNg', 'vertical', NOW() - INTERVAL '25 days', true),

  -- Video 8
  (gen_random_uuid(), 'smallest-black-hole', 'What''s the Smallest Black Hole?', 'Exploring the tiniest black holes in the universe and what they reveal about physics.', 'video', 'https://img.youtube.com/vi/nWNTBTizV1c/maxresdefault.jpg', 'https://www.youtube.com/shorts/nWNTBTizV1c', 'vertical', NOW() - INTERVAL '26 days', true),

  -- Video 9
  (gen_random_uuid(), 'sahara-fertilizes-amazon', 'The Sahara Desert Fertilizes the Amazon Rainforest', 'How dust from Africa travels across the Atlantic to nourish the world''s largest rainforest.', 'video', 'https://img.youtube.com/vi/mgiG6UUW_Ss/maxresdefault.jpg', 'https://www.youtube.com/shorts/mgiG6UUW_Ss', 'vertical', NOW() - INTERVAL '27 days', true),

  -- Video 10
  (gen_random_uuid(), 'snowflakes-have-6-sides', 'Why Do All Snowflakes Have 6 Sides?', 'The beautiful science behind snowflake geometry and crystalline structures.', 'video', 'https://img.youtube.com/vi/gvRwPjit3jg/maxresdefault.jpg', 'https://www.youtube.com/shorts/gvRwPjit3jg', 'vertical', NOW() - INTERVAL '28 days', true),

  -- Video 11
  (gen_random_uuid(), 'prehistoric-animal-survived', 'Guess Which Prehistoric Animal Survived', 'Test your knowledge about which ancient creatures made it through mass extinctions.', 'video', 'https://img.youtube.com/vi/S75_HoDLn0c/maxresdefault.jpg', 'https://www.youtube.com/shorts/S75_HoDLn0c', 'vertical', NOW() - INTERVAL '29 days', true),

  -- Video 12
  (gen_random_uuid(), 'plane-needs-3-pilots', 'Why This Plane Needs 3 Pilots', 'Discover the unique aircraft that requires three pilots to operate safely.', 'video', 'https://img.youtube.com/vi/dnEONCUyYiw/maxresdefault.jpg', 'https://www.youtube.com/shorts/dnEONCUyYiw', 'vertical', NOW() - INTERVAL '30 days', true),

  -- Video 13
  (gen_random_uuid(), 'scientists-bullied-octopus', 'Why Scientists Bullied This Octopus', 'The surprising research method that revealed amazing things about octopus intelligence.', 'video', 'https://img.youtube.com/vi/R8iJYXWc42w/maxresdefault.jpg', 'https://www.youtube.com/shorts/R8iJYXWc42w', 'vertical', NOW() - INTERVAL '31 days', true),

  -- Video 14
  (gen_random_uuid(), 'biggest-planet-ever-found', 'What''s the Biggest Planet Ever Found?', 'Meet the enormous exoplanet that dwarfs everything in our solar system.', 'video', 'https://img.youtube.com/vi/1-5Zmvv8Mlc/maxresdefault.jpg', 'https://www.youtube.com/shorts/1-5Zmvv8Mlc', 'vertical', NOW() - INTERVAL '32 days', true),

  -- Video 15
  (gen_random_uuid(), 'deep-sea-creature-first-time', 'Deep Sea Creature Seen For First Time', 'Witness the first ever footage of a mysterious deep ocean animal.', 'video', 'https://img.youtube.com/vi/1xWzJmtC7og/maxresdefault.jpg', 'https://www.youtube.com/shorts/1xWzJmtC7og', 'vertical', NOW() - INTERVAL '33 days', true),

  -- Video 16
  (gen_random_uuid(), 'airplane-fuel-floating', 'This Airplane Fuel Is Floating. Uh Oh.', 'Understanding a concerning phenomenon in aviation fuel and what it means for flight safety.', 'video', 'https://img.youtube.com/vi/b_SaxjsGbus/maxresdefault.jpg', 'https://www.youtube.com/shorts/b_SaxjsGbus', 'vertical', NOW() - INTERVAL '34 days', true),

  -- Video 17
  (gen_random_uuid(), 'fly-through-asteroid-belt', 'Could You Fly Through the Asteroid Belt?', 'Separating science fiction from reality about navigating through space rocks.', 'video', 'https://img.youtube.com/vi/RrhBcG_TqS8/maxresdefault.jpg', 'https://www.youtube.com/shorts/RrhBcG_TqS8', 'vertical', NOW() - INTERVAL '35 days', true),

  -- Video 18
  (gen_random_uuid(), 'dinosaur-mummies-are-real', 'Dinosaur Mummies Are Real', 'Preserved dinosaur remains that give us unprecedented insight into prehistoric life.', 'video', 'https://img.youtube.com/vi/2_19kejRLgM/maxresdefault.jpg', 'https://www.youtube.com/shorts/2_19kejRLgM', 'vertical', NOW() - INTERVAL '36 days', true),

  -- Video 19
  (gen_random_uuid(), 'how-many-humans-ever-lived', 'How Many Humans Have Ever Lived?', 'Calculating the total number of people who have ever walked the Earth.', 'video', 'https://img.youtube.com/vi/QiORD2v5Q6Q/maxresdefault.jpg', 'https://www.youtube.com/shorts/QiORD2v5Q6Q', 'vertical', NOW() - INTERVAL '37 days', true),

  -- Video 20
  (gen_random_uuid(), 'plane-cured-fear-of-flying', 'This Plane Cured My Fear of Flying', 'How innovative aircraft design is helping people overcome aviation anxiety.', 'video', 'https://img.youtube.com/vi/fvJ8cYvt3t0/maxresdefault.jpg', 'https://www.youtube.com/shorts/fvJ8cYvt3t0', 'vertical', NOW() - INTERVAL '38 days', true),

  -- Video 21
  (gen_random_uuid(), 'stop-dangerous-asteroid', 'How to Stop This Dangerous Asteroid', 'The science and technology behind planetary defense systems.', 'video', 'https://img.youtube.com/vi/rPhf0UVISWw/maxresdefault.jpg', 'https://www.youtube.com/shorts/rPhf0UVISWw', 'vertical', NOW() - INTERVAL '39 days', true),

  -- Video 22
  (gen_random_uuid(), 'microrobot-save-your-life', 'This Microrobot Could Save Your Life', 'Tiny robots designed to navigate inside your body and deliver life-saving treatments.', 'video', 'https://img.youtube.com/vi/f663rl4Y3dQ/maxresdefault.jpg', 'https://www.youtube.com/shorts/f663rl4Y3dQ', 'vertical', NOW() - INTERVAL '40 days', true),

  -- Video 23
  (gen_random_uuid(), 'something-alive-earths-crust', 'There''s Something Alive in Earth''s Crust', 'Discover the organisms living deep within our planet''s rocky layers.', 'video', 'https://img.youtube.com/vi/5605m8hhgow/maxresdefault.jpg', 'https://www.youtube.com/shorts/5605m8hhgow', 'vertical', NOW() - INTERVAL '41 days', true),

  -- Video 24
  (gen_random_uuid(), 'whats-up-with-atlas-tail', 'What''s Up With 3I/ATLAS'' Tail?', 'Investigating the unusual tail behavior of the interstellar visitor.', 'video', 'https://img.youtube.com/vi/H2SS6KloJX8/maxresdefault.jpg', 'https://www.youtube.com/shorts/H2SS6KloJX8', 'vertical', NOW() - INTERVAL '42 days', true),

  -- Video 25
  (gen_random_uuid(), 'experiment-saved-kids-lives', 'This Experiment Saved Kids'' Lives', 'The groundbreaking research that led to life-saving treatments for children.', 'video', 'https://img.youtube.com/vi/Rov6W30zZhQ/maxresdefault.jpg', 'https://www.youtube.com/shorts/Rov6W30zZhQ', 'vertical', NOW() - INTERVAL '43 days', true);

-- Link Cleo Abram videos to emerging-careers category
INSERT INTO content_categories (content_id, category_id)
SELECT c.id, cat.id
FROM content c
CROSS JOIN categories cat
WHERE c.slug IN (
  'discovered-new-fire-creature',
  'quantum-gps-device',
  'shoes-alter-your-brain',
  'what-is-3i-atlas-made-of',
  'medical-treatment-saved-boy',
  'white-leds-almost-didnt-exist',
  'massive-machine-under-antarctica',
  'smallest-black-hole',
  'sahara-fertilizes-amazon',
  'snowflakes-have-6-sides',
  'prehistoric-animal-survived',
  'plane-needs-3-pilots',
  'scientists-bullied-octopus',
  'biggest-planet-ever-found',
  'deep-sea-creature-first-time',
  'airplane-fuel-floating',
  'fly-through-asteroid-belt',
  'dinosaur-mummies-are-real',
  'how-many-humans-ever-lived',
  'plane-cured-fear-of-flying',
  'stop-dangerous-asteroid',
  'microrobot-save-your-life',
  'something-alive-earths-crust',
  'whats-up-with-atlas-tail',
  'experiment-saved-kids-lives'
)
AND cat.slug = 'emerging-careers';
