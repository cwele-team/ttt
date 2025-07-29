document.addEventListener('DOMContentLoaded', () => {
      console.log('=== PLAYER.JS STARTING ===');

      // Initialize video player with MediaDelivery embed
      function initializePlayer() {
        console.log('Starting MediaDelivery embed player initialization...');

        // Function to check user authentication with multiple methods
        function getCurrentUser() {
          console.log('🔍 Checking user authentication...');

          // Method 1: Use session object from shared.js
          if (
            typeof session !== 'undefined' &&
            typeof session.get === 'function'
          ) {
            const sessionUser = session.get();
            console.log('📋 Method 1 - session.get():', sessionUser);
            if (sessionUser && sessionUser.id) {
              console.log('✅ User found via session.get()');
              return sessionUser;
            }
          } else {
            console.log('❌ session object not available');
          }

          // Method 2: Direct cookie parsing
          console.log('🔍 Trying direct cookie parsing...');
          const cookies = document.cookie.split(';');
          console.log('🍪 All cookies:', cookies);

          let wfoSessionCookie = null;
          for (let cookie of cookies) {
            const trimmed = cookie.trim();
            if (trimmed.startsWith('wfo_session=')) {
              wfoSessionCookie = trimmed.substring('wfo_session='.length);
              break;
            }
          }

          if (wfoSessionCookie) {
            try {
              const user = JSON.parse(
                decodeURIComponent(
                  decodeURIComponent(decodeURIComponent(wfoSessionCookie))
                )
              );
              console.log('✅ User found via cookie parsing:', user);
              if (user && user.id) {
                return user;
              }
            } catch (e) {
              console.log('❌ Cookie parsing failed:', e.message);
            }
          }

          console.log('❌ No valid user found');
          return null;
        }

        // Get current user
        const currentUser = getCurrentUser();
        console.log('🎯 FINAL RESULT - currentUser:', currentUser);

        // Function to create MediaDelivery embed iframe
        function createVideoEmbed(embedUrl, movieTitle) {
          const videoPlayer = document.getElementById('moviePlayer');
          const videoWrapper = videoPlayer.parentElement;
          
          // Replace video element with iframe
          videoWrapper.innerHTML = `
            <div class="embed-container" style="position: relative; width: 100%; height: 0; padding-bottom: 56.25%; background: #000; border-radius: 8px; overflow: hidden;">
              <iframe 
                src="${embedUrl}" 
                title="${movieTitle}"
                style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"
                allowfullscreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share">
              </iframe>
            </div>
          `;
          
          console.log('✅ MediaDelivery embed created successfully');
        }
        
        // Function to show loading state
        function showLoadingState() {
          const videoWrapper = document.querySelector('.video-player');
          videoWrapper.innerHTML = `
            <div class="video-loading" style="display: flex; justify-content: center; align-items: center; height: 400px; background: #1a1a1a; border-radius: 8px;">
              <div style="text-align: center; color: #fff;">
                <div style="margin-bottom: 1rem;">
                  <i data-lucide="loader" style="width: 48px; height: 48px; animation: spin 1s linear infinite;"></i>
                </div>
                <p>Ładowanie odtwarzacza...</p>
              </div>
            </div>
          `;
          lucide.createIcons();
        }

        // Get movie ID from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const movieId = urlParams.get('id');
        console.log('🎬 Movie ID from URL:', movieId);

        // Make sure we have access to movies array
        const moviesArray = window.movies || [];
        console.log('🎬 Available movies:', moviesArray);

        // Find movie in our movies array
        const movie = moviesArray[movieId];
        console.log('🎬 Movie details:', movie);

        if (movie) {
          // Update page content with movie details
          document.title = `${movie.title} - WFO`;
          document.getElementById('movieTitle').textContent = movie.title;
          document.getElementById('movieRating').textContent = movie.rating;
          document.getElementById('movieYear').textContent = movie.year;
          document.getElementById('movieGenre').textContent = movie.genre;
          document.getElementById('movieDescription').textContent =
            movie.description;
          
          const movieAuthorsElement = document.getElementById('movieAuthors');
          if (movieAuthorsElement) {
            movieAuthorsElement.textContent = movie.authors ? `Autorzy: ${movie.authors}` : 'Autorzy: N/A';
          }


          console.log('🔐 Checking authentication for movie access...');
          console.log(
            '👤 Current user state:',
            currentUser ? 'LOGGED IN' : 'NOT LOGGED IN'
          );

          // Check if user is logged in first
          if (!currentUser || !currentUser.id) {
            console.log(
              '❌ User not authenticated - showing login required message'
            );
            const videoWrapper = document.querySelector('.video-player');
            videoWrapper.innerHTML = `
                    <div class="video-unavailable" style="text-align: center; padding: 60px 20px; color: #fff; background: #1a1a1a; border-radius: 10px;">
                        <div style="margin-bottom: 20px;">
                            <i data-lucide="user-x" style="width: 64px; height: 64px; color: #ff6b6b; margin-bottom: 20px;"></i>
                        </div>
                        <h3 style="margin-bottom: 15px; color: #ff6b6b;">Wymagane logowanie</h3>
                        <p style="margin-bottom: 20px; color: #ccc;">Aby obejrzeć ten film, musisz się zalogować.</p>
                        <div class="auth-buttons" style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                            <a href="Logowanie.html" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; background: #e50914; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
                                <i data-lucide="log-in" style="width: 20px; height: 20px;"></i>
                                <span>Zaloguj się</span>
                            </a>
                            <a href="index.html" class="btn btn-secondary" style="display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; background: #333; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
                                <i data-lucide="home" style="width: 20px; height: 20px;"></i>
                                <span>Powrót do strony głównej</span>
                            </a>
                        </div>
                    </div>
                `;
            lucide.createIcons();
            return;
          }

          console.log('✅ User is authenticated, checking license...');
          // Check if user has license for this movie
          const userId = currentUser.id;
          console.log('👤 User ID for license check:', userId);

          // Function to check movie license using PHP
          async function checkMovieLicense(userId, movieId) {
            try {
              console.log(
                `📞 Calling license check API for user ${userId}, movie ${movieId}`
              );
              const response = await fetch(`check_license.php?id=${movieId}`);
              const data = await response.json();
              console.log('📋 License check response:', data);
              return data.hasLicense;
            } catch (error) {
              console.error('❌ Error checking movie license:', error);
              // If there's an error checking license, deny access
              return false;
            }
          }

          // Check movie license
          const licenseCheckPromise = checkMovieLicense(userId, movieId);

          licenseCheckPromise.then((hasLicense) => {
            console.log(
              '🎫 License check result:',
              hasLicense ? 'HAS LICENSE' : 'NO LICENSE'
            );

            if (hasLicense) {
              console.log('✅ User has license - setting up player');
              
              // Show loading state
              showLoadingState();
              
              // Generate embed URL with secure token
              console.log('🎥 Generating secure embed URL for movie:', movieId);
              
              fetch(`generate_video_token.php?movieId=${movieId}`)
                .then(response => response.json())
                .then(data => {
                  if (data.success) {
                    console.log('✅ Embed URL generated:', data.embedUrl);
                    console.log('🔐 Token expires at:', data.expiresAt);
                    
                    // Create embed iframe
                    createVideoEmbed(data.embedUrl, movie.title);
                    
                    // Show token expiration warning after 45 seconds (15 seconds before expiry)
                    setTimeout(() => {
                      const notification = document.createElement('div');
                      notification.style.cssText = `
                        position: fixed;
                        top: 80px;
                        right: 20px;
                        background: rgba(255, 165, 0, 0.9);
                        color: white;
                        padding: 1rem 1.5rem;
                        border-radius: 8px;
                        z-index: 1000;
                        max-width: 300px;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                      `;
                      notification.innerHTML = `
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                          <i data-lucide="clock" style="width: 20px; height: 20px;"></i>
                          <span>Token wygasa za 15 sekund. Odśwież stronę, aby kontynuować.</span>
                        </div>
                      `;
                      document.body.appendChild(notification);
                      lucide.createIcons();
                      
                      // Auto remove after 10 seconds
                      setTimeout(() => {
                        if (notification.parentNode) {
                          notification.remove();
                        }
                      }, 10000);
                    }, 45000); // 45 seconds
                    
                  } else {
                    console.error('❌ Failed to generate embed URL:', data.error);
                    const videoWrapper = document.querySelector('.video-player');
                    videoWrapper.innerHTML = `
                      <div class="video-unavailable" style="text-align: center; padding: 60px 20px; color: #fff; background: #1a1a1a; border-radius: 10px;">
                        <div style="margin-bottom: 20px;">
                          <i data-lucide="alert-circle" style="width: 64px; height: 64px; color: #ff6b6b; margin-bottom: 20px;"></i>
                        </div>
                        <h3 style="margin-bottom: 15px; color: #ff6b6b;">Błąd odtwarzacza</h3>
                        <p style="margin-bottom: 10px; color: #ccc;">Nie udało się załadować odtwarzacza dla filmu "${movie.title}"</p>
                        <p style="color: #888; font-size: 14px;">Błąd: ${data.error}</p>
                        <button onclick="window.location.reload()" class="btn btn-primary" style="margin-top: 1rem;">
                          <i data-lucide="refresh-cw"></i>
                          <span>Spróbuj ponownie</span>
                        </button>
                      </div>
                    `;
                    lucide.createIcons();
                  }
                })
                .catch(error => {
                  console.error('❌ Error fetching embed URL:', error);
                  const videoWrapper = document.querySelector('.video-player');
                  videoWrapper.innerHTML = `
                    <div class="video-unavailable" style="text-align: center; padding: 60px 20px; color: #fff; background: #1a1a1a; border-radius: 10px;">
                      <div style="margin-bottom: 20px;">
                        <i data-lucide="wifi-off" style="width: 64px; height: 64px; color: #ff6b6b; margin-bottom: 20px;"></i>
                      </div>
                      <h3 style="margin-bottom: 15px; color: #ff6b6b;">Błąd połączenia</h3>
                      <p style="margin-bottom: 10px; color: #ccc;">Nie udało się połączyć z serwerem</p>
                      <p style="color: #888; font-size: 14px;">Sprawdź połączenie internetowe i spróbuj ponownie</p>
                      <button onclick="window.location.reload()" class="btn btn-primary" style="margin-top: 1rem;">
                        <i data-lucide="refresh-cw"></i>
                        <span>Spróbuj ponownie</span>
                      </button>
                    </div>
                  `;
                  lucide.createIcons();
                });
            } else {
              console.log(
                '❌ User needs to purchase license - showing payment options'
              );
              // Show payment required message and button
              const videoWrapper = document.querySelector('.video-player');
              videoWrapper.innerHTML = `
                        <div class="video-unavailable" style="text-align: center; padding: 60px 20px; color: #fff; background: #1a1a1a; border-radius: 10px;">
                            <div style="margin-bottom: 20px;">
                                <i data-lucide="lock" style="width: 64px; height: 64px; color: #ffa500; margin-bottom: 20px;"></i>
                            </div>
                            <h3 style="margin-bottom: 15px; color: #ffa500;">Brak licencji</h3>
                            <p style="margin-bottom: 10px; color: #ccc;">Aby obejrzeć film "<strong>${
                              movie.title
                            }</strong>", musisz wykupić dostęp.</p>
                            <p style="margin-bottom: 20px; color: #888; font-size: 14px;">Film jest dostępny w ramach płatnej subskrypcji.</p>
                            <div class="payment-options" style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                                <button class="btn btn-primary" id="purchaseButton" style="display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; background: #ffa500; color: white; border: none; border-radius: 6px; font-weight: 500; cursor: pointer;">
                                    <i data-lucide="credit-card" style="width: 20px; height: 20px;"></i>
                                    <span>Wykup dostęp</span>
                                </button>
                                <button class="btn btn-secondary" onclick="window.location.href='Filmy.html'" style="display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; background: #333; color: white; border: none; border-radius: 6px; font-weight: 500; cursor: pointer;">
                                    <i data-lucide="arrow-left" style="width: 20px; height: 20px;"></i>
                                    <span>Powrót do filmów</span>
                                </button>
                                <a href="biuro_licencje.html" class="btn btn-primary">Zgłoś się po licencję</a>
                            </div>
                        </div>
                    `;

              // Add event listener to the purchase button
              const purchaseButton = document.getElementById('purchaseButton');
              if (purchaseButton) {
                purchaseButton.addEventListener('click', () => {
                  console.log('💸 Purchase button clicked');
                  // Create form and submit to startPaymentExample.php
                  const form = document.createElement('form');
                  form.action = 'startPaymentExample.php';
                  form.method = 'POST';
                  form.style.display = 'none';

                  const movieIdInput = document.createElement('input');
                  movieIdInput.type = 'hidden';
                  movieIdInput.name = 'movieId';
                  movieIdInput.value = movieId;
                  form.appendChild(movieIdInput);

                  document.body.appendChild(form);
                  form.submit();
                });
              }

              console.log('💳 Payment options displayed');
            }
            lucide.createIcons();
          });
        } else {
          // Show error message if movie not found
          console.log('❌ Movie not found');
          const videoWrapper = document.querySelector('.video-player');
          videoWrapper.innerHTML = `
                <div class="video-unavailable">
                    <p>Film nie został znaleziony</p>
                    <p>ID filmu: ${movieId}</p>
                    <a href="index.html" class="btn btn-primary">Powrót do strony głównej</a>
                </div>
            `;
        }

        // Initialize Lucide icons
        lucide.createIcons();

        console.log(
          '🎬 MediaDelivery embed player initialization complete!'
        );
      }

      // Start the initialization
      initializePlayer();
    });
