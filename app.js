const fs = require('fs')
const express = require('express')
const config = require('config')
const mongoose = require('mongoose')

const Throttle = require('throttle');
const filePath = './music/music.mp3'
const filePath1 = './music/music1.mp3'
const readable = fs.createReadStream(filePath)
const EventEmitter = require('events');

const ms = require('mediaserver');
const Utils = require("./utils");
const { PassThrough } = require('stream');

const PORT = config.get('port') || 5000

const app = express()
app.use(express.json({extended: true}))
app.use('/api/auth', require('./routes/auth.routes'))

const sinks = new Map()


 const broadcastToEverySink=(chunk)=> {
    for (const [, sink] of sinks) {
        sink.write(chunk);
    }
}
const stream = new EventEmitter();

class Queue {

    constructor(params) {
        this._sinks = new Map(); // map of active sinks/writables
        this._songs = []; // list of queued up songs
        this._currentSong = null;
        this.stream = new EventEmitter();
    }

    init() {
        this._currentSong = Utils.readSong();
        this._songs = Utils.readSongs()
        // this._songs = Utils.readSongs()
    }

    makeResponseSink() {
        const id = Utils.generateRandomId();
        const responseSink = new PassThrough();
        this._sinks.set(id, responseSink);
        return { id, responseSink };
    }

    removeResponseSink(id) {
        this._sinks.delete(id);
    }

    _broadcastToEverySink(chunk) {
        for (const [, sink] of this._sinks) {
            sink.write(chunk);
        }
    }

    _getBitRate(song) {
        try {
            const bitRate = ffprobeSync(Path.join(process.cwd(), song)).format.bit_rate;
            return parseInt(bitRate);
        }
        catch (err) {
            return 128000; // reasonable default
        }
    }

    _playLoop(res) {

        this._currentSong = this._songs.length
            ? this.removeFromQueue({ fromTop: true })
            : this._currentSong;
        const bitRate = this._getBitRate(this._currentSong);

        const songReadable = fs.createReadStream(this._currentSong);

        const throttleTransformable = new Throttle(bitRate);
        throttleTransformable.on('data', (chunk) => this._broadcastToEverySink(chunk));
        throttleTransformable.on('end', () => this._playLoop(res));

        this.stream.emit('play', this._currentSong);
        songReadable.pipe(throttleTransformable)
            // .pipe(res);
    }

    startStreaming(res) {
        this._playLoop(res);
    }


    _boxChildrenIndexToSongsIndex(index) {
        // converts index of this.box.children array (view layer)
        // to the index of this._songs array (stream layer)
        return index - 1;
    }

    _createAndAppendToSongs(song) {
        this._songs.push(song);
    }

    _createAndAppendToBoxChildren(song) {
        this.createBoxChildAndAppend(song);
    }

    createAndAppendToQueue(song) {
        this._createAndAppendToBoxChildren(song);
        this._createAndAppendToSongs(song);
    }

    _removeFromSongs(index) {
        const adjustedIndex = this._boxChildrenIndexToSongsIndex(index);
        return this._songs.splice(adjustedIndex, 1);
    }

    _discardFromBox(index) {
        this.box.remove(this.box.children[index]);
    }

    _orderBoxChildren() {
        this.box.children.forEach((child, index) => {

            if (index !== 0) {
                child.top = index - 1;
                child.content = `${index}. ${Utils.discardFirstWord(child.content)}`;
            }
        });
    }

    // _removeFromBoxChildren(index) {
    //
    //     const child = this.box.children[index];
    //     const content = child && child.content;
    //
    //     if (!content) {
    //         return {};
    //     }
    //
    //     this._discardFromBox(index);
    //     this._orderBoxChildren();
    //     this._focusIndexer.decr();
    // }

    removeFromQueue({ fromTop } = {}) {

        const index = fromTop ? 1 : this._focusIndexer.get();

        // this._removeFromBoxChildren(index);
        const [song] = this._removeFromSongs(index);
        return song;
    }

