-- Insert flow steps from user's spreadsheet
-- Days are adjusted: Day 1 → Day 0, Day 2 → Day 1, etc.
-- step_order is calculated chronologically

-- Day 0, Immediately, Email
INSERT INTO flow_steps (step_order, type, subject, content, day, time, time_type, enabled)
VALUES (
  1,
  'email',
  'One Step Closer to a Brand New Garage Floor',
  'Hey {FIRST NAME},



You''re one step closer to an amazing new garage floor!  For us to give you an exact quote we''ll need to do a free in person estimate where we''ll test the moisture of your concrete, measure the space, check for cracks, and show you samples so you can choose your colors.  Here''s a link to my calendar to schedule a time:

{CALENDAR LINK}

If you have any questions whatsoever please don''t hesitate to reach out by replying to this email or calling/texting my cell phone {PHONE NUMBER}.

Looking forward to upgrading your space!',
  0,
  NULL,
  'immediately',
  TRUE
);

-- Day 0, Immediately, Text
INSERT INTO flow_steps (step_order, type, subject, content, day, time, time_type, enabled)
VALUES (
  2,
  'text',
  NULL,
  '',
  0,
  NULL,
  'immediately',
  TRUE
);

-- Day 1, 8:23 AM, Email
INSERT INTO flow_steps (step_order, type, subject, content, day, time, time_type, enabled)
VALUES (
  3,
  'email',
  'Finish Scheduling Your Appointment',
  'Hey {FIRST NAME},

Here''s the link to book your appointment to get a quote for your {FLOOR TYPE}: {CALENDAR LINK}

The appointment is quick and no-pressure.  We''ll take a look at your space, go over color and flake options, and give you a clear, upfront price.

Most installs are completed in as little as one day, and all of our coatings are built to handle heavy use, moisture, and hot tires.

If you have any questions before booking, just reply to this email and we''ll be happy to help!',
  1,
  '8:23 AM',
  'specific',
  TRUE
);

-- Day 1, 1:29 PM, Text
INSERT INTO flow_steps (step_order, type, subject, content, day, time, time_type, enabled)
VALUES (
  4,
  'text',
  NULL,
  'Hi {FIRST NAME} hope you''re having a great day so far!  Would you mind giving me a call back whenever is convenient so we can get this taken care of?',
  1,
  '1:29 PM',
  'specific',
  TRUE
);

-- Day 1, 6:47 PM, Text
INSERT INTO flow_steps (step_order, type, subject, content, day, time, time_type, enabled)
VALUES (
  5,
  'text',
  NULL,
  'We just quoted a home owner and saved them over $500 on their floor!  Would love to do the same for you!!',
  1,
  '6:47 PM',
  'specific',
  TRUE
);

-- Day 2, 7:42 AM, Text
INSERT INTO flow_steps (step_order, type, subject, content, day, time, time_type, enabled)
VALUES (
  6,
  'text',
  NULL,
  'Just wanted to give you a heads up - if you''re getting other quotes, make sure to check that they''re using polyurea',
  2,
  '7:42 AM',
  'specific',
  TRUE
);

-- Day 2, 2:17 PM, Email
INSERT INTO flow_steps (step_order, type, subject, content, day, time, time_type, enabled)
VALUES (
  7,
  'email',
  'A new {FLOOR TYPE}... for how much??',
  'Hey {FIRST NAME},

Most people assume a new garage floor is expensive but that''s not always the case.

With our premium polyurea floor coatings, you can transform your garage with a durable, great-looking finish that installs in as little as one day and lasts for years.

No peeling. No hot-tire pickup. No constant maintenance.

Just a clean, professional floor that''s built for real use.

If you''re curious what it would cost for your {FLOOR TYPE}, you can book a quick, no-pressure quote here:

{CALENDAR LINK}

Happy to answer any questions!',
  2,
  '2:17 PM',
  'specific',
  TRUE
);

-- Day 5, 10:12 AM, Text
INSERT INTO flow_steps (step_order, type, subject, content, day, time, time_type, enabled)
VALUES (
  8,
  'text',
  NULL,
  'When is a good time for me to call you?',
  5,
  '10:12 AM',
  'specific',
  TRUE
);

-- Day 5, 3:35 PM, Text
INSERT INTO flow_steps (step_order, type, subject, content, day, time, time_type, enabled)
VALUES (
  9,
  'text',
  NULL,
  'Just let me know what time is good for you!',
  5,
  '3:35 PM',
  'specific',
  TRUE
);

-- Day 8, 11:04 AM, Email
INSERT INTO flow_steps (step_order, type, subject, content, day, time, time_type, enabled)
VALUES (
  10,
  'email',
  '👉 Finish Booking Your Appointment',
  'Just a quick follow-up to help you finish booking your appointment

Homeowners choose our floor coatings because they work and the results speak for themselves:

⏱ Most installs completed in 1 day

🛡 Designed to last 15+ years

🚗 100% hot-tire, moisture, and heavy-use resistant

When you''re ready, you can lock in a time that works best for you here:

{CALENDAR LINK}',
  8,
  '11:04 AM',
  'specific',
  TRUE
);

-- Day 8, 12:58 PM, Text
INSERT INTO flow_steps (step_order, type, subject, content, day, time, time_type, enabled)
VALUES (
  11,
  'text',
  NULL,
  'Happy to answer any questions you have over text as well!  Whatever is easiest for you',
  8,
  '12:58 PM',
  'specific',
  TRUE
);

-- Day 9, 9:24 AM, Text
INSERT INTO flow_steps (step_order, type, subject, content, day, time, time_type, enabled)
VALUES (
  12,
  'text',
  NULL,
  'We don''t believe in spamming people so whenever you''re ready you just let me know!',
  9,
  '9:24 AM',
  'specific',
  TRUE
);

