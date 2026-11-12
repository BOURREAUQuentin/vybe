-- Vybe — Données de démonstration du MVP (source = 'demo').
--
-- Artistes et salles réels ; les CONCERTS, dates, prix et statuts sont INVENTÉS.
-- Les photos d'artistes sont des images génériques (picsum.photos), pas les vrais artistes.
-- Les identifiants externes imitent le format Ticketmaster (Discovery API).
--
-- Les dates sont calculées à partir du jour d'exécution : relancer ce script
-- rafraîchit les dates. Il ne supprime rien : il insère ou met à jour (upsert).

-- Date relative en heure de Paris : at_paris(12, '20:00') = dans 12 jours à 20h00.
create function pg_temp.at_paris(days integer, local_time time)
returns timestamptz
language sql
as $$
  select ((date_trunc('day', now() at time zone 'Europe/Paris') + make_interval(days => days) + local_time)
    at time zone 'Europe/Paris');
$$;

-- ---------------------------------------------------------------------------
-- Genres
-- ---------------------------------------------------------------------------

insert into public.genres (slug, name) values
  ('rap', 'Rap'),
  ('rnb', 'R&B'),
  ('pop', 'Pop'),
  ('electro', 'Électro'),
  ('chanson', 'Chanson')
on conflict (slug) do update set name = excluded.name;

-- ---------------------------------------------------------------------------
-- Villes (coordonnées approximatives du centre-ville)
-- ---------------------------------------------------------------------------

insert into public.cities (name, latitude, longitude) values
  ('Paris', 48.8566, 2.3522),
  ('Nantes', 47.2184, -1.5536),
  ('Lyon', 45.7640, 4.8357),
  ('Marseille', 43.2965, 5.3698),
  ('Bordeaux', 44.8378, -0.5792),
  ('Lille', 50.6292, 3.0573),
  ('Toulouse', 43.6047, 1.4442),
  -- V1.2 : villes proches des grandes villes, pour le filtre par rayon.
  ('Saint-Nazaire', 47.2735, -2.2138),
  ('Angers', 47.4784, -0.5632),
  ('Rennes', 48.1173, -1.6778),
  ('Nanterre', 48.8924, 2.2071)
on conflict (name, country_code) do update
  set latitude = excluded.latitude, longitude = excluded.longitude;