    _changeOrderInSongs(boxChildrenIndex1, boxChildrenIndex2) {

        const songsArrayIndex1 = this._boxChildrenIndexToSongsIndex(boxChildrenIndex1);
        const songaArrayIndex2 = this._boxChildrenIndexToSongsIndex(boxChildrenIndex2);
        [
            this._songs[songsArrayIndex1], this._songs[songaArrayIndex2]
        ] = [
            this._songs[songaArrayIndex2], this._songs[songsArrayIndex1]
        ];
    }

    _changeOrderInBoxChildren(key) {

        const index1 = this._focusIndexer.get();
        const child1 = this.box.children[index1];
        child1.style.bg = this._bgBlur;

        if (key === keys.MOVE_UP) {
            this._focusIndexer.decr();
        }
        else if (key === keys.MOVE_DOWN) {
            this._focusIndexer.incr();
        }

        const index2 = this._focusIndexer.get();
        const child2 = this.box.children[index2];
        child2.style.bg = this._bgFocus;

        [
            child1.content,
            child2.content
        ] = [
            `${Utils.getFirstWord(child1.content)} ${Utils.discardFirstWord(child2.content)}`,
            `${Utils.getFirstWord(child2.content)} ${Utils.discardFirstWord(child1.content)}`,
        ];

        return { index1, index2 };
    }

    changeOrderQueue(key) {

        if (this.box.children.length === 1) {
            return;
        }
        const { index1, index2 } = this._changeOrderInBoxChildren(key);
        this._changeOrderInSongs(index1, index2);
    }
}

const playLoop=()=> {
    const currentSong = filePath
    // ? this.removeFromQueue({ fromTop: true })
    // : this._currentSong;
    const bitRate = 128000 ;

    const songReadable = fs.createReadStream(currentSong);

    const throttleTransformable = new Throttle(bitRate );
    throttleTransformable.on('data', (chunk) => broadcastToEverySink(chunk));
    throttleTransformable.on('end', () => playLoop().pipe(res));

    stream.emit('play', filePath);
    return songReadable.pipe(throttleTransformable);
}
app.get('/stream', (req, res) => {

    // res.writeHead(200, {
    //     'Content-Type': 'audio/mpeg',
    //     // 'Content-Length': stat.size
    //     'Connection':'keep-alive'
    // });
    // const {id, responseSink} = queue.makeResponseSink();
    // req.app.sinkId = id;
    // console.log(responseSink)

    // const throttle = new Throttle(128000 / 8);
    // const writables = ['./music/music.mp3', './music/music1.mp3'];

    // readable.pipe(res).on('data', (chunk) => {
    //         for (const writable of writables) {
    //             writable.write(chunk);
    //         }
    //     }
    // );
    const queue = new Queue()
    queue.init()
    queue.startStreaming(res);
    console.log(queue._songs)
    console.log(queue._currentSong)
    console.log(queue._sinks)
    console.log('Read Song',Utils.readSong())
    console.log('Read Songs',Utils.readSongs())
    // let a = fs.createReadStream(filePath)
    // a.pipe(res)
    // res.on('finish',()=>{
    //     console.log('finish')
    // })
    //

    const { id, responseSink } = queue.makeResponseSink();
    req.app.sinkId = id;
    // response(responseSink).type('audio/mpeg');
    res.setHeader('content-type', 'audio/mpeg');
    console.log('headers',res.getHeader('content-type'))
    res.send(responseSink)
    // responseSink.pipe(res)
    // ms.pipe(req, res, filePath1);
    // playLoop().pipe(res)

})

async function start() {
    try {
        await mongoose.connect(config.get('mongoUrl'), {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true
        })
        // Engine.start();
        app.listen(PORT, () => console.log(`App has been started on port ${PORT}...`))
    } catch (e) {
        console.log('Server Error', e.message)
        process.exit(1)
    }
}

start()