import './lib/index.scss';
// import BezierMaker from './lib/bezierMaker';
import config from './config.json';
import $ from 'axios';

const Phaser = window.Phaser || {};
process.env.NODE_ENV !== 'production' && require('./index.html');

// 把bg和gif都放到html里面去
window.onload = () => {
    const SCALE = window.innerWidth / 750;
    const WIDTH = window.innerWidth;
    const HEIGHT = window.innerHeight;

    let game = new Phaser.Game(WIDTH, HEIGHT, Phaser.CANVAS, '', undefined, true);

    const Start = {
        preload() {
            // game.scale.scaleMode = Phaser.ScaleManager.EXACT_FIT;
            // game.scale.forcePortrait = true;
            // game.scale.refresh();

            // game.load.onFileComplete.add(function(){
            // });
            game.load.image('startTxt', config.startTxt);
            game.load.image('startGif', config.startGif);
        },
        create() {
            game.state.start('Loading');
        }
    };

    const Loading = {
        preload() {
            const gif = game.add.sprite(WIDTH / 2, HEIGHT / 2, 'startGif');
            // game.load.setPreloadSprite(gif);
            gif.scale.setTo(SCALE);
            gif.anchor.setTo(0.5, 1);
            fadeIn(gif);

            game.load.image('bg1', config.bg1);
            game.load.video('video', config.video);
            game.load.image('needle', config.needle);
            game.load.image('control', config.controlBtn);
            game.load.image('rope', config.line);
            game.load.image('replay', config.replay);
            game.load.image('info', config.info);
            game.load.image('upload', config.upload);

            const loadText = game.add.text(WIDTH / 2, HEIGHT / 2, '0%', { fill:'#FFF', 'fontSize':`${39 * SCALE}px` });
            loadText.anchor.setTo(0.5, 0);

            // 单个文件加载完的回调
            game.load.onFileComplete.add(function() {
                loadText.setText(`${arguments[0]}%`);
            });
            // 所有文件加载完成回调
            game.load.onLoadComplete.add(() => {
                const txt = game.add.button(WIDTH / 2, HEIGHT / 2 + 123 * SCALE, 'startTxt', () => {
                    document.body.style.background = '#000';
                    game.state.start('Video');
                });
                txt.anchor.setTo(0.5, 0);
                txt.scale.setTo(SCALE);
                fadeIn(txt);
            });
        },
        create() {},
    }

    const Game = {
        create,
        update,
        render,
    };

    const Video = {
        create() {
            const video = game.add.video('video');
            const scale = Math.min(WIDTH / video.width, HEIGHT / video.height);
            video.addToWorld(game.world.centerX, game.world.centerY, 0.5, 0.5, scale, scale);
            video.play();
            fadeIn(video);

            const txt = game.add.text(WIDTH - 15, 15, '跳过', { fill: '#FFF', 'font': `${39 * SCALE}px light` });
            txt.anchor.setTo(1, 0);
            txt.inputEnabled = true;
            txt.events.onInputDown.add(() => {
                video.stop();
                game.state.start('Game');
            });

            video.onComplete.addOnce(() => {
                txt.destory();
                game.state.start('Game');
            });
        }
    }

    function fadeIn(obj, duration = 500, alpha = 1) {
        obj.alpha = 0;
        game.add.tween(obj).to({ alpha }, duration, 'Linear', true);
    }

    game.state.add('Start', Start);
    game.state.add('Loading', Loading);
    game.state.add('Game', Game);
    game.state.add('Video', Video);
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

    const REDUCE_DURATION = RATE_EACH_FRAME * 10;

    const CROP_OFFSET_Y = RATE_EACH_FRAME / 26;

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

    function update() {
        if (!isDisableUpdate) {
            updateEmbroid();
            updateInfo();
        }
    }

    function initRope() {
        ropeLength = 15;
        ropeInfo = game.add.text(30 * SCALE, game.world.centerY + 327 * SCALE,
            '剩余\n15厘米', {
            font: `${29 * SCALE}px lighter`,
            fill: 'rgb(255, 247, 223)',
            align: 'center'
        });
        ropeInfo.setShadow(0, 4 * SCALE, 'rgba(0, 0, 0, 0.38)', 7.56 * SCALE);

        rope = game.add.sprite(40 * SCALE, game.world.centerY - 347 * SCALE, 'rope');
        rope.scale.setTo(SCALE);
        initCropRope(rope.width * 2, rope.height * 2);
    }

    function initNeedle() {
        const x = game.width / 2;
        const y = game.height / 2 + 126 * SCALE;
        needle = game.add.sprite(x, y, 'needle');
        needle.scale.setTo(SCALE);
        needle.anchor.setTo(0.5, 0.9);

        game.physics.startSystem(Phaser.Physics.ARCADE);
        game.physics.enable(needle, Phaser.Physics.ARCADE);
        needle.body.collideWorldBounds = true;
    }

    function initBtn() {
        BTN_CENTER = { x: game.width / 2, y: game.height - 141 * SCALE }
        btn = game.add.sprite(BTN_CENTER.x, BTN_CENTER.y, 'control');
        btn.anchor.setTo(0.5);
        btn.scale.setTo(SCALE);

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
        const bg = game.add.image(WIDTH / 2, HEIGHT / 2, 'bg1');
        bg.scale.setTo(Math.max(SCALE, window.innerHeight / bg.height));
        bg.anchor.setTo(0.5, 0.5);

        const info = game.add.image(WIDTH / 2, HEIGHT - 70 * SCALE, 'info');
        info.scale.setTo(SCALE);
        info.anchor.setTo(0.5, 1);

        replay = game.add.button(WIDTH, 0, 'replay', () => { game.state.start('Game'); });
        replay.scale.setTo(SCALE);
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
            uploadImg.scale.setTo(SCALE);
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
        game.add.tween(btn).to({x: game.width / 2}, 300, Phaser.Easing.Back.Out, true);
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
        // line = game.make.sprite(0, 0, 'line');
        // line.anchor.setTo(0.5, 0);
        // line.scale.setTo(SCALE);
        bmd = game.add.bitmapData(WIDTH, HEIGHT);
        bmd.context.fillStyle = '#ff0000';
        bmd.context.globalCompositeOperation = 'source-over';
        bmd.dirty = true;
        game.add.sprite(0, 0, bmd);
    }

    function updateLine(x, y) {
        bmd.context.fillRect(x, y, 2, 2);
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
