class WaterDropGame {
  constructor() {
    this.score = 0;
    this.timeLeft = 60;
    this.gameActive = false;
    this.difficulty = "normal";

    // Difficulty settings
    this.difficultySettings = {
      easy: {
        dropSpeed: 1.5,
        spawnRate: 1200,
        pollutantChance: 0.2,
        timeLimit: 90,
        description:
          "Slower pace, more time, fewer pollutants - perfect for beginners",
      },
      normal: {
        dropSpeed: 2,
        spawnRate: 1000,
        pollutantChance: 0.3,
        timeLimit: 60,
        description: "Balanced gameplay with moderate speed and challenge",
      },
      hard: {
        dropSpeed: 3,
        spawnRate: 800,
        pollutantChance: 0.4,
        timeLimit: 45,
        description:
          "Faster drops, more pollutants, less time - for experienced players",
      },
      extreme: {
        dropSpeed: 4,
        spawnRate: 600,
        pollutantChance: 0.5,
        timeLimit: 30,
        description: "Maximum challenge - lightning fast with heavy pollution",
      },
    };

    // Current game settings
    this.dropSpeed = this.difficultySettings[this.difficulty].dropSpeed;
    this.spawnRate = this.difficultySettings[this.difficulty].spawnRate;
    this.pollutantChance =
      this.difficultySettings[this.difficulty].pollutantChance;

    // Milestone tracking
    this.milestones = [
      { score: 50, message: "Great start! 💧", triggered: false },
      {
        score: 100,
        message: "You're getting the hang of it! 🌊",
        triggered: false,
      },
      {
        score: 150,
        message: "Halfway there! Keep going! 🚀",
        triggered: false,
      },
      { score: 200, message: "Excellent work! 🌟", triggered: false },
      { score: 300, message: "Water conservation hero! 🏆", triggered: false },
      {
        score: 400,
        message: "Incredible! You're unstoppable! ⭐",
        triggered: false,
      },
      { score: 500, message: "LEGENDARY WATER GUARDIAN! 👑", triggered: false },
    ];

    // DOM elements
    this.gameArea = document.getElementById("game-area");
    this.scoreElement = document.getElementById("score");
    this.timerElement = document.getElementById("timer");
    this.finalScoreElement = document.getElementById("final-score");
    this.feedbackElement = document.getElementById("feedback-message");
    this.milestoneElement = document.getElementById("milestone-message");

    // Game intervals
    this.gameInterval = null;
    this.spawnInterval = null;
    this.timerInterval = null;

    // Sound effects (using Web Audio API for simple tones)
    this.audioContext = null;
    this.initializeAudio();

    this.initializeEventListeners();
    this.initializeDifficultySelection();
  }

  initializeAudio() {
    try {
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
    } catch (e) {
      console.log("Web Audio API not supported");
    }
  }

