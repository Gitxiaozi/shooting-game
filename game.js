// 获取画布和上下文
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 设置画布大小
canvas.width = 800;
canvas.height = 600;

// 游戏状态
let gameState = 'menu'; // menu, playing, paused, gameOver
let score = 0;
let lives = 3;
let level = 1;
let gameSpeed = 2;

// 玩家对象
const player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 80,
    width: 50,
    height: 50,
    speed: 5,
    color: '#00ff00',
    image: null,
    currentShooter: 1 // 1 或 2
};

// 加载射击者图片
const shooterImages = {
    shooter1: new Image(),
    shooter2: new Image()
};

// 尝试加载图片（支持多种格式）
function loadShooterImage(shooterNum, imageObj) {
    const formats = ['png', 'jpg', 'jpeg', 'PNG', 'JPG', 'JPEG'];
    let formatIndex = 0;
    
    function tryNextFormat() {
        if (formatIndex < formats.length) {
            const filename = `shooter${shooterNum}.${formats[formatIndex]}`;
            console.log(`尝试加载: ${filename}`);
            imageObj.src = filename;
            formatIndex++;
        } else {
            console.warn(`shooter${shooterNum} 所有格式都加载失败，使用默认图形`);
            imageObj.loaded = false;
            checkAllImagesLoaded();
        }
    }
    
    imageObj.onload = function() {
        console.log(`shooter${shooterNum} 图片加载成功: ${imageObj.src}`);
        imageObj.loaded = true;
        checkAllImagesLoaded();
    };
    
    imageObj.onerror = function() {
        console.warn(`shooter${shooterNum}.${formats[formatIndex - 1]} 加载失败，尝试下一个格式`);
        tryNextFormat();
    };
    
    tryNextFormat();
}

// 检查所有图片是否加载完成
let imagesLoadedCount = 0;
let totalExpectedImages = 2; // 2个射击者（敌人图片异步加载，不在这里计数）

function checkAllImagesLoaded() {
    imagesLoadedCount = 0;
    if (shooterImages.shooter1.loaded) imagesLoadedCount++;
    if (shooterImages.shooter2.loaded) imagesLoadedCount++;
    
    if (imagesLoadedCount === totalExpectedImages) {
        console.log('射击者图片加载完成');
        // 设置默认射击者
        if (!player.image || !player.image.loaded) {
            player.currentShooter = shooterImages.shooter1.loaded ? 1 : 2;
            player.image = player.currentShooter === 1 ? shooterImages.shooter1 : shooterImages.shooter2;
        }
    } else if (imagesLoadedCount === 0) {
        console.warn('没有射击者图片加载成功，将使用默认图形');
    } else {
        console.log(`已加载 ${imagesLoadedCount}/${totalExpectedImages} 张射击者图片`);
    }
}

// 初始化图片加载
loadShooterImage(1, shooterImages.shooter1);
loadShooterImage(2, shooterImages.shooter2);

// 加载敌人图片（支持多个敌人头像）
const enemyImages = [];
const maxEnemyImages = 99;

