(function () {
    const second = 1000,
          minute = second * 60,
          hour = minute * 60,
          day = hour * 24;
  
    let birthday = "Oct 22, 2023 00:00:00",
        countDown = new Date(birthday).getTime(),
        x = setInterval(function() {    
  
          let now = new Date().getTime(),
              distance = countDown - now;
  
          document.getElementById("days").innerText = Math.floor(distance / (day)),
            document.getElementById("hours").innerText = Math.floor((distance % (day)) / (hour)),
            document.getElementById("minutes").innerText = Math.floor((distance % (hour)) / (minute)),
            document.getElementById("seconds").innerText = Math.floor((distance % (minute)) / second);
  
          //do something later when date is reached
          if (distance < 0) {
            let headline = document.getElementById("headline"),
                countdown = document.getElementById("countdown"),
                content = document.getElementById("content");
  
            headline.innerText = "It's my birthday!";
            countdown.style.display = "none";
            content.style.display = "block";
  
            clearInterval(x);
          }
          //seconds
        }, 0)
    }());

    let stars = document.querySelectorAll(".star-rating > input");
stars.forEach((star) => {
  star.addEventListener("change", function () {
    const currentMovieId = getCurrentMovieId();
    recommendMovie(currentMovieId);
  });
});
// you don't see this
const defNotAnApiKey = "api_key=9fddc301020c49832dc42de3d0ad73ac";
const apiKey = defNotAnApiKey;
const readAccessToken =
  "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI5ZmRkYzMwMTAyMGM0OTgzMmRjNDJkZTNkMGFkNzNhYyIsInN1YiI6IjY0OTFkYTU1MjYzNDYyMDBjYTFiZGJlYSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.42ZUfwtuaLCA3JralYrP668FQlioaqV2iYm5EhX3a44";//
const base_url = "https://api.themoviedb.org/3";
const img_url = "https://image.tmdb.org/t/p/w500/";
const def = "/discover/movie?include_adult=false&sort_by=popularity.desc&";
const main_api = base_url + def + apiKey;
const options = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: readAccessToken,
  },
};

function fetchMovieDetails(movieId) {
  return fetch(
    `${base_url}/movie/${movieId}?include_adult=false&language=en-US&append_to_response=credits`,
    options
  )
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .catch((err) => console.error(err));
}

function fetchSimilarMovies(movieId, page = 1) {
  return fetch(
    `${base_url}/movie/${movieId}/recommendations?include_adult=false&language=en-US&page=${page}`,
    options
  )
    .then((response) => response.json())
    .catch((err) => console.error(err));
}

function fetchDifferentGenreMovies(genreId, page = 1) {
  return fetch(
    `https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=en-US&page=${page}&sort_by=popularity.desc&without_genres=${genreId}`,
    options
  )
    .then((response) => response.json())
    .catch((err) => console.error(err));
}

function displayMovie(movieId) {
  fetchMovieDetails(movieId)
    .then((movie) => {
      setCurrentMovieId(movie.id);
      const movieTitle = document.getElementById("movie-display-title");
      movieTitle.innerText = `${movie.title}`;
      const movieImage = document.getElementById("movie-display-image");
      if (movie.poster_path === null || movie.poster_path.includes("/null")) {
        movieImage.src = "https://via.placeholder.com/500x700";
      } else {
        movieImage.src = img_url + movie.poster_path;
      }
      console.log(`The movie is: ${movie.title}`);
      if (!alreadyRecommendedMovies.includes(movie.id)) {
        alreadyRecommendedMovies.push(movie.id);
      }
    })
    .catch((error) => console.error("Error:", error));
}

displayMovie(getCurrentMovieId());

function getCurrentMovieId() {
  const movieId = document.getElementById("current-movie-id").value;
  return movieId || "8392";
}

function setCurrentMovieId(movieId) {
  document.getElementById("current-movie-id").value = movieId;
}

let alreadyRecommendedMovies = [];
const genreIds = [18, 35, 80, 28, 10749];

let genreIndex = 0;

function fetchMoviesFromSameDirector(director, page = 1) {
  if (director) {
    const directorName = encodeURIComponent(director);
    return fetch(
      `https://api.themoviedb.org/3/search/person?query=${directorName}`,
      options
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.results.length > 0) {
          const directorId = data.results[0].id;
          return fetch(
            `${base_url}/person/${directorId}/movie_credits?page=${page}`,
            options
          )
            .then((response) => response.json())
            .then((data) => ({
              results: data.crew.filter((credit) => credit.job === "Director"),
            }));
        }
        return Promise.resolve({ results: [] });
      })
      .catch((err) => console.error(err));
  } else {
    console.error("No director name provided");
    return Promise.reject("No director name provided");
  }
}

