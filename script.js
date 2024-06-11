let currentsong = new Audio();
let songs;
let currfolder;

// Function to convert seconds to minutes and seconds
function secondsTominutesseconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }
    const minutes = Math.floor(seconds / 60);
    const remainingseconds = Math.floor(seconds % 60);
    const formattedminutes = String(minutes).padStart(2, '0');
    const formattedseconds = String(remainingseconds).padStart(2, '0');
    return `${formattedminutes}:${formattedseconds}`;
}

// Fetch Songs Link From Folder
async function getsongs(folder) {
    currfolder = folder;
    try {
        let response = await fetch(`./${folder}/`);
        if (!response.ok) {
            throw new Error(`Failed to fetch songs from ${folder}`);
        }
        let text = await response.text();
        let div = document.createElement("div");
        div.innerHTML = text;
        let as = div.getElementsByTagName("a");
        songs = [];
        for (let index = 0; index < as.length; index++) {
            const element = as[index];
            if (element.href.endsWith(".mp3")) {
                songs.push(element.href.split(`/${folder}/`)[1]);
            }
        }

        // Show all the songs in the playlist
        let songUL = document.querySelector(".songlist").getElementsByTagName("ul")[0];
        songUL.innerHTML = "";
        for (const song of songs) {
            songUL.innerHTML += `<li>
                <img class="invert" src="musiclogo.svg" alt="">
                <div class="info">
                    <div class="songname"> ${song.replaceAll("%20", " ")}</div>
                    <div class="songartist"></div>
                </div>
                <div class="playnow">
                    <span>Play Now</span>
                    <img class="invert" src="play.svg" alt="">
                </div>
            </li>`;
        }

        // Attach event listener to each song
        Array.from(document.querySelector(".songlist").getElementsByTagName("li")).forEach(e => {
            e.addEventListener("click", element => {
                playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim());
            });
        });

        return songs;
    } catch (error) {
        console.error(error);
        // Handle the error (e.g., display an error message to the user)
    }
}


const playMusic = (track, pause = false) => {
    currentsong.src = `./${currfolder}/` + track;
    if (!pause) {
        currentsong.play();
        play.src = "pause.svg";
    }
    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
}

// Function to display albums
async function displayAlbums() {
    try {
        // Fetch the list of songs/albums
        let response = await fetch('./songs/');
        let textResponse = await response.text();

        // Parse the response to extract links
        let div = document.createElement('div');
        div.innerHTML = textResponse;
        let anchors = div.getElementsByTagName('a');
        let cardContainer = document.querySelector('.cardcontainer');
        let anchorArray = Array.from(anchors);

        // Iterate over the anchors and process each album
        for (let index = 0; index < anchorArray.length; index++) {
            const anchor = anchorArray[index];
            if (anchor.href.includes('/songs')) {
                let folder = anchor.href.split('/').slice(-2)[1];

                try {
                    // Fetch metadata for each album
                    let metaResponse = await fetch(`./songs/${folder}/info.json`);
                    if (!metaResponse.ok) {
                        throw new Error(`Failed to fetch metadata for folder: ${folder}`);
                    }

                    let metaData = await metaResponse.json();

                    // Create album card
                    let cardHTML = `
                        <div data-folder="${folder}" class="card">
                            <div class="play">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
                                    <circle cx="16" cy="16" r="16" fill="limegreen" />
                                    <path d="M12.667 14.9332V17.0668C12.667 19.0926 12.667 20.1055 13.2743 20.5149C13.8815 20.9242 14.7131 20.4713 16.3754 19.5655L18.333 18.4984C20.3332 17.4083 21.333 16.8632 21.333 16C21.333 15.1368 20.3332 14.5917 18.333 13.5016L16.3754 12.4345C14.7131 11.5287 13.8815 11.0758 13.2743 11.4851C12.667 11.8945 12.667 12.9074 12.667 14.9332Z" fill="black" />
                                </svg>
                            </div>
                            <img src="./songs/${folder}/cover.jfif" alt="${metaData.title}">
                            <h2>${metaData.title}</h2>
                            <p>${metaData.description}</p>
                        </div>`;

                    // Append the card to the container
                    cardContainer.innerHTML += cardHTML;
                } catch (metaError) {
                    console.error(`Error fetching metadata for folder ${folder}:`, metaError);
                }
            }
        }

        // Make a changable playlist with respect to cards
        Array.from(document.getElementsByClassName("card")).forEach(e => {
            e.addEventListener("click", async item => {
                songs = await getsongs(`songs/${item.currentTarget.dataset.folder}`);
                playMusic(songs[0]);
            });
        });

    } catch (error) {
        console.error('Error displaying albums:', error);
    }
}

// Main function
async function main() {
    // Get the list of all the songs
    await getsongs("songs/SHUB");
    playMusic(songs[0], true);

    // Display all the cards or album on the home page
    displayAlbums();

    // Attach event listener to next, play, and previous buttons
    play.addEventListener("click", () => {
        if (currentsong.paused) {
            currentsong.play();
            play.src = "pause.svg";
        } else {
            currentsong.pause();
            play.src = "play.svg";
        }
    });

    // Time update & seekbar auto moving function
    currentsong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${secondsTominutesseconds(currentsong.currentTime)}/${secondsTominutesseconds(currentsong.duration)}`;
        document.querySelector(".circle").style.left = (currentsong.currentTime / currentsong.duration) * 100 + "%";
    });

    // Make controllable seekbar
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentsong.currentTime = ((currentsong.duration) * percent) / 100;
    });

    // Make hamburger functional
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    // Make next and previous buttons functional
    previous.addEventListener("click", () => {
        let index = songs.indexOf(currentsong.src.split("/").slice(-1)[0]);
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1]);
        }
    });

    next.addEventListener("click", () => {
        currentsong.pause();
        let index = songs.indexOf(currentsong.src.split("/").slice(-1)[0]);
        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1]);
        }
    });

    // Make volume button functional
    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        currentsong.volume = parseInt(e.target.value) / 100;
        if (currentsong.volume > 0) {
            document.querySelector(".volumebtn>img").src = document.querySelector(".volumebtn>img").src.replace("mute.svg", "volume.svg");
        }
    });

    // Make mute button functional
    document.querySelector(".volumebtn>img").addEventListener("click", e => {
                if (e.target.src.includes("volume.svg")) {
                    e.target.src = e.target.src.replace("volume.svg", "mute.svg");
                    currentsong.volume = 0;
                    document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
                } else {
                    currentsong.volume = 0.4;
                    e.target.src = e.target.src.replace("mute.svg", "volume.svg");
                    document.querySelector(".range").getElementsByTagName("input")[0].value = 40;
                }
            });
        }

        // Initialize the music player
        main();
