const characterSelectionScreen = document.getElementById('character-selection-screen');
const gameScreen = document.getElementById('game-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const characterCards = document.querySelectorAll('.character-card');
console.log('Character cards found:', characterCards.length);
const startGameButton = document.getElementById('start-game-button');
console.log('Start game button found:', startGameButton);
const restartGameButton = document.getElementById('restart-game-button');
const playerHealthValue = document.getElementById('player-health-value');
const opponentHealthValue = document.getElementById('opponent-health-value');
const playerNameElement = document.getElementById('player-name');
const opponentNameElement = document.getElementById('opponent-name');
const countdownElement = document.getElementById('countdown');
const playerElement = document.getElementById('player');
const opponentElement = document.getElementById('opponent');
const playerFaceElement = playerElement.querySelector('.character-face');
const opponentFaceElement = opponentElement.querySelector('.character-face');
const moveLeftButton = document.getElementById('move-left');
const moveRightButton = document.getElementById('move-right');
const punchButton = document.getElementById('punch-button');
const kickButton = document.getElementById('kick-button');
const gameResultElement = document.getElementById('game-result');
const resultAnimationElement = document.getElementById('result-animation');
const winScreen = document.getElementById('win-screen');
const winMessageElement = document.getElementById('win-message');
const playNextCharacterButton = document.getElementById('play-next-character-button');
const returnToSelectionButton = document.getElementById('return-to-selection-button');
const punchSound = document.getElementById('punch-sound');
const kickSound = document.getElementById('kick-sound');
const hitSound = document.getElementById('hit-sound');
const fightSound = document.getElementById('fight-sound');
const youwinSound = document.getElementById('youwin-sound');
const gameoverSound = document.getElementById('gameover-sound');

let selectedCharacter = null;
let playerHealth = 100;
let opponentHealth = 100;
let gameActive = false;
let playerPosition = 10; // Percentage from left
let opponentPosition = 90; // Percentage from left

let playedCharacters = []; // To keep track of characters already played
let opponentSpeedMultiplier = 1; // Multiplier for opponent speed
let currentRound = 0; // To track rounds and determine opponent speed increase
let availableOpponents = []; // Characters not yet played in the current session
let playerCharacterKey = null; // Store the key of the player's selected character

// Character data (placeholder for unique fighting characteristics)
const characters = {
    character1: { name: '공주님', img: 'assets/character1.png', feature: '빠른 주먹', color: 'red' },
    character2: { name: '뙈지', img: 'assets/character2.png', feature: '방어 특화', color: 'blue' },
    character3: { name: '새우깡', img: 'assets/character3.png', feature: '강력한 발차기', color: 'green' },
    character4: { name: '꼼땡이', img: 'assets/character4.png', feature: '콤보 전문가', color: 'yellow' },
    character5: { name: '꾸르미', img: 'assets/character5.png', feature: '소리지르기', color: 'purple' }
};

// --- Screen Management ---
function showScreen(screenId) {
    document.querySelectorAll('.game-screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// --- Character Selection Logic ---
characterCards.forEach(card => {
    console.log('Attaching click listener to character card:', card.dataset.character);
    card.addEventListener('click', () => {
        characterCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedCharacter = card.dataset.character;
        startGameButton.disabled = false;
        console.log('Character selected:', selectedCharacter, 'Start game button disabled:', startGameButton.disabled);
    });
});

startGameButton.addEventListener('click', () => {
    console.log('Start game button clicked. Selected character:', selectedCharacter);
    if (selectedCharacter) {
        playerCharacterKey = selectedCharacter; // Store the player's chosen character
        initializeGameSession(); // Initialize a new game session
        showScreen('game-screen');
        startCountdown();
    } else {
        console.log('No character selected, cannot start game.');
    }
});
console.log('Attaching click listener to start game button.');

// --- Game Initialization ---
function initializeGameSession() {
    console.log('initializeGameSession called.');
    playerHealth = 100;
    opponentHealth = 100;
    playerHealthValue.textContent = playerHealth;
    opponentHealthValue.textContent = opponentHealth;
    playerNameElement.textContent = characters[playerCharacterKey].name; // Set player name
    gameActive = false; // Game starts after countdown

    // Reset for a new game session
    playedCharacters = [playerCharacterKey]; // Player's character is always "played" in this session
    opponentSpeedMultiplier = 1;
    currentRound = 0;
    availableOpponents = Object.keys(characters).filter(key => key !== playerCharacterKey);

    initializeRound();
}

function initializeRound() {
    console.log('initializeRound called.');
    playerHealth = 100;
    opponentHealth = 100;
    playerHealthValue.textContent = playerHealth;
    opponentHealthValue.textContent = opponentHealth;
    gameActive = false;

    // Reset character positions
    playerPosition = 10;
    opponentPosition = 90;
    playerElement.style.left = playerPosition + '%';
    opponentElement.style.left = opponentPosition + '%';

    // Set player character image
    playerFaceElement.style.backgroundImage = `url(${characters[playerCharacterKey].img})`;
    playerElement.classList.add(characters[playerCharacterKey].color);

    // Select opponent for the current round
    let opponentCharacterKey;
    if (availableOpponents.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableOpponents.length);
        opponentCharacterKey = availableOpponents[randomIndex];
        // Remove selected opponent from available list
        availableOpponents.splice(randomIndex, 1);
    } else {
        // This case should ideally not be reached if logic is correct,
        // as handlePlayerWin should catch "all characters defeated"
        console.error("No available opponents left, but trying to initialize a round.");
        return;
    }

    opponentFaceElement.style.backgroundImage = `url(${characters[opponentCharacterKey].img})`;
    opponentNameElement.textContent = characters[opponentCharacterKey].name; // Set opponent name
    opponentElement.style.transform = 'scaleX(-1)'; // Initial flip for opponent
    updateCharacterDirection(); // Set initial directions

    // Apply opponent character color
    opponentElement.classList.add(characters[opponentCharacterKey].color);
}

// --- Countdown ---
function startCountdown() {
    let count = 3;
    countdownElement.textContent = count;
    countdownElement.style.display = 'block';

    const countdownInterval = setInterval(() => {
        count--;
        countdownElement.textContent = count;
        if (count === 0) {
            countdownElement.textContent = 'GO!';
        }
        if (count < 0) {
            clearInterval(countdownInterval);
            countdownElement.style.display = 'none';
            gameActive = true;
            console.log('Countdown finished. gameActive set to true.');
            playSound(fightSound); // Play fight sound after countdown
            // Start opponent AI (simple for now)
            opponentAI();
        }
    }, 1000);
}

// --- Player Movement ---
let playerMoveInterval = null;
const moveSpeed = 4; // Percentage per interval (2x faster)

function startMoving(direction) {
    if (!gameActive || playerMoveInterval) return;
    playerMoveInterval = setInterval(() => {
        if (direction === 'left') {
            playerPosition = Math.max(0, playerPosition - moveSpeed);
        } else if (direction === 'right') {
            playerPosition = Math.min(91, playerPosition + moveSpeed); // Prevent player from going too far right (100% - character width)
        }
        playerElement.style.left = playerPosition + '%';
        updateCharacterDirection();
    }, 50); // Update every 50ms
}

function stopMoving() {
    clearInterval(playerMoveInterval);
    playerMoveInterval = null;
}

// Event listeners for movement buttons (for touch and click)
moveLeftButton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    startMoving('left');
});
moveLeftButton.addEventListener('touchend', stopMoving);
moveLeftButton.addEventListener('mousedown', (e) => {
    e.preventDefault();
    startMoving('left');
});
moveLeftButton.addEventListener('mouseup', stopMoving);
moveLeftButton.addEventListener('mouseleave', stopMoving); // Stop if mouse leaves button while pressed

