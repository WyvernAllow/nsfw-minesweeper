document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const difficulty = params.get('difficulty');

    let width;
    let height;
    let mineCount;

    switch (difficulty) {
        case 'easy':
            width = 10;
            height = 10;
            mineCount = 10;
            break;
        case 'medium':
            width = 15;
            height = 15;
            mineCount = 30;
            break;
        case 'hard':
            width = 20;
            height = 20;
            mineCount = 60;
            break;
        case 'very-hard':
            width = 25;
            height = 25;
            mineCount = 100;
            break;
        default:
            width = 10;
            height = 10;
            mineCount = 10;
            break;
    }

    let minefield = document.getElementById("minefield");
    let minefieldContainer = document.getElementById("minefieldContainer");

    let cells = [];
    let startTime;

    const owner = 'WyvernAllow';
    const repo = 'nsfw-minesweeper';
    const path = 'images';

    let availableImages = [];

    async function fetchImages() {
        try {
            const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`);
            const files = await response.json();
            files.forEach(file => {
                console.log(file.download_url);
                availableImages.push(file.download_url);
            });
        } catch (error) {
            console.error('Error:', error);
        }
    }

    await fetchImages();
    initMinefield();

    function initMinefield() {
        startTime = performance.now();

        for (let x = 0; x < width; x++) {
            cells[x] = [];
            for (let y = 0; y < height; y++) {
                cells[x][y] = {
                    isMine: false,
                    revealed: false,
                    flagged: false,
                    count: 0,
                };
            }
        }

        placeMines();
        calculateCounts();

        minefield.style.gridTemplateRows = `repeat(${width}, 1fr)`;
        minefield.style.gridTemplateColumns = `repeat(${height}, 1fr)`;

        minefield.classList.remove("disabled");
        minefield.classList.remove("won");

        let imageUrl = availableImages[Math.floor(Math.random() * availableImages.length)];

        console.log(`Selected image: ${imageUrl}`);

        minefieldContainer.style.backgroundImage = `url(${imageUrl})`;

        renderMinefield();
    }

    function inBounds(x, y) {
        return x >= 0 && x < width && y >= 0 && y < height;
    }

    function placeMines() {
        let minesPlaced = 0;
        while (minesPlaced < mineCount) {
            const x = Math.floor(Math.random() * width);
            const y = Math.floor(Math.random() * height);

            if (!cells[x][y].isMine) {
                cells[x][y].isMine = true;
                minesPlaced++;
            }
        }
    }

    function calculateCounts() {
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                if (!cells[x][y].isMine) {
                    cells[x][y].count = countAdjacentMines(x, y);
                }
            }
        }
    }

    function countAdjacentMines(x, y) {
        let count = 0;

        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) {
                    continue;
                }

                const nx = x + dx;
                const ny = y + dy;

                if (inBounds(nx, ny) && cells[nx][ny].isMine) {
                    count++;
                }
            }
        }

        return count;
    }

    function checkForWin() {
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                if (!cells[x][y].isMine && !cells[x][y].revealed) {
                    return false;
                }
            }
        }
        return true;
    }

    function revealMines() {
        cells.forEach(row => row.forEach(cell => cell.isMine && (cell.revealed = true)));
        renderMinefield();

        minefield.classList.add("disabled");
        minefieldContainer.style.backgroundImage = "none";
    }

    function revealCell(x, y) {
        const queue = [[x, y]];

        while (queue.length > 0) {
            const [cx, cy] = queue.shift();

            if (!inBounds(cx, cy) || cells[cx][cy].revealed || cells[cx][cy].flagged) {
                continue;
            }

            cells[cx][cy].revealed = true;

            if (cells[cx][cy].isMine) {
                revealMines();

                setTimeout(() => {
                    initMinefield();
                    renderMinefield();
                }, 2000);

                return;
            }

            if (cells[cx][cy].count === 0) {
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        if (dx === 0 && dy === 0) continue;

                        const nx = cx + dx;
                        const ny = cy + dy;

                        if (inBounds(nx, ny) && !cells[nx][ny].revealed && !cells[nx][ny].flagged) {
                            queue.push([nx, ny]);
                        }
                    }
                }
            }
        }

        renderMinefield();

        if (checkForWin()) {
            minefield.classList.add("won");

            const endTime = performance.now();
            const elapsedTime = ((endTime - startTime) / 1000).toFixed(2);

            setTimeout(() => {
                alert(`You finished in ${elapsedTime} seconds`);
                initMinefield();
                renderMinefield();
            }, 4000);
        }
    }

    function toggleFlag(x, y) {
        if (!cells[x][y].revealed) {
            cells[x][y].flagged = !cells[x][y].flagged;
            renderMinefield();
        }
    }

    function renderMinefield() {
        minefield.innerHTML = '';

        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const cell = document.createElement("div");
                cell.classList.add('cell');

                if (cells[x][y].isMine) {
                    cell.classList.add('mine');
                    cell.textContent = '💣';
                }

                if (cells[x][y].revealed) {
                    cell.classList.add('revealed');

                    if (cells[x][y].isMine) {
                        cell.classList.add('mine');
                        cell.textContent = '💣';
                    }
                    else if (cells[x][y].count > 0) {
                        cell.textContent = cells[x][y].count;
                    }
                }
                else if (cells[x][y].flagged) {
                    cell.classList.add("flagged");
                    cell.textContent = "🚩";
                }

                cell.addEventListener("click", () => {
                    revealCell(x, y);
                });

                cell.addEventListener("contextmenu", (e) => {
                    e.preventDefault();
                    toggleFlag(x, y);
                });

                minefield.append(cell);
            }
        }
    }
});
