// APP OBJECT
const APP = {
  cache: null,
  imagesGrid: document.getElementById("image-grid"),
  searchedImageContainer: document.getElementById("dialog--searched-box"),
  searchedImageBg: document.querySelector(".searched-image__Bg"),
  savedImageContainer: document.getElementById("dialog--saved-box"),
  savedImageBg: document.querySelector(".saved-image__Bg"),
  searchForm: document.getElementById("search__form"),
  search: document.getElementById("search"),
  savedBtn: document.getElementById("saved-button"),
  openSearchBtn: document.getElementById("search-button"),
  cancelSearchBtn: document.getElementById("cancel-button"),
  searchContainerBg: document.querySelector(".search"),
  dialogSearchBox: document.getElementById("dialog--search-box"),
  api: "https://pixabay.com/api/",
  apiKey: "40879213-d0a85543f4a4d2ff2e86c18c6",

  init: function () {
    APP.searchForm.addEventListener("submit", (ev) => {
      ev.preventDefault();

      APP.fetchData();
      APP.searchForm.reset();
    });

    APP.openSearchBtn.addEventListener("click", () => {
      APP.searchContainerBg.style.display = "block";
      APP.dialogSearchBox.style.display = "flex";
    });

    APP.cancelSearchBtn.addEventListener("click", () => {
      APP.searchContainerBg.style.display = "none";
      APP.dialogSearchBox.style.display = "none";
    });

    APP.savedBtn.addEventListener("click", () => {
      console.log("connected");

      APP.imagesGrid.innerHTML = "";
      APP.displaySavedImages();
    });
  },

  // FETCH DATA FUNCTION
  fetchData: function () {
    const apiUrl = `${APP.api}?key=${
      APP.apiKey
    }&q=${APP.search.value.trim()}&category=people&per_page=50&image_type=photo&orientation=horizontal`;

    // RESET
    APP.searchContainerBg.style.display = "none";
    APP.dialogSearchBox.style.display = "none";
    APP.imagesGrid.innerHTML = `<p class="image-results">Results for ${APP.search.value}</p>`;

    // FETCH API
    fetch(apiUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Network has found an error: ${response.status}`);
        }

        return response.json();
      })
      .then((data) => {
        console.log(data);

        data.hits.forEach((image) => {
          APP.imagesGrid.innerHTML += `
        <img class="image__item" src="${image.largeImageURL}" alt="${APP.search.value} image generated from pixabay api" data-id="${image.id}"/>
            `;

          // SELECT TARGET ON CLICK
          document.querySelectorAll(".image__item").forEach((evt) => {
            evt.addEventListener("click", (ev) => {
              let id = ev.target.getAttribute("data-id");

              // FETCH LARGE IMAGE BY ID ON TARGET
              const apiId = `${APP.api}?key=${
                APP.apiKey
              }&q=${APP.search.value.trim()}&id=${id}`;

              fetch(apiId)
                .then((response) => {
                  if (!response.ok) {
                    throw new Error("Network Error Found: " + response.status);
                  }
                  return response.json();
                })
                .then((data) => {
                  // console.log(data);

                  APP.searchedImageContainer.innerHTML = `
                  <div class="large-image__container">
                    <img src="${data.hits[0].largeImageURL}" alt="${APP.search.value} image generated from pixabay api" />
                  </div>

                  <div class="large-image__buttons">
                    <button class="save-image__btn btn">Save</button>
                    <button class="cancel-search__btn btn">Cancel</button>
                  </div>
                `;

                  const cancelImageBtn = document.querySelector(
                    ".cancel-search__btn"
                  );
                  const saveImageBtn =
                    document.querySelector(".save-image__btn");

                  APP.searchedImageContainer.style.display = "block";
                  APP.searchedImageBg.style.display = "block";

                  cancelImageBtn.addEventListener("click", () => {
                    APP.searchedImageContainer.style.display = "none";
                    APP.searchedImageBg.style.display = "none";
                    APP.searchedImageContainer.innerHTML = "";
                  });

                  // CACHE
                  let image = data.hits[0].largeImageURL;

                  saveImageBtn.addEventListener("click", () => {
                    caches
                      .open("my-cache")
                      .then((cache) => {
                        let url = new URL(image, location.origin);
                        cache.add(url);
                        // console.log(url);

                        APP.searchedImageContainer.style.display = "none";
                        APP.searchedImageBg.style.display = "none";
                      })
                      .catch((err) => {
                        err.error;
                      });
                  });

                  APP.search.value = "";
                })
                .catch((error) => {
                  APP.errorHandler(error);
                });
            });
          });
        });
      })
      .catch((error) => {
        APP.errorHandler(error);
      });
  },

  displaySavedImages: function async() {
    (async () => {
      if (!APP.cache) {
        APP.cache = await caches.open("my-cache");
      }

      let keys = await APP.cache.keys();
      // console.log(keys);

      if (keys.length < 1) {
        APP.imagesGrid.innerHTML = `<p class="image-results">No Saved Images</p>`;
      }

      if (keys.length > 0) {
        let url = Promise.all(keys.map((keys) => APP.cache.match(keys)));
        // console.log(url);

        // response
        let responses = await url;
        // console.log(responses);

        Promise.all(
          responses.map((response) => {
            APP.imagesGrid.innerHTML += `
             <img class="saved-images" src="${response.url}" alt="image generated from pixabay api" data-url="${response.url}"/>
                  `;

            document.querySelectorAll(".saved-images").forEach((evt) => {
              evt.addEventListener("click", (ev) => {
                let image = ev.target.getAttribute("data-url");

                APP.savedImageContainer.innerHTML = `
                    <div class="large-image__container">
                      <img src="${image}" alt="${APP.search.value} image generated from pixabay api" />
                    </div>

                    <div class="large-image__buttons">
                      <button class="cancel-saved__btn btn">Cancel</button>
                      <button class="delete-image__btn btn">Delete Image</button>
                    </div>
                `;

                const cancelSavedBtn =
                  document.querySelector(".cancel-saved__btn");
                const deleteImageBtn =
                  document.querySelector(".delete-image__btn");

                cancelSavedBtn.addEventListener("click", () => {
                  APP.savedImageContainer.style.display = "none";
                  APP.savedImageBg.style.display = "none";
                  APP.savedImageContainer.innerHTML = "";
                });

                deleteImageBtn.addEventListener("click", () => {
                  caches.open("my-cache").then((cache) => {
                    cache.delete(image);
                  });

                  APP.savedImageContainer.style.display = "none";
                  APP.savedImageBg.style.display = "none";

                  setTimeout(() => {
                    APP.imagesGrid.innerHTML = "";
                    APP.displaySavedImages();
                  }, 100);
                });

                APP.savedImageContainer.style.display = "block";
                APP.savedImageBg.style.display = "block";
              });
            });
          })
        );
      }
    })();
  },

  errorHandler: function (err) {
    console.log(err);
  },
};

document.addEventListener("DOMContentLoaded", APP.init);