  playSound(type) {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Different frequencies for different sounds
    switch (type) {
      case "collect":
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(
          1200,
          this.audioContext.currentTime + 0.1
        );
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          this.audioContext.currentTime + 0.1
        );
        break;
      case "miss":
        oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(
          150,
          this.audioContext.currentTime + 0.3
        );
        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          this.audioContext.currentTime + 0.3
        );
        break;
      case "button":
        oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          this.audioContext.currentTime + 0.1
        );
        break;
      case "win":
        oscillator.frequency.setValueAtTime(523, this.audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(
          659,
          this.audioContext.currentTime + 0.2
        ); // E5
        oscillator.frequency.setValueAtTime(
          784,
          this.audioContext.currentTime + 0.4
        ); // G5
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          this.audioContext.currentTime + 0.6
        );
        break;
    }

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(
      this.audioContext.currentTime +
        (type === "win" ? 0.6 : type === "miss" ? 0.3 : 0.1)
    );
  }

  initializeDifficultySelection() {
    const difficultyButtons = document.querySelectorAll(".difficulty-btn");
    const difficultyDesc = document.getElementById("difficulty-desc");

    difficultyButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        this.playSound("button");

        // Remove active class from all buttons
        difficultyButtons.forEach((b) => b.classList.remove("active"));

        // Add active class to clicked button
        btn.classList.add("active");

        // Update difficulty
        this.difficulty = btn.dataset.difficulty;

        // Update description
        difficultyDesc.textContent =
          this.difficultySettings[this.difficulty].description;

        // Update game settings
        this.updateDifficultySettings();
      });
    });
  }

  updateDifficultySettings() {
    const settings = this.difficultySettings[this.difficulty];
    this.dropSpeed = settings.dropSpeed;
    this.spawnRate = settings.spawnRate;
    this.pollutantChance = settings.pollutantChance;
    this.timeLeft = settings.timeLimit;
  }

  initializeEventListeners() {
    document.getElementById("start-btn").addEventListener("click", () => {
      this.playSound("button");
      this.startGame();
    });
    document.getElementById("play-again-btn").addEventListener("click", () => {
      this.playSound("button");
      this.resetGame();
    });
  }

  startGame() {
    // Resume audio context if needed
    if (this.audioContext && this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }

    this.showScreen("game-screen");
    this.gameActive = true;
    this.score = 0;

    // Use difficulty-specific time limit
    this.timeLeft = this.difficultySettings[this.difficulty].timeLimit;

    // Reset milestones
    this.milestones.forEach((milestone) => (milestone.triggered = false));

    this.updateDisplay();

    // Start game loops
    this.startGameLoop();
    this.startSpawning();
    this.startTimer();

    this.showFeedback(
      `${this.difficulty.toUpperCase()} mode started! Collect the blue drops!`,
      "good"
    );
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
            this.playSound("miss");
            this.updateDisplay();
            this.showFeedback("Missed! -5 points", "bad");
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
      this.playSound("miss");
      this.showFeedback("Pollutant! -10 points", "bad");
      this.createScorePopup(drop.offsetLeft, drop.offsetTop, "-10", "bad");

      // DOM manipulation: Add pollution effect
      this.addPollutionEffect();
    } else {
      // Reward for collecting good drops
      this.score += 10;
      this.playSound("collect");
      this.showFeedback("Great! +10 points", "good");
      this.createScorePopup(drop.offsetLeft, drop.offsetTop, "+10", "good");

      // DOM manipulation: Add sparkle effect
      this.addSparkleEffect(drop.offsetLeft, drop.offsetTop);
    }

    this.updateDisplay();
    this.checkMilestones();

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

  checkMilestones() {
    this.milestones.forEach((milestone) => {
      if (!milestone.triggered && this.score >= milestone.score) {
        milestone.triggered = true;
        this.showMilestone(milestone.message);
      }
    });
  }

  showMilestone(message) {
    this.milestoneElement.textContent = message;
    this.milestoneElement.classList.add("milestone-message", "show");

    setTimeout(() => {
      this.milestoneElement.classList.remove("show");
    }, 3000);
  }

  addSparkleEffect(x, y) {
    for (let i = 0; i < 5; i++) {
      const sparkle = document.createElement("div");
      sparkle.style.position = "absolute";
      sparkle.style.left = x + Math.random() * 40 - 20 + "px";
      sparkle.style.top = y + Math.random() * 40 - 20 + "px";
      sparkle.style.width = "4px";
      sparkle.style.height = "4px";
      sparkle.style.backgroundColor = "#ffc907";
      sparkle.style.borderRadius = "50%";
      sparkle.style.pointerEvents = "none";
      sparkle.style.zIndex = "300";
      sparkle.style.animation = "sparkleAnimation 0.8s ease-out forwards";

      this.gameArea.appendChild(sparkle);

      setTimeout(() => {
        if (sparkle.parentNode) {
          sparkle.remove();
        }
      }, 800);
    }
  }

  addPollutionEffect() {
    const pollution = document.createElement("div");
    pollution.style.position = "absolute";
    pollution.style.top = "0";
    pollution.style.left = "0";
    pollution.style.width = "100%";
    pollution.style.height = "100%";
    pollution.style.backgroundColor = "rgba(139, 0, 0, 0.1)";
    pollution.style.pointerEvents = "none";
    pollution.style.zIndex = "50";
    pollution.style.animation = "pollutionFlash 0.5s ease-out forwards";

    this.gameArea.appendChild(pollution);

    setTimeout(() => {
      if (pollution.parentNode) {
        pollution.remove();
      }
    }, 500);
  }

  endGame() {
    this.gameActive = false;

    // Play win sound
    this.playSound("win");

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

    // Reset to current difficulty settings
    this.updateDifficultySettings();

    // Reset milestones
    this.milestones.forEach((milestone) => (milestone.triggered = false));

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