-- ---------------------------------------------------------------------------
-- Salles (réelles ; les salles de banlieue sont rattachées à la grande ville voisine,
-- leur commune réelle figure dans l'adresse)
-- ---------------------------------------------------------------------------

insert into public.venues (name, city_id, address, postal_code, latitude, longitude, source, external_id)
select v.name, c.id, v.address, v.postal_code, v.latitude, v.longitude, 'demo', v.external_id
from (values
  ('KovZpZAdemoACC', 'Accor Arena', 'Paris', '8 boulevard de Bercy', '75012', 48.8386, 2.3785),
  ('KovZpZAdemoZPA', 'Zénith Paris – La Villette', 'Paris', '211 avenue Jean Jaurès', '75019', 48.8940, 2.3933),
  ('KovZpZAdemoOLY', 'L''Olympia', 'Paris', '28 boulevard des Capucines', '75009', 48.8702, 2.3284),
  ('KovZpZAdemoCIG', 'La Cigale', 'Paris', '120 boulevard de Rochechouart', '75018', 48.8823, 2.3405),
  ('KovZpZAdemoSTX', 'Stereolux', 'Nantes', '4 boulevard Léon Bureau', '44200', 47.2056, -1.5639),
  ('KovZpZAdemoZNA', 'Zénith Nantes Métropole', 'Nantes', 'Boulevard du Zénith, Saint-Herblain', '44800', 47.2290, -1.6283),
  ('KovZpZAdemoTRA', 'Le Transbordeur', 'Lyon', '3 boulevard de Stalingrad, Villeurbanne', '69100', 45.7838, 4.8600),
  ('KovZpZAdemoHTG', 'Halle Tony Garnier', 'Lyon', '20 place des Docteurs Charles et Christophe Mérieux', '69007', 45.7322, 4.8233),
  ('KovZpZAdemoDOM', 'Le Dôme', 'Marseille', '48 avenue de Saint-Just', '13004', 43.3110, 5.4010),
  ('KovZpZAdemoEJU', 'Espace Julien', 'Marseille', '39 cours Julien', '13006', 43.2934, 5.3836),
  ('KovZpZAdemoARK', 'Arkéa Arena', 'Bordeaux', '48-50 avenue Jean Alfonséa, Floirac', '33270', 44.8303, -0.5242),
  ('KovZpZAdemoZLI', 'Zénith de Lille', 'Lille', '1 boulevard des Cités Unies', '59777', 50.6330, 3.0765),
  ('KovZpZAdemoAER', 'L''Aéronef', 'Lille', '168 avenue Willy Brandt', '59777', 50.6375, 3.0760),
  ('KovZpZAdemoZTO', 'Zénith Toulouse Métropole', 'Toulouse', '11 avenue Raymond Badiou', '31300', 43.5966, 1.4143),
  -- V1.2 : salles réelles dans les villes proches (coordonnées approximatives).
  ('KovZpZAdemoVIP', 'Le VIP', 'Saint-Nazaire', 'Base sous-marine, boulevard de la Légion d''Honneur', '44600', 47.2737, -2.2016),
  ('KovZpZAdemoCHA', 'Le Chabada', 'Angers', '56 boulevard du Doyenné', '49100', 47.4870, -0.5450),
  ('KovZpZAdemoLIB', 'Le Liberté', 'Rennes', '1 esplanade Charles de Gaulle', '35000', 48.1050, -1.6780),
  ('KovZpZAdemoLDA', 'Paris La Défense Arena', 'Nanterre', '99 jardins de l''Arche', '92000', 48.8957, 2.2290)
) as v(external_id, name, city, address, postal_code, latitude, longitude)
join public.cities c on c.name = v.city and c.country_code = 'FR'
on conflict (source, external_id) do update set
  name = excluded.name,
  city_id = excluded.city_id,
  address = excluded.address,
  postal_code = excluded.postal_code,
  latitude = excluded.latitude,
  longitude = excluded.longitude;

-- ---------------------------------------------------------------------------
-- Artistes (réels). image_url : image générique de test, ou null pour tester les initiales.
-- Werenoi n'a volontairement pas de description (test de donnée manquante).
-- ---------------------------------------------------------------------------

insert into public.artists (name, description, image_url, genre_id, source, external_id)
select a.name, a.description, a.image_url, g.id, 'demo', a.external_id
from (values
  ('K8vZ917demoBEK', 'Bekar', 'rap',
    'Rappeur originaire de la métropole lilloise, au rap mélodique et introspectif.',
    'https://picsum.photos/seed/vybe-bekar/800/800'),
  ('K8vZ917demoJOS', 'Josman', 'rap',
    'Rappeur originaire de Vierzon, connu pour son flow nonchalant et l''album J.O.$ (2018).',
    'https://picsum.photos/seed/vybe-josman/800/800'),
  ('K8vZ917demoHAM', 'Hamza', 'rap',
    'Rappeur et chanteur bruxellois surnommé le « Sauce God », figure de la trap francophone et auteur de l''album Paradise (2019).',
    'https://picsum.photos/seed/vybe-hamza/800/800'),
  ('K8vZ917demoSLL', 'So La Lune', 'rap',
    'Rappeur parisien à l''univers mélancolique, qui mêle rap et mélodies chantées.',
    null),
  ('K8vZ917demoGAZ', 'Gazo', 'rap',
    'Rappeur parisien, figure de proue de la drill française, auteur de l''album KMT (2022).',
    'https://picsum.photos/seed/vybe-gazo/800/800'),
  ('K8vZ917demoNIN', 'Ninho', 'rap',
    'Rappeur originaire de l''Essonne, l''un des artistes les plus certifiés de l''histoire du rap français.',
    'https://picsum.photos/seed/vybe-ninho/800/800'),
  ('K8vZ917demoSDM', 'SDM', 'rap',
    'Rappeur de Clamart (Hauts-de-Seine), révélé au grand public par le titre Bolide allemand (2023).',
    null),
  ('K8vZ917demoTIA', 'Tiakola', 'rap',
    'Ancien membre du groupe 4Keus, le chanteur et rappeur de La Courneuve a sorti l''album Mélo en 2022.',
    'https://picsum.photos/seed/vybe-tiakola/800/800'),
  ('K8vZ917demoWER', 'Werenoi', 'rap',
    null,
    null),
  ('K8vZ917demoZOL', 'Zola', 'rap',
    'Rappeur originaire d''Évry, dans l''Essonne, au style énergique et percutant.',
    null),
  ('K8vZ917demoLAY', 'Laylow', 'rap',
    'Rappeur toulousain à l''univers futuriste, auteur de Trinity (2020) et de L''Étrange Histoire de Mr. Anderson (2021).',
    'https://picsum.photos/seed/vybe-laylow/800/800'),
  ('K8vZ917demoDAM', 'Damso', 'rap',
    'Rappeur belge né à Kinshasa, auteur des albums Ipséité (2017) et QALF (2020).',
    null),
  ('K8vZ917demoPLK', 'PLK', 'rap',
    'Rappeur parisien issu du collectif Panama Bende, auteur de l''album Enna (2020).',
    null),
  ('K8vZ917demoTHE', 'Theodora', 'rap',
    'Artiste révélée en 2024 avec Kongolese sous BBL, entre rap, afro et pop.',
    null),
  ('K8vZ917demoAYA', 'Aya Nakamura', 'pop',
    'Chanteuse franco-malienne révélée par Djadja (2018), qui mêle pop, R&B et afro.',
    'https://picsum.photos/seed/vybe-aya/800/800'),
  ('K8vZ917demoTAY', 'Tayc', 'rnb',
    'Chanteur de R&B et d''afro-love, connu pour le titre N''y pense plus (2021).',
    null),
  ('K8vZ917demoJUS', 'Justice', 'electro',
    'Duo français de musique électronique formé par Gaspard Augé et Xavier de Rosnay, connu pour D.A.N.C.E.',
    null),
  ('K8vZ917demoZAH', 'Zaho de Sagazan', 'chanson',
    'Autrice-compositrice-interprète nazairienne, révélée par l''album La Symphonie des éclairs (2023).',
    null)
) as a(external_id, name, genre, description, image_url)
join public.genres g on g.slug = a.genre
on conflict (source, external_id) do update set
  name = excluded.name,
  description = excluded.description,
  image_url = excluded.image_url,
  genre_id = excluded.genre_id;

-- ---------------------------------------------------------------------------
-- Concerts (inventés) : 2 passés + 55 sur les 3 prochains mois, tous les statuts.
-- Colonnes : identifiant, nom, salle, genre, statut, jour (relatif), heure,
--            heure à confirmer, prix min, prix max, description.
-- ---------------------------------------------------------------------------

insert into public.events (
  name, type, status, venue_id, genre_id, starts_at, time_tba, timezone, on_sale_at,
  ticket_url, price_min, price_max, currency, description, source, external_id
)
select
  e.name,
  'concert',
  e.status::public.event_status,
  v.id,
  g.id,
  pg_temp.at_paris(e.day, e.local_time::time),
  e.time_tba,
  'Europe/Paris',
  -- Billetterie ouverte 60 jours avant ; pour un concert « annoncé », elle ouvre plus tard.
  case when e.status = 'announced'
    then pg_temp.at_paris(e.day - 30, '10:00')
    else pg_temp.at_paris(e.day - 60, '10:00')
  end,
  'https://example.com/billetterie/' || e.external_id,  -- lien factice
  e.price_min,
  e.price_max,
  'EUR',
  e.description,
  'demo',
  e.external_id
from (values
  ('vvG1demo0001', 'Bekar', 'STX', 'rap', 'past', -20, '20:00', false, 32.00, 32.00, 'Ouverture des portes à 19h. Concert debout.'),
  ('vvG1demo0002', 'Gazo', 'ZPA', 'rap', 'past', -6, '20:00', false, 45.00, 65.00, null),
  ('vvG1demo0003', 'So La Lune', 'STX', 'rap', 'sold_out', 3, '20:00', false, 30.00, 30.00, 'Ouverture des portes à 19h. Concert debout.'),
  ('vvG1demo0004', 'Josman', 'OLY', 'rap', 'on_sale', 5, '20:30', false, 39.00, 55.00, 'Fosse debout et balcon assis.'),
  ('vvG1demo0005', 'Ninho', 'ZNA', 'rap', 'on_sale', 6, '20:00', false, 42.00, 69.00, 'Ouverture des portes à 18h30. Fosse debout et gradins assis.'),
  ('vvG1demo0006', 'Bekar', 'AER', 'rap', 'sold_out', 8, '20:00', false, 28.00, 28.00, null),
  ('vvG1demo0007', 'Hamza', 'ACC', 'rap', 'on_sale', 10, '20:00', false, 49.00, 99.00, 'Fosse debout, places assises numérotées en gradins.'),
  ('vvG1demo0008', 'So La Lune', 'TRA', 'rap', 'on_sale', 12, '20:00', false, 33.00, 33.00, null),
  ('vvG1demo0009', 'PLK', 'EJU', 'rap', 'cancelled', 13, '20:30', false, 30.00, 30.00, 'Concert annulé. Remboursement auprès du point de vente.'),
  ('vvG1demo0010', 'Gazo', 'ZLI', 'rap', 'on_sale', 15, '20:00', false, 45.00, 65.00, null),
  ('vvG1demo0011', 'SDM', 'DOM', 'rap', 'on_sale', 17, '20:00', false, 39.00, 59.00, 'Ouverture des portes à 19h.'),
  ('vvG1demo0012', 'Aya Nakamura', 'ARK', 'pop', 'on_sale', 19, '20:00', false, 55.00, 89.00, 'Fosse debout et gradins assis.'),
  ('vvG1demo0013', 'Theodora', 'CIG', 'rap', 'sold_out', 20, '20:00', false, 35.00, 35.00, null),
  ('vvG1demo0014', 'Laylow', 'ZTO', 'rap', 'postponed', 22, '20:00', false, 42.00, 62.00, 'Date reportée : les billets restent valables pour la nouvelle date.'),
  ('vvG1demo0015', 'Josman', 'STX', 'rap', 'on_sale', 24, '20:00', false, 29.00, 29.00, 'Ouverture des portes à 19h. Concert debout.'),
  ('vvG1demo0016', 'Damso', 'HTG', 'rap', 'on_sale', 26, '20:00', false, 49.00, 79.00, null),
  ('vvG1demo0017', 'Tayc', 'ZPA', 'rnb', 'on_sale', 27, '20:00', false, 45.00, 75.00, 'Fosse debout et gradins assis.'),
  ('vvG1demo0018', 'Werenoi', 'ZNA', 'rap', 'on_sale', 29, '20:00', false, 45.00, 65.00, null),
  ('vvG1demo0019', 'Zaho de Sagazan', 'OLY', 'chanson', 'sold_out', 31, '20:30', false, 42.00, 58.00, null),
  ('vvG1demo0020', 'Justice', 'AER', 'electro', 'on_sale', 33, '20:00', false, 38.00, 38.00, 'Ouverture des portes à 19h. Concert debout.'),
  ('vvG1demo0021', 'Hamza', 'ZTO', 'rap', 'on_sale', 35, '20:00', false, 42.00, 62.00, null),
  ('vvG1demo0022', 'Tiakola', 'DOM', 'rap', 'on_sale', 37, '20:00', false, 39.00, 59.00, null),
  ('vvG1demo0023', 'PLK', 'TRA', 'rap', 'on_sale', 38, '20:00', false, 32.00, 32.00, 'Ouverture des portes à 19h.'),
  ('vvG1demo0024', 'Ninho', 'ARK', 'rap', 'on_sale', 40, '20:00', false, 49.00, 79.00, null),
  ('vvG1demo0025', 'Tayc', 'STX', 'rnb', 'on_sale', 42, '20:00', false, null, null, null),
  ('vvG1demo0026', 'Gazo & Tiakola', 'ACC', 'rap', 'on_sale', 44, '20:00', false, 55.00, 109.00, 'Fosse debout, places assises numérotées en gradins.'),
  ('vvG1demo0027', 'SDM', 'ZLI', 'rap', 'on_sale', 46, '20:00', false, 42.00, 62.00, null),
  ('vvG1demo0028', 'Bekar', 'EJU', 'rap', 'announced', 48, '20:30', false, null, null, null),
  ('vvG1demo0029', 'Aya Nakamura', 'ZNA', 'pop', 'on_sale', 50, '20:00', false, 49.00, 85.00, null),
  ('vvG1demo0030', 'Werenoi', 'HTG', 'rap', 'announced', 52, '20:00', false, null, null, null),
  ('vvG1demo0031', 'Zola', 'CIG', 'rap', 'announced', 55, '20:00', true, null, null, null),
  ('vvG1demo0032', 'Laylow', 'ZPA', 'rap', 'on_sale', 57, '20:00', false, 45.00, 69.00, null),
  ('vvG1demo0033', 'Tayc', 'DOM', 'rnb', 'cancelled', 59, '20:00', false, 40.00, 60.00, 'Concert annulé. Remboursement auprès du point de vente.'),
  ('vvG1demo0034', 'Zaho de Sagazan', 'STX', 'chanson', 'on_sale', 61, '20:00', false, 34.00, 34.00, null),
  ('vvG1demo0035', 'Justice', 'ARK', 'electro', 'announced', 64, '20:00', false, null, null, null),
  ('vvG1demo0036', 'Theodora', 'AER', 'rap', 'on_sale', 66, '20:00', false, 30.00, 30.00, null),
  ('vvG1demo0037', 'Josman', 'ZTO', 'rap', 'on_sale', 69, '20:00', false, 42.00, 62.00, null),
  ('vvG1demo0038', 'Damso', 'ACC', 'rap', 'announced', 72, '20:00', true, null, null, null),
  ('vvG1demo0039', 'Zola', 'TRA', 'rap', 'postponed', 75, '20:00', false, 32.00, 32.00, 'Date reportée : les billets restent valables pour la nouvelle date.'),
  ('vvG1demo0040', 'Werenoi', 'ZNA', 'rap', 'announced', 79, '20:00', false, null, null, null),
  ('vvG1demo0041', 'Ninho', 'ZLI', 'rap', 'announced', 83, '20:00', false, null, null, null),
  ('vvG1demo0042', 'So La Lune', 'OLY', 'rap', 'announced', 87, '20:30', false, null, null, null),
  -- V1.2 : concerts dans les villes proches (filtre par rayon, « près de moi »).
  ('vvG1demo0043', 'Bekar', 'VIP', 'rap', 'on_sale', 4, '20:30', false, 25.00, 25.00, 'Ouverture des portes à 19h30. Concert debout.'),
  ('vvG1demo0044', 'Theodora', 'CHA', 'rap', 'on_sale', 9, '20:30', false, 27.00, 27.00, null),
  ('vvG1demo0045', 'Zola', 'LIB', 'rap', 'sold_out', 11, '20:00', false, 35.00, 35.00, null),
  ('vvG1demo0046', 'Ninho', 'LDA', 'rap', 'on_sale', 16, '20:00', false, 49.00, 119.00, 'Fosse debout, places assises numérotées en gradins.'),
  ('vvG1demo0047', 'Josman', 'CHA', 'rap', 'on_sale', 21, '20:30', false, 29.00, 29.00, null),
  ('vvG1demo0048', 'Laylow', 'LIB', 'rap', 'on_sale', 25, '20:00', false, 38.00, 38.00, null),
  ('vvG1demo0049', 'So La Lune', 'VIP', 'rap', 'on_sale', 30, '20:30', false, 26.00, 26.00, null),
  ('vvG1demo0050', 'Aya Nakamura', 'LDA', 'pop', 'sold_out', 34, '20:00', false, 55.00, 129.00, null),
  ('vvG1demo0051', 'Justice', 'LIB', 'electro', 'on_sale', 39, '20:00', false, 42.00, 42.00, 'Ouverture des portes à 19h. Concert debout.'),
  ('vvG1demo0052', 'Tiakola', 'VIP', 'rap', 'postponed', 43, '20:30', false, 28.00, 28.00, 'Date reportée : les billets restent valables pour la nouvelle date.'),
  ('vvG1demo0053', 'Zaho de Sagazan', 'VIP', 'chanson', 'on_sale', 47, '20:00', false, 30.00, 30.00, null),
  ('vvG1demo0054', 'Gazo', 'LDA', 'rap', 'announced', 53, '20:00', false, null, null, null),
  ('vvG1demo0055', 'SDM', 'CHA', 'rap', 'cancelled', 58, '20:30', false, 30.00, 30.00, 'Concert annulé. Remboursement auprès du point de vente.'),
  ('vvG1demo0056', 'Tayc', 'LIB', 'rnb', 'on_sale', 63, '20:00', false, null, null, null),
  ('vvG1demo0057', 'Hamza', 'CHA', 'rap', 'announced', 76, '20:30', true, null, null, null)
) as e(external_id, name, venue, genre, status, day, local_time, time_tba, price_min, price_max, description)
join public.venues v on v.source = 'demo' and v.external_id = 'KovZpZAdemo' || e.venue
join public.genres g on g.slug = e.genre
on conflict (source, external_id) do update set
  name = excluded.name,
  status = excluded.status,
  venue_id = excluded.venue_id,
  genre_id = excluded.genre_id,
  starts_at = excluded.starts_at,
  time_tba = excluded.time_tba,
  on_sale_at = excluded.on_sale_at,
  ticket_url = excluded.ticket_url,
  price_min = excluded.price_min,
  price_max = excluded.price_max,
  description = excluded.description;

-- ---------------------------------------------------------------------------
-- Programmation : têtes d'affiche, co-têtes d'affiche, premières parties, invités.
-- ---------------------------------------------------------------------------

insert into public.event_artists (event_id, artist_id, role, position)
select ev.id, ar.id, p.role::public.artist_role, p.position
from (values
  ('0001', 'BEK', 'headliner', 0),
  ('0002', 'GAZ', 'headliner', 0), ('0002', 'TIA', 'guest', 1),
  ('0003', 'SLL', 'headliner', 0),
  ('0004', 'JOS', 'headliner', 0), ('0004', 'BEK', 'support', 1),
  ('0005', 'NIN', 'headliner', 0),
  ('0006', 'BEK', 'headliner', 0),
  ('0007', 'HAM', 'headliner', 0),
  ('0008', 'SLL', 'headliner', 0),
  ('0009', 'PLK', 'headliner', 0),
  ('0010', 'GAZ', 'headliner', 0), ('0010', 'ZOL', 'support', 1),
  ('0011', 'SDM', 'headliner', 0),
  ('0012', 'AYA', 'headliner', 0),
  ('0013', 'THE', 'headliner', 0),
  ('0014', 'LAY', 'headliner', 0),
  ('0015', 'JOS', 'headliner', 0),
  ('0016', 'DAM', 'headliner', 0),
  ('0017', 'TAY', 'headliner', 0),
  ('0018', 'WER', 'headliner', 0), ('0018', 'THE', 'support', 1),
  ('0019', 'ZAH', 'headliner', 0),
  ('0020', 'JUS', 'headliner', 0),
  ('0021', 'HAM', 'headliner', 0), ('0021', 'SLL', 'support', 1),
  ('0022', 'TIA', 'headliner', 0),
  ('0023', 'PLK', 'headliner', 0),
  ('0024', 'NIN', 'headliner', 0),
  ('0025', 'TAY', 'headliner', 0),
  ('0026', 'GAZ', 'co_headliner', 0), ('0026', 'TIA', 'co_headliner', 1),
  ('0027', 'SDM', 'headliner', 0),
  ('0028', 'BEK', 'headliner', 0),
  ('0029', 'AYA', 'headliner', 0),
  ('0030', 'WER', 'headliner', 0),
  ('0031', 'ZOL', 'headliner', 0),
  ('0032', 'LAY', 'headliner', 0),
  ('0033', 'TAY', 'headliner', 0),
  ('0034', 'ZAH', 'headliner', 0),
  ('0035', 'JUS', 'headliner', 0),
  ('0036', 'THE', 'headliner', 0),
  ('0037', 'JOS', 'headliner', 0), ('0037', 'SLL', 'guest', 1),
  ('0038', 'DAM', 'headliner', 0),
  ('0039', 'ZOL', 'headliner', 0),
  ('0040', 'WER', 'headliner', 0), ('0040', 'BEK', 'support', 1),
  ('0041', 'NIN', 'headliner', 0),
  ('0042', 'SLL', 'headliner', 0),
  ('0043', 'BEK', 'headliner', 0),
  ('0044', 'THE', 'headliner', 0),
  ('0045', 'ZOL', 'headliner', 0),
  ('0046', 'NIN', 'headliner', 0), ('0046', 'TIA', 'guest', 1),
  ('0047', 'JOS', 'headliner', 0),
  ('0048', 'LAY', 'headliner', 0),
  ('0049', 'SLL', 'headliner', 0),
  ('0050', 'AYA', 'headliner', 0),
  ('0051', 'JUS', 'headliner', 0),
  ('0052', 'TIA', 'headliner', 0),
  ('0053', 'ZAH', 'headliner', 0),
  ('0054', 'GAZ', 'headliner', 0), ('0054', 'ZOL', 'support', 1),
  ('0055', 'SDM', 'headliner', 0),
  ('0056', 'TAY', 'headliner', 0),
  ('0057', 'HAM', 'headliner', 0), ('0057', 'BEK', 'support', 1)
) as p(event, artist, role, position)
join public.events ev on ev.source = 'demo' and ev.external_id = 'vvG1demo' || p.event
join public.artists ar on ar.source = 'demo' and ar.external_id = 'K8vZ917demo' || p.artist
on conflict (event_id, artist_id) do update set
  role = excluded.role,
  position = excluded.position;
