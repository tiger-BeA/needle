import './lib/index.scss';
// import BezierMaker from './lib/bezierMaker';
import config from './config.json';
import $ from 'axios';

const Phaser = window.Phaser || {};
process.env.NODE_ENV !== 'production' && require('./index.html');

// 把bg和gif都放到html里面去
window.onload = () => {
    const SCALE = window.innerWidth / window.innerHeight > 0.556 ? window.innerHeight / 1350 : window.innerWidth / 750;
    const WIDTH = window.innerWidth / SCALE;
    const HEIGHT = window.innerHeight / SCALE;

    const game = new Phaser.Game(WIDTH, HEIGHT, Phaser.CANVAS, 'app', undefined, true);
    const $domVideo = document.getElementById('video');
    const $btnSkip = document.getElementById('skip-btn');
    const $domApp = document.getElementById('app');
    const $imgGif = document.getElementById('loading-gif');

    const Start = {
        preload() {
            game.load.image('startTxt', config.startTxt);
            game.load.image('startGif', config.startGif);
        },
        create() {
            game.state.start('Loading');
        },
        init() {
            game.scale.setUserScale(SCALE);
            game.scale.scaleMode = Phaser.ScaleManager.USER_SCALE;
            game.scale.fullScreenScaleMode = Phaser.ScaleManager.USER_SCALE;
            game.scale.pageAlignHorizontally = true;
            game.scale.pageAlignVertically = true;
        }
    };

    const Loading = {
        preload() {
            $imgGif.src = config.startGif;
            // const gif = game.add.sprite(WIDTH / 2, HEIGHT / 2, 'startGif');
            // game.load.setPreloadSprite(gif);
            // gif.anchor.setTo(0.5, 1);
            // fadeIn(gif);

            game.load.image('bg1', config.bg1);
            game.load.video('video', config.video);
            game.load.image('needle', config.needle);
            game.load.image('control', config.controlBtn);
            game.load.image('rope', config.line);
            game.load.image('replay', config.replay);
            game.load.image('info', config.info);
            game.load.image('upload', config.upload);
            game.load.image('skip', config.skip);

            const loadText = game.add.text(WIDTH / 2, HEIGHT / 2, '0%', { fill:'#FFF', 'fontSize':`39px` });
            loadText.anchor.setTo(0.5, 0);

            // 单个文件加载完的回调
            game.load.onFileComplete.add(function() {
                loadText.setText(`${arguments[0]}%`);
            });
            // // 所有文件加载完成回调
            // game.load.onLoadComplete.add(() => {
            // });
        },
        create() {
            const txt = game.add.button(WIDTH / 2, HEIGHT / 2 + 123, 'startTxt', () => {
                $domApp.style.background = '#000';
                // game.state.clearCurrentState();
                initVideo();
            });
            txt.anchor.setTo(0.5, 0);
            fadeIn(txt);
        },
    }

    const Game = {
        create,
        update,
        render,
    };

    function fadeIn(obj, duration = 500, alpha = 1) {
        obj.alpha = 0;
        game.add.tween(obj).to({ alpha }, duration, 'Linear', true);
    }

    game.state.add('Start', Start);
    game.state.add('Loading', Loading);
    game.state.add('Game', Game);
    game.state.start('Start');

    let btn;
    let replay;
    let needle;
    let BTN_CENTER;

    let bmd;

    let cropRect;

    let isDisableUpdate;
    let ropeLength;
    let ropeInfo;
    let rope;

    const RATE_EACH_FRAME = 50;

    const REDUCE_DURATION = RATE_EACH_FRAME * 15;

    const CROP_OFFSET_Y = RATE_EACH_FRAME / 60;

    let isTouchBtn;

    let timer;

    function create() {
        timer = null;
        isDisableUpdate = false;
        isTouchBtn = false;
        initHtml();
        initRope();
        initLine();
        initNeedle();
        initBtn();
    }

    function render() {
        // 画线
        // game.context.lineWidth = 6 * SCALE;
        // rope = new BezierMaker(game.context, [
        //     {x: 46, y: 150},
        //     {x: 0, y: 250},
        //     {x: 170, y: 210},
        //     {x: -40, y: 240},
        //     {x: 30, y: 350},
        //     {x: 20, y: 290},
        //     {x: 130, y: 380},
        //     {x: 0, y: 400},
        //     {x: 40, y: 430},
        //     {x: 45, y: 480},
        // ], '#f00');
        // rope.drawBezier();
    }

    function initVideo() {
        $domVideo.src = config.video;
        $btnSkip.style.background = `url(${config.skip}) no-repeat center/100%`;

        $domVideo.classList.remove('f-hide');
        $btnSkip.classList.remove('f-hide');

        $domVideo.play();

        $domVideo.addEventListener('click', (e) => {
            e.preventDefault();
            return false;
        });

        $domVideo.addEventListener('play', function() {
            $domApp.style.opacity = 0;
            game.state.start('Game');
        });

        //监听结束
        $domVideo.addEventListener('ended', function() {
            $domApp.style.opacity = 1;
            $domVideo.src = '';
            this.webkitExitFullScreen();
            $domVideo.classList.add('f-hide');
            $btnSkip.classList.add('f-hide');
        }, false);

        $domVideo.addEventListener('pause', function() {
            $domApp.style.opacity = 1;
            $domVideo.src = '';
            this.webkitExitFullScreen();
            $domVideo.classList.add('f-hide');
            $btnSkip.classList.add('f-hide');
        }, false);

        $btnSkip.addEventListener('click', () => {
            $domVideo.pause();
        });
    }

    function update() {
        if (!isDisableUpdate) {
            updateEmbroid();
            updateInfo();
        }
    }

    function initRope() {
        ropeLength = 15;
        ropeInfo = game.add.text(30, game.world.centerY + 327,
            '剩余\n15厘米', {
            font: `29px lighter`,
            fill: 'rgb(255, 247, 223)',
            align: 'center'
        });
        ropeInfo.setShadow(0, 4, 'rgba(0, 0, 0, 0.38)', 7.56);

        rope = game.add.sprite(40, game.world.centerY - 347, 'rope');
        initCropRope(rope.width, rope.height);
    }

    function initNeedle() {
        const x = game.width / 2;
        const y = game.height / 2 + 126;
        needle = game.add.sprite(x, y, 'needle');
        needle.anchor.setTo(0.5, 0.95);

        game.physics.startSystem(Phaser.Physics.ARCADE);
        game.physics.enable(needle, Phaser.Physics.ARCADE);
        needle.body.collideWorldBounds = true;
    }

    function initBtn() {
        BTN_CENTER = { x: game.width / 2, y: game.height - 141 }
        btn = game.add.sprite(BTN_CENTER.x, BTN_CENTER.y, 'control');
        btn.anchor.setTo(0.5);

        btn.inputEnabled = true;
        btn.input.enableDrag();
        btn.input.boundsRect = new Phaser.Rectangle(btn.x - btn.width, btn.y - btn.height / 2, btn.width * 2, btn.height);

        btn.events.onDragStart.add(dragStart);
        btn.events.onDragUpdate.add(dragUpdate);
        btn.events.onDragStop.add(dragStop);
    }

    function dragStart() {
        isTouchBtn = true;
        if (!timer) {
            initTimer();
        } else {
            timer.resume();
        }
    }

    function dragUpdate() {
    }

    function dragStop() {
        isTouchBtn = false;
        timer && timer.pause();
        game.add.tween(btn).to({x: game.width / 2}, 300, Phaser.Easing.Back.Out, true);
    }

    function initHtml() {
        $domApp.style.background = `url(${config.bg1}) no-repeat center/cover`;
        // const bg = game.add.image(WIDTH / 2, HEIGHT / 2, 'bg1');
        // bg.anchor.setTo(0.5, 0.5);

        const info = game.add.image(WIDTH / 2, HEIGHT - 70, 'info');
        info.anchor.setTo(0.5, 1);

        replay = game.add.button(WIDTH, 15, 'replay', () => { game.state.start('Game'); });
        replay.anchor.setTo(1, 0);
    }


    function initTimer() {
        timer = game.time.create(true);
        timer.loop(REDUCE_DURATION, reduceRope, this);
        timer.start();
    }

    function reduceRope() {
        if (--ropeLength < 0) {
            timer.stop(true);
            isDisableUpdate = true;
            destoryNeedle();
            cropRect.resize(0, 0);
            rope.updateCrop();

            const uploadImg = game.add.image(WIDTH / 2, HEIGHT / 2, 'upload');
            uploadImg.anchor.setTo(0.5);
            fadeIn(uploadImg);

            disableBtn();
            // TODO: 向后端发送base64数据
            // $.post('/getRealShape', {
            //     dataUrl: bmd.canvas.toDataURL()
            // }).then((res) => {
            //     uploadImg.destory();
            //     // TODO: 显示识别结果页面
            // }).catch(() => {
            //     // TODO: 需要识别失败的提示和交互
            // });
        }
    }

    function disableBtn() {
        game.add.tween(btn).to({ x: game.width / 2 }, 300, Phaser.Easing.Back.Out, true);
        btn.inputEnabled = false;
        replay.inputEnabled = false;
    }

    function updateInfo() {
        ropeInfo.setText(`剩余\n${ropeLength}厘米`)
    }

    function destoryNeedle() {
        needle.body.velocity.x = 0;
        needle.body.velocity.y = 0;
        needle.body.angularVelocity = 0;
    }

    function updateEmbroid() {
        needle.body.velocity.x = 0;
        needle.body.velocity.y = 0;
        needle.body.angularVelocity = 0;

        if (isTouchBtn) {
            if (btn.x - BTN_CENTER.x > 30) {
                // 右转
                needle.body.angularVelocity = 100;
            } else if (btn.x - BTN_CENTER.x < -30) {
                // 左转
                needle.body.angularVelocity = -100;
            }
            game.physics.arcade.velocityFromAngle(needle.angle - 90, RATE_EACH_FRAME, needle.body.velocity);
            updateLine(needle.centerX, needle.y, needle.angle + 90);
            updateCropRope();
        }
    }

    function initLine() {
        bmd = game.add.bitmapData(WIDTH, HEIGHT);
        bmd.context.fillStyle = '#ff0000';
        bmd.context.globalCompositeOperation = 'source-over';
        bmd.dirty = true;
        game.add.sprite(0, 0, bmd);
    }

    function updateLine(x, y) {
        bmd.context.fillRect(x - 2.5, y, 5, 5);
    }

    function initCropRope(w, h) {
        cropRect = new Phaser.Rectangle(0, 0, w, h);
        rope.crop(cropRect);
    }

    function updateCropRope() {
        cropRect.y -= CROP_OFFSET_Y;
        rope.updateCrop();
    }
};
