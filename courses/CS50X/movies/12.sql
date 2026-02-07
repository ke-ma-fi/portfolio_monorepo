SELECT title FROM movies WHERE id IN (SELECT movie_id FROM stars WHERE person_id = (SELECT id FROM people WHERE name ='Bradley Cooper')) and id IN (SELECT movie_id FROM stars WHERE person_id = (SELECT id FROM people WHERE name ='Jennifer Lawrence'));

SELECT title FROM movies WHERE id IN (SELECT movie_id FROM stars, people WHERE stars.person_id = people.id AND name = 'Bradley Cooper') AND id IN (SELECT movie_id FROM stars, people WHERE stars.person_id = people.id AND name = 'Jennifer Lawrence');