// 尝试加载敌人图片（支持多种格式和多个编号）
function loadEnemyImages() {
    const formats = ['png', 'jpg', 'jpeg', 'PNG', 'JPG', 'JPEG'];
    let loadedCount = 0;
    let attemptedCount = 0;
    const maxAttempts = maxEnemyImages * formats.length;
    
    function tryLoadEnemy(enemyNum) {
        if (enemyNum > maxEnemyImages) {
            // 所有尝试完成
            if (loadedCount === 0) {
                console.warn('没有找到任何敌人图片，将使用默认图形');
            } else {
                console.log(`成功加载 ${loadedCount} 个敌人头像`);
            }
            checkAllImagesLoaded();
            return;
        }
        
        const imageObj = new Image();
        let formatIndex = 0;
        let locationMode = 0;
        
        function tryNextFormat() {
            if (enemyNum === 0) {
                if (formatIndex < formats.length) {
                    const filename = `enemy.${formats[formatIndex]}`;
                    attemptedCount++;
                    imageObj.src = filename;
                    formatIndex++;
                } else {
                    tryLoadEnemy(enemyNum + 1);
                }
                return;
            }
            if (locationMode === 0 && formatIndex < formats.length) {
                const filename = `enemies/enemy${enemyNum}.${formats[formatIndex]}`;
                attemptedCount++;
                imageObj.src = filename;
                formatIndex++;
                return;
            }
            if (locationMode === 1 && formatIndex < formats.length) {
                const numStr = enemyNum.toString().padStart(2, '0');
                const filename = `cropped_faces/face_${numStr}.${formats[formatIndex]}`;
                attemptedCount++;
                imageObj.src = filename;
                formatIndex++;
                return;
            }
            if (locationMode === 0) {
                locationMode = 1;
                formatIndex = 0;
                tryNextFormat();
                return;
            }
            tryLoadEnemy(enemyNum + 1);
        }
        
        imageObj.onload = function() {
            console.log(`敌人图片加载成功: ${imageObj.src}`);
            imageObj.loaded = true;
            enemyImages.push(imageObj);
            loadedCount++;
            // 继续尝试加载下一个
            tryLoadEnemy(enemyNum + 1);
        };
        
        imageObj.onerror = function() {
            tryNextFormat();
        };
        
        tryNextFormat();
    }
    
    // 先尝试加载通用的enemy.png，然后加载enemies/enemy1.png等
    tryLoadEnemy(0);
}

// 获取随机敌人图片
function getRandomEnemyImage() {
    if (enemyImages.length === 0) {
        return null;
    }
    const randomIndex = Math.floor(Math.random() * enemyImages.length);
    return enemyImages[randomIndex];
}

// 初始化敌人图片加载
loadEnemyImages();

// 子弹数组
let bullets = [];

// 敌人数组
let enemies = [];
let particles = [];
let powerUps = [];
let shakeTime = 0;
let shakeIntensity = 0;
let levelMessageTime = 0;
let lastShotTime = 0;
let bulletCooldown = 280;
let rapidFireUntil = 0;
let audioCtx = null;
let boss = null;
let bossBullets = [];
let bossActive = false;
let nextBossLevel = 3;
let nextBossShotTime = 0;
let bossShotInterval = 700;
let bgmNodes = [];
let bgmTimer = null;
let isBgmPlaying = false;

// 星星背景
let stars = [];
for (let i = 0; i < 100; i++) {
    stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2,
        speed: Math.random() * 2 + 1
    });
}

// 按键状态
const keys = {};

// 事件监听
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ' && gameState === 'playing') {
        shoot();
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// 按钮事件
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('pauseBtn').addEventListener('click', togglePause);
document.getElementById('restartBtn').addEventListener('click', restartGame);

// 射击者选择按钮
document.getElementById('shooter1Btn').addEventListener('click', () => selectShooter(1));
document.getElementById('shooter2Btn').addEventListener('click', () => selectShooter(2));

// 自定义素材上传处理
let customBossImage = null;
document.getElementById('enemyImageInput').addEventListener('change', handleEnemyUpload);
document.getElementById('bossImageInput').addEventListener('change', handleBossUpload);
document.getElementById('shooterImageInput').addEventListener('change', handleShooterUpload);