function fetchRandomMovieFromSameGenre(genreId, page = 1) {
  return fetch(
    `${base_url}/discover/movie?with_genres=${genreId}&page=${page}`,
    options
  )
    .then((response) => response.json())
    .catch((err) => console.error(err));
}

function recommendMovie(movieId) {
  fetchMovieDetails(movieId)
    .then((movie) => {
      let userRating = getUserRating();
      if (userRating === "good") {
        if (movie.credits && movie.credits.crew) {
          let director = movie.credits.crew.find(
            (member) => member.job === "Director"
          );
          if (director) {
            fetchMoviesFromSameDirector(director.name)
              .then((movies) => {
                if (movies.results.length > 0) {
                  processMovies(movies, userRating);
                } else {
                  console.log(
                    `No more movies from director ${director.name}. Trying movies from same genre.`
                  );
                  let genreId =
                    movie.genres && movie.genres[0]
                      ? movie.genres[0].id
                      : genreIds[genreIndex];
                  fetchRandomMovieFromSameGenre(genreId)
                    .then((movies) => {
                      if (movies.results.length > 0) {
                        processMovies(movies, userRating);
                      } else {
                        console.log(
                          `No more movies from genre ${genreId}. Trying highly rated movies.`
                        );
                      }
                    })
                    .catch((error) => console.error("Error:", error));
                }
              })
              .catch((error) => console.error("Error:", error));
          } else {
            fetchSimilarMovies(movieId)
              .then((movies) => processMovies(movies, userRating))
              .catch((error) => console.error("Error:", error));
          }
        }
      } else if (userRating === "ok") {
        let genreId =
          movie.genres && movie.genres[0]
            ? movie.genres[0].id
            : genreIds[genreIndex];

        fetchRandomMovieFromSameGenre(genreId)
          .then((movies) => processMovies(movies, userRating))
          .catch((error) => console.error("Error:", error));
      } else {
        const differentGenreId = genreIds[genreIndex];
        genreIndex = (genreIndex + 1) % genreIds.length;

        fetchDifferentGenreMovies(differentGenreId, 1)
          .then((movies) => processMovies(movies, userRating))
          .catch((error) => console.error("Error:", error));
      }
    })
    .catch((error) => console.error("Error:", error));
}

let genreTried = [];

let genrePageNumbers = {
  18: 1, // Genre ID for 'Drama'
  35: 1, // Genre ID for 'Comedy'
  80: 1, // Genre ID for 'Crime'
  28: 1, // Genre ID for 'Action'
  10749: 1, // Genre ID for 'Romance'
};

function fetchNextGenreMovies(movieId, userRating) {
  const differentGenreId = genreIds[genreIndex];
  genreTried.push(differentGenreId);
  genreIndex = (genreIndex + 1) % genreIds.length;

  fetchDifferentGenreMovies(differentGenreId, genrePageNumbers[differentGenreId])
    .then((movies) => {
      processMovies(movies, userRating, movieId);
      genrePageNumbers[differentGenreId] += 1;
    })
    .catch((error) => console.error("Error:", error));
}

function processMovies(movies, userRating, movieId) {
  if (movies.results.length > 0) {
    let recommendedMovie;
    const newMovies = movies.results.filter(
      (movie) => !alreadyRecommendedMovies.includes(movie.id)
    );
    if (newMovies.length === 0) {
      if (genreTried.length >= genreIds.length) {
        console.log("All genres have been tried. Trying next page...");
        genreTried = [];
        fetchNextGenreMovies(movieId, userRating);
      } else {
        console.log(
          "No new recommendations available. Trying next page in different genre..."
        );
        fetchNextGenreMovies(movieId, userRating);
      }
      return;
    }

    if (userRating === "good") {
      recommendedMovie = newMovies[0];
    } else if (userRating === "ok") {
      recommendedMovie =
        newMovies[Math.floor(newMovies.length / 2)] || newMovies[0];
    } else {
      recommendedMovie = newMovies[newMovies.length - 1];
    }
    alreadyRecommendedMovies.push(recommendedMovie.id);
    displayMovie(recommendedMovie.id);
    resetStarRating();
  } else {
    console.log("No similar movies found. Trying from different genre...");
    fetchNextGenreMovies(movieId, userRating);
  }
}

function getUserRating() {
  const ratingInputs = document.querySelectorAll(".star-rating > input");
  for (let i = 0; i < ratingInputs.length; i++) {
    if (ratingInputs[i].checked) {
      const rating = ratingInputs[i].value;
      if (rating >= 4) {
        return "good";
      } else if (rating >= 2) {
        return "ok";
      } else {
        return "bad";
      }
    }
  }
  resetStarRating();
  return "ok";
}

function resetStarRating() {
  const ratingInputs = document.querySelectorAll(".star-rating > input");
  for (let i = 0; i < ratingInputs.length; i++) {
    ratingInputs[i].checked = false;
  }
}
