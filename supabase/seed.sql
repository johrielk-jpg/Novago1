-- Référentiel des centres d'intérêt (écrans 4 et 9 des maquettes).
insert into public.interests (slug, label) values
  ('voyage', 'Voyage'),
  ('sport', 'Sport'),
  ('cuisine', 'Cuisine'),
  ('musique', 'Musique'),
  ('cinema', 'Cinéma'),
  ('lecture', 'Lecture'),
  ('series', 'Séries'),
  ('art', 'Art & expositions'),
  ('nature', 'Nature & randonnée'),
  ('voile', 'Voile'),
  ('gastronomie', 'Gastronomie'),
  ('photographie', 'Photographie'),
  ('danse', 'Danse'),
  ('jeux', 'Jeux de société'),
  ('benevolat', 'Bénévolat')
on conflict (slug) do nothing;
