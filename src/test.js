import './lib/index.scss';
import 'pixi';
import 'p2';
import Phaser from 'phaser'

process.env.NODE_ENV !== 'production' && require('./index.html');

const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;

let game = new Phaser.Game(WIDTH, HEIGHT, Phaser.CANVAS, 'app', {
    preload,
    create,
    update,
    render,
});
let player;
let alpha = 0;
let beta = 0;
// let oldAlpha = null;
// let oldBeta = null;
// let gamma = 0, oldGamma = null;
let bmd;
let start;

let updateCb = function(){};

const originPos = [WIDTH / 2, HEIGHT];
// const a = document.getElementById('alpha'),
//     b = document.getElementById('beta'),
//     g = document.getElementById('gamma'),
//     direction = document.getElementById('direction');

function preload() {
    game.load.image('bg', require('./img/bg.jpg'));
    game.load.image('needle', require('./img/needle.png'));
    game.load.image('start', require('./img/start.png'));
    // game.load.image('line', require('./img/line.png'));
}

function create() {
    game.add.image(0, 0, 'bg');
    init();
    initLine();
    initPlayer();

    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', function (event) {
            alpha = event.alpha;
            // 以45度为稳定方向
            beta = event.beta - 45;
            // gamma = event.gamma;
            // a.innerHTML = Math.round(alpha);
            // b.innerHTML = Math.round(beta);
            // g.innerHTML = Math.round(gamma);
        }, false);
    } else {
        console.log('你的浏览器不支持陀螺仪');
    }
}

function init() {
    start = game.add.image(WIDTH, 0, 'start');
    start.scale.setTo(0.5);
    start.anchor.setTo(1, 0);
    start.inputEnabled = true;
    start.events.onInputDown.addOnce(function() {
        start.destroy();
        updateCb = startGame;
    });
}

function startGame() {
    player.inputEnabled = false;
    updateCb = function() {
        player.body.velocity.x = 0;
        player.body.velocity.y = 0;
        player.body.angularVelocity = 0;
        if (alpha > 15 && alpha < 180) {
            // left
            player.body.angularVelocity = -100;
        } else if (alpha > 180 && alpha < 345) {
            // right
            player.body.angularVelocity = 100;
        }
        game.physics.arcade.velocityFromAngle(player.angle + 90, beta, player.body.velocity);
        updateLine(player.x, player.y, player.angle + 90);
    }
}

function update() {
    updateCb();
}

function render() {
    game.debug.spriteInfo(player, 32, 32);
}

function initLine() {
    // line = game.make.sprite(0, 0, 'line');
    // line.anchor.setTo(0.5, 0);
    // line.scale.setTo(0.2);
    bmd = game.add.bitmapData(WIDTH, HEIGHT);
    bmd.context.fillStyle = '#ff0000';
    bmd.context.globalCompositeOperation = 'source-over';
    bmd.dirty = true;
    game.add.sprite(0, 0, bmd);
}

function updateLine(x, y, angle) {
    // line.rotation = angle;
    // bmd.draw(line, x, y);
    bmd.context.fillRect(x, y, 2, 2);
}

function initPlayer() {
    game.physics.startSystem(Phaser.Physics.ARCADE);

    player = game.add.sprite(...originPos, 'needle');
    game.physics.enable(player, Phaser.Physics.ARCADE);
    player.scale.setTo(0.5);
    player.anchor.setTo(0.5, 1);
    player.body.collideWorldBounds = true;
    player.inputEnabled = true;
    player.input.enableDrag();

    // for test
    // player.body.velocity.x = 200;
    // player.body.velocity.y = 400;
    // player.body.bounce.setTo(0.9, 0.9);
}