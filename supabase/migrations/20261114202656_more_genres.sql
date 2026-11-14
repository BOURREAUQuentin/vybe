-- V1.1 : genres supplémentaires pour le catalogue réel (sonde Ticketmaster du 14/11/2026 : la moitié
-- des concerts — rock, metal, reggae, jazz… — n'avait aucun genre Vybe). Le rap reste mis en avant
-- dans l'app ; ces genres servent surtout aux filtres et à « Par genre ».

insert into public.genres (slug, name) values
  ('rock', 'Rock'),
  ('metal', 'Metal'),
  ('reggae', 'Reggae'),
  ('jazz-blues', 'Jazz & Blues'),
  ('monde', 'Musiques du monde'),
  ('classique', 'Classique')
on conflict (slug) do update set name = excluded.name;

-- Correspondances Ticketmaster → Vybe. « Rock / Pop » (sous-genre Pop rangé sous Rock par
-- Ticketmaster) reste du rock ; « Music », « Religious », « Undefined » restent sans genre.
insert into public.genre_mappings (source, external_genre, external_sub_genre, genre_id)
select 'ticketmaster', m.external_genre, m.external_sub_genre, g.id
from (values
  ('Rock', null, 'rock'),
  ('Metal', null, 'metal'),
  ('Reggae', null, 'reggae'),
  ('Jazz', null, 'jazz-blues'),
  ('Blues', null, 'jazz-blues'),
  ('World', null, 'monde'),
  ('Classical', null, 'classique')
) as m(external_genre, external_sub_genre, slug)
join public.genres g on g.slug = m.slug
on conflict do nothing;