function handleEnemyUpload(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const statusEl = document.getElementById('enemyUploadStatus');
    statusEl.textContent = `处理中...`;
    
    let processedCount = 0;
    
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                // 如果图片很小（可能是已经裁剪好的头像），直接使用
                if (img.width < 100 && img.height < 100) {
                    img.loaded = true;
                    enemyImages.push(img);
                    processedCount++;
                } else {
                    // 如果是大图，进行简单的网格切分
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const faceSize = 50;
                    canvas.width = faceSize;
                    canvas.height = faceSize;
                    
                    const numCrops = Math.min(5, Math.floor((img.width * img.height) / (faceSize * faceSize * 4)));
                    
                    for (let k = 0; k < numCrops; k++) {
                        const x = Math.floor(Math.random() * (img.width - faceSize));
                        const y = Math.floor(Math.random() * (img.height - faceSize));
                        
                        ctx.drawImage(img, x, y, faceSize, faceSize, 0, 0, faceSize, faceSize);
                        
                        const newImg = new Image();
                        newImg.src = canvas.toDataURL('image/jpeg');
                        newImg.loaded = true;
                        enemyImages.push(newImg);
                    }
                    processedCount++;
                }
                
                if (processedCount === files.length) {
                    statusEl.textContent = `已添加 ${enemyImages.length} 个头像`;
                }
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function handleBossUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const statusEl = document.getElementById('bossUploadStatus');
    statusEl.textContent = '加载中...';
    
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            customBossImage = img;
            statusEl.textContent = 'Boss头像已设置!';
            console.log('自定义Boss图片已加载');
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

function handleShooterUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const statusEl = document.getElementById('shooterUploadStatus');
    statusEl.textContent = '加载中...';
    
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            img.loaded = true;
            player.image = img;
            player.currentShooter = 'custom';
            
            // 清除其他按钮激活状态
            document.querySelectorAll('.shooter-btn').forEach(btn => btn.classList.remove('active'));
            
            statusEl.textContent = '玩家头像已设置!';
            console.log('自定义玩家图片已加载');
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

// 选择射击者
function selectShooter(shooterNum) {
    if (gameState !== 'playing') {
        const selectedImage = shooterNum === 1 ? shooterImages.shooter1 : shooterImages.shooter2;
        if (selectedImage.loaded) {
            player.currentShooter = shooterNum;
            player.image = selectedImage;
            console.log(`切换到射击者 ${shooterNum}`);
        } else {
            console.warn(`射击者 ${shooterNum} 的图片未加载，无法切换`);
            alert(`射击者 ${shooterNum} 的图片未找到，请确保 shooter${shooterNum}.png 或 shooter${shooterNum}.jpg 文件存在于游戏文件夹中`);
        }
        
        // 更新按钮样式
        document.querySelectorAll('.shooter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`shooter${shooterNum}Btn`).classList.add('active');
    }
}

// 开始游戏
function startGame() {
    ensureAudio();
    startBGM();
    gameState = 'playing';
    score = 0;
    lives = 3;
    level = 1;
    gameSpeed = 2;
    bullets = [];
    enemies = [];
    player.x = canvas.width / 2 - 25;
    
    // 确保使用已加载的射击者图片
    const selectedShooter = player.currentShooter || 1;
    const selectedImage = selectedShooter === 1 ? shooterImages.shooter1 : shooterImages.shooter2;
    
    if (selectedImage.loaded) {
        player.currentShooter = selectedShooter;
        player.image = selectedImage;
        console.log(`游戏开始，使用射击者 ${selectedShooter}`);
    } else {
        // 尝试使用另一个已加载的图片
        const altImage = selectedShooter === 1 ? shooterImages.shooter2 : shooterImages.shooter1;
        if (altImage.loaded) {
            player.currentShooter = selectedShooter === 1 ? 2 : 1;
            player.image = altImage;
            console.log(`射击者 ${selectedShooter} 未加载，切换到射击者 ${player.currentShooter}`);
        } else {
            console.warn('没有图片加载成功，使用默认图形');
            player.image = null;
        }
    }
    
    updateUI();
    gameLoop();
}

// 暂停/继续
function togglePause() {
    if (gameState === 'playing') {
        gameState = 'paused';
        stopBGM();
    } else if (gameState === 'paused') {
        gameState = 'playing';
        startBGM();
        gameLoop();
    }
}

// 重新开始
function restartGame() {
    document.getElementById('gameOver').classList.add('hidden');
    startGame();
}

// 射击
function shoot() {
    const bx = player.x + player.width / 2 - 2;
    const by = player.y;
    bullets.push({ x: bx, y: by, width: 4, height: 10, speed: 8, color: '#ffff00' });
    spawnParticles(bx, by + 8, '#ffff88', 6, 2.2);
    playShoot();
}

// 创建敌人
function createEnemy() {
    const spawnRate = 0.02 + level * 0.006;
    if (bossActive) return;
    if (Math.random() < spawnRate) {
        const typeRand = Math.random();
        let type = 'normal';
        if (level >= 3 && typeRand < 0.25) type = 'fast';
        else if (level >= 4 && typeRand < 0.5) type = 'zigzag';
        else if (level >= 5 && typeRand < 0.65) type = 'tank';
        const baseSpeed = gameSpeed + Math.random() * 2;
        let speed = baseSpeed;
        let hp = 1;
        let color = '#ff0000';
        let vx = 0;
        let ax = 0.03;
        if (type === 'fast') {
            speed = baseSpeed + 1.5;
            color = '#ff5555';
        } else if (type === 'zigzag') {
            speed = baseSpeed + 0.5;
            color = '#ff8844';
            vx = (Math.random() < 0.5 ? -1 : 1) * (0.8 + Math.random());
        } else if (type === 'tank') {
            speed = baseSpeed * 0.8;
            color = '#dd2222';
            hp = 3;
        }
        enemies.push({
            x: Math.random() * (canvas.width - 40),
            y: -40,
            width: 40,
            height: 40,
            speed,
            color,
            image: getRandomEnemyImage(),
            type,
            hp,
            vx,
            ax
        });
    }
}

// 更新玩家位置
function updatePlayer() {
    if (keys['ArrowLeft'] && player.x > 0) {
        player.x -= player.speed;
    }
    if (keys['ArrowRight'] && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }
    if (keys['ArrowUp'] && player.y > 0) {
        player.y -= player.speed;
    }
    if (keys['ArrowDown'] && player.y < canvas.height - player.height) {
        player.y += player.speed;
    }
    const now = performance.now();
    const currentCooldown = now < rapidFireUntil ? 120 : bulletCooldown;
    if (keys[' '] && now - lastShotTime >= currentCooldown) {
        lastShotTime = now;
        shoot();
    }
}

// 更新子弹
function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= bullets[i].speed;
        
        // 移除超出屏幕的子弹
        if (bullets[i].y < 0) {
            bullets.splice(i, 1);
            continue;
        }
        
        // 检测子弹与敌人碰撞
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (checkCollision(bullets[i], enemies[j])) {
                const hitX = enemies[j].x + enemies[j].width / 2;
                const hitY = enemies[j].y + enemies[j].height / 2;
                bullets.splice(i, 1);
                enemies[j].hp = (enemies[j].hp || 1) - 1;
                spawnParticles(hitX, hitY, '#ffddaa', 10, 2.8);
                if (enemies[j].hp <= 0) {
                    spawnParticles(hitX, hitY, '#ffaa66', 24, 3.8);
                    shakeTime = 10;
                    shakeIntensity = 3;
                    score += 10;
                    playExplosion();
                    if (Math.random() < 0.06) {
                        powerUps.push({
                            x: enemies[j].x + enemies[j].width / 2 - 8,
                            y: enemies[j].y + enemies[j].height / 2 - 8,
                            width: 16,
                            height: 16,
                            speed: 2,
                            type: 'rapid'
                        });
                    }
                    enemies.splice(j, 1);
                    updateUI();
                }
                break;
            }
        }
        
        // 检测子弹与Boss碰撞
        if (bossActive && boss && boss.state === 'fight') {
            if (checkCollision(bullets[i], boss)) {
                bullets.splice(i, 1);
                boss.hp -= 1;
                spawnParticles(bullets[i].x, bullets[i].y, '#ffaa88', 8, 2.5);
                playDamage(); // 使用受伤音效
                
                if (boss.hp <= 0) {
                    // Boss死亡逻辑
                    spawnParticles(boss.x + boss.width / 2, boss.y + boss.height / 2, '#ff9966', 80, 5.0);
                    shakeTime = 30;
                    shakeIntensity = 8;
                    playExplosion(); // 播放爆炸音效
                    setTimeout(playExplosion, 200); // 再播放一次增强效果
                    score += 500;
                    bossActive = false;
                    boss = null;
                    nextBossLevel = level + 3;
                    updateUI();
                }
                continue; // 子弹已消失，跳过后续检测
            }
        }
    }
}

