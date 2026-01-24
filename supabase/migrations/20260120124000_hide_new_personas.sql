-- Migration: Hide the 15 newly added personas
-- Reason: User wants to upload covers manually before making them public
-- Date: 2026-01-20

UPDATE public.discovered_personas
SET is_visible = false, updated_at = NOW()
WHERE id IN (
    'movie_godfather',
    'movie_anaconda_2025',
    'series_black_mirror',
    'series_last_of_us',
    'series_peaky_blinders',
    'movie_now_you_see_me',
    'movie_blade_runner',
    'series_dark_matter',
    'series_emily_in_paris',
    'series_big_bang_theory',
    'series_wednesday',
    'movie_mission_impossible_2025',
    'movie_inception',
    'series_vikings',
    'series_spartacus'
);
