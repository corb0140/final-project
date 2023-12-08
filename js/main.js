import {
  FaceDetector,
  FilesetResolver,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

let faceDetector;
const runningMode = "IMAGE";

// Initialize the object detector
const initializefaceDetector = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
  );
  faceDetector = await FaceDetector.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
      delegate: "GPU",
    },
    runningMode: runningMode,
  });
};

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

            initializefaceDetector();

            document.querySelectorAll(".saved-images").forEach((evt) => {
              evt.addEventListener("click", (ev) => {
                let image = ev.target.getAttribute("data-url");
                console.log(image);

                APP.savedImageContainer.innerHTML = `
                    <div class="large-image__container">
                      <img class="detectImage" src="${image}" alt="${APP.search.value} image generated from pixabay api" crossorigin="anonymous"/>
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

                // MEDIA PIPE

                /********************************************************************
                // Demo 1: Grab a bunch of images from the page and detection them
                // upon click.
              ********************************************************************/

                const imageContainers = document.getElementsByClassName(
                  "large-image__container"
                );

                for (let imageContainer of imageContainers) {
                  imageContainer.children[0].addEventListener(
                    "load",
                    handleDetect
                  );
                }

                /**
                 * Detect faces in still images on click
                 */
                async function handleDetect(event) {
                  const highlighters =
                    event.target.parentNode.getElementsByClassName(
                      "highlighter"
                    );
                  while (highlighters[0]) {
                    highlighters[0].parentNode.removeChild(highlighters[0]);
                  }
                  const infos =
                    event.target.parentNode.getElementsByClassName("info");
                  while (infos[0]) {
                    infos[0].parentNode.removeChild(infos[0]);
                  }
                  const keyPoints =
                    event.target.parentNode.getElementsByClassName("key-point");
                  while (keyPoints[0]) {
                    keyPoints[0].parentNode.removeChild(keyPoints[0]);
                  }

                  if (!faceDetector) {
                    console.log(
                      "Wait for objectDetector to load before clicking"
                    );
                    return;
                  }

                  const ratio =
                    event.target.height / event.target.naturalHeight;
                  // faceDetector.detect returns a promise which, when resolved, is an array of Detection faces
                  const detections = faceDetector.detect(
                    event.target
                  ).detections;
                  console.log(detections);

                  displayImageDetections(detections, event.target);
                } //  handleDetect Function

                function displayImageDetections(detections, resultElement) {
                  const ratio =
                    resultElement.height / resultElement.naturalHeight;
                  console.log(ratio);

                  for (let detection of detections) {
                    // Description text
                    const p = document.createElement("p");
                    p.setAttribute("class", "info");
                    p.innerText =
                      "Confidence: " +
                      Math.round(
                        parseFloat(detection.categories[0].score) * 100
                      ) +
                      "% .";
                    // Positioned at the top left of the bounding box.
                    // Height is whatever the text takes up.
                    // Width subtracts text padding in CSS so fits perfectly.
                    p.style =
                      "left: " +
                      detection.boundingBox.originX * ratio +
                      "px;" +
                      "top: " +
                      (detection.boundingBox.originY * ratio - 30) +
                      "px; " +
                      "width: " +
                      detection.boundingBox.width * (ratio + 0.3) +
                      "px;" +
                      "height: " +
                      30 +
                      "px;";

                    const highlighter = document.createElement("div");
                    highlighter.setAttribute("class", "highlighter");
                    highlighter.style =
                      "left: " +
                      detection.boundingBox.originX * ratio +
                      "px;" +
                      "top: " +
                      detection.boundingBox.originY * ratio +
                      "px;" +
                      "width: " +
                      detection.boundingBox.width * (ratio + 0.3) +
                      "px;" +
                      "height: " +
                      detection.boundingBox.height * ratio * 1.2 +
                      "px;";
                    resultElement.parentNode.appendChild(highlighter);
                    resultElement.parentNode.appendChild(p);

                    for (let keypoint of detection.keypoints) {
                      const keypointEl = document.createElement("spam");
                      keypointEl.className = "key-point";
                      keypointEl.style.top = `${
                        keypoint.y * resultElement.height - 3
                      }px`;
                      keypointEl.style.left = `${
                        keypoint.x * resultElement.width - 3
                      }px`;
                      resultElement.parentNode.appendChild(keypointEl);
                    } //for let keypoint of keypoints
                  } //for let detection of detections
                } // display image detection
              }); //add eventListener for forEach
            }); //forEach
          }) //responses.map
        ); // promise.all
      } // if key.length
    })();
  }, // displaySavedImages: function

  errorHandler: function (err) {
    console.log(err);
  },
};

document.addEventListener("DOMContentLoaded", APP.init);