// 更新敌人
function updateEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        e.y += e.speed;
        if (e.type === 'zigzag') {
            e.x += e.vx;
            e.vx += e.ax * (Math.random() < 0.02 ? (Math.random() < 0.5 ? -1 : 1) : 0);
            if (e.x < 0 || e.x > canvas.width - e.width) e.vx *= -1;
        }
        
        // 移除超出屏幕的敌人
        if (e.y > canvas.height) {
            enemies.splice(i, 1);
            continue;
        }
        
        // 检测敌人与玩家碰撞
        if (checkCollision(e, player)) {
            spawnParticles(player.x + player.width / 2, player.y + player.height / 2, '#99ff99', 20, 3.2);
            enemies.splice(i, 1);
            lives--;
            shakeTime = 12;
            shakeIntensity = 4;
            playDamage();
            updateUI();
            
            if (lives <= 0) {
                gameOver();
            }
        }
    }
}
function updatePowerUps() {
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const p = powerUps[i];
        p.y += p.speed;
        if (p.y > canvas.height) {
            powerUps.splice(i, 1);
            continue;
        }
        if (checkCollision(p, player)) {
            if (p.type === 'rapid') {
                rapidFireUntil = performance.now() + 6000;
            }
            spawnParticles(player.x + player.width / 2, player.y, '#ffff88', 12, 2.4);
            playPowerup();
            powerUps.splice(i, 1);
        }
    }
}

