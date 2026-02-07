SELECT AVG(rating) FROM ratings, movies WHERE ratings.movie_id = movies.id AND year = 2012;