moveRightButton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    startMoving('right');
});
moveRightButton.addEventListener('touchend', stopMoving);
moveRightButton.addEventListener('mousedown', (e) => {
    e.preventDefault();
    startMoving('right');
});
moveRightButton.addEventListener('mouseup', stopMoving);
moveRightButton.addEventListener('mouseleave', stopMoving); // Stop if mouse leaves button while pressed

// Keyboard controls for desktop testing
document.addEventListener('keydown', (e) => {
    if (!gameActive) return;
    if (e.key === 'ArrowLeft' || e.key === 'a') {
        startMoving('left');
    } else if (e.key === 'ArrowRight' || e.key === 'd') {
        startMoving('right');
    } else if (e.key === ' ' || e.key === 'Enter') { // Space or Enter for punch
        performAttack('punch');
    } else if (e.key === 'Control' || e.key === 'Shift') { // Ctrl or Shift for kick
        performAttack('kick');
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'ArrowRight' || e.key === 'd') {
        stopMoving();
    }
});

// --- Player Attacks ---
punchButton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    playSound(punchSound); // Play sound immediately on touch
    if (gameActive) {
        console.log('Punch button touchstart. Game active:', gameActive);
        performAttack('punch');
    } else {
        console.log('Punch button touchstart. Game not active.');
    }
});
punchButton.addEventListener('mousedown', (e) => {
    e.preventDefault();
    playSound(punchSound); // Play sound immediately on click
    if (gameActive) {
        console.log('Punch button mousedown. Game active:', gameActive);
        performAttack('punch');
    } else {
        console.log('Punch button mousedown. Game not active.');
    }
});