// 碰撞检测
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// 更新星星背景
function updateStars() {
    for (let star of stars) {
        star.y += star.speed;
        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }
    }
}

// 绘制函数
function draw() {
    const shakeX = shakeTime > 0 ? (Math.random() - 0.5) * 2 * shakeIntensity : 0;
    const shakeY = shakeTime > 0 ? (Math.random() - 0.5) * 2 * shakeIntensity : 0;
    if (shakeTime > 0) shakeTime--;
    ctx.save();
    ctx.translate(shakeX, shakeY);
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制星星
    ctx.fillStyle = '#ffffff';
    for (let star of stars) {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 绘制玩家
    if (player.image && player.image.loaded && player.image.complete && player.image.naturalWidth > 0) {
        try {
            ctx.drawImage(player.image, player.x, player.y, player.width, player.height);
        } catch (e) {
            console.error('绘制图片时出错:', e);
            drawDefaultPlayer();
        }
    } else {
        drawDefaultPlayer();
    }
    
    ctx.fillStyle = '#ffff00';
    for (let bullet of bullets) {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }
    
    for (let enemy of enemies) {
        if (enemy.image && enemy.image.loaded && enemy.image.complete && enemy.image.naturalWidth > 0) {
            try {
                ctx.drawImage(enemy.image, enemy.x, enemy.y, enemy.width, enemy.height);
            } catch (e) {
                console.error('绘制敌人图片时出错:', e);
                drawDefaultEnemy(enemy);
            }
        } else {
            drawDefaultEnemy(enemy);
        }
    }
    for (let p of particles) {
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
    for (let pu of powerUps) {
        ctx.fillStyle = '#ffee66';
        ctx.beginPath();
        ctx.arc(pu.x + pu.width / 2, pu.y + pu.height / 2, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ccaa22';
        ctx.fillRect(pu.x + 6, pu.y + 5, 4, 12);
    }
    if (bossActive && boss) {
        drawBoss();
        drawBossBullets();
    }
    
    // 暂停提示
    if (gameState === 'paused') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('暂停', canvas.width / 2, canvas.height / 2);
    }
    if (levelMessageTime > 0) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffd700';
        ctx.font = '36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`关卡 ${level}`, canvas.width / 2, canvas.height / 2 - 20);
        levelMessageTime--;
    }
    ctx.restore();
}

// 绘制默认玩家图形
function drawDefaultPlayer() {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // 绘制玩家细节（三角形飞船）
    ctx.fillStyle = '#00cc00';
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x, player.y + player.height);
    ctx.lineTo(player.x + player.width, player.y + player.height);
    ctx.closePath();
    ctx.fill();
}

// 绘制默认敌人图形
function drawDefaultEnemy(enemy) {
    ctx.fillStyle = enemy.color;
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    
    // 绘制敌人细节（X形状）
    ctx.strokeStyle = '#cc0000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(enemy.x, enemy.y);
    ctx.lineTo(enemy.x + enemy.width, enemy.y + enemy.height);
    ctx.moveTo(enemy.x + enemy.width, enemy.y);
    ctx.lineTo(enemy.x, enemy.y + enemy.height);
    ctx.stroke();
}

