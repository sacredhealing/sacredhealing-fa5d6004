-- Populate healing_audio entries with pre-written meditation scripts
-- This updates existing entries and provides templates for new ones

-- Update existing healing_audio entries with scripts based on their title and category
UPDATE public.healing_audio
SET script_text = CASE
  -- Chakra Healing Scripts
  WHEN title ILIKE '%chakra%' OR category ILIKE '%chakra%' THEN
    'Chakra Healing Meditation: ' || title || E'\n\n' ||
    'Welcome to this sacred healing space. Find a comfortable position where you won''t be disturbed. Close your eyes gently. Take three deep breaths, inhaling peace and exhaling any tension.\n\n' ||
    'Bring your awareness to your energy centers. Visualize a beautiful, spinning wheel of light at your energy center. This is your chakra, the center of your energetic being.\n\n' ||
    'As you breathe, imagine a warm, vibrant light flowing into this chakra. Feel it expanding, clearing, and balancing. Any blockages or stored emotions begin to dissolve in this healing light.\n\n' ||
    'With each breath, this chakra becomes more vibrant, more open, more aligned. Feel the energy flowing freely, connecting you to your highest self.\n\n' ||
    'Rest in this healing energy. Allow the frequency to work on all levels - physical, emotional, mental, and spiritual. You are safe. You are healing. You are whole.\n\n' ||
    'When you are ready, gently bring your awareness back to your body. Take a deep breath, and open your eyes, feeling refreshed and balanced.'

  -- Sleep Healing Scripts
  WHEN title ILIKE '%sleep%' OR title ILIKE '%rest%' OR category ILIKE '%sleep%' THEN
    'Sleep Healing Meditation: ' || title || E'\n\n' ||
    'Welcome to your sleep sanctuary. Lie down comfortably. Close your eyes. Let go of the day.\n\n' ||
    'Take a deep breath in through your nose... hold for a moment... and release slowly through your mouth. Repeat this three times, feeling your body begin to relax.\n\n' ||
    'Starting from your toes, consciously relax each part of your body. Your feet... your legs... your hips... your stomach... your chest... your arms... your shoulders... your neck... your face. Let all tension melt away.\n\n' ||
    'Now, imagine yourself in a peaceful, safe place - perhaps a quiet beach at sunset, or a serene forest, or a cozy room. Feel the peace of this place. You are completely safe here.\n\n' ||
    'As you rest, feel healing energy flowing through your entire being. Your nervous system is calming. Your mind is quieting. Your body is preparing for deep, restorative sleep.\n\n' ||
    'With each breath, you sink deeper into relaxation. Any worries or thoughts gently drift away like clouds in the sky. You are letting go. You are surrendering to rest.\n\n' ||
    'You are safe. You are loved. You are ready for peaceful sleep. Allow yourself to drift into deep, healing slumber.'

  -- Frequency Healing Scripts
  WHEN title ILIKE '%frequency%' OR title ILIKE '%hz%' OR title ILIKE '%432%' OR title ILIKE '%528%' OR category ILIKE '%frequency%' THEN
    'Frequency Healing: ' || title || E'\n\n' ||
    'Welcome to this frequency healing session. Find a comfortable position. Close your eyes. Take a few deep breaths to center yourself.\n\n' ||
    'The healing frequency you are about to receive works on a cellular level, harmonizing your energy field and promoting natural healing. Simply allow yourself to receive.\n\n' ||
    'As the frequency plays, feel it resonating through your body. Notice any areas that respond - perhaps a gentle vibration, a sense of warmth, or a feeling of release.\n\n' ||
    'This frequency is designed to harmonize your energy and promote healing. Trust the process. Your body knows how to heal. Your energy knows how to balance.\n\n' ||
    'Breathe naturally. There''s nothing you need to do. Just be present. Just receive. The frequency is doing the work.\n\n' ||
    'Rest in this healing space. Allow the vibrations to penetrate every cell, every tissue, every energy center. You are being harmonized. You are being healed.\n\n' ||
    'When the session ends, take a moment to notice how you feel. Gently open your eyes when you''re ready, carrying this healing energy with you.'

  -- Emotional Healing Scripts
  WHEN title ILIKE '%emotional%' OR title ILIKE '%heart%' OR title ILIKE '%healing%' OR category ILIKE '%emotional%' THEN
    'Emotional Healing Meditation: ' || title || E'\n\n' ||
    'Welcome to a safe space for deep emotional healing. Find a comfortable position. Close your eyes. Take several deep, cleansing breaths.\n\n' ||
    'Bring your awareness to your heart center. Notice any emotions that are present - sadness, anger, fear, or pain. Acknowledge them without judgment. They are valid. They are part of your journey.\n\n' ||
    'Now, imagine a warm, golden light surrounding your heart. This is the light of unconditional love and acceptance. As you breathe, this light gently penetrates any emotional wounds, any stored pain, any old patterns.\n\n' ||
    'Feel the light dissolving layers of hurt, releasing what no longer serves you. With each breath, you are creating space for new emotions - peace, joy, love, compassion.\n\n' ||
    'Visualize any difficult emotions being transformed into wisdom, into strength, into understanding. You are not your pain. You are the awareness that observes it. You are the light that heals it.\n\n' ||
    'Rest in this healing space. Allow yourself to feel whatever needs to be felt. You are safe. You are supported. You are loved.\n\n' ||
    'When you are ready, gently return to the present moment, carrying this healing energy with you.'

  -- Energy Clearing Scripts
  WHEN title ILIKE '%clear%' OR title ILIKE '%energy%' OR category ILIKE '%clearing%' THEN
    'Energy Clearing Meditation: ' || title || E'\n\n' ||
    'Welcome to this powerful energy clearing session. Sit or lie comfortably. Close your eyes. Take three deep, cleansing breaths.\n\n' ||
    'Visualize yourself surrounded by a beautiful, protective bubble of white light. This is your sacred space. Nothing can harm you here.\n\n' ||
    'Now, imagine roots growing from your feet deep into the earth. You are grounded. You are connected to the earth''s healing energy.\n\n' ||
    'As you breathe, visualize any negative energy, any attachments, any lower vibrations being drawn down through your body, through your roots, and into the earth, where it is transformed into pure light.\n\n' ||
    'Feel your energy field becoming lighter, clearer, brighter. Any energetic cords or attachments are being released. Any heavy emotions are being cleared.\n\n' ||
    'Now, imagine a beautiful waterfall of white light flowing from above, through the crown of your head, washing through your entire being, clearing and purifying every cell, every chakra, every energy center.\n\n' ||
    'Feel yourself becoming lighter, more aligned, more connected to your highest self. You are clear. You are protected. You are free.\n\n' ||
    'Rest in this cleared, purified state. When you''re ready, gently return to the present moment, feeling refreshed and energetically clean.'

  -- Default Healing Script
  ELSE
    'Sacred Healing Meditation: ' || title || E'\n\n' ||
    'Welcome to this sacred healing space. Find a comfortable position where you won''t be disturbed. Close your eyes gently. Take three deep breaths, inhaling peace and exhaling any tension.\n\n' ||
    'Bring your awareness to your body. Notice any areas that need healing - physical, emotional, mental, or spiritual. Acknowledge them with compassion.\n\n' ||
    'Now, imagine a warm, golden light surrounding you. This is the light of divine healing energy. As you breathe, this light gently flows into your being, penetrating every cell, every tissue, every energy center.\n\n' ||
    'Feel this healing energy working on all levels. Physical healing for your body. Emotional healing for your heart. Mental healing for your mind. Spiritual healing for your soul.\n\n' ||
    'With each breath, you are being restored, renewed, and revitalized. Any blockages are dissolving. Any pain is being soothed. Any wounds are being healed.\n\n' ||
    'Rest in this healing energy. Trust the process. Your body knows how to heal. Your spirit knows how to restore. You are safe. You are healing. You are whole.\n\n' ||
    'When you are ready, gently bring your awareness back to your body. Take a deep breath, and open your eyes, feeling refreshed, healed, and renewed.'
END
WHERE script_text IS NULL OR script_text = '';