kickButton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    playSound(kickSound); // Play sound immediately on touch
    if (gameActive) {
        console.log('Kick button touchstart. Game active:', gameActive);
        performAttack('kick');
    } else {
        console.log('Kick button touchstart. Game not active.');
    }
});
kickButton.addEventListener('mousedown', (e) => {
    e.preventDefault();
    playSound(kickSound); // Play sound immediately on click
    if (gameActive) {
        console.log('Kick button mousedown. Game active:', gameActive);
        performAttack('kick');
    } else {
        console.log('Kick button mousedown. Game not active.');
    }
});

function performAttack(type) {
    console.log('performAttack called with type:', type, 'Game active:', gameActive);

    // Always trigger visual animation regardless of gameActive or collision
    if (type === 'punch') {
        playerElement.classList.add('attacking'); // General attack animation
        console.log('Player punches!');
    } else if (type === 'kick') {
        playerElement.classList.add('attacking', 'kicking'); // General attack and specific kick animation
        console.log('Player kicks!');
    }

    // Remove attack classes after a short delay
    setTimeout(() => {
        playerElement.classList.remove('attacking', 'kicking');
    }, 200);

    // Only proceed with game logic (damage, collision) if game is active
    if (!gameActive) {
        console.log('Game not active, no damage applied.');
        return;
    }

    // Ensure player is facing opponent
    updateCharacterDirection();

    const playerRect = playerElement.getBoundingClientRect();
    const opponentRect = opponentElement.getBoundingClientRect();

    // Check for collision based on character positions and sizes
    // A simple overlap check, adjust collisionThreshold as needed
    const collisionThreshold = 50; // Pixels, adjust as needed
    const isColliding = (playerRect.right > opponentRect.left - collisionThreshold &&
                         playerRect.left < opponentRect.right + collisionThreshold);

    if (isColliding) {
        let damage = 0;
        if (type === 'punch') {
            damage = 5;
        } else if (type === 'kick') {
            damage = 10;
        }
        opponentHealth -= damage;
        opponentHealthValue.textContent = opponentHealth;
        playSound(hitSound); // Play hit sound when opponent takes damage
        checkGameOver();
    } else {
        console.log('Too far to attack!');
    }
}

// --- Opponent AI (Very basic for now) ---
function opponentAI() {
    if (!gameActive) return;

    const distance = Math.abs(playerPosition - opponentPosition);
    const attackRange = 15; // Distance at which opponent will try to attack
    const moveSpeedAI = 3; // Slightly slower than player for balance

    updateCharacterDirection(); // Always update direction

    const playerRect = playerElement.getBoundingClientRect();
    const opponentRect = opponentElement.getBoundingClientRect();
    const collisionThreshold = 50; // Pixels, adjust as needed
    const isColliding = (opponentRect.right > playerRect.left - collisionThreshold &&
                         opponentRect.left < playerRect.right + collisionThreshold);

    if (isColliding && distance <= attackRange) { // If in collision range and attack range, attack
        let damageType = Math.random() < 0.5 ? 'punch' : 'kick';
        let damage = (damageType === 'punch') ? 5 : 10;
        playerHealth -= damage;
        playerHealthValue.textContent = playerHealth;
        playSound(hitSound); // Play hit sound when player takes damage

        opponentElement.classList.add('attacking');
        if (damageType === 'kick') {
            opponentElement.classList.add('kicking');
        }
        setTimeout(() => {
            opponentElement.classList.remove('attacking', 'kicking');
        }, 200);
        console.log('Opponent attacks with', damageType, '! Damage:', damage);
        checkGameOver();
    } else { // If not attacking, move
        if (opponentPosition > playerPosition) {
            // Move left towards player
            opponentPosition = Math.max(0, opponentPosition - moveSpeedAI);
        } else {
            // Move right towards player
            opponentPosition = Math.min(90, opponentPosition + moveSpeedAI);
        }
        opponentElement.style.left = opponentPosition + '%';
    }

    setTimeout(opponentAI, 250 / opponentSpeedMultiplier); // Opponent acts faster with multiplier
}