// 更新UI
function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = lives;
    document.getElementById('level').textContent = level;
    
    const newLevel = Math.floor(score / 100) + 1;
    if (newLevel > level) {
        level = newLevel;
        levelUp();
    }
}
function levelUp() {
    gameSpeed += 0.6;
    levelMessageTime = 120;
    playLevelUp();
    if (!bossActive && level >= nextBossLevel) {
        createBoss();
    }
}

// 游戏结束
function gameOver() {
    stopBGM();
    gameState = 'gameOver';
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOver').classList.remove('hidden');
}

// 游戏主循环
function gameLoop() {
    if (gameState === 'playing') {
        updateStars();
        updatePlayer();
        createEnemy();
        updateBullets();
        updateEnemies();
        updatePowerUps();
        updateBoss();
        updateBossBullets();
        updateParticles();
        draw();
        requestAnimationFrame(gameLoop);
    }
}

// 初始绘制
draw();
function spawnParticles(x, y, color, count, speed) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x,
            y,
            vx: (Math.random() - 0.5) * speed * 2,
            vy: (Math.random() - 0.5) * speed * 2 - 0.5,
            size: 2 + Math.random() * 3,
            color,
            alpha: 1,
            decay: 0.02 + Math.random() * 0.02
        });
    }
}
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.02;
        p.alpha -= p.decay;
        if (p.alpha <= 0 || p.y > canvas.height + 20) {
            particles.splice(i, 1);
        }
    }
}
function ensureAudio() {
    if (!audioCtx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (Ctx) audioCtx = new Ctx();
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}
function tone(freq, duration, type = 'sine', gainVal = 0.12) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}
function playShoot() {
    ensureAudio();
    tone(860, 0.05, 'square', 0.08);
    tone(620, 0.05, 'square', 0.06);
}
function playExplosion() {
    ensureAudio();
    tone(180, 0.2, 'sawtooth', 0.14);
    tone(120, 0.25, 'triangle', 0.12);
}
function playPowerup() {
    ensureAudio();
    tone(600, 0.08, 'sine', 0.08);
    setTimeout(() => tone(800, 0.08, 'sine', 0.08), 60);
}
function playLevelUp() {
    ensureAudio();
    tone(500, 0.12, 'triangle', 0.1);
    setTimeout(() => tone(700, 0.12, 'triangle', 0.1), 140);
    setTimeout(() => tone(900, 0.12, 'triangle', 0.1), 280);
}
function playDamage() {
    ensureAudio();
    tone(220, 0.1, 'sine', 0.12);
}
function playBossEnter() {
    ensureAudio();
    tone(160, 0.3, 'square', 0.12);
    setTimeout(() => tone(140, 0.3, 'square', 0.12), 280);
}
function playBossShoot() {
    ensureAudio();
    tone(380, 0.06, 'square', 0.08);
}
function createBoss() {
    bossActive = true;
    const hpBase = 60 + level * 10;
    boss = {
        x: canvas.width / 2 - 60,
        y: -120,
        width: 120,
        height: 90,
        hp: hpBase,
        maxHp: hpBase,
        vx: 2.2,
        vy: 2.0,
        state: 'enter'
    };
    nextBossShotTime = performance.now() + 1200;
    bossBullets = [];
    playBossEnter();
}
function updateBoss() {
    if (!bossActive || !boss) return;
    if (boss.state === 'enter') {
        boss.y += boss.vy;
        if (boss.y >= 60) boss.state = 'fight';
    } else {
        boss.x += boss.vx;
        if (boss.x < 0 || boss.x > canvas.width - boss.width) boss.vx *= -1;
        const now = performance.now();
        if (now >= nextBossShotTime) {
            bossShoot();
            nextBossShotTime = now + bossShotInterval;
        }
    }
}
function bossShoot() {
    const cx = boss.x + boss.width / 2;
    const cy = boss.y + boss.height;
    const pattern = level % 2 === 0 ? 'spread' : 'aimed';
    if (pattern === 'spread') {
        for (let k = -3; k <= 3; k++) {
            bossBullets.push({ x: cx, y: cy, vx: k * 1.1, vy: 3.0 });
        }
    } else {
        const dx = (player.x + player.width / 2) - cx;
        const dy = (player.y + player.height / 2) - cy;
        const l = Math.hypot(dx, dy) || 1;
        bossBullets.push({ x: cx, y: cy, vx: (dx / l) * 3.2, vy: (dy / l) * 3.2 });
    }
    playBossShoot();
}
function updateBossBullets() {
    for (let i = bossBullets.length - 1; i >= 0; i--) {
        const b = bossBullets[i];
        b.x += b.vx;
        b.y += b.vy;
        if (b.x < -10 || b.x > canvas.width + 10 || b.y > canvas.height + 10) {
            bossBullets.splice(i, 1);
            continue;
        }
        if (checkCollision({ x: b.x - 3, y: b.y - 3, width: 6, height: 6 }, player)) {
            spawnParticles(player.x + player.width / 2, player.y + player.height / 2, '#99ff99', 16, 3.0);
            bossBullets.splice(i, 1);
            lives--;
            shakeTime = 14;
            shakeIntensity = 5;
            playDamage();
            updateUI();
            if (lives <= 0) gameOver();
        }
    }
}
function drawBoss() {
    if (customBossImage && customBossImage.complete && customBossImage.naturalWidth > 0) {
        ctx.drawImage(customBossImage, boss.x, boss.y, boss.width, boss.height);
    } else {
        const g = ctx.createLinearGradient(boss.x, boss.y, boss.x, boss.y + boss.height);
        g.addColorStop(0, '#aa2244');
        g.addColorStop(1, '#661122');
        ctx.fillStyle = g;
        ctx.fillRect(boss.x, boss.y, boss.width, boss.height);
        ctx.fillStyle = '#ffeeee';
        ctx.fillRect(boss.x + boss.width / 2 - 12, boss.y + 8, 24, 12);
    }
    const barW = boss.width;
    const hpRatio = Math.max(0, boss.hp / boss.maxHp);
    ctx.fillStyle = '#333333';
    ctx.fillRect(boss.x, boss.y - 12, barW, 8);
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(boss.x, boss.y - 12, barW * hpRatio, 8);
    if (boss.hp <= 0) {
        // 绘制时的死亡效果已被updateBullets中的逻辑接管，这里仅保留作为保险
        if (bossActive) {
             bossActive = false;
             boss = null;
        }
    }
}
function startBGM() {
    if (isBgmPlaying || !audioCtx) return;
    isBgmPlaying = true;
    
    // 简单的 BGM 循环：每 1.6 秒循环一次 4 个音符
    // Bass: C2, G2, A2, F2
    const bassNotes = [65.41, 98.00, 110.00, 87.31];
    let noteIndex = 0;
    
    function playNote() {
        if (!isBgmPlaying) return;
        
        // 播放当前 Bass 音符
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = bassNotes[noteIndex];
        
        // 低频 Bass 稍微大声一点
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
        
        // 简单的 Melody 装饰 (高八度)
        if (noteIndex % 2 === 0) {
            const osc2 = audioCtx.createOscillator();
            const gain2 = audioCtx.createGain();
            osc2.type = 'sine';
            osc2.frequency.value = bassNotes[noteIndex] * 4; // 高两八度
            gain2.gain.setValueAtTime(0.03, audioCtx.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
            osc2.connect(gain2);
            gain2.connect(audioCtx.destination);
            osc2.start();
            osc2.stop(audioCtx.currentTime + 0.1);
        }

        noteIndex = (noteIndex + 1) % bassNotes.length;
        bgmTimer = setTimeout(playNote, 400); // 100 BPM quarter notes
    }
    
    playNote();
}

function stopBGM() {
    isBgmPlaying = false;
    if (bgmTimer) {
        clearTimeout(bgmTimer);
        bgmTimer = null;
    }
    // 停止所有正在播放的节点（如果需要更严格的清理）
}
function drawBossBullets() {
    ctx.fillStyle = '#ffcc88';
    for (let b of bossBullets) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
        ctx.fill();
    }
}

