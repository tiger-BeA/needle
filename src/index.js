import './lib/index.scss';
import config from './config.json';
const $ = window.$;
const Phaser = window.Phaser || {};
process.env.NODE_ENV !== 'production' && require('./index.html');

// 把bg和gif都放到html里面去
window.onload = () => {
    const SCALE = window.innerWidth / window.innerHeight > 0.556 ? window.innerHeight / 1350 : window.innerWidth / 750;
    const WIDTH = window.innerWidth / SCALE;
    const HEIGHT = window.innerHeight / SCALE;

    const game = new Phaser.Game(WIDTH, HEIGHT, Phaser.AUTO, 'app', undefined, true);
    const $domVideo = document.getElementById('video');
    const $btnSkip = document.getElementById('skip-btn');
    const $domApp = document.getElementById('app');
    const $imgGif = document.getElementById('loading-gif');
    const $DomCloud = document.getElementById('m-cloud');
    const $DomFigureCard = document.getElementById('figure-card');
    const $DomGodLine = document.getElementById('god-line');

    let finalCardUrl = '';

    const Start = {
        preload() {
            game.load.image('startTxt', config.startTxt);
            game.load.image('startGif', config.startGif);
        },
        create() {
            game.state.start('RandomFigure');
            // game.state.start('Loading');
        },
        init() {
            game.scale.setUserScale(SCALE);
            game.scale.scaleMode = Phaser.ScaleManager.USER_SCALE;
            game.scale.fullScreenScaleMode = Phaser.ScaleManager.USER_SCALE;
            game.scale.pageAlignHorizontally = true;
            game.scale.pageAlignVertically = true;
        }
    };

    const isAndroid = navigator.userAgent.indexOf('Android') > -1 || navigator.userAgent.indexOf('Adr') > -1;
    const Loading = {
        preload() {
            $imgGif.src = config.startGif;

            // NOTE: 太大的gif这里加载不出来
            // const gif = game.add.sprite(WIDTH / 2, HEIGHT / 2, 'startGif');
            // game.load.setPreloadSprite(gif);
            // gif.anchor.setTo(0.5, 1);
            // fadeIn(gif);

            game.load.image('bg1', config.bg1);
            game.load.image('bg3', config.bg3);
            game.load.image('bg4', config.bg4);
            game.load.image('godLine', config.godLine);
            game.load.image('btnStart', config.btnStart);
            isAndroid ? game.load.video('video', config.video) : ($domVideo.src = config.video);
            game.load.image('needle', config.needle);
            game.load.image('control', config.controlBtn);
            game.load.image('rope', config.line);
            game.load.image('replay', config.replay);
            game.load.image('info', config.info);
            game.load.image('upload', config.upload);
            game.load.image('skip', config.skip);
            game.load.image('btnSave', config.btnSave);
            game.load.image('btnLink', config.btnLink);
            game.load.image('resTxt', config.resTxt);

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
                document.body.classList = ['step-2'];
                game.state.clearCurrentState();
                initVideo();
            });
            txt.anchor.setTo(0.5, 0);
            fadeIn(txt);
        },
        update() {

        }
    }

    const GameStart = {
        create() {
            const bg = game.add.image(WIDTH / 2, HEIGHT / 2, 'bg3');
            bg.anchor.setTo(0.5, 0.5);

            let startBtn = game.add.button(WIDTH / 2, HEIGHT / 2 + 444, 'btnStart', () => {
                showCloud(() => {
                    document.body.classList = ['step-4'];
                    game.state.start('Game');
                    hideCloud();
                });
            });
            startBtn.anchor.setTo(0.5, 0);
        }
    }

    const Game = {
        create,
        update,
        render,
    };

    const RandomFigure = {
        preload() {
            const index = Math.floor(Math.random() * 9 + 1);
            game.load.image('figure', `./img/p${index}.png`);
            game.load.image('figureTxt', `./img/p${index}_txt.png`);
            game.load.image('figureTlt', `./img/p${index}_tlt.png`);
            game.load.image('figureInfo', `./img/p${index}_info.png`);
            finalCardUrl = `./img/p${index}_card.jpg`;
            game.load.image('figureCard', finalCardUrl);
        },
        create() {
            document.body.style.background = `url(${config.bg4}) no-repeat center/cover`;

            // step1: 提示 + 用户自画
            const resTxt = game.add.image(75, HEIGHT - 389, 'resTxt');
            resTxt.anchor.setTo(0, 1);

            const selfFigure = game.add.image(WIDTH, HEIGHT, bmd);
            selfFigure.scale.setTo(0.6);
            selfFigure.anchor.setTo(1, 1);
            selfFigure.alpha = 0.6;

            // step2: 花纹 + 名字
            const figure = game.add.image(WIDTH * 0.8, 320, 'figure');
            figure.anchor.setTo(0.5, 0.5);
            figure.scale.setTo(1.59);
            game.add.tween(figure).to({ angle: 360 }, 60000, 'Linear', true);
            fadeIn(figure, 500, 1, 1000);

            const figureTlt = game.add.image(75, HEIGHT - 290, 'figureTlt');
            figureTlt.anchor.setTo(0, 1);
            fadeIn(figureTlt, 300, 1, 1000);

            // step3: 文案说明
            const figureTxt = game.add.image(75, HEIGHT - 95, 'figureTxt');
            figureTxt.anchor.setTo(0, 1);
            const lastTween = fadeIn(figureTxt, 500, 1, 2000);

            lastTween.onComplete.add(() => {
                let tmp = setTimeout(() => {
                    showCloud(() => {
                        game.state.start('figureLast');
                        hideCloud();
                    });
                }, 3000);
            });
        }
    }

    const figureLast = {
        create() {
            document.body.style.background = `url(${config.bg1}) no-repeat center/cover`;
            document.body.classList = ['step-5'];

            const figure = game.add.image(WIDTH / 2, HEIGHT / 2 + 100, 'figure');
            figure.anchor.setTo(0.5, 1);
            figure.scale.setTo(0.95);

            const info = game.add.image(WIDTH / 2, HEIGHT / 2 + 100, 'figureInfo');
            info.anchor.setTo(0.5, 0);

            $DomFigureCard.src = finalCardUrl;
        }
    }

    function fadeIn(obj, duration = 500, alpha = 1, delay = 0) {
        obj.alpha = 0;
        return game.add.tween(obj).to({ alpha }, duration, Phaser.Easing.Circular.In, true, delay);
    }


    game.state.add('Start', Start);
    game.state.add('Loading', Loading);
    game.state.add('Game', Game);
    game.state.add('GameStart', GameStart);
    game.state.add('RandomFigure', RandomFigure);
    game.state.add('figureLast', figureLast);
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
            game.state.start('GameStart');
        });

        //监听结束
        $domVideo.addEventListener('ended', function() {
            showGameStart();
        }, false);

        $domVideo.addEventListener('pause', function() {
            showGameStart();
        }, false);

        $btnSkip.addEventListener('click', () => {
            $domVideo.pause();
        });
    }

    function showGameStart() {
        $btnSkip.classList.add('f-hide');
        showCloud(() => {
            // TODO: 加godLine
            $DomGodLine.src = config.godLine;
            document.body.classList = ['step-3'];
            $domVideo.src = '';
            $domVideo.classList.add('f-hide');
            hideCloud();
        });
    }

    function showCloud(cb) {
        let clearTimer;
        const animationEndCb = () => {
            clearTimer && clearTimeout(clearTimer);
            clearTimer = setTimeout(() => {
                $DomCloud.removeEventListener('animationend', animationEndCb);
                cb && cb();
            }, 100);
        };
        $DomCloud.classList = ['f-slipIn'];
        $DomCloud.addEventListener('animationend', animationEndCb);
    }

    function hideCloud(cb) {
        let clearTimer;
        const animationEndCb = () => {
            clearTimer && clearTimeout(clearTimer);
            clearTimer = setTimeout(() => {
                $DomCloud.classList = ['f-hide'];
                $DomCloud.removeEventListener('animationend', animationEndCb);
                cb && cb();
            }, 100);
        };
        $DomCloud.classList = ['f-slipOut'];
        $DomCloud.addEventListener('animationend', animationEndCb);
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
        document.body.style.background = `url(${config.bg1}) no-repeat center/cover`;

        const info = game.add.image(WIDTH / 2, HEIGHT - 70, 'info');
        info.anchor.setTo(0.5, 1);

        replay = game.add.button(WIDTH, 15, 'replay', () => { game.state.restart('Game'); });
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

            disableBtn();
            uploadLoading();
            // TODO: 向后端发送base64数据
        }
    }

    function uploadLoading() {
        const rect = game.add.graphics(0, 0);
        rect.beginFill(0x0e264e);
        rect.drawRect(0, HEIGHT / 2 - 150, WIDTH, 300);
        rect.endFill();
        rect.alpha = 0.7;

        const uploadImg = game.add.image(WIDTH / 2, HEIGHT / 2, 'upload');
        uploadImg.anchor.setTo(0.5);
        fadeIn(uploadImg);

        let tempTimer = setTimeout(() => {
            showCloud(() => {
                game.state.start('RandomFigure');
                hideCloud();
            });
        }, 3000);
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
            if (btn.x - BTN_CENTER.x > 30 || btn.x - BTN_CENTER.x < -30) {
                needle.body.angularVelocity = btn.x - BTN_CENTER.x;
            }
            game.physics.arcade.velocityFromAngle(needle.angle - 90, RATE_EACH_FRAME, needle.body.velocity);
            updateLine(needle.centerX, needle.y);
            updateCropRope();
        }
    }

    let circleSprite;

    function initLine() {
        bmd = game.add.bitmapData(WIDTH, HEIGHT);
        bmd.addToWorld();
        game.add.image(0, 0, bmd);

        circleSprite = game.make.bitmapData(5, 5)
        circleSprite.context.fillStyle = '#ff0000';
        circleSprite.context.fillRect(0, 0, 5, 5);
    }

    function updateLine(x, y) {
        bmd.draw(circleSprite, x - 2.5, y);
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