// --- Game Over Logic ---
function checkGameOver() {
    if (playerHealth <= 0 || opponentHealth <= 0) {
        gameActive = false;
        if (playerHealth <= 0) {
            gameResultElement.textContent = '패배!';
            resultAnimationElement.classList.remove('win');
            resultAnimationElement.classList.add('lose');
            playSound(gameoverSound); // Play game over sound
            showScreen('game-over-screen');
        } else {
            gameResultElement.textContent = '승리!';
            resultAnimationElement.classList.remove('lose');
            resultAnimationElement.classList.add('win');
            playSound(youwinSound); // Play win sound
            handlePlayerWin();
        }
    }
}

function handlePlayerWin() {
    // Check if all characters have been defeated
    if (availableOpponents.length === 0) {
        winMessageElement.textContent = '모든 캐릭터를 물리쳤습니다! 🎉';
        playNextCharacterButton.style.display = 'none'; // Hide Yes button
        returnToSelectionButton.textContent = '홈 화면으로'; // Change No button text
        showScreen('win-screen');
    } else {
        winMessageElement.textContent = '승리! 😄 다음 캐릭터와 플레이 하시겠습니까?';
        playNextCharacterButton.style.display = 'inline-block'; // Show Yes button
        returnToSelectionButton.textContent = '아니오'; // Reset No button text
        showScreen('win-screen');
    }
}

playNextCharacterButton.addEventListener('click', () => {
    currentRound++;
    opponentSpeedMultiplier++;
    initializeRound();
    showScreen('game-screen');
    startCountdown();
});

returnToSelectionButton.addEventListener('click', () => {
    selectedCharacter = null;
    startGameButton.disabled = true;
    characterCards.forEach(c => c.classList.remove('selected'));
    playedCharacters = [];
    opponentSpeedMultiplier = 1;
    currentRound = 0;
    availableOpponents = []; // Clear available opponents for a fresh start
    playerCharacterKey = null; // Clear player character
    showScreen('character-selection-screen');
});


// --- Restart Game ---
restartGameButton.addEventListener('click', () => {
    selectedCharacter = null;
    startGameButton.disabled = true;
    characterCards.forEach(c => c.classList.remove('selected'));
    playedCharacters = []; // Reset played characters for a new game session
    opponentSpeedMultiplier = 1; // Reset opponent speed
    currentRound = 0; // Reset round counter
    availableOpponents = []; // Clear available opponents for a fresh start
    playerCharacterKey = null; // Clear player character
    showScreen('character-selection-screen');
});

// Initial screen display
showScreen('character-selection-screen');

// Update character direction based on opponent's position
function updateCharacterDirection() {
    const playerCenter = playerPosition + (playerElement.offsetWidth / window.innerWidth * 100 / 2);
    const opponentCenter = opponentPosition + (opponentElement.offsetWidth / window.innerWidth * 100 / 2);

    if (playerCenter < opponentCenter) {
        playerElement.style.transform = 'scaleX(1)'; // Face right
        opponentElement.style.transform = 'scaleX(-1)'; // Face left
    } else {
        playerElement.style.transform = 'scaleX(-1)'; // Face left
        opponentElement.style.transform = 'scaleX(1)'; // Face right
    }
}

// Helper function to play sounds
function playSound(audioElement) {
    if (audioElement) {
        audioElement.currentTime = 0; // Rewind to the start
        audioElement.play().catch(e => console.error("Error playing sound:", e));
    }
}