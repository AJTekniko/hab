        const GITHUB_ASSETS_URL = 'https://raw.githubusercontent.com/AJTekniko/typing-game-assets/main/';

        const wordPairs = [
            { language1: 'chooko', language2: 'salty; salado' },
            { language1: 'hu', language2: 'the; el, la' },
            { language1: 'hume', language2: 'the; los, las' },
            { language1: 'munim', language2: 'beans; frijoles' },
            { language1: 'si', language2: 'too much; demasiado' },
            { language1: 'ka', language2: 'nothing; nada' },
            { language1: 'tua', language2: 'truly; realmente' },
            { language1: 'kaka', language2: 'sweet; dulce' },
            { language1: 'uusi', language2: 'child; niño, niña' },
            { language1: 'kakai', language2: 'candy; dulce' },
            { language1: "bwa'e", language2: 'to eat; comer' },
            { language1: 'seewa', language2: 'flower; flor' },
            { language1: 'sapam', language2: 'ice cream; helado' },
            { language1: 'kia', language2: 'delicious; delicioso' },
            { language1: "va'am", language2: 'water; agua' },
            { language1: 'sipia', language2: 'cold; frío' },
            { language1: "bwa'ame", language2: 'food; comida' },
            { language1: 'tata', language2: 'hot; caliente' },
            { language1: 'puhte', language2: 'boiling hot; hirviendo' },
            { language1: 'haivu', language2: 'now; ya' },
            { language1: "vetchi'ivo", language2: 'for; para, por' },
            { language1: "chiokoe utte'esia", language2: 'thank you; gracias' },
            { language1: 'haisa', language2: 'how; cómo' },
            { language1: 'empo', language2: 'you; tú' },
            { language1: 'hakun', language2: 'where; dónde' },
            { language1: "ho'ak", language2: "to live; vivir" },
            { language1: '-po', language2: 'in; en' },
            { language1: "e'e", language2: 'no' },
            { language1: 'hewi', language2: 'yes; sí' },
            { language1: 'haisiuwa', language2: "what's going on; qué onda" },
            { language1: 'achaim', language2: 'fathers (m); padres (m)' }
        ];

        let gameRunning = false;
        let score = 0;
        let level = 1;
        let totalWordsTyped = 0;
        let totalCharsTyped = 0;
        let totalCorrectChars = 0;
        let meteorsDestroyed = 0;
        let activeMeteor = null;
        let meteorList = [];
        let meteorIdCounter = 0;
        let musicEnabled = true;
        let backgroundMusicAudio = null;
        let audioContext = null;
        let highScore = parseInt(localStorage.getItem('highScore')) || 0;
        let highScoreMeteors = parseInt(localStorage.getItem('highScoreMeteors')) || 0;
        
        // Word pool management
        let availableWords = [];
        let usedWords = [];

        const input = document.getElementById('input');
        const spaceArea = document.getElementById('spaceArea');
        const scoreDisplay = document.getElementById('score');
        const levelDisplay = document.getElementById('level');
        const accuracyDisplay = document.getElementById('accuracy');
        const destroyedDisplay = document.getElementById('destroyed');
        const gameOverScreen = document.getElementById('gameOver');
        const startBtn = document.getElementById('startBtn');
        const musicToggle = document.getElementById('musicToggle');

        // Initialize word pools
        function initializeWordPools() {
            availableWords = [...wordPairs];
            usedWords = [];
        }

        // Get next word, cycling through all words before repeating
        function getNextWord() {
            // If all words have been used, reset the cycle
            if (availableWords.length === 0) {
                availableWords = [...usedWords];
                usedWords = [];
            }

            // Get a random word from available words
            const randomIndex = Math.floor(Math.random() * availableWords.length);
            const word = availableWords[randomIndex];

            // Move word from available to used
            availableWords.splice(randomIndex, 1);
            usedWords.push(word);

            return word;
        }

        // Normalize text by removing accents and normalizing apostrophes
        function normalizeText(text) {
            // Normalize accents using NFD decomposition
            let normalized = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            
            // Normalize all apostrophe variants to a standard apostrophe
            normalized = normalized.replace(/[''´`‘’]/g, "'");
            
            return normalized;
        }

        // Initialize audio context for sound effects
        function initAudioContext() {
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
        }

        // Play background music from repository
        function playBackgroundMusic() {
            try {
                if (!backgroundMusicAudio) {
                    backgroundMusicAudio = new Audio(GITHUB_ASSETS_URL + 'bg-music.mp3');
                    backgroundMusicAudio.loop = true;
                    backgroundMusicAudio.volume = 0.3;
                }
                if (musicEnabled && gameRunning) {
                    backgroundMusicAudio.play().catch(e => console.log('Music play error:', e));
                }
            } catch (e) {
                console.log('Audio not available');
            }
        }

        // Stop background music
        function stopBackgroundMusic() {
            try {
                if (backgroundMusicAudio) {
                    backgroundMusicAudio.pause();
                    backgroundMusicAudio.currentTime = 0;
                }
            } catch (e) {
                console.log('Error stopping music');
            }
        }

        // Play word pronunciation
        function playWordAudio(word) {
            try {
                const audio = new Audio(GITHUB_ASSETS_URL + 'other/yo/sounds/' + word + '.ogg');
                audio.volume = 0.8;
                audio.play().catch(e => console.log('Word audio play error:', e));
            } catch (e) {
                console.log('Audio not available');
            }
        }

        // Play boom sound when meteor hits earth
        function playBoomSound() {
            try {
                const audio = new Audio(GITHUB_ASSETS_URL + 'boom.ogg');
                audio.volume = 0.5;
                audio.play().catch(e => console.log('Boom audio play error:', e));
            } catch (e) {
                console.log('Audio not available');
            }
        }

        function playBuzzer() {
            try {
                if (!audioContext) initAudioContext();
                
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                
                osc.connect(gain);
                gain.connect(audioContext.destination);
                
                osc.frequency.value = 150;
                osc.type = 'square';
                
                gain.gain.setValueAtTime(0.1, audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                
                osc.start(audioContext.currentTime);
                osc.stop(audioContext.currentTime + 0.1);
            } catch (e) {
                console.log('Audio not available');
            }
        }

        function playExplosion() {
            try {
                if (!audioContext) initAudioContext();
                
                const now = audioContext.currentTime;
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                
                osc.connect(gain);
                gain.connect(audioContext.destination);
                
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
                osc.type = 'sine';
                
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                
                osc.start(now);
                osc.stop(now + 0.3);
            } catch (e) {
                console.log('Audio not available');
            }
        }

        function getSpeedForLevel(level) {
            return 1 + (level - 1) * 0.5;
        }

        function startGame() {
            if (gameRunning) return;

            gameRunning = true;
            score = 0;
            level = 1;
            totalWordsTyped = 0;
            totalCharsTyped = 0;
            totalCorrectChars = 0;
            meteorsDestroyed = 0;
            meteorList = [];
            meteorIdCounter = 0;
            activeMeteor = null;
            gameOverScreen.classList.remove('show');

            // Initialize word pools for this game
            initializeWordPools();

            input.value = '';
            input.focus();
            input.disabled = false;
            spaceArea.innerHTML = '';
            startBtn.disabled = true;

            if (musicEnabled) {
                playBackgroundMusic();
            }

            spawnMeteor();

            const spawnInterval = setInterval(() => {
                if (gameRunning && meteorList.length < 3) {
                    spawnMeteor();
                }
                if (!gameRunning) {
                    clearInterval(spawnInterval);
                }
            }, 2000);

            const gameLoop = setInterval(() => {
                if (!gameRunning) {
                    clearInterval(gameLoop);
                    return;
                }
                updateMeteors();
            }, 30);
        }

        function spawnMeteor() {
            const wordPair = getNextWord();
            const meteorElement = document.createElement('div');
            meteorElement.className = 'meteor';
            meteorElement.id = `meteor-${meteorIdCounter}`;
            meteorElement.style.backgroundImage = `url('${GITHUB_ASSETS_URL}meteor.png')`;

            const meteor = {
                id: meteorIdCounter++,
                element: meteorElement,
                language1: wordPair.language1,
                language2: wordPair.language2,
                typed: '',
                y: -80,
                x: Math.random() * (spaceArea.clientWidth - 80),
                active: false,
                speed: getSpeedForLevel(level)
            };

            updateMeteorDisplay(meteor);
            meteorList.push(meteor);
            spaceArea.appendChild(meteorElement);

            if (!activeMeteor) {
                setActiveMeteor(meteor);
            }
        }

        function updateMeteorDisplay(meteor) {
            const typed = meteor.typed;
            const remaining = meteor.language1.slice(typed.length);

            meteor.element.innerHTML = `
                <div class="word-text">
                    <div class="language1">${escapeHtml(typed)}<span class="remaining">${escapeHtml(remaining)}</span></div>
                    <div class="language2">${escapeHtml(meteor.language2)}</div>
                </div>
            `;
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        function setActiveMeteor(meteor) {
            if (activeMeteor && activeMeteor.element) {
                activeMeteor.element.classList.remove('active');
            }
            activeMeteor = meteor;
            if (activeMeteor) {
                activeMeteor.element.classList.add('active');
            }
            updateMeteorDisplay(activeMeteor);
        }

        function updateMeteors() {
            meteorList.forEach(meteor => {
                meteor.y += meteor.speed;
                meteor.element.style.top = meteor.y + 'px';
                meteor.element.style.left = meteor.x + 'px';

                if (meteor.y > spaceArea.clientHeight - 80) {
                    endGame();
                }
            });
        }

        input.addEventListener('input', (e) => {
            if (!gameRunning || !activeMeteor) return;

            initAudioContext();

            const inputValue = input.value.toLowerCase().trim();

            if (inputValue.length === 0) {
                activeMeteor.typed = '';
                updateMeteorDisplay(activeMeteor);
                return;
            }

            // Normalize both input and the target word for comparison
            const normalizedInput = normalizeText(inputValue);
            const normalizedLanguage1 = normalizeText(activeMeteor.language1.toLowerCase());

            const lastChar = inputValue[inputValue.length - 1];
            const normalizedLastChar = normalizeText(lastChar);
            const normalizedTargetChar = normalizeText(activeMeteor.language1[inputValue.length - 1].toLowerCase());

            // Check if the last character matches
            if (normalizedLastChar !== normalizedTargetChar) {
                input.value = inputValue.slice(0, -1);
                playBuzzer();
                totalCharsTyped++;
                return;
            }

            // Check if input matches the start of the word
            if (!normalizedLanguage1.startsWith(normalizedInput)) {
                input.value = inputValue.slice(0, -1);
                playBuzzer();
                totalCharsTyped++;
                return;
            }

            activeMeteor.typed = inputValue;
            totalCharsTyped++;
            totalCorrectChars++;
            updateMeteorDisplay(activeMeteor);

            // Check if word is complete
            if (normalizedInput === normalizedLanguage1) {
                destroyMeteor(activeMeteor);
            }

            updateStats();
        });

        function destroyMeteor(meteor) {
            playExplosion();
            playWordAudio(meteor.language1);
            totalWordsTyped++;
            score += meteor.language1.length * (10 * level);
            meteorsDestroyed++;

            createExplosion(meteor);

            meteorList = meteorList.filter(m => m !== meteor);
            spaceArea.removeChild(meteor.element);

            input.value = '';

            if (meteorList.length > 0) {
                setActiveMeteor(meteorList[0]);
            } else {
                activeMeteor = null;
            }

            if (meteorsDestroyed % 3 === 0) {
                levelUp();
            }

            updateStats();
        }

        function createExplosion(meteor) {
            const explosion = document.createElement('div');
            explosion.className = 'explosion';
            explosion.style.top = meteor.y + 'px';
            explosion.style.left = meteor.x + 'px';

            for (let i = 0; i < 12; i++) {
                const particle = document.createElement('div');
                particle.className = 'explosion-particle';

                const angle = (i / 12) * Math.PI * 2;
                const distance = 40;
                const tx = Math.cos(angle) * distance;
                const ty = Math.sin(angle) * distance;

                particle.style.setProperty('--tx', tx + 'px');
                particle.style.setProperty('--ty', ty + 'px');
                particle.style.left = '40px';
                particle.style.top = '40px';

                explosion.appendChild(particle);
            }

            spaceArea.appendChild(explosion);

            setTimeout(() => {
                spaceArea.removeChild(explosion);
            }, 600);
        }

        function levelUp() {
            level++;
            
            meteorList.forEach(meteor => {
                meteor.speed = getSpeedForLevel(level);
            });

            const levelUpDisplay = document.createElement('div');
            levelUpDisplay.className = 'level-up';
            levelUpDisplay.textContent = `LEVEL ${level}!`;
            document.body.appendChild(levelUpDisplay);

            setTimeout(() => {
                document.body.removeChild(levelUpDisplay);
            }, 2000);

            updateStats();
        }

        function updateStats() {
            scoreDisplay.textContent = Math.floor(score);
            levelDisplay.textContent = level;
            destroyedDisplay.textContent = meteorsDestroyed;

            const accuracy = totalCharsTyped > 0 
                ? Math.round((totalCorrectChars / totalCharsTyped) * 100) 
                : 0;
            accuracyDisplay.textContent = accuracy + '%';
        }

        function endGame() {
            gameRunning = false;
            stopBackgroundMusic();
            playBoomSound();
            input.disabled = true;
            startBtn.disabled = false;

            const accuracy = totalCharsTyped > 0 
                ? Math.round((totalCorrectChars / totalCharsTyped) * 100) 
                : 0;

            // Check if this is a new high score
            const finalScore = Math.floor(score);
            if (finalScore > highScore) {
                highScore = finalScore;
                highScoreMeteors = meteorsDestroyed;
                localStorage.setItem('highScore', highScore);
                localStorage.setItem('highScoreMeteors', highScoreMeteors);
            }

            document.getElementById('finalScore').textContent = finalScore;
            document.getElementById('statsFinalLevel').textContent = level;
            document.getElementById('statsDestroyed').textContent = meteorsDestroyed;
            document.getElementById('statsAccuracy').textContent = accuracy + '%';
            
            document.getElementById('statsHighScore').textContent = highScore;
            document.getElementById('statsHighScoreMeteors').textContent = highScoreMeteors;

            const damageScreen = document.createElement('div');
            damageScreen.className = 'damage-screen';
            document.body.appendChild(damageScreen);

            setTimeout(() => {
                document.body.removeChild(damageScreen);
            }, 300);

            gameOverScreen.classList.add('show');
        }

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !gameRunning) {
                startGame();
            }
        });

        // Music toggle
        musicToggle.addEventListener('click', () => {
            musicEnabled = !musicEnabled;
            musicToggle.textContent = musicEnabled ? '🔊 Music ON' : '🔇 Music OFF';
            
            if (gameRunning) {
                if (musicEnabled) {
                    playBackgroundMusic();
                } else {
                    stopBackgroundMusic();
                }
            }
        });
