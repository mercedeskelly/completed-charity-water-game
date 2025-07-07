
class WaterDropGame {
  constructor() {
    this.score = 0;
    this.timeLeft = 60;
    this.gameActive = false;
    this.dropSpeed = 2;
    this.spawnRate = 1000; // milliseconds
    this.pollutantChance = 0.3; // 30% chance for pollutant

    this.gameArea = document.getElementById("game-area");
    this.scoreElement = document.getElementById("score");
    this.timerElement = document.getElementById("timer");
    this.finalScoreElement = document.getElementById("final-score");
    this.feedbackElement = document.getElementById("feedback-message");

    this.gameInterval = null;
    this.spawnInterval = null;
    this.timerInterval = null;

    this.initializeEventListeners();
  }

  initializeEventListeners() {
    document
      .getElementById("start-btn")
      .addEventListener("click", () => this.startGame());
    document
      .getElementById("play-again-btn")
      .addEventListener("click", () => this.resetGame());
  }

  startGame() {
    this.showScreen("game-screen");
    this.gameActive = true;
    this.score = 0;
    this.timeLeft = 60;
    this.updateDisplay();

    // Start game loops
    this.startGameLoop();
    this.startSpawning();
    this.startTimer();

    this.showFeedback("Game Started! Collect the blue drops!", "good");
  }

  startGameLoop() {
    this.gameInterval = setInterval(() => {
      this.updateDrops();
    }, 16); // ~60 FPS
  }

  startSpawning() {
    this.spawnInterval = setInterval(() => {
      if (this.gameActive) {
        this.spawnDrop();
      }
    }, this.spawnRate);
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      this.updateDisplay();

      if (this.timeLeft <= 0) {
        this.endGame();
      }

      // Increase difficulty over time
      if (this.timeLeft % 15 === 0 && this.timeLeft > 0) {
        this.increaseDifficulty();
      }
    }, 1000);
  }

  spawnDrop() {
    const drop = document.createElement("div");
    drop.className = "water-drop";

    // Determine if it's a good drop or pollutant
    const isPollutant = Math.random() < this.pollutantChance;
    drop.classList.add(isPollutant ? "bad" : "good");

    // Random horizontal position
    const maxX = this.gameArea.clientWidth - 40;
    drop.style.left = Math.random() * maxX + "px";
    drop.style.top = "-50px";

    // Add click event
    drop.addEventListener("click", (e) =>
      this.collectDrop(e, drop, isPollutant)
    );

    this.gameArea.appendChild(drop);
  }

  updateDrops() {
    const drops = this.gameArea.querySelectorAll(".water-drop");

    drops.forEach((drop) => {
      if (!drop.classList.contains("collected")) {
        const currentTop = parseInt(drop.style.top) || 0;
        const newTop = currentTop + this.dropSpeed;

        if (newTop > this.gameArea.clientHeight) {
          // Drop hit the ground
          const isPollutant = drop.classList.contains("bad");
          if (!isPollutant) {
            // Penalty for missing good drops
            this.score = Math.max(0, this.score - 5);
            this.updateDisplay();
            this.showFeedback("-5", "bad");
            this.createScorePopup(drop.offsetLeft, drop.offsetTop, "-5", "bad");
          }
          drop.remove();
        } else {
          drop.style.top = newTop + "px";
        }
      }
    });
  }

  collectDrop(event, drop, isPollutant) {
    event.preventDefault();

    if (drop.classList.contains("collected")) return;

    drop.classList.add("collected");

    if (isPollutant) {
      // Penalty for collecting pollutants
      this.score = Math.max(0, this.score - 10);
      this.showFeedback("Pollutant! -10 points", "bad");
      this.createScorePopup(drop.offsetLeft, drop.offsetTop, "-10", "bad");
    } else {
      // Reward for collecting good drops
      this.score += 10;
      this.showFeedback("Great! +10 points", "good");
      this.createScorePopup(drop.offsetLeft, drop.offsetTop, "+10", "good");
    }

    this.updateDisplay();

    // Remove drop after animation
    setTimeout(() => {
      if (drop.parentNode) {
        drop.remove();
      }
    }, 500);
  }

  createScorePopup(x, y, text, type) {
    const popup = document.createElement("div");
    popup.className = "score-popup";
    popup.textContent = text;
    popup.style.left = x + "px";
    popup.style.top = y + "px";
    popup.style.color = type === "good" ? "#28A745" : "#DC3545";

    this.gameArea.appendChild(popup);

    setTimeout(() => {
      if (popup.parentNode) {
        popup.remove();
      }
    }, 1000);
  }

  showFeedback(message, type) {
    this.feedbackElement.textContent = message;
    this.feedbackElement.className = `feedback-message ${type} show`;

    setTimeout(() => {
      this.feedbackElement.classList.remove("show");
    }, 1500);
  }

  increaseDifficulty() {
    this.dropSpeed += 0.5;
    this.spawnRate = Math.max(500, this.spawnRate - 100);
    this.pollutantChance = Math.min(0.5, this.pollutantChance + 0.05);

    // Restart spawning with new rate
    clearInterval(this.spawnInterval);
    this.startSpawning();

    this.showFeedback("Difficulty Increased!", "good");
  }

  updateDisplay() {
    this.scoreElement.textContent = this.score;
    this.timerElement.textContent = this.timeLeft;
  }

  endGame() {
    this.gameActive = false;

    // Clear all intervals
    clearInterval(this.gameInterval);
    clearInterval(this.spawnInterval);
    clearInterval(this.timerInterval);

    // Clear remaining drops
    this.gameArea.innerHTML = "";

    // Show final score
    this.finalScoreElement.textContent = this.score;

    // Show end screen
    this.showScreen("end-screen");
  }

  resetGame() {
    // Reset game state
    this.score = 0;
    this.timeLeft = 60;
    this.dropSpeed = 2;
    this.spawnRate = 1000;
    this.pollutantChance = 0.3;

    // Clear game area
    this.gameArea.innerHTML = "";

    // Show start screen
    this.showScreen("start-screen");
  }

  showScreen(screenId) {
    // Hide all screens
    document.querySelectorAll(".screen").forEach((screen) => {
      screen.classList.add("hidden");
    });

    // Show target screen
    document.getElementById(screenId).classList.remove("hidden");
  }
}

// Initialize game when page loads
document.addEventListener("DOMContentLoaded", () => {
  new WaterDropGame();
});

// Prevent context menu on right click (for mobile)
document.addEventListener("contextmenu", (e) => {
  e.preventDefault();
});

// Handle touch events for mobile
document.addEventListener(
  "touchstart",
  (e) => {
    // Prevent default touch behavior that might interfere with game
    if (e.target.classList.contains("water-drop")) {
      e.preventDefault();
    }
  },
  { passive: false }
);